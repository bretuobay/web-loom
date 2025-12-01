## @web-loom/router-core

A lightweight, browser-native, framework-agnostic routing utility. It abstracts the History API, exposes declarative route matching, guard orchestration, lifecycle hooks, and query helpers while staying rendering-agnostic so adapters can integrate with any UI stack.

### Features

- **Declarative routes** including nested hierarchies, dynamic segments (`/users/:id(\\d+)`), and wildcards.
- **Flexible matching** with exact or prefix strategies, param extraction, and standalone `matchRoute()` helper.
- **History/hash modes** with a single `createRouter` interface that handles push, replace, and popstate/hashchange syncing.
- **Navigation guards & lifecycle hooks** (`beforeEach`, per-route `beforeEnter`/`canActivate`, `afterEach`, `onError`) returning booleans, redirects, or promises.
- **Query utilities** (`parseQuery`, `stringifyQuery`, `buildURL`) for consistent URL handling and location object support.
- **Observable state** via `router.subscribe` plus `router.currentRoute` snapshot for integration with frameworks or vanilla code.

### Basic Usage

```ts
import { createRouter } from '@web-loom/router-core';

const router = createRouter({
  mode: 'history',
  base: '/',
  routes: [
    { path: '/', name: 'home' },
    {
      path: '/users',
      children: [
        { path: '/', name: 'user-list' },
        {
          path: '/:id(\\d+)',
          name: 'user-detail',
          meta: { auth: true },
          beforeEnter: (to) => {
            if (!isLoggedIn()) return '/login';
          },
        },
      ],
    },
    { path: '/login', name: 'login' },
  ],
});

router.subscribe((route) => {
  console.log('Route changed:', route.fullPath);
});

router.push('/users/42?tab=info');
```

### Programmatic Navigation

- `router.push(pathOrLocation)`
- `router.replace(pathOrLocation)`
- `router.go(n)`, `router.back()`, `router.forward()`
- `router.resolve(pathOrLocation)` returns a `RouteMatch` without navigating.

Location objects take `{ path: string; query?: Record<string, string | number | boolean | (string | number | boolean)[]> }` and the utilities ensure normalized URLs.

### Guards, Hooks, and Errors

```ts
const stop = router.beforeEach((to, from) => {
  if (to.meta.auth && !isLoggedIn()) return { path: '/login', replace: true };
});

router.afterEach((to, from) => {
  analytics.track('page_view', to.fullPath);
});

router.onError((error) => {
  console.error('Router error', error);
});
```

Guard return values:

- `true`/`undefined` – continue
- `false` – cancel navigation (restores previous URL for popstate)
- `string | { path, replace?, query? }` – redirect

### Standalone Utilities

```ts
import { matchRoute, parseQuery, stringifyQuery, buildURL } from '@web-loom/router-core';

const match = matchRoute(routes, '/files/image.png');
const parsed = parseQuery('?page=2&tag=a&tag=b');
const q = stringifyQuery({ page: 2, tags: ['a', 'b'] });
const full = buildURL('/users/7', { tab: 'activity' });
```

### Testing / Development

Run the Vitest suite:

```bash
npm run test --workspace packages/router-core
```

If you see `SyntaxError: The requested module 'node:events' does not provide an export named 'EventEmitterAsyncResource'`, upgrade the local Node.js runtime to a version that exposes that API (Node 18.17+, 20+, or 22).
