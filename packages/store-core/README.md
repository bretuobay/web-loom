# @web-loom/store-core

`@web-loom/store-core` is a minimal, framework-agnostic client-side state management library designed for building reactive web applications. It provides a simple and efficient way to manage UI state with a focus on type safety and predictability.

## Overview

Inspired by patterns from libraries like Redux and Zustand, `store-core` offers a `createStore` function to define a reactive store. This store encapsulates your application's state, actions to modify that state, and mechanisms to subscribe to state changes.

The library is built with TypeScript and emphasizes:

- **Simplicity:** An intuitive API with minimal boilerplate.
- **Type Safety:** Full TypeScript support for robust type checking and autocompletion.
- **Framework Agnostic:** Usable with any JavaScript framework (React, Vue, Angular, Svelte) or vanilla JavaScript.
- **Predictable State Changes:** State modifications occur only through explicit actions, promoting immutability.
- **Lightweight:** Small bundle size and high performance.

## Core Concepts

- **Store:** A single source of truth for a specific part of your application's state. It contains the state, actions, and subscription logic.
- **State:** A plain JavaScript object representing the current data.
- **Actions:** Functions defined within the store that encapsulate the logic for modifying the state. All state changes must go through actions.
- **Selectors:** Functions that derive computed data from the state.
- **Listeners:** Functions that are called whenever the state in the store changes, allowing UI components or other parts of the application to react.

## Installation

```bash
npm install @web-loom/store-core
# or
yarn add @web-loom/store-core
# or
pnpm add @web-loom/store-core
```

## Basic Usage

```typescript
import { createStore } from '@web-loom/store-core';

// 1. Define your state interface
interface CounterState {
  count: number;
}

// 2. Define your actions interface
interface CounterActions {
  increment: () => void;
  decrement: () => void;
  add: (amount: number) => void;
}

// 3. Create the store
const store = createStore<CounterState, CounterActions>(
  { count: 0 }, // Initial state
  (set, get, actions) => ({
    increment: () => set((state) => ({ ...state, count: state.count + 1 })),
    decrement: () => set((state) => ({ ...state, count: state.count - 1 })),
    add: (amount: number) => set((state) => ({ ...state, count: state.count + amount })),
  }),
);

// 4. Get current state
console.log(store.getState()); // { count: 0 }

// 5. Dispatch actions
store.actions.increment();
console.log(store.getState()); // { count: 1 }

store.actions.add(5);
console.log(store.getState()); // { count: 6 }

// 6. Subscribe to state changes
const unsubscribe = store.subscribe((newState, oldState) => {
  console.log('State changed:', oldState, '->', newState);
});

store.actions.decrement();
// Output: State changed: { count: 6 } -> { count: 5 }
console.log(store.getState()); // { count: 5 }

// 7. Unsubscribe when no longer needed
unsubscribe();

// 8. Destroy the store to clean up listeners (e.g., when a component unmounts)
store.destroy();
```

## API

### `createStore<S, A>(initialState, createActions)`

- `initialState: S`: The initial state object.
- `createActions: (set, get, actions) => A`: A function that receives:
  - `set: (updater: (state: S) => S) => void`: A function to update the state. The `updater` function receives the current state and should return a new state object (immutability is key).
  - `get: () => S`: A function to get the current state. Useful for actions that need to read the state before updating.
  - `actions: A`: A reference to the actions object itself, allowing actions to call other actions.
    This function must return an object containing your action implementations.

Returns a `Store` instance.

### `Store<S, A>` instance

- `getState(): S`: Returns the current state.
- `setState(updater: (state: S) => S): void`: Updates the state. Primarily for internal use by actions.
- `subscribe(listener: (newState: S, oldState: S) => void): () => void`: Subscribes a listener to state changes. Returns an unsubscribe function.
- `destroy(): void`: Clears all listeners. Call this to prevent memory leaks when the store is no longer needed.
- `actions: A`: An object containing the actions you defined.

## Advanced Examples

### 1. Built-in Persistence Adapters

The store-core package includes several persistence adapters out of the box:

#### LocalStorage Persistence

