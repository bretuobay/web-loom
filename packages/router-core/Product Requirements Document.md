Below is a complete, clean, and well-structured **Product Requirements Document (PRD)** for **Routing & Navigation**, based on your specifications and aligned with the philosophy of a _lightweight, framework-agnostic, modern-browser-first routing layer_.

---

# **Product Requirements Document (PRD)**

## **2. Routing & Navigation**

---

## **1. Overview**

Modern Single Page Applications (SPAs) rely on predictable, declarative routing systems to map URL states to application views. Today, routing within the platform is handled inconsistently, with different apps relying on React Router, Vue Router, Angular Router, or custom solutions. There is no shared routing foundation, making cross-framework consistency impossible.

The **Routing & Navigation** module provides a **lightweight, framework-agnostic, browser-native routing utility library** designed to cover common navigation needs without duplicating full-fledged framework router features. It leverages the browser’s History API, URL interface, and native event systems, offering a unified base that works across frameworks and vanilla apps.

The module will be implemented in **@web-loom/router-core**.

---

## **2. Goals & Objectives**

### **Primary Goals**

- Provide a **framework-agnostic SPA router** with core routing primitives.
- Enable **declarative route definitions** for easy configuration.
- Support **nested routes**, **layouts**, and **route hierarchies**.
- Provide **query parameters and route params** parsing utilities.
- Offer **navigation guards** for authentication and permissions.
- Abstract the **History API** for push/replace/go-back navigation.
- Support both **browser history** and **hash mode**.
- Provide **lightweight route transitions and loading-state hooks**.
- Enable **deep linking** and direct URL resolution.

### **Secondary Goals**

- Provide optional adapters for React, Vue, Angular, and vanilla JS.
- Keep the library minimal—avoid turning into a full framework router.
- Work seamlessly with progressive enhancement patterns.

---

## **3. Non-Goals**

- Not a full competitor to React Router, Vue Router, Angular Router.
- Not intended for complex router-based rendering engines.
- Will not manage component mounting or framework-specific tree reconciliation.
- No server-side rendering routing (handled at framework level).
- No opinionated animation library for transitions—just hooks.

---

## **4. Current State**

### **Existing Tools**

- **plugin-core** mentions “route registration,” but no router implementation exists.
- Apps today rely on:
  - React Router
  - Vue Router
  - Angular Router
  - Ad hoc navigation utilities

### **Problems**

- No shared logic for:
  - route definitions
  - route matching
  - history/URL handling
  - query/param parsing
  - route guards

- Hard to replicate behavior across frameworks.
- No portable router implementation for microfrontends or framework-free widgets.

---

## **5. Why It Matters**

A unified routing layer enables:

- **Consistency** across platforms and frameworks.
- **Code sharing** between libraries, widgets, and microfrontends.
- **Predictability** for navigation, route guards, authentication checks.
- **Lightweight use cases** where full framework routers are unnecessary.
- **Lower complexity** for embedding components across environments.
- **Improved developer experience** by avoiding routing boilerplate.

Routing is fundamental to SPA behavior—this module ensures we never reinvent the wheel in each app.

---

## **6. Product Scope**

### **6.1 Declarative Route Definitions**

Support route lists such as:

```ts
const routes = [
  { path: '/', component: Home },
  {
    path: '/users',
    children: [
      { path: '/', component: UserList },
      { path: '/:id', component: UserDetail, meta: { auth: true } },
    ],
  },
];
```

Must support:

- nested routes
- dynamic parameters (`/:id`)
- wildcards (`*`)
- optional metadata

---

### **6.2 Route Matching Algorithms**

Support the following:

- **exact match**
- **prefix match**
- **regex-based routes**
- dynamic segment extraction (`/user/:id` → `{ id: '123' }`)
- return a **matched route object** with:
  - params
  - query
  - meta
  - full path

Should support a configurable matching strategy.

---

### **6.3 Nested Routes & Layout Support**

Allow hierarchical route structures that resolve to:

- a matched route chain (parent → child → leaf)
- layout metadata inheritance
- progressive route transitions (e.g., parent loads before child)

---

### **6.4 Navigation Guards**

Hooks to run before navigation is confirmed:

- `beforeEnter(route, from)`
- `canActivate(route, context)`
- async/promise-based guard results
- allow/deny/redirect behavior

