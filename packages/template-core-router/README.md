# @web-loom/template-core-router

Declarative routing for [`@web-loom/template-core`](../template-core/) apps, binding
[`@web-loom/router-core`](../router-core/) to template outlets. Replaces the three
hand-synced structures a template-core app otherwise maintains — router route
definitions, a path→template map, and a path→fetch chain — with one table, and
replaces per-anchor click wiring with one delegated `use:` action.

## createRouterView

```ts
import { createRouter } from '@web-loom/router-core';
import { createRouterView, toRouteDefinitions, type TemplateRoute } from '@web-loom/template-core-router';

const routes: TemplateRoute<AppContext>[] = [
  { path: '/', template: dashboardTemplate, load: () => vm.fetchCommand.execute() },
  { path: '/sensors', template: sensorListTemplate, load: () => sensorVm.fetchCommand.execute() },
];

const router = createRouter({ mode: 'history', routes: toRouteDefinitions(routes) });

const view = createRouterView(outletEl, {
  router,
  routes,
  notFound: notFoundTemplate,
  context, // the object every route template mounts against
});
// later: view.dispose(); router.destroy();
```

- The matching route's template is shown immediately and on every navigation
  (`router.subscribe` emits on subscribe).
- `load` runs on each entry into its route — no per-template `use:` fetch
  triggers. Rejections go to `onLoadError` (default: `console.error`).
- `toRouteDefinitions(routes)` derives the router-core definitions from the same
  table so router and view cannot disagree about which paths exist.
- Disposing unsubscribes from the router and tears down the mounted template.

## createLinkAction

A delegated navigation handler for `use:` on a container (typically the app
shell root):

```html
<div class="app-shell" use:links="links">
  <a href="/sensors">Sensors</a> <!-- no per-anchor wiring -->
</div>
```

```ts
const context = { links: createLinkAction(router), ... };
```

Unmodified left-clicks on same-origin `<a href>` descendants route through
`router.push`. Modified clicks, non-left buttons, `target`/`download` links,
external origins, `#hash` links, and `data-native` anchors fall through to the
browser.

See [`apps/mvvm-template-core`](../../apps/mvvm-template-core/) for a complete
application using both.
