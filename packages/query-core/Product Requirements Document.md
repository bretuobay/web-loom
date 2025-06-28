## A Framework-Agnostic TypeScript State Management Library for Data-Intensive Browser Applications

**Project Title:** `QueryCore`

**Version:** 1.0

**Date:** 2024-06-28

### 1\. Introduction

This document outlines the product requirements for `QueryCore`, a lightweight, framework-agnostic TypeScript state management library for modern browsers. `QueryCore` is designed primarily for read-intensive applications such as dashboards, where efficient data fetching, caching, and synchronization are paramount. It aims to provide the powerful features of libraries like React Query and SWR in a dependency-free package that can be seamlessly integrated into any JavaScript framework or vanilla TypeScript project. By leveraging native browser APIs, `QueryCore` will offer a performant and robust solution for managing server state without the overhead of third-party libraries.

### 2\. Core Principles

- **Framework Agnostic:** `QueryCore` will not be tied to any specific UI framework (e.g., React, Angular, Vue). It will expose a clean, vanilla TypeScript interface that can be adapted to any project.
- **Zero Dependencies:** The library will be built using only browser-native methods (`fetch`, `Promise`, `LocalStorage`, `IndexedDB`, etc.) to ensure a small bundle size and avoid potential conflicts with other libraries.
- **Read-Intensive Focus:** The primary use case is for applications that frequently read and display data from APIs, with a focus on performance and data freshness.
- **Developer Experience:** The API should be intuitive, easy to learn, and provide clear and descriptive error messages.

### 3\. Functional Requirements

#### 3.1. Endpoint Registration and Fetching

- **Endpoint Definition:** Users must be able to define and register API endpoints. Each endpoint will be uniquely identified by a key.
- **Fetcher Function:** For each endpoint, the user must provide a `fetcher` function. This function will be responsible for fetching the data. It will typically be a wrapper around the native `fetch` API but can be any function that returns a `Promise` resolving to the data (e.g., a GraphQL client).

#### 3.2. Caching

- **Automatic Caching:** All successful endpoint responses will be automatically cached.
- **Cache Storage:** The library will support two caching strategies:
  - **LocalStorage:** For simple, smaller JSON data. This will be the default.
  - **IndexedDB:** For larger datasets or more complex data structures. Users can opt into this on a per-endpoint basis.
- **Cache Invalidation:** The library will provide a mechanism to manually invalidate the cache for a specific endpoint, forcing a refetch on the next request.
- **Cache Structure:** The cache will store the data itself, the timestamp of the last successful fetch, and any associated metadata.

#### 3.3. Automatic Refetching

- **Time-Based Refetching:** Each endpoint can define a `refetchAfter` time in milliseconds. The library will only trigger a new fetch if the time since the last successful fetch is greater than the specified `refetchAfter` duration.
- **Observer-Based Refetching:** `QueryCore` will implement an observer mechanism to automatically refetch data when the `refetchAfter` time has expired for a given endpoint that is currently being observed. This ensures that visible data is kept up-to-date without manual intervention.
- **Window Focus Refetching:** The library will automatically refetch all observed endpoints when the browser window or tab regains focus, ensuring data is fresh after a user returns to the application.
- **Network Reconnect Refetching:** `QueryCore` will listen for online/offline events and automatically refetch all observed endpoints when the network connection is restored.

#### 3.4. State Management and Observation

- **Observer Methods:** The library will provide `subscribe` and `unsubscribe` methods to observe the state of an endpoint.
- **State Object:** When an endpoint is observed, the subscriber will receive a state object containing:
  - `data`: The cached data for the endpoint.
  - `isLoading`: A boolean indicating if a fetch is currently in progress.
  - `isError`: A boolean indicating if the last fetch resulted in an error.
  - `error`: The error object if `isError` is true.
  - `lastUpdated`: A timestamp of the last successful fetch.
