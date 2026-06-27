export type { State, Actions, Listener, Selector, Store } from './index';

export type { PersistenceAdapter, PersistenceConfig } from './persistence';
export { MemoryAdapter, LocalStorageAdapter, IndexedDBAdapter } from './persistence';

import type { State, Actions, Store } from './index';
import { createStore as _createStore } from './index';
import type { PersistenceConfig } from './persistence';

export interface PersistedStore<S extends State, Act extends Actions<S, Act>> extends Store<S, Act> {
  persist(): Promise<void>;
  hydrate(): Promise<void>;
  clearPersisted(): Promise<void>;
}

export function createStore<S extends State, A extends Actions<S, A>>(
  initialState: S,
  createActions: (set: (updater: (state: S) => S) => void, get: () => S, actions: A) => A,
): Store<S, A>;

export function createStore<S extends State, A extends Actions<S, A>>(
  initialState: S,
  createActions: (set: (updater: (state: S) => S) => void, get: () => S, actions: A) => A,
  persistence: PersistenceConfig<S>,
): PersistedStore<S, A>;

export function createStore<S extends State, A extends Actions<S, A>>(
  initialState: S,
  createActions: (set: (updater: (state: S) => S) => void, get: () => S, actions: A) => A,
  persistence?: PersistenceConfig<S>,
): Store<S, A> | PersistedStore<S, A> {
  const store = _createStore(initialState, createActions);

  if (!persistence) {
    return store;
  }

  const { adapter, key, autoSync = true, merge: shouldMerge = false } = persistence;
  let isHydrated = false;

  if (autoSync) {
    store.subscribe((newState) => {
      if (isHydrated) {
        adapter.save(key, newState).catch((error) => {
          console.error(`Store persistence failed for key "${key}":`, error);
        });
      }
    });
  }

  const hydrate = async (): Promise<void> => {
    isHydrated = false;
    try {
      const loaded = await adapter.load(key);
      if (loaded !== null) {
        store.setState(() => (shouldMerge ? { ...initialState, ...loaded } : loaded));
      }
    } catch (error) {
      console.error(`Failed to hydrate state for key "${key}":`, error);
      throw error;
    } finally {
      isHydrated = true;
    }
  };

  const persist = async (): Promise<void> => {
    try {
      await adapter.save(key, store.getState());
    } catch (error) {
      console.error(`Failed to persist state for key "${key}":`, error);
      throw error;
    }
  };

  const clearPersisted = async (): Promise<void> => {
    try {
      await adapter.remove(key);
    } catch (error) {
      console.error(`Failed to clear persisted state for key "${key}":`, error);
      throw error;
    }
  };

  hydrate().catch((error) => {
    console.error(`Auto-hydration failed for key "${key}":`, error);
  });

  return {
    ...store,
    persist,
    hydrate,
    clearPersisted,
  } as PersistedStore<S, A>;
}
