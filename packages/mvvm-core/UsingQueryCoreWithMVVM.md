# Using QueryCore with MVVM-Core

This document outlines how to integrate `@web-loom/query-core` for advanced data caching and synchronization with the models and ViewModels provided by `mvvm-core`.

## CachedRestfulApiModel and CachedRestfulApiViewModel

The primary components for this integration are `CachedRestfulApiModel` and `CachedRestfulApiViewModel`. They allow `QueryCore` to manage the data lifecycle (fetching, caching, background updates) while `mvvm-core` structures the presentation logic.

For a detailed explanation and example usage, please refer to [Section 3.5 in the main README.md](./README.md#35-using-cachedrestfulapimodel-and-cachedrestfulapiviewmodel-with-querycore).

## Benefits

- **Shared Cache:** Data fetched by `QueryCore` can be shared across multiple ViewModels or application parts.
- **Automatic Refetching:** Leverage `QueryCore`'s built-in mechanisms for refetching on window focus, reconnect, or stale data intervals.
- **Decoupling:** Separates data fetching/caching concerns from UI/ViewModel logic.
