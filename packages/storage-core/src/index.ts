/**
 * @web-loom/storage-core
 *
 * A unified browser storage library with type-safe API, migrations, encryption,
 * TTL support, and cross-tab synchronization.
 */

export { createStorage } from './storage';
export { createMigrationEngine, MigrationEngine } from './features/migrations';

export type {
  Storage,
  StorageBackend,
  StorageBackendType,
  StorageConfig,
  StorageOptions,
  StorageFeatures,
  StorageChangeEvent,
  StorageItem,
  QuotaUsage,
  QuotaConfig,
  EncryptionConfig,
  MigrationFunction,
} from './types';

export type { MigrationHistoryEntry, MigrationOptions } from './features/migrations';
