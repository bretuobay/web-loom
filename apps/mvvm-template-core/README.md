# MVVM Template Core

`mvvm-template-core` is the greenhouse dashboard from [`mvvm-react`](../mvvm-react) rendered with
`@web-loom/template-core` instead of React. It uses the same shared ViewModels
(`greenHouseViewModel`, `sensorViewModel`, `sensorReadingViewModel`, `thresholdAlertViewModel`) and
the same routes. The View is a set of standalone `.loom` templates — no React, Vue, Lit, or adapter
hook.

This is the `.loom` authoring example for the greenhouse domain. [`ecommerce-template-core`](../ecommerce-template-core)
remains the ecommerce/SSR reference; this app is the MVVM demo counterpart to `mvvm-react`.

## What it demonstrates

- Every screen lives in `src/templates/*.loom` so the VS Code
  [`vscode-template-core-syntax`](../../packages/vscode-template-core-syntax/) extension can highlight
  `{{ }}`, `{{#if}}`/`{{#each}}`, `{{> partial}}`, and `on:`/`bind:`/`use:` directives in-file.
- The Vite plugin [`templateCoreLoom()`](../../packages/template-core-vite/) loads those files
  (`compile()` in dev, `fromPrecompiled()` in build).
- The application shell composes header and footer with named partials. The dashboard composes the
  four summary cards the same way.
- Routing is one declarative table (`src/app/routes.ts`): each row names the path, its `.loom`
  template, and the ViewModels to fetch on entry. `createRouterView()` from
  [`@web-loom/template-core-router`](../../packages/template-core-router/) drives the outlet, and
  the router itself is derived from the same table with `toRouteDefinitions()` — no separate route
  map, fetch if-chain, or per-template `use:` fetch trigger.
- Navigation is one `use:links` action on the app-shell root (`createLinkAction(router)`): plain
  `<a href>` anchors everywhere, no per-anchor click wiring.
- Templates bind live ViewModel signals (`data$`, `isLoading$`) — no `useSignal` bridge.
- The mount context is assembled with `composeContext()` (`src/app/context.ts`): namespaced
  ViewModels, an `anyLoading(...)` dashboard signal, helpers, and actions — no hand-written
  bindings class.
- Greenhouse create/update/delete is one `createEntityForm(greenHouseViewModel, [...fields])` call;
  templates bind `greenhouseForm.fields.name`, `greenhouseForm.submit`, and the
  `editGreenhouse(this)` / `deleteGreenhouse(this)` aliases.
- The readings card uses a `use:` element action to mount Chart.js against `sensorReadings.data$`.
- Dev builds enable `UNRESOLVED_CONTEXT_PATH` console diagnostics: a misspelled template path warns
  immediately instead of rendering empty output.
- The application follows a familiar Vite lifecycle: `src/main.ts` creates the app, mounts it into
  `#app`, and unmounts it during HMR. `src/app/index.ts` is the composition root that owns the router,
  template context, shell, route outlet, partial registration, and teardown.

## Run it

The demo API (`apps/api` on port 8000) must be running, same as the other `mvvm-*` apps.

From the repository root:

```bash
npm run dev --workspace mvvm-template-core
```

Or from this directory:

```bash
npm run dev
```

Then open `http://localhost:5183`. Install the local VS Code syntax extension if `.loom` files are
plain text:

```bash
npm run package:vscode-syntax
```

## Verify it

```bash
npm test
npm run type-check
npm run lint
npm run build
```

## Structure

| Area | Responsibility |
| --- | --- |
| `src/templates/*.loom` | View markup (dashboard, lists, layout, cards) |
| `src/templates/index.ts` | `.loom` re-exports and partial registration |
| `src/app/routes.ts` | The route table (path + template + load) and the router derived from it |
| `src/app/context.ts` | `composeContext()` of ViewModels, derived signals, form, helpers, actions |
| `src/app/index.ts` | `createApp()` composition root: mounts the shell and routes, then owns teardown |
| `src/app/chart.ts` | Chart.js `use:` element action |
| `src/main.ts` | Vite client entry: create, mount, and unmount the app during HMR |

See [`packages/template-core/docs/template-loom-authoring.md`](../../packages/template-core/docs/template-loom-authoring.md)
for `.loom` setup, and [`apps/mvvm-react`](../mvvm-react) for the React View this app replaces.
