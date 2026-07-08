# Requirements Document

## Introduction

This document defines the requirements for migrating the reactive substrate of `@web-loom/mvvm-core` from RxJS to `@web-loom/signals-core`, while preserving the package's public API shape and ergonomics (`data$`, `isLoading$`, `canExecute$`, `.subscribe()`, `IDisposable`). RxJS is demoted from foundation to an optional orchestration tool at the Model edge, available through a dedicated interop entry point. The migration also adapts the shared `@repo/view-models` package and the demo applications, which is acceptable because external adoption of the framework is currently low.

The motivation is architectural coherence: mvvm-core's RxJS usage is overwhelmingly `BehaviorSubject`-shaped (current value + change notification), which maps one-to-one onto signals; the operator-heavy portions of `Command` exist to simulate the dependency tracking that signals provide natively; and the wider ecosystem (Angular, Vue, Preact, Solid, TC39) has converged on signals as the primitive for view-facing state.

## Glossary

- **Signals Core**: `@web-loom/signals-core` - The framework-agnostic reactive signals package (`signal`, `computed`, `effect`, `batch`) that becomes the substrate of mvvm-core
- **MVVM Core**: `@web-loom/mvvm-core` - The core MVVM library being migrated
- **View Models Package**: `@repo/view-models` - Internal workspace package of shared application ViewModels consumed by all demo apps
- **Signal**: A container holding a current value that notifies subscribers when the value changes; readable via `get()` (tracked) or `peek()` (untracked)
- **ReadonlySignal**: The read-only view of a signal (`get`, `peek`, `subscribe`) exposed on public APIs
- **Substrate**: The underlying reactivity engine a package's state containers are built on
- **Bridge Hook**: A small framework-specific adapter that connects a `ReadonlySignal` to a framework's rendering cycle (e.g. React `useSignal`)
- **Interop**: The `@web-loom/signals-core/rxjs` subpath providing `toObservable`/`fromObservable` conversions between signals and RxJS observables
- **Reactive Property Convention**: The `$` suffix on public properties (e.g. `data$`), reinterpreted to mean "reactive property" (a `ReadonlySignal`) rather than "RxJS observable"
- **Emit-on-Subscribe**: RxJS `BehaviorSubject` behavior where a new subscriber immediately receives the current value; signals notify only on change, so an explicit `observe` helper covers this gap
- **EARS**: Easy Approach to Requirements Syntax, the acceptance-criteria format used below

## Requirements

### Requirement 1: Signals Core 0.7 Prerequisites

**User Story:** As a Web Loom maintainer, I want signals-core to gain value-passing subscriptions, an immediate-observe helper, a debounced signal, and an RxJS interop entry point, so that mvvm-core can adopt signals as its substrate without losing ergonomics or genuine RxJS strengths.

#### Acceptance Criteria

1. THE Signals Core Package SHALL change `subscribe` on `ReadonlySignal`/`WritableSignal` to `subscribe(fn: (value: T) => void)`, invoking listeners with the new current value on each change, while remaining backward compatible with zero-argument callbacks
2. THE Signals Core Package SHALL provide an `observe(sig, fn)` helper that invokes `fn(sig.peek())` immediately and then subscribes `fn` to subsequent changes, returning an unsubscribe function
3. THE Signals Core Package SHALL provide a `debouncedSignal(source, ms)` helper that returns a `ReadonlySignal` tracking the source value after the given quiet period
4. THE Signals Core Package SHALL provide a subpath export `@web-loom/signals-core/rxjs` exposing `toObservable(signal)` and `fromObservable(observable, initialValue)` conversions
5. THE Signals Core Package SHALL declare `rxjs` as an optional peer dependency used only by the `rxjs` subpath, and its main entry point SHALL remain zero-dependency
6. THE Signals Core Package SHALL be versioned 0.7.0 with tests covering each new capability

### Requirement 2: BaseModel Substrate Swap With Preserved API

**User Story:** As a ViewModel author, I want `BaseModel` to expose the same `data$ / isLoading$ / error$` properties and setter methods as today, so that Models port to the new substrate without call-site rewrites.

#### Acceptance Criteria

1. THE BaseModel SHALL back `data$`, `isLoading$`, and `error$` with three `signal()` instances, exposing them publicly as `ReadonlySignal` values (replacing the three `BehaviorSubject`s at `src/models/BaseModel.ts`)
2. THE BaseModel SHALL preserve the existing mutation and read methods (`setData`, `setLoading`, `setError`, `clearError`, `getCurrentData`, `getCurrentLoadingStatus`, `getCurrentError`), with the `getCurrentX` methods delegating to `peek()`
3. THE BaseModel SHALL preserve Zod schema validation behavior unchanged
4. THE BaseModel SHALL preserve the `IDisposable` contract, with `dispose()` clearing subscriber sets (there is no `complete()` semantic under signals)

### Requirement 3: Command and CompositeCommand on Computed Signals

**User Story:** As a View author, I want `Command` to keep its `canExecute$ / isExecuting$ / executeError$` surface while gaining synchronous, auto-tracked can-execute evaluation, so that button bindings keep working and the async guard race disappears.

#### Acceptance Criteria

1. THE Command SHALL expose `isExecuting$` and `executeError$` as `ReadonlySignal` values backed by writable signals
2. THE Command SHALL derive `canExecute$` as a `computed` combining the base can-execute source, all observed conditions, and `!isExecuting`
3. THE Command SHALL guard `execute()` with a synchronous `canExecute$.peek()` check, replacing the awaited-observable guard
4. THE Command SHALL retain `observesProperty` and `observesCanExecute` as fluent sugar that contributes conditions to the `canExecute$` computed
5. THE Command SHALL retain `raiseCanExecuteChanged()` implemented as a version-signal bump, for can-execute logic that reads untracked external state
6. THE Command SHALL remove the `rebuildCanExecute` observable-combination machinery (`combineLatest`/`startWith`/`distinctUntilChanged`) made obsolete by automatic dependency tracking
7. THE CompositeCommand SHALL be ported to the same signal-based surface with unchanged registration semantics

