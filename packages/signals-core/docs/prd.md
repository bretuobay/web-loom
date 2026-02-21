# `@web-loom/signals-core` — Product Requirements Document

**Version:** 1.0.0 (Draft)
**Status:** Proposed
**Owner:** Web Loom Core Team

---

## 1. Executive Summary

Build a **lightweight, dependency-free signals core** for the Web Loom toolkit: reactive primitives for **state**, **derived values**, and **effects** that work in vanilla TS/JS and can be adapted to any UI framework.

Inspired by:
- **TC39 proposal-signals**: core graph/auto-tracking model as a foundation for frameworks.
- **Angular Signals**: lazy + memoized computed, dynamic dependency tracking, `untracked`, `asReadonly`.
- **Preact Signals**: `batch`, effect cleanup/disposal, `peek`, "read without subscribing" patterns.

---

## 2. Background & Motivation

Web Loom champions framework-agnostic architecture. Reactivity is currently achieved primarily through RxJS (in `@web-loom/mvvm-core` and `@web-loom/store-core`). RxJS is powerful for complex async streams, but the Signals pattern offers complementary benefits:

- **Simplicity & Ergonomics**: A straightforward API for state and derived values, reducing boilerplate vs. Subjects and operator pipelines.
- **Granular Reactivity**: Fine-grained updates without memoization selectors or deep comparisons.
- **Framework Interoperability**: A standards-aligned core (TC39-compatible) allows consumption by any framework natively or via thin adapters.
- **Ecosystem Alignment**: Signals are becoming a ubiquitous pattern. A native implementation positions Web Loom as modern and forward-thinking.

> Signals are **not** a replacement for RxJS — they coexist. Use signals for synchronous state and derived values; use RxJS for complex async streams, event handling, and pipelines.

---

## 3. Goals

1. **Framework-agnostic core** usable from any environment (browser, Node, workers).
2. **Tiny & fast**: minimal allocations, predictable update propagation. Target: **< 1.5 kB gzipped**.
3. **Ergonomic TS API**: 100% TypeScript, easy to learn, hard to misuse.
4. **Auto-tracking**: `computed` and `effect` track dependencies via reads (dynamic deps).
5. **Lazy memoized computed**: compute only when read; cache until invalidated.
6. **Batching**: combine multiple writes into one notification flush.
7. **Escape hatches**: `untracked()` and `peek()` to read without tracking.
8. **Disposal**: effects return a handle with `.dispose()`; support cleanup callbacks.
9. **No dependencies**: zero runtime dependencies.

---

## 4. Non-Goals

- No DOM rendering, templating, JSX, or framework-specific hooks (those live in adapters).
- No async primitives (resources/queries) in `signals-core` — can be layered in `query-core`.
- No proxy-based deep reactivity by default (keep it explicit and predictable).
- No scheduler integration beyond a minimal batching/flush strategy.
- No replacement of RxJS for complex async operations.
- Framework adapters are separate packages (e.g., `@web-loom/signals-react`).

---

## 5. Target Audience

- Web Loom consumers writing ViewModels/stores that must work across frameworks.
- Library authors building adapters for React, Vue, Angular, Lit, etc.
- App developers wanting a small reactive core without pulling in a full framework.
- Teams sharing reactive state across micro-frontends.

---

## 6. API Specification

### 6.1 Core Types

