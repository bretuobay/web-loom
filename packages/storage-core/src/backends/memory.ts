/**
 * In-memory storage backend
 */

import type { StorageBackend, StorageOptions, StorageItem } from '../types';
import { wrapItem, unwrapItem } from '../utils/serialization';

export class MemoryBackend implements StorageBackend {
  private store: Map<string, StorageItem> = new Map();
  private namespace: string;

  constructor(namespace = '') {
    this.namespace = namespace;
  }

  async init(): Promise<void> {
    // No initialization needed for memory storage
  }

  async get<T = any>(key: string): Promise<T | null> {
    const fullKey = this.getFullKey(key);
    const item = this.store.get(fullKey);

    if (!item) return null;

    const value = unwrapItem(item, true);
    if (value === null) {
      // Item expired, remove it
      this.store.delete(fullKey);
      return null;
    }

    return value as T;
  }

  async set<T = any>(key: string, value: T, options?: StorageOptions): Promise<void> {
    const fullKey = this.getFullKey(key);
    const item = wrapItem(value, options?.ttl);
    this.store.set(fullKey, item);
  }

  async delete(key: string): Promise<void> {
    const fullKey = this.getFullKey(key);
    this.store.delete(fullKey);
  }

  async has(key: string): Promise<boolean> {
    const fullKey = this.getFullKey(key);
    const item = this.store.get(fullKey);

    if (!item) return false;

    const value = unwrapItem(item);
    if (value === null) {
      // Item expired
      this.store.delete(fullKey);
      return false;
    }

    return true;
  }

  async keys(): Promise<string[]> {
    const keys: string[] = [];

    for (const [fullKey, item] of this.store.entries()) {
      const value = unwrapItem(item);
      if (value !== null) {
        keys.push(this.stripNamespace(fullKey));
      } else {
        // Clean up expired item
        this.store.delete(fullKey);
      }
    }

    return keys;
  }

  async clear(): Promise<void> {
    this.store.clear();
  }

  async entries<T = any>(): Promise<Array<[string, T]>> {
    const entries: Array<[string, T]> = [];

    for (const [fullKey, item] of this.store.entries()) {
      const value = unwrapItem(item);
      if (value !== null) {
        entries.push([this.stripNamespace(fullKey), value as T]);
      } else {
        // Clean up expired item
        this.store.delete(fullKey);
      }
    }

    return entries;
  }

  async dispose(): Promise<void> {
    this.store.clear();
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
