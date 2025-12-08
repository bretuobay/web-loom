# @web-loom/event-bus-core

A lightweight, framework-agnostic Event Bus library for decoupled communication in modern web applications.

## Overview

`@web-loom/event-bus-core` provides a simple and efficient publish-subscribe pattern implementation written in TypeScript. It enables components or modules to communicate without direct dependencies on each other, facilitating a more modular and maintainable architecture.

> ℹ️ **Event bus vs. event emitter**  
> The bus is a higher-level abstraction that groups multiple event names under one instance and supports tuple payloads. Internally it now uses `@web-loom/event-emitter-core` for listener bookkeeping and error handling, so packages that only need localized dispatching can import the emitter directly.

## Features

- **Type-safe**: Full TypeScript support with type inference for event names and payloads
- **Framework-agnostic**: Works with React, Vue, Angular, Svelte, or vanilla JavaScript
- **Lightweight**: Minimal bundle size (~1KB gzipped) with zero dependencies
- **Simple API**: Intuitive methods for event registration, emission, and cleanup
- **Flexible**: Support for single and multiple event listeners
- **Reliable**: Stable listener execution order and memory leak prevention

## Installation

```bash
npm install @web-loom/event-bus-core
```

## Quick Start

```typescript
import { createEventBus } from '@web-loom/event-bus-core';

// Create an event bus
const eventBus = createEventBus();

// Subscribe to an event
eventBus.on('user:login', (user) => {
  console.log('User logged in:', user);
});

// Emit an event
eventBus.emit('user:login', { id: '123', name: 'Alice' });
```

## Type-Safe Usage

Define an `EventMap` interface to get full type safety and autocomplete:

```typescript
import { createEventBus, type EventMap } from '@web-loom/event-bus-core';

// Define your application's events
interface AppEvents extends EventMap {
  'user:login': [{ userId: string; username: string }];
  'user:logout': [];
  'notification:show': [{ message: string; type: 'info' | 'error' | 'success' }];
  'data:updated': [{ entityId: string; changes: Record<string, any> }];
}

// Create a type-safe event bus
const eventBus = createEventBus<AppEvents>();

// TypeScript will enforce correct event names and payload types
eventBus.on('user:login', (payload) => {
  // payload is typed as { userId: string; username: string }
  console.log(`User ${payload.username} logged in`);
});

eventBus.emit('user:login', { userId: '123', username: 'Alice' });
// TypeScript error if you pass wrong payload:
// eventBus.emit('user:login', { wrong: 'payload' }); // Error!
```

## API Reference

### `createEventBus<M>()`

Creates a new event bus instance.

```typescript
const eventBus = createEventBus<MyEventMap>();
```

### `on(event, listener)`

Registers a listener function for one or more events.

```typescript
// Single event
eventBus.on('user:login', (user) => {
  console.log('User logged in:', user);
});

// Multiple events with the same handler
eventBus.on(['user:login', 'user:register'], (user) => {
  console.log('User event:', user);
});
```

### `once(event, listener)`

Registers a listener that executes only once, then automatically unsubscribes.

```typescript
eventBus.once('app:ready', () => {
  console.log('App is ready! This will only log once.');
});

eventBus.emit('app:ready');
eventBus.emit('app:ready'); // Listener won't fire again
```

### `emit(event, ...args)`

Emits an event, calling all registered listeners with the provided arguments.

```typescript
eventBus.emit('notification:show', {
  message: 'Operation successful',
  type: 'success',
});
```

### `off(event?, listener?)`

Unregisters listeners. Three usage patterns:

```typescript
// Remove a specific listener from an event
const handler = (data) => console.log(data);
eventBus.on('user:login', handler);
eventBus.off('user:login', handler);

// Remove all listeners for an event
eventBus.off('user:login');

// Remove all listeners from all events
eventBus.off();
```

## Usage Examples

### Basic Publish-Subscribe

```typescript
import { createEventBus } from '@web-loom/event-bus-core';

const eventBus = createEventBus();

// Component A: Subscribe
eventBus.on('data:fetched', (data) => {
  console.log('Received data:', data);
});

// Component B: Publish
fetch('/api/data')
  .then((res) => res.json())
  .then((data) => {
    eventBus.emit('data:fetched', data);
  });
```

### Cross-Component Communication