```ts
export type Equals<T> = (a: T, b: T) => boolean;

export interface SignalOptions<T> {
  /** Custom equality check. Defaults to Object.is. */
  equals?: Equals<T>;
  debugName?: string;
}

export interface ComputedOptions<T> extends SignalOptions<T> {}

export interface EffectOptions {
  debugName?: string;
}

/** Base read-only interface for all signal types. */
export interface ReadonlySignal<T> {
  /** Read the current value. Tracked inside computed/effect contexts. */
  get(): T;

  /** Read without tracking — never establishes a dependency. */
  peek(): T;

  /** Optional: low-level subscription for adapter authors; returns unsubscribe. */
  subscribe?(fn: () => void): () => void;
}

/** Writable signal. */
export interface WritableSignal<T> extends ReadonlySignal<T> {
  /** Set a new value. Uses equals (default Object.is) — no-op if equal. */
  set(next: T): void;

  /** Update based on previous value. */
  update(fn: (prev: T) => T): void;

  /** Returns a read-only view that cannot be written to. */
  asReadonly(): ReadonlySignal<T>;
}

/** Computed (derived, read-only). */
export interface Computed<T> extends ReadonlySignal<T> {}

/** Handle returned by effect(); used to stop the effect. */
export interface EffectHandle {
  /** Stop tracking and prevent future executions. Releases all dependencies. */
  dispose(): void;
}
```

### 6.2 Constructors

```ts
/** Create a writable signal with an initial value. */
export function signal<T>(initial: T, options?: SignalOptions<T>): WritableSignal<T>;

/**
 * Create a derived, lazy, memoized computed signal.
 * The derive function runs only on first get() and after any dependency changes.
 * Dependencies are dynamic: only signals read during derive are tracked.
 */
export function computed<T>(derive: () => T, options?: ComputedOptions<T>): Computed<T>;

/**
 * Create a reactive side effect.
 * - Runs immediately once on creation.
 * - Re-runs whenever any tracked dependency changes.
 * - If fn returns a cleanup function, that cleanup runs before the next re-run.
 * - Returns a handle with .dispose() to stop the effect and release dependencies.
 */
export function effect(
  fn: () => void | (() => void),
  options?: EffectOptions
): EffectHandle;
```

### 6.3 Control Utilities

```ts
/**
 * Execute fn without collecting dependencies.
 * Any signal.get() inside fn will NOT be tracked by the outer computed/effect.
 */
export function untracked<T>(fn: () => T): T;

/**
 * Batch multiple signal writes into a single notification flush.
 * - Nested batches are allowed.
 * - Flush (and effect reruns) happen once the outermost batch completes.
 * - Reading a written signal inside the batch returns the updated value.
 */
export function batch<T>(fn: () => T): T;

/**
 * Force-flush all pending effects.
 * Useful in adapters and testing to process pending effects synchronously.
 */
export function flush(): void;
```

### 6.4 Type Guards

```ts
/** Returns true if value is any kind of signal (readable or writable). */
export function isSignal(value: unknown): value is ReadonlySignal<unknown>;

/** Returns true if value is a WritableSignal (has set/update/asReadonly). */
export function isWritableSignal(value: unknown): value is WritableSignal<unknown>;
```

### 6.5 Subtle API (for adapters & tooling)

Not required for v1, but recommended for first-class framework adapters. Positioned under a `subtle` namespace to signal advanced usage (mirrors TC39 proposal).

```ts
export const subtle: {
  /**
   * Subscribe to invalidation (not value). Called when sig becomes dirty.
   * Used by view-layer bindings to schedule re-renders without re-running logic.
   * Returns an unsubscribe function.
   */
  watch(sig: ReadonlySignal<any>, fn: () => void): () => void;

  /** Optional introspection for devtools/testing. */
  introspect?: {
    sources(sig: ReadonlySignal<any>): ReadonlySignal<any>[];
    sinks(sig: ReadonlySignal<any>): ReadonlySignal<any>[];
  };
};
```

---

## 7. Behavioral Requirements

### 7.1 Dependency Tracking

- `signal.get()` inside `computed()` or `effect()` establishes a dependency.
- `signal.peek()` and `untracked(() => signal.get())` do **not** establish dependencies.
- Dependency sets are **dynamic**: if a branch no longer reads a signal, it is removed.

### 7.2 Computed

- **Lazy**: derive function runs only when `get()` is called, not on creation.
- **Memoized**: result is cached; invalidated when any dependency changes.
- **Dirty flag**: when a dependency changes, the computed is marked dirty but not recomputed until the next `get()`.
- **Equality**: computed uses `options.equals` to decide whether to notify its own dependents.

