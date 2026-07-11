# @web-loom/mvvm-core

Framework-agnostic MVVM library for building reactive web applications with signals and Zod validation.

## Overview

`@web-loom/mvvm-core` provides a complete MVVM (Model-View-ViewModel) implementation that works across React, Angular, Vue, Lit, and vanilla JavaScript. Built on `@web-loom/signals-core` for reactive state and Zod for type-safe validation, it simplifies state management and API interactions for client-heavy applications.

**Reactive property convention**: properties suffixed with `$` (e.g. `data$`, `canExecute$`) are reactive signals (`ReadonlySignal<T>`). Read them synchronously with `.get()` (auto-tracked inside `computed`/`effect`) or `.peek()` (untracked), and subscribe to changes with `.subscribe(fn)`, which returns an unsubscribe function. Use `observe(sig, fn)` from `@web-loom/signals-core` when you also want the current value delivered immediately.

RxJS is no longer a dependency. For genuinely stream-shaped needs at the Model edge (websockets, retry/backoff, complex event streams), use the interop in `@web-loom/signals-core/rxjs` (`toObservable` / `fromObservable`), which keeps RxJS an optional peer dependency.

## Installation

```bash
npm install @web-loom/mvvm-core @web-loom/signals-core zod
```

## Features

- **MVVM Pattern**: BaseModel, BaseViewModel, RestfulApiModel with clear separation of concerns
- **Reactive**: signal-powered reactive properties for `data$`, `isLoading$`, `error$`
- **Type-Safe**: Zod schema validation at compile-time and runtime
- **RESTful APIs**: Simplified CRUD with optimistic updates and auto state management
- **Command Pattern**: Encapsulated UI actions with auto-tracked `canExecute$` and `isExecuting$` states
- **Observable Collections**: Reactive lists with granular change events
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
model.data$.subscribe((user) => console.log('User changed:', user));
model.setData({ id: '123', name: 'Alice', email: 'alice@example.com' });
console.log(model.data$.get()); // read synchronously
```

**Key reactive properties**:

- `data$`: Current data state
- `isLoading$`: Loading indicator
- `error$`: Error state

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
- Validation via Zod schemas

### BaseViewModel

Connects Models to Views with presentation logic.

```typescript
import { BaseViewModel } from '@web-loom/mvvm-core';
import { computed } from '@web-loom/signals-core';

class UserViewModel extends BaseViewModel<UserModel> {
  // Computed reactive properties
  readonly displayName$ = computed(() => {
    const user = this.data$.get();
    return user ? `${user.name} (${user.email})` : 'No user';
  });

  constructor(model: UserModel) {
    super(model);
  }
}
```

`BaseViewModel` also derives `validationErrors$` (a `ReadonlySignal<ZodError | null>`) from the model's `error$`.

### RestfulApiViewModel

Extends BaseViewModel with CRUD commands for RESTful operations.

```typescript
import { RestfulApiViewModel } from '@web-loom/mvvm-core';
import { computed } from '@web-loom/signals-core';

class UserListViewModel extends RestfulApiViewModel<User[], typeof UserSchema> {
  readonly activeUsers$ = computed(() => this.data$.get()?.filter((u) => u.active));

  constructor() {
    super(new UserApiModel());
  }
}

const vm = new UserListViewModel();

// Use commands
await vm.fetchCommand.execute();
await vm.createCommand.execute({ name: 'New User', email: 'new@example.com' });
await vm.updateCommand.execute({ id: '123', payload: { name: 'Updated' } });
await vm.deleteCommand.execute('123');

// Selection helpers for collection data
vm.selectItem('123');
console.log(vm.selectedItem$.get());

// Clean up
vm.dispose();
```

### Command Pattern

Encapsulates UI actions with execution control. `canExecute$` is a computed signal: signal reads inside a condition function are auto-tracked, and a command is never executable while it is already executing.

```typescript
import { Command } from '@web-loom/mvvm-core';
import { signal } from '@web-loom/signals-core';

class AuthViewModel {
  private _isLoggedIn = signal(false);
  readonly isLoggedIn$ = this._isLoggedIn.asReadonly();

  loginCommand: Command<string, boolean>;

  constructor() {
    this.loginCommand = new Command(
      async (password: string) => {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const success = password === 'secret';
        this._isLoggedIn.set(success);
        return success;
      },
      // canExecute — only when not logged in (auto-tracked signal read)
      () => !this._isLoggedIn.get(),
    );
  }
}

const auth = new AuthViewModel();

// Observe command state
auth.loginCommand.isExecuting$.subscribe((executing) => console.log('Logging in:', executing));
auth.loginCommand.canExecute$.subscribe((canExecute) => console.log('Can login:', canExecute));

// Execute command
await auth.loginCommand.execute('secret');
```

**Fluent conditions** (Prism-style):

```typescript
const submitCommand = new Command(() => submit())
  .observesProperty(username$) // truthy check
  .observesCanExecute(isFormValid$); // boolean signal

