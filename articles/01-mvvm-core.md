# `@web-loom/mvvm-core` — The Architecture Layer the Web Forgot

---

There's a moment most frontend engineers recognise. You've been asked to estimate how long a migration will take — React to Vue, web to React Native, monolith to micro-frontends. You open the codebase. Five minutes later you close your laptop and start drafting a longer estimate than anyone wanted to hear.

The problem isn't the new framework. The problem is that there's no seam. Business logic is everywhere: inside `useEffect` blocks, inside Redux selectors, inside custom hooks that call other hooks that eventually reach an API. The logic isn't wrong. It's just not *located*. There's no place you can point to and say "that's the application, and this other thing is the presentation." It's one big tangled layer.

`@web-loom/mvvm-core` is an attempt to give the web that seam.

---

## How We Got Here

The story of MVVM on the web has a beginning most people don't know about, a gap of about a decade, and a gradual rediscovery happening now.

John Gossman was an architect at Microsoft working on WPF — Windows Presentation Foundation — in 2005. WPF was a desktop UI framework that had to solve a hard problem: applications with rich business logic needed to be testable, and the UI couldn't be part of what you tested. UI is hard to instantiate in a test runner, it mutates in response to user actions rather than deterministic inputs, and it's inherently coupled to a rendering engine. You can't write a fast, stable unit test around a render tree.

Gossman's insight was to introduce a middle layer — the ViewModel — whose job was to translate the Model's raw data into exactly what the View needed to display. The ViewModel knew nothing about rendering. It was a plain class. You could instantiate it in a test, push data through it, and assert on its output without touching a pixel. The View subscribed to it. When the ViewModel changed, the View updated. The ViewModel never reached back into the View.

MVVM wasn't a radical departure from MVC. It was a clarification. It named the thing that had always been implicitly present in well-structured applications and gave it explicit, stable boundaries.

Knockout.js brought this pattern to the browser in 2010. Developers building data-heavy web apps in that era had ViewModels with observable properties, two-way binding, and clean separation between data and template. It worked well for its era.

Then React arrived in 2013 and everything before it got quietly archived.

---

## What Happened After React

React's component model was genuinely innovative. Declarative UI, a virtual DOM diffing algorithm, a clear mental model for rendering as a function of state — these were real advances. But React also made a choice that had long-term consequences: it blurred the layers.

`componentDidMount` was where you fetched data. `setState` was how you managed loading state. `this.state` was where both UI ephemera and server data lived together, alongside event handlers, formatted values, and validation logic. The component became a bucket. Everything went in.

The community built around this model. Redux arrived to give the bucket a global sibling, not to separate layers. Thunks and sagas were places to put async logic, but they were still React-ecosystem primitives. Hooks made things more composable but didn't introduce layering — a custom hook that fetches data, manages loading state, and formats output is still one undifferentiated unit of logic.

The rest of the industry moved differently. Android went all-in on ViewModel with Jetpack in 2017 and hasn't looked back. iOS introduced `ObservableObject` and `@Published` with SwiftUI. The .NET community toolkit ships `ObservableObject` and `RelayCommand`. Flutter developers reach for BLoC or Riverpod. These platforms didn't adopt MVVM out of nostalgia. They adopted it because it makes applications testable, navigable, and survivable as codebases grow.

The web got seventeen state management libraries. Same problem. Different marketing.

---

## What `@web-loom/mvvm-core` Provides

The package exports six things: `BaseModel`, `BaseViewModel`, `Command`, `CompositeCommand`, `RestfulApiModel`, and `RestfulApiViewModel`. There's also `ObservableCollection` and `BusyState` for tracking complex async operations.

All of them are plain TypeScript classes. No framework imports. RxJS is the only dependency, and it's a peer dependency — you bring your own version.

### The Model

`BaseModel<TData, TSchema>` is a container for reactive state. It uses three `BehaviorSubject`s internally — one for data, one for loading status, one for errors — and exposes them as read-only `Observable`s. The Model doesn't know anything about how its data will be displayed.

```typescript
import { BaseModel } from '@web-loom/mvvm-core';
import { z } from 'zod';

const TaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  done: z.boolean(),
});

type Task = z.infer<typeof TaskSchema>;

class TaskModel extends BaseModel<Task[], typeof TaskSchema> {
  constructor() {
    super({ schema: TaskSchema.array() });
  }

  async fetchAll(): Promise<void> {
    this.setLoading(true);
    try {
      const res = await fetch('/api/tasks');
      const data = await res.json();
      this.setData(this.validate(data)); // Zod validates here
      this.clearError();
    } catch (err) {
      this.setError(err);
    } finally {
      this.setLoading(false);
    }
  }
}
```

The optional Zod schema integration means your data contract is enforced at the boundary — before malformed API responses make it into your application state. The Model throws a `ZodError` if validation fails, which surfaces through `error$` in the ViewModel.