### 7.3 Effects

- Runs **once immediately** on creation to establish initial dependencies.
- Any dependency change **schedules a rerun** (via microtask or sync-after-batch).
- **Cleanup support**: if fn returns a function, that function runs before the next rerun (and on dispose).
- **Disposal**: `dispose()` stops future reruns, clears all tracked dependencies.

### 7.4 Batching

- During `batch()`, multiple writes coalesce — effects and computeds are not notified mid-batch.
- Reading a written signal inside the same batch returns the **updated** value (no stale reads).
- Nested `batch()` calls are supported; flush occurs when the outermost batch completes.

### 7.5 Equality

- Default equality: `Object.is` referential equality.
- If `equals(prev, next)` returns `true`, the write is a no-op: no invalidation, no notifications.
- Both `signal()` and `computed()` support custom `equals` via options.

---

## 8. Integration with Web Loom

### `@web-loom/mvvm-core`

ViewModels can expose state as signals alongside existing RxJS observables:

```ts
import { signal, computed } from '@web-loom/signals-core';

class CounterViewModel {
  private _count = signal(0);
  public readonly count = this._count.asReadonly();
  public readonly doubleCount = computed(() => this._count.get() * 2);

  increment() {
    this._count.update((v) => v + 1);
  }

  dispose() {
    // dispose any effects created in the ViewModel
  }
}
```

### `@web-loom/store-core`

A store can be built as a collection of signals, offering a lighter-weight alternative to RxJS-backed stores for simple UI state (theme, sidebar, modal visibility):

```ts
import { signal } from '@web-loom/signals-core';

const theme = signal<'light' | 'dark'>('light');
const sidebarOpen = signal(false);
```

---

## 9. Developer Experience Requirements

- 100% TypeScript definitions.
- `debugName` on all options for easier devtools identification.
- Dev-mode warnings:
  - Write-during-computation protection (signal set inside a `computed` derive).
  - Circular dependency detection.
- `subtle.introspect` for testing dependency graphs.

---

## 10. Examples

### State + computed

```ts
const count = signal(0);
const double = computed(() => count.get() * 2);

count.set(2);
double.get(); // 4
```

### Effect with cleanup and disposal

```ts
const name = signal('Jane');

const handle = effect(() => {
  console.log('Hello', name.get());
  return () => console.log('cleanup');
});

name.set('John'); // logs: cleanup → Hello John
handle.dispose();
name.set('Alice'); // no output
```

### Untracked read

```ts
const currentUser = signal('A');
const counter = signal(0);

effect(() => {
  const u = currentUser.get();               // tracked
  const c = untracked(() => counter.get());  // NOT tracked
  console.log(u, c);
});

counter.set(1); // no rerun — counter was not tracked
currentUser.set('B'); // reruns
```

### Batch updates

```ts
const first = signal('Jane');
const last = signal('Doe');
const full = computed(() => `${first.get()} ${last.get()}`);

batch(() => {
  first.set('John');
  last.set('Smith');
});
// full is only recomputed once, downstream effects run once
```

### peek without tracking

```ts
const a = signal(1);
const b = signal(10);

const result = computed(() => {
  return a.get() + b.peek(); // only a is a tracked dependency
});

b.set(20);
result.get(); // still uses cached value — b change didn't invalidate
a.set(2);
result.get(); // recomputes: 2 + 20 = 22
```

### WritableSignal encapsulation

```ts
class Store {
  private _items = signal<string[]>([]);
  public readonly items = this._items.asReadonly();

  add(item: string) {
    this._items.update((prev) => [...prev, item]);
  }
}
```

---

## 11. Implementation Notes

- Maintain a global **"currently tracking" context stack** so reads inside `computed`/`effect` can register dependencies.
- Computeds store: cached value, dirty flag, list of source signals.
- When a state signal writes:
  - Mark dependent computeds dirty.
  - Schedule dependent effects for rerun.
