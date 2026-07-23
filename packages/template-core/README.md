# @web-loom/template-core

**Status: spec only — implementation not yet started.** See [`docs/PRD.md`](./docs/PRD.md) for the
full specification. This README describes what the package will be once Phase 1 lands.

## What this is

Web Loom's architectural claim is that a ViewModel built on `@web-loom/mvvm-core` and
`@web-loom/signals-core` is render-target-agnostic — only the View layer changes when you swap
frameworks. Every existing demo app proves that claim by hand-writing a small bridge that subscribes
its rendering model to the same signals:

| App | How it bridges to the ViewModel's signals |
|---|---|
| `mvvm-react` | `useSignal(sig)` → `useSyncExternalStore(sig.subscribe, sig.get, sig.get)` |
| `mvvm-vue` | `useSignal(sig)` → `shallowRef` seeded via `.peek()`, kept in sync via `observe()` |
| `mvvm-angular` | `fromLoomSignal(sig, destroyRef)` → mirrors into a native Angular `signal()` |
| `mvvm-lit` | manual `@state()` field updated via `observe()` in `connectedCallback` |
| `mvvm-marko` | `subscribeToObservable(sig, updateFn)` wrapping `observe`/`subscribe` |
| `mvvm-vanilla` | direct `observe(vm.data$, callback)` calls that manually patch the DOM |

`@web-loom/template-core` is the "no bridge needed" View: a Mustache/Handlebars-flavored template
syntax whose bindings *are* `signals-core` subscriptions. No virtual DOM, no component re-render, no
adapter code — a signal change updates exactly the DOM node/attribute that read it.

It is **not** a replacement for the React/Vue/Angular/Lit/Marko adapters — it's one more valid View,
and the reference implementation that keeps the rest of the ecosystem honest about the MVVM boundary.
Reach for React/Vue/etc. when you want that framework's ecosystem; reach for `template-core` when you
want the same ViewModel rendered with zero framework dependency at all.

## Syntax teaser

```ts
import { signal } from '@web-loom/signals-core';
import { compile } from '@web-loom/template-core';

const vm = {
  count$: signal(0),
  increment: () => vm.count$.update((n) => n + 1),
};

const template = compile(`
  <button on:click="increment">Count: {{ count$ }}</button>
`);

const view = template.mount(document.getElementById('app')!, vm);
// view.dispose() when done
```

See [`docs/PRD.md`](./docs/PRD.md) for the full grammar (conditionals, keyed iteration, attribute /
class / style bindings, two-way binding sugar) and the phased implementation roadmap.

## Development

```bash
cd packages/template-core
npm run dev            # vite build --watch
npm run build          # vite build
npm run test           # vitest --watch=false
npm run lint           # eslint src
npm run check-types    # tsc --noEmit
```

## Package relationships

- `@web-loom/signals-core` — the reactivity primitives (`signal`, `computed`, `effect`, `batch`,
  `observe`) that every binding is built on.
- `@web-loom/mvvm-core` — the ViewModel/Model/Command layer this template engine renders.
- `packages/view-models` — real ViewModels used across the demo apps; the first Phase 1 milestone is
  mounting one of these with no adapter code.
