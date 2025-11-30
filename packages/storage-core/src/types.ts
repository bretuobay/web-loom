/**
 * Core type definitions for @web-loom/storage-core
 */

/**
 * Supported storage backend types
 */
export type StorageBackendType = 'localstorage' | 'sessionstorage' | 'indexeddb' | 'memory';

/**
 * Storage operation options
 */
export interface StorageOptions {
  /** Time-to-live in milliseconds */
  ttl?: number;
  /** Whether to extend TTL on each access (sliding expiration) */
  sliding?: boolean;
}

/**
 * Storage configuration
 */
export interface StorageConfig {
  /** Storage backend to use (or array for fallback) */
  backend: StorageBackendType | StorageBackendType[];
  /** Storage name/database name */
  name: string;
  /** Optional namespace to prevent key collisions */
  namespace?: string;
  /** Default TTL for all items */
  defaultTTL?: number;
  /** Expiration mode: lazy (on access) or eager (background cleanup) */
  expirationMode?: 'lazy' | 'eager';
  /** Enable cross-tab synchronization */
  crossTab?: boolean;
  /** Schema version for migrations */
  version?: number;
  /** Migration functions */
  migrations?: Record<number, MigrationFunction>;
  /** Encryption configuration */
  encryption?: EncryptionConfig;
  /** Quota management configuration */
  quota?: QuotaConfig;
  /** Callback when falling back to another backend */
  onFallback?: (from: StorageBackendType, to: StorageBackendType, reason: string) => void;
}

/**
 * Migration function type
 */
export type MigrationFunction = (store: StorageBackend) => Promise<void>;

/**
 * Encryption configuration
 */
export interface EncryptionConfig {
  enabled: boolean;
  keySource: 'derive' | 'provided';
  password?: string;
  key?: CryptoKey;
  iterations?: number;
}

/**
 * Quota configuration
 */
export interface QuotaConfig {
  /** Warning threshold (0-1) */
  warningThreshold?: number;
  /** Callback when warning threshold is reached */
  onWarning?: (usage: QuotaUsage) => void;
  /** Cleanup strategy when approaching quota */
  cleanupStrategy?: 'lru' | 'fifo' | 'manual';
}

/**
 * Quota usage information
 */
export interface QuotaUsage {
  used: number;
  available: number;
  percent: number;
}

/**
 * Storage change event
 */
export interface StorageChangeEvent<T = any> {
  key: string;
  oldValue: T | null;
  newValue: T | null;
  sourceTab?: string;
}

/**
 * Storage backend interface
 */
export interface StorageBackend {
  /** Get a value by key */
  get<T = any>(key: string): Promise<T | null>;
  /** Set a value by key */
  set<T = any>(key: string, value: T, options?: StorageOptions): Promise<void>;
  /** Delete a value by key */
  delete(key: string): Promise<void>;
  /** Check if a key exists */
  has(key: string): Promise<boolean>;
  /** Get all keys */
  keys(): Promise<string[]>;
  /** Clear all values */
  clear(): Promise<void>;
  /** Get all entries */
  entries<T = any>(): Promise<Array<[string, T]>>;
  /** Initialize the backend */
  init(): Promise<void>;
  /** Dispose/cleanup the backend */
  dispose(): Promise<void>;
}

/**
 * Storage instance interface
 */
export interface Storage extends StorageBackend {
  /** Active backend type */
  readonly activeBackend: StorageBackendType;
  /** Available features */
  readonly features: StorageFeatures;
  /** Subscribe to storage changes */
  subscribe<T = any>(pattern: string, callback: (event: StorageChangeEvent<T>) => void): () => void;
  /** Get quota usage */
  getQuotaUsage(): Promise<QuotaUsage>;
}

/**
 * Available storage features
 */
export interface StorageFeatures {
  encryption: boolean;
  quota: boolean;
  crossTab: boolean;
  persistence: boolean;
  migrations: boolean;
}

/**
 * Internal storage item with metadata
 */
export interface StorageItem<T = any> {
  value: T;
  expiresAt?: number;
  createdAt: number;
  accessedAt: number;
}
