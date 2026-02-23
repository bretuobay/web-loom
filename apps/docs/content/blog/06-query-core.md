# `@web-loom/query-core` — Data Fetching With a Memory

---

There's a scenario every web developer has written at least once. The user navigates away from a list page, does something else in the app, comes back to the list page — and the application spins a loading indicator and fetches the data again from scratch. The user waits. The data arrives. It's identical to what they saw thirty seconds ago.

Or the inverse: the user submits a form on one tab, switches to another tab showing related data, and the second tab shows stale information because its data was fetched when it first mounted and has never been refreshed.

Both of these problems have a well-known solution: caching with invalidation. Fetch the data, store it with a timestamp, serve it from cache on subsequent requests, mark it stale after a configurable interval, and re-fetch in the background when it's requested again and stale. This is the stale-while-revalidate strategy, originally an HTTP caching directive, adapted for client-side data fetching.

The web community re-discovered this pattern around 2019, and it powered the rise of SWR, React Query, and later TanStack Query. Those libraries are excellent. `@web-loom/query-core` provides the same strategy without coupling you to React or any other framework.

---

## The History of Client-Side Caching

For most of React's early life, data fetching was manual and stateless. You called `fetch` in `componentDidMount`, stored the result in component state, and when the component unmounted, the data was gone. Navigate back to the component and it fetched again. Every time.

Redux offered a way to cache data in a global store, but it required reducers, action creators, normalised state shapes, and significant boilerplate. The cache invalidation logic was your problem.

Apollo Client solved this elegantly for GraphQL: every query result was cached by its query + variables, normalised into an entity store, and automatically updated when mutations returned data. The tradeoff was that it required GraphQL — you couldn't use it with REST without significant adaptation.

Vercel's `swr` library (2019) brought the stale-while-revalidate pattern to React without requiring GraphQL. React Query (2020) went further, adding window focus refetching, online/offline handling, query invalidation, and mutation support. Both were React-specific.

TanStack Query 5 partially decoupled from React — you can use the core without a UI framework. But the primary API is still built around React hooks.

`@web-loom/query-core` takes the same ideas and implements them as a framework-agnostic class that fits naturally into Web Loom's Model layer.

---

## The API

Everything is managed through a `QueryCore` instance. You define endpoints (named cache keys with associated fetcher functions) and subscribe to their state.

```typescript
import { QueryCore } from '@web-loom/query-core';

// Create a QueryCore instance with a cache provider
const query = new QueryCore({
  cacheProvider: 'inMemory',       // default
  defaultRefetchAfter: 5 * 60_000, // 5 minutes
});
```

Three cache providers are built in:
- `'inMemory'` — lives as long as the `QueryCore` instance (default)
- `'localStorage'` — survives page refreshes
- `'indexedDB'` — larger storage, async, survives page refreshes

### Defining an Endpoint

```typescript
query.defineEndpoint('products', () => fetch('/api/products').then(r => r.json()), {
  refetchAfter: 2 * 60_000, // 2-minute stale time
});

query.defineEndpoint('user-profile', () => fetch('/api/me').then(r => r.json()), {
  refetchAfter: 10 * 60_000,
  cacheProvider: 'localStorage', // persist this one across sessions
});
```

The first argument is the cache key. The second is an async fetcher function. The third is optional options that override the global defaults.

### Subscribing to State

```typescript
const unsubscribe = query.subscribe('products', (state) => {
  // state: { data, isLoading, isError, error, lastUpdated }
  if (state.isLoading) showSpinner();
  if (state.isError)   showError(state.error);
  if (state.data)      renderProducts(state.data);
});

// Trigger initial fetch
await query.refetch('products');

// Stop receiving updates
unsubscribe();
```

The subscription model mirrors `store-core` and the browser's own EventTarget — subscribe, receive updates, unsubscribe when done.

### `refetch` and `invalidate`

```typescript
// Refetch respecting the stale time — no-op if data is still fresh
await query.refetch('products', false);

// Force refetch regardless of stale time
await query.refetch('products', true);

// Invalidate marks the cache as stale without refetching
// — the next `refetch(false)` will then actually fetch
query.invalidate('products');

// Get current state without subscribing
const state = query.getState('products');
```

### Automatic Refetching

`QueryCore` sets up two global event listeners automatically:

- **`visibilitychange`**: When the tab becomes visible (user switches back to the app), any subscribed endpoint whose data is stale gets refetched.
- **`online`**: When the network reconnects after being offline, all subscribed endpoints are force-refetched.

This covers the two most common scenarios where stale data becomes a UX problem: tab-switching and offline recovery.

---

## Integrating With a Model

`query-core` fits naturally as a caching layer inside a `BaseModel`:

```typescript
import { BaseModel } from '@web-loom/mvvm-core';
import { QueryCore } from '@web-loom/query-core';

const queryCache = new QueryCore({
  cacheProvider: 'localStorage',
  defaultRefetchAfter: 5 * 60_000,
});

class ProductModel extends BaseModel<Product[], never> {
  constructor() {
    super({});

    // Subscribe to query state and forward it to BaseModel's observables
    queryCache.subscribe('products', (state) => {
      this.setLoading(state.isLoading);
      if (state.error) this.setError(state.error);
      if (state.data)  this.setData(state.data);
    });
  }

  async fetchAll(): Promise<void> {
    await queryCache.refetch('products');
  }

  async invalidate(): Promise<void> {
    queryCache.invalidate('products');
  }
}
```

