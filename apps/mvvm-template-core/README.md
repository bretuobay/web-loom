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
- The application shell is a slotted frame. Header, footer, dashboard cards, and greenhouse
  list rows are `@web-loom/view` components: the call site passes every value they read.
  Pages import those children with `withPartials` — there is no global `registerPartial` bag.
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
  template context, shell, route outlet, and teardown.

## Application composition patterns

The application is arranged around the same boundaries commonly found in React and Vue projects:
a small browser entrypoint, one application composition root, a declarative router, a root shell,
and independently-authored screen templates.

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

`templates/app-shell.ts` owns persistent page chrome. It imports the frame, header, and footer
locally and passes each binding at the call site:

```html
{{#> app-frame links=links}} {{#slot header}}{{> header items=navigationItems$}}{{/slot}} {{#slot footer}}{{> footer
year=currentYear}}{{/slot}} {{/app-frame}}
```

The shell is mounted once. `createRouterView()` owns only the contents of the route outlet, replacing
and disposing the active screen when navigation changes. The delegated `use:links` action lets the
templates keep ordinary `<a href>` elements while the router handles same-origin navigation.

### Keep routing declarative

`src/app/routes.ts` is the single route manifest. Each entry keeps the URL, route name, screen
template, and route-entry data load together:

```ts
{
  path: '/sensors',
  name: 'sensors',
  template: sensorListTemplate,
  load: () => sensorViewModel.fetchCommand.execute(),
}
```

`toRouteDefinitions(appRoutes)` derives the router configuration from that manifest. Adding a screen
therefore requires one route entry rather than separate router, renderer, and fetch mappings.

### Make the template context the view boundary

`src/app/context.ts` creates the one object visible to `.loom` templates. `composeContext()` combines
namespaced domain ViewModels with UI-specific state and behavior:

- domain data and commands remain on their ViewModels;
- derived signals such as `dashboardLoading$` are composed at the view boundary;
- forms and element actions are created once per mount;
- formatting helpers and template-friendly aliases stay out of domain models.

When a template needs a new value, first decide whether it belongs to a domain ViewModel or is a
view concern. Only view concerns should be added directly to `createAppContext()`.

### Pair setup with teardown

Every setup operation that creates listeners, bindings, or global registration has a matching cleanup:

| Setup                      | Teardown                |
| -------------------------- | ----------------------- |
| `appShellTemplate.mount()` | shell `dispose()`       |
| `createRouterView()`       | router-view `dispose()` |
| `createAppRouter()`        | router `destroy()`      |

`app.unmount()` releases these resources in reverse ownership order: routed screen, shell, then
router. It is safe to call more than once, which keeps HMR and test cleanup straightforward.

### Adding another screen

Follow this flow to preserve the composition boundaries:

1. Add the screen and any reusable partials under `src/templates`.
2. Export the template from a sibling TS module that `withPartials`/`defineComponent` imports.
3. Add one typed entry to `appRoutes`, including its route-entry load when needed.
4. Add view-only context values to `createAppContext()`; keep domain behavior in its ViewModel.
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
| `src/templates/*.loom`   | View markup (dashboard, lists, layout, cards)                                   |
| `src/templates/index.ts` | Page templates and components; each page owns its `partials` map                |
| `src/app/routes.ts`      | The route table (path + template + load) and the router derived from it         |
| `src/app/context.ts`     | `composeContext()` of ViewModels, derived signals, form, helpers, actions       |
| `src/app/index.ts`       | `createApp()` composition root: mounts the shell and routes, then owns teardown |
| `src/app/chart.ts`       | Chart.js `use:` element action                                                  |
| `src/main.ts`            | Vite client entry: create, mount, and unmount the app during HMR                |

See [`packages/template-core/docs/template-loom-authoring.md`](../../packages/template-core/docs/template-loom-authoring.md)
for `.loom` setup, and [`apps/mvvm-react`](../mvvm-react) for the React View this app replaces.
