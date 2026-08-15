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
- Route content is swapped with `createTemplateOutlet()`, matching `mvvm-react`'s router table:
  `/`, `/dashboard`, `/greenhouses`, `/sensors`, `/sensor-readings`, `/threshold-alerts`.
- Templates bind live ViewModel signals (`data$`, `isLoading$`) — no `useSignal` bridge.
- Greenhouse create/update/delete uses `bind:value` form fields and `on:click="deleteGreenhouse(this)"`.
- The readings card uses a `use:` element action to mount Chart.js against `sensorReadings.data$`.

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
| `src/app/view.ts` | Mounts the shell and swaps route templates |
| `src/app/bindings.ts` | View-bound actions (`navigateFromClick`, greenhouse CRUD, chart) |
| `src/app/view-model.ts` | Routing plus the same fetch commands React calls on mount |
| `src/main.ts` | Client entry: mount, start, dispose on HMR |

See [`packages/template-core/docs/template-loom-authoring.md`](../../packages/template-core/docs/template-loom-authoring.md)
for `.loom` setup, and [`apps/mvvm-react`](../mvvm-react) for the React View this app replaces.