```typescript
import { createStore, LocalStorageAdapter } from '@web-loom/store-core';

interface UserPreferencesState {
  theme: 'light' | 'dark';
  language: string;
  notifications: boolean;
  sidebarCollapsed: boolean;
}

interface UserPreferencesActions {
  setTheme: (theme: 'light' | 'dark') => void;
  setLanguage: (language: string) => void;
  toggleNotifications: () => void;
  toggleSidebar: () => void;
  resetToDefaults: () => void;
}

const defaultPreferences: UserPreferencesState = {
  theme: 'light',
  language: 'en',
  notifications: true,
  sidebarCollapsed: false,
};

// Create store with LocalStorage persistence
const preferencesStore = createStore<UserPreferencesState, UserPreferencesActions>(
  defaultPreferences,
  (set, get) => ({
    setTheme: (theme) => set((state) => ({ ...state, theme })),
    setLanguage: (language) => set((state) => ({ ...state, language })),
    toggleNotifications: () =>
      set((state) => ({
        ...state,
        notifications: !state.notifications,
      })),
    toggleSidebar: () =>
      set((state) => ({
        ...state,
        sidebarCollapsed: !state.sidebarCollapsed,
      })),
    resetToDefaults: () => set(() => ({ ...defaultPreferences })),
  }),
  {
    adapter: new LocalStorageAdapter(),
    key: 'user-preferences',
    autoSync: true, // Auto-save on state changes (default: true)
    merge: true, // Merge loaded state with initial state (default: false)
  },
);

// The store automatically loads from localStorage on creation
// and saves changes automatically when autoSync is true
```

#### IndexedDB Persistence (for larger datasets)

```typescript
import { createStore, IndexedDBAdapter } from '@web-loom/store-core';

interface DocumentState {
  documents: { id: string; title: string; content: string; lastModified: Date }[];
  currentDocument: string | null;
}

interface DocumentActions {
  addDocument: (title: string, content: string) => void;
  updateDocument: (id: string, updates: Partial<{ title: string; content: string }>) => void;
  deleteDocument: (id: string) => void;
  setCurrentDocument: (id: string | null) => void;
}

// IndexedDB is better for larger datasets
const documentStore = createStore<DocumentState, DocumentActions>(
  { documents: [], currentDocument: null },
  (set, get) => ({
    addDocument: (title, content) => {
      const newDoc = {
        id: crypto.randomUUID(),
        title,
        content,
        lastModified: new Date(),
      };
      set((state) => ({
        ...state,
        documents: [...state.documents, newDoc],
      }));
    },

    updateDocument: (id, updates) => {
      set((state) => ({
        ...state,
        documents: state.documents.map((doc) =>
          doc.id === id ? { ...doc, ...updates, lastModified: new Date() } : doc,
        ),
      }));
    },

    deleteDocument: (id) => {
      set((state) => ({
        ...state,
        documents: state.documents.filter((doc) => doc.id !== id),
        currentDocument: state.currentDocument === id ? null : state.currentDocument,
      }));
    },

    setCurrentDocument: (id) => {
      set((state) => ({ ...state, currentDocument: id }));
    },
  }),
  {
    adapter: new IndexedDBAdapter('document-store-db'),
    key: 'documents',
    autoSync: true,
  },
);
```

#### Memory Adapter (for testing or temporary persistence)

```typescript
import { createStore, MemoryAdapter } from '@web-loom/store-core';

interface TestState {
  count: number;
  items: string[];
}

interface TestActions {
  increment: () => void;
  addItem: (item: string) => void;
  reset: () => void;
}

// Memory adapter keeps data in memory - useful for testing
const memoryAdapter = new MemoryAdapter<TestState>();

const testStore = createStore<TestState, TestActions>(
  { count: 0, items: [] },
  (set, get) => ({
    increment: () => set((state) => ({ ...state, count: state.count + 1 })),
    addItem: (item) => set((state) => ({ ...state, items: [...state.items, item] })),
    reset: () => set(() => ({ count: 0, items: [] })),
  }),
  {
    adapter: memoryAdapter,
    key: 'test-store',
    autoSync: true,
  },
);

// Useful methods for memory adapter
memoryAdapter.clear(); // Clear all stored data
```

