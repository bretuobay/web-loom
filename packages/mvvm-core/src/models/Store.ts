// Represents the base type for any state object.
export type State = Record<string, any>;

// Represents a listener function that is called when the state changes.
export type Listener<S extends State> = (newState: S, oldState: S) => void;

// The core Store interface.
export interface IStore<S extends State> {
  getState(): S;
  setState(updater: (state: S) => S): void;
  subscribe(listener: Listener<S>): () => void;
  // We might need a way to dispatch actions, but let's keep it simple for now
  // dispatch?<A>(action: A): void;
}
