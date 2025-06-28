# QueryCore Library

QueryCore is a lightweight, zero-dependency library for managing asynchronous data fetching, caching, and state management in JavaScript applications. It provides a simple yet powerful API to define data endpoints, subscribe to their state changes, and control data refetching and invalidation.

## Features

- **Declarative API:** Define data endpoints with associated fetcher functions and options.
- **Automatic Caching:** Built-in support for `inMemory`, `localStorage`, and `indexedDB` caching, or provide your own custom cache provider. Default is `inMemory`.
- **State Management:** Endpoints maintain their own state (data, loading, error, last updated).
- **Subscription Model:** Components can subscribe to endpoint state changes and reactively update.
- **Automatic Refetching:**
    - Refetches stale data when a component subscribes.
    - Refetches observed queries when the browser window becomes visible.
    - Refetches observed queries when the network connection is restored.
- **Manual Control:** Methods to manually trigger refetches or invalidate cached data.
- **Deep Cloning of Data:** Ensures data immutability for subscribers by providing structured clones of the state's data.

## Installation

```bash
# npm
npm install query-core

# yarn
yarn add query-core
```
*(Note: This assumes QueryCore will be published as an npm package. For now, you can use it directly from the `src` directory.)*

## Core Concepts

### `QueryCore` Instance

The main class you interact with. It manages all defined endpoints and global configurations.

```typescript
import QueryCore from './src/QueryCore'; // Adjust path as needed

const queryCore = new QueryCore({
  cacheProvider: 'indexedDB', // Default for all endpoints
  defaultRefetchAfter: 5 * 60 * 1000, // Global default: refetch after 5 minutes
});
```

### Interfaces

#### `QueryCoreOptions`

Options to configure the `QueryCore` instance globally.

```typescript
export interface QueryCoreOptions {
  cacheProvider?: 'inMemory' | 'localStorage' | 'indexedDB' | CacheProvider; // Default: 'inMemory'
  defaultRefetchAfter?: number; // Global default for refetchAfter (in milliseconds)
}
```
- `cacheProvider`: Specifies the default caching mechanism. Can be a string (`'inMemory'`, `'localStorage'`, `'indexedDB'`) or a custom object implementing the `CacheProvider` interface.
- `defaultRefetchAfter`: A global default (in milliseconds) indicating how long data is considered fresh before a refetch is attempted upon subscription or window focus.

#### `EndpointOptions`

Options to configure a specific endpoint, overriding global settings if provided.

```typescript
export interface EndpointOptions {
  refetchAfter?: number; // in milliseconds
  cacheProvider?: 'inMemory' | 'localStorage' | 'indexedDB' | CacheProvider; // Override global cache provider
}
```
- `refetchAfter`: Endpoint-specific duration (in milliseconds) after which data is considered stale.
- `cacheProvider`: Endpoint-specific cache provider (can be `'inMemory'`, `'localStorage'`, `'indexedDB'`, or a custom provider).

#### `EndpointState<TData>`

Represents the state of an endpoint.

```typescript
export interface EndpointState<TData> {
  data: TData | undefined;
  isLoading: boolean;
  isError: boolean;
  error: any | undefined;
  lastUpdated: number | undefined; // Timestamp of when data was last successfully fetched and cached
}
```
- `data`: The fetched data for the endpoint. `undefined` if not yet fetched, or an error occurred.
- `isLoading`: `true` if a fetch operation is currently in progress.
- `isError`: `true` if the last fetch attempt resulted in an error.
- `error`: The error object if `isError` is `true`.
- `lastUpdated`: Timestamp (from `Date.now()`) of the last successful data fetch and cache.

## API Reference

### `constructor(options?: QueryCoreOptions)`

Creates a new `QueryCore` instance.

```typescript
const queryCore = new QueryCore({ cacheProvider: 'indexedDB' });
```

### `async defineEndpoint<TData>(endpointKey: string, fetcher: () => Promise<TData>, options?: EndpointOptions): Promise<void>`

Defines a new data endpoint or redefines an existing one. This method is asynchronous due to potential cache interactions (reading initial state).

- `endpointKey` (string): A unique key to identify the endpoint (e.g., 'posts', 'user/1').
- `fetcher` (() => Promise<TData>): An asynchronous function that returns a Promise resolving to the data.
- `options?` (EndpointOptions): Optional configuration for this specific endpoint.

```typescript
async function fetchPosts() {
  const response = await fetch('https://api.example.com/posts');
  if (!response.ok) {
    throw new Error('Failed to fetch posts');
  }
  return response.json();
}

await queryCore.defineEndpoint('allPosts', fetchPosts, {
  refetchAfter: 10 * 60 * 1000, // 10 minutes
});
```

### `subscribe<TData>(endpointKey: string, callback: (state: EndpointState<TData>) => void): () => void`

Subscribes a callback function to state changes for a specific endpoint. The callback is immediately invoked with the current state. Returns an unsubscribe function.

- `endpointKey` (string): The key of the endpoint to subscribe to.
- `callback` ((state: EndpointState<TData>) => void): Function to be called with the endpoint's state whenever it changes.

```typescript
const unsubscribeFromPosts = queryCore.subscribe('allPosts', (postsState) => {
  if (postsState.isLoading) {
    console.log('Loading posts...');
  } else if (postsState.isError) {
    console.error('Error fetching posts:', postsState.error);
  } else if (postsState.data) {
    console.log('Posts data:', postsState.data);
  }
  console.log('Last updated:', postsState.lastUpdated);
});

// To stop listening:
// unsubscribeFromPosts();
```

