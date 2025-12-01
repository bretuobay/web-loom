Below is a **detailed, implementation-ready, coding-agent-friendly API Reference** for **@web-loom/router-core**, covering all major functions, types, interfaces, events, utilities, and lifecycle hooks.
This is written in a way that a coding agent can directly implement or scaffold from.

---

# **@web-loom/router-core – Proposed API Reference**

A lightweight, browser-native, framework-agnostic routing utility library.

---

# **1. Core Concepts**

### Router Core Provides:

- Route definitions (flat or nested)
- Route matching (+ params + query)
- Navigation (push, replace, go/back)
- Navigation guards
- Route lifecycle hooks
- Observable/reactive route state
- Mode selection (history or hash)

### Router Does _Not_ Provide:

- Rendering / components
- Framework-specific bindings (handled by adapters)
- SSR routing
- Route-level data loaders (unless added later)

---

# **2. Installation**

```ts
import { createRouter } from '@web-loom/router-core';
```

---

# **3. Core Types**

### **3.1 Route Definition**

```ts
export interface RouteDefinition {
  path: string; // '/users/:id'
  name?: string;
  component?: unknown; // router-core doesn't use it but apps may
  children?: RouteDefinition[];
  meta?: Record<string, any>; // { auth: true, title: 'User Detail' }

  // Optional guards
  beforeEnter?: NavigationGuard;
  canActivate?: NavigationGuard;
}
```

---

### **3.2 NavigationGuard**

```ts
export type NavigationGuard = (
  to: RouteMatch,
  from: RouteMatch | null,
) =>
  | boolean // true = allow, false = block
  | string // redirect to path
  | RedirectObject // { path: '/login', replace?: true }
  | Promise<boolean | string | RedirectObject>;
```

---

### **3.3 RedirectObject**

```ts
export interface RedirectObject {
  path: string;
  replace?: boolean;
}
```

---

### **3.4 RouteMatch**

```ts
export interface RouteMatch {
  fullPath: string;
  path: string;
  name?: string;
  params: Record<string, string>;
  query: Record<string, string | string[]>;
  meta: Record<string, any>;
  matched: RouteDefinition[]; // parent → child
}
```

---

### **3.5 RouterOptions**

```ts
export interface RouterOptions {
  routes: RouteDefinition[];
  mode?: 'history' | 'hash'; // default: 'history'
  base?: string; // default: '/'
}
```

---

# **4. Core API**

## **4.1 createRouter(options)**

Creates the router instance.

```ts
const router = createRouter({
  routes,
  mode: 'history',
  base: '/',
});
```

Returns a `Router` instance.

---

## **4.2 Router Instance API**

### **router.currentRoute (readonly)**

```ts
router.currentRoute: RouteMatch;
```

Reactive/observable via subscription:

```ts
const unsubscribe = router.subscribe((route) => {
  console.log('route changed', route);
});
```

---

### **router.push(pathOrLocation)**

```ts
router.push('/dashboard');
router.push({ path: '/users/123', query: { page: '2' } });
```

Returns a Promise resolved when navigation finishes.

---

### **router.replace(pathOrLocation)**

Same as `push` but uses `history.replaceState`.

---

### **router.go(n)**

```ts
router.go(-1); // back
router.go(1); // forward
```

---

### **router.back() / router.forward()**

```ts
router.back();
router.forward();
```

---

### **router.resolve(path)**

Returns a `RouteMatch` without navigating.

```ts
const match = router.resolve('/users/12?page=2');
```

---

### **router.beforeEach(guardFn)**

Global navigation guard.

```ts
router.beforeEach((to, from) => {
  if (to.meta.auth && !isLoggedIn()) {
    return '/login';
  }
});
```

---

### **router.afterEach(callback)**

Called after navigation completes.

```ts
router.afterEach((to, from) => {
  analytics.track('page_view', to.fullPath);
});
```

---

### **router.onError(handler)**

Global error handler for guard errors or route match failures.

```ts
router.onError((err) => console.error(err));
```

---

### **router.subscribe(listener)**

Listen to route changes.

```ts
const unsub = router.subscribe((route) => {
  console.log('Route changed:', route);
});
```

---

# **5. Route Matching Utilities**

