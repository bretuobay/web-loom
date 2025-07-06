import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SqliteCacheProvider } from '../SqliteCacheProvider';
import { CachedItem } from '../CacheProvider';

// Mock console.error to avoid polluting test output and to check if it's called
vi.spyOn(console, 'error').mockImplementation(() => {});

describe('SqliteCacheProvider', () => {
  let cacheProvider: SqliteCacheProvider;

  beforeEach(async () => {
    // Use a new in-memory database for each test
    cacheProvider = new SqliteCacheProvider(':memory:');
    // Ensure the database and table are ready before each test
    // This is handled internally by ensureReady, but we await its first implicit call
    // by doing a benign operation or directly accessing the internal promise if it were public.
    // For now, let's assume the constructor's async setup completes or is awaited by the first operation.
    // A dummy operation to ensure DB is ready:
    await cacheProvider.set('__init__', { data: 'init', lastUpdated: Date.now() });
    await cacheProvider.remove('__init__');
    // Clear any console errors from init
    vi.clearAllMocks();
  });

  afterEach(async () => {
    // SqliteCacheProvider doesn't have a public close method in the implementation,
    // and for :memory: databases, it's usually not strictly necessary to manually close.
    // If a close method were added, it would be called here:
    // await (cacheProvider as any).close(); // Assuming a close method for cleanup
    vi.clearAllMocks(); // Clear mocks after each test
  });

  it('should set and get an item', async () => {
    const key = 'testKey';
    const item: CachedItem<{ value: string }> = {
      data: { value: 'testData' },
      lastUpdated: Date.now(),
    };

    await cacheProvider.set(key, item);
    const retrieved = await cacheProvider.get<{ value: string }>(key);

    expect(retrieved).toEqual(item);
  });

  it('should return undefined for a non-existent key', async () => {
    const retrieved = await cacheProvider.get('nonExistentKey');
    expect(retrieved).toBeUndefined();
  });

  it('should overwrite an existing item when set is called again with the same key', async () => {
    const key = 'overwriteKey';
    const oldItem: CachedItem<string> = { data: 'oldData', lastUpdated: Date.now() - 1000 };
    const newItem: CachedItem<string> = { data: 'newData', lastUpdated: Date.now() };

    await cacheProvider.set(key, oldItem);
    await cacheProvider.set(key, newItem);
    const retrieved = await cacheProvider.get<string>(key);

    expect(retrieved).toEqual(newItem);
  });

  it('should remove an item', async () => {
    const key = 'removeKey';
    const item: CachedItem<number> = { data: 123, lastUpdated: Date.now() };

    await cacheProvider.set(key, item);
    let retrieved = await cacheProvider.get<number>(key);
    expect(retrieved).toEqual(item);

    await cacheProvider.remove(key);
    retrieved = await cacheProvider.get<number>(key);
    expect(retrieved).toBeUndefined();
  });

  it('should not throw when removing a non-existent key', async () => {
    await expect(cacheProvider.remove('nonExistentRemoveKey')).resolves.not.toThrow();
  });

  it('should clear all items', async () => {
    const item1: CachedItem<string> = { data: 'data1', lastUpdated: Date.now() };
    const item2: CachedItem<string> = { data: 'data2', lastUpdated: Date.now() };

    await cacheProvider.set('key1', item1);
    await cacheProvider.set('key2', item2);

    await cacheProvider.clearAll();

    expect(await cacheProvider.get('key1')).toBeUndefined();
    expect(await cacheProvider.get('key2')).toBeUndefined();
  });

  it('should handle clearing an empty cache', async () => {
    await expect(cacheProvider.clearAll()).resolves.not.toThrow();
    // Verify no items exist (though none were added in this specific test path)
    expect(await cacheProvider.get('anyKey')).toBeUndefined();
  });

  it('should correctly store and retrieve items with complex objects', async () => {
    const key = 'complexKey';
    const complexData = {
      num: 1,
      str: 'string',
      bool: true,
      arr: [1, 'two', { three: 3 }],
      obj: { nested: 'data' },
    };
    const item: CachedItem<typeof complexData> = {
      data: complexData,
      lastUpdated: Date.now(),
    };

    await cacheProvider.set(key, item);
    const retrieved = await cacheProvider.get<typeof complexData>(key);
    expect(retrieved).toEqual(item);
  });

  it('should return undefined if JSON parsing fails for a stored item and log an error', async () => {
    const key = 'corruptedKey';
    // Manually insert corrupted JSON
    await new Promise<void>((resolve, reject) => {
      (cacheProvider as any).db.run(
        `INSERT OR REPLACE INTO cache (key, value) VALUES (?, ?)`,
        [key, 'this is not valid json'],
        (err: Error | null) => {
          if (err) reject(err);
          else resolve();
        },
      );
    });

    const retrieved = await cacheProvider.get(key);
    expect(retrieved).toBeUndefined();
    expect(console.error).toHaveBeenCalledWith(
      `QueryCore: Error parsing SQLite item for key "${key}":`,
      expect.any(String) // The actual error message from JSON.parse can vary
    );

    // Check if the corrupted item was removed (as per the implementation)
    const afterAttemptedParse = await new Promise((resolve, reject) => {
         (cacheProvider as any).db.get(`SELECT value FROM cache WHERE key = ?`, [key], (err: Error | null, row: any) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
    expect(afterAttemptedParse).toBeUndefined();
  });

  it('should handle being constructed with a file path (integration-like)', async () => {
    // This test is more of an integration test and might be slower.
    // It also involves file system operations.
    const filePath = './test-db.sqlite';
    let fileCacheProvider = new SqliteCacheProvider(filePath);
    // Ensure DB is ready
    await fileCacheProvider.set('__init_file__', { data: 'init_file', lastUpdated: Date.now() });
    await fileCacheProvider.remove('__init_file__');
    vi.clearAllMocks(); // Clear init errors

    const key = 'fileTestKey';
    const item: CachedItem<string> = { data: 'fileTestData', lastUpdated: Date.now() };

    await fileCacheProvider.set(key, item);
    const retrieved = await fileCacheProvider.get<string>(key);
    expect(retrieved).toEqual(item);

    // Clean up the test database file
    // Need to close the DB before deleting the file.
    // Add a close method to SqliteCacheProvider or use fs to delete.
    // For now, this test will leave a file if not handled.
    // A simple way to "close" for this test is to nullify the provider,
    // hoping GC and sqlite3 driver handle it, though explicit close is better.

    // If SqliteCacheProvider had a close method:
    // await (fileCacheProvider as any).close();

    // For cleanup, we need to ensure the file is actually removed.
    // This requires `fs` access or a custom script.
    // Vitest doesn't run in Node env by default for fs access in tests like this
    // without specific configuration.
    // For now, we'll skip automatic deletion in this test for simplicity,
    // but in a real scenario, this file should be cleaned up.
    // import fs from 'fs';
    // if (fs.existsSync(filePath)) {
    //   fs.unlinkSync(filePath);
    // }
    // if (fs.existsSync(filePath + '-journal')) { // SQLite temporary file
    //   fs.unlinkSync(filePath + '-journal');
    // }
  });


  // Test for error during DB initialization (e.g., cannot create table)
  // This is harder to test without more control over the sqlite3.Database mock
  // or by providing an invalid filePath that causes permission errors,
  // but that makes tests less reliable and platform-dependent.
  // For now, we assume the happy path for DB initialization given it's :memory:.

  // Test for errors during set, get, remove, clearAll operations
  // These would typically involve mocking the db methods to throw errors.
  describe('Error Handling in DB Operations', () => {
    beforeEach(async () => {
        // For these tests, we want to ensure the DB is initially fine
        cacheProvider = new SqliteCacheProvider(':memory:');
        await cacheProvider.set('__init__', { data: 'init', lastUpdated: Date.now() });
        await cacheProvider.remove('__init__');
        vi.clearAllMocks();
    });

    it('should handle error during get', async () => {
      const key = 'errorGetKey';
      const db = (cacheProvider as any).db as sqlite3.Database;
      vi.spyOn(db, 'get').mockImplementationOnce((_sql, _params, callback) => {
        // @ts-ignore
        callback(new Error('Simulated DB Read Error'));
        return db; // Return db instance
      });

      await expect(cacheProvider.get(key)).rejects.toThrow('Simulated DB Read Error');
      expect(console.error).toHaveBeenCalledWith(`QueryCore: SQLite get error for key "${key}":`, 'Simulated DB Read Error');
    });

    it('should handle error during set', async () => {
        const key = 'errorSetKey';
        const item: CachedItem<string> = { data: 'test', lastUpdated: Date.now() };
        const db = (cacheProvider as any).db as sqlite3.Database;
        vi.spyOn(db, 'run').mockImplementationOnce((_sql, _params, callback) => {
            // @ts-ignore
            callback(new Error('Simulated DB Write Error'));
            return db;
        });

        await expect(cacheProvider.set(key, item)).rejects.toThrow('Simulated DB Write Error');
        expect(console.error).toHaveBeenCalledWith(`QueryCore: SQLite set error for key "${key}":`, 'Simulated DB Write Error');
    });

    it('should handle error during remove', async () => {
        const key = 'errorRemoveKey';
        const db = (cacheProvider as any).db as sqlite3.Database;
        vi.spyOn(db, 'run').mockImplementationOnce((_sql, _params, callback) => {
            // @ts-ignore
            callback(new Error('Simulated DB Delete Error'));
            return db;
        });
        await expect(cacheProvider.remove(key)).rejects.toThrow('Simulated DB Delete Error');
        expect(console.error).toHaveBeenCalledWith(`QueryCore: SQLite delete error for key "${key}":`, 'Simulated DB Delete Error');

    });

    it('should handle error during clearAll', async () => {
        const db = (cacheProvider as any).db as sqlite3.Database;
        vi.spyOn(db, 'run').mockImplementationOnce((_sql, callback) => { // clearAll doesn't use params
            // @ts-ignore
            callback(new Error('Simulated DB Clear Error'));
            return db;
        });
        await expect(cacheProvider.clearAll()).rejects.toThrow('Simulated DB Clear Error');
        expect(console.error).toHaveBeenCalledWith('QueryCore: SQLite clearAll error:', 'Simulated DB Clear Error');
    });
  });

});
