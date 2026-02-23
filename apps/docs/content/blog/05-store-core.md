# `@web-loom/store-core` — UI State Belongs Somewhere Specific

---

Ask ten engineers where theme preference should live in an application and you'll get ten different answers. In the component. In localStorage. In Redux. In React Context. In a URL parameter. In a cookie. In a database. As a CSS class on the `body`. Honestly, some of them are right, some are wrong, and the reasons why are more interesting than the answers.

The decision reveals a confusion that runs through most web application architectures: there are two fundamentally different kinds of state, and they're often stored in the same place.

---

## Two Kinds of State

**Business state** is data your application exists to manage. A user's name, their orders, the items in their cart, the documents they've created. This state is authoritative in your backend. It has validation rules. It's shared across devices. When it changes, the change is significant enough that it should be persisted and potentially audited. In Web Loom's architecture, business state lives in Models.

**UI state** is state that only the UI cares about. Whether the sidebar is open or closed. Which tab is active. Whether a modal is showing. The current theme. The search term the user has typed but not yet submitted. This state is ephemeral, subjective, and local to the session. Nobody else needs to know about it. Often it doesn't even need to survive a page refresh.

The mistake is treating these the same. Putting UI state in Redux means writing reducers, actions, and selectors for "is the sidebar open." Putting business state in a component's `useState` means it disappears when the component unmounts. Both are mismatches between the storage mechanism and the nature of the data.

`@web-loom/store-core` is designed explicitly for UI state.

---

## What the Package Provides

A single function: `createStore`. It returns a typed `Store` (or `PersistedStore` if you pass a persistence config). The store has `getState()`, `setState()`, `subscribe()`, `destroy()`, and an `actions` object.

No context providers. No reducers. No action creators. No middleware. Just a plain object with reactive state.

```typescript
import { createStore } from '@web-loom/store-core';

interface UIState {
  theme: 'light' | 'dark';
  sidebarOpen: boolean;
  activeTab: string;
  searchQuery: string;
}

export const uiStore = createStore<UIState, typeof actions>(
  {
    theme: 'light',
    sidebarOpen: false,
    activeTab: 'overview',
    searchQuery: '',
  },
  (set, get, actions) => ({
    setTheme: (theme: UIState['theme']) =>
      set(s => ({ ...s, theme })),

    toggleSidebar: () =>
      set(s => ({ ...s, sidebarOpen: !s.sidebarOpen })),

    setActiveTab: (tab: string) =>
      set(s => ({ ...s, activeTab: tab })),

    setSearchQuery: (query: string) =>
      set(s => ({ ...s, searchQuery: query })),
  })
);

// Export individual actions for convenient usage
export const { setTheme, toggleSidebar, setActiveTab, setSearchQuery } = uiStore.actions;
```

The `createActions` callback receives `set`, `get`, and `actions` (a forward reference to the created actions, allowing actions to call each other). This pattern is borrowed from Zustand, which got it right.

---

## Reading and Subscribing

```typescript
// Read current state synchronously
const { theme, sidebarOpen } = uiStore.getState();

// Subscribe to all state changes
const unsub = uiStore.subscribe((newState, oldState) => {
  if (newState.theme !== oldState.theme) {
    document.documentElement.classList.toggle('dark', newState.theme === 'dark');
  }
});

// Stop listening
unsub();
```

The subscription fires with both the new and old state, so you can compare and act selectively without the overhead of a selector system.

---

## Framework Integration

The store is framework-agnostic — it doesn't know or care about React, Vue, or Angular. Connecting it to a framework is typically a few lines.

**React hook:**

```typescript
import { useSyncExternalStore } from 'react';
import { uiStore } from './ui-store';

export function useUIStore<T>(selector: (state: UIState) => T): T {
  return useSyncExternalStore(
    uiStore.subscribe,
    () => selector(uiStore.getState()),
  );
}

// Usage
function Sidebar() {
  const isOpen = useUIStore(s => s.sidebarOpen);
  return <aside className={isOpen ? 'open' : 'closed'}>...</aside>;
}
```

