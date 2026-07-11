# MVVM Architecture

Web Loom implements a strict MVVM (Model-View-ViewModel) separation of concerns using `@web-loom/mvvm-core`.

## Core Packages

- `packages/mvvm-core` - Foundational concepts (BaseModel, RestfulApiModel, BaseViewModel, commands, observable collections, QueryStateModel, DI container)
- `packages/models` - Shared data models (workspace entry: `@repo/models`)
- `packages/view-models` - Shared ViewModels (workspace entry: `@repo/view-models`)

## Model Layer (`packages/mvvm-core/src/models/`)

### BaseModel

Centralizes reactive state with Zod validation:

- Exposes `data$`, `isLoading$`, `error$` reactive signals (`ReadonlySignal` from `@web-loom/signals-core`; the `$` suffix means "reactive property")
- Provides `setData`, `setLoading`, `setError`, and `validate` helpers
- Pass Zod schema to constructor for automatic validation

### RestfulApiModel

Extends BaseModel with RESTful operations:

- Wraps `Fetcher`, `baseUrl`, `endpoint`, `schema`, `initialData`
- `fetch`, `create`, `update`, `delete` methods with optimistic updates
- Automatic loading/error handling and validation

### Additional Helpers

- `QueryStateModel` - Caching and pagination
- `ObservableCollection` - Granular change events for lists
- `DIContainer` - Dependency injection for singletons/transients

## ViewModel Layer (`packages/mvvm-core/src/viewmodels/`)

### BaseViewModel

- Exposes underlying model's reactive signals
- Maps `error$` into a `validationErrors$` computed signal
- Use `addSubscription(teardown)` + `dispose()` for teardown management

### RestfulApiViewModel

- Wires `RestfulApiModel` into consumable signals
- Exposes `data$`, `isLoading$`, `error$`, `selectedItem$`
- CRUD Commands: `fetch`, `create`, `update`, `delete`

### Command Pattern

Commands expose:

- `execute()` - Trigger the action (guarded synchronously by `canExecute$.peek()`)
- `isExecuting$` - For loading spinners
- `canExecute$` - For button enablement (computed; signal reads in conditions are auto-tracked)
- `executeError$` - Latest execution error

## CRUD Flow Example

### 1. Model Setup (`packages/models`)

```typescript
// GreenHouseModel.ts extends RestfulApiModel
export const greenHouseConfig = {
  baseUrl: '/api',
  endpoint: '/greenhouses',
  schema: GreenHouseSchema,
  initialData: [],
};
```

### 2. ViewModel Setup (`packages/view-models`)

```typescript
// GreenHouseViewModel.ts
import { createReactiveViewModel } from '@web-loom/mvvm-core';

export const greenHouseViewModel = createReactiveViewModel({
  modelConfig: greenHouseConfig,
  schema: GreenHouseSchema,
});
```

### 3. View Integration (React Example)

```typescript
// Dashboard.tsx
const data = useSignal(vm.data$);
const isLoading = useSignal(vm.isLoading$);

useEffect(() => {
  vm.fetchCommand.execute();
  return () => vm.dispose();
}, []);
```

## Framework Integration Patterns

### React

- `useSignal` hook (built on `useSyncExternalStore(sig.subscribe, sig.get, sig.get)`) bridges signals to React — no initial-value parameter needed
- Call `fetchCommand.execute()` in `useEffect`
- Dispose ViewModel on unmount

### Angular

- Bridge to native Angular signals (`fromLoomSignal` helper mirrors via `DestroyRef`); templates call `data$()` instead of using the `async` pipe
- Inject ViewModels via DI container

### Vue

- `useSignal` composable: `shallowRef` seeded with `sig.peek()` + `observe` for updates
- Unsubscribe in `onUnmounted`

### Lit

- Use `@state` decorators with `observe(sig, fn)` in `connectedCallback` (delivers the current value immediately)
- Call the returned unsubscribe function in `disconnectedCallback`

### Vanilla JS

- `observe(sig, fn)` for subscribe-with-current-value; `.subscribe(fn)` for changes only
- Call the returned unsubscribe function on teardown

## Best Practices

1. **Always call `dispose()`** on ViewModels when component unmounts
2. **Define Zod schemas** for every model for compile-time and runtime validation
3. **Keep UI logic in ViewModels** - components only subscribe and render
4. **Wire UI states to Command signals** - `canExecute$` for disabled buttons, `isExecuting$` for spinners
5. **Test ViewModels directly** - mock fetchers; signals make assertions synchronous (`vm.data$.get()`)

## Extending the Pattern

1. Add new model/view-model packages under `packages/*`
2. Export via `exports` fields in `package.json`
3. Update consuming app's Vite/Vitest alias map
4. Keep standard scripts: `build`, `test`, `check-types`, `lint`
