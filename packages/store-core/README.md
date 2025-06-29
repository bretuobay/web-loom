# @web-loom/store-core

`@web-loom/store-core` is a minimal, framework-agnostic client-side state management library designed for building reactive web applications. It provides a simple and efficient way to manage UI state with a focus on type safety and predictability.

## Overview

Inspired by patterns from libraries like Redux and Zustand, `store-core` offers a `createStore` function to define a reactive store. This store encapsulates your application's state, actions to modify that state, and mechanisms to subscribe to state changes.

The library is built with TypeScript and emphasizes:

- **Simplicity:** An intuitive API with minimal boilerplate.
- **Type Safety:** Full TypeScript support for robust type checking and autocompletion.
- **Framework Agnostic:** Usable with any JavaScript framework (React, Vue, Angular, Svelte) or vanilla JavaScript.
- **Predictable State Changes:** State modifications occur only through explicit actions, promoting immutability.
- **Lightweight:** Small bundle size and high performance.

## Core Concepts

- **Store:** A single source of truth for a specific part of your application's state. It contains the state, actions, and subscription logic.
- **State:** A plain JavaScript object representing the current data.
- **Actions:** Functions defined within the store that encapsulate the logic for modifying the state. All state changes must go through actions.
- **Selectors:** Functions that derive computed data from the state.
- **Listeners:** Functions that are called whenever the state in the store changes, allowing UI components or other parts of the application to react.

## Installation

```bash
npm install @web-loom/store-core
# or
yarn add @web-loom/store-core
# or
pnpm add @web-loom/store-core
```

## Basic Usage

```typescript
import { createStore } from '@web-loom/store-core';

// 1. Define your state interface
interface CounterState {
  count: number;
}

// 2. Define your actions interface
interface CounterActions {
  increment: () => void;
  decrement: () => void;
  add: (amount: number) => void;
}

// 3. Create the store
const store = createStore<CounterState, CounterActions>(
  { count: 0 }, // Initial state
  (set, get, actions) => ({
    increment: () => set((state) => ({ ...state, count: state.count + 1 })),
    decrement: () => set((state) => ({ ...state, count: state.count - 1 })),
    add: (amount: number) => set((state) => ({ ...state, count: state.count + amount })),
  }),
);

// 4. Get current state
console.log(store.getState()); // { count: 0 }

// 5. Dispatch actions
store.actions.increment();
console.log(store.getState()); // { count: 1 }

store.actions.add(5);
console.log(store.getState()); // { count: 6 }

// 6. Subscribe to state changes
const unsubscribe = store.subscribe((newState, oldState) => {
  console.log('State changed:', oldState, '->', newState);
});

store.actions.decrement();
// Output: State changed: { count: 6 } -> { count: 5 }
console.log(store.getState()); // { count: 5 }

// 7. Unsubscribe when no longer needed
unsubscribe();

// 8. Destroy the store to clean up listeners (e.g., when a component unmounts)
store.destroy();
```

## API

### `createStore<S, A>(initialState, createActions)`

- `initialState: S`: The initial state object.
- `createActions: (set, get, actions) => A`: A function that receives:
  - `set: (updater: (state: S) => S) => void`: A function to update the state. The `updater` function receives the current state and should return a new state object (immutability is key).
  - `get: () => S`: A function to get the current state. Useful for actions that need to read the state before updating.
  - `actions: A`: A reference to the actions object itself, allowing actions to call other actions.
    This function must return an object containing your action implementations.

Returns a `Store` instance.

### `Store<S, A>` instance

- `getState(): S`: Returns the current state.
- `setState(updater: (state: S) => S): void`: Updates the state. Primarily for internal use by actions.
- `subscribe(listener: (newState: S, oldState: S) => void): () => void`: Subscribes a listener to state changes. Returns an unsubscribe function.
- `destroy(): void`: Clears all listeners. Call this to prevent memory leaks when the store is no longer needed.
- `actions: A`: An object containing the actions you defined.

For more detailed information on the design and technical requirements, please refer to the [Product Requirements Document.md](./Product%20Requirements%20Document.md).

```

```
