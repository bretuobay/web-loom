---
series: introducing-web-loom
part: 2
summary: Why a framework-agnostic MVVM toolkit started on RxJS, what that cost, and why it now runs entirely on signals.
---

# From RxJS to Signals: Rebuilding Web Loom's Reactive Core

_Part 2 of 4 in the series "Introducing Web Loom"._

---

In [Part 1](https://webloomframework.com/blog/a-playground-that-grew-into-a-framework) I described Web Loom's central idea. ViewModels hold the presentation logic in plain TypeScript, and the UI framework only appears in a thin View layer at the edge.

That idea has a hard requirement. **The ViewModel needs a way to say "this value changed" that every framework can listen to.** React can't own that mechanism, and nor can Vue or Angular. It has to be neutral.

Web Loom has had two answers to that requirement. This article is about the first one, why I replaced it, and what the second one looks like.

## Why RxJS came first

When I started borrowing ideas from WPF and Prism, the C# side had a clear way of saying a value changed. `INotifyPropertyChanged` raises an event, and the binding system updates the screen. I needed something similar for the web that didn't belong to any framework.

RxJS was the obvious candidate. A `BehaviorSubject` is close to a C# observable property: it holds a current value, and it tells subscribers when that value changes. RxJS works in any JavaScript environment. Angular developers already know it well. Its operators can express almost anything: debouncing, combining streams, cancelling stale requests.

So the first versions of `mvvm-core` were built on it. A model looked roughly like this:

```ts
import { BehaviorSubject, Observable } from 'rxjs';

export class BaseModel<TData> {
  protected _data$ = new BehaviorSubject<TData | null>(null);
  protected _isLoading$ = new BehaviorSubject<boolean>(false);
  // ...exposed to ViewModels as Observables
}
```

It worked. Models and ViewModels were framework-free, and every demo app could subscribe to them.

## What started to hurt

Over time the costs added up, and none of them came from bugs in RxJS. They came from using a streams library to hold state.

**It was heavy for the simple case.** Most of what a ViewModel does is "hold a value, derive another value from it, tell the UI." Here is how the form ViewModel worked out whether a form had unsaved changes:

```ts
this.isDirty$ = this.formData$.pipe(
  map((data) => JSON.stringify(data) !== JSON.stringify(this.initialData)),
  startWith(false),
  distinctUntilChanged(),
);
```

That's three operators to express one comparison. Every developer reading it needed to know what `startWith` and `distinctUntilChanged` were for, and why leaving them out would cause subtle bugs.

**Subscriptions needed bookkeeping.** Every `subscribe` needed a matching `unsubscribe`. `BaseViewModel` piped everything through `takeUntil(this._destroy$)` so that disposing a ViewModel tore down its streams. That approach is correct, but easy to get wrong in derived classes.

**Framework bridges were clumsy.** Here is the React hook the demo app used:

```ts
export function useObservable<T>(observable: Observable<T>, initialValue: T) {
  const [value, setValue] = useState<T>(initialValue);
  useEffect(() => {
    const subscription = observable.subscribe(setValue);
    return () => subscription.unsubscribe();
  }, [observable]);
  return value;
}
```

Notice the `initialValue` parameter. An `Observable` doesn't promise a current value, so every call site had to invent one. That meant a `[]` here, a `false` there and a `null` somewhere else, each a small lie told to the type system until the first emission arrived.

**Readers needed to know two mental models.** To read a Web Loom ViewModel you had to understand MVVM _and_ reactive streams. That second skill is valuable, but it's a lot to ask of someone who only wants a list on a screen.

## Meanwhile, the rest of the web moved to signals

While I was living with those costs, the frontend world was converging on a different primitive: the **signal**.

A signal is a value you can read and write. A computed signal derives a value from other signals and tracks those dependencies automatically. An effect re-runs when the signals it read change. There are no operators, no subscriptions to track by hand, and there is always a current value.

Solid was built on them. Preact added them. Angular adopted signals as its new reactivity model. Vue's `ref` and `computed` have worked this way for years. Most strikingly, there is a [TC39 proposal](https://github.com/tc39/proposal-signals) to add signals to JavaScript itself. Framework authors have been involved in shaping it, so that different libraries could one day share a common reactive core.

For a project whose whole premise is "the ViewModel shouldn't belong to any framework", that convergence mattered. If signals become a language feature, a ViewModel built on signals is about as neutral as a ViewModel can be.

## The migration

In February 2026 I added `@web-loom/signals-core`. It's a small, dependency-free signals library whose API is deliberately close to the TC39 proposal and to what Angular, Preact and Solid developers already know:

```ts
import { signal, computed, effect } from '@web-loom/signals-core';

const count = signal(0);
const doubled = computed(() => count.get() * 2);

effect(() => console.log(`doubled is ${doubled.get()}`)); // logs: doubled is 0
count.set(5); // logs: doubled is 10
```

For a few months, RxJS and signals lived side by side. That turned out to be the worst of both worlds. There were two ways to do everything, both for me and for the AI agents writing much of the code (more on that in [Part 4](https://webloomframework.com/blog/patterns-in-the-age-of-agentic-coding)). In July 2026 I made the call. The commit message says it plainly: _"major refactor to get rid of rxjs and use only signals as base to reduce confusion."_

Every `$`-suffixed property in `mvvm-core` (`data$`, `isLoading$`, `error$`, a command's `isExecuting$` and `canExecute$`) is now a read-only signal. The "unsaved changes" check from earlier became this:

```ts
this.isDirty$ = computed(() => JSON.stringify(this.formData$.get()) !== JSON.stringify(this.initialData));
```

It's the same logic, now written as a single expression, with no operators. The React bridge shrank too, because React's built-in `useSyncExternalStore` already speaks this language:

```ts
export function useSignal<T>(source: ReadonlySignal<T>): T {
  return useSyncExternalStore(source.subscribe, source.get, source.get);
}
```

There's no `initialValue` and no effect cleanup to remember. A signal always has a current value, so the View never has to make one up.

## Keeping the good parts of RxJS

Moving to signals didn't mean pretending streams are useless. Some problems really are about _events over time_, like type-ahead search, WebSocket feeds or retry with back-off. RxJS is still excellent at those.

So `signals-core` keeps two doors open:

- **`observe(signal, fn)`** calls `fn` immediately with the current value and then on every change. That matches the "emit on subscribe" behaviour RxJS users expect from a `BehaviorSubject`, and it's what the Vue, Lit and vanilla bridges use.
- **`@web-loom/signals-core/rxjs`** is a separate entry point with `toObservable()` and `fromObservable()`. If you need a stream, convert at the edge, use your operators, then convert back. The main entry point stays dependency-free.

## What I gained and what I gave up

**Gained:**

- One reactive model across the whole toolkit.
- Derived state that reads like ordinary code.
- Bridges of one or two lines per framework.
- Less disposal bookkeeping.
- A primitive with a plausible future as part of JavaScript itself.

**Given up:**

- RxJS's operator library is no longer built in.
- Some patterns, like debounced validation, needed a dedicated helper (`debouncedSignal`) instead of one `debounceTime`.
- It was a breaking change for anything written against the old API. Because the packages are pre-1.0, I was willing to make that trade.

Would I start with signals if I began today? Yes. Do I regret starting with RxJS? Not really. It made Web Loom framework-agnostic from the first commit. Living with its costs also taught me exactly what I needed from a reactive primitive.

## Further reading

- **[`@web-loom/signals-core` — Reactive State Without the Framework Tax](https://webloomframework.com/blog/02-signals-core)**, the long-form blog post on the signals package.
- **[signals-core documentation](https://webloomframework.com/docs/signals-core)**, an API reference covering `signal`, `computed`, `effect`, `batch`, `observe` and more.
- **[Chapter 13: Reactive State Management Patterns](https://webloomframework.com/book/chapter13)** in the Web Loom book.

---

_Next in the series: **[Part 3 — One ViewModel, Many Views](https://webloomframework.com/blog/one-viewmodel-many-views)**, where a single ViewModel is rendered by React, Vue, vanilla JavaScript and a framework-free template, then tested without a DOM._
