# Web Loom Signals (Framework-agnostic) — Product Requirements Document (PRD)

## 1) Summary

Build a **lightweight Signals core** for the Web Loom toolkit: a small, dependency-free reactive primitive for **state**, **derived values**, and **effects** that can be used in **vanilla TS/JS** and adapted into any UI framework.

This PRD proposes an API and semantics inspired by:

- **Angular Signals**: lazy + memoized computed, dynamic dependency tracking, equality functions, and `untracked` reads. ([Angular][1])
- **Preact Signals**: `batch`, `effect` cleanup + disposal, `untracked`, and “read without subscribing” patterns. ([Preact][2])
- **TC39 proposal-signals**: a core graph/auto-tracking model intended as a foundation for frameworks. ([GitHub][3])

---

## 2) Goals

1. **Framework-agnostic core** usable from any environment (browser, Node, workers).
2. **Tiny & fast**: minimal allocations; predictable update propagation.
3. **Ergonomic TS API**: easy to learn, hard to misuse.
4. **Auto-tracking**: `computed` and `effect` track dependencies by reads (dynamic deps). ([Angular][1])
5. **Lazy memoized computed**: compute only when read; cache until invalidated. ([Angular][1])
6. **Batching**: combine multiple writes into one “commit”. ([Preact][2])
7. **Escape hatches**: `untracked()` and `peek()` to read without tracking. ([Angular][1])
8. **Disposal**: effects return a disposer; can return cleanup to run before re-run. ([Preact][2])

---

## 3) Non-goals

- No DOM rendering, templating, JSX integration, or framework-specific hooks (those live in adapters).
- No async primitives (resources/queries) in signals-core (can be layered elsewhere).
- No proxy-based deep reactivity by default (keep it explicit and predictable).
- No scheduler integration beyond a minimal batching/flush strategy.

---

## 4) Target users & use cases

### Users

- Web Loom consumers writing ViewModels / stores that must work across frameworks. ([GitHub][4])
- Library authors building adapters to React/Vue/Angular/Lit/etc.
- App developers wanting a small reactive core without pulling a full framework.

### Use cases

1. Local state: `count` changes update UI bindings through adapters.
2. Derived state: `fullName` computed from `firstName + lastName`.
3. Side effects: persist to storage; log; subscribe to non-reactive APIs. ([Preact][2])
4. Performance: batch multiple updates from a single action. ([Preact][2])
5. Avoiding accidental dependencies: read a signal during an effect without tracking it. ([Angular][1])

---

## 5) Proposed package

- **Name**: `@web-loom/signals-core` (or `@web-loom/reactivity-core`)
- **Exports**: core primitives + types only
- **Dependencies**: none
- **Build**: ESM + CJS + types, tree-shakeable

---

## 6) API (public surface)

### 6.1 Types

```ts
export type Equals<T> = (a: T, b: T) => boolean;

export interface ReadonlySignal<T> {
  /** Read the current value (tracked inside computed/effect). */
  get(): T;

  /** Read without tracking (never establishes dependencies). */
  peek(): T;

  /** Optional: subscribe for adapters; returns unsubscribe. */
  subscribe?(fn: () => void): () => void;
}

export interface Signal<T> extends ReadonlySignal<T> {
  /** Set new value. Uses equals (default Object.is). */
  set(next: T): void;

  /** Update based on previous value. */
  update(fn: (prev: T) => T): void;

  /** Read-only view (cannot set/update). */
  readonly(): ReadonlySignal<T>;
}

export interface Computed<T> extends ReadonlySignal<T> {}

export interface EffectHandle {
  /** Dispose the effect: stop tracking & stop future executions. */
  dispose(): void;
}

export interface SignalOptions<T> {
  equals?: Equals<T>; // default Object.is / referential equality :contentReference[oaicite:12]{index=12}
  debugName?: string;
}

export interface ComputedOptions<T> extends SignalOptions<T> {}
export interface EffectOptions {
  debugName?: string;
}
```

Notes:

- **Tracked read** is `get()` (mirrors the “get()” idea in TC39 and keeps the API explicit). ([GitHub][3])
- `peek()` covers “read without subscribing” (Preact `.peek()` idea). ([Preact][2])
- `equals` matches Angular’s “signal equality functions” concept (avoid notifying on deep-equal updates if you want). ([Angular][1])

---

### 6.2 Constructors

```ts
export function signal<T>(initial: T, options?: SignalOptions<T>): Signal<T>;

export function computed<T>(derive: () => T, options?: ComputedOptions<T>): Computed<T>;

/**
 * Runs fn immediately, tracks any signal.get() reads, and re-runs when they change.
 * - If fn returns a cleanup function, it runs before the next execution. :contentReference[oaicite:16]{index=16}
 * - Returns a handle that can dispose the effect. :contentReference[oaicite:17]{index=17}
 */
export function effect(fn: () => void | (() => void), options?: EffectOptions): EffectHandle;
```

Semantics requirements:

- `computed` is **lazy + memoized**: derive runs only on first `get()` and after invalidation, and its value is cached otherwise. ([Angular][1])
- Dependencies are **dynamic**: only signals actually read during derive/effect are tracked. ([Angular][1])

---

### 6.3 Control utilities

```ts
/** Execute fn without collecting dependencies (no tracking). */
export function untracked<T>(fn: () => T): T; // Angular/Preact concept :contentReference[oaicite:20]{index=20}

/**
 * Batch multiple writes into one commit.
 * - Nested batches are allowed.
 * - Flush happens once outermost completes. :contentReference[oaicite:21]{index=21}
 */
export function batch<T>(fn: () => T): T;

/** Optional: for adapters/testing; forces processing pending effects. */
export function flush(): void;
```

