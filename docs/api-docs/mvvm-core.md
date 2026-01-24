# @web-loom/mvvm-core API Documentation

## Table of Contents

1. [Overview](#overview)
2. [Installation](#installation)
3. [Core Concepts](#core-concepts)
4. [Complete API Reference](#complete-api-reference)
5. [Framework Integration](#framework-integration)
6. [Usage Examples](#usage-examples)
7. [Best Practices](#best-practices)
8. [TypeScript Types](#typescript-types)
9. [Common Patterns](#common-patterns)
10. [Testing Guide](#testing-guide)

---

## Overview

`@web-loom/mvvm-core` is a comprehensive, framework-agnostic MVVM (Model-View-ViewModel) library built on RxJS and Zod. It provides a complete architecture for building reactive web applications with clear separation of concerns, type-safe validation, and powerful state management capabilities.

### Key Features

- **Complete MVVM Pattern**: BaseModel, BaseViewModel, RestfulApiModel with clear separation
- **Reactive Data Flow**: RxJS-powered observables for data$, isLoading$, error$
- **Type-Safe Validation**: Zod schema validation at compile-time and runtime
- **RESTful API Integration**: Simplified CRUD with optimistic updates and auto state management
- **Command Pattern**: Encapsulated UI actions with canExecute and isExecuting states
- **Observable Collections**: Reactive lists with granular change notifications
- **Query Integration**: QueryStateModel for advanced caching with @web-loom/query-core
- **Resource Management**: IDisposable pattern for proper cleanup
- **Framework Agnostic**: Works with React, Vue, Angular, and vanilla JavaScript

### Architecture Overview

```
┌─────────────────────────────────────────────────┐
│                    View Layer                    │
│         (React, Vue, Angular, Vanilla)          │
└──────────────────┬──────────────────────────────┘
                   │ subscribes to observables
                   ▼
┌─────────────────────────────────────────────────┐
│                  ViewModel Layer                 │
│    (Business Logic, Commands, Computed State)   │
└──────────────────┬──────────────────────────────┘
                   │ uses
                   ▼
┌─────────────────────────────────────────────────┐
│                   Model Layer                    │
│      (Data State, API Calls, Validation)        │
└──────────────────┬──────────────────────────────┘
                   │ calls
                   ▼
┌─────────────────────────────────────────────────┐
│              Infrastructure Layer                │
│        (HTTP, Storage, Query Cache, etc.)       │
└─────────────────────────────────────────────────┘
```

---

## Installation

```bash
# npm
npm install @web-loom/mvvm-core rxjs zod

# yarn
yarn add @web-loom/mvvm-core rxjs zod

# pnpm
pnpm add @web-loom/mvvm-core rxjs zod
```

### Peer Dependencies

- **rxjs**: ^7.8.2 or higher - Reactive programming library
- **zod**: ^3.25.0 or higher - Schema validation library
- **@web-loom/query-core**: 0.0.3+ (optional) - For QueryStateModel integration

---

## Core Concepts

### 1. BaseModel

The foundation for all models, providing reactive state management with RxJS observables.

**Purpose**: Manage data state, loading states, and error states in a reactive way.

**Key Features**:
- Reactive state with BehaviorSubjects
- Zod schema validation
- Type-safe data management
- Built-in error handling
- IDisposable for cleanup

### 2. RestfulApiModel

Extends BaseModel with CRUD operations and optimistic updates for RESTful APIs.

**Purpose**: Simplify API interactions with automatic state management.

**Key Features**:
- Automatic loading state management
- Optimistic updates with rollback
- Error handling with retry logic
- Built-in validation
- RESTful operations (GET, POST, PUT, DELETE)

### 3. BaseViewModel

Connects Models to Views with presentation logic and computed observables.

**Purpose**: Transform model data for display and handle UI interactions.

**Key Features**:
- Observable-based state
- Computed properties with RxJS operators
- Separation from UI framework
- Resource cleanup via dispose()

### 4. RestfulApiViewModel

Extends BaseViewModel with built-in CRUD commands for RESTful operations.

**Purpose**: Provide ready-to-use commands for common API operations.

**Key Features**:
- Pre-built CRUD commands
- Automatic command state management
- Command execution control
- Error handling built-in

### 5. Command Pattern

Encapsulates UI actions with execution control and state tracking.

**Purpose**: Decouple UI actions from business logic with reactive state.

**Key Features**:
- isExecuting$ observable for loading states
- canExecute$ for conditional execution
- result$ for command results
- Error handling and propagation
- Async operation support

### 6. ObservableCollection

Reactive collection with granular change notifications.

**Purpose**: Manage lists with reactive updates for each modification.

**Key Features**:
- items$ observable for the entire collection
- changes$ observable for individual changes
- Array-like manipulation methods
- Query and filter support
- Type-safe operations

---

## Complete API Reference

### BaseModel<TData, TSchema>

The foundation class for all models providing reactive state management.

#### Constructor

```typescript
constructor(config: BaseModelConfig<TData, TSchema>)
```

**Parameters**:
- `config.initialData: TData | null` - Initial data for the model
- `config.schema?: TSchema` - Zod schema for validation

#### Properties

```typescript
// Observable state
readonly data$: BehaviorSubject<TData | null>
readonly isLoading$: BehaviorSubject<boolean>
readonly error$: BehaviorSubject<Error | null>
readonly isError$: Observable<boolean> // Computed from error$

// Protected schema
protected schema?: TSchema
```

#### Methods

##### setData(data: TData | null): void

Sets the model's data and validates it against the schema.

```typescript
model.setData({ id: '123', name: 'John Doe' });
```

**Behavior**:
- Validates data against schema if provided
- Updates data$ BehaviorSubject
- Throws ValidationError on schema mismatch

##### setLoading(loading: boolean): void

Sets the loading state.

```typescript
model.setLoading(true);
// Perform async operation
model.setLoading(false);
```

##### setError(error: Error | null): void

Sets the error state.

```typescript
try {
  await fetchData();
} catch (err) {
  model.setError(err as Error);
}
```

##### getState(): ModelState<TData>

Returns a snapshot of the current state.

```typescript
const state = model.getState();
// { data: {...}, isLoading: false, error: null, isError: false }
```

**Returns**: `ModelState<TData>`
```typescript
interface ModelState<TData> {
  data: TData | null;
  isLoading: boolean;
  error: Error | null;
  isError: boolean;
}
```

##### validate(data: TData): boolean

Validates data against the schema without setting it.

```typescript
const isValid = model.validate(userData);
if (!isValid) {
  console.error('Invalid user data');
}
```

##### dispose(): void

Cleans up all subscriptions and resources.

```typescript
// Always call in cleanup
model.dispose();
```

---

### RestfulApiModel<TData, TSchema>

Extends BaseModel with RESTful CRUD operations and optimistic updates.

#### Constructor

```typescript
constructor(config: RestfulApiModelConfig<TData, TSchema>)
```

**Parameters**:
- `config.baseUrl: string` - Base URL for API endpoints
- `config.endpoint: string` - Specific endpoint path
- `config.fetcher: Fetcher` - Function to make HTTP requests
- `config.schema: TSchema` - Zod schema for validation
- `config.initialData: TData | null` - Initial data

**Fetcher Type**:
```typescript
type Fetcher = (url: string, options?: RequestInit) => Promise<Response>;
```

#### Methods

##### fetch(): Promise<TData>

Fetches data from the API endpoint.

```typescript
const data = await model.fetch();
```

**Behavior**:
- Sets isLoading$ to true
- Makes GET request to `${baseUrl}/${endpoint}`
- Validates response with schema
- Updates data$ on success
- Sets error$ on failure
- Returns fetched data

**Throws**: Error if fetch fails or validation fails

##### create(data: Partial<TData>): Promise<TData | null>

Creates a new resource with optimistic updates.

```typescript
const newUser = await model.create({
  name: 'Jane Doe',
  email: 'jane@example.com'
});
```

**Behavior**:
- Optimistically adds data to current state
- Makes POST request
- Rolls back on failure
- Returns created resource

##### update(id: string, data: Partial<TData>): Promise<TData | null>

Updates an existing resource with optimistic updates.

```typescript
await model.update('user-123', { name: 'Updated Name' });
```

**Behavior**:
- Optimistically updates data in current state
- Makes PUT/PATCH request
- Rolls back on failure
- Returns updated resource

##### delete(id: string): Promise<void>

Deletes a resource with optimistic updates.

```typescript
await model.delete('user-123');
```

**Behavior**:
- Optimistically removes from current state
- Makes DELETE request
- Rolls back on failure

---

### BaseViewModel<TModel>

Base class for ViewModels that connect Models to Views.

#### Constructor

```typescript
constructor(model: TModel)
```

**Parameters**:
- `model: TModel` - The model instance to wrap

#### Properties

```typescript
// Exposed observables from model
readonly data$: Observable<TData | null>
readonly isLoading$: Observable<boolean>
readonly error$: Observable<Error | null>

// Protected model reference
protected model: TModel
```

#### Methods

##### getState(): ModelState<TData>

Returns current state snapshot from the model.

```typescript
const state = viewModel.getState();
```

##### dispose(): void

Disposes the ViewModel and underlying model.

```typescript
useEffect(() => {
  return () => viewModel.dispose();
}, []);
```

#### Creating Computed Observables

Use RxJS operators to create derived state:

```typescript
class UserViewModel extends BaseViewModel<UserModel> {
  // Computed property
  get displayName$(): Observable<string> {
    return this.data$.pipe(
      map(user => user ? `${user.firstName} ${user.lastName}` : 'Unknown')
    );
  }

  // Filtered list
  get activeUsers$(): Observable<User[]> {
    return this.data$.pipe(
      map(users => users?.filter(u => u.active) || [])
    );
  }
}
```

---

### RestfulApiViewModel<TData, TSchema>

Extends BaseViewModel with built-in CRUD commands.

#### Constructor

```typescript
constructor(model: RestfulApiModel<TData, TSchema>)
```

#### Properties

```typescript
// Inherited from BaseViewModel
readonly data$: Observable<TData | null>
readonly isLoading$: Observable<boolean>
readonly error$: Observable<Error | null>

// CRUD Commands
readonly fetchCommand: Command<void, TData>
readonly createCommand: Command<Partial<TData>, TData | null>
readonly updateCommand: Command<{ id: string; data: Partial<TData> }, TData | null>
readonly deleteCommand: Command<string, void>
```

#### Command Usage

```typescript
// Fetch data
await viewModel.fetchCommand.execute();

// Create resource
await viewModel.createCommand.execute({ name: 'New Item' });

// Update resource
await viewModel.updateCommand.execute({
  id: '123',
  data: { name: 'Updated' }
});

// Delete resource
await viewModel.deleteCommand.execute('123');
```

---

### Command<TParam, TResult>

Encapsulates an executable action with state tracking.

#### Constructor

```typescript
constructor(
  execute: (param: TParam) => Promise<TResult>,
  canExecute$?: Observable<boolean>
)
```

**Parameters**:
- `execute: (param: TParam) => Promise<TResult>` - Async function to execute
- `canExecute$?: Observable<boolean>` - Optional observable to control execution

#### Properties

```typescript
readonly isExecuting$: Observable<boolean>  // True during execution
readonly canExecute$: Observable<boolean>   // True when command can execute
readonly result$: Observable<TResult>       // Last execution result
readonly error$: Observable<Error | null>   // Last execution error
```

#### Methods

##### execute(param?: TParam): Promise<TResult>

Executes the command with the given parameter.

```typescript
const result = await command.execute(param);
```

**Behavior**:
- Checks canExecute$ before running
- Sets isExecuting$ to true
- Executes the function
- Updates result$ or error$
- Sets isExecuting$ to false

**Throws**: Error if canExecute$ is false or execution fails

##### dispose(): void

Cleans up command resources.

```typescript
command.dispose();
```

#### Example: Login Command

```typescript
class AuthViewModel {
  private _isLoggedIn = new BehaviorSubject(false);
  readonly isLoggedIn$ = this._isLoggedIn.asObservable();

  readonly loginCommand: Command<Credentials, boolean>;

  constructor(private authService: AuthService) {
    this.loginCommand = new Command(
      async (credentials: Credentials) => {
        const success = await this.authService.login(credentials);
        this._isLoggedIn.next(success);
        return success;
      },
      // Can only login when not already logged in
      this.isLoggedIn$.pipe(map(loggedIn => !loggedIn))
    );
  }
}

// Usage
await authViewModel.loginCommand.execute({
  username: 'user',
  password: 'pass'
});
```

---

### ObservableCollection<T>

Reactive collection with granular change notifications.

#### Constructor

```typescript
constructor(initialItems: T[] = [])
```

#### Properties

```typescript
readonly items$: BehaviorSubject<T[]>      // Current items
readonly changes$: Subject<CollectionChange<T>>  // Individual changes
```

**CollectionChange<T>**:
```typescript
type CollectionChange<T> =
  | { type: 'add'; item: T }
  | { type: 'remove'; item: T }
  | { type: 'update'; oldItem: T; newItem: T }
  | { type: 'clear' };
```

#### Methods

##### add(item: T): void

Adds an item to the collection.

```typescript
collection.add({ id: '1', name: 'Item 1' });
```

##### remove(predicate: (item: T) => boolean): void

Removes items matching the predicate.

```typescript
collection.remove(item => item.id === '1');
```

##### update(predicate: (item: T) => boolean, updater: (item: T) => T): void

Updates items matching the predicate.

```typescript
collection.update(
  item => item.id === '1',
  item => ({ ...item, name: 'Updated' })
);
```

##### clear(): void

Clears all items.

```typescript
collection.clear();
```

##### toArray(): T[]

Returns a snapshot of current items.

```typescript
const items = collection.toArray();
```

##### count(): number

Returns the number of items.

```typescript
const total = collection.count();
```

##### find(predicate: (item: T) => boolean): T | undefined

Finds the first matching item.

```typescript
const item = collection.find(item => item.id === '1');
```

##### filter(predicate: (item: T) => boolean): T[]

Returns filtered items.

```typescript
const active = collection.filter(item => item.active);
```

#### Example: Todo List

```typescript
interface Todo {
  id: string;
  text: string;
  completed: boolean;
}

const todos = new ObservableCollection<Todo>();

// Subscribe to changes
todos.changes$.subscribe(change => {
  console.log('Change:', change);
});

// Add todo
todos.add({ id: '1', text: 'Learn MVVM', completed: false });

// Update todo
todos.update(
  todo => todo.id === '1',
  todo => ({ ...todo, completed: true })
);

// Remove completed
todos.remove(todo => todo.completed);
```

---

### QueryStateModel<TData, TSchema>

Integrates with @web-loom/query-core for advanced caching and data fetching.

#### Constructor

```typescript
constructor(config: QueryStateModelConfig<TData, TSchema>)
```

**Parameters**:
- `config.queryCore: QueryCore` - QueryCore instance
- `config.endpointKey: string` - Endpoint key in QueryCore
- `config.schema: TSchema` - Zod schema for validation

#### Properties

```typescript
readonly data$: BehaviorSubject<TData | null>
readonly isLoading$: BehaviorSubject<boolean>
readonly error$: BehaviorSubject<Error | null>
readonly lastUpdated$: BehaviorSubject<number | undefined>
```

#### Methods

##### refetch(forceRefetch: boolean = false): Promise<void>

Refetches data from the endpoint.

```typescript
await model.refetch(true); // Force refetch
```

##### invalidate(): Promise<void>

Invalidates the cached data.

```typescript
await model.invalidate();
```

#### Example: Cached User List

```typescript
import { QueryStateModel } from '@web-loom/mvvm-core';
import QueryCore from '@web-loom/query-core';
import { z } from 'zod';

const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email()
});

type User = z.infer<typeof UserSchema>;

// Setup QueryCore
const queryCore = new QueryCore({
  defaultRefetchAfter: 5 * 60 * 1000 // 5 minutes
});

await queryCore.defineEndpoint<User[]>('users', async () => {
  const res = await fetch('/api/users');
  return res.json();
});

// Create model
class UsersQueryModel extends QueryStateModel<User[], typeof UserSchema> {
  constructor() {
    super({
      queryCore,
      endpointKey: 'users',
      schema: z.array(UserSchema)
    });
  }
}
```

---

### QueryStateModelView<TData, TSchema>

ViewModel for QueryStateModel with refetch and invalidate commands.

#### Constructor

```typescript
constructor(model: QueryStateModel<TData, TSchema>)
```

#### Properties

```typescript
// Inherited observables
readonly data$: Observable<TData | null>
readonly isLoading$: Observable<boolean>
readonly error$: Observable<Error | null>
readonly lastUpdated$: Observable<number | undefined>

// Commands
readonly refetchCommand: Command<boolean, void>
readonly invalidateCommand: Command<void, void>
```

#### Example Usage

```typescript
class UsersViewModel extends QueryStateModelView<User[], typeof UserSchema> {
  constructor() {
    super(new UsersQueryModel());
  }

  // Computed property
  get activeUsers$(): Observable<User[]> {
    return this.data$.pipe(
      map(users => users?.filter(u => u.active) || [])
    );
  }
}

// In component
const vm = new UsersViewModel();

// Refetch data
await vm.refetchCommand.execute(true);

// Invalidate cache
await vm.invalidateCommand.execute();
```

---

### FormViewModel

Manages form state with validation, dirty tracking, and submission.

#### Constructor

```typescript
constructor(config: FormViewModelConfig<TValues>)
```

**Parameters**:
- `config.initialValues: TValues` - Initial form values
- `config.validationSchema?: ZodSchema` - Zod schema for validation
- `config.validateOnChange?: boolean` - Validate on each change (default: false)
- `config.validateOnBlur?: boolean` - Validate on blur (default: true)
- `config.onSubmit?: (values: TValues) => Promise<void>` - Submit handler

#### Properties

```typescript
readonly values$: BehaviorSubject<TValues>
readonly errors$: BehaviorSubject<Record<string, string>>
readonly touched$: BehaviorSubject<Record<string, boolean>>
readonly isValid$: Observable<boolean>
readonly isDirty$: Observable<boolean>
readonly isSubmitting$: BehaviorSubject<boolean>

readonly submitCommand: Command<void, void>
```

#### Methods

##### setFieldValue<K extends keyof TValues>(field: K, value: TValues[K]): void

Sets a field value and optionally validates.

```typescript
formVm.setFieldValue('email', 'user@example.com');
```

##### setFieldError(field: string, error: string): void

Sets an error for a field.

```typescript
formVm.setFieldError('email', 'Email already exists');
```

##### setFieldTouched(field: string, touched: boolean = true): void

Marks a field as touched.

```typescript
formVm.setFieldTouched('email');
```

##### resetForm(): void

Resets form to initial values.

```typescript
formVm.resetForm();
```

##### validateField(field: string): boolean

Validates a single field.

```typescript
const isValid = formVm.validateField('email');
```

##### validateForm(): boolean

Validates the entire form.

```typescript
const isValid = formVm.validateForm();
```

#### Example: Login Form

```typescript
import { FormViewModel } from '@web-loom/mvvm-core';
import { z } from 'zod';

const LoginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters')
});

type LoginValues = z.infer<typeof LoginSchema>;

class LoginFormViewModel extends FormViewModel<LoginValues> {
  constructor() {
    super({
      initialValues: { email: '', password: '' },
      validationSchema: LoginSchema,
      validateOnChange: true,
      onSubmit: async (values) => {
        // Handle login
        await authService.login(values);
      }
    });
  }
}

// Usage
const formVm = new LoginFormViewModel();

// Set values
formVm.setFieldValue('email', 'user@example.com');
formVm.setFieldValue('password', 'password123');

// Submit
await formVm.submitCommand.execute();
```

---

### QueryableCollectionViewModel

Advanced list management with filtering, sorting, and pagination.

#### Constructor

```typescript
constructor(config: QueryableCollectionConfig<T>)
```

**Parameters**:
- `config.items: T[]` - Initial items
- `config.pageSize?: number` - Items per page (default: 10)

#### Properties

```typescript
readonly items$: BehaviorSubject<T[]>
readonly filteredItems$: Observable<T[]>
readonly currentPage$: Observable<T[]>
readonly totalPages$: Observable<number>
readonly currentPageIndex$: BehaviorSubject<number>
readonly filter$: BehaviorSubject<(item: T) => boolean>
readonly sortBy$: BehaviorSubject<SortConfig<T> | null>
```

#### Methods

##### setFilter(predicate: (item: T) => boolean): void

Sets the filter predicate.

```typescript
vm.setFilter(item => item.active);
```

##### setSortBy(field: keyof T, order: 'asc' | 'desc' = 'asc'): void

Sets sorting configuration.

```typescript
vm.setSortBy('name', 'asc');
```

##### goToPage(index: number): void

Navigates to a specific page.

```typescript
vm.goToPage(2);
```

##### nextPage(): void

Navigates to the next page.

```typescript
vm.nextPage();
```

##### previousPage(): void

Navigates to the previous page.

```typescript
vm.previousPage();
```

#### Example: Product List

```typescript
interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  active: boolean;
}

const vm = new QueryableCollectionViewModel<Product>({
  items: products,
  pageSize: 20
});

// Filter by category
vm.setFilter(product => product.category === 'Electronics');

// Sort by price
vm.setSortBy('price', 'desc');

// Subscribe to current page
vm.currentPage$.subscribe(items => {
  console.log('Current page:', items);
});

// Navigate
vm.nextPage();
```

---

### CompositeCommand

Manages multiple child commands and tracks their collective state.

#### Constructor

```typescript
constructor()
```

#### Properties

```typescript
readonly isExecuting$: Observable<boolean>  // True if any child is executing
readonly canExecute$: Observable<boolean>   // True if all children can execute
readonly commands: Set<Command<any, any>>   // Registered child commands
```

#### Methods

##### registerCommand(command: Command<any, any>): void

Registers a child command.

```typescript
composite.registerCommand(saveCommand);
composite.registerCommand(publishCommand);
```

##### unregisterCommand(command: Command<any, any>): void

Unregisters a child command.

```typescript
composite.unregisterCommand(saveCommand);
```

#### Example: Form with Multiple Actions

```typescript
class FormViewModel {
  saveCommand: Command<void, void>;
  publishCommand: Command<void, void>;
  deleteCommand: Command<void, void>;

  compositeCommand: CompositeCommand;

  constructor() {
    this.saveCommand = new Command(async () => {
      await this.save();
    });

    this.publishCommand = new Command(async () => {
      await this.publish();
    });

    this.deleteCommand = new Command(async () => {
      await this.delete();
    });

    // Track all commands
    this.compositeCommand = new CompositeCommand();
    this.compositeCommand.registerCommand(this.saveCommand);
    this.compositeCommand.registerCommand(this.publishCommand);
    this.compositeCommand.registerCommand(this.deleteCommand);
  }

  // Use composite state to disable UI during any operation
  get isBusy$(): Observable<boolean> {
    return this.compositeCommand.isExecuting$;
  }
}
```

---

## Framework Integration

### React Integration

#### Custom Hook: useObservable

```typescript
import { useState, useEffect } from 'react';
import { Observable } from 'rxjs';

function useObservable<T>(
  observable: Observable<T>,
  initialValue: T
): T {
  const [value, setValue] = useState<T>(initialValue);

  useEffect(() => {
    const subscription = observable.subscribe(setValue);
    return () => subscription.unsubscribe();
  }, [observable]);

  return value;
}
```

#### Custom Hook: useViewModel

```typescript
import { useMemo, useEffect } from 'react';
import { IDisposable } from '@web-loom/mvvm-core';

function useViewModel<T extends IDisposable>(
  factory: () => T
): T {
  const vm = useMemo(factory, []);

  useEffect(() => {
    return () => vm.dispose();
  }, [vm]);

  return vm;
}
```

#### Component Example

```typescript
import { FC } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
}

class UserListViewModel extends RestfulApiViewModel<User[], typeof UserSchema> {
  constructor() {
    super(new UserApiModel());
  }

  get sortedUsers$(): Observable<User[]> {
    return this.data$.pipe(
      map(users => users?.sort((a, b) => a.name.localeCompare(b.name)) || [])
    );
  }
}

const UserList: FC = () => {
  const vm = useViewModel(() => new UserListViewModel());
  const users = useObservable(vm.sortedUsers$, []);
  const isLoading = useObservable(vm.isLoading$, false);
  const error = useObservable(vm.error$, null);

  useEffect(() => {
    vm.fetchCommand.execute();
  }, [vm]);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <ul>
      {users.map(user => (
        <li key={user.id}>
          {user.name} ({user.email})
        </li>
      ))}
    </ul>
  );
};
```

---

### Vue 3 Integration

#### Composition API

```vue
<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { UserListViewModel } from './viewmodels/user-list';

const vm = new UserListViewModel();
const users = ref<User[]>([]);
const isLoading = ref(false);
const error = ref<Error | null>(null);

// Subscribe to observables
watch(() => vm.data$, (obs) => {
  const sub = obs.subscribe(data => users.value = data || []);
  onUnmounted(() => sub.unsubscribe());
}, { immediate: true });

watch(() => vm.isLoading$, (obs) => {
  const sub = obs.subscribe(loading => isLoading.value = loading);
  onUnmounted(() => sub.unsubscribe());
}, { immediate: true });

watch(() => vm.error$, (obs) => {
  const sub = obs.subscribe(err => error.value = err);
  onUnmounted(() => sub.unsubscribe());
}, { immediate: true });

onMounted(() => {
  vm.fetchCommand.execute();
});

onUnmounted(() => {
  vm.dispose();
});

const handleDelete = async (id: string) => {
  await vm.deleteCommand.execute(id);
};
</script>

<template>
  <div>
    <div v-if="isLoading">Loading...</div>
    <div v-else-if="error">Error: {{ error.message }}</div>
    <ul v-else>
      <li v-for="user in users" :key="user.id">
        {{ user.name }}
        <button @click="handleDelete(user.id)">Delete</button>
      </li>
    </ul>
  </div>
</template>
```

#### Composable Helper

```typescript
// useViewModel.ts
import { onUnmounted, Ref, ref } from 'vue';
import { Observable } from 'rxjs';
import { IDisposable } from '@web-loom/mvvm-core';

export function useViewModel<T extends IDisposable>(vm: T): T {
  onUnmounted(() => vm.dispose());
  return vm;
}

export function useObservable<T>(
  observable: Observable<T>,
  initialValue: T
): Ref<T> {
  const value = ref<T>(initialValue) as Ref<T>;

  const subscription = observable.subscribe(v => {
    value.value = v;
  });

  onUnmounted(() => subscription.unsubscribe());

  return value;
}
```

---

### Angular Integration

#### Service

```typescript
import { Injectable, OnDestroy } from '@angular/core';
import { UserListViewModel } from './viewmodels/user-list';

@Injectable()
export class UserService implements OnDestroy {
  readonly vm: UserListViewModel;

  constructor() {
    this.vm = new UserListViewModel();
  }

  ngOnDestroy(): void {
    this.vm.dispose();
  }
}
```

#### Component

```typescript
import { Component, OnInit } from '@angular/core';
import { UserService } from './user.service';

@Component({
  selector: 'app-user-list',
  template: `
    <div *ngIf="vm.isLoading$ | async">Loading...</div>
    <div *ngIf="vm.error$ | async as error">Error: {{ error.message }}</div>
    <ul *ngIf="vm.data$ | async as users">
      <li *ngFor="let user of users">
        {{ user.name }}
        <button (click)="deleteUser(user.id)">Delete</button>
      </li>
    </ul>
  `,
  providers: [UserService]
})
export class UserListComponent implements OnInit {
  constructor(public vm: UserService['vm']) {}

  ngOnInit(): void {
    this.vm.fetchCommand.execute();
  }

  deleteUser(id: string): void {
    this.vm.deleteCommand.execute(id);
  }
}
```

---

### Vanilla JavaScript Integration

```javascript
import { UserListViewModel } from './viewmodels/user-list.js';

const vm = new UserListViewModel();

// Subscribe to data
vm.data$.subscribe(users => {
  const list = document.getElementById('user-list');
  list.innerHTML = users
    ? users.map(u => `<li>${u.name}</li>`).join('')
    : '';
});

// Subscribe to loading state
vm.isLoading$.subscribe(loading => {
  document.getElementById('loader').style.display =
    loading ? 'block' : 'none';
});

// Subscribe to errors
vm.error$.subscribe(error => {
  const errorDiv = document.getElementById('error');
  errorDiv.textContent = error ? error.message : '';
});

// Fetch data on page load
window.addEventListener('DOMContentLoaded', () => {
  vm.fetchCommand.execute();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  vm.dispose();
});
```

---

## Usage Examples

### Example 1: Simple User Management

```typescript
import {
  RestfulApiModel,
  RestfulApiViewModel,
  type Fetcher
} from '@web-loom/mvvm-core';
import { z } from 'zod';

// 1. Define schema
const UserSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  email: z.string().email(),
  role: z.enum(['admin', 'user'])
});

type User = z.infer<typeof UserSchema>;

// 2. Create fetcher
const fetcher: Fetcher = async (url, options) => {
  const response = await fetch(url, options);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response;
};

// 3. Create model
class UserModel extends RestfulApiModel<User[], typeof UserSchema> {
  constructor() {
    super({
      baseUrl: 'https://api.example.com',
      endpoint: 'users',
      fetcher,
      schema: z.array(UserSchema),
      initialData: null
    });
  }
}

// 4. Create ViewModel
class UserViewModel extends RestfulApiViewModel<User[], typeof UserSchema> {
  constructor() {
    super(new UserModel());
  }

  // Computed property
  get adminUsers$(): Observable<User[]> {
    return this.data$.pipe(
      map(users => users?.filter(u => u.role === 'admin') || [])
    );
  }

  // Custom method
  async promoteToAdmin(userId: string): Promise<void> {
    await this.updateCommand.execute({
      id: userId,
      data: { role: 'admin' }
    });
  }
}

// 5. Use in UI
const vm = new UserViewModel();
await vm.fetchCommand.execute();

vm.adminUsers$.subscribe(admins => {
  console.log('Admin users:', admins);
});

await vm.promoteToAdmin('user-123');
```

---

### Example 2: Form with Validation

```typescript
import { FormViewModel } from '@web-loom/mvvm-core';
import { z } from 'zod';

// Schema with custom validation
const RegistrationSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be less than 20 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain uppercase letter')
    .regex(/[0-9]/, 'Password must contain a number'),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
});

type RegistrationForm = z.infer<typeof RegistrationSchema>;

class RegistrationViewModel extends FormViewModel<RegistrationForm> {
  constructor(private authService: AuthService) {
    super({
      initialValues: {
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
      },
      validationSchema: RegistrationSchema,
      validateOnChange: true,
      onSubmit: async (values) => {
        await this.authService.register(values);
      }
    });
  }

  // Check username availability
  async checkUsername(username: string): Promise<void> {
    const available = await this.authService.isUsernameAvailable(username);
    if (!available) {
      this.setFieldError('username', 'Username already taken');
    }
  }
}

// Usage
const formVm = new RegistrationViewModel(authService);

// Set values
formVm.setFieldValue('username', 'john_doe');
formVm.setFieldValue('email', 'john@example.com');
formVm.setFieldValue('password', 'SecurePass123');
formVm.setFieldValue('confirmPassword', 'SecurePass123');

// Check availability on blur
await formVm.checkUsername('john_doe');

// Validate and submit
if (formVm.validateForm()) {
  await formVm.submitCommand.execute();
}
```

---

### Example 3: Paginated List with Filtering

```typescript
import { QueryableCollectionViewModel } from '@web-loom/mvvm-core';

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  inStock: boolean;
}

class ProductListViewModel {
  private collectionVm: QueryableCollectionViewModel<Product>;

  constructor(products: Product[]) {
    this.collectionVm = new QueryableCollectionViewModel({
      items: products,
      pageSize: 10
    });
  }

  // Expose observables
  get currentPage$() {
    return this.collectionVm.currentPage$;
  }

  get totalPages$() {
    return this.collectionVm.totalPages$;
  }

  // Filter methods
  filterByCategory(category: string): void {
    this.collectionVm.setFilter(p => p.category === category);
  }

  filterInStock(): void {
    this.collectionVm.setFilter(p => p.inStock);
  }

  clearFilters(): void {
    this.collectionVm.setFilter(() => true);
  }

  // Sort methods
  sortByName(): void {
    this.collectionVm.setSortBy('name', 'asc');
  }

  sortByPrice(order: 'asc' | 'desc' = 'asc'): void {
    this.collectionVm.setSortBy('price', order);
  }

  // Pagination
  nextPage(): void {
    this.collectionVm.nextPage();
  }

  previousPage(): void {
    this.collectionVm.previousPage();
  }

  goToPage(index: number): void {
    this.collectionVm.goToPage(index);
  }

  dispose(): void {
    this.collectionVm.dispose();
  }
}

// Usage
const vm = new ProductListViewModel(products);

// Filter by category
vm.filterByCategory('Electronics');

// Sort by price
vm.sortByPrice('desc');

// Subscribe to current page
vm.currentPage$.subscribe(items => {
  console.log('Page items:', items);
});

// Navigate
vm.nextPage();
```

---

### Example 4: Master-Detail with Commands

```typescript
class OrderDetailViewModel extends BaseViewModel<OrderModel> {
  readonly approveCommand: Command<void, void>;
  readonly rejectCommand: Command<string, void>;
  readonly cancelCommand: Command<void, void>;

  constructor(model: OrderModel) {
    super(model);

    // Approve command - only when pending
    this.approveCommand = new Command(
      async () => {
        await this.model.update({ status: 'approved' });
      },
      this.data$.pipe(
        map(order => order?.status === 'pending')
      )
    );

    // Reject command with reason
    this.rejectCommand = new Command(
      async (reason: string) => {
        await this.model.update({
          status: 'rejected',
          rejectionReason: reason
        });
      },
      this.data$.pipe(
        map(order => order?.status === 'pending')
      )
    );

    // Cancel command - only when approved
    this.cancelCommand = new Command(
      async () => {
        await this.model.update({ status: 'cancelled' });
      },
      this.data$.pipe(
        map(order => order?.status === 'approved')
      )
    );
  }

  get canModify$(): Observable<boolean> {
    return this.data$.pipe(
      map(order =>
        order?.status === 'pending' || order?.status === 'approved'
      )
    );
  }

  get statusColor$(): Observable<string> {
    return this.data$.pipe(
      map(order => {
        switch (order?.status) {
          case 'approved': return 'green';
          case 'rejected': return 'red';
          case 'cancelled': return 'gray';
          default: return 'yellow';
        }
      })
    );
  }
}

// Usage
const vm = new OrderDetailViewModel(orderModel);

// Subscribe to command states
vm.approveCommand.canExecute$.subscribe(canApprove => {
  document.getElementById('approve-btn').disabled = !canApprove;
});

// Execute commands
await vm.approveCommand.execute();
await vm.rejectCommand.execute('Out of stock');
```

---

## Best Practices

### 1. Always Dispose Resources

```typescript
// React
useEffect(() => {
  const vm = new MyViewModel();
  return () => vm.dispose();
}, []);

// Vue
onUnmounted(() => {
  vm.dispose();
});

// Angular
ngOnDestroy() {
  this.vm.dispose();
}

// Vanilla JS
window.addEventListener('beforeunload', () => {
  vm.dispose();
});
```

### 2. Use Schemas for Validation

```typescript
// Define schemas for all data types
const UserSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(3),
  email: z.string().email(),
  age: z.number().positive().optional()
});

// Use strict schemas
const StrictUserSchema = UserSchema.strict(); // No extra keys allowed
```

### 3. Leverage Computed Observables

```typescript
class UserViewModel extends BaseViewModel<UserModel> {
  // Derive state with RxJS operators
  get fullName$(): Observable<string> {
    return this.data$.pipe(
      map(user => user ? `${user.firstName} ${user.lastName}` : '')
    );
  }

  get isAdmin$(): Observable<boolean> {
    return this.data$.pipe(
      map(user => user?.role === 'admin')
    );
  }

  // Combine multiple observables
  get canEdit$(): Observable<boolean> {
    return combineLatest([this.isAdmin$, this.isLoading$]).pipe(
      map(([isAdmin, isLoading]) => isAdmin && !isLoading)
    );
  }
}
```

### 4. Handle Errors Properly

```typescript
class MyViewModel extends RestfulApiViewModel<Data, Schema> {
  constructor() {
    super(new MyModel());

    // Subscribe to errors globally
    this.error$.subscribe(error => {
      if (error) {
        notificationService.showError(error.message);
      }
    });
  }

  async loadData(): Promise<void> {
    try {
      await this.fetchCommand.execute();
    } catch (error) {
      // Handle specific error
      if (error instanceof NetworkError) {
        this.model.setError(new Error('Network connection failed'));
      }
    }
  }
}
```

### 5. Optimize Subscriptions

```typescript
// Use takeUntil for cleanup
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

class MyComponent {
  private destroy$ = new Subject<void>();

  ngOnInit() {
    vm.data$
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        // Handle data
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

### 6. Test Business Logic Independently

```typescript
import { describe, it, expect, vi } from 'vitest';

describe('UserViewModel', () => {
  it('should fetch users on init', async () => {
    // Mock the fetcher
    const mockFetcher = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ id: '1', name: 'John' }]
    });

    const model = new UserModel({ fetcher: mockFetcher });
    const vm = new UserViewModel(model);

    await vm.fetchCommand.execute();

    expect(vm.getState().data).toHaveLength(1);
    expect(vm.getState().isLoading).toBe(false);

    vm.dispose();
  });
});
```

### 7. Keep ViewModels Framework-Agnostic

```typescript
// ✅ Good - No framework dependencies
class UserViewModel extends BaseViewModel<UserModel> {
  get sortedUsers$(): Observable<User[]> {
    return this.data$.pipe(
      map(users => users?.sort((a, b) => a.name.localeCompare(b.name)))
    );
  }
}

// ❌ Bad - React-specific
class UserViewModel extends BaseViewModel<UserModel> {
  useState() { /* React hook */ }  // Don't do this!
}
```

### 8. Use Command Pattern for Actions

```typescript
class MyViewModel {
  // ✅ Good - Encapsulated with state
  readonly saveCommand = new Command(
    async () => this.save(),
    this.canSave$
  );

  // ❌ Avoid - Direct methods lose reactive state
  async save() {
    // Implementation
  }
}
```

---

## TypeScript Types

### Exported Types

```typescript
// Models
export interface IModel<TData> extends IDisposable {
  data$: BehaviorSubject<TData | null>;
  isLoading$: BehaviorSubject<boolean>;
  error$: BehaviorSubject<Error | null>;
  isError$: Observable<boolean>;
  setData(data: TData | null): void;
  setLoading(loading: boolean): void;
  setError(error: Error | null): void;
  getState(): ModelState<TData>;
}

export interface ModelState<TData> {
  data: TData | null;
  isLoading: boolean;
  error: Error | null;
  isError: boolean;
}

// ViewModels
export interface IViewModel<TData> extends IDisposable {
  data$: Observable<TData | null>;
  isLoading$: Observable<boolean>;
  error$: Observable<Error | null>;
  getState(): ModelState<TData>;
}

// Commands
export interface ICommand<TParam, TResult> extends IDisposable {
  isExecuting$: Observable<boolean>;
  canExecute$: Observable<boolean>;
  result$: Observable<TResult>;
  error$: Observable<Error | null>;
  execute(param?: TParam): Promise<TResult>;
}

// Fetcher
export type Fetcher = (
  url: string,
  options?: RequestInit
) => Promise<Response>;

// Collection Changes
export type CollectionChange<T> =
  | { type: 'add'; item: T }
  | { type: 'remove'; item: T }
  | { type: 'update'; oldItem: T; newItem: T }
  | { type: 'clear' };

// Disposable
export interface IDisposable {
  dispose(): void;
}

// Config Types
export interface BaseModelConfig<TData, TSchema> {
  initialData: TData | null;
  schema?: TSchema;
}

export interface RestfulApiModelConfig<TData, TSchema>
  extends BaseModelConfig<TData, TSchema> {
  baseUrl: string;
  endpoint: string;
  fetcher: Fetcher;
}

export interface QueryStateModelConfig<TData, TSchema> {
  queryCore: QueryCore;
  endpointKey: string;
  schema: TSchema;
}

export interface FormViewModelConfig<TValues> {
  initialValues: TValues;
  validationSchema?: ZodSchema;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  onSubmit?: (values: TValues) => Promise<void>;
}

export interface QueryableCollectionConfig<T> {
  items: T[];
  pageSize?: number;
}

export interface SortConfig<T> {
  field: keyof T;
  order: 'asc' | 'desc';
}
```

---

## Common Patterns

### Pattern 1: Command with Loading UI

```typescript
// In ViewModel
readonly saveCommand = new Command(
  async () => this.save(),
  this.canSave$
);

// In React Component
const isSaving = useObservable(vm.saveCommand.isExecuting$, false);
const canSave = useObservable(vm.saveCommand.canExecute$, true);

return (
  <button
    onClick={() => vm.saveCommand.execute()}
    disabled={!canSave || isSaving}
  >
    {isSaving ? 'Saving...' : 'Save'}
  </button>
);
```

---

### Pattern 2: Optimistic UI Updates

```typescript
class TodoViewModel extends RestfulApiViewModel<Todo[], Schema> {
  async toggleTodo(id: string): Promise<void> {
    // Get current state
    const todos = this.getState().data || [];
    const todo = todos.find(t => t.id === id);

    if (!todo) return;

    // Optimistic update
    const updated = { ...todo, completed: !todo.completed };
    this.model.setData(
      todos.map(t => t.id === id ? updated : t)
    );

    try {
      // Actual update
      await this.updateCommand.execute({
        id,
        data: { completed: updated.completed }
      });
    } catch (error) {
      // Rollback on error
      this.model.setData(todos);
      throw error;
    }
  }
}
```

---

### Pattern 3: Dependent Commands

```typescript
class OrderViewModel {
  readonly fetchCommand: Command<string, Order>;
  readonly approveCommand: Command<void, void>;

  constructor() {
    this.fetchCommand = new Command(
      async (id: string) => this.fetchOrder(id)
    );

    // Approve only when order is fetched and pending
    this.approveCommand = new Command(
      async () => this.approve(),
      combineLatest([
        this.fetchCommand.result$,
        this.fetchCommand.isExecuting$
      ]).pipe(
        map(([order, fetching]) =>
          !fetching && order?.status === 'pending'
        )
      )
    );
  }
}
```

---

### Pattern 4: Debounced Search

```typescript
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

class SearchViewModel {
  private searchQuery$ = new BehaviorSubject<string>('');
  readonly results$: Observable<SearchResult[]>;

  constructor(private searchService: SearchService) {
    this.results$ = this.searchQuery$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(query =>
        query ? this.searchService.search(query) : of([])
      )
    );
  }

  search(query: string): void {
    this.searchQuery$.next(query);
  }
}
```

---

### Pattern 5: Master-Detail Sync

```typescript
class MasterDetailViewModel {
  private selectedId$ = new BehaviorSubject<string | null>(null);

  readonly masterList$: Observable<Item[]>;
  readonly selectedDetail$: Observable<Item | null>;

  constructor(private listModel: ListModel) {
    this.masterList$ = listModel.data$;

    this.selectedDetail$ = combineLatest([
      this.masterList$,
      this.selectedId$
    ]).pipe(
      map(([list, id]) =>
        id ? list?.find(item => item.id === id) || null : null
      )
    );
  }

  selectItem(id: string): void {
    this.selectedId$.next(id);
  }

  clearSelection(): void {
    this.selectedId$.next(null);
  }
}
```

---

## Testing Guide

### Unit Testing ViewModels

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { firstValueFrom } from 'rxjs';

describe('UserViewModel', () => {
  let vm: UserViewModel;
  let mockFetcher: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetcher = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        { id: '1', name: 'John', email: 'john@example.com' }
      ]
    });

    const model = new UserModel({ fetcher: mockFetcher });
    vm = new UserViewModel(model);
  });

  afterEach(() => {
    vm.dispose();
  });

  it('should fetch users successfully', async () => {
    await vm.fetchCommand.execute();

    const state = vm.getState();
    expect(state.data).toHaveLength(1);
    expect(state.data[0].name).toBe('John');
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('should handle fetch errors', async () => {
    mockFetcher.mockRejectedValueOnce(new Error('Network error'));

    await expect(vm.fetchCommand.execute()).rejects.toThrow('Network error');

    const state = vm.getState();
    expect(state.error).toBeTruthy();
    expect(state.error?.message).toBe('Network error');
  });

  it('should filter admin users', async () => {
    mockFetcher.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { id: '1', name: 'Admin', role: 'admin' },
        { id: '2', name: 'User', role: 'user' }
      ]
    });

    await vm.fetchCommand.execute();
    const admins = await firstValueFrom(vm.adminUsers$);

    expect(admins).toHaveLength(1);
    expect(admins[0].role).toBe('admin');
  });
});
```

---

### Testing Commands

```typescript
describe('LoginCommand', () => {
  it('should execute when not logged in', async () => {
    const vm = new AuthViewModel();

    expect(await firstValueFrom(vm.loginCommand.canExecute$)).toBe(true);

    await vm.loginCommand.execute({
      username: 'user',
      password: 'pass'
    });

    expect(await firstValueFrom(vm.isLoggedIn$)).toBe(true);
    expect(await firstValueFrom(vm.loginCommand.canExecute$)).toBe(false);
  });

  it('should track execution state', async () => {
    const vm = new AuthViewModel();
    const executionStates: boolean[] = [];

    vm.loginCommand.isExecuting$.subscribe(executing => {
      executionStates.push(executing);
    });

    await vm.loginCommand.execute({
      username: 'user',
      password: 'pass'
    });

    expect(executionStates).toEqual([false, true, false]);
  });
});
```

---

### Testing Forms

```typescript
describe('RegistrationFormViewModel', () => {
  let formVm: RegistrationFormViewModel;

  beforeEach(() => {
    formVm = new RegistrationFormViewModel();
  });

  afterEach(() => {
    formVm.dispose();
  });

  it('should validate email format', () => {
    formVm.setFieldValue('email', 'invalid-email');
    const isValid = formVm.validateField('email');

    expect(isValid).toBe(false);
    expect(formVm.getState().errors['email']).toBeTruthy();
  });

  it('should validate password match', () => {
    formVm.setFieldValue('password', 'Pass123!');
    formVm.setFieldValue('confirmPassword', 'DifferentPass');

    const isValid = formVm.validateForm();

    expect(isValid).toBe(false);
    expect(formVm.getState().errors['confirmPassword']).toContain('do not match');
  });

  it('should track dirty state', async () => {
    const dirtyStates = await firstValueFrom(
      formVm.isDirty$.pipe(take(2), toArray())
    );

    formVm.setFieldValue('email', 'user@example.com');

    expect(dirtyStates).toEqual([false, true]);
  });
});
```

---

## Advanced Topics

### Custom Model Types

```typescript
import { BaseModel } from '@web-loom/mvvm-core';

class PaginatedModel<T> extends BaseModel<PaginatedData<T>, any> {
  private currentPage$ = new BehaviorSubject<number>(1);
  private pageSize$ = new BehaviorSubject<number>(10);

  constructor(initialData: PaginatedData<T>) {
    super({ initialData, schema: undefined });
  }

  get totalPages$(): Observable<number> {
    return combineLatest([this.data$, this.pageSize$]).pipe(
      map(([data, pageSize]) =>
        data ? Math.ceil(data.total / pageSize) : 0
      )
    );
  }

  setPage(page: number): void {
    this.currentPage$.next(page);
  }

  setPageSize(size: number): void {
    this.pageSize$.next(size);
  }
}
```

---

### Middleware Pattern

```typescript
type CommandMiddleware<TParam, TResult> = (
  execute: (param: TParam) => Promise<TResult>,
  param: TParam
) => Promise<TResult>;

class CommandWithMiddleware<TParam, TResult> extends Command<TParam, TResult> {
  private middlewares: CommandMiddleware<TParam, TResult>[] = [];

  use(middleware: CommandMiddleware<TParam, TResult>): this {
    this.middlewares.push(middleware);
    return this;
  }

  async execute(param: TParam): Promise<TResult> {
    let execute = this.executeFunc;

    // Apply middlewares in reverse order
    for (let i = this.middlewares.length - 1; i >= 0; i--) {
      const middleware = this.middlewares[i];
      const nextExecute = execute;
      execute = (p: TParam) => middleware(nextExecute, p);
    }

    return super.execute(param);
  }
}

// Usage
const saveCommand = new CommandWithMiddleware(async () => save())
  .use(async (next, param) => {
    console.log('Before save');
    const result = await next(param);
    console.log('After save');
    return result;
  })
  .use(async (next, param) => {
    // Retry logic
    try {
      return await next(param);
    } catch (error) {
      console.log('Retrying...');
      return await next(param);
    }
  });
```

---

## Migration Guide

### From Redux to MVVM

```typescript
// Redux
const initialState = { users: [], loading: false };

function usersReducer(state = initialState, action) {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, loading: true };
    case 'FETCH_SUCCESS':
      return { users: action.payload, loading: false };
    default:
      return state;
  }
}

// MVVM equivalent
class UsersViewModel extends RestfulApiViewModel<User[], Schema> {
  constructor() {
    super(new UsersModel());
  }
}

// Usage is simpler
const vm = new UsersViewModel();
await vm.fetchCommand.execute();
```

---

## Performance Optimization

### 1. Memoize Computed Properties

```typescript
import { shareReplay } from 'rxjs/operators';

class MyViewModel extends BaseViewModel<MyModel> {
  readonly expensiveComputation$ = this.data$.pipe(
    map(data => /* expensive operation */),
    shareReplay(1) // Cache the result
  );
}
```

### 2. Use distinctUntilChanged

```typescript
readonly filteredData$ = this.data$.pipe(
  map(data => data?.filter(/* ... */)),
  distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b))
);
```

### 3. Dispose Unused ViewModels

```typescript
// Component-scoped ViewModels
const vm = useMemo(() => new MyViewModel(), []);
useEffect(() => () => vm.dispose(), [vm]);
```

---

## Troubleshooting

### Issue: Memory Leaks

**Solution**: Always dispose ViewModels and unsubscribe from observables.

```typescript
// Always dispose
useEffect(() => {
  return () => vm.dispose();
}, [vm]);
```

---

### Issue: Stale Data

**Solution**: Use shareReplay or BehaviorSubject for shared state.

```typescript
readonly sharedData$ = this.data$.pipe(shareReplay(1));
```

---

### Issue: Commands Not Executing

**Solution**: Check canExecute$ observable.

```typescript
vm.myCommand.canExecute$.subscribe(can => {
  console.log('Can execute:', can);
});
```

---

## Conclusion

`@web-loom/mvvm-core` provides a complete, production-ready MVVM framework for building reactive web applications. Its framework-agnostic design, powerful RxJS integration, and comprehensive type safety make it an excellent choice for scalable applications.

For more information:
- [GitHub Repository](https://github.com/bretuobay/web-loom)
- [Examples Directory](https://github.com/bretuobay/web-loom/tree/main/packages/mvvm-core/src/examples)
- [API Reference](https://web-loom.dev/docs/api/mvvm-core)

---

**Version**: 0.5.2
**License**: MIT
**Last Updated**: January 2025
