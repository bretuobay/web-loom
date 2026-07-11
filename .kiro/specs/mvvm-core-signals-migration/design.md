# Design Document

## Overview

This design migrates `@web-loom/mvvm-core` from an RxJS substrate to `@web-loom/signals-core`, keeping the public API shape intact. The migration is unusually cheap because mvvm-core's RxJS usage is dominated by `BehaviorSubject`-as-state — semantically already a signal — and because the consumer blast radius is small: `@repo/view-models` imports RxJS in exactly one file, and demo apps touch RxJS only through a ~13-line bridge hook per app.

### Design Philosophy

1. **Signals as the ViewModel-facing substrate**: view-facing state (current value + change notification) is signal-shaped; this aligns mvvm-core with Angular, Vue, Preact, Solid, and the TC39 Signals proposal
2. **RxJS demoted, not banished**: streams remain the right tool for Model-edge orchestration (debounce beyond simple cases, retry/backoff, websockets, cancellation races) and stay available through the `@web-loom/signals-core/rxjs` interop — the `@angular/core/rxjs-interop` playbook
3. **API stability over purity**: property names and the `$` suffix are preserved; `$` now reads as "reactive property" (a `ReadonlySignal`), not "RxJS observable"
4. **One reactive vocabulary**: after migration, mvvm-core, ui-core (via store-core's complementary role), and signals-core share a coherent story; store-core is untouched — it plays the shared-state-container role (the Zustand role) alongside signals
5. **Ship green per phase**: each migration phase leaves the monorepo type-checking, linting, and testing clean

### Package Relationship

```
@web-loom/mvvm-core (0.6.0)
    ↓ depends on
@web-loom/signals-core (0.7.0)  +  @web-loom/query-core  +  zod
    ↓ optional subpath (rxjs interop, optional peer dep)
@web-loom/signals-core/rxjs  ←→  rxjs (Model-edge orchestration only)
```

## API Mapping

| Today (RxJS)                                           | After (signals)                                 | Notes                                    |
| ------------------------------------------------------ | ----------------------------------------------- | ---------------------------------------- |
| `protected _data$ = new BehaviorSubject<T>(v)`         | `protected _data = signal<T>(v)`                | 1:1 semantic swap                        |
| `public readonly data$: Observable<T>`                 | `public readonly data$: ReadonlySignal<T>`      | Name and `$` suffix preserved            |
| `subject.next(v)`                                      | `sig.set(v)` / `sig.update(fn)`                 |                                          |
| `firstValueFrom(x$)` / `getCurrentX()`                 | `x$.get()` / `x$.peek()`                        | Synchronous — removes await points       |
| `x$.subscribe(fn)` → `Subscription`                    | `x$.subscribe(fn)` → unsubscribe function       | `fn` receives the new value (Req 1.1)    |
| `subscription.unsubscribe()`                           | `unsubscribe()`                                 | Bridges absorb this                      |
| `subject.complete()` in `dispose()`                    | clear subscriber sets in `dispose()`            | No completion semantic                   |
| `combineLatest([...]).pipe(map, distinctUntilChanged)` | `computed(() => ...)`                           | Auto-tracked; `Object.is` dedup built in |
| `pipe(debounceTime(ms))`                               | `debouncedSignal(source, ms)`                   | New signals-core helper                  |
| Emit-on-subscribe (`BehaviorSubject`)                  | `observe(sig, fn)` — immediate call + subscribe | Key semantic delta, see below            |

## Semantic Deltas

1. **No emit-on-subscribe.** `BehaviorSubject` pushes the current value to new subscribers; signals notify only on change. Mitigations: React/Vue/Angular bridges read `get()` synchronously (no initial emission needed); Lit/vanilla/Marko consumers use `observe()` which calls the listener immediately with `peek()`.
2. **Equality-gated notification.** Signals skip notification when `Object.is(prev, next)` holds; `BehaviorSubject` re-emits identical values. Code relying on same-value re-emission (rare; audit during port) should use a custom `equals` option or a version bump signal.
3. **Batching.** Multi-set update sequences that previously produced intermediate emissions can be wrapped in `batch()` for single notification; tests asserting intermediate states must be adjusted deliberately, not silently.
4. **No error/completion channels.** Errors flow through the dedicated `error$` signal and `executeError$` on commands, which is how mvvm-core already models them — the RxJS error channel was unused for state.

## Component Designs

### BaseModel (signals)

```typescript
export class BaseModel<TData, TSchema extends ZodSchema<TData>> implements IBaseModel<TData, TSchema> {
  protected _data = signal<TData | null>(null);
  public readonly data$: ReadonlySignal<TData | null> = this._data.asReadonly();

  protected _isLoading = signal(false);
  public readonly isLoading$: ReadonlySignal<boolean> = this._isLoading.asReadonly();

  protected _error = signal<unknown>(null);
  public readonly error$: ReadonlySignal<unknown> = this._error.asReadonly();

  public setData(newData: TData | null): void {
    this._data.set(newData);
  }
  public getCurrentData(): TData | null {
    return this._data.peek();
  }
  // setLoading/setError/clearError/validate unchanged in shape; dispose() clears subscribers
}
```

### Command (signals)

```typescript
export class Command<TParam = void, TResult = void> implements ICommand<TParam, TResult>, IDisposable {
  private _isExecuting = signal(false);
  private _executeError = signal<unknown>(null);
  private _canExecuteVersion = signal(0); // bumped by raiseCanExecuteChanged()
  private _conditions: Array<() => boolean> = []; // fed by observesProperty/observesCanExecute

  public readonly isExecuting$ = this._isExecuting.asReadonly();
  public readonly executeError$ = this._executeError.asReadonly();
  public readonly canExecute$: ReadonlySignal<boolean>;

  constructor(executeFn: (p: TParam) => Promise<TResult>, canExecute?: ReadonlySignal<boolean> | (() => boolean)) {
    this.canExecute$ = computed(() => {
      this._canExecuteVersion.get(); // manual re-evaluation hook
      const base = canExecute === undefined ? true : typeof canExecute === 'function' ? canExecute() : canExecute.get();
      return base && this._conditions.every((c) => c()) && !this._isExecuting.get();
    });
  }

  observesProperty<T>(prop: ReadonlySignal<T>): this {
    this._conditions.push(() => !!prop.get());
    return this;
  }

  observesCanExecute(cond: ReadonlySignal<boolean>): this {
    this._conditions.push(() => cond.get());
    return this;
  }

  raiseCanExecuteChanged(): void {
    this._canExecuteVersion.update((v) => v + 1);
  }

  async execute(param: TParam): Promise<TResult | undefined> {
    if (!this.canExecute$.peek()) return; // synchronous guard — no awaited-stream race
    this._isExecuting.set(true);
    this._executeError.set(null);
    try {
      return await this._executeFn(param);
    } catch (err) {
      this._executeError.set(err);
      throw err;
    } finally {
      this._isExecuting.set(false);
    }
  }
}
```

Note: conditions registered after construction are read inside the `computed`, so fluent registration must trigger re-evaluation — bump `_canExecuteVersion` in `observesProperty`/`observesCanExecute`. The entire `rebuildCanExecute` observable machinery is deleted.

### Signals Core Additions

```typescript
// observe: emit-on-subscribe compatibility
export function observe<T>(sig: ReadonlySignal<T>, fn: (value: T) => void): () => void {
  fn(sig.peek());
  return sig.subscribe(fn);
}

// debouncedSignal: quiet-period derived value
export function debouncedSignal<T>(source: ReadonlySignal<T>, ms: number): ReadonlySignal<T>;

// rxjs interop subpath (@web-loom/signals-core/rxjs; rxjs = optional peer)
export function toObservable<T>(sig: ReadonlySignal<T>): Observable<T>; // emits current value, then changes
export function fromObservable<T>(obs: Observable<T>, initial: T): ReadonlySignal<T>; // returns signal + manages subscription
```

### Framework Bridges

```typescript
// React / React Native (replaces apps/*/src/hooks/useObservable.ts)
export function useSignal<T>(sig: ReadonlySignal<T>): T {
  return useSyncExternalStore(sig.subscribe, sig.get, sig.get);
}

// Angular: adapt to a native Angular signal
export function toAngularSignal<T>(sig: ReadonlySignal<T>, destroyRef: DestroyRef): Signal<T> {
  const s = angularSignal(sig.peek());
  const unsub = sig.subscribe((v) => s.set(v));
  destroyRef.onDestroy(unsub);
  return s.asReadonly();
}

// Vue composable
export function useSignal<T>(sig: ReadonlySignal<T>): ShallowRef<T> {
  const r = shallowRef(sig.peek());
  const unsub = observe(sig, (v) => {
    r.value = v;
  });
  onUnmounted(unsub);
  return r;
}

// Lit / vanilla / Marko: observe(vm.data$, render) with unsubscribe on teardown
```

The React bridge is a strict improvement: no `initialValue` parameter and no first-render flash, because `get()` is synchronous.

## Migration Order (ship green each phase)

1. **signals-core 0.7.0** — additive only; nothing downstream breaks
2. **mvvm-core 0.6.0** — full internal port + test port; rxjs removed from dependencies
3. **view-models** — one-file port (`AuthViewModel.ts`)
4. **apps** — bridge swap per app
5. **docs + version bumps**

## Risks and Mitigations

| Risk                                                                                       | Mitigation                                                                                                          |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| Hidden operator usage in `src/examples` and tests beyond the audited sites                 | Grep-audit `rxjs` imports per module before porting it; prune or rewrite examples (Req 5.5)                         |
| Consumers relying on emit-on-subscribe                                                     | `observe()` helper; bridges read `get()` synchronously; call out in README migration notes                          |
| Tests asserting intermediate emissions or completion semantics                             | Adapt deliberately per Req 8.2; use `batch()` knowingly, never silently                                             |
| Fluent `observesProperty` after construction not re-evaluating `canExecute$`               | Version-signal bump on registration (see Command design note)                                                       |
| Marko / React Native bridge specifics differ from web React                                | React Native shares `useSyncExternalStore`; Marko uses `observe()` — verify both demos render and dispose correctly |
| `queryable-collection-view-model` / `form-view-model` timing changes (50ms/150ms debounce) | `debouncedSignal` preserves the same delays; port their tests with fake timers                                      |
