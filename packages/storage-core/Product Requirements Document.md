# Product Requirements Document: @web-loom/storage-core

## Executive Summary

@web-loom/storage-core is a unified browser storage library that abstracts localStorage, sessionStorage, and IndexedDB behind a consistent, type-safe API. It addresses the fragmented nature of browser storage by providing schema migrations, encryption, TTL support, and cross-tab synchronization—capabilities that are currently missing from the web-loom ecosystem despite being essential for modern web applications.

---

## Problem Statement

Browser storage is fragmented across multiple APIs with different capabilities, limitations, and interfaces. Developers building with web-loom face several challenges:

**API Inconsistency**: localStorage uses synchronous string-only operations, while IndexedDB offers async structured storage with a complex callback-based API. Developers must learn and manage multiple paradigms.

**No Migration Path**: When storage schemas evolve, there's no standardized way to migrate existing user data. This leads to data corruption, lost user preferences, or defensive coding that complicates the codebase.

**Security Gaps**: Sensitive data stored in the browser is vulnerable. Implementing encryption correctly requires cryptographic expertise that most application developers lack.

**Quota Blindness**: Applications often exceed storage quotas without warning, causing silent failures. There's no proactive way to monitor usage or implement fallback strategies.

**Tab Isolation**: Multi-tab applications can't easily share state changes, leading to stale data and inconsistent user experiences.

The query-core package provides cache providers for localStorage and IndexedDB, but these are purpose-built for caching HTTP responses—not general-purpose storage. Applications need a broader solution for persisting user data, preferences, drafts, and offline content.

---

## Goals and Success Metrics

### Primary Goals

1. Provide a single API that works across all browser storage mechanisms
2. Enable safe schema evolution with automatic migrations
3. Protect sensitive data with built-in encryption
4. Prevent quota-related failures through proactive management
5. Support real-time cross-tab synchronization

### Success Metrics

| Metric                    | Target                       | Measurement Method       |
| ------------------------- | ---------------------------- | ------------------------ |
| Bundle size (core)        | < 8KB gzipped                | Build output analysis    |
| API surface coverage      | 100% of common operations    | Feature parity testing   |
| Migration reliability     | Zero data loss in upgrades   | Integration test suite   |
| Adoption within ecosystem | Used by 3+ web-loom packages | Package dependency graph |
| Type safety               | Full inference, no `any`     | TypeScript strict mode   |

---

## User Personas

### Application Developer (Primary)

Sarah builds a note-taking PWA. She needs to store notes offline, sync user preferences across tabs, and ensure drafts survive browser restarts. She wants to focus on features, not storage plumbing.

**Needs**: Simple API, TypeScript support, reliable persistence
**Pain Points**: IndexedDB complexity, localStorage size limits, lost data on schema changes

### Library Author (Secondary)

Marcus maintains a form library in the web-loom ecosystem. He wants to offer draft persistence as a feature but doesn't want to bundle storage logic or make assumptions about storage backends.

**Needs**: Pluggable storage adapter, minimal footprint, no runtime dependencies
**Pain Points**: Each app has different storage preferences, testing storage is tedious

### Security-Conscious Developer (Secondary)

Priya works on a healthcare application. She must encrypt patient identifiers stored locally while maintaining HIPAA compliance. She needs audit trails and secure key management.

**Needs**: AES-256 encryption, key rotation, secure defaults
**Pain Points**: Cryptographic APIs are hard to use correctly, compliance requirements are strict

---

## Feature Specifications

### 1. Unified Storage API

**Description**: A consistent interface that works identically across localStorage, sessionStorage, IndexedDB, and in-memory storage.

**Requirements**:

- All operations return Promises for consistency (even localStorage)
- Support for `get`, `set`, `delete`, `has`, `keys`, `clear`, and `entries`
- Automatic serialization/deserialization of complex types
- Namespace support to prevent key collisions between features
- Batch operations for atomic multi-key updates

**API Example**:

```typescript
import { createStorage } from '@web-loom/storage-core';

const storage = createStorage({
  backend: 'indexeddb',
  name: 'my-app',
  namespace: 'user-preferences',
});

await storage.set('theme', { mode: 'dark', accent: '#6366f1' });
const theme = await storage.get('theme');
```

