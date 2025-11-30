/**
 * IndexedDB storage backend
 */

import type { StorageBackend, StorageOptions, StorageItem } from '../types';
import { wrapItem, unwrapItem } from '../utils/serialization';

const STORE_NAME = 'storage';

export class IndexedDBBackend implements StorageBackend {
  private dbName: string;
  private namespace: string;
  private db: IDBDatabase | null = null;
  private version: number;

  constructor(dbName: string, namespace = '', version = 1) {
    this.dbName = dbName;
    this.namespace = namespace;
    this.version = version;
  }

  async init(): Promise<void> {
    if (typeof indexedDB === 'undefined') {
      throw new Error('IndexedDB is not available');
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        reject(new Error(`Failed to open IndexedDB: ${request.error?.message}`));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
    });
  }

  async get<T = any>(key: string): Promise<T | null> {
    if (!this.db) throw new Error('Database not initialized');

    const fullKey = this.getFullKey(key);

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(fullKey);

      request.onsuccess = () => {
        const item = request.result as StorageItem<T> | undefined;

        if (!item) {
          resolve(null);
          return;
        }

        const value = unwrapItem(item, true);

        if (value === null) {
          // Item expired, delete it
          this.delete(key).catch(() => {
            // Ignore cleanup errors
          });
          resolve(null);
          return;
        }

        // Update access time
        this.updateAccessTime(fullKey, item).catch(() => {
          // Ignore update errors
        });

        resolve(value);
      };

      request.onerror = () => {
        reject(new Error(`Failed to get item: ${request.error?.message}`));
      };
    });
  }

  async set<T = any>(key: string, value: T, options?: StorageOptions): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const fullKey = this.getFullKey(key);
    const item = wrapItem(value, options?.ttl);

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(item, fullKey);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error(`Failed to set item: ${request.error?.message}`));
      };
    });
  }

  async delete(key: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const fullKey = this.getFullKey(key);

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(fullKey);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error(`Failed to delete item: ${request.error?.message}`));
      };
    });
  }

  async has(key: string): Promise<boolean> {
    if (!this.db) throw new Error('Database not initialized');

    const fullKey = this.getFullKey(key);

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(fullKey);

      request.onsuccess = () => {
        const item = request.result as StorageItem | undefined;

        if (!item) {
          resolve(false);
          return;
        }

        const value = unwrapItem(item);

        if (value === null) {
          // Item expired
          this.delete(key).catch(() => {
            // Ignore cleanup errors
          });
          resolve(false);
          return;
        }

        resolve(true);
      };

      request.onerror = () => {
        reject(new Error(`Failed to check item: ${request.error?.message}`));
      };
    });
  }

  async keys(): Promise<string[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAllKeys();

      request.onsuccess = () => {
        const allKeys = request.result as string[];
        const prefix = this.namespace ? `${this.namespace}:` : '';

        // Filter by namespace and check expiration
        const validKeys: string[] = [];
        const checkPromises: Promise<void>[] = [];

        for (const fullKey of allKeys) {
          if (typeof fullKey === 'string' && (!prefix || fullKey.startsWith(prefix))) {
            checkPromises.push(
              this.isKeyValid(fullKey).then((valid) => {
                if (valid) {
                  validKeys.push(this.stripNamespace(fullKey));
                }
              }),
            );
          }
        }

        Promise.all(checkPromises)
          .then(() => resolve(validKeys))
          .catch(reject);
      };

      request.onerror = () => {
        reject(new Error(`Failed to get keys: ${request.error?.message}`));
      };
    });
  }

  async clear(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    if (!this.namespace) {
      // Clear entire store
      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.clear();

        request.onsuccess = () => {
          resolve();
        };

        request.onerror = () => {
          reject(new Error(`Failed to clear store: ${request.error?.message}`));
        };
      });
    }

    // Clear only namespaced keys
    const keys = await this.keys();
    await Promise.all(keys.map((key) => this.delete(key)));
  }

  async entries<T = any>(): Promise<Array<[string, T]>> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.openCursor();

      const entries: Array<[string, T]> = [];
      const prefix = this.namespace ? `${this.namespace}:` : '';

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;

        if (cursor) {
          const fullKey = cursor.key as string;

          if (typeof fullKey === 'string' && (!prefix || fullKey.startsWith(prefix))) {
            const item = cursor.value as StorageItem<T>;
            const value = unwrapItem(item);

            if (value !== null) {
              entries.push([this.stripNamespace(fullKey), value]);
            } else {
              // Clean up expired item
              this.delete(this.stripNamespace(fullKey)).catch(() => {
                // Ignore cleanup errors
              });
            }
          }

          cursor.continue();
        } else {
          resolve(entries);
        }
      };

      request.onerror = () => {
        reject(new Error(`Failed to get entries: ${request.error?.message}`));
      };
    });
  }

  async dispose(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  private getFullKey(key: string): string {
    return this.namespace ? `${this.namespace}:${key}` : key;
  }

  private stripNamespace(fullKey: string): string {
    if (!this.namespace) return fullKey;
    const prefix = `${this.namespace}:`;
    return fullKey.startsWith(prefix) ? fullKey.slice(prefix.length) : fullKey;
  }

  private async isKeyValid(fullKey: string): Promise<boolean> {
    if (!this.db) return false;

    return new Promise((resolve) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(fullKey);

      request.onsuccess = () => {
        const item = request.result as StorageItem | undefined;
        if (!item) {
          resolve(false);
          return;
        }

        const value = unwrapItem(item);
        resolve(value !== null);
      };

      request.onerror = () => {
        resolve(false);
      };
    });
  }

  private async updateAccessTime(fullKey: string, item: StorageItem): Promise<void> {
    if (!this.db) return;

    item.accessedAt = Date.now();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(item, fullKey);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error(`Failed to update access time: ${request.error?.message}`));
      };
    });
  }
}
