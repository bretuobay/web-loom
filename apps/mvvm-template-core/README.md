# MVVM Template Core

`mvvm-template-core` is the greenhouse dashboard from [`mvvm-react`](../mvvm-react) rendered with
`@web-loom/template-core` instead of React. It uses the same shared ViewModels
(`greenHouseViewModel`, `sensorViewModel`, `sensorReadingViewModel`, `thresholdAlertViewModel`) and
the same routes. Each screen is a `defineComponent` whose markup lives in a sibling `.loom` file —
no React, Vue, Lit, or adapter hook.

This is the `.loom` authoring example for the greenhouse domain. [`ecommerce-template-core`](../ecommerce-template-core)
remains the ecommerce/SSR reference; this app is the MVVM demo counterpart to `mvvm-react`.

## What it demonstrates

- Every screen lives in `src/templates/*.loom` so the VS Code
  [`vscode-template-core-syntax`](../../packages/vscode-template-core-syntax/) extension can highlight
  `{{ }}`, `{{#if}}`/`{{#each}}`, `{{> partial}}`, and `on:`/`bind:`/`use:` directives in-file.
- The Vite plugin [`templateCoreLoom()`](../../packages/template-core-vite/) loads those files
  (`compile()` in dev, `fromPrecompiled()` in build).
- The application shell is a slotted frame. Header, footer, dashboard cards, and greenhouse
  list rows are `@web-loom/view` components. Header, footer, and the readings card construct
  their own values in `setup` (nav items, year, Chart.js action); other call sites pass every
  value the child reads. Screens pass children through `defineComponent({ partials })` — there is
  no global `registerPartial` bag.
- Routing is one declarative table (`src/app/routes.ts`): each row names the path and its
  screen component. That screen's `setup` starts the ViewModel fetch. `createRouterView()` from
  [`@web-loom/template-core-router`](../../packages/template-core-router/) drives the outlet, and
  the router itself is derived from the same table with `toRouteDefinitions()`.
- Navigation is one `use:links` action on the app-shell root (`createLinkAction(router)`): plain
  `<a href>` anchors everywhere, no per-anchor click wiring.
- Screens bind live ViewModel signals (`data$`, `isLoading$`) — no `useSignal` bridge.
- The mount context is assembled with `composeContext()` (`src/app/context.ts`): namespaced
  ViewModels and the delegated `links` action. Screen-owned loading, forms, and helpers
  are created in that screen's `setup`.
- Greenhouse create/update/delete is one `createEntityForm(...)` call in the list page
  `setup`; templates bind `greenhouseForm.fields.name`, `greenhouseForm.submit`, and
  `onEdit=../greenhouseForm.edit` / `onDelete=../greenhouseForm.remove`.
- The readings card's `setup` builds the Chart.js `use:` action against `sensorReadings.data$`.
- Dev builds enable `UNRESOLVED_CONTEXT_PATH` console diagnostics: a misspelled template path warns
  immediately instead of rendering empty output.
- The application follows a familiar Vite lifecycle: `src/main.ts` creates the app, mounts it into
  `#app`, and unmounts it during HMR. `src/app/index.ts` is the composition root that owns the router,
  template context, shell, route outlet, and teardown.

## Application composition patterns

The application is arranged around the same boundaries commonly found in React and Vue projects:
a small browser entrypoint, one application composition root, a declarative router, a root shell,
and independently-authored screen components.

### Keep the Vite entrypoint small

`src/main.ts` is only responsible for browser bootstrap. It imports global styles, resolves the host
element, creates the application, mounts it, and connects Vite HMR to the public teardown method.

```ts
import { createApp } from './app';

const container = document.getElementById('app');
if (!container) throw new Error('The application root was not found.');

const app = createApp();
app.mount(container);

if (import.meta.hot) import.meta.hot.dispose(() => app.unmount());
```

Application services, routes, templates, and ViewModels should not be assembled in `main.ts`.

### Use one composition root

