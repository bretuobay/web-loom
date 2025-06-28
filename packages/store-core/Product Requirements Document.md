Product Requirements Document: Framework-Agnostic Client-State Library
1. Introduction
1.1 Purpose
This Product Requirements Document (PRD) outlines the requirements for a lightweight, framework-agnostic, purely client-side state management library written in TypeScript. This library aims to provide a predictable and efficient way to manage UI state in modern web applications, similar to concepts found in Redux, Zustand, or Pinia, but with a focus on simplicity and minimal boilerplate.
1.2 Scope
The scope of this document covers the core functionalities necessary for a robust client-state library, including state definition, state updates, data retrieval (selectors), and reactive subscriptions. It also defines the technical requirements, including the use of TypeScript and Vitest for testing. This document is designed to be comprehensive enough for an AI/Large Language Model agent to translate into a concrete implementation with accompanying tests.
1.3 Goals
Provide a simple, intuitive API for managing application state.
Ensure full type-safety through TypeScript.
Be completely framework-agnostic, usable with React, Vue, Angular, Svelte, or vanilla JavaScript.
Maintain a small bundle size and high performance.
Enable predictable state changes through explicit actions/mutations.
2. Product Overview
The client-state library will offer a createStore function that allows developers to define a reactive store containing an initial state and methods to interact with that state. Consumers of the store can subscribe to state changes, retrieve the current state, and derive computed values (selectors) from the state. The library will emphasize immutability for state updates, ensuring that state changes are always predictable and traceable.
2.1 Key Concepts
Store: A single source of truth for a specific part of the application state. It encapsulates the state, methods to modify it, and mechanisms for notifying subscribers.
State: A plain JavaScript object representing the current data of the application or a specific module.
Actions/Mutations: Functions defined within the store that encapsulate the logic for modifying the state. All state modifications must go through these defined methods to ensure predictability and traceability.
Selectors: Functions that take the current state as input and return derived data. They are crucial for optimizing performance by preventing unnecessary re-renders when only specific parts of the state are relevant.
Subscribers/Listeners: Functions that are called whenever the state in the store changes, allowing UI components or other parts of the application to react to these changes.
3. Functional Requirements
3.1 Core Functionality
FR.1: Store Creation
The library shall provide a createStore function that accepts an initial state and an object containing actions/mutations.
FR.2: Initial State
The store shall be initialized with a given initial state.
FR.3: State Retrieval
The store shall provide a mechanism (getState) to retrieve the current state at any time.
FR.4: State Updates (Mutations/Actions)
The store shall allow state modifications only through explicitly defined actions/mutations. These actions should receive the current state (or a draft of it) and any necessary payload to perform the update. State updates must be immutable, meaning a new state object is returned rather than modifying the existing one directly.
FR.5: Subscriptions
The store shall provide a mechanism (subscribe) for functions (listeners) to register for notifications when the state changes. The subscribed function should receive the new state and the old state.
FR.6: Unsubscriptions
The subscribe method shall return a function that, when called, removes the corresponding listener from the store, preventing further notifications.
FR.7: Selectors (Derived State)
The library shall support defining selectors that compute derived data from the state. When the relevant state changes, the selector should re-evaluate. While memoization is a desirable optimization, the initial implementation can focus on simply re-evaluating the selector on every state change, with an eye towards adding memoization as an enhancement.
FR.8: Store Destruction
The store shall provide a destroy method that cleans up all subscriptions and internal references, allowing for garbage collection.
3.2 API Design (TypeScript Interfaces)
The core API will revolve around a createStore function and the Store interface.
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

/**
 * Represents an action/mutation function that modifies the state.
 * It receives a `set` function to update the state and the current `get` state.
 * @param set A function to update the state immutably.
 * @param get A function to get the current state.
 */
export type Action<S extends State, A> = (set: (updater: (state: S) => S) => void, get: () => S, actions: A) => void;

/**
 * Represents the structure for defining actions within the store.
 */
