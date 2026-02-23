# `@web-loom/event-emitter-core` — Typed Events for the Modern Web

---

The event emitter is one of those ideas so fundamental to software that it's been reinvented independently across virtually every language and runtime. Java has `EventListener` and `Observer`. C# has delegates and events. Python has `EventEmitter` in asyncio. The browser has `EventTarget`. Node.js has `EventEmitter`. The concept is ancient.

And yet, in JavaScript, we've never quite had a satisfying version of it. Node's `EventEmitter` is untyped — you `emit('data', value)` and `on('data', callback)` and the relationship between the event name, its payload type, and the callback signature exists only in comments and convention. The browser's `EventTarget` / `CustomEvent` combo is verbose and also untyped. The frontend community has solved this with a long succession of third-party libraries: `mitt`, `tiny-emitter`, `eventemitter3`, `nano-events` — each with slightly different APIs and tradeoffs.

`@web-loom/event-emitter-core` is Web Loom's answer: a typed event emitter that enforces the relationship between event names and their payload types at compile time, with a clean API and no runtime dependencies.

---

## Why Type Safety Matters for Events

The fragility of an untyped event emitter reveals itself slowly. You start with:

```typescript
emitter.emit('user:login', { id: '123', email: 'user@example.com' });
```

Three months later, somewhere else in the codebase:

```typescript
emitter.on('user:login', (user) => {
  console.log(user.username); // runtime error — it's `email`, not `username`
});
```

Or you rename the event from `'user:login'` to `'auth:login'` and grep shows seven files referencing the old name, none of which have compile errors because string literals can't be checked against each other without TypeScript's help.

With a typed emitter, both of these mistakes are caught before you run the code.

---

## The API

The core of the package is the `EventEmitter<TEvents>` class, where `TEvents` is a record type mapping event names to their payload types.

```typescript
import { EventEmitter } from '@web-loom/event-emitter-core';

// Define your event map once — this is the contract
interface AppEvents {
  'user:login':  { id: string; email: string };
  'user:logout': void;
  'data:loaded': { count: number; timestamp: number };
  'error':       Error;
}

const emitter = new EventEmitter<AppEvents>();
```

From this point, everything is type-checked:

```typescript
// ✓ Correct payload
emitter.emit('user:login', { id: '1', email: 'a@b.com' });

// ✗ TypeScript error: 'username' doesn't exist in { id: string; email: string }
emitter.emit('user:login', { id: '1', username: 'ada' });

// ✓ void event — no payload needed
emitter.emit('user:logout');

// ✓ Listener receives the correct type
emitter.on('data:loaded', (data) => {
  // data is typed as { count: number; timestamp: number }
  console.log(data.count, data.timestamp);
});
```

### `on` / `off` / `once`

Standard subscribe/unsubscribe methods. `on` returns an unsubscribe function — the modern pattern that avoids needing to keep a reference to the listener for cleanup.

```typescript
const unsubscribe = emitter.on('user:login', (user) => {
  dashboard.load(user.id);
});

// Later, when you want to stop listening
unsubscribe();

// Or use the traditional off() with the original listener reference
const handler = (user: AppEvents['user:login']) => { ... };
emitter.on('user:login', handler);
emitter.off('user:login', handler);

// off() with no listener removes all handlers for that event
emitter.off('user:login');

// off() with no arguments clears everything
emitter.off();
```

`once` fires exactly once and then removes itself:

```typescript
emitter.once('user:login', (user) => {
  // Runs only on the first login, then unregisters
  recordFirstTimeLogin(user.id);
});
```

`subscribe` is an alias for `on` — it's there for compatibility with observable-style consumers.

### Error Handling

By default, if a listener throws, the emitter catches the error, logs it, and continues calling the remaining listeners. This is intentional: one misbehaving listener should not prevent the others from receiving the event.

You can customise the error handler at construction time:

```typescript
const emitter = new EventEmitter<AppEvents>({
  onError: (error, eventName) => {
    Sentry.captureException(error, {
      extra: { eventName: String(eventName) },
    });
  },
});
```

### Introspection

```typescript
emitter.listenerCount('user:login'); // → number
emitter.hasListeners('user:login');  // → boolean
emitter.eventNames();                 // → Array<keyof AppEvents>
```

These are useful for diagnostics and for building higher-level abstractions — `event-bus-core` uses them internally to avoid emitting on events with no subscribers.

---

## Lifecycle-Safe Usage

The most common bug with event emitters is forgetting to remove listeners. A component registers a listener on mount. The component unmounts. The listener stays registered. The emitter fires. The listener tries to update state on an unmounted component. React warns. Memory accumulates.

