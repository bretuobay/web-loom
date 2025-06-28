import { CacheProvider, CachedItem } from './CacheProvider';

const DB_NAME = 'QueryCoreDB';
const STORE_NAME = 'QueryCoreCache';
const DB_VERSION = 1;

export class IndexedDBCacheProvider implements CacheProvider {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) {
      return this.dbPromise;
    }

    if (!('indexedDB' in window)) {
      console.warn('QueryCore: IndexedDB is not supported in this browser. IndexedDBCacheProvider will not work.');
      return Promise.reject(new Error('IndexedDB not supported'));
    }

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'key' });
        }
      };

      request.onsuccess = (event) => {
        resolve((event.target as IDBOpenDBRequest).result);
      };

      request.onerror = (event) => {
        console.error('QueryCore: IndexedDB error:', (event.target as IDBOpenDBRequest).error);
        reject(new Error('IndexedDB opening error'));
        this.dbPromise = null; // Allow retrying to open
      };
    });
    return this.dbPromise;
  }

  private async performOperation<T>(
    mode: IDBTransactionMode,
    operation: (store: IDBObjectStore) => Promise<T>,
  ): Promise<T | undefined> {
    try {
      const db = await this.getDB();
      const transaction = db.transaction(STORE_NAME, mode);
      const store = transaction.objectStore(STORE_NAME);
      return await operation(store);
    } catch (error) {
      console.error('QueryCore: IndexedDB operation failed:', error);
      return undefined;
    }
  }

  async get<TData>(key: string): Promise<CachedItem<TData> | undefined> {
    return this.performOperation('readonly', (store) => {
      return new Promise<CachedItem<TData> | undefined>((resolve, reject) => {
        const request = store.get(key);
        request.onsuccess = () => {
          if (request.result) {
            // IndexedDB stores structured clones, so no JSON.parse needed
            // We store { key: string, value: CachedItem<TData> }
            resolve(request.result.value as CachedItem<TData>);
          } else {
            resolve(undefined);
          }
        };
        request.onerror = () => {
          console.error(`QueryCore: IndexedDB get error for key "${key}":`, request.error);
          reject(request.error);
        };
      });
    });
  }

  async set<TData>(key: string, item: CachedItem<TData>): Promise<void> {
    await this.performOperation('readwrite', (store) => {
      return new Promise<void>((resolve, reject) => {
        // We store { key: string, value: CachedItem<TData> } to use keyPath
        const request = store.put({ key, value: item });
        request.onsuccess = () => resolve();
        request.onerror = () => {
          console.error(`QueryCore: IndexedDB set error for key "${key}":`, request.error);
          reject(request.error);
        };
      });
    });
  }

  async remove(key: string): Promise<void> {
    await this.performOperation('readwrite', (store) => {
      return new Promise<void>((resolve, reject) => {
        const request = store.delete(key);
        request.onsuccess = () => resolve();
        request.onerror = () => {
          console.error(`QueryCore: IndexedDB delete error for key "${key}":`, request.error);
          reject(request.error);
        };
      });
    });
  }

  async clearAll(): Promise<void> {
    await this.performOperation('readwrite', (store) => {
      return new Promise<void>((resolve, reject) => {
        const request = store.clear();
        request.onsuccess = () => {
          console.log('QueryCore: All QueryCore entries cleared from IndexedDB store.');
          resolve();
        };
        request.onerror = () => {
          console.error('QueryCore: IndexedDB clearAll error:', request.error);
          reject(request.error);
        };
      });
    });
  }
}
