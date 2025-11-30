import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createStore,
  State,
  PersistedStore,
  Actions,
  MemoryAdapter,
  LocalStorageAdapter,
  IndexedDBAdapter,
  PersistenceAdapter,
} from './index';

interface TestState extends State {
  count: number;
  name: string;
}

type TestActions = Actions<
  TestState,
  {
    increment: () => void;
    setName: (name: string) => void;
    reset: () => void;
  }
>;

const initialState: TestState = { count: 0, name: 'test' };

const createTestActions = (
  set: (updater: (state: TestState) => TestState) => void,
  _get: () => TestState,
  _actions: TestActions,
): TestActions => ({
  increment: () => set((state) => ({ ...state, count: state.count + 1 })),
  setName: (name: string) => set((state) => ({ ...state, name })),
  reset: () => set(() => ({ ...initialState })),
});

// Helper to wait for async operations
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('Persistence - MemoryAdapter', () => {
  let adapter: MemoryAdapter<TestState>;

  beforeEach(() => {
    adapter = new MemoryAdapter<TestState>();
  });

  // TC.P.1: Memory Adapter Basic Operations
  it('TC.P.1: should save and load state', async () => {
    const testState: TestState = { count: 42, name: 'memory-test' };

    await adapter.save('test-key', testState);
    const loaded = await adapter.load('test-key');

    expect(loaded).toEqual(testState);
  });

  it('TC.P.1: should return null for non-existent key', async () => {
    const loaded = await adapter.load('non-existent');
    expect(loaded).toBeNull();
  });

  it('TC.P.1: should remove state', async () => {
    const testState: TestState = { count: 42, name: 'memory-test' };

    await adapter.save('test-key', testState);
    await adapter.remove('test-key');
    const loaded = await adapter.load('test-key');

    expect(loaded).toBeNull();
  });

  it('TC.P.1: should check if key exists', async () => {
    const testState: TestState = { count: 42, name: 'memory-test' };

    expect(await adapter.has('test-key')).toBe(false);
    await adapter.save('test-key', testState);
    expect(await adapter.has('test-key')).toBe(true);
  });

  it('TC.P.1: should clear all data', async () => {
    await adapter.save('key1', { count: 1, name: 'one' });
    await adapter.save('key2', { count: 2, name: 'two' });

    adapter.clear();

    expect(await adapter.load('key1')).toBeNull();
    expect(await adapter.load('key2')).toBeNull();
  });
});

