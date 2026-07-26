# @web-loom/template-core

**Status: Phase 3 / v1.1 implemented; Phase 4 P0 implemented.** See [`docs/PRD.md`](./docs/PRD.md) and
[`.kiro/specs/template-core-phase3/`](../../.kiro/specs/template-core-phase3/) for the specification
and traceability records.

## What this is

Web Loom's architectural claim is that a ViewModel built on `@web-loom/mvvm-core` and
`@web-loom/signals-core` is render-target-agnostic — only the View layer changes when you swap
frameworks. Every existing demo app proves that claim by hand-writing a small bridge that subscribes
its rendering model to the same signals:

| App            | How it bridges to the ViewModel's signals                                          |
| -------------- | ---------------------------------------------------------------------------------- |
| `mvvm-react`   | `useSignal(sig)` → `useSyncExternalStore(sig.subscribe, sig.get, sig.get)`         |
| `mvvm-vue`     | `useSignal(sig)` → `shallowRef` seeded via `.peek()`, kept in sync via `observe()` |
| `mvvm-angular` | `fromLoomSignal(sig, destroyRef)` → mirrors into a native Angular `signal()`       |
| `mvvm-lit`     | manual `@state()` field updated via `observe()` in `connectedCallback`             |
| `mvvm-marko`   | `subscribeToObservable(sig, updateFn)` wrapping `observe`/`subscribe`              |
| `mvvm-vanilla` | direct `observe(vm.data$, callback)` calls that manually patch the DOM             |

`@web-loom/template-core` is the "no bridge needed" View: a Mustache/Handlebars-flavored template
syntax whose bindings _are_ `signals-core` subscriptions. No virtual DOM, no component re-render, no
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

