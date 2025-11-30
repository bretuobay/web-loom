# storage-core

## Overview

`storage-core` is a modular, extensible library for managing client-side storage in web applications. It provides unified APIs for various storage backends (IndexedDB, WebStorage, in-memory) and supports advanced features like migrations and event handling.

## Features

- Unified API for multiple storage backends
- IndexedDB, WebStorage (localStorage/sessionStorage), and in-memory support
- Storage migrations for schema evolution
- Event system for storage changes
- Serialization utilities
- TypeScript support

## Installation

```bash
npm install @web-loom/storage-core
# or
pnpm add @web-loom/storage-core
```

## Usage

Basic usage example:

```ts
import { createStorage } from '@web-loom/storage-core';

const storage = createStorage({ backend: 'indexeddb', dbName: 'my-app' });
await storage.set('key', 'value');
const value = await storage.get('key');
```

See more examples in [`examples/`](./examples):

- [basic-usage.ts](./examples/basic-usage.ts)
- [indexeddb-usage.ts](./examples/indexeddb-usage.ts)
- [integration-with-viewmodel.ts](./examples/integration-with-viewmodel.ts)
- [migrations-usage.ts](./examples/migrations-usage.ts)

## API Reference

Main entry point: [`src/index.ts`](./src/index.ts)

Backends:

- [`src/backends/indexeddb.ts`](./src/backends/indexeddb.ts)
- [`src/backends/webstorage.ts`](./src/backends/webstorage.ts)
- [`src/backends/memory.ts`](./src/backends/memory.ts)

Features:

- Migrations: [`src/features/migrations.ts`](./src/features/migrations.ts)
- Events: [`src/utils/events.ts`](./src/utils/events.ts)
- Serialization: [`src/utils/serialization.ts`](./src/utils/serialization.ts)

Types:

- [`src/types.ts`](./src/types.ts)

## Testing

Run tests with:

```bash
pnpm test
```

Test files are in [`src/`](./src):

- [`storage.test.ts`](./src/storage.test.ts)
- [`storage-migrations.test.ts`](./src/storage-migrations.test.ts)
- [`backends/indexeddb.test.ts`](./src/backends/indexeddb.test.ts)
- [`features/migrations.test.ts`](./src/features/migrations.test.ts)

## Documentation & Status

- [IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md)
- [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)
- [PHASE2_SUMMARY.md](./PHASE2_SUMMARY.md)
- [Product Requirements Document.md](./Product%20Requirements%20Document.md)

## License

See [package.json](./package.json) for license information.