**Acceptance Criteria**:

- Switching backends requires only a config change, not code changes
- All backends pass identical integration test suites
- Operations complete within 50ms for typical payloads (< 1MB)

---

### 2. Schema Versioning and Migrations

**Description**: A system for evolving storage schemas over time with automatic data migration.

**Requirements**:

- Version tracking per storage namespace
- Migration functions that transform data between versions
- Rollback support for failed migrations
- Dry-run mode for testing migrations
- Migration hooks for logging and analytics

**API Example**:

```typescript
const storage = createStorage({
  backend: 'indexeddb',
  name: 'my-app',
  version: 3,
  migrations: {
    1: async (store) => {
      // Initial schema, no migration needed
    },
    2: async (store) => {
      // Rename 'userName' to 'displayName'
      const users = await store.entries();
      for (const [key, value] of users) {
        if (value.userName) {
          value.displayName = value.userName;
          delete value.userName;
          await store.set(key, value);
        }
      }
    },
    3: async (store) => {
      // Add default 'role' field
      const users = await store.entries();
      for (const [key, value] of users) {
        value.role = value.role ?? 'member';
        await store.set(key, value);
      }
    },
  },
});
```

**Acceptance Criteria**:

- Migrations run automatically on storage initialization
- Failed migrations leave storage in pre-migration state
- Migration history is queryable for debugging
- Migrations can be tested without affecting production data

---

### 3. Type-Safe Storage with Zod

**Description**: Runtime validation and TypeScript inference using Zod schemas.

**Requirements**:

- Schema definition at storage creation
- Automatic validation on read and write
- Inferred TypeScript types from schemas
- Validation error reporting with field-level detail
- Optional strict mode that throws on invalid data

**API Example**:

```typescript
import { z } from 'zod';
import { createTypedStorage } from '@web-loom/storage-core';

const UserPreferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']),
  fontSize: z.number().min(12).max(24),
  notifications: z.boolean(),
});

const storage = createTypedStorage({
  backend: 'localstorage',
  name: 'preferences',
  schema: UserPreferencesSchema,
});

// Type error: 'huge' is not assignable to theme
await storage.set('prefs', { theme: 'huge', fontSize: 16, notifications: true });

// Return type is inferred as z.infer<typeof UserPreferencesSchema>
const prefs = await storage.get('prefs');
```

**Acceptance Criteria**:

- Invalid data is rejected before writing to storage
- TypeScript catches schema violations at compile time
- Validation errors include the failing field and constraint
- Zod is a peer dependency, not bundled

---

### 4. Encryption for Sensitive Data

**Description**: AES-GCM encryption for protecting sensitive data at rest.

**Requirements**:

- AES-256-GCM encryption using Web Crypto API
- Key derivation from user-provided passwords (PBKDF2)
- Support for externally managed keys
- Per-field encryption for partial protection
- Key rotation without data loss

**API Example**:

```typescript
const storage = createStorage({
  backend: 'indexeddb',
  name: 'secure-store',
  encryption: {
    enabled: true,
    keySource: 'derive',
    password: userPassword, // Or use keySource: 'provided' with raw key
    iterations: 100000, // PBKDF2 iterations
  },
});

// Data encrypted transparently
await storage.set('api-token', { token: 'secret-123', expires: Date.now() + 3600000 });

// Decrypted on read
const { token } = await storage.get('api-token');
```

**Acceptance Criteria**:

- Encrypted data is indistinguishable from random bytes
- Decryption fails gracefully with wrong key (no partial data exposure)
- Key material is never logged or exposed in errors
- Encryption adds < 20ms overhead for typical operations

---

### 5. TTL (Time-to-Live) Support

**Description**: Automatic expiration of stored data based on configurable lifetimes.

**Requirements**:

- Per-key TTL configuration
- Default TTL at storage level
- Lazy expiration (on access) and eager expiration (background cleanup)
- TTL extension on access (sliding expiration)
- Expiration callbacks for cleanup logic

**API Example**:

```typescript
const storage = createStorage({
  backend: 'indexeddb',
  name: 'cache',
  defaultTTL: 3600000, // 1 hour default
  expirationMode: 'lazy', // or 'eager' for background cleanup
});

// Expires in 5 minutes
await storage.set('session-token', token, { ttl: 300000 });

// Extends TTL on each access
await storage.set('active-session', data, { ttl: 600000, sliding: true });

// Returns null if expired
const token = await storage.get('session-token');
```

