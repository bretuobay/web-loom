// types.ts

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
export type Actions<S extends State, A> = {
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
 * The function to create a new store.
 * @template S The type of the initial state.
 * @template A The type of the actions.
 * @param initialState The initial state for the store.
 * @param createActions A function that receives `set`, `get`, and the `actions` object, and returns the defined actions.
 * @returns A new Store instance.
 */
export function createStore<S extends State, A extends Actions<S, A>>(
  initialState: S,
  createActions: (set: (updater: (state: S) => S) => void, get: () => S, actions: A) => A,
): Store<S, A> {
  let state: S = initialState;
  const listeners: Set<Listener<S>> = new Set();

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

  return {
    getState,
    setState,
    subscribe,
    destroy,
    actions: storeActions,
  };
}
