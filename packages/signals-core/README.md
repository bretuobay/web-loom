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

// Derived computed (lazy, memoized)
const doubled = computed(() => count.get() * 2);

// Side effect — runs immediately, reruns when dependencies change
const handle = effect(() => {
  console.log('count:', count.get(), 'doubled:', doubled.get());
  return () => console.log('cleanup');
});

count.set(5); // logs: cleanup  count: 5  doubled: 10

// Batch multiple updates into a single notification flush
batch(() => {
  count.set(10);
  count.set(20);
}); // effect runs once with final value

// Stop the effect
handle.dispose();
```

---

## API

### `signal<T>(initial: T, options?: SignalOptions<T>): WritableSignal<T>`

Creates a writable reactive value.

```ts
const name = signal('Alice');

name.get();              // read — tracked inside computed/effect
name.peek();             // read without tracking (no dependency registered)
name.set('Bob');         // write — notifies subscribers if value changed
name.update(v => v + '!'); // update based on previous value
name.asReadonly();       // returns a ReadonlySignal view (hides set/update)
name.subscribe(fn);      // low-level subscription — returns unsubscribe fn
```

#### `WritableSignal<T>` interface

```ts
interface WritableSignal<T> {
  get(): T;
  peek(): T;
  set(next: T): void;
  update(fn: (prev: T) => T): void;
  asReadonly(): ReadonlySignal<T>;
  subscribe(fn: () => void): () => void;
}
```

#### `ReadonlySignal<T>` interface

```ts
interface ReadonlySignal<T> {
  get(): T;
  peek(): T;
  subscribe(fn: () => void): () => void;
}
```

#### `SignalOptions<T>`

```ts
interface SignalOptions<T> {
  /** Custom equality check. Defaults to Object.is. */
  equals?: (a: T, b: T) => boolean;
  debugName?: string;
}
```

```ts
signal(value, {
  equals: (a, b) => a === b, // custom equality — default is Object.is
  debugName: 'mySignal',
});
```

---

### `computed<T>(derive: () => T, options?: ComputedOptions<T>): Computed<T>`

Creates a lazy, memoized derived value. Recomputes only when a dependency changes and `get()` is called. `Computed<T>` is an alias for `ReadonlySignal<T>`.

```ts
const greeting = computed(() => `Hello, ${name.get()}!`);

greeting.get();       // 'Hello, Bob!' — tracked read
greeting.peek();      // read without tracking
greeting.subscribe(fn); // subscribe — returns unsubscribe fn
```

#### `ComputedOptions<T>`

```ts
interface ComputedOptions<T> {
  /** Custom equality check for the derived value. Defaults to Object.is. */
  equals?: (a: T, b: T) => boolean;
  debugName?: string;
}
```

```ts
computed(() => expensiveDerive(), {
  equals: (a, b) => a.id === b.id, // suppress downstream notification when equal
  debugName: 'myComputed',
});
```

---

### `effect(fn: EffectFn, options?: EffectOptions): EffectHandle`

Runs `fn` immediately and reruns whenever any signal read inside `fn` changes. Returns an `EffectHandle` with a `dispose()` method.

If `fn` returns a function, that function is called as cleanup before each rerun and on final disposal.

```ts
const handle = effect(() => {
  document.title = `Count: ${count.get()}`;
  return () => { /* cleanup before next run */ };
});

handle.dispose(); // stop the effect, run final cleanup
```

```ts
effect(fn, { debugName: 'titleEffect' });
```

#### `EffectHandle`

```ts
interface EffectHandle {
  dispose(): void;
}
```

#### `EffectFn` / `CleanupFn`

```ts
type CleanupFn = () => void;
type EffectFn  = () => void | CleanupFn;
```

#### `EffectOptions`

```ts
interface EffectOptions {
  debugName?: string;
}
```

---

### `batch<T>(fn: () => T): T`

Defers all signal notifications until `fn` completes, coalescing multiple writes into a single flush. Returns the value returned by `fn`. Nested batches are supported.

```ts
const result = batch(() => {
  a.set(1);
  b.set(2);
  c.set(3);
  return 'done';
}); // subscribers notified once; result === 'done'
```

---

### `untracked<T>(fn: () => T): T`

Executes `fn` without registering any signal reads as dependencies. Use this inside `computed` or `effect` to read a signal without tracking it.

```ts
const a = signal(1);
const b = signal(10);

effect(() => {
  const val = a.get();                    // tracked — effect reruns when a changes
  const snapshot = untracked(() => b.get()); // NOT tracked — b changes won't rerun the effect
  console.log(val, snapshot);
});
```

---

### `flush(): void`

Force-processes any pending batched notifications synchronously. Useful in adapters and tests.

```ts
flush();
```

---

### `isSignal(value: unknown): value is ReadonlySignal<unknown>`

### `isWritableSignal(value: unknown): value is WritableSignal<unknown>`

Type guards for duck-typing signal instances.

```ts
import { isSignal, isWritableSignal } from '@web-loom/signals-core';

isSignal(signal(0));           // true
isSignal(computed(() => 1));   // true
isSignal(42);                  // false

isWritableSignal(signal(0));              // true
isWritableSignal(signal(0).asReadonly()); // false
isWritableSignal(computed(() => 1));      // false
```

---

## Encapsulation pattern

Use `asReadonly()` to expose state without allowing external writes — mirrors Angular's encapsulation pattern.

```ts
class CounterViewModel {
  private _count = signal(0);

  readonly count = this._count.asReadonly();
  readonly doubled = computed(() => this._count.get() * 2);

  increment() {
    this._count.update((v) => v + 1);
  }
}
```

---

## TypeScript types

All types are exported from the package root:

```ts
import type {
  ReadonlySignal,
  WritableSignal,
  SignalOptions,
  Equals,
  Computed,
  ComputedOptions,
  EffectHandle,
  EffectFn,
  CleanupFn,
  EffectOptions,
} from '@web-loom/signals-core';
```

---

## Design notes

- **Zero dependencies** — no RxJS, no external runtime
- **Lazy computed** — derived values only recompute on `get()` after a dependency changes; never recomputes eagerly
- **Dynamic dependency tracking** — only signals actually read during a computation are tracked; stale deps are cleared automatically
- **Custom equality** — both `signal()` and `computed()` accept an `equals` option; write is a no-op when `equals(prev, next)` returns true
- **Effect cleanup** — returning a function from an effect registers it as cleanup, called before each rerun and on `dispose()`
- **Batching** — nested `batch()` calls are safe; the flush happens once at the outermost boundary
