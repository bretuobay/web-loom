# `@web-loom/signals-core` — Reactive State Without the Framework Tax

---

The idea that a value change should automatically propagate to everything that depends on it is not new. Spreadsheets have worked this way since VisiCalc in 1979. When you type a new number into cell A1, every cell with a formula referencing A1 updates immediately. No manual wiring. No callbacks to register. You declare the relationship once and the system maintains it.

Frontend frameworks have been re-implementing this idea, in various forms, for fifteen years. And we keep getting it wrong in interesting ways.

---

## The History of Reactivity in the Browser

Knockout.js (2010) used `ko.observable()` — a function that returned a function. You'd call `value()` to read and `value(newVal)` to write. It tracked dependencies automatically by noting which observables were accessed during template evaluation. This was genuinely clever, and it worked — but the syntax was unusual enough that it became a point of friction for adoption.

Angular 1's `$scope` was a different approach: dirty checking. Angular would compare the current state of `$scope` properties against their last known values on every digest cycle. No explicit reactivity, just polling. It had the virtue of working with any plain JavaScript value, but at the cost of performance and the infamous "you need to call `$scope.$apply()`" footgun when updates happened outside Angular's awareness.

Vue 2 used `Object.defineProperty` to intercept reads and writes on reactive objects. Elegant, but it couldn't detect property additions or array mutations by index. `Vue.set()` existed specifically to paper over these limitations.

Vue 3 moved to `Proxy`, which solved most of those edge cases. React introduced hooks in 2018 — `useState` and `useEffect` — which are not reactive in the signals sense. Every state update schedules a re-render of the whole component. React's model is "re-run the function," not "propagate the change to dependents."

Svelte 5 introduced Runes (`$state`, `$derived`, `$effect`) in 2024. Preact added `@preact/signals-react`. Solid has had fine-grained signals since its inception. Angular 17 added `signal()` to its core. The entire frontend ecosystem is converging on signals.

The insight that's driving this convergence: when you know exactly which values a computation depends on, you can re-run only that computation when those values change — instead of re-running everything and diffing the output.

---

## What `@web-loom/signals-core` Provides

The package has zero runtime dependencies. It's about 900 bytes minified and gzipped. It exports four things: `signal`, `computed`, `effect`, and `batch`. There are supporting utilities: `untracked`, `isSignal`, `isWritableSignal`, and `flush`.

The design is deliberately close to the TC39 Signals proposal and the patterns used in Angular, Preact, and Solid — familiar territory for engineers who've used any of those.

### `signal`

A writable reactive container for a single value.

```typescript
import { signal } from '@web-loom/signals-core';

const count = signal(0);

count.get();        // → 0 (tracked — establishes dependency if in computed/effect)
count.peek();       // → 0 (untracked — never establishes dependency)
count.set(1);       // notify all dependents
count.update(n => n + 1); // update from previous value → 2
```

The `equals` option lets you control when a change triggers notification:

```typescript
const list = signal<string[]>([], {
  equals: (a, b) => a.length === b.length && a.every((v, i) => v === b[i]),
});

list.set(['a', 'b']); // notifies
list.set(['a', 'b']); // same content → no notification
```

`asReadonly()` strips the write interface, useful for exposing signals from a class without allowing external mutation:

```typescript
class CounterViewModel {
  private _count = signal(0);
  readonly count = this._count.asReadonly(); // consumers can read, not write

  increment() { this._count.update(n => n + 1); }
}
```

### `computed`

A derived value that's automatically recalculated when its dependencies change. Computeds are lazy — they only run when read (or subscribed to), not on every dependency change.

```typescript
import { signal, computed } from '@web-loom/signals-core';

const firstName = signal('Ada');
const lastName  = signal('Lovelace');

const fullName = computed(() => `${firstName.get()} ${lastName.get()}`);

console.log(fullName.get()); // → 'Ada Lovelace'

firstName.set('Grace');
console.log(fullName.get()); // → 'Grace Lovelace'
```

Computed values are read-only — they don't have `set` or `update`. They're memoised: if you call `.get()` multiple times without the dependencies changing, the function only runs once.

You can compose computeds:

```typescript
const tasks      = signal<Task[]>([]);
const filter     = signal<'all' | 'pending' | 'done'>('all');

const filtered = computed(() => {
  const all = tasks.get();
  const f   = filter.get();
  if (f === 'pending') return all.filter(t => !t.done);
  if (f === 'done')    return all.filter(t => t.done);
  return all;
});

const pendingCount = computed(() => filtered.get().filter(t => !t.done).length);
```

Changing `tasks` or `filter` recalculates `filtered`. Changing `filtered`'s output recalculates `pendingCount`. Nothing else runs.

### `effect`

A side effect that runs whenever its signal dependencies change.

```typescript
import { signal, effect } from '@web-loom/signals-core';

const theme = signal<'light' | 'dark'>('light');

const stop = effect(() => {
  document.documentElement.classList.toggle('dark', theme.get() === 'dark');
});

theme.set('dark'); // effect runs, adds 'dark' class

stop(); // tear down the effect
```

Effects track dependencies automatically — any signal read inside the function body during a run becomes a dependency. If those signals change, the effect re-runs.

The return value of `effect()` is a cleanup function. Always hold onto it and call it when the effect is no longer needed.

```typescript
// In a web component
connectedCallback() {
  this._stopEffect = effect(() => {
    this.innerHTML = `<p>${this.vm.message.get()}</p>`;
  });
}

disconnectedCallback() {
  this._stopEffect();
}
```

### `batch`

Multiple signal updates that should not trigger intermediate effect runs.