The unsubscribe function return pattern makes this manageable:

```typescript
// React
useEffect(() => {
  const unsub = emitter.on('data:loaded', (data) => {
    setCount(data.count);
  });
  return unsub; // React calls this on unmount
}, []);

// Vue
const unsub = emitter.on('data:loaded', (data) => {
  count.value = data.count;
});
onUnmounted(unsub);

// Web Component
connectedCallback() {
  this._unsub = emitter.on('data:loaded', (data) => {
    this.count = data.count;
  });
}
disconnectedCallback() {
  this._unsub?.();
}
```

`unsubscribeAll()` or `removeAllListeners()` (they're aliases) clear all handlers for an event or for the entire emitter — useful in test setup/teardown.

---

## A Real Pattern: Module-Scoped Emitters

The most useful pattern is the singleton emitter scoped to a domain or feature. You export it from a module and import it wherever you need it.

```typescript
// events/auth-events.ts
import { EventEmitter } from '@web-loom/event-emitter-core';

export interface AuthEvents {
  'login:success':  { userId: string; token: string };
  'login:failed':   { reason: string };
  'logout':          void;
  'token:refreshed': { newToken: string };
}

export const authEvents = new EventEmitter<AuthEvents>();
```

```typescript
// AuthModel.ts
import { authEvents } from '../events/auth-events';

async login(email: string, password: string) {
  const result = await api.login(email, password);
  authEvents.emit('login:success', { userId: result.id, token: result.token });
}
```

```typescript
// SidebarViewModel.ts
import { authEvents } from '../events/auth-events';

class SidebarViewModel {
  private _unsub: (() => void)[] = [];

  constructor() {
    this._unsub.push(
      authEvents.on('logout', () => this.reset()),
      authEvents.on('login:success', (e) => this.loadUserData(e.userId)),
    );
  }

  dispose() {
    this._unsub.forEach(f => f());
  }
}
```

The `SidebarViewModel` knows about auth events without knowing about the `AuthModel`. They're decoupled through the typed event contract. This is the same pattern that makes it easy to test `SidebarViewModel` in isolation — you just emit events on the `authEvents` emitter directly in tests, without setting up the full auth flow.

---

## Comparison With the Alternatives

**Node.js `EventEmitter`**: Untyped. Inheriting from it couples your class to Node's module system, which breaks in browser-only environments. Works fine in Node, but wrong tool for isomorphic code.

**Browser `EventTarget` / `dispatchEvent`**: Typed on the surface (you can use typed `CustomEvent<T>`), but the typing is fragile — `addEventListener` accepts any `EventListener` and the relationship between event name and type isn't enforced by the API. Verbose. `CustomEvent` construction is boilerplate.

**`mitt`**: Tiny (~200 bytes) and typed. Similar in spirit. No `once`. No error handling. No `listenerCount`. Good for minimal needs. `event-emitter-core` is more complete.

**`eventemitter3`**: Popular, Node-compatible, performant. Not typed by design (TypeScript types are added by community packages). `event-emitter-core` is typed by design — the event map is the primary abstraction.

**RxJS `Subject`**: Extremely powerful, but each event is a separate Subject — there's no shared event name registry. You'd need to build that yourself. Also introduces RxJS as a dependency. `event-emitter-core` has zero dependencies and doesn't assume you're using RxJS.

---

## Under the Hood

The implementation uses a `Map<EventName, Set<Listener>>`. Each event name maps to a `Set` of listener functions. `emit` iterates the set, wrapping each call in a try/catch.

`Set` gives you O(1) add and delete. Iterating over a snapshot (`Array.from(callbacks)`) protects against listeners that remove themselves during emission. The full implementation is under 130 lines.

The `EventArgs` type utility extracts the payload type from the event map:

```typescript
type EventArgs<TEvents, TKey extends keyof TEvents> =
  TEvents[TKey] extends undefined | void ? [] :
  TEvents[TKey] extends unknown[]        ? TEvents[TKey] :
  [TEvents[TKey]];
```

This allows `void` events to be emitted with no arguments, array payloads to be spread as variadic args, and single-value payloads to be wrapped in a tuple — all without the call site needing to care about which case applies.

---

## Installing

```bash
npm install @web-loom/event-emitter-core
```

Zero dependencies. Works in browser, Node.js, Deno, Bun. TypeScript 4.7+ required for the conditional type machinery.

---

Next in the series: `@web-loom/event-bus-core`, which builds on this emitter to provide application-level typed pub/sub with feature isolation.
