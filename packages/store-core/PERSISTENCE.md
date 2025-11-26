# Persistence Extension

The store-core library now supports optional state persistence to various storage backends. This feature is fully backward compatible - existing stores work without any changes.

## Features

- **Pluggable Storage Adapters**: Memory, LocalStorage, and IndexedDB built-in
- **Auto-Hydration**: Automatically loads persisted state on store creation
- **Auto-Sync**: Optionally sync state changes to storage automatically
- **State Merging**: Merge loaded state with initial state or replace completely
- **Custom Serialization**: Support for complex data types (Dates, Maps, etc.)
- **Error Resilient**: Persistence errors don't crash your store

## Installation

No additional dependencies required - persistence is built into store-core.

## Basic Usage

### Without Persistence (Default)

```typescript
import { createStore } from '@web-loom/store-core';

interface CounterState {
  count: number;
}

const store = createStore(
  { count: 0 },
  (set, get, actions) => ({
    increment: () => set(state => ({ ...state, count: state.count + 1 })),
  })
);
```

### With Memory Adapter (Testing)

```typescript
import { createStore, MemoryAdapter } from '@web-loom/store-core';

const store = createStore(
  { count: 0 },
  (set, get, actions) => ({
    increment: () => set(state => ({ ...state, count: state.count + 1 })),
  }),
  {
    adapter: new MemoryAdapter(),
    key: 'counter-store',
  }
);
```

### With LocalStorage (Browser)

```typescript
import { createStore, LocalStorageAdapter } from '@web-loom/store-core';

const store = createStore(
  { count: 0 },
  (set, get, actions) => ({
    increment: () => set(state => ({ ...state, count: state.count + 1 })),
  }),
  {
    adapter: new LocalStorageAdapter(),
    key: 'my-app-counter',
    autoSync: true, // Auto-save on every state change (default: true)
  }
);

// State is automatically loaded from localStorage on creation
// State is automatically saved to localStorage on every change
```

### With IndexedDB (Large Datasets)

```typescript
import { createStore, IndexedDBAdapter } from '@web-loom/store-core';

const store = createStore(
  { items: [] },
  (set, get, actions) => ({
    addItem: (item) => set(state => ({ ...state, items: [...state.items, item] })),
  }),
  {
    adapter: new IndexedDBAdapter('my-app-db'),
    key: 'items-store',
  }
);
```

## Manual Persistence Control

Persisted stores have additional methods:

```typescript
import { createStore, LocalStorageAdapter, PersistedStore } from '@web-loom/store-core';

const store = createStore(
  { count: 0 },
  (set, get, actions) => ({
    increment: () => set(state => ({ ...state, count: state.count + 1 })),
  }),
  {
    adapter: new LocalStorageAdapter(),
    key: 'counter',
    autoSync: false, // Disable auto-sync
  }
) as PersistedStore<{ count: number }, any>;

// Manually save state
await store.persist();

// Manually reload from storage
await store.hydrate();

// Clear persisted state
await store.clearPersisted();
```

## State Merging

By default, loaded state completely replaces the initial state. Use the `merge` option to merge instead:

```typescript
const store = createStore(
  { count: 0, name: 'default', settings: { theme: 'light' } },
  createActions,
  {
    adapter: new LocalStorageAdapter(),
    key: 'app-state',
    merge: true, // Merge loaded state with initial state
  }
);

// If localStorage only has { count: 42 }, the final state will be:
// { count: 42, name: 'default', settings: { theme: 'light' } }
```

## Custom Serialization

For complex data types like Dates or Maps, create a custom adapter:

```typescript
import { PersistenceAdapter, State } from '@web-loom/store-core';

class CustomAdapter<S extends State> implements PersistenceAdapter<S> {
  async save(key: string, state: S): Promise<void> {
    const serialized = JSON.stringify(state, (key, value) => {
      if (value instanceof Date) {
        return { __type: 'Date', value: value.toISOString() };
      }
      return value;
    });
    localStorage.setItem(key, serialized);
  }

  async load(key: string): Promise<S | null> {
    const data = localStorage.getItem(key);
    if (!data) return null;

    return JSON.parse(data, (key, value) => {
      if (value?.__type === 'Date') {
        return new Date(value.value);
      }
      return value;
    }) as S;
  }

  async remove(key: string): Promise<void> {
    localStorage.removeItem(key);
  }

  async has(key: string): Promise<boolean> {
    return localStorage.getItem(key) !== null;
  }
}

// Use custom adapter
const store = createStore(
  { createdAt: new Date() },
  createActions,
  {
    adapter: new CustomAdapter(),
    key: 'app-state',
  }
);
```

