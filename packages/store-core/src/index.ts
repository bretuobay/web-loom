// types.ts
import type { PersistenceConfig } from './persistence';

// Re-export persistence types and adapters
export type { PersistenceAdapter, PersistenceConfig } from './persistence';
export { MemoryAdapter, LocalStorageAdapter, IndexedDBAdapter } from './persistence';

/**
 * Represents the base type for any state object.
 */
export type State = Record<string, any>;

/**
 * Represents a listener function that is called when the state changes.
 * @param newState The new state after the change.
 * @param oldState The state before the change.
 */
export type Listener<S extends State> = (newState: S, oldState: S) => void;

// Removed Action type as it was causing a linting error for an unused generic 'S'.
// The functionality and typing of actions are handled by the `Actions` utility type
// and the `createActions` function signature within `createStore`.
// The PRD's `Action` type definition was simpler and did not include payload generics,
// which are managed by `Actions<S, A>`.

/**
 * Represents the structure for defining actions within the store.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type Actions<_S, A> = {
  [K in keyof A]: A[K] extends (...args: infer P) => void ? (...args: P) => void : never;
};

/**
 * Represents a selector function that derives data from the state.
 * @param state The current state.
 * @returns The derived data.
 */
export type Selector<S extends State, T> = (state: S) => T;

/**
 * The core Store interface.
 * @template S The type of the state.
 * @template A The type of the actions.
 */
export interface Store<S extends State, Act extends Actions<S, Act>> {
  /**
   * Retrieves the current state of the store.
   * @returns The current state.
   */
  getState(): S;

  /**
   * Updates the state using an updater function. This method is primarily for internal use by actions.
   * Direct external calls should be discouraged in favor of actions.
   * @param updater A function that receives the current state and returns the new state.
   */
  setState(updater: (state: S) => S): void;

  /**
   * Subscribes a listener function to state changes.
   * @param listener The function to be called when the state changes.
   * @returns A function to unsubscribe the listener.
   */
  subscribe(listener: Listener<S>): () => void;

  /**
   * Destroys the store, clearing all listeners and internal references.
   * Useful for garbage collection in long-lived applications.
   */
  destroy(): void;

  /**
   * The actions defined for the store, callable by consumers.
   */
  actions: Act;
}

/**
 * Extended Store interface with persistence methods.
 * @template S The type of the state.
 * @template A The type of the actions.
 */
export interface PersistedStore<S extends State, Act extends Actions<S, Act>> extends Store<S, Act> {
  /**
   * Manually persist the current state to storage.
   */
  persist(): Promise<void>;

  /**
   * Manually load state from storage and update the store.
   */
  hydrate(): Promise<void>;

  /**
   * Clear persisted state from storage.
   */
  clearPersisted(): Promise<void>;
}

/**
 * The function to create a new store without persistence.
 * @template S The type of the initial state.
 * @template A The type of the actions.
 * @param initialState The initial state for the store.
 * @param createActions A function that receives `set`, `get`, and the `actions` object, and returns the defined actions.
 * @returns A new Store instance.
 */
export function createStore<S extends State, A extends Actions<S, A>>(
  initialState: S,
  createActions: (set: (updater: (state: S) => S) => void, get: () => S, actions: A) => A,
): Store<S, A>;

/**
 * The function to create a new store with persistence.
 * @template S The type of the initial state.
 * @template A The type of the actions.
 * @param initialState The initial state for the store.
 * @param createActions A function that receives `set`, `get`, and the `actions` object, and returns the defined actions.
 * @param persistence Optional persistence configuration.
 * @returns A new PersistedStore instance.
 */
export function createStore<S extends State, A extends Actions<S, A>>(
  initialState: S,
  createActions: (set: (updater: (state: S) => S) => void, get: () => S, actions: A) => A,
  persistence: PersistenceConfig<S>,
): PersistedStore<S, A>;

/**
 * The function to create a new store (implementation).
 * @template S The type of the initial state.
 * @template A The type of the actions.
 * @param initialState The initial state for the store.
 * @param createActions A function that receives `set`, `get`, and the `actions` object, and returns the defined actions.
 * @param persistence Optional persistence configuration.
 * @returns A new Store or PersistedStore instance.
 */