export type Actions<S extends State, A> = {
  [K in keyof A]: A[K] extends (...args: infer P) => void
    ? (...args: P) => void
    : never;
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
export interface Store<S extends State, A extends Actions<S, A>> {
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
  actions: A;
}

/**
 * The function to create a new store.
 * @template S The type of the initial state.
 * @template A The type of the actions.
 * @param initialState The initial state for the store.
 * @param createActions A function that receives `set`, `get`, and the `actions` object, and returns the defined actions.
 * @returns A new Store instance.
 */
export declare function createStore<S extends State, A extends Actions<S, A>>(
  initialState: S,
  createActions: (set: (updater: (state: S) => S) => void, get: () => S, actions: A) => A
): Store<S, A>;


3.3 Immutability
All state updates must be immutable. This means that when an action modifies the state, it should return a new state object with the changes, rather than directly mutating the original state object. This ensures predictable state changes and simplifies debugging.
3.4 Performance Considerations
The library should be designed for efficient updates. Subscribers should only be notified when the state actually changes (i.e., the new state object reference is different from the old one).
4. Non-Functional Requirements
4.1 Technology Stack
Language: TypeScript (strict mode enabled).
Runtime Environment: Modern JavaScript environments (ES2018+).
4.2 Testing
Testing Framework: Vitest.
Test Coverage: High test coverage for all core functionalities.
Types: Type definitions must be correct and provide strong type inference.
4.3 Performance
Minimal overhead for state updates and subscriptions.
Fast subscription notification mechanism.
4.4 Usability / Developer Experience (DX)
Clear and concise API.
Intuitive patterns for state management.
Comprehensive TypeScript types for auto-completion and compile-time error checking.
4.5 Bundle Size
The library should be lightweight with a minimal footprint. Avoid unnecessary dependencies.
5. Technical Design (High-Level Principles)
Observer Pattern: The subscription mechanism will be implemented using the Observer pattern, where the store acts as the "subject" and listeners are "observers."
Plain Objects: State will be represented as plain JavaScript objects. No proxies or complex data structures are strictly required for the core functionality, although an internal mechanism for immutability (e.g., shallow cloning) will be needed.
No External Dependencies: The library should have zero external runtime dependencies beyond what's provided by the JavaScript environment and TypeScript compilation.
Function Composition: Actions will be functions that receive utility functions (set, get) to interact with the store, promoting a functional approach.
6. Test Cases
The following test cases, written using Vitest, should be implemented to ensure the correctness and robustness of the library.
6.1 Basic State Management
TC.1.1: Initial State Retrieval:
Description: Verify that getState() returns the initial state passed during store creation.
Expected Outcome: store.getState() equals the initial state.
TC.1.2: State Update via Action:
Description: Verify that state can be updated correctly through a defined action.
Expected Outcome: getState() returns the new state after the action is called.
TC.1.3: Immutability of State:
Description: Verify that the original state object reference changes after an update, ensuring immutability.
Expected Outcome: oldState !== newState after an update.
6.2 Subscription Mechanism
TC.2.1: Single Subscriber Notification:
Description: Verify that a single subscribed listener is called when the state changes.
Expected Outcome: The listener function is called exactly once with the correct newState and oldState.
TC.2.2: Multiple Subscribers Notification:
Description: Verify that multiple subscribed listeners are all called when the state changes.
Expected Outcome: All listener functions are called with the correct states.
TC.2.3: Unsubscribe Functionality:
Description: Verify that an unsubscribed listener is no longer called when the state changes.
Expected Outcome: The unsubscribed listener is not called, while other active listeners are.
TC.2.4: No Notification on Identical State:
Description: If an action is called but results in no actual state change (e.g., setState is called with an updater that returns the same object), listeners should not be notified.
Expected Outcome: Listeners are not called. (This can be initially out of scope if setState always creates a new object, but it's good for optimization).
TC.2.5: Unsubscribe within Listener:
Description: Verify that unsubscribing within a listener doesn't break the notification chain for other listeners.
Expected Outcome: Other listeners are still called correctly.
6.3 Selector Functionality
TC.3.1: Basic Selector Usage:
Description: Verify that a selector correctly derives data from the state.
Expected Outcome: The selector returns the expected derived value based on the current state.
TC.3.2: Selector Re-evaluation on State Change:
Description: Verify that the selector's output reflects the latest state after an update.
Expected Outcome: Selector returns the new derived value.
6.4 Store Lifecycle
TC.4.1: Store Destruction:
Description: Verify that calling destroy() clears all listeners and prevents further notifications.
Expected Outcome: No listeners are called after destroy() is invoked, even if actions are dispatched.
7. Future Considerations (Out of Scope for Initial Version)
Middleware: Support for applying middleware to actions (e.g., for logging, async operations, side effects).
DevTools Integration: Compatibility with browser developer tools extensions for state inspection and time-travel debugging.
Async Actions: Built-in support or patterns for handling asynchronous operations.
Shallow vs. Deep Comparisons: Options for different levels of state comparison for subscriber notifications.
Batching Updates: Optimizations to batch multiple state updates into a single notification cycle.
