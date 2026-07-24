# @web-loom/template-core

**Status: Phase 1 (MVP) implemented.** See [`docs/PRD.md`](./docs/PRD.md) for the full specification
and [`.kiro/specs/template-core-phase1/`](../../.kiro/specs/template-core-phase1/) for the
requirements/design/tasks this implementation was built against. Partials, `{{#switch}}`, event
modifiers, `use:` actions, and SSR are Phase 2/3 — see [What's not here yet](#whats-not-here-yet).

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
adapter code — a signal change updates exactly the DOM node/attribute that read it. `src/integration.test.ts`
mounts a real `@web-loom/mvvm-core` `RestfulApiViewModel` (the same `data$`/`isLoading$`/`error$`/Command
shape every demo app shares) with zero bridge code, as the concrete proof.

It is **not** a replacement for the React/Vue/Angular/Lit/Marko adapters — it's one more valid View,
and the reference implementation that keeps the rest of the ecosystem honest about the MVVM boundary.
Reach for React/Vue/etc. when you want that framework's ecosystem; reach for `template-core` when you
want the same ViewModel rendered with zero framework dependency at all.

## Quick start

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
// later: view.dispose() — tears down effects/listeners, never touches vm's signals
```

No build step — `compile()` parses at runtime via the browser's native HTML parser plus a small
CSP-safe expression evaluator (no `eval`/`new Function`). See [`docs/PRD.md` §8.1](./docs/PRD.md) for
how that works.

## Grammar implemented in Phase 1

```html
<div>
  <!-- text interpolation, escaped by default -->
  <h1>{{ title$ }}</h1>
  <div>{{{ rawHtml$ }}}</div>

  <!-- conditionals -->
  {{#if isLoading$}}
    <p>Loading…</p>
  {{else if error$}}
    <p>{{ error$ }}</p>
  {{else}}
    <!-- keyed iteration, with an empty-state block and iteration helpers -->
    <ul>
      {{#each todos$ key=id}}
        <li class:done="done" data-index="{{ @index }}">{{ text }}</li>
      {{else}}
        <li>Nothing to do</li>
      {{/each}}
    </ul>
  {{/if}}

  <!-- attribute / property / class / style bindings -->
  <input :value="name$" :disabled="isSubmitting$">
  <button on:click="save" class:primary="isPrimary$" style:color="theme$">Save</button>

  <!-- event bindings: bare path or call form (this/$event/@index available) -->
  {{#each items$ key=id}}
    <button on:click="remove(this)">Remove {{ @index }}</button>
  {{/each}}
</div>
```

- Expressions are a small, hand-rolled, CSP-safe subset (literals, scope paths, helper calls, `!`,
  `===`/`!==`/`<`/`<=`/`>`/`>=`, `&&`/`||`/`??`) — not JavaScript. See PRD §6.7.
- Signal detection is duck-typed (`isSignal()`), never based on the `$` naming convention.
- `:name` assigns a DOM property when `name` is one (`value`, `checked`, …), otherwise `setAttribute`.
- `{{#each}}` requires `key=` (a path, or `key=this` for primitive arrays) and does keyed DOM-node-
  preserving reconciliation; items whose properties are themselves signals update with zero list diff.

## What's not here yet

Per the PRD roadmap — these throw a clear `TemplateSyntaxError` naming themselves as not-yet-supported
rather than silently doing nothing: `{{#switch}}`/`{{#case}}`, `{{> partial }}`, `bind:` two-way sugar,
event modifiers (`on:click.prevent`), `use:` element actions. `Template.renderToString` (SSR) and
hydration are also not implemented.

## Development

```bash
cd packages/template-core
npm run dev            # vite build --watch
npm run build          # vite build
npm run test           # vitest --watch=false
npm run bench           # vitest bench --run — PRD §10 todo/table benchmarks (reports, not CI-gated; jsdom isn't a real browser)
npm run size            # gzip-size check against the 20KB budget
npm run lint            # eslint src
npm run check-types     # tsc --noEmit
```

## Package relationships

- `@web-loom/signals-core` — runtime dependency; the reactivity primitives (`signal`, `computed`,
  `effect`, `batch`, `isSignal`) every binding is built on.
- `@web-loom/mvvm-core` — dev dependency, used only by the integration test; the ViewModel/Model/Command
  layer this template engine renders.
- `packages/view-models` — real ViewModels used across the demo apps; mounting one of these with no
  adapter code is Phase 1's success criterion (PRD §12).
