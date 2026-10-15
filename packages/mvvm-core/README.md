# @web-loom/mvvm-core

Framework-agnostic MVVM library for building reactive web applications with signals and Zod validation.

## Overview

`@web-loom/mvvm-core` provides a complete MVVM (Model-View-ViewModel) implementation that works across React, Angular, Vue, Lit, and vanilla JavaScript. Built on `@web-loom/signals-core` for reactive state and Zod for type-safe validation, it simplifies state management and API interactions for client-heavy applications.

**Reactive property convention**: properties suffixed with `$` (e.g. `data$`, `canExecute$`) are reactive signals (`ReadonlySignal<T>`). Read them synchronously with `.get()` (auto-tracked inside `computed`/`effect`) or `.peek()` (untracked), and subscribe to changes with `.subscribe(fn)`, which returns an unsubscribe function. Use `observe(sig, fn)` from `@web-loom/signals-core` when you also want the current value delivered immediately.

RxJS is no longer a dependency. For genuinely stream-shaped needs at the Model edge (websockets, retry/backoff, complex event streams), use the interop in `@web-loom/signals-core/rxjs` (`toObservable` / `fromObservable`), which keeps RxJS an optional peer dependency.

## Installation

```bash
npm install @web-loom/mvvm-core zod
```

`@web-loom/signals-core` and `@web-loom/query-core` are installed automatically as dependencies; add `@web-loom/signals-core` explicitly if you import from it directly.

## Features

- **MVVM Pattern**: BaseModel, BaseViewModel, RestfulApiModel with clear separation of concerns
- **Reactive**: signal-powered reactive properties for `data$`, `isLoading$`, `error$`
- **Type-Safe**: Zod schema validation at compile-time and runtime
- **RESTful APIs**: Simplified CRUD with optimistic updates and auto state management
- **Command Pattern**: Encapsulated UI actions with auto-tracked `canExecute$` and `isExecuting$` states
- **Observable Collections**: Reactive lists with granular change events
- **Resource Management**: `dispose()` on Models, ViewModels and Commands for proper cleanup
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

Wraps a `RestfulApiModel` with ready-made CRUD commands and item selection. It is a standalone class — it does not extend `BaseViewModel`, so it has no `registerCommand()`/`addSubscription()`.

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

### Query Core integration

`QueryStateModel`/`QueryStateModelView` exist in this package's source but are **not exported** from its entry point yet. To use `@web-loom/query-core` today, subscribe to a `QueryCore` endpoint inside a `BaseModel` subclass and forward its state with `setData`/`setLoading`/`setError` (see the [Query Core docs](../query-core/README.md)).

## Framework Integration

### React

```tsx
import { useCallback, useMemo, useEffect, useSyncExternalStore } from 'react';
import type { ReadonlySignal } from '@web-loom/signals-core';

// Bind a signal to React — no initial value, no first-render flash
function useSignal<T>(sig: ReadonlySignal<T>): T {
  const subscribe = useCallback((onChange: () => void) => sig.subscribe(onChange), [sig]);
  const getSnapshot = useCallback(() => sig.get(), [sig]);
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
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

## Not Yet Exported

`FormViewModel`, `QueryableCollectionViewModel` and a `SimpleDIContainer` also exist in this package's source but are **not exported** from `@web-loom/mvvm-core`, so they can't be imported yet. For forms, use [`@web-loom/forms-core`](../forms-core/README.md); for filtering, sorting and pagination, derive state with `computed()` (and `debouncedSignal()` from `@web-loom/signals-core`).

## Best Practices

1. **Dispose ViewModels with their owner**: call `dispose()` when the component (or screen) that created the ViewModel goes away; disposal is permanent, so don't dispose app-lifetime singletons from a component
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
- `registerCommand(cmd)` / `addSubscription(teardown)` (protected)
- `dispose(): void`

### RestfulApiViewModel (standalone — not a BaseViewModel subclass)

- `data$` / `isLoading$` / `error$`
- `fetchCommand`: Command<string | string[] | void, void>
- `createCommand`: Command<Partial<Item> | Partial<Item>[], void>
- `updateCommand`: Command<{ id: string; payload: Partial<Item> }, void>
- `deleteCommand`: Command<string, void>
- `selectedItem$`: ReadonlySignal<Item | null> + `selectItem(id | null)`

### Command

- `isExecuting$`: ReadonlySignal<boolean>
- `canExecute$`: ReadonlySignal<boolean> (computed; false while executing)
- `executeError$`: ReadonlySignal<any>
- `execute(param: TParam): Promise<TResult | undefined>` — sets `executeError$` and re-throws on failure
- `observesProperty(sig)` / `observesCanExecute(sig | fn)` / `raiseCanExecuteChanged()`
- `dispose(): void`

## TypeScript Support

Full TypeScript support with comprehensive type definitions:

```typescript
import type { ICommand, ICompositeCommand, IBaseModel, IObservableCollection, Fetcher } from '@web-loom/mvvm-core';
import type { ReadonlySignal, WritableSignal } from '@web-loom/signals-core';
```

## Dependencies

- **@web-loom/signals-core**: reactive signals substrate
- **zod**: ^3.25.0 (schema validation)
- **@web-loom/query-core**: declared dependency (used by the internal, not-yet-exported `QueryStateModel`)
- **rxjs**: not required — optional interop via `@web-loom/signals-core/rxjs`

## License

MIT