- **Reactive Updates:** The state object will be updated automatically whenever a new fetch is initiated, succeeds, or fails. Subscribers will be notified of these changes.

### 4\. API Design (Conceptual)

```typescript
// --- Core Library Interface ---

interface QueryCoreOptions {
  cacheProvider?: 'localStorage' | 'indexedDB';
}

class QueryCore {
  constructor(options?: QueryCoreOptions);

  /**
   * Defines and configures an endpoint.
   */
  defineEndpoint<TData>(endpointKey: string, fetcher: () => Promise<TData>, options?: EndpointOptions): void;

  /**
   * Subscribes to an endpoint's state changes.
   */
  subscribe<TData>(endpointKey: string, callback: (state: EndpointState<TData>) => void): () => void; // Returns an unsubscribe function

  /**
   * Manually triggers a refetch for an endpoint.
   */
  refetch(endpointKey: string): Promise<void>;

  /**
   * Manually invalidates the cache for an endpoint.
   */
  invalidate(endpointKey: string): void;

  /**
   * Retrieves the current state of an endpoint without subscribing.
   */
  getState<TData>(endpointKey: string): EndpointState<TData>;
}

// --- Endpoint Configuration ---

interface EndpointOptions {
  refetchAfter?: number; // in milliseconds
  cacheProvider?: 'localStorage' | 'indexedDB';
}

// --- Endpoint State ---

interface EndpointState<TData> {
  data: TData | undefined;
  isLoading: boolean;
  isError: boolean;
  error: any | undefined;
  lastUpdated: number | undefined;
}
```

### 5\. Non-Functional Requirements

- **Performance:** The library should have a minimal performance overhead. Operations like subscribing and accessing cached data should be near-instantaneous.
- **Bundle Size:** The final bundled size of the library should be as small as possible, given the constraint of no third-party dependencies.
- **Browser Compatibility:** The library must be compatible with all modern evergreen browsers (Chrome, Firefox, Safari, Edge).
- **Security:** As the library deals with caching data, it must be mindful of potential security implications, especially when using LocalStorage. The documentation will advise on storing sensitive information.

### 6\. Testing

An extensive and robust test suite is a critical requirement. All tests will be written in TypeScript and will not rely on external testing frameworks, using a simple, custom-built test runner that executes in the browser.

- **Unit Tests:** Each individual function and method within the library will be thoroughly unit tested. This includes:
  - Endpoint definition and configuration.
  - Fetcher invocation and promise handling.
  - Cache read, write, and invalidation logic for both LocalStorage and IndexedDB.
  - State update logic.
- **Integration Tests:** These tests will verify that different parts of the library work together as expected. Examples include:
  - The entire lifecycle of a request: fetch, cache, and subsequent retrieval.
  - Automatic refetching based on `refetchAfter` timers.
  - Correct state transitions (`isLoading`, `isError`, `data`).
  - The observer mechanism and callback invocation.
- **Behavioral Tests:** These tests will simulate real-world usage scenarios:
  - Multiple components subscribing to the same endpoint.
  - Rapidly subscribing and unsubscribing.
  - Handling of network errors and retries.
  - Window focus and network reconnection events triggering refetches.
- **Mocking:** A lightweight, custom mocking utility will be created to mock the `fetch` API, `LocalStorage`, and `IndexedDB` for controlled testing environments.

### 7\. Documentation

Comprehensive documentation is essential for the adoption and usability of `QueryCore`. The documentation will include:

- **Getting Started Guide:** A step-by-step tutorial on how to install and use the library.
- **Core Concepts:** Detailed explanations of key features like endpoint definition, caching, and the observer pattern.
- **API Reference:** A complete reference for all public methods and interfaces.
- **Examples:** Practical examples of how to integrate `QueryCore` with popular frameworks (React, Vue, Svelte) and in a vanilla TypeScript project.
- **Advanced Guides:** Recipes for more complex scenarios, such as handling pagination, optimistic updates (as a pattern), and integrating with different data sources.