#### Manual Persistence Control

```typescript
import { createStore, LocalStorageAdapter } from '@web-loom/store-core';

interface AppState {
  drafts: { id: string; content: string }[];
  lastSaved: Date | null;
}

interface AppActions {
  updateDraft: (id: string, content: string) => void;
  deleteDraft: (id: string) => void;
  saveManually: () => Promise<void>;
  loadManually: () => Promise<void>;
}

const appStore = createStore<AppState, AppActions>(
  { drafts: [], lastSaved: null },
  (set, get) => ({
    updateDraft: (id, content) => {
      set((state) => ({
        ...state,
        drafts: state.drafts.some((d) => d.id === id)
          ? state.drafts.map((d) => (d.id === id ? { ...d, content } : d))
          : [...state.drafts, { id, content }],
      }));
    },

    deleteDraft: (id) => {
      set((state) => ({
        ...state,
        drafts: state.drafts.filter((d) => d.id !== id),
      }));
    },

    saveManually: async () => {
      await appStore.persist();
      set((state) => ({ ...state, lastSaved: new Date() }));
    },

    loadManually: async () => {
      await appStore.hydrate();
    },
  }),
  {
    adapter: new LocalStorageAdapter(),
    key: 'app-drafts',
    autoSync: false, // Disable auto-sync for manual control
  },
);

// Manual persistence methods available on PersistedStore
// appStore.persist() - Save current state
// appStore.hydrate() - Load state from storage
// appStore.clearPersisted() - Clear persisted data
```

### 2. Async Actions with Loading States

```typescript
interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface User {
  id: number;
  name: string;
  email: string;
}

interface UserStoreState {
  users: ApiState<User[]>;
  currentUser: ApiState<User>;
}

interface UserStoreActions {
  fetchUsers: () => Promise<void>;
  fetchUser: (id: number) => Promise<void>;
  clearError: (key: 'users' | 'currentUser') => void;
  reset: () => void;
}

const initialState: UserStoreState = {
  users: { data: null, loading: false, error: null },
  currentUser: { data: null, loading: false, error: null },
};

const userStore = createStore<UserStoreState, UserStoreActions>(initialState, (set, get) => ({
  fetchUsers: async () => {
    set((state) => ({
      ...state,
      users: { ...state.users, loading: true, error: null },
    }));

    try {
      const response = await fetch('/api/users');
      if (!response.ok) throw new Error('Failed to fetch users');
      const users = await response.json();

      set((state) => ({
        ...state,
        users: { data: users, loading: false, error: null },
      }));
    } catch (error) {
      set((state) => ({
        ...state,
        users: {
          ...state.users,
          loading: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      }));
    }
  },

  fetchUser: async (id: number) => {
    set((state) => ({
      ...state,
      currentUser: { ...state.currentUser, loading: true, error: null },
    }));

    try {
      const response = await fetch(`/api/users/${id}`);
      if (!response.ok) throw new Error('Failed to fetch user');
      const user = await response.json();

      set((state) => ({
        ...state,
        currentUser: { data: user, loading: false, error: null },
      }));
    } catch (error) {
      set((state) => ({
        ...state,
        currentUser: {
          ...state.currentUser,
          loading: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      }));
    }
  },

  clearError: (key) => {
    set((state) => ({
      ...state,
      [key]: { ...state[key], error: null },
    }));
  },

  reset: () => set(() => ({ ...initialState })),
}));
```

### 3. Computed Values (Selectors)