### `async refetch<TData>(endpointKey: string, forceRefetch: boolean = false): Promise<void>`

Manually triggers a data refetch for an endpoint.

- `endpointKey` (string): The key of the endpoint to refetch.
- `forceRefetch` (boolean, optional, default: `false`):
    - If `true`, the refetch will occur regardless of whether the data is considered stale (based on `refetchAfter`).
    - If `false`, the refetch will only occur if the data is stale or has never been fetched.

```typescript
// Refetch posts only if stale or never fetched
await queryCore.refetch('allPosts');

// Force a refetch, even if data is considered fresh
await queryCore.refetch('allPosts', true);
```
If a fetch is already in progress for the endpoint, subsequent `refetch` calls (for the same endpoint) will be ignored until the current fetch completes.

### `async invalidate(endpointKey: string): Promise<void>`

Invalidates the cached data for an endpoint, clearing it from both the cache provider and the in-memory state. Future subscriptions or `getState` calls might trigger a new fetch. This method is asynchronous due to cache interactions.

- `endpointKey` (string): The key of the endpoint to invalidate.

```typescript
await queryCore.invalidate('allPosts');
console.log('Cache for allPosts has been cleared.');
```

### `getState<TData>(endpointKey: string): EndpointState<TData>`

Retrieves the current state of an endpoint without subscribing. Returns a copy of the state. If the endpoint is not defined, it returns a default initial state.

- `endpointKey` (string): The key of the endpoint.

```typescript
const currentState = queryCore.getState('allPosts');
if (currentState.data) {
  // Use currentState.data
}
```

## Usage Example (Conceptual)

```typescript
import QueryCore from './src/QueryCore';

// 1. Initialize QueryCore
const queryClient = new QueryCore({
  defaultRefetchAfter: 60000, // Refetch data if older than 1 minute by default
});

// 2. Define an endpoint
async function fetchUserDetails(userId: string) {
  const response = await fetch(`https://api.example.com/users/${userId}`);
  if (!response.ok) throw new Error(`Failed to fetch user ${userId}`);
  return response.json();
}

await queryClient.defineEndpoint(
  'userDetails/1',
  () => fetchUserDetails('1'),
  { cacheProvider: 'localStorage' } // Override global cache provider for this endpoint
);

// 3. Subscribe to endpoint state (e.g., in a UI component)
const unsubscribe = queryClient.subscribe('userDetails/1', (state) => {
  if (state.isLoading) {
    document.getElementById('user-name').textContent = 'Loading...';
  } else if (state.isError) {
    document.getElementById('user-name').textContent = `Error: ${state.error.message}`;
  } else if (state.data) {
    document.getElementById('user-name').textContent = state.data.name;
  }
});

// 4. Manually trigger a refetch if needed
// document.getElementById('refresh-button').onclick = () => {
//   queryClient.refetch('userDetails/1', true); // Force refetch
// };

// 5. Invalidate data (e.g., after a user logs out or data becomes stale)
// document.getElementById('logout-button').onclick = async () => {
//   await queryClient.invalidate('userDetails/1');
//   unsubscribe(); // Clean up subscription
// };
```

## Cache Providers

QueryCore supports three built-in cache providers:
- `InMemoryCacheProvider`: (Default) Uses an in-memory JavaScript `Map`. Data is lost when the page is refreshed or closed. Ideal for short-lived data or testing.
- `LocalStorageCacheProvider`: Uses browser `localStorage`. Data is stored as JSON strings and persists across sessions.
- `IndexedDBCacheProvider`: Uses browser `IndexedDB`. Offers more robust client-side storage and persists across sessions.

You can specify the cache provider globally when creating the `QueryCore` instance, or per-endpoint.

You can also implement your own custom cache provider by adhering to the `CacheProvider` interface:

```typescript
export interface CacheItem<TData> {
  data: TData;
  lastUpdated: number;
}

export interface CacheProvider {
  get<TData>(key: string): Promise<CachedItem<TData> | undefined>;
  set<TData>(key: string, item: CachedItem<TData>): Promise<void>;
  remove(key: string): Promise<void>;
  clearAll?(): Promise<void>; // Optional: for clearing all items managed by this provider
}
```
(Note: The interface name in the documentation was `CacheItem`, but in the code it's `CachedItem`. The `clear` method is `clearAll` in the code.)

Then, pass an instance of your custom provider:

```typescript
const myCustomCache = new MyCustomCacheProvider();
const queryCore = new QueryCore({ cacheProvider: myCustomCache });
// or for a specific endpoint:
// await queryCore.defineEndpoint('myEndpoint', fetchFn, { cacheProvider: myCustomCache });
```

## Automatic Behaviors

- **Stale-while-revalidate on subscribe:** If a component subscribes to an endpoint and its data is considered stale (based on `refetchAfter` and `lastUpdated`), QueryCore will automatically trigger a background refetch. The component will initially receive the stale data (if any) and then an update once the refetch completes.
- **Refetch on window focus:** If the browser window/tab loses and then regains focus, QueryCore will refetch all currently observed (subscribed to) endpoints whose data is considered stale.
- **Refetch on network reconnect:** If the browser goes offline and then comes back online, QueryCore will attempt to refetch all currently observed endpoints, assuming the data might be outdated.

These automatic behaviors help keep application data fresh with minimal manual intervention.
