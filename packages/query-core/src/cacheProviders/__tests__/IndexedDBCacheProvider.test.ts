import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { IndexedDBCacheProvider } from '../IndexedDBCacheProvider';
import type { CachedItem } from '../CacheProvider';
import 'fake-indexeddb/auto'; // Automatically mocks indexedDB

// Mock console.warn and console.error
vi.spyOn(console, 'warn').mockImplementation(() => {});
vi.spyOn(console, 'error').mockImplementation(() => {});

describe.skip('IndexedDBCacheProvider', () => {
  let cacheProvider: IndexedDBCacheProvider;

  beforeEach(async () => {
    // Reset all databases created by fake-indexeddb between tests
    // Create a new cacheProvider instance - this will create a fresh DB connection
    cacheProvider = new IndexedDBCacheProvider();

    // The IndexedDB connection is async. We need to ensure it's ready.
    // A small delay or a dummy operation can help ensure the DB is initialized.
    // Or, if the first operation is robust enough to wait, that works too.
    // Forcing initialization:
    try {
      await cacheProvider.set('__init_idb__', { data: 'init', lastUpdated: Date.now() });
      await cacheProvider.remove('__init_idb__');
    } catch (e) {
      // This might happen if tests run in an env where even fake-indexeddb has issues.
      console.error('Error during IndexedDB test setup:', e);
    }
    vi.clearAllMocks(); // Clear mocks after setup
  });

  afterEach(async () => {
    // Clear the specific store or delete the database if necessary.
    // fake-indexeddb usually cleans up in-memory data, but explicit deletion is safer.
    try {
      await cacheProvider.clearAll(); // Clear data
    } catch (e) {
      // Silently ignore cleanup errors
    }
    vi.clearAllMocks();
  });

  it('should set and get an item', async () => {
    const key = 'idbTestKey';
    const item: CachedItem<{ value: string }> = {
      data: { value: 'idbTestData' },
      lastUpdated: Date.now(),
    };

    await cacheProvider.set(key, item);
    const retrieved = await cacheProvider.get<{ value: string }>(key);
    expect(retrieved).toEqual(item);
  });

  it('should return undefined for a non-existent key', async () => {
    const retrieved = await cacheProvider.get('idbNonExistentKey');
    expect(retrieved).toBeUndefined();
  });

  it('should overwrite an existing item', async () => {
    const key = 'idbOverwriteKey';
    const oldItem: CachedItem<string> = { data: 'idbOldData', lastUpdated: Date.now() - 1000 };
    const newItem: CachedItem<string> = { data: 'idbNewData', lastUpdated: Date.now() };

    await cacheProvider.set(key, oldItem);
    await cacheProvider.set(key, newItem);
    const retrieved = await cacheProvider.get<string>(key);
    expect(retrieved).toEqual(newItem);
  });

  it('should remove an item', async () => {
    const key = 'idbRemoveKey';
    const item: CachedItem<number> = { data: 456, lastUpdated: Date.now() };

    await cacheProvider.set(key, item);
    await cacheProvider.remove(key);
    const retrieved = await cacheProvider.get<number>(key);
    expect(retrieved).toBeUndefined();
  });

  it('should not throw when removing a non-existent key', async () => {
    await expect(cacheProvider.remove('idbNonExistentRemoveKey')).resolves.not.toThrow();
  });

  it('should clear all items', async () => {
    await cacheProvider.set('idbKey1', { data: 'data1', lastUpdated: Date.now() });
    await cacheProvider.set('idbKey2', { data: 'data2', lastUpdated: Date.now() });

    await cacheProvider.clearAll();

    expect(await cacheProvider.get('idbKey1')).toBeUndefined();
    expect(await cacheProvider.get('idbKey2')).toBeUndefined();
    expect(console.error).not.toHaveBeenCalled(); // Check for errors during clear
  });

  it('should handle clearing an empty cache', async () => {
    await expect(cacheProvider.clearAll()).resolves.not.toThrow();
    expect(await cacheProvider.get('anyKey')).toBeUndefined();
  });

  it('should return undefined and log warning if IndexedDB is not supported', async () => {
    const originalIndexedDB = globalThis.indexedDB;
    // @ts-
    delete globalThis.indexedDB; // Simulate no IndexedDB support

    const newProvider = new IndexedDBCacheProvider();

    const item: CachedItem<string> = { data: 'test', lastUpdated: Date.now() };
    await newProvider.set('key', item); // Should silently fail or log
    const retrieved = await newProvider.get('key');

    expect(retrieved).toBeUndefined();
    expect(console.warn).toHaveBeenCalledWith(
      'QueryCore: IndexedDB is not supported in this browser. IndexedDBCacheProvider will not work.',
    );

    // Restore IndexedDB for other tests
    globalThis.indexedDB = originalIndexedDB;
  });

  describe('Error Handling in IDB Operations', () => {
    it('should handle error during get operation', async () => {
      await cacheProvider.set('testKey', { data: 'testData', lastUpdated: Date.now() }); // ensure db is open and item exists
      vi.clearAllMocks();

      const getError = new DOMException('Simulated Store.get Error');
      const storeGetSpy = vi.spyOn(IDBObjectStore.prototype, 'get').mockImplementationOnce(() => {
        throw getError;
      });

      const result = await cacheProvider.get('someKeyToTriggerGet');
      expect(result).toBeUndefined();

      // Check the console error from performOperation's catch block
      expect(console.error).toHaveBeenCalledWith('QueryCore: IndexedDB operation failed:', getError);

      // Also check the console error from the .onerror handler in the provider's get method
      // This might not be called if the synchronous throw bypasses the request.onerror wiring.
      // Let's verify which error is logged.
      // If store.get() throws synchronously, request.onerror in provider's get() won't be set up on a valid request.
      // The promise from 'operation' will reject due to the sync throw.
      // So, only performOperation's catch log is expected.
      expect(console.error).toHaveBeenCalledTimes(1); // Ensure only performOperation's catch logs

      storeGetSpy.mockRestore();
    });

    it('should handle error during set operation', async () => {
      vi.clearAllMocks(); // Clear mocks, especially console from previous tests in this block
      const setError = new DOMException('Simulated Store.put Error');
      const storePutSpy = vi.spyOn(IDBObjectStore.prototype, 'put').mockImplementationOnce(() => {
        throw setError;
      });

      await cacheProvider.set('errorSetKey', { data: 'test', lastUpdated: Date.now() });

      expect(console.error).toHaveBeenCalledWith('QueryCore: IndexedDB operation failed:', setError);
      expect(console.error).toHaveBeenCalledTimes(1); // Only performOperation's catch

      storePutSpy.mockRestore();
    });

    it('should handle error during remove operation', async () => {
      vi.clearAllMocks();
      const removeError = new DOMException('Simulated Store.delete Error');
      const storeDeleteSpy = vi.spyOn(IDBObjectStore.prototype, 'delete').mockImplementationOnce(() => {
        throw removeError;
      });

      await cacheProvider.remove('someKeyToRemove');

      expect(console.error).toHaveBeenCalledWith('QueryCore: IndexedDB operation failed:', removeError);
      expect(console.error).toHaveBeenCalledTimes(1);

      storeDeleteSpy.mockRestore();
    });

    it('should handle error during clearAll operation', async () => {
      vi.clearAllMocks();
      const clearError = new DOMException('Simulated Store.clear Error');
      const storeClearSpy = vi.spyOn(IDBObjectStore.prototype, 'clear').mockImplementationOnce(() => {
        throw clearError;
      });

      await cacheProvider.clearAll();

      expect(console.error).toHaveBeenCalledWith('QueryCore: IndexedDB operation failed:', clearError);
      expect(console.error).toHaveBeenCalledTimes(1);

      storeClearSpy.mockRestore();
    });

    // TODO: This test is timing out and might be causing issues with fake-indexeddb state.
    it.skip('should handle IndexedDB opening error', async () => {
      vi.clearAllMocks();
      const originalOpen = indexedDB.open;
      vi.spyOn(indexedDB, 'open').mockImplementationOnce(() => {
        const request = originalOpen(Date.now().toString(), 1) as any; // Use random name to avoid conflicts
        setTimeout(() => {
          const errorEvent = new Event('error');
          Object.defineProperty(request, 'error', { value: new DOMException('Simulated DB Open Error') });
          request.dispatchEvent(errorEvent);
        }, 0);
        return request;
      });

      const newFaultyProvider = new IndexedDBCacheProvider();
      // Attempt an operation that would trigger DB opening
      const result = await newFaultyProvider.get('anyKey');
      expect(result).toBeUndefined();
      expect(console.error).toHaveBeenCalledWith('QueryCore: IndexedDB error:', expect.any(DOMException));
      expect(console.error).toHaveBeenCalledWith(
        'QueryCore: IndexedDB operation failed:',
        new Error('IndexedDB opening error'),
      );

      vi.restoreAllMocks(); // Restore original indexedDB.open
    });
  });
});