```typescript
// Create a shared event bus
export const appEventBus = createEventBus<AppEvents>();

// Component A: Cart
import { appEventBus } from './eventBus';

function addToCart(item) {
  cart.push(item);
  appEventBus.emit('cart:updated', { items: cart });
}

// Component B: Cart Badge
import { appEventBus } from './eventBus';

appEventBus.on('cart:updated', ({ items }) => {
  updateBadgeCount(items.length);
});
```

### React Integration

```typescript
import { useEffect } from 'react';
import { appEventBus } from './eventBus';

function NotificationListener() {
  useEffect(() => {
    const handler = ({ message, type }) => {
      showNotification(message, type);
    };

    appEventBus.on('notification:show', handler);

    // Cleanup on unmount
    return () => {
      appEventBus.off('notification:show', handler);
    };
  }, []);

  return null;
}
```

### Vue Integration

```vue
<script setup>
import { onMounted, onUnmounted } from 'vue';
import { appEventBus } from './eventBus';

onMounted(() => {
  appEventBus.on('notification:show', handleNotification);
});

onUnmounted(() => {
  appEventBus.off('notification:show', handleNotification);
});

function handleNotification({ message, type }) {
  // Show notification
}
</script>
```

### Angular Integration

```typescript
import { Injectable, OnDestroy } from '@angular/core';
import { appEventBus } from './eventBus';

@Injectable()
export class NotificationService implements OnDestroy {
  private handlers: Array<{ event: string; handler: Function }> = [];

  constructor() {
    this.setupListeners();
  }

  private setupListeners() {
    const handler = ({ message, type }) => {
      this.showNotification(message, type);
    };

    appEventBus.on('notification:show', handler);
    this.handlers.push({ event: 'notification:show', handler });
  }

  ngOnDestroy() {
    // Clean up all listeners
    this.handlers.forEach(({ event, handler }) => {
      appEventBus.off(event, handler);
    });
  }

  private showNotification(message: string, type: string) {
    // Implementation
  }
}
```

### Event Namespacing

Organize events with namespaces for better structure:

```typescript
interface AppEvents extends EventMap {
  // User events
  'user:login': [User];
  'user:logout': [];
  'user:updated': [User];

  // Cart events
  'cart:added': [Item];
  'cart:removed': [string]; // item ID
  'cart:cleared': [];

  // App lifecycle events
  'app:ready': [];
  'app:error': [Error];
}

const eventBus = createEventBus<AppEvents>();
```

### Multiple Listeners

```typescript
interface Events extends EventMap {
  'data:saved': [{ id: string; data: any }];
}

const eventBus = createEventBus<Events>();

// Multiple components can listen to the same event
eventBus.on('data:saved', ({ id }) => {
  console.log('Analytics: Data saved', id);
});

eventBus.on('data:saved', ({ id }) => {
  console.log('Cache: Invalidating cache for', id);
});

eventBus.on('data:saved', ({ data }) => {
  console.log('UI: Updating display with', data);
});

// All three listeners will be called
eventBus.emit('data:saved', { id: '123', data: { name: 'Example' } });
```

### Cleanup Patterns

```typescript
// Pattern 1: Store handlers for later cleanup
const handlers = [];

function setupListeners() {
  const loginHandler = (user) => console.log(user);
  const logoutHandler = () => console.log('Logged out');

  eventBus.on('user:login', loginHandler);
  eventBus.on('user:logout', logoutHandler);

  handlers.push({ event: 'user:login', handler: loginHandler }, { event: 'user:logout', handler: logoutHandler });
}

function cleanup() {
  handlers.forEach(({ event, handler }) => {
    eventBus.off(event, handler);
  });
  handlers.length = 0;
}

// Pattern 2: Return cleanup function
function createListener(eventName, callback) {
  eventBus.on(eventName, callback);
  return () => eventBus.off(eventName, callback);
}

const unsubscribe = createListener('user:login', (user) => {
  console.log(user);
});

// Later...
unsubscribe();
```

## Advanced Patterns

### Event Aggregation

