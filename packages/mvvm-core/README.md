# MVVM Web Library

A framework-agnostic web library for building robust client-side applications using the Model-View-ViewModel (MVVM) pattern. This library leverages the power of **RxJS** for reactive data flow and **Zod** for strong data validation, aiming to simplify state management and API interactions across various frontend frameworks like React, Angular, and Vue.

---

## Key Features

- **MVVM Core:** Provides `BaseModel` and `BaseViewModel` for structured application development.
- **Reactive Data Flow:** Built entirely on **RxJS**, ensuring all data, loading states, and errors are reactive observables.
- **Strong Data Validation:** Integrates **Zod** schemas for compile-time and runtime data validation.
- **RESTful API Management:** `RestfulApiModel` simplifies CRUD operations with **optimistic updates**, acting as a local data store, managing loading states, and handling errors automatically.
- **Cached RESTful API Management:** `CachedRestfulApiModel` and `CachedRestfulApiViewModel` integrate with `@packages/query-core` for robust data fetching, caching, and state synchronization, offering an alternative to `RestfulApiModel` for scenarios requiring advanced caching strategies.
- **Command Pattern:** Offers a `Command` utility for encapsulating UI actions, including `canExecute` and `isExecuting` states, for clean UI-ViewModel separation. Implements `IDisposable`.
- **Observable Collections:** `ObservableCollection` provides reactive list management, notifying views of granular changes (add, remove, update) for efficient rendering.
- **Resource Management:** Core components like `BaseModel`, `Command`, `CachedRestfulApiModel` implement `IDisposable` for proper resource cleanup (e.g., completing RxJS Subjects), helping prevent memory leaks.
- **Framework Agnostic:** Designed with no direct UI framework dependencies, allowing seamless integration with React, Angular, Vue, and others.
- **Client-Heavy App Focused:** Ideal for building complex dashboards, forms, and data-intensive single-page applications.

---

## Getting Started

### Installation

To install the library, you'll need `npm` or `yarn`.

```bash
npm install your-library-name rxjs zod
# or
yarn add your-library-name rxjs zod
```

You'll also need TypeScript configured in your project.

## Basic Usage

1. Defining a Model with Zod

```typescript
// src/models/user.model.ts
import { BaseModel } from 'mvvm-core/BaseModel'; // Adjust import path
import { z } from 'zod';

export const UserSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(3),
  email: z.string().email(),
  age: z.number().int().positive().optional(),
});

export type User = z.infer<typeof UserSchema>;

export class UserModel extends BaseModel<User, typeof UserSchema> {
  constructor(initialData?: User) {
    super({ initialData: initialData || null, schema: UserSchema });
  }
}
```

2. Creating a ViewModel

```typescript
// src/viewmodels/user.viewmodel.ts
import { BaseViewModel } from 'mvvm-core/BaseViewModel'; // Adjust import path
import { UserModel } from '../models/user.model';

export class UserViewModel extends BaseViewModel<UserModel> {
  constructor(model: UserModel) {
    super(model);
  }

  // You can add computed properties (RxJS operators) or methods here
  get displayName$() {
    return this.data$.pipe(map((user) => (user ? `User: ${user.name}` : 'No user selected')));
  }
}
```

3. Using RestfulApiModel for CRUD

The `RestfulApiModel` constructor takes an input object which, in addition to `baseUrl`, `endpoint`, `fetcher`, `schema`, and `initialData`, also accepts an optional `validateSchema` boolean (defaults to `true`). If set to `false`, Zod schema validation of the API response will be skipped.

```typescript
// src/models/user.api.model.ts
import { RestfulApiModel, Fetcher } from 'mvvm-core/RestfulApiModel'; // Adjust import path
import { User, UserSchema } from './user.model';

// Example fetcher (can be window.fetch, axios, etc.)
const myCustomFetcher: Fetcher = async (url, options) => {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response; // Return response object, RestfulApiModel will parse JSON
};

export class UserApiModels extends RestfulApiModel<User[], typeof UserSchema> {
  constructor() {
    // Assuming your API returns an array of users for the base endpoint
    super({
      baseUrl: 'https://api.yourapp.com',
      endpoint: 'users',
      fetcher: myCustomFetcher,
      schema: z.array(UserSchema), // The Zod schema for data validation (e.g., for an array of Users)
      initialData: null, // Optional initial data for the model
      validateSchema: true, // Optional: defaults to true. Set to false to skip schema validation.
    });
  }
}
```