The `ProductModel` is now cache-aware. The first call to `fetchAll()` fetches from the network. Subsequent calls within the `refetchAfter` window return immediately from cache without touching the network. When a mutation elsewhere invalidates `'products'`, the next fetch goes back to the network.

The ViewModel sees this through the standard `data$`, `isLoading$`, and `error$` observables — it doesn't know or care that a cache is involved.

---

## Parameterised Queries

Cache keys can be dynamic — include the parameters in the key:

```typescript
function defineUserQuery(userId: string) {
  queryCache.defineEndpoint(
    `user:${userId}`,
    () => fetch(`/api/users/${userId}`).then(r => r.json()),
    { refetchAfter: 5 * 60_000 }
  );
}

defineUserQuery('u-123');
await queryCache.refetch('user:u-123');
```

Each `userId` gets its own cache entry. Invalidating `'user:u-123'` does not affect `'user:u-456'`.

---

## Custom Cache Providers

The `CacheProvider` interface is three methods:

```typescript
interface CacheProvider {
  get<T>(key: string): Promise<CachedItem<T> | null>;
  set<T>(key: string, item: CachedItem<T>): Promise<void>;
  delete(key: string): Promise<void>;
}

interface CachedItem<T> {
  data: T;
  timestamp: number;
}
```

Implement it to cache against a service worker cache, IndexedDB with custom serialisation, a Redis-backed HTTP endpoint, or anything else:

```typescript
class ServiceWorkerCacheProvider implements CacheProvider {
  async get<T>(key: string): Promise<CachedItem<T> | null> {
    const cache = await caches.open('app-data');
    const response = await cache.match(`/cache/${key}`);
    if (!response) return null;
    return response.json();
  }

  async set<T>(key: string, item: CachedItem<T>): Promise<void> {
    const cache = await caches.open('app-data');
    await cache.put(`/cache/${key}`, new Response(JSON.stringify(item)));
  }

  async delete(key: string): Promise<void> {
    const cache = await caches.open('app-data');
    await cache.delete(`/cache/${key}`);
  }
}

const query = new QueryCore({ cacheProvider: new ServiceWorkerCacheProvider() });
```

---

## Why Not Just Use React Query?

React Query is the right choice if your application is React-only, you want a full-featured mutation/optimistic update system, and you're comfortable with its conventions. It's a mature, well-documented library with an excellent developer experience.

`query-core` exists for different scenarios:

1. **You need the same caching layer across frameworks.** If your app has both a React web client and a React Native mobile app sharing ViewModels, React Query is two separate integrations. `query-core` is one integration at the Model layer.

2. **You don't want framework coupling in your data layer.** React Query's hooks (`useQuery`, `useMutation`) are the API surface. Moving away from React means rewriting all data-fetching logic. `query-core` lives below the framework.

3. **You want the behaviour without the convention.** React Query has strong opinions about query keys (arrays), mutation patterns, and optimistic updates. `query-core` is more minimal — you get caching and stale-while-revalidate, you bring your own patterns for the rest.

4. **You're in a non-React environment.** Server-side scripts, Web Components, Lit elements, Vanilla TS apps — none of these can use React Query meaningfully. `query-core` works in all of them.

---

## How TanStack Query Inspired the Pattern

It's worth acknowledging the lineage directly. The stale-while-revalidate strategy in `query-core` is the same strategy TanStack Query pioneered for client-side use. The vocabulary (`refetchAfter` mirrors `staleTime`, `invalidate` mirrors `invalidateQueries`, the subscription pattern mirrors `useQuery`) is recognisably similar.

The difference is implementation depth and scope. TanStack Query 5 has query observers, query clients, prefetching, streaming, offline mutations, and many more features. `query-core` has the 20% of that feature set that covers 80% of real-world caching needs. That's intentional. Start with what you need.

---

## Testing With Query Core

Because `QueryCore` is a class and not tied to a framework, testing is straightforward:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { QueryCore } from '@web-loom/query-core';
import { InMemoryCacheProvider } from '@web-loom/query-core';

describe('QueryCore', () => {
  it('serves from cache within staleTime', async () => {
    const query = new QueryCore({ defaultRefetchAfter: 60_000 });
    const fetcher = vi.fn().mockResolvedValue([{ id: 1, name: 'Product' }]);

    query.defineEndpoint('test', fetcher);
    await query.refetch('test');
    await query.refetch('test', false); // should not call fetcher again

    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(query.getState('test').data).toHaveLength(1);
  });

  it('force-refetches when requested', async () => {
    const query = new QueryCore({ defaultRefetchAfter: 60_000 });
    const fetcher = vi.fn().mockResolvedValue([]);

    query.defineEndpoint('test', fetcher);
    await query.refetch('test');
    await query.refetch('test', true); // force

    expect(fetcher).toHaveBeenCalledTimes(2);
  });
});
```

---

## Installing

```bash
npm install @web-loom/query-core
```

No framework dependencies. Works in browser and Node.js environments. The `localStorage` and `IndexedDB` cache providers require a browser environment; use `'inMemory'` for server-side code.

---

Next in the series: `@web-loom/ui-core`, the headless UI behaviour layer — where accessibility and interaction logic lives without any markup or styles.
