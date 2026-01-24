# @web-loom/store-core API Reference

**Version:** 0.5.4  
**Bundle Size:** <1KB gzipped  
**Dependencies:** Zero

Minimal, framework-agnostic client-side state management library with reactive patterns.

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Core API](#core-api)
- [Persistence](#persistence)
- [Framework Integration](#framework-integration)
- [Advanced Patterns](#advanced-patterns)
- [TypeScript](#typescript)
- [Best Practices](#best-practices)

## Installation

```bash
npm install @web-loom/store-core
```

## Quick Start

```typescript
import { createStore } from '@web-loom/store-core';

interface CounterState {
  count: number;
}

interface CounterActions {
  increment: () => void;
  decrement: () => void;
  add: (amount: number) => void;
}

const store = createStore<CounterState, CounterActions>(
  { count: 0 },
  (set, get) => ({
    increment: () => set(state => ({ ...state, count: state.count + 1 })),
    decrement: () => set(state => ({ ...state, count: state.count - 1 })),
    add: (amount) => set(state => ({ ...state, count: state.count + amount })),
  })
);

// Use the store
store.actions.increment();
console.log(store.getState()); // { count: 1 }

// Subscribe to changes
const unsubscribe = store.subscribe((newState, oldState) => {
  console.log('State changed:', oldState, '->', newState);
});
```

## Core API

### `createStore<S, A>(initialState, createActions, persistence?)`

Creates a new store instance.

**Type Signature:**
```typescript
function createStore<S extends State, A extends Actions<S, A>>(
  initialState: S,
  createActions: (
    set: (updater: (state: S) => S) => void,
    get: () => S,
    actions: A
  ) => A,
  persistence?: PersistenceConfig<S>
): Store<S, A> | PersistedStore<S, A>
```

**Parameters:**
- `initialState: S` - The initial state object
- `createActions` - Function that receives `set`, `get`, and `actions` and returns action implementations
- `persistence` - Optional persistence configuration

**Returns:** `Store<S, A>` or `PersistedStore<S, A>` (if persistence is configured)

### Store Instance Methods

#### `getState(): S`

Returns the current state snapshot.

```typescript
const currentState = store.getState();
console.log(currentState.count);
```

#### `setState(updater: (state: S) => S): void`

Updates the state. Primarily for internal use by actions.

```typescript
store.setState(state => ({ ...state, count: state.count + 1 }));
```

#### `subscribe(listener: Listener<S>): () => void`

Subscribes to state changes. Returns an unsubscribe function.

```typescript
const unsubscribe = store.subscribe((newState, oldState) => {
  console.log('State changed');
});

// Later...
unsubscribe();
```

#### `destroy(): void`

Clears all listeners. Call this to prevent memory leaks.

```typescript
store.destroy();
```

#### `actions: A`

Object containing all defined actions.

```typescript
store.actions.increment();
store.actions.add(5);
```

## Persistence

### Persistence Configuration

```typescript
interface PersistenceConfig<S> {
  adapter: PersistenceAdapter<S>;
  key: string;
  autoSync?: boolean;  // default: true
  merge?: boolean;     // default: false
  serialize?: (state: S) => string;
  deserialize?: (data: string) => S;
}
```

### Built-in Adapters

#### LocalStorageAdapter

Persists state to browser `localStorage`.

```typescript
import { createStore, LocalStorageAdapter } from '@web-loom/store-core';

const store = createStore(
  initialState,
  createActions,
  {
    adapter: new LocalStorageAdapter(),
    key: 'app-state',
    autoSync: true,
  }
);
```

#### IndexedDBAdapter

Persists state to browser `IndexedDB` for larger datasets.

```typescript
import { createStore, IndexedDBAdapter } from '@web-loom/store-core';

const store = createStore(
  initialState,
  createActions,
  {
    adapter: new IndexedDBAdapter('my-db-name'),
    key: 'documents',
    autoSync: true,
  }
);
```

#### MemoryAdapter

In-memory persistence for testing.

```typescript
import { createStore, MemoryAdapter } from '@web-loom/store-core';

const memoryAdapter = new MemoryAdapter<MyState>();

const store = createStore(
  initialState,
  createActions,
  {
    adapter: memoryAdapter,
    key: 'test-store',
  }
);

// Clear all data
memoryAdapter.clear();
```

### PersistedStore Methods

When persistence is configured, the store includes additional methods:

#### `persist(): Promise<void>`

Manually save current state to storage.

```typescript
await store.persist();
```

#### `hydrate(): Promise<void>`

Manually load state from storage.

```typescript
await store.hydrate();
```

#### `clearPersisted(): Promise<void>`

Clear persisted data from storage.

```typescript
await store.clearPersisted();
```

## Framework Integration

### React

```typescript
import { useEffect, useState } from 'react';
import type { Store } from '@web-loom/store-core';

export function useStore<S, A>(store: Store<S, A>): [S, A] {
  const [state, setState] = useState(store.getState());

  useEffect(() => {
    const unsubscribe = store.subscribe((newState) => {
      setState(newState);
    });
    return unsubscribe;
  }, [store]);

  return [state, store.actions];
}

// Usage
function Counter() {
  const [state, actions] = useStore(counterStore);
  
  return (
    <div>
      <p>Count: {state.count}</p>
      <button onClick={actions.increment}>+</button>
      <button onClick={actions.decrement}>-</button>
    </div>
  );
}
```

### Vue 3

```vue
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { counterStore } from './store';

const state = ref(counterStore.getState());

onMounted(() => {
  const unsubscribe = counterStore.subscribe((newState) => {
    state.value = newState;
  });
  
  onUnmounted(unsubscribe);
});

const actions = counterStore.actions;
</script>

<template>
  <div>
    <p>Count: {{ state.count }}</p>
    <button @click="actions.increment">+</button>
    <button @click="actions.decrement">-</button>
  </div>
</template>
```

### Angular

```typescript
import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { counterStore } from './store';

@Injectable({ providedIn: 'root' })
export class CounterService implements OnDestroy {
  private state$ = new BehaviorSubject(counterStore.getState());
  private unsubscribe: (() => void) | null = null;

  constructor() {
    this.unsubscribe = counterStore.subscribe((newState) => {
      this.state$.next(newState);
    });
  }

  get state(): Observable<CounterState> {
    return this.state$.asObservable();
  }

  get actions() {
    return counterStore.actions;
  }

  ngOnDestroy() {
    this.unsubscribe?.();
  }
}
```

## Advanced Patterns

### Async Actions

```typescript
interface ApiState {
  data: User[] | null;
  loading: boolean;
  error: string | null;
}

interface ApiActions {
  fetchUsers: () => Promise<void>;
  clearError: () => void;
}

const apiStore = createStore<ApiState, ApiActions>(
  { data: null, loading: false, error: null },
  (set, get) => ({
    fetchUsers: async () => {
      set(state => ({ ...state, loading: true, error: null }));
      
      try {
        const response = await fetch('/api/users');
        const users = await response.json();
        set(state => ({ ...state, data: users, loading: false }));
      } catch (error) {
        set(state => ({ 
          ...state, 
          loading: false, 
          error: error.message 
        }));
      }
    },
    
    clearError: () => set(state => ({ ...state, error: null })),
  })
);
```

### Selectors (Computed Values)

```typescript
const todoSelectors = {
  getVisibleTodos: (state: TodoState) => {
    const { todos, filter } = state;
    switch (filter) {
      case 'active':
        return todos.filter(t => !t.completed);
      case 'completed':
        return todos.filter(t => t.completed);
      default:
        return todos;
    }
  },
  
  getTodoStats: (state: TodoState) => ({
    total: state.todos.length,
    completed: state.todos.filter(t => t.completed).length,
    active: state.todos.filter(t => !t.completed).length,
  }),
};

// Usage
const visibleTodos = todoSelectors.getVisibleTodos(store.getState());
const stats = todoSelectors.getTodoStats(store.getState());
```

### Middleware Pattern

```typescript
// Logger middleware
function createLogger<S, A>(storeName: string) {
  return (store: any) => {
    const originalSubscribe = store.subscribe;
    store.subscribe = (listener: (newState: S, oldState: S) => void) => {
      return originalSubscribe((newState: S, oldState: S) => {
        console.group(`🔄 ${storeName} State Change`);
        console.log('Previous:', oldState);
        console.log('Next:', newState);
        console.groupEnd();
        listener(newState, oldState);
      });
    };
    return store;
  };
}

// Usage
const enhancedStore = createLogger('Counter')(
  createStore(initialState, createActions)
);
```

### Time Travel (Undo/Redo)

```typescript
function createTimeTravel<S, A>() {
  const history: S[] = [];
  let currentIndex = -1;

  return (store: any) => {
    const originalSetState = store.setState;

    store.setState = (updater: (state: S) => S) => {
      const newState = updater(store.getState());
      history.splice(currentIndex + 1);
      history.push(newState);
      currentIndex = history.length - 1;
      originalSetState(updater);
    };

    store.undo = () => {
      if (currentIndex > 0) {
        currentIndex--;
        originalSetState(() => history[currentIndex]);
      }
    };

    store.redo = () => {
      if (currentIndex < history.length - 1) {
        currentIndex++;
        originalSetState(() => history[currentIndex]);
      }
    };

    store.canUndo = () => currentIndex > 0;
    store.canRedo = () => currentIndex < history.length - 1;

    history.push(store.getState());
    currentIndex = 0;

    return store;
  };
}
```

## TypeScript

### Type Definitions

```typescript
import type {
  Store,
  PersistedStore,
  Listener,
  Actions,
  State,
  PersistenceAdapter,
  PersistenceConfig,
} from '@web-loom/store-core';
```

### Type-Safe Store

```typescript
interface AppState {
  user: User | null;
  theme: 'light' | 'dark';
  sidebar: {
    isOpen: boolean;
    isPinned: boolean;
  };
}

interface AppActions {
  setUser: (user: User | null) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  toggleSidebar: () => void;
  pinSidebar: (pinned: boolean) => void;
}

const appStore: Store<AppState, AppActions> = createStore(
  { user: null, theme: 'light', sidebar: { isOpen: false, isPinned: false } },
  (set) => ({
    setUser: (user) => set(state => ({ ...state, user })),
    setTheme: (theme) => set(state => ({ ...state, theme })),
    toggleSidebar: () => set(state => ({ 
      ...state, 
      sidebar: { ...state.sidebar, isOpen: !state.sidebar.isOpen } 
    })),
    pinSidebar: (pinned) => set(state => ({ 
      ...state, 
      sidebar: { ...state.sidebar, isPinned: pinned } 
    })),
  })
);
```

## Best Practices

### 1. Keep Stores Focused

Each store should manage a specific domain of state:

```typescript
// Good - focused stores
const userStore = createStore(/* user state */);
const cartStore = createStore(/* cart state */);
const uiStore = createStore(/* UI state */);

// Avoid - monolithic store
const appStore = createStore(/* everything */);
```

### 2. Immutable Updates

Always return new objects:

```typescript
// Good
increment: () => set(state => ({ ...state, count: state.count + 1 }))

// Bad - mutation
increment: () => set(state => {
  state.count++; // Mutates!
  return state;
})
```

### 3. Use TypeScript

Define clear interfaces:

```typescript
interface TodoState {
  todos: Todo[];
  filter: Filter;
}

interface TodoActions {
  addTodo: (text: string) => void;
  toggleTodo: (id: string) => void;
  setFilter: (filter: Filter) => void;
}
```

### 4. Clean Up Subscriptions

Always unsubscribe when done:

```typescript
useEffect(() => {
  const unsubscribe = store.subscribe(handleChange);
  return unsubscribe; // Cleanup
}, []);
```

### 5. Use Selectors

Create reusable selector functions:

```typescript
const selectors = {
  getActiveTodos: (state) => state.todos.filter(t => !t.completed),
  getTodoById: (state, id) => state.todos.find(t => t.id === id),
};
```

### 6. Handle Loading States

Include loading/error states for async operations:

```typescript
interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}
```

### 7. Persistence Strategy

Choose the right adapter:
- `LocalStorageAdapter`: User preferences, small data
- `IndexedDBAdapter`: Large datasets, documents
- `MemoryAdapter`: Testing, temporary data

## Common Patterns

### Global App State

```typescript
// store/app.ts
export const appStore = createStore(/* ... */);

// components/Header.tsx
import { appStore } from '../store/app';
```

### Module-Scoped Stores

```typescript
// features/cart/store.ts
export const cartStore = createStore(/* cart state */);

// features/user/store.ts
export const userStore = createStore(/* user state */);
```

### Composition

```typescript
const rootStore = {
  user: userStore,
  cart: cartStore,
  ui: uiStore,
};

export default rootStore;
```

## Performance Tips

1. **Shallow Comparison**: Store performs shallow equality checks before notifying subscribers
2. **Selective Subscription**: Subscribe only to needed parts of state
3. **Memoization**: Use selectors with memoization for computed values
4. **Batch Updates**: Group related state changes in a single `set()` call

## Troubleshooting

### State Not Updating

**Problem**: UI doesn't update after calling action

**Solution**: Ensure you're returning a new object:
```typescript
// Wrong
set(state => { state.count++; return state; })

// Correct
set(state => ({ ...state, count: state.count + 1 }))
```

### Memory Leaks

**Problem**: Memory usage grows over time

**Solution**: Always cleanup subscriptions:
```typescript
useEffect(() => {
  const unsub = store.subscribe(handleChange);
  return unsub; // Cleanup!
}, []);
```

### Persistence Not Working

**Problem**: State not saving/loading

**Solution**: Check adapter and key configuration:
```typescript
{
  adapter: new LocalStorageAdapter(),
  key: 'my-app-state', // Unique key
  autoSync: true,      // Enable auto-save
}
```

## Migration from Redux

```typescript
// Redux
const reducer = (state = initial, action) => {
  switch (action.type) {
    case 'INCREMENT':
      return { ...state, count: state.count + 1 };
  }
};

// Store-core
const store = createStore(
  { count: 0 },
  (set) => ({
    increment: () => set(state => ({ ...state, count: state.count + 1 })),
  })
);
```

## See Also

- [Full README](../../packages/store-core/README.md)
- [@web-loom/mvvm-core](./mvvm-core.md) - MVVM architecture
- [@web-loom/event-bus-core](./event-bus-core.md) - Event communication

## License

MIT