`useSyncExternalStore` is React 18's built-in hook for subscribing to external stores. It handles tearing, concurrent mode, and SSR snapshots correctly. The `uiStore` works as the store argument directly.

**Vue composable:**

```typescript
import { ref, onUnmounted } from 'vue';
import { uiStore } from './ui-store';

export function useUIState<T>(selector: (s: UIState) => T) {
  const value = ref(selector(uiStore.getState()));
  const unsub = uiStore.subscribe((state) => {
    value.value = selector(state);
  });
  onUnmounted(unsub);
  return value;
}

// Usage
const isOpen = useUIState(s => s.sidebarOpen);
```

**Vanilla / Web Components:**

```typescript
class SidebarElement extends HTMLElement {
  private unsub?: () => void;

  connectedCallback() {
    this.unsub = uiStore.subscribe(({ sidebarOpen }) => {
      this.classList.toggle('open', sidebarOpen);
    });
  }

  disconnectedCallback() {
    this.unsub?.();
  }
}
```

---

## Persistence

For UI state that should survive page refreshes — theme preference, sidebar width, last-visited tab — you pass a persistence configuration:

```typescript
import { createStore, LocalStorageAdapter } from '@web-loom/store-core';

const uiStore = createStore(
  { theme: 'light', sidebarOpen: false },
  (set) => ({
    setTheme:       (t) => set(s => ({ ...s, theme: t })),
    toggleSidebar:  ()  => set(s => ({ ...s, sidebarOpen: !s.sidebarOpen })),
  }),
  {
    key: 'my-app:ui-state',
    adapter: new LocalStorageAdapter(),
    merge: true,  // merge loaded state with initial state
  }
);
```

With persistence enabled, the store:
1. Auto-hydrates from storage on creation (asynchronously)
2. Auto-syncs to storage on every state change (fire-and-forget)

Three adapters are included:

- **`LocalStorageAdapter`** — synchronous `localStorage`, serialised as JSON. Works for small state.
- **`IndexedDBAdapter`** — asynchronous, higher storage limits, better for larger datasets.
- **`MemoryAdapter`** — for testing and SSR contexts where browser storage isn't available.

You can implement the `PersistenceAdapter` interface for custom backends:

```typescript
interface PersistenceAdapter {
  save(key: string, value: unknown): Promise<void>;
  load(key: string): Promise<unknown | null>;
  remove(key: string): Promise<void>;
}
```

This makes it straightforward to persist to a remote API, sessionStorage, or a custom cache.

---

## Using Multiple Stores

There's no reason to use a single global UI store. Splitting stores by feature domain keeps things scoped and easy to reason about:

```typescript
// navigation-store.ts
export const navStore = createStore(
  { activeRoute: '/', breadcrumbs: [] as string[] },
  (set) => ({
    navigate: (route: string) =>
      set(s => ({ ...s, activeRoute: route })),
    setBreadcrumbs: (crumbs: string[]) =>
      set(s => ({ ...s, breadcrumbs: crumbs })),
  }),
);

// layout-store.ts
export const layoutStore = createStore(
  { sidebarOpen: true, panelWidth: 320 },
  (set) => ({
    toggleSidebar: () =>
      set(s => ({ ...s, sidebarOpen: !s.sidebarOpen })),
    setPanelWidth: (w: number) =>
      set(s => ({ ...s, panelWidth: w })),
  }),
  {
    key: 'layout',
    adapter: new LocalStorageAdapter(),
  }
);

// theme-store.ts
export const themeStore = createStore(
  { mode: 'system' as 'light' | 'dark' | 'system' },
  (set) => ({
    setMode: (mode: 'light' | 'dark' | 'system') =>
      set(s => ({ ...s, mode })),
  }),
  {
    key: 'theme',
    adapter: new LocalStorageAdapter(),
  }
);
```