### The ViewModel

`BaseViewModel<TModel>` accepts a Model instance and immediately exposes its three observables: `data$`, `isLoading$`, and `error$`. It provides a `dispose()` method that tears down all internal subscriptions when the View is unmounted.

The important thing about the ViewModel is what it *doesn't* contain: no `import React from 'react'`, no `import { ref } from 'vue'`, no Angular decorator. It's a class.

```typescript
import { BaseViewModel } from '@web-loom/mvvm-core';
import { map } from 'rxjs/operators';

class TaskListViewModel extends BaseViewModel<TaskModel> {
  // Derived state: computed from data$, updated reactively
  readonly pendingCount$ = this.data$.pipe(
    map(tasks => (tasks ?? []).filter(t => !t.done).length)
  );

  readonly completedTasks$ = this.data$.pipe(
    map(tasks => (tasks ?? []).filter(t => t.done))
  );

  // Command: encapsulates the async operation + its state
  readonly fetchCommand = this.registerCommand(
    new Command(() => this.model.fetchAll())
  );

  readonly toggleCommand = this.registerCommand(
    new Command(async (id: string) => {
      const current = this.model.getCurrentData() ?? [];
      const updated = current.map(t =>
        t.id === id ? { ...t, done: !t.done } : t
      );
      this.model.setData(updated);
      await fetch(`/api/tasks/${id}/toggle`, { method: 'POST' });
    })
  );
}
```

Notice `registerCommand`. It's not just syntactic sugar. Commands registered this way are automatically disposed when you call `vm.dispose()`. No dangling subscriptions. No memory leaks.

### The Command

The `Command` class is where a lot of the ergonomic value lives. Every async operation in your application — every button click that triggers a network request — is a candidate for a Command.

```typescript
const cmd = new Command(async (payload: CreateTaskInput) => {
  await api.createTask(payload);
});

// Three observables you get for free:
cmd.isExecuting$  // → Observable<boolean>
cmd.canExecute$   // → Observable<boolean>
cmd.executeError$ // → Observable<any>

// Execute it
await cmd.execute({ title: 'Buy groceries', done: false });
```

`canExecute$` is where the Command pattern earns its keep. By default it's `true`, but you can make it conditional:

```typescript
// Only executable when a selection exists
const deleteCommand = new Command(() => this.deleteSelected())
  .observesProperty(this.selectedItem$)        // truthy check
  .observesCanExecute(this.isNotBusy$);         // explicit boolean

// Or using the canExecute constructor arg
const submitCommand = new Command(
  () => this.submit(),
  this.isFormValid$  // Observable<boolean>
);
```

`canExecute$` also automatically returns `false` while the command is executing — preventing double-submits without any manual logic in the View.

### Connecting to Frameworks

The ViewModel sits above the framework. Connecting it means writing one thin subscription bridge per framework — usually a hook or a composable.

**React:**
```tsx
function useObservable<T>(obs$: Observable<T>, initial: T): T {
  const [value, setValue] = useState(initial);
  useEffect(() => {
    const sub = obs$.subscribe(setValue);
    return () => sub.unsubscribe();
  }, [obs$]);
  return value;
}

function TaskList() {
  const vm = useMemo(() => new TaskListViewModel(new TaskModel()), []);
  const tasks    = useObservable(vm.data$, []);
  const pending  = useObservable(vm.pendingCount$, 0);
  const loading  = useObservable(vm.isLoading$, false);

  useEffect(() => {
    vm.fetchCommand.execute();
    return () => vm.dispose();
  }, [vm]);

  return (
    <div>
      <p>{pending} tasks remaining</p>
      {loading && <Spinner />}
      {tasks.map(task => (
        <button key={task.id} onClick={() => vm.toggleCommand.execute(task.id)}>
          {task.title}
        </button>
      ))}
    </div>
  );
}
```

**Vue 3:**
```vue
<script setup>
const vm = new TaskListViewModel(new TaskModel());
const tasks   = ref([]);
const pending = ref(0);
const loading = ref(false);

const subs = [
  vm.data$.subscribe(v       => tasks.value   = v ?? []),
  vm.pendingCount$.subscribe(v => pending.value = v),
  vm.isLoading$.subscribe(v  => loading.value = v),
];

onMounted(() => vm.fetchCommand.execute());
onUnmounted(() => { subs.forEach(s => s.unsubscribe()); vm.dispose(); });
</script>
```

The ViewModel class is **the same file** in both cases. What changes is a handful of lines in the View layer — the subscription syntax native to each framework.

---

## Testing Without a DOM

Because the ViewModel has no framework imports, you can test it with Vitest or Jest without mounting components, setting up test renderers, or mocking React internals.