// For can-execute logic reading non-signal state:
submitCommand.raiseCanExecuteChanged();
```

**Command features**:

- `isExecuting$`: Track execution state
- `canExecute$`: Control when command can run (computed, auto-tracked)
- `executeError$`: Latest execution error (null when none)
- Synchronous can-execute guard — no async race between check and run

### ObservableCollection

Reactive collection with granular change events. `items$` is a signal holding the current items; `itemAdded$`, `itemRemoved$`, and `itemUpdated$` are event sources — they deliver every occurrence and have no current value.

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

// Reactive current state
todos.items$.subscribe((items) => console.log('Todos:', items));

// Occurrence events
todos.itemAdded$.subscribe((todo) => console.log('Added:', todo));
todos.itemRemoved$.subscribe((todo) => console.log('Removed:', todo));

// Manipulate collection
todos.add({ id: '3', text: 'Deploy', completed: false });
todos.update((todo) => todo.id === '1', { id: '1', text: 'Learn MVVM', completed: true });
todos.remove((todo) => todo.completed);

// Query collection
const array = todos.toArray();
const count = todos.length;
```

### QueryStateModel & QueryStateModelView

Integration with `@web-loom/query-core` for advanced caching.

```typescript
import { QueryStateModel, QueryStateModelView } from '@web-loom/mvvm-core';
import QueryCore from '@web-loom/query-core';

const queryCore = new QueryCore({ defaultRefetchAfter: 5 * 60 * 1000 });

class UsersQueryModel extends QueryStateModel<User[], typeof UserSchema> {
  constructor() {
    super({
      queryCore,
      endpointKey: 'users',
      schema: z.array(UserSchema),
      fetcherFn: async () => {
        const res = await fetch('https://api.example.com/users');
        return res.json();
      },
    });
  }
}

class UsersViewModel extends QueryStateModelView<User[], typeof UserSchema> {
  constructor() {
    super(new UsersQueryModel());
  }
}

const vm = new UsersViewModel();

vm.data$.subscribe((users) => console.log('Users:', users));

await vm.refetchCommand.execute(true); // Force refetch
await vm.invalidateCommand.execute(); // Invalidate cache
```

## Framework Integration

### React

```tsx
import { useMemo, useEffect, useSyncExternalStore } from 'react';
import type { ReadonlySignal } from '@web-loom/signals-core';

// Bind a signal to React — no initial value, no first-render flash
function useSignal<T>(sig: ReadonlySignal<T>): T {
  return useSyncExternalStore(sig.subscribe, sig.get, sig.get);
}

function UserList() {
  const vm = useMemo(() => new UserListViewModel(), []);
  const users = useSignal(vm.data$);
  const isLoading = useSignal(vm.isLoading$);
  const error = useSignal(vm.error$);

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

Bridge to native Angular signals — no async pipe needed:

```typescript
import { Component, OnInit, OnDestroy, signal, type Signal, DestroyRef, inject } from '@angular/core';
import type { ReadonlySignal } from '@web-loom/signals-core';
import { UserListViewModel } from './viewmodels/user-list.viewmodel';

function fromLoomSignal<T>(source: ReadonlySignal<T>, destroyRef: DestroyRef): Signal<T> {
  const mirror = signal<T>(source.peek());
  destroyRef.onDestroy(source.subscribe((value) => mirror.set(value)));
  return mirror.asReadonly();
}