export function createStore<S extends State, A extends Actions<S, A>>(
  initialState: S,
  createActions: (set: (updater: (state: S) => S) => void, get: () => S, actions: A) => A,
  persistence?: PersistenceConfig<S>,
): Store<S, A> | PersistedStore<S, A> {
  let state: S = initialState;
  const listeners: Set<Listener<S>> = new Set();
  let isHydrated = false;

  // Persistence helpers
  const hasPersistence = !!persistence;
  const adapter = persistence?.adapter;
  const storageKey = persistence?.key || '';
  // Note: Custom serialize/deserialize functions in PersistenceConfig are handled by
  // wrapping the adapter or creating a custom adapter implementation
  const autoSync = persistence?.autoSync !== false; // Default to true
  const shouldMerge = persistence?.merge || false;

  const getState = (): S => state;

  const setState = (updater: (state: S) => S): void => {
    const oldState = state;
    const newState = updater(state);

    // Perform a shallow comparison to see if the state actually changed
    let hasChanged = false;
    if (newState !== oldState) {
      // Check reference first for performance
      // If references are different, check keys and values
      const oldKeys = Object.keys(oldState);
      const newKeys = Object.keys(newState);
      if (oldKeys.length !== newKeys.length) {
        hasChanged = true;
      } else {
        for (const key of newKeys) {
          if (!Object.prototype.hasOwnProperty.call(oldState, key) || oldState[key] !== newState[key]) {
            hasChanged = true;
            break;
          }
        }
      }
    }

    if (hasChanged) {
      state = newState;
      listeners.forEach((listener) => listener(newState, oldState));

      // Auto-sync to storage if persistence is enabled
      if (hasPersistence && autoSync && isHydrated && adapter) {
        // Fire and forget - don't block state updates on persistence
        adapter.save(storageKey, newState).catch((error) => {
          console.error(`Store persistence failed for key "${storageKey}":`, error);
        });
      }
    } else if (newState !== oldState) {
      // If the content is the same but the reference is new,
      // update the state to the new reference for consistency if anyone relies on it,
      // but do not notify listeners.
      // This handles cases where an updater returns a new object that's shallowly equal.
      // For the `doNothing` test case `state => ({...state})`, this branch will be hit.
      // We update `state` to `newState` to ensure `getState()` returns the latest reference,
      // even if it's content-wise identical.
      state = newState;
    }
  };

  const subscribe = (listener: Listener<S>): (() => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  };

  const destroy = (): void => {
    listeners.clear();
  };

  // Persistence methods
  const persist = async (): Promise<void> => {
    if (!adapter) {
      throw new Error('Cannot persist: no persistence adapter configured');
    }
    try {
      await adapter.save(storageKey, state);
    } catch (error) {
      console.error(`Failed to persist state for key "${storageKey}":`, error);
      throw error;
    }
  };

  const hydrate = async (): Promise<void> => {
    if (!adapter) {
      throw new Error('Cannot hydrate: no persistence adapter configured');
    }
    try {
      const loaded = await adapter.load(storageKey);
      if (loaded !== null) {
        if (shouldMerge) {
          // Merge loaded state with initial state
          state = { ...initialState, ...loaded };
        } else {
          // Replace state completely
          state = loaded;
        }
      }
      isHydrated = true;
    } catch (error) {
      console.error(`Failed to hydrate state for key "${storageKey}":`, error);
      isHydrated = true; // Mark as hydrated even on error to allow auto-sync
      throw error;
    }
  };

  const clearPersisted = async (): Promise<void> => {
    if (!adapter) {
      throw new Error('Cannot clear persisted state: no persistence adapter configured');
    }
    try {
      await adapter.remove(storageKey);
    } catch (error) {
      console.error(`Failed to clear persisted state for key "${storageKey}":`, error);
      throw error;
    }
  };

  // Auto-hydrate if persistence is enabled
  if (hasPersistence && adapter) {
    // Run hydration immediately but don't block store creation
    hydrate().catch((error) => {
      console.error(`Auto-hydration failed for key "${storageKey}":`, error);
    });
  } else {
    // Mark as hydrated if no persistence
    isHydrated = true;
  }

  // Prepare a placeholder for actions that can be passed to createActions
  // This allows actions to call other actions
  const tempActions = {} as A;

  // Create the actual actions by calling the user-provided function
  const createdActions = createActions(setState, getState, tempActions);

  // Populate the tempActions object with the created actions
  // This is a bit of a trick to allow actions to call each other
  // by referencing the `actions` parameter passed to `createActions`
  for (const key in createdActions) {
    if (Object.prototype.hasOwnProperty.call(createdActions, key)) {
      tempActions[key] = createdActions[key];
    }
  }

  const storeActions = {} as A;
  for (const key in createdActions) {
    if (Object.prototype.hasOwnProperty.call(createdActions, key)) {
      // Ensure that the action is a function before assigning it
      if (typeof createdActions[key] === 'function') {
        storeActions[key] = ((...args: any[]) => {
          // When an action is called, it internally calls the function from createdActions
          // This ensures `set` and `get` are correctly scoped from the `createStore` closure
          return (createdActions[key] as (...args: any[]) => void)(...args);
        }) as A[Extract<keyof A, string>];
      }
    }
  }

  // Return appropriate store type based on persistence configuration
  const baseStore = {
    getState,
    setState,
    subscribe,
    destroy,
    actions: storeActions,
  };

  if (hasPersistence) {
    return {
      ...baseStore,
      persist,
      hydrate,
      clearPersisted,
    } as PersistedStore<S, A>;
  }

  return baseStore as Store<S, A>;
}
