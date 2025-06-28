// src/mocks/MockSimpleCacheProvider.ts
import { CacheProvider, CachedItem } from '../cacheProviders/CacheProvider';

export class MockSimpleCacheProvider implements CacheProvider {
  private cache = new Map<string, CachedItem<any>>();

  async get<TData>(key: string): Promise<CachedItem<TData> | undefined> {
    // Ensure the promise resolves in the next tick to better simulate async behavior
    await Promise.resolve();
    return this.cache.get(key) as CachedItem<TData> | undefined;
  }

  async set<TData>(key: string, item: CachedItem<TData>): Promise<void> {
    await Promise.resolve();
    this.cache.set(key, item);
  }

  async remove(key: string): Promise<void> {
    await Promise.resolve();
    this.cache.delete(key);
  }

  async clear(): Promise<void> {
    await Promise.resolve();
    this.cache.clear();
  }

  // Helper to inspect cache directly in tests
  public getInternalCache(): Map<string, CachedItem<any>> {
    return this.cache;
  }

  // Helper to manually prime the cache for testing initial load scenarios
  public setInternalCache<TData>(key: string, item: CachedItem<TData>): void {
    this.cache.set(key, item);
  }
}
