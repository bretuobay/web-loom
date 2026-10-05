---
series: introducing-web-loom
part: 3
summary: Writing presentation logic once in plain TypeScript, rendering it with React, Vue, vanilla JavaScript and a framework-free template, then testing it without a DOM.
---

# One ViewModel, Many Views

_Part 3 of 4 in the series "Introducing Web Loom"._

---

[Part 1](https://webloomframework.com/blog/a-playground-that-grew-into-a-framework) made a claim: in Web Loom, only the View layer knows which UI framework you're using. [Part 2](https://webloomframework.com/blog/from-rxjs-to-signals) covered the reactive primitive that makes the claim possible, the signal.

This part is the demonstration. I'll write one small ViewModel and then render it four different ways. The ViewModel never changes, and only the bridge does.

## The ViewModel

Here is a to-do list. It loads items, counts the unfinished ones and offers a "clear completed" action that is only enabled when there is something to clear.

```ts
import { Command } from '@web-loom/mvvm-core';
import { computed, signal } from '@web-loom/signals-core';

export type Todo = { id: number; title: string; done: boolean };

export class TodoListViewModel {
  private readonly todos = signal<Todo[]>([]);
  readonly items$ = this.todos.asReadonly();
  readonly remaining$ = computed(() => this.items$.get().filter((t) => !t.done).length);

  readonly loadCommand = new Command(async () => this.todos.set(await this.fetchTodos()));
  readonly clearDoneCommand = new Command(
    async () => this.todos.update((list) => list.filter((t) => !t.done)),
    () => this.items$.get().some((t) => t.done),
  );

  constructor(private readonly fetchTodos: () => Promise<Todo[]>) {}

  dispose() {
    this.loadCommand.dispose();
    this.clearDoneCommand.dispose();
  }
}
```

A few things are worth pointing out.

**State is private and writable, but public and read-only.** The View can read `items$` but can't call `set` on it. The only way to change the list is through a command, which keeps every mutation in one place.

**Derived state is just a function.** `remaining$` recomputes when `items$` changes, and only then. There's no memoisation to manage and no dependency array to keep in sync.

**Commands carry their own UI state.** Every `Command` exposes `isExecuting$`, which you can use for a spinner, and `canExecute$`, which you can use to disable a button. The second argument to `clearDoneCommand` is a can-execute condition. Because it reads a signal, it re-evaluates by itself whenever the list changes. A command is also never executable while it's already running, so double-clicks are handled for free.

**The data source is injected.** `fetchTodos` could call `fetch`, read from IndexedDB or return a fixture. In a larger app it would be a Web Loom `Model` with its own loading and error state. Here a function keeps the example short.

## View 1: React

React has a built-in hook for subscribing to external stores. A Web Loom signal already has the `subscribe` and `get` methods it expects, so the whole bridge is one line:

```tsx
const useSignal = <T,>(s: ReadonlySignal<T>) => useSyncExternalStore(s.subscribe, s.get, s.get);

function TodoList({ vm }: { vm: TodoListViewModel }) {
  const items = useSignal(vm.items$);
  const remaining = useSignal(vm.remaining$);
  const canClear = useSignal(vm.clearDoneCommand.canExecute$);
  useEffect(() => void vm.loadCommand.execute(), [vm]);

  return (
    <section>
      <p>{remaining} left</p>
      <ul>
        {items.map((t) => (
          <li key={t.id}>{t.title}</li>
        ))}
      </ul>
      <button disabled={!canClear} onClick={() => vm.clearDoneCommand.execute()}>
        Clear completed
      </button>
    </section>
  );
}
```

There's no `useState`, no `try/catch` and no loading flag declared in the component. Whoever creates the ViewModel also disposes of it, which in React is usually a `useEffect` cleanup one level up.

## View 2: Vue

Vue's bridge mirrors a signal into a `shallowRef`. `observe()` seeds the ref with the current value straight away and then keeps it in sync:

```vue
<script setup lang="ts">
const props = defineProps<{ vm: TodoListViewModel }>();
const items = useSignal(props.vm.items$);
const remaining = useSignal(props.vm.remaining$);
onMounted(() => props.vm.loadCommand.execute());
</script>

<template>
  <p>{{ remaining }} left</p>
  <ul>
    <li v-for="t in items" :key="t.id">{{ t.title }}</li>
  </ul>
  <button @click="vm.clearDoneCommand.execute()">Clear completed</button>
</template>
```

`useSignal` here is a short composable from the Vue demo app. It creates the ref, calls `observe`, and unsubscribes in `onUnmounted`.

## View 3: Vanilla JavaScript

With no framework at all, you subscribe and update the DOM yourself:

```ts
const vm = new TodoListViewModel(fetchTodos);
const count = document.querySelector('#remaining')!;
const button = document.querySelector<HTMLButtonElement>('#clear')!;

observe(vm.remaining$, (n) => (count.textContent = `${n} left`));
observe(vm.clearDoneCommand.canExecute$, (ok) => (button.disabled = !ok));
button.addEventListener('click', () => vm.clearDoneCommand.execute());
vm.loadCommand.execute();
```

It's more manual, but nothing is hidden, and it shows that there's no magic underneath the framework versions.

## The bridges, side by side

The Web Loom repo has demo apps for most major frameworks, and each one bridges the same signals in a few lines:

- **React:** `useSignal`, built on `useSyncExternalStore(sig.subscribe, sig.get, sig.get)`.
- **Vue:** `useSignal`, built on a `shallowRef` kept in sync by `observe()`.
- **Angular:** `fromLoomSignal(sig)`, which mirrors the value into a native Angular `signal()`.
- **Lit:** a `@state()` field updated by `observe()` in `connectedCallback`.
- **Vanilla:** `observe(sig, callback)`, updating the DOM directly.

Solid, Marko and React Native follow the same pattern. If you've ever moved an app from one framework to another, this list is the point of the whole project. The bridge is all you rewrite, because the logic was never in the View.

## View 4: No framework, but still declarative

Every bridge above has a cost: it translates signals into the framework's own reactivity, which then re-renders. Recently I've been experimenting with `@web-loom/template-core`, a small template engine where the bindings _are_ signal subscriptions. There's no virtual DOM and no adapter. A signal change updates exactly the text node or attribute that reads it.

```ts
import { compile } from '@web-loom/template-core';

const template = compile(`
  <p>{{ remaining$ }} left</p>
  <ul>{{#each items$ key=id}}<li>{{ title }}</li>{{/each}}</ul>
  <button on:click="clearDoneCommand.execute()" :disabled="!clearDoneCommand.canExecute$">
    Clear completed
  </button>
`);

const view = template.mount(document.querySelector('#app')!, vm);
// later: view.dispose() removes listeners and effects; the ViewModel is untouched
```

The `compile()` call needs no build step. It uses the browser's own HTML parser and a small expression evaluator that is safe under a strict content security policy (no `eval`, no `new Function`). A Vite plugin adds precompiled `.loom` files, and there's a separate package for server-side rendering.

To be clear, this is not meant to replace React or Vue. It's one more valid View, and it keeps the MVVM boundary honest. If a ViewModel works here with no framework at all, it really is framework-agnostic.

## Testing without a DOM

Because the ViewModel imports no UI code, you can test it with no renderer, no jsdom and no component harness:

```ts
import { describe, expect, it } from 'vitest';
import { TodoListViewModel } from './TodoListViewModel';

describe('TodoListViewModel', () => {
  it('counts what is left and enables clearing completed items', async () => {
    const vm = new TodoListViewModel(async () => [
      { id: 1, title: 'Write the article', done: true },
      { id: 2, title: 'Publish it', done: false },
    ]);

    await vm.loadCommand.execute();
    expect(vm.remaining$.get()).toBe(1);
    expect(vm.clearDoneCommand.canExecute$.get()).toBe(true);

    await vm.clearDoneCommand.execute();
    expect(vm.items$.get()).toHaveLength(1);
    expect(vm.clearDoneCommand.canExecute$.get()).toBe(false);
    vm.dispose();
  });
});
```

These tests run in milliseconds, and they test the logic that actually matters, not whether a button happens to render. ViewModels are tested this way throughout the Web Loom repo.

One habit is worth building early: **always dispose ViewModels.** Commands, computed values and subscriptions hold references. Whoever creates a ViewModel should call `dispose()` when its View goes away, whether that's in a React effect cleanup, Vue's `onUnmounted`, Angular's `DestroyRef` or a test's last line.

## Further reading

- **Framework guides** in the docs walk through a full app per framework: [React](https://webloomframework.com/docs/mvvm-react-use-case), [Vue](https://webloomframework.com/docs/mvvm-vue-use-case), [Angular](https://webloomframework.com/docs/mvvm-angular-use-case), [Lit](https://webloomframework.com/docs/mvvm-lit-use-case), [Solid](https://webloomframework.com/docs/mvvm-solid-use-case) and [vanilla JS](https://webloomframework.com/docs/mvvm-vanilla-use-case).
- **[Putting It All Together](https://webloomframework.com/blog/11-putting-it-all-together)** builds a complete feature using Models, ViewModels, the event bus, the query cache and headless UI behaviours.
- **The book** has a chapter per framework, starting with [Chapter 8: React Implementation with Hooks](https://webloomframework.com/book/chapter8), plus [Chapter 19: Testing MVVM Applications](https://webloomframework.com/book/chapter19).
- **Try it:** `npm create web-loom@latest` scaffolds a starter for React, Preact, Vue, Svelte, Solid, Lit, Qwik or vanilla JavaScript.

---

_Next in the series: **[Part 4 — Patterns in the Age of Agentic Coding](https://webloomframework.com/blog/patterns-in-the-age-of-agentic-coding)**, on the fact that AI wrote most of this code, and why I think patterns matter more because of that._
