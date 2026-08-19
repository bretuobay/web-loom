# MVVM app integration example

`apps/mvvm-react/README.md` provides the concrete Data ≥ ViewModel ≥ View flow that should be mirrored across other MVVM apps. Highlights:

1. **ViewModels** live in `@repo/view-models` (see `Dashboard` example importing multiple view models such as `greenHouseViewModel` and `sensorViewModel`).
2. **Custom hook** `useSignal` (defined in `apps/mvvm-react/src/hooks/useSignal.ts`) bridges `@web-loom/signals-core` signals (e.g., `data$`, `isLoading$`) to React state updates via `useSyncExternalStore` — no RxJS involved.
3. **Command usage**: The Dashboard calls `fetchCommand.execute()` inside `useEffect` to trigger data fetching. Commands expose `isExecuting$`/`canExecute$` signals for UI state.
4. **Component rendering**: Components read `data$` and `isLoading$` through `useSignal`, and the UI renders skeletons or cards based on the combined boolean `isLoading` values.
5. **Project structure**: `src/models/` for data models, `src/view-models/` for the presentation logic, and `src/components/` for Views.

Apply the same recipe for Angular/Vue apps: keep UI-to-ViewModel subscriptions in the view layer (through each framework's own signal bridge — `useSignal` for React, `fromLoomSignal` for Angular, `useSignal`/`shallowRef` for Vue — or an RxJS `async` pipe only where a framework's own idioms expect an Observable), trigger commands via lifecycle hooks, and dispose of view models on teardown.