---

## 7) Behavioral requirements (must be true)

### 7.1 Tracking

- Calling `signal.get()` inside `computed()` or `effect()` establishes a dependency.
- Calling `peek()` or `untracked(() => signal.get())` does **not** establish a dependency. ([Angular][1])

### 7.2 Computed

- Lazy evaluation + memoization. ([Angular][1])
- Invalidation: when any dependency changes, computed becomes “dirty” but does not recompute until `get()` is called.
- Dynamic dependency set: if a branch stops reading a signal, it is removed from dependencies. ([Angular][1])
- Equality: computed may use `options.equals` to decide whether its downstream dependents should be notified.

### 7.3 Effects

- An effect runs once immediately on creation.
- Any dependency change schedules a rerun.
- Cleanup function support: if the effect callback returns a function, it runs before the next rerun. ([Preact][2])
- Disposal: `effect()` returns a handle that stops future reruns and releases dependencies. ([Preact][2])

### 7.4 Batching

- During `batch()`, multiple writes coalesce into one notification flush at the end. ([Preact][2])
- Reading a signal after it’s written inside the same batch returns the updated value (no “stale reads”). ([Preact][2])

### 7.5 Equality

- Default equality uses `Object.is`-style referential equality. ([Angular][1])
- If `equals(prev, next)` is true, the write is a no-op (no invalidation / notifications).

---

## 8) Developer experience requirements

- 100% TypeScript definitions.
- Clear error messages in dev mode (optional build flag):
  - “Signal writes during computation” protection can be optionally enabled (TC39 discusses “frozen” graph moments; you can decide a simpler dev-only check). ([GitHub][3])

- Debug tooling hooks (non-breaking):
  - `debugName` on options
  - optional `onTrack`/`onTrigger` hooks behind a `subtle` namespace (see “Subtle API” below)

---

## 9) Optional “subtle” API (for adapters & tooling)

This is **not** required for v1, but recommended if you want first-class framework adapters. TC39 positions “subtle APIs” as a boundary for advanced usage. ([GitHub][3])

```ts
export const subtle: {
  /** Subscribe to invalidation (not value), used by view-layer bindings. */
  watch(sig: ReadonlySignal<any>, fn: () => void): () => void;

  /** Introspection for devtools/testing (optional). */
  introspect?: {
    sources(sig: ReadonlySignal<any>): ReadonlySignal<any>[];
    sinks(sig: ReadonlySignal<any>): ReadonlySignal<any>[];
  };
};
```

---

## 10) Examples (expected usage)

### Basic state + computed

```ts
const count = signal(0);
const double = computed(() => count.get() * 2);

count.set(2);
double.get(); // 4
```

### Effect with cleanup + dispose (Preact pattern) ([Preact][2])

```ts
const name = signal('Jane');

const handle = effect(() => {
  console.log('Hello', name.get());
  return () => console.log('cleanup');
});

name.set('John'); // cleanup -> Hello John
handle.dispose();
name.set('Alice'); // no output
```

### Avoid tracking a read (Angular/Preact untracked) ([Angular][1])

```ts
const currentUser = signal('A');
const counter = signal(0);

effect(() => {
  const u = currentUser.get();
  const c = untracked(() => counter.get());
  console.log(u, c);
});
```

### Batch updates (Preact batch) ([Preact][2])

```ts
const first = signal('Jane');
const last = signal('Doe');

batch(() => {
  first.set('John');
  last.set('Smith');
});
// downstream effects/computeds see a single flush
```

---

## 11) Implementation notes (how to meet the PRD)

These are _requirements-driving_ notes (not prescribing exact code):

- Maintain a global “currently tracking” stack for `computed/effect` so reads can register dependencies (Angular/TC39 style). ([Angular][1])
- Computeds should store:
  - cached value
  - dirty flag / generation
  - list of source signals

- When a state signal updates:
  - mark dependent computeds dirty
  - schedule dependent effects for rerun

- Batching:
  - keep a `batchDepth` counter
  - queue pending effects; flush when depth returns to 0 ([Preact][2])

---

## 12) Acceptance criteria (Definition of Done)

1. **API** matches sections 6–7.
2. Unit tests demonstrate:
   - lazy computed
   - memoization
   - dynamic dependencies
   - effect cleanup + disposal
   - untracked + peek does not track
   - batching coalesces notifications
   - equals prevents updates

3. Size target: keep core under a small footprint (measure gzip in CI).
4. Works in:
   - Node LTS
   - modern evergreen browsers

5. No dependencies.

---

## 13) Rollout plan

- v0.1: `signal`, `computed`, `effect`, `batch`, `untracked`, `peek`, `equals`.
- v0.2: `subtle.watch` for adapters + optional introspection hooks.
- v1.0: stabilize semantics and publish adapter(s) as separate packages (e.g., `@web-loom/signals-react`, etc.).

---

[1]: https://angular.dev/guide/signals 'Signals • Overview • Angular'
[2]: https://preactjs.com/guide/v10/signals/?source=post_page-----a57aa5c057f4--------------------------------------- 'Signals – Preact Guide'
[3]: https://github.com/tc39/proposal-signals 'GitHub - tc39/proposal-signals: A proposal to add signals to JavaScript.'
[4]: https://github.com/bretuobay/web-loom 'GitHub - bretuobay/web-loom: Web Loom is a lightweight, framework-agnostic toolkit offering MVVM architecture, state stores, event bus utilities, and headless UI behaviors for modern web apps.'
