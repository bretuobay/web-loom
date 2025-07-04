# MVVM Web Library

A framework-agnostic web library for building robust client-side applications using the Model-View-ViewModel (MVVM) pattern. This library leverages the power of **RxJS** for reactive data flow and **Zod** for strong data validation, aiming to simplify state management and API interactions across various frontend frameworks like React, Angular, and Vue.

---

## Key Features

- **MVVM Core:** Provides `BaseModel` and `BaseViewModel` for structured application development.
- **Reactive Data Flow:** Built entirely on **RxJS**, ensuring all data, loading states, and errors are reactive observables.
- **Strong Data Validation:** Integrates **Zod** schemas for compile-time and runtime data validation.
- **RESTful API Management:** `RestfulApiModel` simplifies CRUD operations with **optimistic updates**, acting as a local data store, managing loading states, and handling errors automatically.
- **Command Pattern:** Offers a `Command` utility for encapsulating UI actions, including `canExecute` and `isExecuting` states, for clean UI-ViewModel separation. Implements `IDisposable`.
- **Observable Collections:** `ObservableCollection` provides reactive list management, notifying views of granular changes (add, remove, update) for efficient rendering.
- **Resource Management:** Core components like `BaseModel` and `Command` implement `IDisposable` for proper resource cleanup (e.g., completing RxJS Subjects), helping prevent memory leaks.
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

### 3.5. Using CachedRestfulApiModel and CachedRestfulApiViewModel (with QueryCore)

For applications requiring more sophisticated data caching, automatic refetching, and shared data states across different parts of the application, `CachedRestfulApiModel` and `CachedRestfulApiViewModel` provide an integration with the `@web-loom/query-core` library. This approach is suitable when you want QueryCore to manage the lifecycle of your data (fetching, caching, background updates) while still leveraging the MVVM pattern for your UI logic.

**a. `CachedRestfulApiModel<TData, TSchema extends ZodSchema<TData>>`**

This model acts as a bridge between your ViewModel and a `QueryCore` instance. Instead of directly fetching data, it subscribes to a specific endpoint managed by `QueryCore`.

-   **Constructor**:
    -   `queryCore: QueryCore`: An instance of `QueryCore`.
    -   `endpointKey: string`: The unique key for the data endpoint in `QueryCore`.
    -   `schema: TSchema`: The Zod schema for validating `TData`. If `TData` is an array, this schema should validate the array (e.g., `z.array(itemSchema)`).
    -   `initialData?: TData | null`: Optional initial data for the model.
    -   `fetcherFn?: () => Promise<TData>`: Optional. If provided, and the `endpointKey` is not already defined in `QueryCore`, this model will attempt to define it.
    -   `refetchAfter?: number`: Optional. If `fetcherFn` is used to define the endpoint, this sets the `refetchAfter` duration for `QueryCore`.
-   **Key Methods**:
    -   `refetch(force: boolean = false): Promise<void>`: Triggers a refetch of the data via `QueryCore`.
    -   `invalidate(): Promise<void>`: Invalidates the cached data for this endpoint in `QueryCore`.
-   **Reactive Properties (from BaseModel)**: `data$`, `isLoading$`, `error$`, `isError$`. These are updated based on the state from `QueryCore`.

**b. `CachedRestfulApiViewModel<TData, TModelSchema extends ZodSchema<TData>>`**

This ViewModel wraps a `CachedRestfulApiModel` and exposes its data and cache-related operations as commands.

-   **Constructor**:
    -   `model: ICachedRestfulApiModel<TData, TModelSchema>`: An instance of `CachedRestfulApiModel`.
-   **Key Properties**:
    -   `data$`, `isLoading$`, `error$`: Observables directly from the underlying model.
    -   `refetchCommand: Command<boolean | void, void>`: Command to trigger `model.refetch()`. Can take an optional `force` parameter.
    -   `invalidateCommand: Command<void, void>`: Command to trigger `model.invalidate()`.
    -   `selectedItem$`, `selectItem(id: string | null)`: Optional selection logic if `TData` is an array of items with an `id` property.

**c. Example Scenario**

Imagine you have a `QueryCore` instance managing user data:

```typescript
// queryCoreInstance.ts
import QueryCore from '@web-loom/query-core';

export const queryCore = new QueryCore({
  defaultRefetchAfter: 5 * 60 * 1000, // 5 minutes
});

// Define an endpoint (perhaps in a service layer)
async function fetchAllUsers(): Promise<User[]> {
  const response = await fetch('https://api.example.com/users');
  if (!response.ok) throw new Error('Failed to fetch users');
  return response.json();
}
queryCore.defineEndpoint<User[]>('allUsers', fetchAllUsers);


// user.model.ts (assuming User and UserSchema are defined as before)
import { CachedRestfulApiModel } from 'mvvm-core/CachedRestfulApiModel'; // Adjust path
import { queryCore } from './queryCoreInstance';
import { User, UserSchema } from './user.model.types'; // Assuming types are separate
import { z } from 'zod';

export class AllUsersCachedModel extends CachedRestfulApiModel<User[], z.ZodArray<typeof UserSchema>> {
  constructor() {
    super({
      queryCore: queryCore,
      endpointKey: 'allUsers',
      schema: z.array(UserSchema),
      // fetcherFn is not needed here if endpoint is already defined in QueryCore
    });
  }
}

// user.viewmodel.ts
import { CachedRestfulApiViewModel } from 'mvvm-core/CachedRestfulApiViewModel'; // Adjust path
import { AllUsersCachedModel } from './user.model';
import { User, UserSchema } from './user.model.types';
import { z } from 'zod';

export class AllUsersViewModel extends CachedRestfulApiViewModel<User[], z.ZodArray<typeof UserSchema>> {
  constructor() {
    super(new AllUsersCachedModel());
  }

  // Example: Get a specific user from the cached list
  findUserById(id: string): User | undefined {
    const users = this.model.data$.getValue(); // Access current data (careful with BehaviorSubject direct value)
    return users?.find(user => user.id === id);
  }
}
```

**Usage in a Component (Conceptual):**

A UI component would use `AllUsersViewModel`. It could bind to `data$` to display the list of users, `isLoading$` for loading indicators, and use `refetchCommand` or `invalidateCommand` to trigger cache operations. Since `QueryCore` handles the actual data fetching and caching, multiple ViewModels (or other parts of the app) connected to the same `QueryCore` endpoint (`'allUsers'`) will share the same data and state.

This approach separates the concern of data fetching and caching (handled by `QueryCore`) from the presentation logic and UI interaction patterns (handled by the MVVM classes).

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

6. Using ObservableCollection

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