```typescript
interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
}

interface TodoState {
  todos: TodoItem[];
  filter: 'all' | 'active' | 'completed';
  sortBy: 'createdAt' | 'priority' | 'text';
}

interface TodoActions {
  addTodo: (text: string, priority?: 'low' | 'medium' | 'high') => void;
  toggleTodo: (id: string) => void;
  deleteTodo: (id: string) => void;
  setFilter: (filter: 'all' | 'active' | 'completed') => void;
  setSortBy: (sortBy: 'createdAt' | 'priority' | 'text') => void;
  clearCompleted: () => void;
}

const todoStore = createStore<TodoState, TodoActions>(
  {
    todos: [],
    filter: 'all',
    sortBy: 'createdAt',
  },
  (set, get) => ({
    addTodo: (text, priority = 'medium') => {
      const newTodo: TodoItem = {
        id: crypto.randomUUID(),
        text,
        completed: false,
        priority,
        createdAt: new Date(),
      };
      set((state) => ({ ...state, todos: [...state.todos, newTodo] }));
    },

    toggleTodo: (id) =>
      set((state) => ({
        ...state,
        todos: state.todos.map((todo) => (todo.id === id ? { ...todo, completed: !todo.completed } : todo)),
      })),

    deleteTodo: (id) =>
      set((state) => ({
        ...state,
        todos: state.todos.filter((todo) => todo.id !== id),
      })),

    setFilter: (filter) => set((state) => ({ ...state, filter })),
    setSortBy: (sortBy) => set((state) => ({ ...state, sortBy })),

    clearCompleted: () =>
      set((state) => ({
        ...state,
        todos: state.todos.filter((todo) => !todo.completed),
      })),
  }),
);

// Create selector functions for computed values
const todoSelectors = {
  getVisibleTodos: () => {
    const { todos, filter, sortBy } = todoStore.getState();

    // Filter todos
    let filteredTodos = todos;
    switch (filter) {
      case 'active':
        filteredTodos = todos.filter((todo) => !todo.completed);
        break;
      case 'completed':
        filteredTodos = todos.filter((todo) => todo.completed);
        break;
      default:
        filteredTodos = todos;
    }

    // Sort todos
    return filteredTodos.sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        case 'text':
          return a.text.localeCompare(b.text);
        case 'createdAt':
        default:
          return b.createdAt.getTime() - a.createdAt.getTime();
      }
    });
  },

  getTodoStats: () => {
    const { todos } = todoStore.getState();
    return {
      total: todos.length,
      completed: todos.filter((todo) => todo.completed).length,
      active: todos.filter((todo) => !todo.completed).length,
      highPriority: todos.filter((todo) => todo.priority === 'high' && !todo.completed).length,
    };
  },
};

// Usage with selectors
console.log(todoSelectors.getVisibleTodos());
console.log(todoSelectors.getTodoStats());
```

### 4. Store Composition and Middleware

```typescript
// Middleware for logging state changes
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

// Middleware for time-travel debugging
function createTimeTravel<S, A>() {
  const history: S[] = [];
  let currentIndex = -1;

  return (store: any) => {
    const originalSetState = store.setState;

    store.setState = (updater: (state: S) => S) => {
      const currentState = store.getState();
      const newState = updater(currentState);

      // Add to history
      history.splice(currentIndex + 1);
      history.push(newState);
      currentIndex = history.length - 1;

      originalSetState(updater);
    };

    // Add time travel methods
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
    store.getHistory = () => [...history];

    // Initialize history with current state
    history.push(store.getState());
    currentIndex = 0;

    return store;
  };
}

// Usage with middleware
const enhancedCounterStore = createTimeTravel()(
  createLogger('Counter')(
    createStore<CounterState, CounterActions>({ count: 0 }, (set, get) => ({
      increment: () => set((state) => ({ ...state, count: state.count + 1 })),
      decrement: () => set((state) => ({ ...state, count: state.count - 1 })),
      add: (amount: number) => set((state) => ({ ...state, count: state.count + amount })),
    })),
  ),
);

// Now you can use time travel
enhancedCounterStore.actions.increment(); // count: 1
enhancedCounterStore.actions.increment(); // count: 2
enhancedCounterStore.undo(); // count: 1
enhancedCounterStore.redo(); // count: 2
```

### 5. Store with Data Validation

