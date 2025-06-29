# Core Concepts in QueryCore

This document explains the key features and design principles behind QueryCore.

## 1. Endpoint Definition

Endpoints are the heart of QueryCore. You define an endpoint by providing:

- A unique **key** (string).
- A **fetcher function**: An asynchronous function that returns a Promise resolving to your data. This is typically where you make your API calls (e.g., using `fetch`).
- (Optional) **Options**: Configuration specific to this endpoint, such as `refetchAfter` or `cacheProvider`.

```typescript
await qc.defineEndpoint(
  'userProfile', // Unique key
  async () => {
    // Fetcher function
    const userId = 1;
    const response = await fetch(`/api/users/${userId}`);
    if (!response.ok) throw new Error('Failed to fetch user');
    return response.json();
  },
  {
    // Optional endpoint-specific options
    refetchAfter: 10 * 60 * 1000, // 10 minutes
    cacheProvider: 'indexedDB',
  },
);
```

## 2. Caching Strategies

QueryCore automatically caches successful responses from your fetcher functions.

- **LocalStorage (Default)**: Suitable for smaller, JSON-serializable data.
- **IndexedDB**: Opt-in for larger datasets or more complex data structures.

You can configure the cache provider globally when initializing `QueryCore` or per-endpoint.

### Cache Invalidation

Manually invalidate an endpoint's cache using `qc.invalidate('endpointKey')`. This clears the cached data and will typically trigger a refetch on the next observation or interaction if data is needed.

## 3. State Management and Observation

QueryCore manages the state of each endpoint. This state includes:

- `data`: The cached data.
- `isLoading`: Boolean, true if a fetch is in progress.
- `isError`: Boolean, true if the last fetch failed.
- `error`: The error object if `isError` is true.
- `lastUpdated`: Timestamp of the last successful fetch.

### Subscribing to State

Use `qc.subscribe('endpointKey', callback)` to listen for state changes. Your callback function will receive the state object whenever it updates.

```typescript
const unsubscribe = qc.subscribe('userProfile', (userState) => {
  if (userState.isLoading) {
    /* Show spinner */
  }
  // ... handle other states
});

// Don't forget to call unsubscribe() when done.
```

## 4. Automatic Refetching

QueryCore helps keep your data fresh automatically:

- **`refetchAfter`**: Define a duration (in ms) after which cached data is considered stale. Stale data will be refetched when:
  - An endpoint is subscribed to and its data is found to be stale.
  - Window regains focus (for observed stale endpoints).
  - Network connection is restored (for observed stale endpoints).
- **Window Focus Refetching**: When the browser tab/window becomes visible, QueryCore checks observed endpoints and refetches stale ones.
- **Network Reconnect Refetching**: If the browser goes offline and then online, QueryCore attempts to refetch observed endpoints (assuming data might be stale).

## 5. Zero Dependencies & Framework Agnostic

QueryCore is written in TypeScript and uses only native browser APIs (`fetch`, `Promise`, `LocalStorage`, `IndexedDB`). This ensures a small bundle size and broad compatibility. Its API is vanilla TypeScript, allowing integration into any JavaScript framework or project.

See the [API Reference](./api-reference.md) for detailed information on all methods and options.