**Acceptance Criteria**:

- Expired data is never returned from `get`
- Eager expiration runs without blocking main thread
- Sliding expiration updates TTL on every read
- Storage space is reclaimed after expiration

---

### 6. Cross-Tab Storage Events

**Description**: Real-time synchronization of storage changes across browser tabs.

**Requirements**:

- Event emission on storage changes
- Subscription API for change notifications
- Support for both localStorage (native events) and IndexedDB (BroadcastChannel)
- Conflict resolution for concurrent writes
- Selective subscriptions by key pattern

**API Example**:

```typescript
const storage = createStorage({
  backend: 'indexeddb',
  name: 'shared-state',
  crossTab: true,
});

// Subscribe to changes
const unsubscribe = storage.subscribe('user:*', (event) => {
  console.log(`Key ${event.key} changed from ${event.oldValue} to ${event.newValue}`);
  console.log(`Change originated in tab: ${event.sourceTab}`);
});

// This triggers subscribers in all tabs
await storage.set('user:profile', { name: 'Alice' });

// Cleanup
unsubscribe();
```

**Acceptance Criteria**:

- Changes propagate to other tabs within 100ms
- Subscriptions can filter by key prefix or pattern
- Events include old value, new value, and source tab
- No memory leaks from abandoned subscriptions

---

### 7. Storage Quota Detection

**Description**: Proactive monitoring of storage usage and quota limits.

**Requirements**:

- Query current usage and available quota
- Warning thresholds with callbacks
- Automatic cleanup strategies when approaching limits
- Per-namespace usage breakdown
- Graceful degradation when quota exceeded

**API Example**:

```typescript
const storage = createStorage({
  backend: 'indexeddb',
  name: 'media-cache',
  quota: {
    warningThreshold: 0.8, // 80% of quota
    onWarning: (usage) => {
      console.warn(`Storage at ${usage.percent}%`);
      analytics.track('storage_warning', usage);
    },
    cleanupStrategy: 'lru', // Remove least-recently-used when full
  },
});

// Check quota manually
const usage = await storage.getQuotaUsage();
// { used: 45000000, available: 52428800, percent: 85.8 }
```

**Acceptance Criteria**:

- Quota information is accurate across all backends
- Warnings fire before quota is exceeded
- Cleanup strategies prevent write failures
- Usage breakdown shows per-namespace consumption

---

### 8. Fallback Strategies

**Description**: Graceful degradation when preferred storage is unavailable.

**Requirements**:

- Ordered list of backend preferences
- Automatic fallback on initialization failure
- Runtime backend switching
- Feature detection for encryption and quota APIs
- Clear indication of active backend

**API Example**:

```typescript
const storage = createStorage({
  backend: ['indexeddb', 'localstorage', 'memory'],
  name: 'resilient-store',
  onFallback: (from, to, reason) => {
    console.warn(`Fell back from ${from} to ${to}: ${reason}`);
  },
});

// Check which backend is active
console.log(storage.activeBackend); // 'indexeddb' | 'localstorage' | 'memory'

// Check available features
console.log(storage.features);
// { encryption: true, quota: true, crossTab: true, persistence: true }
```

**Acceptance Criteria**:

- Fallback is transparent to application code
- Fallback reasons are logged for debugging
- Feature availability is queryable
- In-memory fallback works in all environments

---

## Technical Architecture

### Package Structure

```
@web-loom/storage-core/
├── src/
│   ├── index.ts                 # Public API exports
│   ├── storage.ts               # Main createStorage factory
│   ├── backends/
│   │   ├── interface.ts         # StorageBackend interface
│   │   ├── localstorage.ts      # localStorage adapter
│   │   ├── sessionstorage.ts    # sessionStorage adapter
│   │   ├── indexeddb.ts         # IndexedDB adapter
│   │   └── memory.ts            # In-memory adapter
│   ├── features/
│   │   ├── migrations.ts        # Schema migration engine
│   │   ├── encryption.ts        # AES-GCM encryption
│   │   ├── ttl.ts               # Expiration management
│   │   ├── sync.ts              # Cross-tab synchronization
│   │   └── quota.ts             # Storage quota monitoring
│   ├── validation/
│   │   └── zod-adapter.ts       # Zod schema integration
│   └── utils/
│       ├── serialization.ts     # JSON + binary handling
│       └── events.ts            # Event emitter utilities
├── tests/
│   ├── unit/
│   └── integration/
└── package.json
```