### Requirement 4: Remaining MVVM Core Modules Ported

**User Story:** As a Web Loom maintainer, I want every mvvm-core module moved off RxJS state containers, so that the package has a single reactive substrate.

#### Acceptance Criteria

1. THE System SHALL port `BaseViewModel`, `RestfulApiViewModel`, and `QueryStateModelView` to signal-backed state with unchanged public property names
2. THE System SHALL port `RestfulApiModel` and `QueryStateModel`, keeping CRUD and fetch logic promise-based and changing only the state containers
3. THE System SHALL port `form-view-model` and `queryable-collection-view-model`, replacing their `debounceTime` pipelines (50ms validation debounce, 150ms filter debounce) with `debouncedSignal`
4. THE System SHALL port `ObservableCollection`, `BusyState`, `notification-service`, and `global-error-service` to signal-backed state
5. THE System SHALL leave the DI container (`SimpleDIContainer`) unchanged
6. WHERE a module has genuinely stream-shaped needs (timers, cancellation races), THE System SHALL use the signals-core rxjs interop at the Model edge rather than reintroducing RxJS state containers

### Requirement 5: Dependency and Version Changes

**User Story:** As a package consumer, I want mvvm-core to stop requiring RxJS, so that the MVVM stack is dependency-light and shares one reactive vocabulary with the rest of Web Loom.

#### Acceptance Criteria

1. THE MVVM Core Package SHALL add `@web-loom/signals-core` to `dependencies` and remove `rxjs` from `dependencies`
2. THE MVVM Core Package SHALL retain `zod` and `@web-loom/query-core` dependencies unchanged
3. WHERE interop examples require RxJS, THE MVVM Core Package SHALL reference it only as an optional peer dependency
4. THE MVVM Core Package SHALL be versioned 0.6.0
5. THE System SHALL update or prune the `src/examples` folder so no example imports RxJS state containers

### Requirement 6: View Models Package Port

**User Story:** As a demo-app maintainer, I want `@repo/view-models` to work on the new substrate without changing its exported surface, so that all consuming apps keep importing the same symbols.

#### Acceptance Criteria

1. THE View Models Package SHALL replace the `BehaviorSubject` usage in `src/AuthViewModel.ts` (its only direct RxJS import) with `signal()`
2. THE View Models Package SHALL keep every exported ViewModel symbol and property name unchanged
3. THE View Models Package SHALL compile and pass tests against mvvm-core 0.6.0 without RxJS in its dependency tree

### Requirement 7: Demo Application Bridge Migration

**User Story:** As a framework-demo maintainer, I want each app's observable bridge replaced with an equivalent signal bridge, so that the apps continue to demonstrate identical shared ViewModels with only the View layer differing.

#### Acceptance Criteria

1. THE React Apps (mvvm-react, mvvm-react-integrated, mvvm-react-native) SHALL replace `useObservable(observable, initialValue)` with a `useSignal(sig)` hook built on `useSyncExternalStore(sig.subscribe, sig.get, sig.get)`, eliminating the initial-value parameter
2. THE Angular App (mvvm-angular) SHALL bridge `ReadonlySignal` values to native Angular signals, removing `async`-pipe usage for ViewModel state
3. THE Vue App (mvvm-vue) SHALL bridge `ReadonlySignal` values to Vue reactivity via a `useSignal` composable (e.g. `shallowRef` + `observe`)
4. THE Lit, Vanilla, and Marko Apps SHALL consume ViewModel state via the `observe()` helper, preserving current render-on-change behavior
5. THE System SHALL verify and migrate all remaining `@repo/view-models` consumers (including ui-patterns-playground and plugin-react) to the signal bridges
6. THE Demo Apps SHALL retain their existing disposal discipline (unsubscribe/dispose on unmount)

### Requirement 8: Tests and Quality Gates

**User Story:** As a Web Loom maintainer, I want the existing test suites to keep guarding behavior across the substrate swap, so that the migration is verifiable at every phase.

#### Acceptance Criteria

1. THE System SHALL port co-located tests, replacing `firstValueFrom(x$)` with `x$.get()` and subscription assertions with signal subscriptions
2. WHERE tests assert RxJS completion semantics, THE System SHALL adapt them to dispose semantics (subscriber clearing), as signals have no `complete()`
3. THE System SHALL keep `npm run check-types`, `npm run lint`, and `npm run test` green across the monorepo at the end of each migration phase
4. THE System SHALL preserve test coverage for Command can-execute logic, including the fluent `observesProperty`/`observesCanExecute` paths and `raiseCanExecuteChanged`

### Requirement 9: Documentation Updates

**User Story:** As a Web Loom contributor, I want the docs to describe the signals substrate and the reactive-property convention, so that guidance and code no longer disagree.

#### Acceptance Criteria

1. THE System SHALL update the mvvm-core README to document the signal-based API, the `$` reactive-property convention, and the rxjs interop pattern
2. THE System SHALL update `.claude/skills/architecture.md` so the documented Model/ViewModel/View patterns and per-framework bridge examples reflect signals
3. THE System SHALL annotate `docs/MVVM-CORE-PRISM-ENHANCEMENTS.md` to note that observable-oriented roadmap items now target signals ("adapted for signals rather than INotifyPropertyChanged")