```typescript
interface Events extends EventMap {
  'order:created': [Order];
  'order:updated': [Order];
  'order:deleted': [string];
  'orders:changed': []; // Aggregate event
}

const eventBus = createEventBus<Events>();

// Emit aggregate event whenever any order event occurs
['order:created', 'order:updated', 'order:deleted'].forEach((event) => {
  eventBus.on(event as any, () => {
    eventBus.emit('orders:changed');
  });
});

// Components can listen to the aggregate event
eventBus.on('orders:changed', () => {
  refreshOrdersList();
});
```

### Event Filtering

```typescript
interface Events extends EventMap {
  'message:received': [{ userId: string; message: string }];
}

const eventBus = createEventBus<Events>();

// Create a filtered listener
function createFilteredListener(userId: string, callback: (msg: string) => void) {
  const handler = ({ userId: id, message }) => {
    if (id === userId) {
      callback(message);
    }
  };

  eventBus.on('message:received', handler);
  return () => eventBus.off('message:received', handler);
}

const unsubscribe = createFilteredListener('user-123', (message) => {
  console.log('Message for user-123:', message);
});
```

### Event Debugging

```typescript
function createDebugEventBus<M extends EventMap>() {
  const bus = createEventBus<M>();

  return {
    ...bus,
    emit: (event: any, ...args: any[]) => {
      console.log(`[EventBus] Emitting "${event}"`, args);
      bus.emit(event, ...args);
    },
    on: (event: any, listener: any) => {
      console.log(`[EventBus] Registering listener for "${event}"`);
      bus.on(event, listener);
    },
  };
}

const eventBus = createDebugEventBus<AppEvents>();
```

## TypeScript Support

Full TypeScript support with comprehensive type definitions:

```typescript
import type { EventMap, EventBus, Listener, GenericListener } from '@web-loom/event-bus-core';

// Define custom event map
interface MyEvents extends EventMap {
  'event:name': [PayloadType];
}

// Type-safe bus
const bus: EventBus<MyEvents> = createEventBus<MyEvents>();

// Type-safe listeners
const listener: Listener<'event:name', MyEvents> = (payload) => {
  // payload is correctly typed as PayloadType
};
```

## Performance Considerations

- **Listener Execution**: Listeners are executed synchronously in the order they were registered
- **Memory**: Use `off()` to clean up listeners and prevent memory leaks
- **Listener Stability**: During an `emit()`, a stable copy of listeners is created, so adding/removing listeners during emission won't affect the current emission cycle

## Best Practices

1. **Define EventMap**: Always define an EventMap interface for type safety
2. **Namespace Events**: Use namespaces (e.g., `user:login`) to organize events
3. **Clean Up**: Always unsubscribe listeners when components unmount
4. **Single Responsibility**: Keep event handlers focused on a single responsibility
5. **Avoid Circular Events**: Be careful not to create circular event emissions
6. **Documentation**: Document your event contracts clearly

## Common Patterns

### Global Event Bus

```typescript
// eventBus.ts
export const globalEventBus = createEventBus<AppEvents>();

// Use across your application
import { globalEventBus } from './eventBus';
```

### Scoped Event Bus

```typescript
// Create separate buses for different features
export const authEventBus = createEventBus<AuthEvents>();
export const cartEventBus = createEventBus<CartEvents>();
export const notificationEventBus = createEventBus<NotificationEvents>();
```

## Testing

```typescript
import { createEventBus } from '@web-loom/event-bus-core';
import { describe, it, expect, vi } from 'vitest';

describe('EventBus', () => {
  it('should call listener when event is emitted', () => {
    const bus = createEventBus();
    const listener = vi.fn();

    bus.on('test:event', listener);
    bus.emit('test:event', 'payload');

    expect(listener).toHaveBeenCalledWith('payload');
  });

  it('should remove listener with off', () => {
    const bus = createEventBus();
    const listener = vi.fn();

    bus.on('test:event', listener);
    bus.off('test:event', listener);
    bus.emit('test:event');

    expect(listener).not.toHaveBeenCalled();
  });

  it('should call once listener only once', () => {
    const bus = createEventBus();
    const listener = vi.fn();

    bus.once('test:event', listener);
    bus.emit('test:event');
    bus.emit('test:event');

    expect(listener).toHaveBeenCalledTimes(1);
  });
});
```

## Bundle Size

- UMD: ~2KB minified
- ESM: ~1KB minified + gzipped
- Zero dependencies

## Browser Support

Works in all modern browsers and Node.js environments that support ES2015+.

## License

MIT
