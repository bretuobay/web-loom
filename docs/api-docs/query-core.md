# @web-loom/query-core API Documentation

## Table of Contents

1. [Overview](#overview)
2. [Installation](#installation)
3. [Core Concepts](#core-concepts)
4. [Complete API Reference](#complete-api-reference)
5. [Framework Integration](#framework-integration)
6. [Usage Examples](#usage-examples)
7. [Best Practices](#best-practices)
8. [TypeScript Types](#typescript-types)
9. [Common Patterns](#common-patterns)
10. [Advanced Topics](#advanced-topics)

---

## Overview

`@web-loom/query-core` is a lightweight, zero-dependency library for managing asynchronous data fetching, caching, and state management in JavaScript applications. It provides a declarative API to define data endpoints, subscribe to state changes, and control data refetching and invalidation with automatic cache management.

### Key Features

- **Declarative API**: Define data endpoints with associated fetcher functions
- **Automatic Caching**: Built-in support for inMemory, localStorage, and IndexedDB
- **State Management**: Endpoints maintain their own state (data, loading, error, lastUpdated)
- **Subscription Model**: Components subscribe to endpoint state changes reactively
- **Automatic Refetching**: Stale data refetch on subscription, window focus, and network reconnect
- **Manual Control**: Methods to manually trigger refetches or invalidate cached data
- **Deep Cloning**: Ensures data immutability for subscribers
- **Zero Dependencies**: Pure TypeScript implementation, no external dependencies
- **Framework Agnostic**: Works with any JavaScript framework or vanilla JS

### Use Cases

- API data fetching with automatic caching
- Shared state across components without prop drilling
- Background data synchronization
- Offline-first applications with cache persistence
- Request deduplication for multiple subscribers

---

## Installation

```bash
# npm
npm install @web-loom/query-core

# yarn
yarn add @web-loom/query-core

# pnpm
pnpm add @web-loom/query-core
```

### Zero Dependencies

QueryCore has no external dependencies, keeping your bundle size minimal.

---

## Core Concepts

### 1. QueryCore Instance

The main class that manages all defined endpoints and global configurations.

**Purpose**: Central hub for endpoint definitions, cache management, and subscriptions.

**Key Responsibilities**:
- Endpoint registration and lifecycle management
- Cache provider orchestration
- Subscription management
- Automatic refetch triggers
- Window focus and network event handling

### 2. Endpoints

Unique keys that represent data sources with associated fetcher functions.

**Purpose**: Define where and how data is fetched.

**Characteristics**:
- Unique string identifier
- Async fetcher function
- Optional configuration (refetchAfter, cacheProvider)
- Independent state management

### 3. Endpoint State

The current state of an endpoint including data, loading, error, and metadata.

**Purpose**: Reactive state that drives UI updates.

**Properties**:
- `data`: The fetched data (undefined if not yet fetched)
- `isLoading`: True during fetch operations
- `isError`: True if last fetch failed
- `error`: Error object if isError is true
- `lastUpdated`: Timestamp of last successful fetch

### 4. Cache Providers

Storage mechanisms for persisting endpoint data between sessions.

**Purpose**: Enable offline support and reduce redundant network requests.

**Built-in Providers**:
- **InMemoryCacheProvider**: Fast, volatile cache (default)
- **LocalStorageCacheProvider**: Persistent browser storage
- **IndexedDBCacheProvider**: Large-scale persistent storage

**Custom Providers**: Implement the CacheProvider interface for custom storage.

### 5. Automatic Behaviors

QueryCore automatically handles common data synchronization patterns.

**Stale-while-revalidate**:
- Return cached data immediately
- Refetch in background if stale
- Update subscribers with fresh data

**Window Focus Refetch**:
- Refetch observed endpoints when tab gains focus
- Keep data fresh for active users

**Network Reconnect**:
- Refetch all observed endpoints on reconnection
- Recover from offline periods

---

## Complete API Reference

### QueryCore Class

Main class for managing endpoints and cache.

#### Constructor

```typescript
constructor(options?: QueryCoreOptions)
```

**Parameters**:
- `options.cacheProvider?: 'inMemory' | 'localStorage' | 'indexedDB' | CacheProvider`
  - Default cache provider for all endpoints (default: 'inMemory')
- `options.defaultRefetchAfter?: number`
  - Global default for staleness threshold in milliseconds

**Example**:
```typescript
const queryCore = new QueryCore({
  cacheProvider: 'indexedDB',
  defaultRefetchAfter: 5 * 60 * 1000 // 5 minutes
});
```

---

### defineEndpoint<TData>

Defines a new data endpoint or redefines an existing one.

```typescript
async defineEndpoint<TData>(
  endpointKey: string,
  fetcher: () => Promise<TData>,
  options?: EndpointOptions
): Promise<void>
```

**Parameters**:
- `endpointKey: string` - Unique identifier for the endpoint
- `fetcher: () => Promise<TData>` - Async function returning data
- `options?: EndpointOptions` - Endpoint-specific configuration

**EndpointOptions**:
```typescript
interface EndpointOptions {
  refetchAfter?: number;        // Staleness threshold (ms)
  cacheProvider?: 'inMemory' | 'localStorage' | 'indexedDB' | CacheProvider;
}
```

**Returns**: `Promise<void>` (async due to cache initialization)

**Example**:
```typescript
await queryCore.defineEndpoint('users', async () => {
  const response = await fetch('https://api.example.com/users');
  if (!response.ok) throw new Error('Failed to fetch users');
  return response.json();
}, {
  refetchAfter: 10 * 60 * 1000, // 10 minutes
  cacheProvider: 'localStorage'
});
```

**Behavior**:
- If endpoint exists, replaces the fetcher and options
- Loads initial state from cache if available
- Does NOT automatically fetch data (use subscribe or refetch)

**Best Practices**:
- Define endpoints early in application lifecycle
- Use descriptive, unique endpoint keys
- Include error handling in fetcher functions
- Set appropriate refetchAfter based on data volatility

---

### subscribe<TData>

Subscribes to state changes for a specific endpoint.

```typescript
subscribe<TData>(
  endpointKey: string,
  callback: (state: EndpointState<TData>) => void
): () => void
```

**Parameters**:
- `endpointKey: string` - The endpoint to subscribe to
- `callback: (state: EndpointState<TData>) => void` - Function called on state changes

**Returns**: `() => void` - Unsubscribe function

**Behavior**:
- Immediately invokes callback with current state
- Automatically refetches if data is stale or missing
- Adds endpoint to "observed" set for automatic refetching
- Returns function to unsubscribe

**Example**:
```typescript
const unsubscribe = queryCore.subscribe('users', (state) => {
  if (state.isLoading) {
    console.log('Loading users...');
  } else if (state.isError) {
    console.error('Error:', state.error);
  } else if (state.data) {
    console.log('Users:', state.data);
    console.log('Last updated:', new Date(state.lastUpdated));
  }
});

// Later: cleanup
unsubscribe();
```

**State Properties**:
```typescript
interface EndpointState<TData> {
  data: TData | undefined;
  isLoading: boolean;
  isError: boolean;
  error: any | undefined;
  lastUpdated: number | undefined;
}
```

**Best Practices**:
- Always call unsubscribe when component unmounts
- Handle all state conditions (loading, error, success)
- Use TypeScript generics for type safety
- Avoid expensive operations in callbacks

---

### refetch<TData>

Manually triggers a data refetch for an endpoint.

```typescript
async refetch<TData>(
  endpointKey: string,
  forceRefetch: boolean = false
): Promise<void>
```

**Parameters**:
- `endpointKey: string` - The endpoint to refetch
- `forceRefetch: boolean` - If true, refetch regardless of staleness (default: false)

**Returns**: `Promise<void>`

**Behavior**:
- If `forceRefetch` is true, always fetches fresh data
- If `forceRefetch` is false, only fetches if data is stale or missing
- Ignores concurrent refetch requests for same endpoint
- Updates cache and notifies all subscribers

**Example**:
```typescript
// Refetch only if stale
await queryCore.refetch('users');

// Force refetch (always fetches fresh data)
await queryCore.refetch('users', true);
```

**Use Cases**:
- Manual refresh buttons
- Pull-to-refresh gestures
- After mutations that affect endpoint data
- Periodic background updates

**Error Handling**:
```typescript
try {
  await queryCore.refetch('users', true);
} catch (error) {
  console.error('Refetch failed:', error);
  // State will have isError: true and error set
}
```

---

### invalidate

Invalidates cached data for an endpoint.

```typescript
async invalidate(endpointKey: string): Promise<void>
```

**Parameters**:
- `endpointKey: string` - The endpoint to invalidate

**Returns**: `Promise<void>` (async due to cache operations)

**Behavior**:
- Clears data from cache provider
- Resets endpoint state to initial (no data, no error)
- Does NOT automatically refetch data
- Notifies all subscribers of state change

**Example**:
```typescript
await queryCore.invalidate('users');
console.log('User cache cleared');
```

**Use Cases**:
- After logout (clear all user data)
- After critical errors requiring fresh data
- Clearing stale data on app start
- Testing and debugging

**Best Practice**:
```typescript
// Invalidate and refetch
await queryCore.invalidate('users');
await queryCore.refetch('users', true);
```

---

### getState<TData>

Retrieves the current state of an endpoint without subscribing.

```typescript
getState<TData>(endpointKey: string): EndpointState<TData>
```

**Parameters**:
- `endpointKey: string` - The endpoint key

**Returns**: `EndpointState<TData>` - Current state snapshot

**Behavior**:
- Returns a copy of the current state
- Does NOT subscribe to changes
- Does NOT trigger refetch
- Returns default initial state if endpoint not defined

**Example**:
```typescript
const state = queryCore.getState<User[]>('users');
if (state.data) {
  console.log('Current users:', state.data);
}
```

**Default State** (if endpoint not defined):
```typescript
{
  data: undefined,
  isLoading: false,
  isError: false,
  error: undefined,
  lastUpdated: undefined
}
```

**Use Cases**:
- Conditional logic based on current state
- Debugging and logging
- One-time state checks
- Server-side rendering

---

## Cache Providers

### InMemoryCacheProvider

Fast, volatile cache stored in JavaScript memory.

**Characteristics**:
- Fastest performance
- Lost on page refresh
- No size limits (within memory constraints)
- Default provider

**Example**:
```typescript
import { InMemoryCacheProvider } from '@web-loom/query-core';

const cache = new InMemoryCacheProvider();

const queryCore = new QueryCore({
  cacheProvider: cache
});
```

**Use Cases**:
- Short-lived data
- High-frequency reads
- Testing environments

---

### LocalStorageCacheProvider

Persistent storage using browser localStorage.

**Characteristics**:
- Persists across sessions
- ~5-10MB storage limit (browser dependent)
- Synchronous API (fast)
- JSON serialization

**Example**:
```typescript
import { LocalStorageCacheProvider } from '@web-loom/query-core';

const cache = new LocalStorageCacheProvider();

const queryCore = new QueryCore({
  cacheProvider: cache
});

// Or per-endpoint
await queryCore.defineEndpoint('users', fetchUsers, {
  cacheProvider: 'localStorage'
});
```

**Storage Key Format**: `querycore:${endpointKey}`

**Use Cases**:
- User preferences
- Authentication tokens
- Small datasets
- Cross-tab synchronization

**Limitations**:
- Storage quota errors if full
- Synchronous blocking on large data
- String-only storage (JSON serialization overhead)

---

### IndexedDBCacheProvider

Large-scale persistent storage using IndexedDB.

**Characteristics**:
- Persists across sessions
- ~50MB+ storage (can request more)
- Asynchronous API
- Supports complex data types

**Example**:
```typescript
import { IndexedDBCacheProvider } from '@web-loom/query-core';

const cache = new IndexedDBCacheProvider('my-app-db');

const queryCore = new QueryCore({
  cacheProvider: cache
});
```

**Constructor**:
```typescript
constructor(databaseName: string = 'QueryCoreDB')
```

**Database Structure**:
- Database name: Provided or 'QueryCoreDB'
- Object store: 'cache'
- Key path: endpoint key

**Use Cases**:
- Large datasets (images, documents)
- Offline-first applications
- Complex data structures
- High-volume caching

**Best Practices**:
- Use unique database names per application
- Handle quota errors gracefully
- Consider cleanup strategies for old data

---

### Custom Cache Provider

Implement custom storage by adhering to the `CacheProvider` interface.

**Interface**:
```typescript
interface CachedItem<TData> {
  data: TData;
  lastUpdated: number;
}

interface CacheProvider {
  get<TData>(key: string): Promise<CachedItem<TData> | undefined>;
  set<TData>(key: string, item: CachedItem<TData>): Promise<void>;
  remove(key: string): Promise<void>;
  clearAll?(): Promise<void>; // Optional
}
```

**Example: Redis Cache Provider**

```typescript
class RedisCacheProvider implements CacheProvider {
  constructor(private redisClient: RedisClient) {}

  async get<TData>(key: string): Promise<CachedItem<TData> | undefined> {
    const json = await this.redisClient.get(key);
    return json ? JSON.parse(json) : undefined;
  }

  async set<TData>(key: string, item: CachedItem<TData>): Promise<void> {
    await this.redisClient.set(key, JSON.stringify(item));
  }

  async remove(key: string): Promise<void> {
    await this.redisClient.del(key);
  }

  async clearAll(): Promise<void> {
    await this.redisClient.flushall();
  }
}

// Usage
const redisCache = new RedisCacheProvider(redisClient);
const queryCore = new QueryCore({ cacheProvider: redisCache });
```

**Example: Compression Cache Provider**

```typescript
import pako from 'pako';

class CompressionCacheProvider implements CacheProvider {
  constructor(private baseProvider: CacheProvider) {}

  async get<TData>(key: string): Promise<CachedItem<TData> | undefined> {
    const compressed = await this.baseProvider.get<Uint8Array>(key);
    if (!compressed) return undefined;

    const json = pako.inflate(compressed.data, { to: 'string' });
    return {
      data: JSON.parse(json),
      lastUpdated: compressed.lastUpdated
    };
  }

  async set<TData>(key: string, item: CachedItem<TData>): Promise<void> {
    const json = JSON.stringify(item.data);
    const compressed = pako.deflate(json);

    await this.baseProvider.set(key, {
      data: compressed,
      lastUpdated: item.lastUpdated
    });
  }

  async remove(key: string): Promise<void> {
    await this.baseProvider.remove(key);
  }
}
```

---

## Automatic Behaviors

### Stale-While-Revalidate

When a component subscribes to an endpoint:

1. **Return cached data immediately** (if available)
2. **Check if data is stale** (based on `refetchAfter` and `lastUpdated`)
3. **Fetch fresh data in background** if stale
4. **Update subscribers** once fresh data arrives

**Benefits**:
- Instant UI updates with cached data
- Fresh data without loading spinners
- Optimal user experience

**Example**:
```typescript
// First subscription - no cache
queryCore.subscribe('users', (state) => {
  // 1st call: { isLoading: true, data: undefined }
  // 2nd call: { isLoading: false, data: [...] }
});

// Second subscription - has cache
queryCore.subscribe('users', (state) => {
  // 1st call: { isLoading: false, data: [...] } (cached)
  // If stale:
  // 2nd call: { isLoading: true, data: [...] } (refetching)
  // 3rd call: { isLoading: false, data: [...] } (fresh)
});
```

---

### Window Focus Refetch

When the browser window regains focus:

1. **Check all observed endpoints** (those with active subscriptions)
2. **Refetch stale endpoints** in background
3. **Update subscribers** with fresh data

**Configuration**:
```typescript
await queryCore.defineEndpoint('users', fetchUsers, {
  refetchAfter: 60 * 1000 // Refetch if older than 1 minute
});
```

**Behavior**:
- User switches to another tab for 2 minutes
- Returns to your app
- QueryCore automatically refetches stale data
- UI updates with fresh data

**Disable for specific endpoints**:
```typescript
await queryCore.defineEndpoint('static-data', fetchData, {
  refetchAfter: Infinity // Never consider stale
});
```

---

### Network Reconnect Refetch

When the browser goes from offline to online:

1. **Detect online event**
2. **Refetch all observed endpoints**
3. **Update subscribers** with fresh data

**Use Cases**:
- Mobile apps with spotty connections
- Offline-first applications
- Recovery from network failures

**Example**:
```typescript
// App goes offline
// ... user actions cached locally

// Network reconnects
// QueryCore automatically refetches all data
// UI updates to reflect server state
```

---

## Framework Integration

### React Integration

#### Custom Hook: useQuery

```typescript
import { useState, useEffect } from 'react';
import QueryCore, { EndpointState } from '@web-loom/query-core';

function useQuery<TData>(
  queryCore: QueryCore,
  endpointKey: string
): EndpointState<TData> {
  const [state, setState] = useState<EndpointState<TData>>(
    () => queryCore.getState<TData>(endpointKey)
  );

  useEffect(() => {
    const unsubscribe = queryCore.subscribe<TData>(endpointKey, setState);
    return unsubscribe;
  }, [queryCore, endpointKey]);

  return state;
}

export default useQuery;
```

**Usage**:
```typescript
import { FC } from 'react';
import useQuery from './hooks/useQuery';
import { queryCore } from './queryCore';

interface User {
  id: string;
  name: string;
  email: string;
}

const UserList: FC = () => {
  const { data, isLoading, isError, error } = useQuery<User[]>(
    queryCore,
    'users'
  );

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error: {error.message}</div>;

  return (
    <ul>
      {data?.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
};
```

#### With Refetch and Invalidate

```typescript
import { useState, useEffect, useCallback } from 'react';

function useQuery<TData>(queryCore: QueryCore, endpointKey: string) {
  const [state, setState] = useState<EndpointState<TData>>(
    () => queryCore.getState<TData>(endpointKey)
  );

  useEffect(() => {
    const unsubscribe = queryCore.subscribe<TData>(endpointKey, setState);
    return unsubscribe;
  }, [queryCore, endpointKey]);

  const refetch = useCallback(
    (force = false) => queryCore.refetch(endpointKey, force),
    [queryCore, endpointKey]
  );

  const invalidate = useCallback(
    () => queryCore.invalidate(endpointKey),
    [queryCore, endpointKey]
  );

  return { ...state, refetch, invalidate };
}

// Usage
const UserList: FC = () => {
  const { data, isLoading, refetch, invalidate } = useQuery<User[]>(
    queryCore,
    'users'
  );

  return (
    <>
      <button onClick={() => refetch(true)}>Refresh</button>
      <button onClick={invalidate}>Clear Cache</button>
      {/* ... */}
    </>
  );
};
```

---

### Vue 3 Integration

#### Composition API

```typescript
import { ref, onMounted, onUnmounted } from 'vue';
import QueryCore, { EndpointState } from '@web-loom/query-core';

export function useQuery<TData>(
  queryCore: QueryCore,
  endpointKey: string
) {
  const state = ref<EndpointState<TData>>(
    queryCore.getState<TData>(endpointKey)
  );

  let unsubscribe: (() => void) | undefined;

  onMounted(() => {
    unsubscribe = queryCore.subscribe<TData>(endpointKey, (newState) => {
      state.value = newState;
    });
  });

  onUnmounted(() => {
    unsubscribe?.();
  });

  const refetch = (force = false) => queryCore.refetch(endpointKey, force);
  const invalidate = () => queryCore.invalidate(endpointKey);

  return {
    state,
    refetch,
    invalidate
  };
}
```

**Usage**:
```vue
<script setup lang="ts">
import { useQuery } from './composables/useQuery';
import { queryCore } from './queryCore';

interface User {
  id: string;
  name: string;
}

const { state, refetch, invalidate } = useQuery<User[]>(queryCore, 'users');
</script>

<template>
  <div>
    <button @click="refetch(true)">Refresh</button>
    <button @click="invalidate">Clear Cache</button>

    <div v-if="state.isLoading">Loading...</div>
    <div v-else-if="state.isError">Error: {{ state.error.message }}</div>
    <ul v-else>
      <li v-for="user in state.data" :key="user.id">
        {{ user.name }}
      </li>
    </ul>
  </div>
</template>
```

---

### Angular Integration

#### Service

```typescript
import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import QueryCore, { EndpointState } from '@web-loom/query-core';

@Injectable()
export class QueryService<TData> implements OnDestroy {
  private state$ = new BehaviorSubject<EndpointState<TData>>(
    this.queryCore.getState<TData>(this.endpointKey)
  );

  private unsubscribe?: () => void;

  constructor(
    private queryCore: QueryCore,
    private endpointKey: string
  ) {
    this.unsubscribe = this.queryCore.subscribe<TData>(
      this.endpointKey,
      (state) => this.state$.next(state)
    );
  }

  get state(): Observable<EndpointState<TData>> {
    return this.state$.asObservable();
  }

  async refetch(force = false): Promise<void> {
    await this.queryCore.refetch(this.endpointKey, force);
  }

  async invalidate(): Promise<void> {
    await this.queryCore.invalidate(this.endpointKey);
  }

  ngOnDestroy(): void {
    this.unsubscribe?.();
  }
}
```

**Component**:
```typescript
import { Component, OnInit } from '@angular/core';
import { QueryService } from './query.service';

@Component({
  selector: 'app-user-list',
  template: `
    <button (click)="refetch()">Refresh</button>
    <div *ngIf="(queryService.state | async)?.isLoading">Loading...</div>
    <div *ngIf="(queryService.state | async)?.isError as error">
      Error: {{ error.message }}
    </div>
    <ul *ngIf="(queryService.state | async)?.data as users">
      <li *ngFor="let user of users">{{ user.name }}</li>
    </ul>
  `,
  providers: [QueryService]
})
export class UserListComponent {
  constructor(public queryService: QueryService<User[]>) {}

  refetch(): void {
    this.queryService.refetch(true);
  }
}
```

---

### Vanilla JavaScript

```javascript
const queryCore = new QueryCore({
  cacheProvider: 'localStorage',
  defaultRefetchAfter: 5 * 60 * 1000
});

// Define endpoint
await queryCore.defineEndpoint('users', async () => {
  const res = await fetch('https://api.example.com/users');
  return res.json();
});

// Subscribe to changes
const unsubscribe = queryCore.subscribe('users', (state) => {
  const container = document.getElementById('users');

  if (state.isLoading) {
    container.innerHTML = '<div>Loading...</div>';
  } else if (state.isError) {
    container.innerHTML = `<div>Error: ${state.error.message}</div>`;
  } else if (state.data) {
    container.innerHTML = state.data
      .map(user => `<li>${user.name}</li>`)
      .join('');
  }
});

// Refetch button
document.getElementById('refresh-btn').addEventListener('click', () => {
  queryCore.refetch('users', true);
});

// Cleanup
window.addEventListener('beforeunload', unsubscribe);
```

---

## Usage Examples

### Example 1: Basic Data Fetching

```typescript
import QueryCore from '@web-loom/query-core';

const queryCore = new QueryCore();

// Define endpoint
await queryCore.defineEndpoint('posts', async () => {
  const response = await fetch('https://jsonplaceholder.typicode.com/posts');
  if (!response.ok) throw new Error('Failed to fetch posts');
  return response.json();
});

// Subscribe
const unsubscribe = queryCore.subscribe('posts', (state) => {
  console.log('Posts state:', state);
});

// Cleanup
unsubscribe();
```

---

### Example 2: Multiple Endpoints

```typescript
const queryCore = new QueryCore({
  defaultRefetchAfter: 5 * 60 * 1000
});

// User endpoint
await queryCore.defineEndpoint('users', async () => {
  const res = await fetch('/api/users');
  return res.json();
});

// Posts endpoint
await queryCore.defineEndpoint('posts', async () => {
  const res = await fetch('/api/posts');
  return res.json();
});

// Comments endpoint with longer cache
await queryCore.defineEndpoint('comments', async () => {
  const res = await fetch('/api/comments');
  return res.json();
}, {
  refetchAfter: 30 * 60 * 1000 // 30 minutes
});

// Subscribe to all
const unsubUsers = queryCore.subscribe('users', handleUsers);
const unsubPosts = queryCore.subscribe('posts', handlePosts);
const unsubComments = queryCore.subscribe('comments', handleComments);
```

---

### Example 3: Parameterized Endpoints

```typescript
// Create endpoint key with parameter
function getUserEndpoint(userId: string): string {
  return `user:${userId}`;
}

// Define endpoint dynamically
async function defineUserEndpoint(userId: string): Promise<void> {
  await queryCore.defineEndpoint(getUserEndpoint(userId), async () => {
    const res = await fetch(`/api/users/${userId}`);
    return res.json();
  });
}

// Usage
const userId = '123';
await defineUserEndpoint(userId);

queryCore.subscribe(getUserEndpoint(userId), (state) => {
  console.log('User data:', state.data);
});
```

---

### Example 4: Dependent Queries

```typescript
// Fetch user first, then user's posts
async function loadUserAndPosts(userId: string) {
  // Define user endpoint
  await queryCore.defineEndpoint(`user:${userId}`, async () => {
    const res = await fetch(`/api/users/${userId}`);
    return res.json();
  });

  // Subscribe to user
  queryCore.subscribe(`user:${userId}`, async (userState) => {
    if (userState.data) {
      // Once user is loaded, define posts endpoint
      await queryCore.defineEndpoint(`posts:${userId}`, async () => {
        const res = await fetch(`/api/users/${userId}/posts`);
        return res.json();
      });

      // Subscribe to posts
      queryCore.subscribe(`posts:${userId}`, (postsState) => {
        console.log('User posts:', postsState.data);
      });
    }
  });
}
```

---

### Example 5: Optimistic Updates with Mutations

```typescript
interface Todo {
  id: string;
  title: string;
  completed: boolean;
}

// Define todos endpoint
await queryCore.defineEndpoint<Todo[]>('todos', async () => {
  const res = await fetch('/api/todos');
  return res.json();
});

// Mutation: Add todo
async function addTodo(title: string): Promise<void> {
  // Optimistic update
  const currentState = queryCore.getState<Todo[]>('todos');
  const optimisticTodo: Todo = {
    id: `temp-${Date.now()}`,
    title,
    completed: false
  };

  // Update cache optimistically
  const newTodos = [...(currentState.data || []), optimisticTodo];

  try {
    // Perform mutation
    const res = await fetch('/api/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title })
    });

    if (!res.ok) throw new Error('Failed to add todo');

    // Refetch to get server data
    await queryCore.refetch('todos', true);
  } catch (error) {
    // Rollback on error
    console.error('Failed to add todo, rolling back:', error);
    await queryCore.refetch('todos', true);
  }
}

// Usage
await addTodo('New task');
```

---

### Example 6: Polling

```typescript
// Poll endpoint every 10 seconds
function pollEndpoint(
  endpointKey: string,
  intervalMs: number
): () => void {
  const intervalId = setInterval(() => {
    queryCore.refetch(endpointKey, true);
  }, intervalMs);

  return () => clearInterval(intervalId);
}

// Start polling
const stopPolling = pollEndpoint('notifications', 10 * 1000);

// Stop polling when component unmounts
stopPolling();
```

---

### Example 7: Infinite Scroll

```typescript
interface Page<T> {
  data: T[];
  nextCursor: string | null;
}

let currentPage = 0;
const allData: any[] = [];

async function loadNextPage() {
  await queryCore.defineEndpoint(`page:${currentPage}`, async () => {
    const res = await fetch(`/api/items?page=${currentPage}`);
    const page: Page<any> = await res.json();

    allData.push(...page.data);

    return {
      items: allData,
      hasMore: page.nextCursor !== null
    };
  });

  queryCore.subscribe(`page:${currentPage}`, (state) => {
    if (state.data) {
      renderItems(state.data.items);

      if (state.data.hasMore) {
        currentPage++;
      }
    }
  });
}

// Load first page
loadNextPage();

// Load more on scroll
window.addEventListener('scroll', () => {
  if (isNearBottom()) {
    loadNextPage();
  }
});
```

---

## Best Practices

### 1. Define Endpoints Early

```typescript
// ✅ Good - Define all endpoints at app initialization
async function initializeQueryCore() {
  await queryCore.defineEndpoint('users', fetchUsers);
  await queryCore.defineEndpoint('posts', fetchPosts);
  await queryCore.defineEndpoint('settings', fetchSettings);
}

initializeQueryCore();

// ❌ Avoid - Defining endpoints on-demand
// Can cause race conditions and cache misses
```

---

### 2. Use Appropriate Cache Providers

```typescript
// ✅ Good - Match cache to data characteristics
await queryCore.defineEndpoint('user-profile', fetchProfile, {
  cacheProvider: 'localStorage' // Small, important data
});

await queryCore.defineEndpoint('images', fetchImages, {
  cacheProvider: 'indexedDB' // Large binary data
});

await queryCore.defineEndpoint('live-data', fetchLiveData, {
  cacheProvider: 'inMemory' // Volatile, real-time data
});
```

---

### 3. Set Appropriate Staleness

```typescript
// ✅ Good - Tune refetchAfter based on data volatility
await queryCore.defineEndpoint('stock-prices', fetchStocks, {
  refetchAfter: 30 * 1000 // 30 seconds - highly volatile
});

await queryCore.defineEndpoint('user-settings', fetchSettings, {
  refetchAfter: 30 * 60 * 1000 // 30 minutes - rarely changes
});

await queryCore.defineEndpoint('app-config', fetchConfig, {
  refetchAfter: Infinity // Never refetch automatically
});
```

---

### 4. Handle Errors Gracefully

```typescript
// ✅ Good - Provide error handling in fetcher
await queryCore.defineEndpoint('users', async () => {
  try {
    const res = await fetch('/api/users');
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    return res.json();
  } catch (error) {
    console.error('Failed to fetch users:', error);
    throw error; // Re-throw to set endpoint error state
  }
});

// Subscribe with error handling
queryCore.subscribe('users', (state) => {
  if (state.isError) {
    showNotification('Failed to load users. Please try again.');
  }
});
```

---

### 5. Clean Up Subscriptions

```typescript
// ✅ Good - Always unsubscribe
useEffect(() => {
  const unsubscribe = queryCore.subscribe('users', handleUsers);
  return unsubscribe; // Cleanup
}, []);

// ❌ Avoid - Forgetting to unsubscribe causes memory leaks
useEffect(() => {
  queryCore.subscribe('users', handleUsers);
  // Missing cleanup!
}, []);
```

---

### 6. Use TypeScript Generics

```typescript
// ✅ Good - Type-safe
interface User {
  id: string;
  name: string;
}

const { data, isLoading } = useQuery<User[]>(queryCore, 'users');
// data is typed as User[] | undefined

// ❌ Avoid - Untyped
const { data } = useQuery(queryCore, 'users');
// data is typed as unknown
```

---

### 7. Invalidate After Mutations

```typescript
// ✅ Good - Invalidate related queries after mutations
async function deleteUser(userId: string) {
  await fetch(`/api/users/${userId}`, { method: 'DELETE' });

  // Invalidate and refetch
  await queryCore.invalidate('users');
  await queryCore.refetch('users', true);
}

// Even better - use optimistic updates
async function deleteUserOptimistic(userId: string) {
  const currentState = queryCore.getState<User[]>('users');
  const newData = currentState.data?.filter(u => u.id !== userId);

  try {
    await fetch(`/api/users/${userId}`, { method: 'DELETE' });
    await queryCore.refetch('users', true);
  } catch (error) {
    // Rollback
    await queryCore.refetch('users', true);
  }
}
```

---

## TypeScript Types

### Core Types

```typescript
// Main QueryCore options
interface QueryCoreOptions {
  cacheProvider?: 'inMemory' | 'localStorage' | 'indexedDB' | CacheProvider;
  defaultRefetchAfter?: number;
}

// Endpoint-specific options
interface EndpointOptions {
  refetchAfter?: number;
  cacheProvider?: 'inMemory' | 'localStorage' | 'indexedDB' | CacheProvider;
}

// Endpoint state
interface EndpointState<TData> {
  data: TData | undefined;
  isLoading: boolean;
  isError: boolean;
  error: any | undefined;
  lastUpdated: number | undefined;
}

// Cache item
interface CachedItem<TData> {
  data: TData;
  lastUpdated: number;
}

// Cache provider interface
interface CacheProvider {
  get<TData>(key: string): Promise<CachedItem<TData> | undefined>;
  set<TData>(key: string, item: CachedItem<TData>): Promise<void>;
  remove(key: string): Promise<void>;
  clearAll?(): Promise<void>;
}
```

---

## Common Patterns

### Pattern 1: Request Deduplication

```typescript
// Multiple components subscribe to same endpoint
// QueryCore ensures only one fetch occurs

// Component A
useQuery(queryCore, 'users');

// Component B
useQuery(queryCore, 'users');

// Component C
useQuery(queryCore, 'users');

// Result: Only one network request
```

---

### Pattern 2: Prefetching

```typescript
// Prefetch data before navigation
async function prefetchUserProfile(userId: string) {
  await queryCore.defineEndpoint(`user:${userId}`, async () => {
    const res = await fetch(`/api/users/${userId}`);
    return res.json();
  });

  // Trigger fetch without subscribing
  await queryCore.refetch(`user:${userId}`, true);
}

// Prefetch on link hover
<Link
  to="/profile/123"
  onMouseEnter={() => prefetchUserProfile('123')}
>
  View Profile
</Link>
```

---

### Pattern 3: Conditional Fetching

```typescript
function useConditionalQuery<TData>(
  queryCore: QueryCore,
  endpointKey: string,
  enabled: boolean
): EndpointState<TData> {
  const [state, setState] = useState<EndpointState<TData>>(
    () => queryCore.getState<TData>(endpointKey)
  );

  useEffect(() => {
    if (!enabled) return;

    const unsubscribe = queryCore.subscribe<TData>(endpointKey, setState);
    return unsubscribe;
  }, [queryCore, endpointKey, enabled]);

  return state;
}

// Usage: Only fetch when userId is available
const { data } = useConditionalQuery(
  queryCore,
  'user-profile',
  !!userId
);
```

---

### Pattern 4: Pagination

```typescript
interface PaginatedResponse<T> {
  items: T[];
  page: number;
  totalPages: number;
}

function usePaginatedQuery<T>(
  baseKey: string,
  page: number
) {
  const endpointKey = `${baseKey}:page:${page}`;

  useEffect(() => {
    queryCore.defineEndpoint<PaginatedResponse<T>>(endpointKey, async () => {
      const res = await fetch(`/api/${baseKey}?page=${page}`);
      return res.json();
    });
  }, [baseKey, page]);

  return useQuery<PaginatedResponse<T>>(queryCore, endpointKey);
}

// Usage
const { data } = usePaginatedQuery('users', currentPage);
```

---

## Advanced Topics

### Global Error Handling

```typescript
class QueryCoreWithErrorHandling extends QueryCore {
  async defineEndpoint<TData>(
    endpointKey: string,
    fetcher: () => Promise<TData>,
    options?: EndpointOptions
  ): Promise<void> {
    const wrappedFetcher = async () => {
      try {
        return await fetcher();
      } catch (error) {
        // Global error handling
        errorService.report(error);
        throw error;
      }
    };

    return super.defineEndpoint(endpointKey, wrappedFetcher, options);
  }
}
```

---

### Retry Logic

```typescript
async function fetchWithRetry<T>(
  fetcher: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fetcher();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  throw new Error('Max retries exceeded');
}

// Usage
await queryCore.defineEndpoint('users', () =>
  fetchWithRetry(() => fetch('/api/users').then(r => r.json()))
);
```

---

### Middleware Pattern

```typescript
type FetcherMiddleware = <T>(
  fetcher: () => Promise<T>
) => () => Promise<T>;

const loggingMiddleware: FetcherMiddleware = (fetcher) => {
  return async () => {
    console.log('Fetching...');
    const data = await fetcher();
    console.log('Fetched:', data);
    return data;
  };
};

const cacheBustingMiddleware: FetcherMiddleware = (fetcher) => {
  return async () => {
    const url = new URL(fetchUrl);
    url.searchParams.set('_t', Date.now().toString());
    return fetcher();
  };
};

// Apply middleware
await queryCore.defineEndpoint(
  'users',
  cacheBustingMiddleware(loggingMiddleware(fetchUsers))
);
```

---

## Troubleshooting

### Issue: Data Not Caching

**Solution**: Ensure cache provider is correctly configured.

```typescript
// Check cache provider
const queryCore = new QueryCore({
  cacheProvider: 'localStorage' // Explicitly set
});
```

---

### Issue: Too Many Refetches

**Solution**: Increase `refetchAfter` duration.

```typescript
await queryCore.defineEndpoint('data', fetchData, {
  refetchAfter: 10 * 60 * 1000 // 10 minutes instead of default
});
```

---

### Issue: Memory Leaks

**Solution**: Always unsubscribe.

```typescript
useEffect(() => {
  const unsubscribe = queryCore.subscribe('data', handler);
  return unsubscribe; // Critical!
}, []);
```

---

## Conclusion

`@web-loom/query-core` provides a powerful, lightweight solution for data fetching and caching in modern web applications. Its zero-dependency design, automatic cache management, and framework-agnostic API make it an excellent choice for applications of any size.

For more information:
- [GitHub Repository](https://github.com/bretuobay/web-loom)
- [Live Examples](https://web-loom.dev/examples/query-core)

---

**Version**: 0.5.2
**License**: MIT
**Last Updated**: January 2025