## Configuration Options

```typescript
interface PersistenceConfig<S> {
  /** The persistence adapter to use */
  adapter: PersistenceAdapter<S>;

  /** The storage key/name */
  key: string;

  /** Auto-sync state changes (default: true) */
  autoSync?: boolean;

  /** Custom serializer (for advanced use cases) */
  serialize?: (state: S) => string;

  /** Custom deserializer (for advanced use cases) */
  deserialize?: (data: string) => S;

  /** Merge loaded state with initial state (default: false) */
  merge?: boolean;
}
```

## Built-in Adapters

### MemoryAdapter
In-memory storage, useful for testing or temporary persistence.

```typescript
const adapter = new MemoryAdapter<State>();
adapter.clear(); // Clear all data
```

### LocalStorageAdapter
Browser localStorage persistence, suitable for small to medium datasets.

```typescript
const adapter = new LocalStorageAdapter<State>();
// Handles quota exceeded errors gracefully
```

### IndexedDBAdapter
Browser IndexedDB persistence, suitable for large datasets.

```typescript
const adapter = new IndexedDBAdapter<State>('database-name');
await adapter.close(); // Close database connection when done
```

## Error Handling

Persistence errors are logged but don't crash your store:

```typescript
const store = createStore(
  { data: 'test' },
  createActions,
  {
    adapter: new LocalStorageAdapter(),
    key: 'my-store',
  }
);

// If localStorage quota is exceeded, the error is logged
// but your store continues to work normally
store.actions.updateData('new value'); // Works fine even if save fails
```

## TypeScript Support

Full type inference for persisted stores:

```typescript
import { PersistedStore } from '@web-loom/store-core';

// Regular store (no persistence)
const regularStore = createStore(initialState, createActions);
// Type: Store<MyState, MyActions>

// Persisted store
const persistedStore = createStore(initialState, createActions, {
  adapter: new LocalStorageAdapter(),
  key: 'my-store',
});
// Type: PersistedStore<MyState, MyActions>

// PersistedStore has additional methods:
persistedStore.persist();
persistedStore.hydrate();
persistedStore.clearPersisted();
```

## Best Practices

1. **Choose the right adapter**:
   - `MemoryAdapter`: Testing, temporary state
   - `LocalStorageAdapter`: < 5MB of data, simple state
   - `IndexedDBAdapter`: Large datasets, complex queries

2. **Use unique keys**: Avoid key collisions by prefixing with your app name
   ```typescript
   key: 'myapp-user-preferences'
   ```

3. **Handle migrations**: When state structure changes, handle old data gracefully
   ```typescript
   const store = createStore(
     { version: 2, count: 0, newField: 'default' },
     createActions,
     {
       adapter: new LocalStorageAdapter(),
       key: 'counter',
       merge: true, // Helps with adding new fields
     }
   );
   ```

4. **Disable auto-sync for performance**: For high-frequency updates
   ```typescript
   {
     autoSync: false, // Manually call persist() when needed
   }
   ```

5. **Clean up on logout**: Clear persisted state when appropriate
   ```typescript
   await store.clearPersisted();
   ```

## Browser Compatibility

- **MemoryAdapter**: All environments (Node.js, browsers)
- **LocalStorageAdapter**: All modern browsers
- **IndexedDBAdapter**: All modern browsers (IE 10+)

## Testing

Use `MemoryAdapter` for testing:

```typescript
import { MemoryAdapter } from '@web-loom/store-core';

describe('MyComponent', () => {
  let adapter: MemoryAdapter<State>;

  beforeEach(() => {
    adapter = new MemoryAdapter();
  });

  afterEach(() => {
    adapter.clear();
  });

  it('should persist state', async () => {
    const store = createStore(initialState, createActions, {
      adapter,
      key: 'test-store',
    });

    store.actions.increment();
    await store.persist();

    expect(await adapter.load('test-store')).toEqual({ count: 1 });
  });
});
```