@Component({
  selector: 'app-user-list',
  template: `
    <div *ngIf="isLoading()">Loading...</div>
    <div *ngIf="error() as err">Error: {{ err.message }}</div>
    <ul *ngIf="users() as list">
      <li *ngFor="let user of list">{{ user.name }}</li>
    </ul>
  `,
  providers: [UserListViewModel],
})
export class UserListComponent implements OnInit, OnDestroy {
  private destroyRef = inject(DestroyRef);
  users = fromLoomSignal(this.vm.data$, this.destroyRef);
  isLoading = fromLoomSignal(this.vm.isLoading$, this.destroyRef);
  error = fromLoomSignal(this.vm.error$, this.destroyRef);

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
import { shallowRef, onMounted, onUnmounted, type ShallowRef } from 'vue';
import { observe, type ReadonlySignal } from '@web-loom/signals-core';
import { UserListViewModel } from './viewmodels/user-list.viewmodel';

function useSignal<T>(sig: ReadonlySignal<T>): ShallowRef<T> {
  const value = shallowRef<T>(sig.peek());
  const unsubscribe = observe(sig, (next) => (value.value = next));
  onUnmounted(unsubscribe);
  return value;
}

const vm = new UserListViewModel();
const users = useSignal(vm.data$);
const isLoading = useSignal(vm.isLoading$);
const error = useSignal(vm.error$);

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

### Lit / Vanilla

```typescript
import { observe } from '@web-loom/signals-core';

// observe delivers the current value immediately, then every change
const unsubscribe = observe(vm.data$, (users) => render(users));

// Later (e.g. disconnectedCallback):
unsubscribe();
```

## Advanced Features

### FormViewModel

Form state management with debounced validation and dirty tracking.

```typescript
import { FormViewModel } from '@web-loom/mvvm-core';

const formVm = new FormViewModel(
  { email: '', password: '' },
  z.object({
    email: z.string().email(),
    password: z.string().min(8),
  }),
  async (data) => api.submit(data), // optional Promise-based submit handler
);

// Reactive form state
formVm.isValid$.subscribe((valid) => console.log('Valid:', valid));
formVm.isDirty$.subscribe((dirty) => console.log('Dirty:', dirty));
formVm.errors$.subscribe((errors) => console.log('Errors:', errors));

// Set field values
formVm.updateField('email', 'user@example.com');

// Submit form
await formVm.submitCommand.execute();
```

### QueryableCollectionViewModel

Advanced list management with debounced filtering, sorting, and pagination.

```typescript
import { QueryableCollectionViewModel } from '@web-loom/mvvm-core';

const vm = new QueryableCollectionViewModel(users, 10);

vm.setFilter('alice'); // debounced text search
vm.setSort('name', 'asc');
vm.nextPage();
vm.goToPage(2);

vm.paginatedItems$.subscribe((items) => console.log('Page items:', items));
console.log(vm.totalPages$.get());
```

### Dependency Injection

```typescript
import { DIContainer } from '@web-loom/mvvm-core';

const container = new DIContainer();

container.registerSingleton('UserService', () => new UserService());
container.registerTransient('UserViewModel', () => new UserViewModel());

const userService = container.resolve<UserService>('UserService');
```

## Best Practices

1. **Always dispose ViewModels**: Call `dispose()` when components unmount
2. **Use schemas for validation**: Define Zod schemas for all data types
3. **Leverage computed signals**: Derive state with `computed(() => ...)` — dependencies are tracked automatically
4. **Handle errors properly**: Observe `error$` and display to users
5. **Clean up subscriptions**: `subscribe()`/`observe()` return unsubscribe functions — call them on teardown
6. **Test business logic**: ViewModels are framework-agnostic and easily testable

## Testing

Signals make tests synchronous — read state directly with `.get()`:

```typescript
import { describe, it, expect } from 'vitest';
import { UserListViewModel } from './user-list.viewmodel';

describe('UserListViewModel', () => {
  it('should fetch users', async () => {
    const vm = new UserListViewModel();

    await vm.fetchCommand.execute();

    expect(vm.data$.get()).toBeDefined();
    expect(vm.isLoading$.get()).toBe(false);

    vm.dispose();
  });
});
```

## API Reference

### BaseModel

- `data$`: ReadonlySignal<T | null>
- `isLoading$`: ReadonlySignal<boolean>
- `error$`: ReadonlySignal<any>
- `setData(data: T | null): void`
- `setLoading(loading: boolean): void`
- `setError(error: any): void`
- `clearError(): void`
- `validate(data: unknown): T`
- `getCurrentData() / getCurrentLoadingStatus() / getCurrentError()`
- `dispose(): void` — setters no-op afterwards

### RestfulApiModel (extends BaseModel)

- `fetch(id?: string | string[]): Promise<void>`
- `create(payload): Promise<Item | Item[] | undefined>`
- `update(id: string, payload): Promise<Item | undefined>`
- `delete(id: string): Promise<void>`

### BaseViewModel

- `data$` / `isLoading$` / `error$`: ReadonlySignal passthroughs from the model
- `validationErrors$`: ReadonlySignal<ZodError | null>
- `dispose(): void`

### RestfulApiViewModel

- `fetchCommand`: Command<string | string[] | void, void>
- `createCommand`: Command<Partial<Item> | Partial<Item>[], void>
- `updateCommand`: Command<{ id: string; payload: Partial<Item> }, void>
- `deleteCommand`: Command<string, void>
- `selectedItem$`: ReadonlySignal<Item | null> + `selectItem(id | null)`

### Command

- `isExecuting$`: ReadonlySignal<boolean>
- `canExecute$`: ReadonlySignal<boolean> (computed; false while executing)
- `executeError$`: ReadonlySignal<any>
- `execute(param: TParam): Promise<TResult | undefined>`
- `observesProperty(sig)` / `observesCanExecute(sig | fn)` / `raiseCanExecuteChanged()`
- `dispose(): void`

## TypeScript Support

Full TypeScript support with comprehensive type definitions:

```typescript
import type { ICommand, IDisposable, IBaseModel, Fetcher, CanExecuteSource } from '@web-loom/mvvm-core';
import type { ReadonlySignal, WritableSignal } from '@web-loom/signals-core';
```

## Dependencies

- **@web-loom/signals-core**: reactive signals substrate
- **zod**: ^3.25.0 (schema validation)
- **@web-loom/query-core**: (for QueryStateModel)
- **rxjs**: not required — optional interop via `@web-loom/signals-core/rxjs`

## License

MIT
