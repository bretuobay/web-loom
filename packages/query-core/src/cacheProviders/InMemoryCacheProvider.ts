import { CacheProvider, CachedItem } from './CacheProvider';

export class InMemoryCacheProvider implements CacheProvider {
  private cache: Map<string, CachedItem<any>> = new Map();

  public async get<TData>(key: string): Promise<CachedItem<TData> | undefined> {
    const item = this.cache.get(key);
    if (item) {
      // Return a structured clone to mimic the behavior of other providers
      // and prevent direct mutation of the cached object.
      return Promise.resolve(structuredClone(item) as CachedItem<TData>);
    }
    return Promise.resolve(undefined);
  }

  public async set<TData>(key: string, item: CachedItem<TData>): Promise<void> {
    // Store a structured clone to prevent external mutations from affecting the cache.
    this.cache.set(key, structuredClone(item));
    return Promise.resolve();
  }

  public async remove(key: string): Promise<void> {
    this.cache.delete(key);
    return Promise.resolve();
  }

  public async clearAll(): Promise<void> {
    this.cache.clear();
    console.log('QueryCore: In-memory cache cleared.');
    return Promise.resolve();
  }
}