Example use cases:

- authentication checks
- role and permission checks
- unsaved changes prompts

---

### **6.5 Query Parameters & Route Params**

Provide a unified parsing utility:

- parse query string using `URLSearchParams`
- extract params from route patterns
- watch for query-only changes (optional)

Should support type-safe helpers.

---

### **6.6 History Management**

Abstract the browser’s navigation layer:

- `push(path)`
- `replace(path)`
- `back()`, `forward()`, `go(n)`

Support both modes:

- **browser history mode** (default)
- **hash mode** (`#/path`) for legacy or embedded apps

---

### **6.7 Route Transitions & Loading States**

Provide lifecycle hooks:

- `onBeforeNavigate`
- `onAfterNavigate`
- `onRouteLoading`
- `onRouteResolved`

Use cases:

- loading spinners
- route transition animations
- analytics events

The system should not perform animations itself—just expose hooks.

---

### **6.8 Deep Linking Support**

- Direct navigation to nested routes
- URL parsing on initial load
- Proper restoration on refresh or link paste
- Hash-based deep links for embedded contexts

---

### **6.9 Framework Adapters (Optional Packages)**

For React, Vue, and Angular:

- `<RouterProvider />`
- `<Link />`
- `useRoute`, `useNavigation` hooks
- Navigation events via subscriptions or reactivity

Adapters keep frameworks optional and separate—core stays framework-agnostic.

---

## **7. Architecture & Integration**

### **Suggested Package**

- **@web-loom/router-core**

### **Design Philosophy**

- Lightweight
- Uses modern browser features:
  - URL API
  - History API
  - native events (`popstate`)

- Strictly utilities—not opinionated rendering
- Suitable for Web Components, microfrontends, and non-SPA widgets

### **High-Level Architecture**

```
                +-----------------------+
                |    Framework App      |
                +-----------------------+
                   /     |      \
                  v      v       v
          React Adapter  Vue Adapter  Angular Adapter
                  \       |       /
                   \      |      /
                 +-------------------+
                 |  Router Core API  |
                 +-------------------+
                /   |    |      |    \
               v    v    v      v     v
      History API  Matcher  Guards  Params  Query Utils
```

---

## **8. Requirements**

### **Functional Requirements**

| ID   | Requirement                            | Priority |
| ---- | -------------------------------------- | -------- |
| FR1  | Framework-agnostic router              | P0       |
| FR2  | Declarative route definitions          | P0       |
| FR3  | Route matching (exact/prefix/regex)    | P0       |
| FR4  | Nested routes + layouts                | P0       |
| FR5  | Route guards                           | P0       |
| FR6  | Query params + route params parsing    | P0       |
| FR7  | History management abstraction         | P0       |
| FR8  | Deep linking support                   | P0       |
| FR9  | Router lifecycle hooks                 | P1       |
| FR10 | Hash and history modes                 | P1       |
| FR11 | Framework adapters (React/Vue/Angular) | P2       |
| FR12 | Lightweight API surface                | P0       |

### **Non-Functional Requirements**

| Requirement   | Description                                 |
| ------------- | ------------------------------------------- |
| Bundle Size   | Ideally < 5 KB gzip for router-core         |
| Performance   | Must resolve routes within <1 ms            |
| Compatibility | Works in all modern browsers                |
| Stability     | URL parsing and matching must be consistent |
| Extensibility | Users can extend guards, matching, adapters |

---

## **9. User Stories**

### **As a developer:**

1. _I want to define a simple route table_ without framework lock-in.
2. _I want to match a route and extract params_ like `/users/:id`.
3. _I want to guard routes behind auth_ using a `beforeEnter` check.
4. _I want to navigate programmatically_ with `router.push('/dashboard')`.
5. _I want deep linking_ so users can bookmark a nested view.
6. _I want to parse query parameters consistently_ without rewriting logic.
7. _I want lightweight routing utilities_ when a full router is unnecessary.

---

## **10. Open Questions**

- Should transitions include cancellable promises?
- Should we support route-level data loaders (like Remix/Next)?
- Should we allow direct regex route definitions, or restrict them for simplicity?
- Should route changes optionally trigger scroll restoration?

---

## **11. Appendix**

### **Suggested Package**

- **@web-loom/router-core**
  A lean routing utility layer designed for cross-framework use and browser-native behavior.

---
