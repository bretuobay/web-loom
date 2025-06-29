# @web-loom/event-bus-core

`@web-loom/event-bus-core` is a lightweight, framework-agnostic Event Bus library written in TypeScript. It provides a simple and efficient way to enable decoupled communication between different parts of your application using a publish-subscribe pattern.

## Overview

This library allows components or modules to communicate without direct dependencies on each other. Publishers can emit events, and subscribers can listen for these events, facilitating a more modular and maintainable architecture.

Key features include:

- **Type Safety:** Full TypeScript support for event names and their corresponding payload types, ensuring robust type checking and autocompletion.
- **Framework Agnostic:** Usable with any JavaScript framework (React, Vue, Angular, Svelte) or vanilla JavaScript.
- **Simple API:** Intuitive methods for event registration (`on`), unregistration (`off`), single-shot listening (`once`), and emission (`emit`).
- **Lightweight:** Minimal bundle size and efficient performance.
- **Decoupled Architecture:** Helps reduce coupling between different parts of your application.

## Core Concepts

- **Event Bus Instance:** The central object (`createEventBus()`) responsible for managing event registrations and emissions.
- **Event Name:** A string identifier for a specific type of event.
- **Listener/Handler:** A callback function that is executed when a specific event is emitted.
- **Payload:** Data associated with an event, passed to the listener when the event is emitted.
- **EventMap:** A TypeScript type you define to map event names to their expected payload types, enabling type safety.

## Installation

```bash
npm install @web-loom/event-bus-core
# or
yarn add @web-loom/event-bus-core
# or
pnpm add @web-loom/event-bus-core
```

## Basic Usage

```typescript
import { createEventBus, EventMap } from '@web-loom/event-bus-core';

// 1. Define your EventMap (optional but recommended for type safety)
interface AppEvents extends EventMap {
  'user:login': [{ userId: string; username: string }];
  'user:logout': []; // No payload
  'notification:show': [{ message: string; type: 'info' | 'error' }];
}

// 2. Create an event bus instance
const eventBus = createEventBus<AppEvents>();

// 3. Subscribe to events
const onUserLogin = (payload: { userId: string; username: string }) => {
  console.log(`User logged in: ${payload.username} (ID: ${payload.userId})`);
};
eventBus.on('user:login', onUserLogin);

const onNotification = (payload: { message: string; type: 'info' | 'error' }) => {
  console.log(`Notification (${payload.type}): ${payload.message}`);
};
eventBus.on('notification:show', onNotification);

// You can also register a listener for multiple events:
// Note: Ensure the handler is generic enough or checks payload types if they differ.
const handleMultipleEvents = (payload: any) => {
  // Example: Check payload type if necessary
  if (payload && payload.userId) {
    console.log('Login event from multi-listener:', payload);
  } else if (payload && payload.message) {
    console.log('Notification event from multi-listener:', payload);
  } else {
    console.log('Multi-listener received:', payload);
  }
};
eventBus.on(['user:login', 'notification:show'], handleMultipleEvents);

// 4. Emit events
eventBus.emit('user:login', { userId: '123', username: 'Alice' });
// Output:
// User logged in: Alice (ID: 123)
// Login event from multi-listener: { userId: '123', username: 'Alice' }

eventBus.emit('notification:show', { message: 'Profile updated!', type: 'info' });
// Output:
// Notification (info): Profile updated!
// Notification event from multi-listener: { message: 'Profile updated!', type: 'info' }

// 5. Using 'once' for a single-shot listener
eventBus.once('user:logout', () => {
  console.log('User logged out. This message will only appear once.');
});

eventBus.emit('user:logout'); // Listener fires
// Output: User logged out. This message will only appear once.
eventBus.emit('user:logout'); // Listener does not fire again

// 6. Unsubscribe from events
// Unsubscribe a specific listener
eventBus.off('user:login', onUserLogin); // onUserLogin is removed
eventBus.off(['user:login', 'notification:show'], handleMultipleEvents); // handleMultipleEvents is removed for both

eventBus.emit('user:login', { userId: '456', username: 'Bob' }); // No listeners for 'user:login' will fire now.

// Unsubscribe all listeners for 'notification:show'
eventBus.off('notification:show');
eventBus.emit('notification:show', { message: 'Another notification', type: 'error' }); // No listeners called

// Unsubscribe all listeners from the bus
// eventBus.off(); // Uncomment to remove all listeners
```

## API

### `createEventBus<M extends EventMap>()`

- `M` (optional): An `EventMap` interface defining your event names and their payload types.
  Example: `interface MyEvents extends EventMap { 'eventA': [string, number]; 'eventB': [] }`

Returns a new `EventBus<M>` instance.

### `EventBus<M>` instance

- `on<K extends keyof M>(event: K | K[], listener: Listener<K, M>): void`
  - Registers a `listener` for one or more `event` names.
- `once<K extends keyof M>(event: K, listener: Listener<K, M>): void`
  - Registers a `listener` that will be invoked at most once for the given `event`. It's automatically removed after invocation.
- `off<K extends keyof M>(event?: K, listener?: Listener<K, M> | GenericListener): void`
  - Unregisters listeners.
    - `off(event, listener)`: Removes a specific `listener` for an `event`.
    - `off(event)`: Removes all listeners for an `event`.
    - `off()`: Removes all listeners for all events.
- `emit<K extends keyof M>(event: K, ...args: M[K] extends any[] ? M[K] : []): void`
  - Emits an `event`, calling all registered listeners with the provided `args` (payload).

### Types

- `EventMap`: `Record<string, any[] | undefined>`
  - A base type for defining your application's events and their payload signatures.
- `Listener<K, M>`: `(...args: M[K] extends any[] ? M[K] : []) => void`
  - A typed listener function for a specific event `K` in an `EventMap` `M`.
- `GenericListener`: `(...args: any[]) => void`
  - A generic listener that can accept any arguments.

For more detailed information on the design and technical requirements, please refer to the [Product Requirements Document.md](./Product%20Requirements%20Document.md).

```

```
