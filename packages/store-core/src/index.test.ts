import { describe, it, expect, vi } from 'vitest';
import { createStore, State, Store, Actions } from './index';

interface CounterState extends State {
  count: number;
}

interface CounterActions extends Actions<CounterState, CounterActions> {
  increment: () => void;
  decrement: () => void;
  add: (amount: number) => void;
  doNothing: () => void;
  incrementAndCallAdd: (amount: number) => void;
}

const initialCounterState: CounterState = { count: 0 };

const counterActions = (
  set: (updater: (state: CounterState) => CounterState) => void,
  get: () => CounterState,
  actions: CounterActions,
): CounterActions => ({
  increment: () => set((state) => ({ ...state, count: state.count + 1 })),
  decrement: () => set((state) => ({ ...state, count: state.count - 1 })),
  add: (amount: number) => set((state) => ({ ...state, count: state.count + amount })),
  doNothing: () => set((state) => ({ ...state })), // Action that doesn't change state
  incrementAndCallAdd: (amount: number) => {
    actions.increment(); // Calling another action
    actions.add(amount); // Calling another action
  },
});

describe('createStore', () => {
  let store: Store<CounterState, CounterActions>;

  beforeEach(() => {
    store = createStore(initialCounterState, counterActions);
  });

  // TC.1.1: Initial State Retrieval
  it('TC.1.1: should return the initial state', () => {
    expect(store.getState()).toEqual(initialCounterState);
  });

  // TC.1.2: State Update via Action
  it('TC.1.2: should update state correctly through an action', () => {
    store.actions.increment();
    expect(store.getState().count).toBe(1);
    store.actions.add(5);
    expect(store.getState().count).toBe(6);
  });

  // TC.1.2b: Actions calling other actions
  it('TC.1.2b: should allow actions to call other actions', () => {
    store.actions.incrementAndCallAdd(5); // count becomes 0+1=1, then 1+5=6
    expect(store.getState().count).toBe(6);
  });

  // TC.1.3: Immutability of State
  it('TC.1.3: should ensure state immutability', () => {
    const oldState = store.getState();
    store.actions.increment();
    const newState = store.getState();
    expect(newState).not.toBe(oldState);
    expect(newState.count).toBe(1);
    expect(oldState.count).toBe(0);
  });

  // TC.2.1: Single Subscriber Notification
  it('TC.2.1: should notify a single subscriber on state change', () => {
    const listener = vi.fn();
    store.subscribe(listener);
    const oldState = store.getState();
    store.actions.increment();
    const newState = store.getState();
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(newState, oldState);
  });

  // TC.2.2: Multiple Subscribers Notification
  it('TC.2.2: should notify multiple subscribers on state change', () => {
    const listener1 = vi.fn();
    const listener2 = vi.fn();
    store.subscribe(listener1);
    store.subscribe(listener2);
    const oldState = store.getState();
    store.actions.increment();
    const newState = store.getState();
    expect(listener1).toHaveBeenCalledTimes(1);
    expect(listener1).toHaveBeenCalledWith(newState, oldState);
    expect(listener2).toHaveBeenCalledTimes(1);
    expect(listener2).toHaveBeenCalledWith(newState, oldState);
  });

  // TC.2.3: Unsubscribe Functionality
  it('TC.2.3: should stop notifying an unsubscribed listener', () => {
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    unsubscribe();
    store.actions.increment();
    expect(listener).not.toHaveBeenCalled();
  });

  // TC.2.4: No Notification on Identical State
  it('TC.2.4: should not notify listeners if state does not change', () => {
    const listener = vi.fn();
    store.subscribe(listener);
    store.actions.doNothing(); // This action doesn't change the state
    expect(listener).not.toHaveBeenCalled();
  });

  // TC.2.5: Unsubscribe within Listener
  it('TC.2.5: should handle unsubscription within a listener correctly', () => {
    const listener1 = vi.fn();
    const listener2 = vi.fn(() => {
      unsubscribeListener2(); // Unsubscribe self
    });
    const listener3 = vi.fn();

    store.subscribe(listener1);
    const unsubscribeListener2 = store.subscribe(listener2);
    store.subscribe(listener3);

    const oldState = store.getState();
    store.actions.increment();
    const newState = store.getState();

    expect(listener1).toHaveBeenCalledTimes(1);
    expect(listener1).toHaveBeenCalledWith(newState, oldState);
    expect(listener2).toHaveBeenCalledTimes(1); // Called once before unsubscribing
    expect(listener2).toHaveBeenCalledWith(newState, oldState);
    expect(listener3).toHaveBeenCalledTimes(1);
    expect(listener3).toHaveBeenCalledWith(newState, oldState);

    // Increment again to ensure listener2 is not called
    const oldStateAfterFirstIncrement = store.getState();
    store.actions.increment();
    const newStateAfterSecondIncrement = store.getState();

    expect(listener1).toHaveBeenCalledTimes(2);
    expect(listener1).toHaveBeenLastCalledWith(newStateAfterSecondIncrement, oldStateAfterFirstIncrement);
    expect(listener2).toHaveBeenCalledTimes(1); // Still 1, not called again
    expect(listener3).toHaveBeenCalledTimes(2);
    expect(listener3).toHaveBeenLastCalledWith(newStateAfterSecondIncrement, oldStateAfterFirstIncrement);
  });

  // TC.3.1: Basic Selector Usage (Implicitly tested via getState)
  // The PRD defines selectors as functions that take state and return derived data.
  // Our store.getState() is the most basic form of a selector.
  // More complex selectors would be user-defined functions.
  it('TC.3.1: basic selector usage (getState)', () => {
    const selectedCount = (state: CounterState) => state.count;
    expect(selectedCount(store.getState())).toBe(0);
    store.actions.increment();
    expect(selectedCount(store.getState())).toBe(1);
  });

  // TC.3.2: Selector Re-evaluation on State Change (Implicitly tested)
  // This is also implicitly tested. If getState() didn't reflect changes, other tests would fail.
  // A user-defined selector function would naturally re-evaluate by being called with the new state.
  it('TC.3.2: selector re-evaluation on state change', () => {
    const selectDoubleCount = (state: CounterState) => state.count * 2;
    expect(selectDoubleCount(store.getState())).toBe(0);
    store.actions.add(3);
    expect(selectDoubleCount(store.getState())).toBe(6);
  });

  // TC.4.1: Store Destruction
  it('TC.4.1: should clear all listeners and prevent notifications after destroy', () => {
    const listener = vi.fn();
    store.subscribe(listener);
    store.destroy();
    store.actions.increment();
    expect(listener).not.toHaveBeenCalled();
    // Also check if getState still works (it should, but actions won't notify)
    expect(store.getState().count).toBe(1); // State was changed before listeners were cleared
  });
});