### Dependencies

| Dependency | Type    | Purpose                   |
| ---------- | ------- | ------------------------- |
| zod        | Peer    | Schema validation         |
| None       | Runtime | Zero runtime dependencies |

### Browser Support

- Chrome 80+
- Firefox 75+
- Safari 14+
- Edge 80+

Older browsers fall back to localStorage or memory storage automatically.

---

## Integration Points

### With @web-loom/query-core

The storage-core package will provide a cache adapter for query-core, replacing its built-in localStorage and IndexedDB providers with a more robust implementation.

```typescript
import { createStorage } from '@web-loom/storage-core';
import { createQueryClient } from '@web-loom/query-core';

const cacheStorage = createStorage({
  backend: 'indexeddb',
  name: 'query-cache',
  defaultTTL: 3600000,
});

const queryClient = createQueryClient({
  cache: cacheStorage.asQueryCache(),
});
```

### With Future Packages

- **@web-loom/form-core**: Draft persistence for unsaved form data
- **@web-loom/auth-core**: Secure token storage with encryption
- **@web-loom/offline-core**: Service worker cache coordination

---

## Risks and Mitigations

| Risk                                            | Likelihood | Impact | Mitigation                                               |
| ----------------------------------------------- | ---------- | ------ | -------------------------------------------------------- |
| IndexedDB quota varies wildly by browser        | High       | Medium | Implement conservative defaults, clear documentation     |
| Encryption performance on mobile                | Medium     | Medium | Benchmark on low-end devices, offer opt-out              |
| Migration failures corrupt data                 | Low        | High   | Transaction wrapping, automatic backups before migration |
| BroadcastChannel not supported in Safari < 15.4 | Medium     | Low    | Fall back to localStorage events or polling              |
| Zod version conflicts with apps                 | Medium     | Low    | Peer dependency with wide version range                  |

---

## Release Plan

### Phase 1: Foundation (v0.1.0)

- Unified API for localStorage, sessionStorage, memory
- Basic TypeScript types
- Namespace support
- Unit test coverage > 90%

### Phase 2: IndexedDB + Migrations (v0.2.0)

- IndexedDB backend
- Schema versioning
- Migration engine
- Integration tests

### Phase 3: Security + TTL (v0.3.0)

- AES-GCM encryption
- TTL support
- Zod integration
- Security audit

### Phase 4: Sync + Quota (v1.0.0)

- Cross-tab synchronization
- Quota management
- Fallback strategies
- Documentation site
- Performance benchmarks

---

## Open Questions

1. **Key format constraints**: Should keys be limited to strings, or support hierarchical paths like `user.preferences.theme`?

2. **Compression**: Should we offer optional compression for large values? This adds complexity but reduces storage usage.

3. **React integration**: Should we provide React hooks in this package or a separate `@web-loom/storage-react` package?

4. **Testing utilities**: Should we export mock storage implementations for testing, or leave that to userland?

---

## Appendix: Competitive Analysis

| Feature          | storage-core   | localForage | idb-keyval | Dexie.js |
| ---------------- | -------------- | ----------- | ---------- | -------- |
| Unified API      | ✓              | ✓           | Partial    | ✗        |
| TypeScript       | Full inference | Types only  | Types only | Full     |
| Migrations       | ✓              | ✗           | ✗          | ✓        |
| Encryption       | Built-in       | Plugin      | ✗          | Plugin   |
| TTL              | ✓              | ✗           | ✗          | ✗        |
| Cross-tab sync   | ✓              | ✗           | ✗          | ✓        |
| Quota management | ✓              | ✗           | ✗          | Partial  |
| Bundle size      | ~8KB           | ~10KB       | ~1KB       | ~25KB    |

---

_Document Version: 1.0_  
_Last Updated: November 2025_  
_Author: Claude_  
_Status: Draft for Review_
