import { CacheProvider, CachedItem } from './CacheProvider';

const PREFIX = 'QueryCore_';

export class LocalStorageCacheProvider implements CacheProvider {
  private isSupported(): boolean {
    try {
      const testKey = '__QueryCoreTest__';
      localStorage.setItem(testKey, testKey);
      localStorage.removeItem(testKey);
      return true;
    } catch (e) {
      console.warn('QueryCore: LocalStorage is not available. Caching will be disabled for LocalStorageCacheProvider.');
      return false;
    }
  }

  public async get<TData>(key: string): Promise<CachedItem<TData> | undefined> {
    if (!this.isSupported()) return Promise.resolve(undefined);

    const itemStr = localStorage.getItem(PREFIX + key);
    if (!itemStr) {
      return Promise.resolve(undefined);
    }
    try {
      const item = JSON.parse(itemStr) as CachedItem<TData>;
      return Promise.resolve(item);
    } catch (error) {
      console.error(`QueryCore: Error parsing LocalStorage item for key "${key}":`, error);
      localStorage.removeItem(PREFIX + key); // Remove corrupted item
      return Promise.resolve(undefined);
    }
  }

  public async set<TData>(key: string, item: CachedItem<TData>): Promise<void> {
    if (!this.isSupported()) return Promise.resolve();

    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(item));
    } catch (error) {
      console.error(`QueryCore: Error setting LocalStorage item for key "${key}":`, error);
      // Potentially handle quota exceeded errors, though simple log for now
      // Consider rejecting promise on error: return Promise.reject(error);
    }
    return Promise.resolve();
  }

  public async remove(key: string): Promise<void> {
    if (!this.isSupported()) return Promise.resolve();
    localStorage.removeItem(PREFIX + key);
    return Promise.resolve();
  }

  public async clearAll(): Promise<void> {
    if (!this.isSupported()) return Promise.resolve();
    for (const key in localStorage) {
      if (key.startsWith(PREFIX)) {
        localStorage.removeItem(key);
      }
    }
    console.log('QueryCore: All QueryCore entries cleared from LocalStorage.');
    return Promise.resolve();
  }
}