```typescript
// Example usage in a component/service
async function loadUsers() {
  const userApi = new UserApiModels();
  userApi.data$.subscribe((users) => {
    console.log('Current users:', users);
  });
  userApi.isLoading$.subscribe((loading) => {
    console.log('Loading users:', loading);
  });
  userApi.error$.subscribe((error) => {
    if (error) console.error('Error loading users:', error);
  });

  try {
    await userApi.fetch(); // Fetches all users

    // Create example
    const newUserPayload = { name: 'New User', email: 'new@example.com' }; // No ID needed if server generates
    const createdUser = await userApi.create(newUserPayload);
    if (createdUser) {
      console.log('Created User:', createdUser); // Has server-assigned ID

      // Update example
      const updatedUser = await userApi.update(createdUser.id, { name: 'Updated User Name' });
      console.log('Updated User:', updatedUser);

      // Delete example
      if (updatedUser) {
        await userApi.delete(updatedUser.id);
        console.log('User deleted successfully.');
      }
    }
  } catch (e) {
    // Errors from create, update, delete are re-thrown after setting model.error$
    // and reverting optimistic updates.
    console.error('API operation failed:', e, userApi.error$.getValue());
  } finally {
    // It's good practice to dispose of models/commands when they are no longer needed,
    // especially if they are long-lived and manage subscriptions.
    // userApi.dispose();
  }
}
```

4. Implementing Commands

```typescript
// src/viewmodels/auth.viewmodel.ts
import { Command } from 'mvvm-core/Command'; // Adjust import path
import { BehaviorSubject } from 'rxjs';

export class AuthViewModel {
  private _isLoggedIn = new BehaviorSubject(false);
  public isLoggedIn$ = this._isLoggedIn.asObservable();

  public loginCommand: Command<string, boolean>; // param: password, result: success boolean

  constructor() {
    this.loginCommand = new Command(
      async (password: string) => {
        console.log(`Attempting login with password: ${password}`);
        // Simulate API call
        return new Promise((resolve) => {
          setTimeout(() => {
            const success = password === 'secret';
            this._isLoggedIn.next(success);
            resolve(success);
          }, 1000);
        });
      },
      // canExecute$ Observable - login is only possible if not already logged in
      this.isLoggedIn$.pipe(map((loggedIn) => !loggedIn)),
    );
  }

  // In a React/Vue/Angular component:
  // <button
  //   onClick={() => authViewModel.loginCommand.execute('myPassword')}
  //   disabled={!(await authViewModel.loginCommand.canExecute$.pipe(first()).toPromise()) || (await authViewModel.loginCommand.isExecuting$.pipe(first()).toPromise())}
  // >
  //   { (await authViewModel.loginCommand.isExecuting$.pipe(first()).toPromise()) ? 'Logging in...' : 'Login' }
  // </button>
}
```

### 5. Integrating `RestfulApiViewModel` with React

This example demonstrates how to use `RestfulApiModel` and `RestfulApiViewModel` to fetch a list of items from a fake API endpoint and display them in a simple React functional component.

**a. Define Item Schema and Type (e.g., `src/models/todo.types.ts`)**

```typescript
// src/models/todo.types.ts
import { z } from 'zod';

export const TodoSchema = z.object({
  id: z.string(),
  userId: z.number(),
  title: z.string(),
  completed: z.boolean(),
});

export type Todo = z.infer<typeof TodoSchema>;
```

**b. Create the `RestfulApiModel` (e.g., `src/models/todo.api.model.ts`)**