## Grammar implemented in Phases 1 and 2

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
  <input :value="name$" :disabled="isSubmitting$" />
  <button on:click="save" class:primary="isPrimary$" style:color="theme$">Save</button>

  <!-- event bindings: bare path or call form (this/$event/@index available) -->
  {{#each items$ key=id}}
  <button on:click="remove(this)">Remove {{ @index }}</button>
  {{/each}}
</div>
```

Phase 2 also supports `{{#switch expr}}` with `{{#case value}}`/`{{#default}}`,
`bind:value`/`bind:checked`, chainable event modifiers, `use:action="expr"`, and
`{{> name context}}` partials. Use `registerPartial`/`unregisterPartial` for the global registry
or `compile(..., { partials })` for local overrides.

The integration APIs provide scoped composition for larger applications:

```ts
const registry = createTemplateRegistry({ card: cardTemplate });
const page = compile('{{> card}}', { registry, name: 'ProductPage' });
const outlet = createTemplateOutlet(document.querySelector('#route')!);
outlet.show(page, viewModel);
```

Local `partials` override the scoped registry, which overrides global registrations. Missing partials
warn by default; use `strictPartials: true` and `diagnostics` when unresolved composition should fail
or be routed through application logging. For form libraries that expose snapshots plus setter
actions, use explicit setter bindings:

```html
<input bind:value="form.email" bind:set="setEmail" />
```

`use:` actions may return `update()` and/or `dispose()` for reactive element behavior.

- Expressions are a small, hand-rolled, CSP-safe subset (literals, scope paths, helper calls, `!`,
  `===`/`!==`/`<`/`<=`/`>`/`>=`, `&&`/`||`/`??`) — not JavaScript. See PRD §6.7.
- Signal detection is duck-typed (`isSignal()`), never based on the `$` naming convention.
- `:name` assigns a DOM property when `name` is one (`value`, `checked`, …), otherwise `setAttribute`.
- `{{#each}}` requires `key=` (a path, or `key=this` for primitive arrays) and does keyed DOM-node-
  preserving reconciliation; items whose properties are themselves signals update with zero list diff.

## Reference application

[`apps/ecommerce-template-core`](../../apps/ecommerce-template-core) is the reference application
for the Phase 2 composition model. Its shell is assembled from named partials, its product list
uses a local product-card partial, and its search field, theme switch, event modifiers, and element
action exercise the corresponding runtime features against a real ecommerce ViewModel.

## Binding a ViewModel vs. binding a DTO snapshot

`compile(...).mount(el, context)` renders whatever object graph you hand it as `context` —
`{{ cart.items }}` only works if `context.cart.items` actually exists. Expression paths are plain
strings evaluated at runtime (PRD §6.7); there is no compiler checking a template against the shape
of `context`. A typo or a missing field doesn't throw — `{{#each}}`/`{{#if}}` just resolve to
`undefined` and render nothing, silently.

This bit the reference app. `apps/ecommerce-template-core`'s cart drawer binds the **live ViewModel
instance** into the template context (`bindings.cart = viewModel.cart`, i.e. the `CartViewModel`
itself), not an unwrapped data snapshot. `CartViewModel` exposed `cart` (a signal holding the full
`CartDto`), plus hand-picked computed mirrors `itemCount` and `subtotalCents` — added because the
header template needed them. Nobody had mirrored `items`, so `{{#each cart.items key=productId}}`
silently iterated nothing, while `{{ cart.itemCount }}` and `{{ cart.subtotalCents }}` rendered fine
because those specific fields happened to exist. The sibling React app (`apps/ecommerce-mvvm`) never
hit this: its container does `useSignalValue(cartViewModel.cart)`, unwraps the signal to a plain
`CartDto`, and passes that whole object as a typed prop, so `cart.items` is checked by `tsc` against
the real DTO interface at compile time — `template-core` has no equivalent check.

Two binding styles fall out of this, with different failure modes:

| Style                                                                             | What the template context holds                                                              | Failure mode when a field is missing                                                                          |
| --------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| **Bind the ViewModel** (what `ecommerce-template-core` does today)                | The live VM instance; templates read whatever signals/computeds/methods it happens to expose | Silent empty render — no error, easy to miss in review                                                        |
| **Bind an unwrapped DTO snapshot** (what `ecommerce-mvvm`'s React container does) | A plain data object (`cart.get()`), refreshed whenever the signal changes                    | Still untyped at template-authoring time, but the _producing_ side is a typed object `tsc`/your IDE can check |

Binding the ViewModel directly is more convenient — no manual unwrap-and-resubscribe glue per DTO —
which is why the reference app does it. But it means the ViewModel's public surface **is** the
template's data contract, and every field a template touches has to be deliberately mirrored onto
the ViewModel. Nothing keeps them in sync structurally.

**Practical guidance when authoring templates against a live ViewModel:**

- Before writing `{{ vm.someField }}` or `{{#each vm.someList}}`, open the actual ViewModel source
  and confirm `someField`/`someList` exists on it — don't assume it mirrors the underlying
  Model/DTO shape just because a sibling field (like `itemCount`) does.
- When a ViewModel wraps a DTO-shaped signal (`cart: ReadonlySignal<CartDto>`), prefer exposing the
  **whole DTO** as one bindable field over hand-picking individual computed mirrors (`items`,
  `itemCount`, `subtotalCents`, …) one at a time as templates happen to need them — hand-picking is
  exactly how this bug happened, and it will happen again for the next field a new template needs.
- A missing or renamed field is invisible until you look at the rendered DOM — there is no
  `tsc`/lint signal for it, since expressions are strings (see "Expressions are a small,
  hand-rolled... subset" above). Cover new template bindings with a DOM-asserting test
  (`@testing-library/dom` + `fireEvent`/`waitFor`, as in `apps/ecommerce-template-core/src/App.test.ts`)
  rather than relying on visual review alone.
- This risk is specific to the _view-binding_ layer, not to MVVM portability itself: Models and
  ViewModels can still be identical, framework-agnostic code shared across apps (as they are today
  between `ecommerce-mvvm` and `ecommerce-template-core`, aside from the drift this bug introduced)
  — the subtlety only shows up in how each View chooses to hand its ViewModel's data to the render
  layer.

## SSR, hydration, and precompilation

Server rendering is exposed from the DOM-free `@web-loom/template-core/ssr` entry point. It uses
`parse5`, so it can run in Node or an edge server without a browser global:

```ts
import { compile } from '@web-loom/template-core/ssr';

const page = compile('<h1>{{ title$ }}</h1>', { name: 'Home' });
const html = page.renderToString({ title$: 'Welcome' });
```

For Vite applications, [`@web-loom/template-core-vite-ssr`](../template-core-vite-ssr/README.md)
provides the reusable middleware-mode development server, production SSR entry loading, HTML
outlet composition, and safe initial-state serialization. The application still owns request data,
routing, ViewModels, and the decision about which part of the page is an SSR island.

Browser templates can serialize and hydrate compatible markup:

```ts
const template = compile('<p>{{ title$ }}</p>');
const html = template.renderToString(vm);
container.innerHTML = html; // normally inserted by the server response
const view = template.hydrate(container, vm);
```

Hydration reports mismatches through `diagnostics.warn` and remounts the affected template when
recovery is needed. For build pipelines, use the compiler entry point or the CLI:

```ts
import { precompile } from '@web-loom/template-core/compiler';
const module = precompile(source, { name: 'Home', sourcePath: 'src/home.html' });
```

The Node-safe compiler entry is used by the precompiler CLI and does not require browser globals:

```ts
import { precompileNode } from '@web-loom/template-core/compiler-node';
const module = precompileNode(source, { name: 'Home', sourcePath: 'src/home.html' });
```

```bash
npx template-core-precompile --input src/home.html --output dist/home.plan.json --name Home
```

The serialized plan is intentionally portable JSON; `@web-loom/template-core/ssr` can consume it
with `fromPrecompiled`. Static JavaScript type analysis and full source maps remain future work.

Phase 4 P0 plans include the executable node/element structure, stable plan version validation,
structured diagnostics, source-location metadata, and region-scoped hydration recovery. Diagnostics
can be collected without replacing the compatibility callbacks:

```ts
const template = compile(source, {
  name: 'Catalog',
  sourcePath: 'src/catalog.html',
  diagnostics: {
    report: (diagnostic) => telemetry.record(diagnostic),
  },
});
```

Hydration preserves matching DOM nodes and rebuilds only the mismatched root or dynamic block
region. A full container replacement is reserved for callers that cannot provide a structurally
compatible root.

## Development

```bash
cd packages/template-core
npm run dev            # vite build --watch
npm run build          # vite build
npm run test           # vitest --watch=false
npm run bench           # vitest bench --run — PRD §10 todo/table/SSR/precompiled benchmarks (reports, not CI-gated; jsdom isn't a real browser)
npm run bench:browser   # real-Chromium mount/update/keyed-swap/hydration/disposal benchmarks (via Playwright)
npm run size            # gzip-size check against the 20KB budget
npm run lint            # eslint src
npm run check-types     # tsc --noEmit
```

## Performance

Snapshot from the last `npm run bench:browser` run (real Chromium, not jsdom — see PRD §10 targets).
This is a point-in-time recording, not a live-tracked metric: re-run the command above and update this
table if you want a fresh number; nothing here is enforced in CI.

| Scenario                           | Median  | p95    | Budget | Result |
| ----------------------------------- | ------- | ------ | ------ | ------ |
| Mount (todo, 10 items)              | 0.7ms   | 1.0ms  | 50ms   | PASS   |
| Update (single signal write)        | 0.6ms   | 1.3ms  | 16ms   | PASS   |
| Keyed-list swap (2 of 1000 rows)    | 2.6ms   | 3.4ms  | 16ms   | PASS   |
| Hydration (todo, 10 items)          | 0.3ms   | 0.5ms  | 50ms   | PASS   |
| Disposal (table, 1000 rows)         | 1.6ms   | 3.9ms  | 16ms   | PASS   |

Recorded 2026-07-26 · Chromium 151.0.7922.34 · Node v24.13.1 · Linux (WSL2) · Intel i5-1135G7.

## Package relationships

- `@web-loom/signals-core` — runtime dependency; the reactivity primitives (`signal`, `computed`,
  `effect`, `batch`, `isSignal`) every binding is built on.
- `@web-loom/mvvm-core` — dev dependency, used only by the integration test; the ViewModel/Model/Command
  layer this template engine renders.
- `packages/view-models` — real ViewModels used across the demo apps; mounting one of these with no
  adapter code is Phase 1's success criterion (PRD §12).