```typescript
import { describe, it, expect, vi } from 'vitest';
import { firstValueFrom } from 'rxjs';
import { skip } from 'rxjs/operators';

describe('TaskListViewModel', () => {
  it('derives pending count from model data', async () => {
    const model = new TaskModel();
    const vm    = new TaskListViewModel(model);

    model.setData([
      { id: '1', title: 'A', done: false },
      { id: '2', title: 'B', done: true },
      { id: '3', title: 'C', done: false },
    ]);

    const count = await firstValueFrom(vm.pendingCount$);
    expect(count).toBe(2);

    vm.dispose();
  });

  it('sets loading during fetch', async () => {
    const model = new TaskModel();
    vi.spyOn(model, 'fetchAll').mockResolvedValue(undefined);
    const vm = new TaskListViewModel(model);

    const loadingStates: boolean[] = [];
    vm.isLoading$.subscribe(v => loadingStates.push(v));

    await vm.fetchCommand.execute();

    expect(loadingStates).toContain(true);
    expect(loadingStates[loadingStates.length - 1]).toBe(false);
    vm.dispose();
  });
});
```

No `renderHook`. No `act`. No waiting for the DOM to update. The ViewModel is a class. You instantiate it, poke it, and assert. Tests like these run in under 5ms. They're also testing the right thing: the logic that matters, not the rendering machinery around it.

---

## The Dispose Pattern

One detail that separates well-structured MVVM code from messy MVVM code is consistent resource cleanup. Every ViewModel has a `dispose()` method that:

1. Calls `dispose()` on each registered Command, completing their internal `BehaviorSubject`s
2. Triggers `_destroy$.next()` which completes any observable derived with `takeUntil(this._destroy$)`
3. Calls `_subscriptions.unsubscribe()` on all manually tracked subscriptions

You're expected to call `vm.dispose()` whenever a View unmounts. In React that's the return value of `useEffect`. In Vue it's `onUnmounted`. In Angular it's `ngOnDestroy`. In Web Components it's `disconnectedCallback`.

If you forget, subscriptions keep running, event handlers keep firing, and you have a memory leak. This is true of any reactive system — RxJS, MobX, Svelte stores. Web Loom makes the cleanup explicit and consistent rather than each developer reinventing a teardown strategy per component.

---

## `RestfulApiModel` and `RestfulApiViewModel`

For the common case of a CRUD API, the package ships `RestfulApiModel` and `RestfulApiViewModel` that handle the boilerplate:

```typescript
import { RestfulApiModel, RestfulApiViewModel } from '@web-loom/mvvm-core';

class ProductModel extends RestfulApiModel<Product> {
  constructor() {
    super({
      fetcher: async () => {
        const res = await fetch('/api/products');
        return res.json();
      },
    });
  }
}

class ProductViewModel extends RestfulApiViewModel<ProductModel> {}

const vm = new ProductViewModel(new ProductModel());
vm.fetchCommand.execute(); // loads data, manages loading/error state
```

`RestfulApiViewModel` comes with `fetchCommand`, `createCommand`, `updateCommand`, and `deleteCommand` pre-wired. For simpler applications, this gets you 80% of the way without writing any observable machinery yourself.

---

## Why This Structure Pays Off

I've seen two objections to MVVM on the web. The first is "it's more code." That's true for a simple component. A to-do item with one toggle does not need a Model and a ViewModel. The pattern makes sense when the logic is real — when there are derived values, multiple async operations, conditional enable/disable logic, complex error states.

The second objection is "we already have React Query / TanStack / SWR." Those tools are genuinely good at what they do: caching and deduplicating server state. But they don't provide the layer that decides *what the View needs*. They provide cache management. The ViewModel provides the computed properties, the formatted values, the filtered lists, the business rules about when an action is available. They can coexist — you can put a React Query cache behind a Model and expose ViewModel-derived state on top of it.

The payoff is compounding. When you add a mobile app and need to share logic with the web, the ViewModel is already portable. When you migrate from React 18 to React 19 or the next thing after React, the ViewModel doesn't change. When you want to write a test for a business rule, you don't need to mount a component tree to do it.

The seam that looks like extra work on day one is the thing that makes migrations not be rewrites on day five hundred.

---

## Installing

```bash
npm install @web-loom/mvvm-core rxjs
```

RxJS 7+ is required as a peer dependency. TypeScript 5+ is recommended.

The package is tree-shakeable — if you only use `BaseViewModel` and `Command`, that's all you'll ship.

---

The rest of this series covers the packages that surround `mvvm-core`: a zero-dependency signals implementation for cases where RxJS feels heavy, a typed event bus for cross-feature communication, a store for UI-only state, a query layer with stale-while-revalidate caching, and the higher-level MVVM patterns that handle dialogs, active-aware tabs, and other scenarios that don't fit in a plain ViewModel.

Start with the core. Add the pieces you need.