Each store is independent. They subscribe separately, persist separately, and are destroyed separately.

---

## Actions Calling Other Actions

The `actions` parameter in `createActions` is a forward reference — you can call other actions from within an action:

```typescript
const store = createStore(
  { isLoggedIn: false, username: '', cartItems: [] as string[] },
  (set, get, actions) => ({
    login: (username: string) => {
      set(s => ({ ...s, isLoggedIn: true, username }));
    },
    logout: () => {
      set(s => ({ ...s, isLoggedIn: false, username: '' }));
      actions.clearCart(); // call another action
    },
    clearCart: () => {
      set(s => ({ ...s, cartItems: [] }));
    },
    addToCart: (item: string) => {
      if (!get().isLoggedIn) {
        console.warn('Cannot add to cart while logged out');
        return;
      }
      set(s => ({ ...s, cartItems: [...s.cartItems, item] }));
    },
  })
);
```

`get()` reads the current state synchronously inside an action — useful for conditional logic.

---

## The Important Rule: Business Data Stays in Models

The architecture constraint is worth repeating. `store-core` is for UI-only state. It should not hold:

- User profile data fetched from an API
- Product listings, order history, messages
- Any state that requires server-side validation or persistence
- Any state another feature's business logic depends on

That data belongs in a `BaseModel` with `data$`, `isLoading$`, and `error$` observables, subject to the full Model lifecycle including validation and disposal.

The UI store is for what panels are open, what tabs are selected, what the user has typed but hasn't submitted. It's a scratchpad for the View layer, not a database.

When you keep this boundary clean, the architecture becomes navigable: "where does the user's name come from?" leads you to `UserModel`. "Whether the profile panel is open" leads you to `uiStore`. There's no ambiguity.

---

## State Comparison and Shallow Equality

The store performs a shallow comparison on state updates. If your action returns a new object that's structurally identical to the old state, listeners are not notified:

```typescript
// This fires subscribers only if `open` actually changed
uiStore.actions.setOpen(open);

// Returning a spread with the same values fires NO subscribers
set(s => ({ ...s })); // ← shallow comparison catches this, no notification
```

For nested state, you're responsible for returning new references at the changed level. The store does not perform deep equality — that would be too expensive for frequent updates.

---

## Cleanup

```typescript
uiStore.destroy();  // clears all listeners, does NOT clear persisted storage
await uiStore.clearPersisted(); // clears storage (PersistedStore only)
```

`destroy()` is useful in tests and in single-page application routing where a feature's store should be torn down when the user leaves a route.

---

## Comparison to Alternatives

**Zustand**: The pattern in `store-core` is directly inspired by Zustand. The main difference is that `store-core` is not tied to React — there's no `useStore` hook in the package. You bring your own framework integration. `store-core` is also lighter than Zustand in terms of features; it doesn't include middleware, devtools integration, or immer support. It doesn't need to be heavier.

**Jotai / Recoil**: Atom-based stores where each piece of state is a separate atom, composed through selectors. More granular than `store-core` at the cost of more upfront API surface. Tightly coupled to React.

**Valtio**: Proxy-based reactive state. Mutations are tracked automatically. More magic, harder to reason about when things go wrong. React-specific integrations.

**React Context**: Not a store — it's a dependency injection mechanism for static or slow-changing values. Fine for themes passed to a styled-system, wrong for frequently-changing UI state (causes re-renders in all consumers).

`store-core` is deliberately minimal. It gives you reactive state, typed actions, and optional persistence — and nothing else.

---

## Installing

```bash
npm install @web-loom/store-core
```

Zero runtime dependencies. TypeScript types included. Works in browser and Node.js environments.

---

Next in the series: `@web-loom/query-core`, the data-fetching layer that brings stale-while-revalidate caching to any Model without coupling you to a specific framework's data-fetching solution.
