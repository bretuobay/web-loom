# MVVM core overview

`packages/mvvm-core/README.md` documents the framework-agnostic foundation. Key takeaways:

- **BaseModel + RestfulApiModel**: Manage `data$`, `isLoading$`, `error$`, and provide CRUD helpers with optimistic updates. Pass a Zod schema into the constructor (see `UserSchema` example) to keep data validation centralized.
- **BaseViewModel + RestfulApiViewModel**: Connects a model to the view layer. Computed observables (e.g., `displayName$`) and commands (fetch/create/update/delete) are already implicitly provided.
- **Command Pattern**: `Command` objects expose `execute()`, `isExecuting$`, `canExecute$`, and `result$`. Use `canExecute$` for button enablement and `isExecuting$` for spinners.
- **ObservableCollection & QueryStateModel**: Observable collections emit granular change events, while `QueryStateModel`/`QueryStateModelView` integrate with `@web-loom/query-core` for caching and cache invalidation commands.
- **FormViewModel + QueryableCollectionViewModel + DIContainer**: Extra helpers for form state, filtering/pagination, and dependency injection. Register singletons or transient factories through `DIContainer`.

**Best practices from the README**:

1. Always call `dispose()` on view models to release RxJS subscriptions (`vm.dispose()`).
2. Define Zod schemas for every model and pass them to the constructors that accept `schema`.
3. Keep UI logic in view models; instantiate them inside frameworks/containers and subscribe to their observables rather than embedding business logic in React/Vue/Angular components.
4. Tests should exercise view models and commands directly—mock fetchers or stub observables instead of hitting real endpoints.
