/**
 * Main storage factory and implementation
 */

import type {
  Storage,
  StorageConfig,
  StorageBackend,
  StorageBackendType,
  StorageOptions,
  StorageFeatures,
  StorageChangeEvent,
  QuotaUsage,
} from './types';
import { MemoryBackend } from './backends/memory';
import { WebStorageBackend } from './backends/webstorage';
import { IndexedDBBackend } from './backends/indexeddb';
import { EventEmitter } from '@web-loom/event-emitter-core';
import { matchPattern } from './utils/events';
import { createMigrationEngine } from './features/migrations';

type StorageEventMap = {
  '*': StorageChangeEvent;
};

export class StorageImpl implements Storage {
  private backend: StorageBackend;
  private config: StorageConfig;
  private _activeBackend: StorageBackendType;
  private eventEmitter: EventEmitter<StorageEventMap>;

  constructor(backend: StorageBackend, config: StorageConfig, activeBackend: StorageBackendType) {
    this.backend = backend;
    this.config = config;
    this._activeBackend = activeBackend;
    this.eventEmitter = new EventEmitter<StorageEventMap>();
  }

  get activeBackend(): StorageBackendType {
    return this._activeBackend;
  }

  get features(): StorageFeatures {
    return {
      encryption: false, // Phase 3
      quota: this._activeBackend !== 'memory',
      crossTab: this._activeBackend === 'localstorage',
      persistence: this._activeBackend !== 'memory',
      migrations: this._activeBackend === 'indexeddb',
    };
  }

  async get<T = any>(key: string): Promise<T | null> {
    return this.backend.get<T>(key);
  }

  async set<T = any>(key: string, value: T, options?: StorageOptions): Promise<void> {
    const oldValue = await this.backend.get<T>(key);
    const ttl = options?.ttl ?? this.config.defaultTTL;

    await this.backend.set(key, value, { ...options, ttl });

    // Emit change event
    this.eventEmitter.emit('*', {
      key,
      oldValue,
      newValue: value,
    });
  }

  async delete(key: string): Promise<void> {
    const oldValue = await this.backend.get(key);
    await this.backend.delete(key);

    // Emit change event
    this.eventEmitter.emit('*', {
      key,
      oldValue,
      newValue: null,
    });
  }

  async has(key: string): Promise<boolean> {
    return this.backend.has(key);
  }

  async keys(): Promise<string[]> {
    return this.backend.keys();
  }

  async clear(): Promise<void> {
    await this.backend.clear();
  }

  async entries<T = any>(): Promise<Array<[string, T]>> {
    return this.backend.entries<T>();
  }

  async init(): Promise<void> {
    await this.backend.init();
  }

  async dispose(): Promise<void> {
    this.eventEmitter.clear();
    await this.backend.dispose();
  }

  subscribe<T = any>(pattern: string, callback: (event: StorageChangeEvent<T>) => void): () => void {
    return this.eventEmitter.on('*', (event) => {
      if (matchPattern(event.key, pattern)) {
        callback(event as StorageChangeEvent<T>);
      }
    });
  }

  async getQuotaUsage(): Promise<QuotaUsage> {
    if (this._activeBackend === 'memory') {
      return { used: 0, available: Infinity, percent: 0 };
    }

    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      const used = estimate.usage || 0;
      const available = estimate.quota || 0;
      const percent = available > 0 ? (used / available) * 100 : 0;

      return { used, available, percent };
    }

    // Fallback for browsers without Storage API
    return { used: 0, available: 0, percent: 0 };
  }
}

/**
 * Create a storage backend instance
 */
function createBackend(type: StorageBackendType, namespace: string, dbName: string, version?: number): StorageBackend {
  switch (type) {
    case 'localstorage':
      if (typeof window === 'undefined' || !window.localStorage) {
        throw new Error('localStorage is not available');
      }
      return new WebStorageBackend(window.localStorage, namespace);

    case 'sessionstorage':
      if (typeof window === 'undefined' || !window.sessionStorage) {
        throw new Error('sessionStorage is not available');
      }
      return new WebStorageBackend(window.sessionStorage, namespace);

    case 'indexeddb':
      if (typeof indexedDB === 'undefined') {
        throw new Error('IndexedDB is not available');
      }
      return new IndexedDBBackend(dbName, namespace, version);

    case 'memory':
      return new MemoryBackend(namespace);

    default:
      throw new Error(`Unknown backend type: ${type}`);
  }
}

/**
 * Create a storage instance with automatic fallback
 */
export async function createStorage(config: StorageConfig): Promise<Storage> {
  const backends = Array.isArray(config.backend) ? config.backend : [config.backend];
  const namespace = config.namespace || config.name;
  const version = config.version || 1;

  let lastError: Error | null = null;

  for (const backendType of backends) {
    try {
      const backend = createBackend(backendType, namespace, config.name, version);
      const storage = new StorageImpl(backend, config, backendType);

      await storage.init();

      // Run migrations if configured
      if (config.migrations && Object.keys(config.migrations).length > 0) {
        const migrationEngine = createMigrationEngine(backend, config.migrations, version);

        // Validate migrations
        const validation = await migrationEngine.validate();
        if (!validation.valid) {
          throw new Error(`Migration validation failed: ${validation.errors.join(', ')}`);
        }

        // Run migrations if needed
        if (await migrationEngine.needsMigration()) {
          await migrationEngine.migrate();
        }
      }

      // If we fell back, notify
      if (lastError && config.onFallback) {
        const previousBackend = backends[backends.indexOf(backendType) - 1];
        config.onFallback(previousBackend, backendType, lastError.message);
      }

      return storage;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // If this is the last backend, throw
      if (backendType === backends[backends.length - 1]) {
        throw new Error(`All storage backends failed. Last error: ${lastError.message}`);
      }
    }
  }

  // Should never reach here, but TypeScript needs it
  throw new Error('Failed to create storage');
}
