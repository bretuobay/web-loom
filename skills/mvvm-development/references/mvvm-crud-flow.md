# MVVM CRUD flow example

This reference shows the shape of a concrete CRUD flow that ties together the shared model, view model, and a React view to demonstrate the patterns in this repo.

## 1. Model setup (`packages/models`)

`packages/models/src/GreenHouseModel.ts` extends `RestfulApiModel` so you inherit:

- `data$`, `isLoading$`, `error$`, and schema-driven validation from `BaseModel`.
- A configurable fetcher + endpoint (see `greenHouseConfig`) that includes `baseUrl`, `endpoint`, `fetcher`, `schema`, `initialData`, and a `validateSchema` flag.
- Optimistic `create`, `update`, and `delete` helpers plus `setLoading`/`setError` plumbing for consistent CRUD behaviour.

Keeping the `greenHouseConfig` object exported lets other packages reuse the same API wiring.

## 2. View model setup (`packages/view-models`)

`packages/view-models/src/GreenHouseViewModel.ts` calls `createReactiveViewModel` with `{ modelConfig, schema }`:

- The factory instantiates `RestfulApiModel` with the shared config and wraps it in `RestfulApiViewModel`.
- The resulting view model exposes `data$`, `isLoading$`, `error$`, and `fetch/create/update/delete` commands (each is a `Command` with `execute`, `isExecuting$`, and `canExecute$`).
- Exported types (`GreenhouseListData`, `GreenhouseData`) keep downstream code type-safe without duplicating schemas.

Import these shared view models instead of recreating `RestfulApiViewModel` wiring inside apps.

## 3. App wiring example (`apps/mvvm-react`)

`apps/mvvm-react/src/components/Dashboard.tsx` illustrates how a view consumes the shared VM:

- `useObservable` hooks subscribe to `data$`/`isLoading$` so React renders when the streams change.
- `useEffect` calls each view model’s `fetchCommand.execute()` once on mount; commands already handle loading/error state.
- Combine `isLoading$` flags to render a global spinner and pass the emitted `data` to child cards (`GreenhouseCard`, `SensorCard`, etc.).
- Keep UI logic in the component; avoid mutating view model state directly—run the exposed commands and render observables instead.

Follow this pattern for other apps (Angular/Vue) by wiring their frameworks to `data$`/`isLoading$` and triggering `fetch/create/update/delete` commands. See the MVVM core overview for deeper command and collection helpers.