`src/app/index.ts` is the equivalent of the root application component and framework setup. Its
`createApp()` factory owns every resource needed for one mounted application:

1. Create the router.
2. Compose the template context.
3. Mount the application shell (its `partials` map is already on the template).
4. Find the shell's route outlet and bind it with `createRouterView()`.

If mounting fails partway through, the factory rolls back the resources already created. A mounted
instance cannot be mounted a second time, but it can be mounted again after `unmount()` completes.

### Treat the shell like a root layout

`templates/app-shell.ts` is the root chrome component. It imports the frame, header, and footer
locally. Header and footer run `setup` for nav items and the year:

```html
{{#> app-frame links=links}}
  {{#slot header}}{{> header}}{{/slot}}
  {{#slot footer}}{{> footer}}{{/slot}}
{{/app-frame}}
```

The shell is mounted once. `createRouterView()` owns only the contents of the route outlet, replacing
and disposing the active screen when navigation changes. The delegated `use:links` action lets the
templates keep ordinary `<a href>` elements while the router handles same-origin navigation.

### Keep routing declarative

`src/app/routes.ts` is the single route manifest. Each entry keeps the URL, route name, and screen
template together. The screen's `setup` starts its fetch:

```ts
{
  path: '/sensors',
  name: 'sensors',
  template: sensorList,
}
```

`toRouteDefinitions(appRoutes)` derives the router configuration from that manifest. Adding a screen
therefore requires one route entry plus `setup` on that screen, rather than a separate fetch map.

### Make the template context the view boundary

`src/app/context.ts` is the shared provider: namespaced ViewModels plus `links`. A screen's
`setup` adds anything only that screen uses (`dashboardLoading$`, `greenhouseForm`,
`formatTimestamp`).

When a template needs a new value, first decide whether it belongs to a domain ViewModel, the
shared app context, or that screen's `setup`.

### Pair setup with teardown

Every setup operation that creates listeners, bindings, or global registration has a matching cleanup:

| Setup                      | Teardown                |
| -------------------------- | ----------------------- |
| `appShell.mount()`         | shell `dispose()`       |
| `createRouterView()`       | router-view `dispose()` |
| `createAppRouter()`        | router `destroy()`      |

`app.unmount()` releases these resources in reverse ownership order: routed screen, shell, then
router. It is safe to call more than once, which keeps HMR and test cleanup straightforward.

### Adding another screen

Follow this flow to preserve the composition boundaries:

1. Add the screen markup and any child `.loom` files under `src/templates`.
2. Export a `defineComponent` from the sibling TS module (`dashboard.ts` uses `dashboard.loom`).
3. Add one typed entry to `appRoutes`. Fetch in the screen's `defineComponent` `setup`.
4. Add shared context values to `createAppContext()`; add screen-only helpers in that
   screen's `setup`. Keep domain behavior in its ViewModel.
5. Exercise the screen by mounting through `createApp()` in tests rather than constructing the router
   or template view manually.

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

| Area                     | Responsibility                                                                  |
| ------------------------ | ------------------------------------------------------------------------------- |
| `src/templates/*.loom`   | Component markup (dashboard, lists, layout, cards)                              |
| `src/templates/*.ts`     | `defineComponent` screens and children; each screen owns its `partials` map     |
| `src/app/routes.ts`      | The route table (path + screen) and the router derived from it                  |
| `src/app/context.ts`     | Shared provider: namespaced ViewModels and `links`                              |
| `src/app/index.ts`       | `createApp()` composition root: mounts the shell and routes, then owns teardown |
| `src/app/chart.ts`       | Chart.js `use:` element action                                                  |
| `src/main.ts`            | Vite client entry: create, mount, and unmount the app during HMR                |

See [`packages/template-core/docs/template-loom-authoring.md`](../../packages/template-core/docs/template-loom-authoring.md)
for `.loom` setup, and [`apps/mvvm-react`](../mvvm-react) for the React View this app replaces.
