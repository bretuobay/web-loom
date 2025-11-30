# Changelog

All notable changes to @web-loom/storage-core will be documented in this file.

## [0.1.0] - 2025-11-30

### Added - Phase 1: Foundation

- **Unified Storage API**: Single interface for localStorage, sessionStorage, and in-memory storage
- **Type-Safe Operations**: Full TypeScript support with generic type inference
- **Namespace Support**: Isolate keys by namespace to prevent collisions
- **TTL (Time-to-Live)**: Automatic expiration of stored items with configurable TTL
- **Change Events**: Subscribe to storage changes with pattern matching support
- **Fallback Strategy**: Automatic fallback when preferred storage backend is unavailable
- **Quota Detection**: Query storage usage and available quota
- **Complex Type Support**: Automatic serialization/deserialization of objects and arrays
- **Zero Dependencies**: Lightweight implementation with no runtime dependencies

### API

- `createStorage(config)`: Factory function to create storage instances
- `storage.get<T>(key)`: Retrieve values with type inference
- `storage.set<T>(key, value, options)`: Store values with optional TTL
- `storage.delete(key)`: Remove values
- `storage.has(key)`: Check key existence
- `storage.keys()`: Get all non-expired keys
- `storage.clear()`: Remove all values
- `storage.entries()`: Get all key-value pairs
- `storage.subscribe(pattern, callback)`: Subscribe to changes
- `storage.getQuotaUsage()`: Get storage quota information

### Bundle Size

- ESM: 2.42 KB gzipped
- UMD: 2.22 KB gzipped

### Testing

- 22 test cases covering all core functionality
- 100% pass rate

## [0.2.0] - 2025-11-30

### Added - Phase 2: IndexedDB + Migrations

- **IndexedDB Backend**: Full support for IndexedDB with async operations
- **Schema Versioning**: Track and manage storage schema versions
- **Migration Engine**: Automatic data migration between versions
- **Migration Rollback**: Automatic rollback on migration failure
- **Migration History**: Track all migration attempts with success/failure status
- **Dry-Run Mode**: Test migrations without applying changes
- **Progress Callbacks**: Monitor migration progress
- **Migration Validation**: Validate migration functions before execution

### API Additions

- `IndexedDBBackend`: New backend for IndexedDB storage
- `MigrationEngine`: Engine for managing schema migrations
- `createMigrationEngine()`: Factory function for migration engine
- `MigrationHistoryEntry`: Type for migration history records
- `MigrationOptions`: Configuration for migration execution

### Bundle Size

- **ESM**: 4.47 KB gzipped (19.74 KB uncompressed)
- **UMD**: 3.88 KB gzipped (14.12 KB uncompressed)
- Still well under 8KB target

### Testing

- **43 tests** passing (18 skipped in non-browser environments)
- IndexedDB backend tests
- Migration engine tests
- Integration tests for storage with migrations

### Coming Soon

- **Phase 3 (v0.3.0)**: AES-GCM encryption, Zod integration, advanced quota management, cross-tab sync
