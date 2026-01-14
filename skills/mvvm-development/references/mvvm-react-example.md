# MVVM app integration example

`apps/mvvm-react/README.md` provides the concrete Data ≥ ViewModel ≥ View flow that should be mirrored across other MVVM apps. Highlights:

1. **ViewModels** live in `@repo/view-models` (see `Dashboard` example importing multiple view models such as `greenHouseViewModel` and `sensorViewModel`).
2. **Custom hook** `useObservable` (defined in `apps/mvvm-react/src/hooks/useObservable`) bridges RxJS observables (e.g., `data$`, `isLoading$`) to React state updates.
3. **Command usage**: The Dashboard calls `fetchCommand.execute()` inside `useEffect` to trigger data fetching. Commands expose `isExecuting$`/`canExecute$` for UI state.
4. **Component rendering**: Components subscribe to `data$` and `isLoading$` observables, and the UI renders skeletons or cards based on the combined boolean `isLoading` values.
5. **Project structure**: `src/models/` for data models, `src/view-models/` for the presentation logic, and `src/components/` for Views.

Apply the same recipe for Angular/Vue apps: keep UI-to-ViewModel subscriptions in the view layer (through RxJS `async` pipes, `useObservable`, etc.), trigger commands via lifecycle hooks, and dispose of view models on teardown.