The library exposes standalone utilities for advanced applications.

---

## **5.1 matchRoute(routeDefinitions, path)**

```ts
import { matchRoute } from '@web-loom/router-core';

const match = matchRoute(routes, '/users/12');
```

Returns:

```ts
{
  path: '/users/:id',
  params: { id: '12' },
  meta: {},
  matched: [...]
}
```

---

## **5.2 parseQuery(queryString)**

```ts
parseQuery('?page=2&tags=a&tags=b');
```

Returns:

```ts
{ page: '2', tags: ['a', 'b'] }
```

---

## **5.3 stringifyQuery(params)**

```ts
stringifyQuery({ page: 2, search: 'hello' });
// ?page=2&search=hello
```

---

## **5.4 buildURL(path, queryParams)**

```ts
buildURL('/users', { page: 3 });
// '/users?page=3'
```

---

# **6. Navigation Events & Lifecycle Hooks**

All navigation goes through these steps:

```
1. resolve new route
2. run global beforeEach guards
3. run per-route beforeEnter / canActivate
4. if guard returns redirect → redirect
5. finalize navigation (update currentRoute)
6. run afterEach hooks
7. notify subscribers
```

---

## **6.1 Global Hooks**

### **router.beforeEach(guardFn)**

Runs before matching route is confirmed.

### **router.afterEach(callback)**

Runs after final route change.

---

## **6.2 Per-Route Guards**

Defined on `RouteDefinition`:

```ts
{
  path: '/admin',
  meta: { auth: true },
  beforeEnter: (to, from) => { ... },
  canActivate: (to, from) => { ... }
}
```

---

## **6.3 Navigation Cancelling**

If any guard returns:

- `false` → cancel navigation
- `string` → redirect
- `{ path: '/login' }` → redirect

---

# **7. Navigation Location Objects**

All navigation APIs accept:

### **7.1 Path String**

```ts
router.push('/users');
```

### **7.2 Location Object**

```ts
router.push({
  path: '/users/12',
  query: { page: 2 },
});
```

Full type:

```ts
interface NavigationLocation {
  path: string;
  query?: Record<string, any>;
  replace?: boolean;
}
```

---

# **8. Hash Mode**

If `mode: 'hash'`, router uses `#/path` and listens to `hashchange`.

```ts
createRouter({
  routes,
  mode: 'hash',
});
```

---

# **9. History Mode**

Uses `pushState`, `replaceState`, & `popstate`.

---

# **10. Error Handling**

### Router errors surface via:

- `router.onError(handler)`
- thrown promises on navigation attempts

Handled cases:

- invalid route
- guard returning invalid value
- async guard errors
- mismatch errors

---

# **11. Framework Adapters (Optional Separate Packages)**

The core router exposes lightweight helpers for adapters.

---

## **11.1 React Adapter Example**

```ts
import { useRoute, useRouter } from '@web-loom/router-react';
```

### **useRoute()**

Returns current `RouteMatch`.

### **useRouter()**

Returns router instance for push/replace navigation.

---

## **11.2 Vue Adapter Example**

```ts
import { RouterPlugin } from '@web-loom/router-vue';
```

Provides:

- `useRoute()`
- `useRouter()`
- `<RouterView />`

---

## **11.3 Angular Adapter Example**

Angular binds through a service wrapper.

---

# **12. Example Usage**

## **12.1 Basic Router Setup**

```ts
import { createRouter } from '@web-loom/router-core';

const router = createRouter({
  mode: 'history',
  routes: [
    { path: '/', name: 'home' },
    {
      path: '/users',
      children: [
        { path: '/', name: 'user-list' },
        {
          path: '/:id',
          name: 'user-detail',
          meta: { auth: true },
          beforeEnter: (to) => {
            if (!isLoggedIn()) return '/login';
          },
        },
      ],
    },
  ],
});

router.push('/users/12?page=2');
```

---

# **13. Future Extension Hooks (Optional)**

These should be considered extensible, but not implemented initially:

- Route-level data loaders
- Scroll position restoration
- Router snapshot saving/restoring
- State-based serialization/deserialization

---

# **14. Summary**

This API reference defines the full surface area required for a lightweight, framework-agnostic SPA router, aligned with modern browser standards and your project constraints.

---
