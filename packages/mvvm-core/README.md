# @web-loom/mvvm-core

Framework-agnostic MVVM library for building reactive web applications with RxJS and Zod validation.

## Overview

`@web-loom/mvvm-core` provides a complete MVVM (Model-View-ViewModel) implementation that works across React, Angular, Vue, and vanilla JavaScript. Built on RxJS for reactive data flow and Zod for type-safe validation, it simplifies state management and API interactions for client-heavy applications.

## Installation

```bash
npm install @web-loom/mvvm-core rxjs zod
```

## Features

- **MVVM Pattern**: BaseModel, BaseViewModel, RestfulApiModel with clear separation of concerns
- **Reactive**: RxJS-powered observables for `data$`, `isLoading$`, `error$`
- **Type-Safe**: Zod schema validation at compile-time and runtime
- **RESTful APIs**: Simplified CRUD with optimistic updates and auto state management
- **Command Pattern**: Encapsulated UI actions with `canExecute` and `isExecuting` states
- **Observable Collections**: Reactive lists with granular change notifications
- **Query Integration**: QueryStateModel for advanced caching with `@web-loom/query-core`
- **Resource Management**: IDisposable pattern for proper cleanup
- **Framework Agnostic**: No UI framework dependencies

## Core Concepts

### BaseModel

Foundation for all models with reactive state management.

```typescript
import { BaseModel } from '@web-loom/mvvm-core';
import { z } from 'zod';

const UserSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(3),
  email: z.string().email(),
  age: z.number().positive().optional(),
});

type User = z.infer<typeof UserSchema>;

class UserModel extends BaseModel<User, typeof UserSchema> {
  constructor(initialData?: User) {
    super({ initialData: initialData || null, schema: UserSchema });
  }
}

const model = new UserModel();
model.data$.subscribe((user) => console.log('User:', user));
model.setData({ id: '123', name: 'Alice', email: 'alice@example.com' });
```

**Key observables**:

- `data$`: Current data state
- `isLoading$`: Loading indicator
- `error$`: Error state
- `isError$`: Boolean error indicator

### RestfulApiModel

Extends BaseModel with CRUD operations and optimistic updates.

```typescript
import { RestfulApiModel, type Fetcher } from '@web-loom/mvvm-core';

const fetcher: Fetcher = async (url, options) => {
  const response = await fetch(url, options);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response;
};

class UserApiModel extends RestfulApiModel<User[], typeof UserSchema> {
  constructor() {
    super({
      baseUrl: 'https://api.example.com',
      endpoint: 'users',
      fetcher,
      schema: z.array(UserSchema),
      initialData: null,
    });
  }
}

const api = new UserApiModel();

// Fetch all users
await api.fetch();

// Create user (optimistic update)
const newUser = await api.create({ name: 'Bob', email: 'bob@example.com' });

// Update user
await api.update('user-id', { name: 'Robert' });

// Delete user
await api.delete('user-id');
```

**Features**:

- Automatic loading state management
- Optimistic updates with rollback on error
- Error handling with retry logic
- Validation via Zod schemas

### BaseViewModel

Connects Models to Views with presentation logic.

```typescript
import { BaseViewModel } from '@web-loom/mvvm-core';
import { map } from 'rxjs/operators';

class UserViewModel extends BaseViewModel<UserModel> {
  constructor(model: UserModel) {
    super(model);
  }

  // Computed observables
  get displayName$() {
    return this.data$.pipe(map((user) => (user ? `${user.name} (${user.email})` : 'No user')));
  }
}
```

### RestfulApiViewModel

Extends BaseViewModel with CRUD commands for RESTful operations.

```typescript
import { RestfulApiViewModel } from '@web-loom/mvvm-core';

class UserListViewModel extends RestfulApiViewModel<User[], typeof UserSchema> {
  constructor() {
    super(new UserApiModel());
  }

  // Additional computed properties
  get activeUsers$() {
    return this.data$.pipe(map((users) => users?.filter((u) => u.active)));
  }
}

const vm = new UserListViewModel();

// Use commands
await vm.fetchCommand.execute();
await vm.createCommand.execute({ name: 'New User', email: 'new@example.com' });
await vm.updateCommand.execute({ id: '123', name: 'Updated' });
await vm.deleteCommand.execute('123');

// Clean up
vm.dispose();
```

### Command Pattern

Encapsulates UI actions with execution control.

```typescript
import { Command } from '@web-loom/mvvm-core';
import { BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';

class AuthViewModel {
  private _isLoggedIn = new BehaviorSubject(false);
  isLoggedIn$ = this._isLoggedIn.asObservable();

  loginCommand: Command<string, boolean>;

  constructor() {
    this.loginCommand = new Command(
      async (password: string) => {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const success = password === 'secret';
        this._isLoggedIn.next(success);
        return success;
      },
      // canExecute$ - only when not logged in
      this.isLoggedIn$.pipe(map((loggedIn) => !loggedIn)),
    );
  }
}

const auth = new AuthViewModel();

// Subscribe to command state
auth.loginCommand.isExecuting$.subscribe((executing) => console.log('Logging in:', executing));
auth.loginCommand.canExecute$.subscribe((canExecute) => console.log('Can login:', canExecute));

// Execute command
await auth.loginCommand.execute('secret');
```

