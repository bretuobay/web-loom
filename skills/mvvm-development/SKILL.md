---
name: mvvm-development
description: Explain how to implement and evolve MVVM features using the repo’s `@web-loom/mvvm-core`, the shared `models`/`view-models` packages, and the reference MVVM apps (React/Angular/Vue). Use when Codex is asked about MVVM wiring, state management, or integrating the core packages with framework-specific UIs.
---

# MVVM development guidance

Use this skill whenever MVVM is the primary pattern in play—new view models, model validation, or wiring UI components to observable commands.

## Core packages

- `packages/mvvm-core` implements the foundational concepts (BaseModel, RestfulApiModel, BaseViewModel, commands, observable collections, QueryStateModel, DI container). Refer to [references/mvvm-core-overview.md](references/mvvm-core-overview.md) for the current shape of each export and the RxJS/Zod patterns the library enforces.
- `packages/models` and `packages/view-models` build on `mvvm-core` and publish workspace-friendly entry points (`@repo/models`, `@repo/view-models`). Whenever you create new data shapes or view logic, keep them under these packages so multiple apps can import from the same build outputs.

### Model helpers (`packages/mvvm-core/src/models`)

- `BaseModel` centralizes `data$`, `isLoading$`, and `error$` observables plus `setData`, `setLoading`, `setError`, and a `validate` helper wired to a Zod schema. Every shared model should inherit from it to get consistent state tracking and disposal semantics.
- `RestfulApiModel` wraps `Fetcher`, `baseUrl`, `endpoint`, `schema`, and `initialData`. Its `fetch`, `create`, `update`, and `delete` methods reuse the `executeApiRequest`/optimistic flows from `BaseModel`, so you do not re-implement loading/error handling or validation.
- `QueryStateModel`, `ObservableCollection`, and the other helpers in `packages/mvvm-core/src/models` layer on top when you need caching, pagination, or custom change events for lists of entities.

### ViewModel helpers (`packages/mvvm-core/src/viewmodels`)

- `BaseViewModel` exposes the underlying model’s observables and maps `error$` into a `validationErrors$` stream. Use `addSubscription` + `dispose()` to keep RxJS subscriptions disciplined.
- `RestfulApiViewModel` wires a `RestfulApiModel` into consumable `data$`, `isLoading$`, `error$`, `selectedItem$`, and CRUD `Command`s (`fetch`, `create`, `update`, `delete`). Each command already exposes `execute()`, `isExecuting$`, and `canExecute$`, so hook those observables to buttons/spinners.
- The factory `createReactiveViewModel` (and `ViewModelFactoryConfig`) keeps view model setup consistent—feed it the same config object you use for the `RestfulApiModel`, and it instantiates the pair for you.

## Concrete CRUD example

Every new feature should follow the pattern captured in [references/mvvm-crud-flow.md](references/mvvm-crud-flow.md): export a shared model config, pass it to `createReactiveViewModel`, and let each app subscribe to `data$`/`isLoading$` while triggering `fetchCommand.execute()` inside lifecycle hooks (see `apps/mvvm-react/src/components/Dashboard.tsx`). This keeps shared packages reusable and apps focused on rendering observable updates.

## Application integration

- The React, Angular, Vue, and vanilla MVVM starter apps under `apps/mvvm-*` all subscribe to observables exposed by view models. `apps/mvvm-react/README.md` contains a concrete Dashboard example: use the provided `useObservable` hook, call `fetchCommand.execute()` on mount, and dispose of the view model when the component unmounts. See [references/mvvm-react-example.md](references/mvvm-react-example.md) for the distilled workflow.
- Match the React example for other frameworks: the View should only subscribe to ViewModel streams (`data$`, `isLoading$`, `error$`, computed observables) and trigger commands (`fetchCommand`, `createCommand`, etc.). Keep models/test suites decoupled from view-layer hooks so you can reuse them across apps.

## Practices & verification

- Always call `dispose()` on view models when a component, page, or route is torn down to clean up subscriptions and commands.
- Favor Zod schemas defined next to the model for compile-time and runtime validation; pass them into BaseModel/RestfulApiModel constructors to get automatic error handling.
- Commands (`Command`, `fetchCommand`, `createCommand`, etc.) expose `canExecute$` and `isExecuting$`. Wire UI states (disabled buttons, loading spinners) directly to those observables for consistent UX.
- For tests, rely on the workspace Vitest setup (`apps/mvvm-react/vitest.config.ts`) so the same alias map (React component → shared view models) is used in `vitest run`. Mock fetchers or provide stubbed RxJS subjects when exercising models/view models.

## When extending the pattern

1. Add new model/view model packages under `packages/*`; export them via the existing `exports` fields and keep `package.json` scripts consistent (`build`, `test`, `check-types`, `lint`).
2. Update any consuming app’s Vite/Vitest alias map so `@repo/models` and `@repo/view-models` resolve to `../../packages/.../src` during development and testing.
3. Keep the MVVM core README (and this skill) in sync when you change base behaviors (new observables, command features, etc.).

Leverage the reference files for concrete snippets, and re-run `npm run test`/`turbo run dev` after wiring a new view model to ensure observables and commands behave as expected.
