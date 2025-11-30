/**
 * Web Storage backend (localStorage/sessionStorage)
 */

import type { StorageBackend, StorageOptions, StorageItem } from '../types';
import { serialize, deserialize, wrapItem, unwrapItem } from '../utils/serialization';

export class WebStorageBackend implements StorageBackend {
  private storage: globalThis.Storage;
  private namespace: string;

  constructor(storage: globalThis.Storage, namespace = '') {
    this.storage = storage;
    this.namespace = namespace;
  }

  async init(): Promise<void> {
    // Test if storage is available
    try {
      const testKey = '__storage_test__';
      this.storage.setItem(testKey, 'test');
      this.storage.removeItem(testKey);
    } catch (error) {
      throw new Error('Storage is not available');
    }
  }

  async get<T = any>(key: string): Promise<T | null> {
    const fullKey = this.getFullKey(key);
    const raw = this.storage.getItem(fullKey);

    if (raw === null) return null;

    try {
      const item: StorageItem<T> = deserialize(raw);
      const value = unwrapItem(item, true);

      if (value === null) {
        // Item expired, remove it
        this.storage.removeItem(fullKey);
        return null;
      }

      // Update access time if sliding expiration
      this.storage.setItem(fullKey, serialize(item));
      return value;
    } catch (error) {
      // Invalid data, remove it
      this.storage.removeItem(fullKey);
      return null;
    }
  }

  async set<T = any>(key: string, value: T, options?: StorageOptions): Promise<void> {
    const fullKey = this.getFullKey(key);
    const item = wrapItem(value, options?.ttl);

    try {
      this.storage.setItem(fullKey, serialize(item));
    } catch (error) {
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        throw new Error('Storage quota exceeded');
      }
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    const fullKey = this.getFullKey(key);
    this.storage.removeItem(fullKey);
  }

  async has(key: string): Promise<boolean> {
    const fullKey = this.getFullKey(key);
    const raw = this.storage.getItem(fullKey);

    if (raw === null) return false;

    try {
      const item: StorageItem = deserialize(raw);
      const value = unwrapItem(item);

      if (value === null) {
        // Item expired
        this.storage.removeItem(fullKey);
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }

  async keys(): Promise<string[]> {
    const keys: string[] = [];
    const prefix = this.namespace ? `${this.namespace}:` : '';

    for (let i = 0; i < this.storage.length; i++) {
      const fullKey = this.storage.key(i);
      if (fullKey && (!prefix || fullKey.startsWith(prefix))) {
        // Check if expired
        const raw = this.storage.getItem(fullKey);
        if (raw) {
          try {
            const item: StorageItem = deserialize(raw);
            const value = unwrapItem(item);
            if (value !== null) {
              keys.push(this.stripNamespace(fullKey));
            } else {
              // Clean up expired item
              this.storage.removeItem(fullKey);
            }
          } catch {
            // Invalid data, skip
          }
        }
      }
    }

    return keys;
  }

  async clear(): Promise<void> {
    if (!this.namespace) {
      this.storage.clear();
      return;
    }

    // Clear only namespaced keys
    const keysToRemove: string[] = [];
    const prefix = `${this.namespace}:`;

    for (let i = 0; i < this.storage.length; i++) {
      const key = this.storage.key(i);
      if (key && key.startsWith(prefix)) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((key) => this.storage.removeItem(key));
  }

  async entries<T = any>(): Promise<Array<[string, T]>> {
    const entries: Array<[string, T]> = [];
    const prefix = this.namespace ? `${this.namespace}:` : '';

    for (let i = 0; i < this.storage.length; i++) {
      const fullKey = this.storage.key(i);
      if (fullKey && (!prefix || fullKey.startsWith(prefix))) {
        const raw = this.storage.getItem(fullKey);
        if (raw) {
          try {
            const item: StorageItem<T> = deserialize(raw);
            const value = unwrapItem(item);
            if (value !== null) {
              entries.push([this.stripNamespace(fullKey), value]);
            } else {
              // Clean up expired item
              this.storage.removeItem(fullKey);
            }
          } catch {
            // Invalid data, skip
          }
        }
      }
    }

    return entries;
  }

  async dispose(): Promise<void> {
    // No cleanup needed for web storage
  }

  private getFullKey(key: string): string {
    return this.namespace ? `${this.namespace}:${key}` : key;
  }

  private stripNamespace(fullKey: string): string {
    if (!this.namespace) return fullKey;
    const prefix = `${this.namespace}:`;
    return fullKey.startsWith(prefix) ? fullKey.slice(prefix.length) : fullKey;
  }
}