- **Batching**: maintain a `batchDepth` counter; queue pending effects; flush when depth returns to 0.
- **Effect scheduler**: use microtask scheduling (`queueMicrotask`) for effect reruns, except when inside `batch()` (flush synchronously after batch).
- Error handling: errors thrown inside `computed` should propagate on `get()`. Errors in `effect` should not silence silently — expose them or provide an `onError` hook.

---

## 12. Acceptance Criteria (Definition of Done)

1. API matches sections 6–7.
2. Unit tests demonstrate:
   - [ ] Lazy computed (not evaluated until `get()`)
   - [ ] Memoization (derive not called again if no deps changed)
   - [ ] Dynamic dependencies (dep removed when branch no longer reads it)
   - [ ] Effect cleanup runs before rerun
   - [ ] Effect disposal stops reruns
   - [ ] `untracked` and `peek` do not establish dependencies
   - [ ] `batch` coalesces multiple writes into one flush
   - [ ] `equals` prevents updates when values are deeply equal
   - [ ] `asReadonly` hides `set`/`update` from consumers
   - [ ] `isSignal` and `isWritableSignal` type guards
3. Bundle size: core under **1.5 kB gzipped** (measured in CI).
4. Runs in: Node LTS, modern evergreen browsers.
5. Zero runtime dependencies.
6. No TypeScript errors with strict mode enabled.

---

## 13. Success Metrics

- **Adoption**: Used internally by `@web-loom/store-core` and `@web-loom/mvvm-core`.
- **Performance**: Outperforms equivalent RxJS-based state in scenarios with frequent, simple updates (UI toggles, form inputs).
- **Bundle Size**: Remains under 1.5 kB gzipped.
- **Correctness**: Passes comprehensive test suite covering glitch-free execution, lazy evaluation, and proper cleanup.
- **Developer Feedback**: Positive reception on API simplicity and predictability from early adopters.

---

## 14. Rollout Plan

| Version | Scope |
|---------|-------|
| **v0.1** | `signal`, `computed`, `effect`, `batch`, `untracked`, `flush`, `isSignal`, `isWritableSignal` |
| **v0.2** | `subtle.watch` for adapters; optional `subtle.introspect` for devtools/testing |
| **v1.0** | Stable semantics; publish adapter packages (`@web-loom/signals-react`, etc.) |

---

## 15. Future Considerations (Post-MVP)

- **Framework adapters**: `@web-loom/signals-react`, `@web-loom/signals-vue`, `@web-loom/signals-lit` — allow signals to trigger framework re-renders automatically.
- **`linkedSignal`**: A writable signal whose value is derived from and syncs with another signal (Angular advanced pattern).
- **Resource API**: A signal-based primitive for async operations (loading, error, data states) to complement `@web-loom/query-core`.
- **RxJS interop**: Utilities to bridge `Signal<T>` ↔ `Observable<T>` for teams mixing both paradigms.
- **Integration with `@web-loom/query-core`**: Use signals to surface loading/data/error states from query results.

---

## 16. Open Questions

| Question | Options | Recommendation |
|----------|---------|---------------|
| Getter style: `.get()` vs `.value` property? | `.get()` (TC39-explicit) vs `.value` (Preact-ergonomic) | Start with `.get()` for clarity and future-proofing |
| Effect scheduling: microtask vs synchronous? | Microtask (async, batched) vs sync-after-batch | Microtask by default; sync flush available via `flush()` |
| Error handling in computed/effect? | Rethrow on `get()`, `onError` hook, or silent catch | Rethrow on `get()`; provide optional `onError` in EffectOptions |
| Effect cleanup style: return fn vs `onCleanup` callback? | Return `() => void` (Preact) vs `onCleanup(fn)` param (Angular) | Return-based (simpler); `onCleanup` can be added in v0.2 |
| Naming: `signals-core` vs `reactivity-core`? | `@web-loom/signals-core` vs `@web-loom/reactivity-core` | `signals-core` (aligns with ecosystem terminology) |
