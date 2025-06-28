// Defines the structure of a cached item.
// We cache the relevant parts of the EndpointState.
export interface CachedItem<TData> {
  data: TData;
  lastUpdated: number;
  // Potential future metadata: etag, cache-control headers, version, etc.
}

// Interface for cache providers
export interface CacheProvider {
  /**
   * Retrieves an item from the cache.
   * @param key The key of the item to retrieve.
   * @returns A Promise resolving to the cached item, or undefined if not found.
   */
  get<TData>(key: string): Promise<CachedItem<TData> | undefined>;

  /**
   * Stores an item in the cache.
   * @param key The key of the item to store.
   * @param item The item to store, containing data and lastUpdated timestamp.
   * @returns A Promise that resolves when the operation is complete.
   */
  set<TData>(key: string, item: CachedItem<TData>): Promise<void>;

  /**
   * Removes an item from the cache.
   * @param key The key of the item to remove.
   * @returns A Promise that resolves when the operation is complete.
   */
  remove(key: string): Promise<void>;

  /**
   * Clears the entire cache managed by this provider.
   * (Optional, but good for testing and full resets)
   * @returns A Promise that resolves when the operation is complete.
   */
  clearAll?(): Promise<void>;
}