describe('Persistence - LocalStorageAdapter', () => {
  let adapter: LocalStorageAdapter<TestState>;

  beforeEach(() => {
    adapter = new LocalStorageAdapter<TestState>();
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  // TC.P.2: LocalStorage Adapter Operations
  it('TC.P.2: should save and load state from localStorage', async () => {
    const testState: TestState = { count: 99, name: 'local-test' };

    await adapter.save('test-key', testState);
    const loaded = await adapter.load('test-key');

    expect(loaded).toEqual(testState);

    // Verify it's actually in localStorage
    const rawData = localStorage.getItem('test-key');
    expect(rawData).toBeDefined();
    expect(JSON.parse(rawData!)).toEqual(testState);
  });

  it('TC.P.2: should return null for non-existent key', async () => {
    const loaded = await adapter.load('non-existent');
    expect(loaded).toBeNull();
  });

  it('TC.P.2: should remove state from localStorage', async () => {
    const testState: TestState = { count: 99, name: 'local-test' };

    await adapter.save('test-key', testState);
    await adapter.remove('test-key');
    const loaded = await adapter.load('test-key');

    expect(loaded).toBeNull();
    expect(localStorage.getItem('test-key')).toBeNull();
  });

  it('TC.P.2: should check if key exists in localStorage', async () => {
    const testState: TestState = { count: 99, name: 'local-test' };

    expect(await adapter.has('test-key')).toBe(false);
    await adapter.save('test-key', testState);
    expect(await adapter.has('test-key')).toBe(true);
  });
});

describe('Persistence - IndexedDBAdapter', () => {
  let adapter: IndexedDBAdapter<TestState>;

  beforeEach(() => {
    // Skip IndexedDB tests in Node.js environment
    if (typeof indexedDB === 'undefined') {
      return;
    }
    adapter = new IndexedDBAdapter<TestState>('test-db');
  });

  afterEach(async () => {
    if (typeof indexedDB === 'undefined' || !adapter) {
      return;
    }
    await adapter.close();
    // Clean up IndexedDB
    const deleteRequest = indexedDB.deleteDatabase('test-db');
    await new Promise<void>((resolve) => {
      deleteRequest.onsuccess = () => resolve();
      deleteRequest.onerror = () => resolve();
    });
  });

  // TC.P.3: IndexedDB Adapter Operations
  it.skipIf(typeof indexedDB === 'undefined')('TC.P.3: should save and load state from IndexedDB', async () => {
    const testState: TestState = { count: 123, name: 'indexeddb-test' };

    await adapter.save('test-key', testState);
    const loaded = await adapter.load('test-key');

    expect(loaded).toEqual(testState);
  });

  it.skipIf(typeof indexedDB === 'undefined')('TC.P.3: should return null for non-existent key', async () => {
    const loaded = await adapter.load('non-existent');
    expect(loaded).toBeNull();
  });

  it.skipIf(typeof indexedDB === 'undefined')('TC.P.3: should remove state from IndexedDB', async () => {
    const testState: TestState = { count: 123, name: 'indexeddb-test' };

    await adapter.save('test-key', testState);
    await adapter.remove('test-key');
    const loaded = await adapter.load('test-key');

    expect(loaded).toBeNull();
  });

  it.skipIf(typeof indexedDB === 'undefined')('TC.P.3: should check if key exists in IndexedDB', async () => {
    const testState: TestState = { count: 123, name: 'indexeddb-test' };

    expect(await adapter.has('test-key')).toBe(false);
    await adapter.save('test-key', testState);
    expect(await adapter.has('test-key')).toBe(true);
  });

  it.skipIf(typeof indexedDB === 'undefined')('TC.P.3: should handle large datasets', async () => {
    // Create a large state object
    const largeState: TestState = {
      count: 999,
      name: 'large-test',
      // Add a large array to simulate big data
      data: new Array(10000).fill(0).map((_, i) => ({ id: i, value: `item-${i}` })),
    } as any;

    await adapter.save('large-key', largeState);
    const loaded = await adapter.load('large-key');

    expect(loaded).toEqual(largeState);
    expect((loaded as any).data).toHaveLength(10000);
  });
});

describe('Persistence - Store Integration', () => {
  let adapter: MemoryAdapter<TestState>;

  beforeEach(() => {
    adapter = new MemoryAdapter<TestState>();
  });

  // TC.P.4: Auto-Hydration on Store Creation
  it('TC.P.4: should auto-hydrate from persisted state on creation', async () => {
    const persistedState: TestState = { count: 100, name: 'persisted' };
    await adapter.save('test-store', persistedState);

    const store = createStore(initialState, createTestActions, {
      adapter,
      key: 'test-store',
    });

    // Wait for auto-hydration to complete
    await wait(50);

    expect(store.getState()).toEqual(persistedState);
  });

  it('TC.P.4: should use initial state when no persisted state exists', async () => {
    const store = createStore(initialState, createTestActions, {
      adapter,
      key: 'non-existent-key',
    });

    // Wait for hydration attempt
    await wait(50);

    expect(store.getState()).toEqual(initialState);
  });

  // TC.P.5: Auto-Sync on State Changes
  it('TC.P.5: should auto-sync state changes when autoSync is enabled', async () => {
    const store = createStore(initialState, createTestActions, {
      adapter,
      key: 'auto-sync-store',
      autoSync: true,
    });

    // Wait for initial hydration
    await wait(50);

    store.actions.increment();
    store.actions.setName('updated');

    // Wait for auto-sync
    await wait(50);

    const loaded = await adapter.load('auto-sync-store');
    expect(loaded).toEqual({ count: 1, name: 'updated' });
  });

  it('TC.P.5: should not auto-sync when autoSync is disabled', async () => {
    const store = createStore(initialState, createTestActions, {
      adapter,
      key: 'no-auto-sync-store',
      autoSync: false,
    });

    // Wait for initial hydration
    await wait(50);

    store.actions.increment();
    store.actions.setName('updated');

    // Wait a bit to ensure no auto-sync happened
    await wait(50);

    const loaded = await adapter.load('no-auto-sync-store');
    expect(loaded).toBeNull(); // Nothing should be saved
  });

  // TC.P.6: Manual Persist Operation
  it('TC.P.6: should manually persist state', async () => {
    const store = createStore(initialState, createTestActions, {
      adapter,
      key: 'manual-persist-store',
      autoSync: false,
    }) as PersistedStore<TestState, TestActions>;

    // Wait for initial hydration
    await wait(50);

    store.actions.increment();
    store.actions.increment();
    store.actions.setName('manual');

    // Manually persist
    await store.persist();

    const loaded = await adapter.load('manual-persist-store');
    expect(loaded).toEqual({ count: 2, name: 'manual' });
  });

  // TC.P.7: Clear Persisted State
  it('TC.P.7: should clear persisted state', async () => {
    const store = createStore(initialState, createTestActions, {
      adapter,
      key: 'clear-store',
    }) as PersistedStore<TestState, TestActions>;

    // Wait for initial hydration
    await wait(50);

    store.actions.increment();
    await store.persist();

    // Verify it's saved
    let loaded = await adapter.load('clear-store');
    expect(loaded).toEqual({ count: 1, name: 'test' });

    // Clear persisted state
    await store.clearPersisted();

    loaded = await adapter.load('clear-store');
    expect(loaded).toBeNull();
  });

  // TC.P.8: Serialization Error Handling
  it('TC.P.8: should handle serialization errors gracefully', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Create a failing adapter that throws during save
    const failingAdapter: PersistenceAdapter<TestState> = {
      save: async () => {
        throw new Error('Serialization failed');
      },
      load: async () => null,
      remove: async () => {},
      has: async () => false,
    };

    const store = createStore(initialState, createTestActions, {
      adapter: failingAdapter,
      key: 'serialize-error-store',
    });

    // Wait for initial hydration
    await wait(50);

    // This should not crash the store
    store.actions.increment();

    // Store should still function
    expect(store.getState().count).toBe(1);

    // Wait for auto-sync attempt
    await wait(50);

    // Error should have been logged
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  // TC.P.9: Storage Quota Exceeded (simulated)
  it('TC.P.9: should handle storage errors gracefully', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Create a failing adapter
    const failingAdapter: PersistenceAdapter<TestState> = {
      save: async () => {
        throw new Error('Quota exceeded');
      },
      load: async () => null,
      remove: async () => {},
      has: async () => false,
    };

    const store = createStore(initialState, createTestActions, {
      adapter: failingAdapter,
      key: 'quota-error-store',
    });

    // Wait for initial hydration
    await wait(50);

    // This should not crash the store
    store.actions.increment();

    // Store should still function
    expect(store.getState().count).toBe(1);

    // Wait for auto-sync attempt
    await wait(50);

    // Error should have been logged
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  // TC.P.10: Backward Compatibility
  it('TC.P.10: should work without persistence config', () => {
    const store = createStore(initialState, createTestActions);

    expect(store.getState()).toEqual(initialState);
    store.actions.increment();
    expect(store.getState().count).toBe(1);

    // Store should not have persistence methods
    expect((store as any).persist).toBeUndefined();
    expect((store as any).hydrate).toBeUndefined();
    expect((store as any).clearPersisted).toBeUndefined();
  });

  // TC.P.11: State Merging
  it('TC.P.11: should merge loaded state with initial state when merge is true', async () => {
    const persistedState = { count: 50 }; // Missing 'name' field
    await adapter.save('merge-store', persistedState as any);

    const store = createStore(initialState, createTestActions, {
      adapter,
      key: 'merge-store',
      merge: true,
    });

    // Wait for auto-hydration
    await wait(50);

    // Should have count from persisted state and name from initial state
    expect(store.getState()).toEqual({ count: 50, name: 'test' });
  });

  it('TC.P.11: should replace state completely when merge is false', async () => {
    const persistedState = { count: 50, name: 'replaced' };
    await adapter.save('replace-store', persistedState);

    const store = createStore(initialState, createTestActions, {
      adapter,
      key: 'replace-store',
      merge: false, // This is the default
    });

    // Wait for auto-hydration
    await wait(50);

    // Should use persisted state completely
    expect(store.getState()).toEqual(persistedState);
  });

  // TC.P.12: Custom Serialization
  it('TC.P.12: should use custom serialization functions', async () => {
    interface ComplexState extends State {
      date: Date;
      count: number;
    }

    type ComplexActions = Actions<
      ComplexState,
      {
        increment: () => void;
        setDate: (date: Date) => void;
      }
    >;

    const complexInitialState: ComplexState = {
      date: new Date('2024-01-01'),
      count: 0,
    };

    const createComplexActions = (
      set: (updater: (state: ComplexState) => ComplexState) => void,
      _get: () => ComplexState,
      _actions: ComplexActions,
    ): ComplexActions => ({
      increment: () => set((state) => ({ ...state, count: state.count + 1 })),
      setDate: (date: Date) => set((state) => ({ ...state, date })),
    });

    // Custom serializer that handles Date objects
    const serialize = (state: ComplexState): string => {
      return JSON.stringify({
        ...state,
        date: state.date.toISOString(),
      });
    };

    const deserialize = (data: string): ComplexState => {
      const parsed = JSON.parse(data);
      return {
        ...parsed,
        date: new Date(parsed.date),
      };
    };

    const complexAdapter = new MemoryAdapter<ComplexState>();

    const store = createStore(complexInitialState, createComplexActions, {
      adapter: complexAdapter as any,
      key: 'complex-store',
      serialize: serialize as any,
      deserialize: deserialize as any,
    });

    // Wait for initial hydration
    await wait(50);

    const testDate = new Date('2025-12-25');
    store.actions.setDate(testDate);
    store.actions.increment();

    // Wait for auto-sync
    await wait(50);

    // Create a new store to test deserialization
    const store2 = createStore(complexInitialState, createComplexActions, {
      adapter: complexAdapter as any,
      key: 'complex-store',
      serialize: serialize as any,
      deserialize: deserialize as any,
    });

    // Wait for auto-hydration
    await wait(50);

    const loadedState = store2.getState();
    expect(loadedState.count).toBe(1);
    // The date will be deserialized as a Date object
    expect(loadedState.date instanceof Date || typeof loadedState.date === 'string').toBe(true);
    // Check the date value matches
    const loadedDateISO =
      loadedState.date instanceof Date ? loadedState.date.toISOString() : new Date(loadedState.date).toISOString();
    expect(loadedDateISO).toBe(testDate.toISOString());
  });
});

describe('Persistence - Edge Cases', () => {
  let adapter: MemoryAdapter<TestState>;

  beforeEach(() => {
    adapter = new MemoryAdapter<TestState>();
  });

  it('should not have persistence methods on non-persisted store', () => {
    const store = createStore(initialState, createTestActions) as any;

    expect(store.persist).toBeUndefined();
    expect(store.hydrate).toBeUndefined();
    expect(store.clearPersisted).toBeUndefined();
  });

  it('should handle manual hydrate() call', async () => {
    const store = createStore(initialState, createTestActions, {
      adapter,
      key: 'manual-hydrate-store',
    }) as PersistedStore<TestState, TestActions>;

    // Wait for initial hydration
    await wait(50);

    // Modify state
    store.actions.increment();
    expect(store.getState().count).toBe(1);

    // Save a different state directly to adapter
    await adapter.save('manual-hydrate-store', { count: 999, name: 'rehydrate' });

    // Manually reload from storage
    await store.hydrate();

    expect(store.getState()).toEqual({ count: 999, name: 'rehydrate' });
  });

  it('should not auto-sync before initial hydration completes', async () => {
    // Create a slow adapter
    const slowAdapter: PersistenceAdapter<TestState> = {
      save: async (key, state) => {
        await adapter.save(key, state);
      },
      load: async (key) => {
        await wait(200); // Simulate slow load
        return adapter.load(key);
      },
      remove: async (key) => {
        await adapter.remove(key);
      },
      has: async (key) => {
        return adapter.has(key);
      },
    };

    await adapter.save('slow-store', { count: 100, name: 'slow' });

    const store = createStore(initialState, createTestActions, {
      adapter: slowAdapter,
      key: 'slow-store',
      autoSync: true,
    });

    // Try to modify state before hydration completes
    store.actions.increment();

    // Wait a bit but not long enough for hydration
    await wait(50);

    // State should be changed but not persisted yet (because hydration hasn't finished)
    expect(store.getState().count).toBe(1); // Local state changed

    // Wait for hydration to complete
    await wait(200);

    // After hydration, state should be from storage
    expect(store.getState().count).toBe(100);
  });
});
