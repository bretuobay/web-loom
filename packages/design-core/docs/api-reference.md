# QueryCore API Reference

This document provides a detailed reference for the public API of QueryCore.

## `QueryCore` Class

The main class for interacting with the library.

### Constructor

`new QueryCore(options?: QueryCoreOptions)`

- **`options`** (optional): `QueryCoreOptions`
  - **`cacheProvider?`: `'localStorage' | 'indexedDB' | CacheProvider`**
    - Specifies the global default cache provider.
    - Default: `'localStorage'`.
    - Can also be a custom instance implementing the `CacheProvider` interface.
  - **`defaultRefetchAfter?`: `number`**
    - Global default for `refetchAfter` (in milliseconds) for all endpoints.
    - Endpoint-specific `refetchAfter` will override this.
    - Default: `undefined` (no automatic time-based refetch unless specified per endpoint).

---

### Methods

#### `async defineEndpoint<TData>(endpointKey: string, fetcher: () => Promise<TData>, options?: EndpointOptions): Promise<void>`

Defines or redefines an endpoint.

- **`endpointKey`: `string`** - A unique key for this endpoint.
- **`fetcher`: `() => Promise<TData>`** - An asynchronous function that fetches and returns data.
- **`options?`: `EndpointOptions`** (optional)
  - **`refetchAfter?`: `number`**
    - Time in milliseconds after which cached data for this endpoint is considered stale.
    - Overrides `defaultRefetchAfter` from `QueryCoreOptions`.
  - **`cacheProvider?`: `'localStorage' | 'indexedDB' | CacheProvider`**
    - Specific cache provider for this endpoint.
    - Overrides global `cacheProvider` from `QueryCoreOptions`.

Loads data from cache if available upon definition.

---

#### `subscribe<TData>(endpointKey: string, callback: (state: EndpointState<TData>) => void): () => void`

Subscribes to state changes for an endpoint.

- **`endpointKey`: `string`** - The key of the endpoint to subscribe to.
- **`callback`: `(state: EndpointState<TData>) => void`** - Function called with the `EndpointState` object initially and on every state change.
- **Returns**: `() => void` - An unsubscribe function. Call this to stop receiving updates.

If data is stale (based on `refetchAfter`) or not present when subscribing, a fetch will be automatically triggered.

---

#### `async refetch<TData>(endpointKey: string, forceRefetch?: boolean): Promise<void>`

Manually triggers a fetch for an endpoint.

- **`endpointKey`: `string`** - The key of the endpoint to refetch.
- **`forceRefetch?`: `boolean`** (optional)
  - If `true`, ignores `refetchAfter` and fetches regardless of data freshness.
  - Default: `false`.

If `refetchAfter` is set and data is fresh (and `forceRefetch` is `false`), this operation might be skipped.

---

#### `async invalidate(endpointKey: string): Promise<void>`

Invalidates the cache for an endpoint.

- **`endpointKey`: `string`** - The key of the endpoint whose cache should be cleared.
- This removes the item from the cache provider and updates the in-memory state (data becomes `undefined`).

---

#### `getState<TData>(endpointKey: string): EndpointState<TData>`

Retrieves the current state of an endpoint without subscribing.

- **`endpointKey`: `string`** - The key of the endpoint.
- **Returns**: `EndpointState<TData>` - A copy of the current state.

---

## Interfaces

### `QueryCoreOptions`

_(Described under Constructor)_

### `EndpointOptions`

_(Described under `defineEndpoint`)_

### `EndpointState<TData>`

Object representing the state of an endpoint, provided to subscribers.

- **`data`: `TData | undefined`** - The cached data for the endpoint. `undefined` if not fetched, being fetched, or error.
- **`isLoading`: `boolean`** - `true` if a fetch operation is currently in progress for this endpoint.
- **`isError`: `boolean`** - `true` if the last fetch attempt resulted in an error.
- **`error`: `any | undefined`** - The error object if `isError` is true.
- **`lastUpdated`: `number | undefined`** - Timestamp (from `Date.now()`) of the last successful data fetch and cache.

---

### `CacheProvider` (for custom providers)

Interface for creating custom cache providers.

- **`get<TData>(key: string): Promise<CachedItem<TData> | undefined>`**
- **`set<TData>(key: string, item: CachedItem<TData>): Promise<void>`**
- **`remove(key: string): Promise<void>`**
- **`clearAll?(): Promise<void>`** (optional)

### `CachedItem<TData>` (for custom providers)

- **`data`: `TData`**
- **`lastUpdated`: `number`**

---

Explore [Core Concepts](./core-concepts.md) for more about how these pieces fit together.
Find usage examples in the [Getting Started](./getting-started.md) guide and [Examples](./examples.md) (TODO).