**Command features**:

- `isExecuting$`: Track execution state
- `canExecute$`: Control when command can run
- `result$`: Observable of command results
- Automatic error handling

### ObservableCollection

Reactive collection with granular change notifications.

```typescript
import { ObservableCollection } from '@web-loom/mvvm-core';

interface Todo {
  id: string;
  text: string;
  completed: boolean;
}

const todos = new ObservableCollection<Todo>([
  { id: '1', text: 'Learn MVVM', completed: false },
  { id: '2', text: 'Build app', completed: true },
]);

// Subscribe to changes
todos.items$.subscribe((items) => console.log('Todos:', items));
todos.changes$.subscribe((change) => console.log('Change:', change));

// Manipulate collection
todos.add({ id: '3', text: 'Deploy', completed: false });
todos.update((todo) => todo.id === '1', { ...todo, completed: true });
todos.remove((todo) => todo.completed);

// Query collection
const array = todos.toArray();
const count = todos.count();
const firstUncompleted = todos.find((todo) => !todo.completed);
```

### QueryStateModel & QueryStateModelView

Integration with `@web-loom/query-core` for advanced caching.

```typescript
import { QueryStateModel, QueryStateModelView } from '@web-loom/mvvm-core';
import QueryCore from '@web-loom/query-core';

const queryCore = new QueryCore({ defaultRefetchAfter: 5 * 60 * 1000 });

// Define endpoint
queryCore.defineEndpoint<User[]>('users', async () => {
  const res = await fetch('https://api.example.com/users');
  return res.json();
});

// Create model
class UsersQueryModel extends QueryStateModel<User[], typeof UserSchema> {
  constructor() {
    super({
      queryCore,
      endpointKey: 'users',
      schema: z.array(UserSchema),
    });
  }
}

// Create ViewModel
class UsersViewModel extends QueryStateModelView<User[], typeof UserSchema> {
  constructor() {
    super(new UsersQueryModel());
  }
}

const vm = new UsersViewModel();

// Subscribe to data
vm.data$.subscribe((users) => console.log('Users:', users));

// Refetch data
await vm.refetchCommand.execute(true); // Force refetch

// Invalidate cache
await vm.invalidateCommand.execute();
```

**Benefits**:

- Shared cache across components
- Automatic background refetching
- Request deduplication
- Stale-while-revalidate pattern

## Framework Integration

### React

```tsx
import { useState, useEffect, useMemo } from 'react';
import { Observable } from 'rxjs';

// Custom hook for RxJS observables
function useObservable<T>(observable: Observable<T>, initialValue: T): T {
  const [value, setValue] = useState<T>(initialValue);

  useEffect(() => {
    const subscription = observable.subscribe(setValue);
    return () => subscription.unsubscribe();
  }, [observable]);

  return value;
}

// Component
function UserList() {
  const vm = useMemo(() => new UserListViewModel(), []);
  const users = useObservable(vm.data$, null);
  const isLoading = useObservable(vm.isLoading$, false);
  const error = useObservable(vm.error$, null);

  useEffect(() => {
    vm.fetchCommand.execute();
    return () => vm.dispose();
  }, [vm]);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <ul>
      {users?.map((user) => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
```

### Angular

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';
import { UserListViewModel } from './viewmodels/user-list.viewmodel';

@Component({
  selector: 'app-user-list',
  template: `
    <div *ngIf="vm.isLoading$ | async">Loading...</div>
    <div *ngIf="vm.error$ | async as error">Error: {{ error.message }}</div>
    <ul *ngIf="vm.data$ | async as users">
      <li *ngFor="let user of users">{{ user.name }}</li>
    </ul>
  `,
  providers: [UserListViewModel],
})
export class UserListComponent implements OnInit, OnDestroy {
  constructor(public vm: UserListViewModel) {}

  ngOnInit() {
    this.vm.fetchCommand.execute();
  }

  ngOnDestroy() {
    this.vm.dispose();
  }
}
```

### Vue

```vue
<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { UserListViewModel } from './viewmodels/user-list.viewmodel';

const vm = new UserListViewModel();
const users = ref([]);
const isLoading = ref(false);
const error = ref(null);

watch(
  () => vm.data$,
  (obs) => {
    obs.subscribe((data) => (users.value = data));
  },
);

watch(
  () => vm.isLoading$,
  (obs) => {
    obs.subscribe((loading) => (isLoading.value = loading));
  },
);

watch(
  () => vm.error$,
  (obs) => {
    obs.subscribe((err) => (error.value = err));
  },
);