```typescript
// src/models/todo.api.model.ts
import { RestfulApiModel, Fetcher } from 'your-library-name/models/RestfulApiModel'; // Adjust import path
import { z } from 'zod';
import { TodoSchema, Todo } from './todo.types';

// A mock fetcher for demonstration purposes
const mockTodoFetcher: Fetcher = async (url, options) => {
  console.log(`Mock fetcher called: ${options?.method || 'GET'} ${url}`);
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  if (url.endsWith('/todos') && options?.method === 'GET') {
    const mockTodos: Todo[] = [
      { id: '1', userId: 1, title: 'Fake Todo 1 from API', completed: false },
      { id: '2', userId: 1, title: 'Fake Todo 2 from API', completed: true },
    ];
    return new Response(JSON.stringify(mockTodos), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  // Fallback for other unhandled requests by the mock
  return new Response(JSON.stringify({ message: 'Mocked endpoint not found' }), {
    status: 404,
    headers: { 'Content-Type': 'application/json' },
  });
};

export class TodoListModel extends RestfulApiModel<Todo[], z.ZodArray<typeof TodoSchema>> {
  constructor() {
    super({
      baseUrl: 'https://jsonplaceholder.typicode.com', // Using a real base URL for structure
      endpoint: 'todos', // The specific endpoint
      fetcher: mockTodoFetcher, // Our mock fetcher
      schema: z.array(TodoSchema), // Expect an array of Todos
      initialData: null, // No initial data
    });
  }
}
```

**c. Create the `RestfulApiViewModel` (e.g., `src/viewmodels/todo.viewmodel.ts`)**

```typescript
// src/viewmodels/todo.viewmodel.ts
import { RestfulApiViewModel } from 'your-library-name/viewmodels/RestfulApiViewModel'; // Adjust import path
import { TodoListModel } from '../models/todo.api.model';
import { Todo, TodoSchema } from '../models/todo.types';
import { z } from 'zod';

export class TodoViewModel extends RestfulApiViewModel<Todo[], z.ZodArray<typeof TodoSchema>> {
  constructor() {
    // Create an instance of the model
    const todoListModel = new TodoListModel();
    super(todoListModel);
  }

  // You can add specific methods or computed observables related to Todos here if needed
  // For example, a command to fetch only completed todos (would require model changes)
  // Or an observable that filters/maps the data$
}
```

**d. Create a custom hook for using RxJS Observables in React (e.g., `src/hooks/useObservable.ts`)**

This is a common pattern to bridge RxJS with React's state.

```typescript
// src/hooks/useObservable.ts
import { useState, useEffect } from 'react';
import { Observable } from 'rxjs';

export function useObservable<T>(observable: Observable<T>, initialValue: T): T {
  const [value, setValue] = useState<T>(initialValue);

  useEffect(() => {
    const subscription = observable.subscribe(setValue);
    return () => subscription.unsubscribe();
  }, [observable]);

  return value;
}
```

_Note: For more complex scenarios or production apps, consider robust libraries like `rxjs-hooks`._

**e. Create the React Component (e.g., `src/components/TodoList.tsx`)**

```tsx
// src/components/TodoList.tsx
import React, { useMemo, useEffect } from 'react';
import { TodoViewModel } from '../viewmodels/todo.viewmodel'; // Adjust path
import { useObservable } from '../hooks/useObservable'; // Adjust path
import { Todo } from '../models/todo.types'; // Adjust path

const TodoListComponent: React.FC = () => {
  // Instantiate the ViewModel. In a real app, you might use a context or DI.
  const todoViewModel = useMemo(() => new TodoViewModel(), []);

  // Subscribe to the ViewModel's observables
  const todos = useObservable(todoViewModel.data$, null);
  const isLoading = useObservable(todoViewModel.isLoading$, false);
  const error = useObservable(todoViewModel.error$, null);

  // Clean up the ViewModel when the component unmounts
  useEffect(() => {
    return () => {
      todoViewModel.dispose();
    };
  }, [todoViewModel]);

  const handleFetchTodos = () => {
    todoViewModel.fetchCommand.execute();
  };

  return (
    <div>
      <h2>Todo List (React Example)</h2>
      <button onClick={handleFetchTodos} disabled={isLoading}>
        {isLoading ? 'Loading...' : 'Fetch Todos'}
      </button>

      {error && <p style={{ color: 'red' }}>Error: {error.message || 'Failed to fetch'}</p>}

      {isLoading && !todos && <p>Loading todos...</p>}

      {todos && todos.length > 0 && (
        <ul>
          {todos.map((todo: Todo) => (
            <li key={todo.id} style={{ textDecoration: todo.completed ? 'line-through' : 'none' }}>
              {todo.title} (User ID: {todo.userId})
            </li>
          ))}
        </ul>
      )}

      {!isLoading && todos && todos.length === 0 && <p>No todos found.</p>}
    </div>
  );
};

export default TodoListComponent;
```

