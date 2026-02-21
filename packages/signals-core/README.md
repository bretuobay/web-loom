# @web-loom/signals-core

Framework-agnostic reactive signals with computed values and effects.

## Installation

```bash
npm install @web-loom/signals-core
```

## Quick start

```ts
import { signal, computed, effect, batch } from '@web-loom/signals-core';

// Writable signal
const count = signal(0);

// Derived computed (lazy, cached)
const doubled = computed(() => count.value * 2);

// Side effect (runs immediately, reruns on dependency change)
const dispose = effect(() => {
  console.log('count:', count.value, 'doubled:', doubled.value);
});

count.value = 5; // logs: count: 5  doubled: 10

// Batch multiple updates into a single notification
batch(() => {
  count.value = 10;
  count.value = 20;
}); // effect runs once with final value

// Clean up
dispose();
```

## API

### `signal<T>(initialValue: T): Signal<T>`

Creates a writable reactive value.

```ts
const name = signal('Alice');
name.value;         // read (tracked inside computed/effect)
name.peek();        // read without tracking
name.value = 'Bob'; // write — notifies subscribers
name.subscribe(fn); // subscribe directly — returns unsubscribe fn
```

### `computed<T>(fn: () => T): Computed<T>`

Creates a lazy, cached derived value. Recomputes only when dependencies change.

```ts
const greeting = computed(() => `Hello, ${name.value}!`);
greeting.value;  // 'Hello, Bob!'
greeting.peek(); // read without tracking
greeting.subscribe(fn); // subscribe — returns unsubscribe fn
```

### `effect(fn: () => void | (() => void)): () => void`

Runs `fn` immediately and reruns whenever any signal read inside `fn` changes. The optional return value is a cleanup function called before each rerun and on dispose.

```ts
const dispose = effect(() => {
  document.title = `Count: ${count.value}`;
  return () => { /* cleanup */ };
});

dispose(); // stop the effect
```

### `batch(fn: () => void): void`

Defers signal notifications until `fn` completes, coalescing multiple updates into a single notification pass.

```ts
batch(() => {
  a.value = 1;
  b.value = 2;
  c.value = 3;
}); // subscribers notified once
```

## Design notes

- **Zero dependencies** — no RxJS, no external runtime
- **Pull-based computation** — `Computed` values are lazy and only recompute on read after a dependency changes
- **Automatic dependency tracking** — signals read inside `computed()` or `effect()` are tracked automatically
- **Equality check** — signal updates use `Object.is()` to skip redundant notifications
- **Dispose pattern** — `effect()` returns a dispose function; always call it to prevent memory leaks