onMounted(() => {
  vm.fetchCommand.execute();
});

onUnmounted(() => {
  vm.dispose();
});
</script>

<template>
  <div v-if="isLoading">Loading...</div>
  <div v-if="error">Error: {{ error.message }}</div>
  <ul v-if="users">
    <li v-for="user in users" :key="user.id">{{ user.name }}</li>
  </ul>
</template>
```

## Advanced Features

### FormViewModel

Form state management with validation and dirty tracking.

```typescript
import { FormViewModel } from '@web-loom/mvvm-core';

const formVm = new FormViewModel({
  initialValues: { email: '', password: '' },
  validationSchema: z.object({
    email: z.string().email(),
    password: z.string().min(8),
  }),
  validateOnChange: true,
  validateOnBlur: true,
});

// Subscribe to form state
formVm.isValid$.subscribe((valid) => console.log('Valid:', valid));
formVm.isDirty$.subscribe((dirty) => console.log('Dirty:', dirty));
formVm.errors$.subscribe((errors) => console.log('Errors:', errors));

// Set field values
formVm.setFieldValue('email', 'user@example.com');

// Submit form
formVm.submitCommand.execute();
```

### QueryableCollectionViewModel

Advanced list management with filtering, sorting, and pagination.

```typescript
import { QueryableCollectionViewModel } from '@web-loom/mvvm-core';

const vm = new QueryableCollectionViewModel({
  items: users,
  pageSize: 10,
});

// Filter
vm.setFilter((user) => user.active);

// Sort
vm.setSortBy('name', 'asc');

// Paginate
vm.nextPage();
vm.previousPage();
vm.goToPage(2);

// Subscribe to results
vm.filteredItems$.subscribe((items) => console.log('Filtered:', items));
vm.currentPage$.subscribe((items) => console.log('Current page:', items));
```

### Dependency Injection

```typescript
import { DIContainer } from '@web-loom/mvvm-core';

const container = new DIContainer();

// Register singleton
container.registerSingleton('UserService', () => new UserService());

// Register transient
container.registerTransient('UserViewModel', () => new UserViewModel());

// Resolve
const userService = container.resolve<UserService>('UserService');
const userVm = container.resolve<UserViewModel>('UserViewModel');
```

## Best Practices

1. **Always dispose ViewModels**: Call `dispose()` when components unmount
2. **Use schemas for validation**: Define Zod schemas for all data types
3. **Leverage computed observables**: Derive state with RxJS operators
4. **Handle errors properly**: Subscribe to `error$` and display to users
5. **Optimize subscriptions**: Use `takeUntil` pattern to prevent memory leaks
6. **Test business logic**: ViewModels are framework-agnostic and easily testable

## Testing

```typescript
import { describe, it, expect } from 'vitest';
import { UserViewModel } from './user.viewmodel';

describe('UserViewModel', () => {
  it('should fetch users', async () => {
    const vm = new UserViewModel();

    await vm.fetchCommand.execute();

    expect(vm.getState().data).toBeDefined();
    expect(vm.getState().isLoading).toBe(false);

    vm.dispose();
  });
});
```

## API Reference

### BaseModel

- `data$`: BehaviorSubject<T | null>
- `isLoading$`: BehaviorSubject<boolean>
- `error$`: BehaviorSubject<Error | null>
- `isError$`: Observable<boolean>
- `setData(data: T): void`
- `setLoading(loading: boolean): void`
- `setError(error: Error | null): void`
- `dispose(): void`

### RestfulApiModel (extends BaseModel)

- `fetch(): Promise<T>`
- `create(data: Partial<T>): Promise<T | null>`
- `update(id: string, data: Partial<T>): Promise<T | null>`
- `delete(id: string): Promise<void>`

### BaseViewModel

- `data$`: Observable<T | null>
- `isLoading$`: Observable<boolean>
- `error$`: Observable<Error | null>
- `getState(): ModelState<T>`
- `dispose(): void`

### RestfulApiViewModel (extends BaseViewModel)

- `fetchCommand`: Command<void, T>
- `createCommand`: Command<Partial<T>, T | null>
- `updateCommand`: Command<{ id: string; data: Partial<T> }, T | null>
- `deleteCommand`: Command<string, void>

### Command

- `isExecuting$`: Observable<boolean>
- `canExecute$`: Observable<boolean>
- `result$`: Observable<TResult>
- `execute(param: TParam): Promise<TResult>`
- `dispose(): void`

## TypeScript Support

Full TypeScript support with comprehensive type definitions:

```typescript
import type { IModel, IViewModel, ICommand, IDisposable, ModelState, Fetcher } from '@web-loom/mvvm-core';
```

## Dependencies

- **rxjs**: ^7.8.2 (reactive programming)
- **zod**: ^3.25.0 (schema validation)
- **@web-loom/query-core**: 0.0.3 (optional, for QueryStateModel)

## License

MIT