This example provides a complete, albeit simplified, flow from defining data structures and models to consuming them in a React UI. Remember to adjust import paths (`your-library-name`) as per your actual library's name and structure.

### 6. Using `CachedRestfulApiModel` and `CachedRestfulApiViewModel` with `QueryCore`

This section outlines how to use `CachedRestfulApiModel` and `CachedRestfulApiViewModel` which integrate with the `@packages/query-core` library for managing data fetching and caching. This provides an alternative to `RestfulApiModel` when more advanced caching, automatic refetching, and shared data states are needed.

**a. Install `@packages/query-core`**

Ensure `@packages/query-core` is installed in your project (if it's a local package, ensure your build system resolves it, or install it from npm if published).

```bash
npm install @packages/query-core # or appropriate local path setup
```

**b. Initialize `QueryCore`**

Typically, you'd have a singleton instance of `QueryCore` in your application.

```typescript
// src/services/queryClient.ts
import QueryCore from '@packages/query-core';

export const queryClient = new QueryCore({
  // Global options for QueryCore, e.g.:
  // defaultRefetchAfter: 5 * 60 * 1000, // 5 minutes
  // cacheProvider: 'localStorage',
});
```

**c. Define your Data Schema and Types (similar to `RestfulApiModel`)**

Let's reuse the `Todo` example.

```typescript
// src/models/todo.types.ts (as before)
import { z } from 'zod';

export const TodoSchema = z.object({
  id: z.string(),
  userId: z.number(),
  title: z.string(),
  completed: z.boolean(),
});
export type Todo = z.infer<typeof TodoSchema>;

export const TodoArraySchema = z.array(TodoSchema);
export type TodoArray = z.infer<typeof TodoArraySchema>;
```

**d. Define the Fetcher Function for `QueryCore`**

`QueryCore` endpoints require a fetcher function.

```typescript
// src/api/todoApi.ts
import { TodoArray } from '../models/todo.types';

// This fetcher will be used by QueryCore
export async function fetchTodosApi(): Promise<TodoArray> {
  const response = await fetch('https://jsonplaceholder.typicode.com/todos');
  if (!response.ok) {
    throw new Error('Failed to fetch todos');
  }
  return response.json();
}

// Fetcher for CUD operations (if needed by CachedRestfulApiModel directly)
// This is the same generic fetcher used by RestfulApiModel
import { Fetcher } from 'your-library-name'; // or 'mvvm-core'

export const genericCudFetcher: Fetcher = async (url, options) => {
  const response = await fetch(url, options);
  if (!response.ok) {
    // Attempt to parse error message from server if JSON
    let errorPayload: any = { message: `HTTP error! status: ${response.status}` };
    try {
      const errorData = await response.json();
      errorPayload = errorData;
    } catch (e) {
      // Not a JSON error response, stick to default
    }
    throw errorPayload; // Throwing an object can be more structured
  }
  // For POST/PUT, API might return the created/updated entity or just status 200/201/204
  // RestfulApiModel/CachedRestfulApiModel's CUD methods expect the data back or handle no content
  if (response.status === 204) { // No Content
    return undefined;
  }
  // Check content type before parsing if possible, or rely on try-catch in model
  return response.json();
};
```

**e. Define the `QueryCore` Endpoint**

Before creating `CachedRestfulApiModel`, define the endpoint in `QueryCore`.

```typescript
// src/services/queryClient.ts (continued)
import { queryClient } from './queryClient';
import { fetchTodosApi } from '../api/todoApi';
import { TodoArraySchema } } from '../models/todo.types'; // For potential server-side schema validation if QueryCore supported it

const TODOS_ENDPOINT_KEY = 'todos';

queryClient.defineEndpoint(
  TODOS_ENDPOINT_KEY,
  fetchTodosApi,
  {
    // Endpoint-specific options for QueryCore if needed
    // refetchAfter: 10 * 60 * 1000, // 10 minutes
  }
);
```

**f. Create `CachedRestfulApiModel`**

```typescript
// src/models/cachedTodo.model.ts
import { CachedRestfulApiModel, TCachedConstructorInput } from 'your-library-name'; // Adjust path
import { TodoArray, TodoArraySchema } from './todo.types';
import { queryClient } from '../services/queryClient'; // Your QueryCore instance
import { genericCudFetcher } from '../api/todoApi'; // Fetcher for CUD

const TODOS_ENDPOINT_KEY = 'todos'; // Must match the key used in defineEndpoint

export class CachedTodoListModel extends CachedRestfulApiModel<TodoArray, typeof TodoArraySchema> {
  constructor(input?: Partial<TCachedConstructorInput<TodoArray, typeof TodoArraySchema>>) {
    super({
      queryCore: queryClient,
      endpointKey: TODOS_ENDPOINT_KEY,
      schema: TodoArraySchema,
      // For CUD operations, provide baseUrl, endpoint, and a fetcher
      // These are NOT used for the primary 'query' operation, which QueryCore handles.
      baseUrl: 'https://jsonplaceholder.typicode.com', // Base for CUD URLs
      endpoint: 'todos', // Endpoint for CUD URLs
      fetcher: genericCudFetcher, // Fetcher for POST, PUT, DELETE
      initialData: null,
      validateSchema: true,
      ...input,
    });
  }
}
```

**g. Create `CachedRestfulApiViewModel`**

```typescript
// src/viewmodels/cachedTodo.viewmodel.ts
import { CachedRestfulApiViewModel } from 'your-library-name'; // Adjust path
import { CachedTodoListModel } from '../models/cachedTodo.model';
import { TodoArray, TodoArraySchema } from '../models/todo.types';

export class CachedTodoViewModel extends CachedRestfulApiViewModel<TodoArray, typeof TodoArraySchema> {
  constructor() {
    const cachedModel = new CachedTodoListModel();
    super(cachedModel);
  }

  // Add any Todo-specific view logic or commands here
}
```

**h. Use in a React Component (Example)**

This would be similar to the `RestfulApiViewModel` example, but using `CachedTodoViewModel`.

```tsx
// src/components/CachedTodoList.tsx
import React, { useMemo, useEffect } from 'react';
import { CachedTodoViewModel } from '../viewmodels/cachedTodo.viewmodel'; // Adjust path
import { useObservable } from '../hooks/useObservable'; // Adjust path (shared hook)
import { Todo } from '../models/todo.types'; // Adjust path

const CachedTodoListComponent: React.FC = () => {
  const cachedTodoViewModel = useMemo(() => new CachedTodoViewModel(), []);

  const todos = useObservable(cachedTodoViewModel.data$, null);
  const isLoading = useObservable(cachedTodoViewModel.isLoading$, false);
  const error = useObservable(cachedTodoViewModel.error$, null);

  useEffect(() => {
    // Initial fetch (QueryCore might fetch automatically on subscribe based on its config)
    // Explicitly calling query() can be done if needed, e.g., to force a refresh.
    // cachedTodoViewModel.queryCommand.execute(); // Or execute(true) to force
    return () => {
      cachedTodoViewModel.dispose();
    };
  }, [cachedTodoViewModel]);

  const handleQueryTodos = (forceRefetch: boolean = false) => {
    cachedTodoViewModel.queryCommand.execute(forceRefetch);
  };

  const handleCreateTodo = async () => {
    try {
      // Type assertion for simplicity; in a real app, this would come from a form
      await cachedTodoViewModel.createCommand.execute({ title: 'New Cached Todo', completed: false, userId: 1 } as Partial<Todo>);
      // QueryCore will be invalidated and refetched by the model, updating the view.
    } catch (e) {
      console.error("Failed to create cached todo", e);
      // Error is also available on cachedTodoViewModel.error$
    }
  };

  // ... similar handlers for update and delete ...

  return (
    <div>
      <h2>Cached Todo List (React Example with QueryCore)</h2>
      <button onClick={() => handleQueryTodos()} disabled={isLoading}>
        {isLoading ? 'Loading...' : 'Query Todos'}
      </button>
      <button onClick={() => handleQueryTodos(true)} disabled={isLoading}>
        Force Refetch Todos
      </button>
      <button onClick={handleCreateTodo} disabled={isLoading}>
        Add Test Todo
      </button>

      {error && <p style={{ color: 'red' }}>Error: {error.message || JSON.stringify(error)}</p>}
      {isLoading && !todos && <p>Loading todos...</p>}

      {todos && todos.length > 0 && (
        <ul>
          {todos.map((todo: Todo) => (
            <li key={todo.id} style={{ textDecoration: todo.completed ? 'line-through' : 'none' }}>
              {todo.title} (ID: {todo.id})
              {/* Add update/delete buttons here, calling respective commands */}
            </li>
          ))}
        </ul>
      )}
      {!isLoading && todos && todos.length === 0 && <p>No todos found.</p>}
    </div>
  );
};

export default CachedTodoListComponent;
```

This setup leverages `QueryCore` for fetching and caching the primary list of todos. CUD operations in `CachedRestfulApiModel` are shown making direct calls (potentially using a different fetcher if the main `QueryCore` fetcher is only for GET) and then invalidating the `QueryCore` cache to trigger data refresh.

7. Using ObservableCollection

```typescript
// src/viewmodels/todos.viewmodel.ts
import { ObservableCollection } from 'mvvm-cores/ObservableCollection'; // Adjust import path
import { map } from 'rxjs/operators';

interface Todo {
  id: string;
  text: string;
  completed: boolean;
}

export class TodosViewModel {
  public todos: ObservableCollection<Todo>;

  constructor() {
    this.todos = new ObservableCollection([
      { id: '1', text: 'Learn MVVM', completed: false },
      { id: '2', text: 'Build awesome app', completed: true },
    ]);
  }

  addTodo(text: string) {
    const newTodo: Todo = { id: Date.now().toString(), text, completed: false };
    this.todos.add(newTodo);
  }

  toggleTodo(id: string) {
    this.todos.update((todo) => todo.id === id, {
      ...this.todos.toArray().find((t) => t.id === id)!,
      completed: !this.todos.toArray().find((t) => t.id === id)!.completed,
    });
  }

  removeCompleted() {
    this.todos.remove((todo) => todo.completed);
  }

  // In a React/Vue/Angular component:
  // <ul *ngIf="todos.items$ | async as todoList">
  //   <li *ngFor="let todo of todoList">
  //     {{ todo.text }} ({{ todo.completed ? 'Completed' : 'Pending' }})
  //   </li>
  // </ul>
}

---

## Test Suite Status and Known Issues

The library includes a suite of unit tests built with Vitest. As of the latest updates:

-   **`NotificationService`**: All tests are passing. Issues related to RxJS timer interactions and observable emissions during dismissal and auto-dismissal have been resolved.
-   **`QueryableCollectionViewModel`**: A significant number of tests related to pagination, filtering, sorting, and item manipulation are currently skipped. These tests consistently timed out due to unresolved complexities in testing RxJS streams involving `debounceTime`, `combineLatest`, and `startWith` operators within the Vitest fake timer environment. Further investigation, potentially using `rxjs/testing TestScheduler` for more precise control over RxJS schedulers, is recommended to enable these tests.
-   **`FormViewModel`**: Similar to `QueryableCollectionViewModel`, several tests related to debounced validation logic (affecting `isValid$`, `errors$`, and `fieldErrors$` observables) are currently skipped due to timeouts in the fake timer environment. These also require further investigation, possibly with `TestScheduler`.

The remaining tests for other components and utilities in the library are generally passing. Efforts are ongoing to improve test coverage and reliability.
```