```typescript
import { z } from 'zod'; // Optional: using Zod for validation

// Define validation schema
const UserSchema = z.object({
  id: z.number().positive(),
  name: z.string().min(1).max(100),
  email: z.string().email(),
  age: z.number().min(0).max(150),
});

interface ValidatedState {
  users: User[];
  validationErrors: Record<string, string[]>;
}

interface ValidatedActions {
  addUser: (user: Omit<User, 'id'>) => boolean;
  updateUser: (id: number, updates: Partial<User>) => boolean;
  deleteUser: (id: number) => void;
  clearErrors: () => void;
}

function createValidatedStore() {
  return createStore<ValidatedState, ValidatedActions>({ users: [], validationErrors: {} }, (set, get) => ({
    addUser: (userData) => {
      try {
        const newUser = UserSchema.parse({ ...userData, id: Date.now() });
        set((state) => ({
          ...state,
          users: [...state.users, newUser],
          validationErrors: {},
        }));
        return true;
      } catch (error) {
        if (error instanceof z.ZodError) {
          set((state) => ({
            ...state,
            validationErrors: {
              addUser: error.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
            },
          }));
        }
        return false;
      }
    },

    updateUser: (id, updates) => {
      const currentUser = get().users.find((u) => u.id === id);
      if (!currentUser) return false;

      try {
        const updatedUser = UserSchema.parse({ ...currentUser, ...updates });
        set((state) => ({
          ...state,
          users: state.users.map((u) => (u.id === id ? updatedUser : u)),
          validationErrors: {},
        }));
        return true;
      } catch (error) {
        if (error instanceof z.ZodError) {
          set((state) => ({
            ...state,
            validationErrors: {
              [`updateUser_${id}`]: error.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
            },
          }));
        }
        return false;
      }
    },

    deleteUser: (id) => {
      set((state) => ({
        ...state,
        users: state.users.filter((u) => u.id !== id),
      }));
    },

    clearErrors: () => {
      set((state) => ({ ...state, validationErrors: {} }));
    },
  }));
}
```

### 6. React Integration Example

```typescript
// hooks/useStore.ts
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

// Selector hook for performance optimization
export function useStoreSelector<S, A, T>(
  store: Store<S, A>,
  selector: (state: S) => T,
  deps?: unknown[]
): T {
  const [selectedState, setSelectedState] = useState(() => selector(store.getState()));

  useEffect(() => {
    const unsubscribe = store.subscribe((newState) => {
      const newSelectedState = selector(newState);
      setSelectedState(newSelectedState);
    });

    return unsubscribe;
  }, [store, selector, ...(deps || [])]);

  return selectedState;
}

// Component usage
function TodoApp() {
  const [state, actions] = useStore(todoStore);
  const visibleTodos = useStoreSelector(todoStore, todoSelectors.getVisibleTodos);
  const stats = useStoreSelector(todoStore, todoSelectors.getTodoStats);

  return (
    <div>
      <h1>Todos ({stats.active} active, {stats.completed} completed)</h1>

      <div>
        <button onClick={() => actions.setFilter('all')}>All</button>
        <button onClick={() => actions.setFilter('active')}>Active</button>
        <button onClick={() => actions.setFilter('completed')}>Completed</button>
      </div>

      {visibleTodos.map((todo) => (
        <div key={todo.id}>
          <input
            type="checkbox"
            checked={todo.completed}
            onChange={() => actions.toggleTodo(todo.id)}
          />
          <span>{todo.text}</span>
          <button onClick={() => actions.deleteTodo(todo.id)}>Delete</button>
        </div>
      ))}
    </div>
  );
}
```

## Best Practices

1. **Keep stores focused**: Each store should manage a specific domain of your application state.

2. **Use TypeScript**: Define clear interfaces for your state and actions to catch errors early.

3. **Immutable updates**: Always return new objects from your actions rather than mutating existing state.

4. **Handle loading states**: For async operations, include loading and error states in your store.

5. **Cleanup subscriptions**: Always unsubscribe from stores when components unmount or are no longer needed.

6. **Use selectors for computed values**: Create selector functions for derived data to avoid recomputing values unnecessarily.

7. **Consider persistence**: For user preferences or important data, implement persistence to localStorage or other storage mechanisms.

8. **Validate data**: Use validation libraries like Zod or custom validation logic to ensure data integrity.

For more detailed information on the design and technical requirements, please refer to the [Product Requirements Document.md](./Product%20Requirements%20Document.md).
