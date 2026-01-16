# MVVM Architecture

Web Loom implements a strict MVVM (Model-View-ViewModel) separation of concerns using `@web-loom/mvvm-core`.

## Core Packages

- `packages/mvvm-core` - Foundational concepts (BaseModel, RestfulApiModel, BaseViewModel, commands, observable collections, QueryStateModel, DI container)
- `packages/models` - Shared data models (workspace entry: `@repo/models`)
- `packages/view-models` - Shared ViewModels (workspace entry: `@repo/view-models`)

## Model Layer (`packages/mvvm-core/src/models/`)

### BaseModel

Centralizes reactive state with Zod validation:

- Exposes `data$`, `isLoading$`, `error$` observables
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

- Exposes underlying model's observables
- Maps `error$` into `validationErrors$` stream
- Use `addSubscription` + `dispose()` for subscription management

### RestfulApiViewModel

- Wires `RestfulApiModel` into consumable observables
- Exposes `data$`, `isLoading$`, `error$`, `selectedItem$`
- CRUD Commands: `fetch`, `create`, `update`, `delete`

### Command Pattern

Commands expose:
- `execute()` - Trigger the action
- `isExecuting$` - For loading spinners
- `canExecute$` - For button enablement
- `result$` - For accessing results

## CRUD Flow Example

### 1. Model Setup (`packages/models`)

```typescript
// GreenHouseModel.ts extends RestfulApiModel
export const greenHouseConfig = {
  baseUrl: '/api',
  endpoint: '/greenhouses',
  schema: GreenHouseSchema,
  initialData: []
};
```

### 2. ViewModel Setup (`packages/view-models`)

```typescript
// GreenHouseViewModel.ts
import { createReactiveViewModel } from '@web-loom/mvvm-core';

export const greenHouseViewModel = createReactiveViewModel({
  modelConfig: greenHouseConfig,
  schema: GreenHouseSchema
});
```

### 3. View Integration (React Example)

```typescript
// Dashboard.tsx
const data = useObservable(vm.data$, []);
const isLoading = useObservable(vm.isLoading$, false);

useEffect(() => {
  vm.fetchCommand.execute();
  return () => vm.dispose();
}, []);
```

## Framework Integration Patterns

### React
- `useObservable` hook bridges RxJS to React state
- Call `fetchCommand.execute()` in `useEffect`
- Dispose ViewModel on unmount

### Angular
- Use `async` pipe in templates
- Inject ViewModels via DI container

### Vue
- Use `watchEffect` or Composition API
- Subscribe in `onMounted`, unsubscribe in `onUnmounted`

### Lit
- Use `@state` decorators with subscriptions
- Subscribe in `connectedCallback`

### Vanilla JS
- Direct `.subscribe()` calls
- Manual cleanup on teardown

## Best Practices

1. **Always call `dispose()`** on ViewModels when component unmounts
2. **Define Zod schemas** for every model for compile-time and runtime validation
3. **Keep UI logic in ViewModels** - components only subscribe and render
4. **Wire UI states to Command observables** - `canExecute$` for disabled buttons, `isExecuting$` for spinners
5. **Test ViewModels directly** - mock fetchers or stub observables

## Extending the Pattern

1. Add new model/view-model packages under `packages/*`
2. Export via `exports` fields in `package.json`
3. Update consuming app's Vite/Vitest alias map
4. Keep standard scripts: `build`, `test`, `check-types`, `lint`
