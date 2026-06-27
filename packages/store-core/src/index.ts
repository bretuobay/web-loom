export type State = Record<string, any>;

export type Listener<S extends State> = (newState: S, oldState: S) => void;

export type Actions<_S, A> = {
  [K in keyof A]: A[K] extends (...args: infer P) => void ? (...args: P) => void : never;
};

export type Selector<S extends State, T> = (state: S) => T;

export interface Store<S extends State, Act extends Actions<S, Act>> {
  getState(): S;
  setState(updater: (state: S) => S): void;
  subscribe(listener: Listener<S>): () => void;
  destroy(): void;
  actions: Act;
}

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

    let hasChanged = false;
    if (newState !== oldState) {
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

  const tempActions = {} as A;
  const createdActions = createActions(setState, getState, tempActions);

  for (const key in createdActions) {
    if (Object.prototype.hasOwnProperty.call(createdActions, key)) {
      tempActions[key] = createdActions[key];
    }
  }

  const storeActions = {} as A;
  for (const key in createdActions) {
    if (Object.prototype.hasOwnProperty.call(createdActions, key)) {
      if (typeof createdActions[key] === 'function') {
        storeActions[key] = ((...args: any[]) => {
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