```typescript
import { signal, effect, batch } from '@web-loom/signals-core';

const x = signal(0);
const y = signal(0);

effect(() => console.log(`position: ${x.get()}, ${y.get()}`));
// logs: 'position: 0, 0'

batch(() => {
  x.set(10);
  y.set(20);
});
// logs: 'position: 10, 20' — once, not twice
```

Without `batch`, each `set` would trigger the effect independently. With `batch`, all updates within the callback are committed at once and dependents are notified once.

---

## Where This Fits in the Web Loom Architecture

`@web-loom/signals-core` is designed for cases where RxJS is heavier than you need. RxJS is powerful — operators for debouncing, switching, combining streams, back-pressure — but it has a learning curve and a runtime cost. For ViewModels that only need to expose a few reactive values with simple derivations, signals are lighter and more readable.

The two systems can coexist. A ViewModel might use RxJS for complex async orchestration and expose a few signals for simple UI state:

```typescript
class SearchViewModel extends BaseViewModel<SearchModel> {
  // RxJS for async: debounce, switchMap, cancel in-flight requests
  readonly results$ = this.query$.pipe(
    debounceTime(300),
    distinctUntilChanged(),
    switchMap(q => this.model.search(q)),
  );

  // Signal for simple UI state
  readonly isFilterOpen = signal(false);
  readonly sortOrder    = signal<'asc' | 'desc'>('asc');
}
```

---

## How Different Frameworks Handle Reactivity

It's instructive to compare `@web-loom/signals-core` to what the major frameworks provide, because the patterns are converging on the same primitives — the differences are mostly in syntax and integration depth.

**Angular signals** (`signal()`, `computed()`, `effect()`) are almost identical in API to `signals-core`. Angular's change detection now uses signals to know which components to update, meaning fine-grained updates without zone.js. The difference: Angular's signals are deeply integrated with the template compiler. `signals-core` is framework-agnostic — it's the same idea with no framework coupling.

**Preact signals** (`@preact/signals`) take an even more integration-heavy approach: a signal's value is read directly in JSX (`{count}` instead of `{count.get()}`), and Preact's runtime bypasses the component update cycle entirely when a signal changes — only the DOM node that reads the signal updates. This is impressive for performance, but it requires Preact's renderer. `signals-core` doesn't offer this level of integration, but it also doesn't require a specific renderer.

**Solid's createSignal** returns a getter and a setter tuple (`[get, set]`). Dependencies are tracked by calling the getter. Solid's fine-grained reactivity means the component function runs once and only the reactive expressions inside re-run. `signals-core` is philosophically similar; the difference is that Solid's system is coupled to its renderer.

**Vue 3's ref and reactive** are Proxy-based. `ref(0)` creates an object with a `.value` property. Reading `.value` inside `computed()` or `watchEffect()` establishes a dependency. The ergonomics differ — you always access through `.value` — but the underlying model is the same push-based dependency tracking.

**Svelte 5 runes** (`$state`, `$derived`, `$effect`) are compiler-transformed. The source looks like plain variable assignments (`let count = $state(0); count++`), but the compiler rewrites them into reactive subscriptions. Beautiful ergonomics, impossible without the compiler.

`@web-loom/signals-core` sits in the Angular/Preact signals space: runtime signals with explicit `.get()` / `.set()` calls, no compiler required, framework-agnostic by design.

---

## Using Signals Without a Framework

This is the package's headline feature. You can use it in a Web Component, a vanilla TypeScript module, or a Node.js script — anywhere you'd otherwise reach for a closure over a mutable variable.

```typescript
// A standalone counter module — no framework
import { signal, computed, effect } from '@web-loom/signals-core';

export function createCounter(initial = 0) {
  const count    = signal(initial);
  const doubled  = computed(() => count.get() * 2);
  const isEven   = computed(() => count.get() % 2 === 0);

  return {
    count:   count.asReadonly(),
    doubled: doubled,
    isEven:  isEven,
    increment: ()              => count.update(n => n + 1),
    decrement: ()              => count.update(n => n - 1),
    reset:     ()              => count.set(initial),
  };
}

// Usage
const counter = createCounter(5);

const stop = effect(() => {
  console.log(`count=${counter.count.get()}, doubled=${counter.doubled.get()}`);
});

counter.increment(); // logs: count=6, doubled=12
counter.increment(); // logs: count=7, doubled=14
stop();
```

No JSX. No component lifecycle. No `useEffect`. Just reactive state that works wherever JavaScript runs.

---

## Testing Signals

Because signals are synchronous and have no framework coupling, they're trivial to test.

```typescript
import { describe, it, expect, vi } from 'vitest';
import { signal, computed, effect } from '@web-loom/signals-core';

describe('computed', () => {
  it('updates when dependency changes', () => {
    const a = signal(2);
    const b = signal(3);
    const sum = computed(() => a.get() + b.get());

    expect(sum.get()).toBe(5);
    a.set(10);
    expect(sum.get()).toBe(13);
  });

  it('does not recompute when unrelated signal changes', () => {
    const a = signal(1);
    const b = signal(100);
    const fn = vi.fn(() => a.get() * 2);
    const derived = computed(fn);

    derived.get(); // first compute
    b.set(200);    // unrelated
    derived.get(); // should use cached value

    expect(fn).toHaveBeenCalledTimes(1);
  });
});
```

---

## Installing

```bash
npm install @web-loom/signals-core
```

Zero dependencies. Works in browser and Node.js environments. TypeScript types included.

The package is aligned with the TC39 Signals proposal direction — as that proposal stabilises, the API should feel familiar. In the meantime, you get a production-ready implementation today.

---

Next in the series: `@web-loom/event-emitter-core`, the typed event emitter that sits underneath most of Web Loom's pub/sub infrastructure.
