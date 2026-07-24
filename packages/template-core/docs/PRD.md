# Product Requirements Document

## `@web-loom/template-core` — Web Loom's native signal-driven template engine

**Status:** Draft v1.0 (synthesized)
**Supersedes:** `docs/research/{chatgpt,deepseek,mistral,perplexity}-prd.md` (kept for provenance)
**Depends on:** `@web-loom/signals-core`

---

## 1. Vision & Positioning

Web Loom's architecture claim is that a **ViewModel built on `mvvm-core` + `signals-core` survives a
framework change** — only the View layer needs rewriting. That claim is currently taken on faith:
every existing demo app (`mvvm-react`, `mvvm-vue`, `mvvm-angular`, `mvvm-lit`, `mvvm-marko`,
`mvvm-vanilla`) proves it by hand-rolling a small bridge that subscribes its own rendering model to
the same signals:

| App     | Bridge                                                                        |
| ------- | ----------------------------------------------------------------------------- |
| React   | `useSignal(sig)` → `useSyncExternalStore(sig.subscribe, sig.get, sig.get)`    |
| Vue     | `useSignal(sig)` → `shallowRef` seeded via `.peek()`, updated via `observe()` |
| Angular | `fromLoomSignal(sig, destroyRef)` → mirrors into a native Angular `signal()`  |
| Lit     | manual `@state()` field updated via `observe()` in `connectedCallback`        |
| Marko   | `subscribeToObservable(sig, updateFn)` wrapping `observe`/`subscribe`         |
| Vanilla | direct `observe(vm.data$, callback)` calls that manually patch the DOM        |

Every one of them needs _something_ between the signal and the screen. `@web-loom/template-core` is
the demonstration that you don't need anything at all: the template's binding _is_ the subscription.
It is the "no adapter required" View — the native option alongside React/Vue/Angular/Lit/Marko/Qwik
adapters, not a replacement for them.

**This is the lead goal.** Everything else in this document (syntax, performance, architecture) is in
service of proving that a `signals-core` ViewModel is genuinely render-target-agnostic, with
`template-core` as the zero-dependency baseline that every other adapter can be measured against.

## 2. Goals

1. Prove MVVM portability: the exact same ViewModel that powers `mvvm-react` should be mountable via
   `template-core` with no bridge code.
2. Signal-first: templates bind directly to `@web-loom/signals-core` signals — no VDOM, no
   reconciliation, no component re-render.
3. Familiar syntax: Mustache/Handlebars-inspired, readable by anyone who has used either.
4. Fine-grained updates: a signal change touches only the DOM nodes/attributes that read it.
5. Small and dependency-free beyond `signals-core` (peer/runtime dependency only).
6. No compiler/build step required (runtime parsing is acceptable for v1); precompilation is a later
   optimization, not a v1 requirement.

## 3. Non-Goals

- Not a React/Vue/Solid/Angular replacement or wrapper — those adapters remain first-class.
- Not a general-purpose templating library for non-Web-Loom projects.
- Not a virtual DOM implementation.
- Not a router, state manager, or CSS solution.
- Not (in v1) a compiler with static analysis/precompilation — see Roadmap Phase 3.
- Two-way binding is not a separate reactive primitive (see §6.5) — it is sugar over explicit
  attribute + event bindings, keeping data flow traceable.
- No `{{#await}}` block (present in the ChatGPT draft; deliberately cut, not overlooked):
  `mvvm-core` Models/ViewModels already expose async state as `data$`/`isLoading$`/`error$` signals,
  so `{{#if isLoading$}}…{{else if error$}}…{{else}}…{{/if}}` renders loading/error/success states
  idiomatically without adding a second async primitive to the grammar.
- No arbitrary JavaScript in templates — expressions are a deliberately tiny, CSP-safe subset
  (see §6.7). Anything more complex belongs in a `computed()` on the ViewModel.

## 4. Target Users

- Web Loom app authors who want a zero-framework rendering option.
- Contributors building the next demo app (`mvvm-template-core` or similar) to complete the
  cross-framework adapter matrix.
- Anyone evaluating whether Web Loom's MVVM boundary is real or aspirational.

## 5. Signal Resolution Semantics

This is the part the four draft PRDs disagreed on most, and it's foundational, so it's specified
first.

- A bound value is resolved via `isSignal(value)` (from `@web-loom/signals-core`'s guards) — **never**
  by property name. The repo-wide `$` suffix (`count$`, `todos$`) remains the recommended authoring
  convention (it's how `mvvm-core` and every ViewModel in `packages/view-models` already names
  reactive properties) but the engine does not require or pattern-match on it.
- If `isSignal(value)` is true: the binding reads it via `.get()` inside an `effect()`, so the binding
  re-runs whenever that signal changes. `effect()` returns `{ dispose() }`, which the runtime
  aggregates into the template's overall `Disposable`.
- If `isSignal(value)` is false: the value is read once (a plain value, a plain function for
  `on:` targets, a plain string, etc.) and never re-evaluated.
- Nested paths (`{{ user.name }}`) walk each segment and unwrap a signal at _any_ level: `user` may
  itself be a signal of an object, or a plain object whose `name` property is a signal, or both.
  Resolution unwraps a signal wherever one is encountered along the path, tracking every signal it
  passes through as a dependency of that binding's `effect()`.
- Every `on:`/`bind:` handler the engine generates is automatically wrapped in `batch()`
  (re-exported from `signals-core`), so multiple synchronous signal writes inside one handler re-run
  dependent bindings once, not once per write. Authors only reach for `batch()` themselves when
  writing signals outside template-bound handlers.

```ts
import { signal, computed } from '@web-loom/signals-core';

const vm = {
  title$: signal('Todos'),
  todos$: signal([{ id: 1, text: 'Milk' }]),
  remaining$: computed(() => vm.todos$.get().filter((t) => !t.done).length),
};
```

```html
<h1>{{ title$ }}</h1>
<p>{{ remaining$ }} left</p>
```

No `.get()` appears in the template — the engine unwraps signals for you; authors write `{{ title$ }}`,
not `{{ title$.get() }}`.

## 6. Grammar Specification

### 6.1 Interpolation

- `{{ expr }}` — HTML-escaped text interpolation. Establishes a reactive binding if `expr` resolves to
  a signal (at any point along a nested path).
- `{{{ expr }}}` — unescaped/raw HTML. Explicit opt-in only; author is responsible for trusting or
  sanitizing the content.
- `{{! comment }}` — stripped at parse time, never rendered.

### 6.2 Conditionals — explicit, not overloaded

Unlike classic Mustache (and the DeepSeek draft), `{{#x}}...{{/x}}` is **not** overloaded to mean
"truthy section" _and_ "iterate if array" based on the runtime type of `x`. A signal's value can
change type over time (`undefined` → array, once data loads), which makes type-based dispatch a
correctness trap. Conditionals and iteration use distinct tags:

```html
{{#if isAdmin$}}
<p>Admin console</p>
{{else if isLoggedIn$}}
<p>Welcome, {{ user.name$ }}</p>
{{else}}
<a href="/login">Log in</a>
{{/if}}
```

`{{else if expr}}` chains are supported; conditions are evaluated top-down and only the first
truthy branch mounts.

```html
{{#switch status$}} {{#case "loading"}}
<p>Loading…</p>
{{/case}} {{#case "error"}}
<p>{{ error$ }}</p>
{{/case}} {{#default}}
<p>Ready</p>
{{/default}} {{/switch}}
```

`{{#case}}` values compare with strict equality (`===`); `{{#default}}` mounts when no case matches.

Only the active branch's bindings are subscribed; switching branches disposes the old branch's
effects before mounting the new one. A branch that toggles off and back on is rebuilt from the
blueprint — transient DOM state inside it (uncommitted input values, focus, scroll position) is not
preserved across the toggle; state that must survive belongs in a signal.

### 6.3 Iteration

```html
<ul>
  {{#each todos$ key=id}}
  <li class:done="completed">{{ @index }}: {{ text }}</li>
  {{else}}
  <li class="empty">Nothing to do</li>
  {{/each}}
</ul>
```

- `key=` is required for any list that can reorder/insert/remove without a full unkeyed
  wipe-and-rebuild — the renderer preserves existing DOM nodes for stable keys. The value is a path
  into the item (`key=id`); use `key=this` for arrays of primitives.
- `{{else}}` inside `{{#each}}` renders when the list is empty (Handlebars precedent) — no separate
  `{{#if todos$.length}}` wrapper needed for the common empty-state case.
- Per-item scope: `{{ this }}` (current item), `{{ ../title }}` (parent scope), plus iteration
  helpers `{{ @index }}`, `{{ @first }}`, `{{ @last }}`, `{{ @even }}`, `{{ @odd }}`.
- `todos$` may be a signal of an array or a plain array; if it's a signal, the loop's outer binding
  re-runs (keyed-diffs) only when the array signal itself changes.

**Per-item reactivity contract.** Two item shapes are supported, and they trade differently:

1. **Plain items + immutable array updates** (the §5 example: `{ id, text }`): editing an item means
   replacing the array (`todos$.update(...)`), which triggers a keyed diff. Items whose key survives
   keep their DOM node; if the object _reference_ behind a surviving key changed, that item's
   bindings re-resolve against the new object (the node is preserved, its bound text/attributes
   update).
2. **Items with signal properties** (`{ id, text$: signal('Milk') }`): property edits flow through
   the per-item bindings directly — no array write, no list diff at all. The array signal only fires
   for add/remove/reorder. Recommended for large or frequently-edited lists, since update cost is
   O(1) per edit instead of O(list) per diff.

### 6.4 Attribute & Behavioral Bindings

Two families, chosen to avoid both DeepSeek's `attr="{{ handler }}"` double-wrapping and ChatGPT's
inconsistent mix of bare `@click` alongside `{{ }}`-wrapped attributes:

- **Plain interpolation** for ordinary string attributes — no prefix needed:
  `<img src="{{ photo$ }}" alt="{{ altText$ }}">`, `<div class="card {{ theme$ }}">`.
- **Directive prefixes** for typed/behavioral bindings, where the value is a bare expression
  (see §6.7 for the expression grammar), not `{{ }}`-wrapped:
  - `:name="expr"` — property-or-attribute binding, e.g. `<input :disabled="isSubmitting$">`.
    **Resolution rule** (property and attribute assignment are _different operations_ with different
    behavior): if `name` is a property of the element (`name in element`), assign the property —
    required for `value`, `checked`, etc., where the HTML attribute only sets the _default_;
    otherwise `setAttribute` — which covers `aria-*`, `data-*`, and SVG attributes. Boolean values
    toggle attribute presence / set property truthiness.
  - `class:name="expr"` — toggles a single class based on a boolean(-ish) value, e.g. `class:active="isActive$"`.
  - `style:prop="expr"` — binds one CSS property, e.g. `style:color="theme$"`.
  - `on:event="expr"` — binds a DOM event. Two forms:
    - **Bare path** — `on:click="increment"`: the path is resolved through the scope chain (item
      scope → enclosing scopes → ViewModel) and invoked as `fn(event)`.
    - **Call form** — `on:click="remove(this)"` or `on:click="setPage(@index)"`: evaluated per the
      expression grammar (§6.7) with the scope's `this` (current `{{#each}}` item), `$event` (the
      DOM event), and iteration helpers available as arguments. This is how a handler inside a loop
      knows _which_ item it acts on — the classic list-item-action case.
    - All generated handlers are wrapped in `batch()` automatically (§5).
  - `on:event.modifier` — event modifiers, chainable: `.prevent`, `.stop`, `.once`, `.capture`,
    `.passive`, plus key filters `.enter` / `.escape` for keyboard events, e.g.
    `<input on:keydown.enter="addTodo">`. (Phase 2.)
  - `use:action="expr"` — element directive: `expr` resolves to
    `(el: Element) => void | { dispose(): void }`, called with the real element on mount; a returned
    `dispose` runs on teardown. This is the escape hatch for element refs (focus, measurement,
    third-party init) **and the seam to the rest of the Web Loom ecosystem**: `ui-core` headless
    behaviors (Dialog, RovingFocus, List), `charts-core`, and `media-core` all attach to a raw
    element, so `use:` lets them plug into a template with zero framework glue. (Phase 2.)

### 6.5 Two-way Binding (sugar)

`bind:value="name$"` desugars to `:value="name$"` (or the relevant property for the element type) plus
an `on:input` handler that calls `name$.set(event.target.value)`. It is not a new primitive — it is
generated from the same `:` / `on:` bindings above, so data flow remains traceable to a plain read and
a plain event handler.

### 6.6 Composition: Multiple Templates vs. Partials

These are two different things, and the grammar only needs new machinery for the second one.

**Multiple independent templates — already free, Phase 1.** `compile()` is a plain function; nothing
stops an app from calling it many times and mounting the results into different containers, or nesting
one template's output inside another by manually appending `template.render(vm)`'s returned node. No
registry, no special API — this is just calling a function more than once.

```ts
const header = compile(`<header>{{ title$ }}</header>`);
const body = compile(`<main>{{#each todos$ key=id}}<li>{{ text }}</li>{{/each}}</main>`);

header.mount(document.querySelector('#header')!, vm);
body.mount(document.querySelector('#body')!, vm);
```

**Partials (`{{> name }}`) — Phase 2, needs a name → `Template` lookup.** Unlike the above, a partial
is referenced _by name from inside another template's markup_, so `compile()` needs somewhere to
resolve `name`:

```ts
const header = compile(`<header>{{ title$ }}</header>`);

const page = compile(
  `
  {{> header }}
  <main>{{#each todos$ key=id}}<li>{{ text }}</li>{{/each}}</main>
  {{> card user$ }}
`,
  {
    partials: {
      header, // already-compiled Template — reused as-is
      card: `<div class="card">{{ name }}</div>`, // raw source — compiled lazily on first reference, then cached
    },
  },
);
```

- `options.partials` (passed to `compile()`) is local and explicit — no hidden global state, matching
  §5's "explicit over magic" stance. A `registerPartial(name, source)` / `unregisterPartial(name)`
  global convenience is available for cross-page shared partials (headers/footers used by many
  templates); a local `options.partials` entry wins over the global registry on a name collision.
- **Context:** `{{> header }}` (no argument) inherits the enclosing scope as-is. `{{> card user$ }}`
  passes an explicit root context, resolved through the same signal-resolution rules as §5 — if `user$`
  is a signal whose _pointed-to object_ changes, the partial unmounts and remounts with the new
  context; property-level signal reads inside the partial stay independently reactive and don't force
  a remount.
- **Disposal:** a partial's `mount()` returns its own `Disposable`, which the parent template
  aggregates into its own — the same aggregation pattern `{{#if}}`/`{{#each}}` branches already use, so
  a single `view.dispose()` at the top tears everything down.
- A missing partial name is a dev-mode warning (ties into the debuggability goal in Roadmap Phase 3),
  not a silent no-op.

### 6.7 Expression Grammar

Everywhere this document says `expr`, it means a **deliberately tiny, CSP-safe expression subset** —
not JavaScript. This is a foundational constraint, not an implementation detail:

- **No `eval`, no `new Function`.** Runtime-evaluated engines that compile expression strings via
  `new Function` (Alpine.js is the canonical example) break under a strict Content-Security-Policy
  (`unsafe-eval`), which would contradict the "runs anywhere with no build step" goal (§2.6). The
  engine ships a small hand-rolled expression evaluator instead.
- **What an expression can contain:**
  - Literals: strings (`"loading"`), numbers, `true`/`false`/`null`.
  - Paths: dotted identifiers into the scope chain (`user.profile.name`), `this`, parent hops
    (`../title`), iteration helpers (`@index`, `@first`, …), and `$event` inside `on:` handlers.
    Signals encountered along a path are unwrapped per §5.
  - Helper calls: `formatDate(createdAt$)` — the callee resolves through `options.helpers`, then the
    scope chain; arguments are expressions.
  - Unary `!`; comparisons `===`, `!==`, `<`, `<=`, `>`, `>=`; logical `&&`, `||`, `??`.
- **What it cannot contain:** assignments, arithmetic chains, arbitrary method calls, `new`, template
  literals, ternaries — anything beyond the list above. This is a feature, not a limitation: complex
  logic belongs in a `computed()` on the ViewModel, where it is named, testable, and shared across
  every view — which is the MVVM position this whole package exists to demonstrate.
- **Whitespace:** lines containing only a block tag (`{{#each …}}`, `{{/if}}`, `{{else}}`) are
  trimmed (Mustache "standalone line" behavior), so block markers don't leave stray whitespace text
  nodes between list items.

## 7. Public API

```ts
import { compile } from '@web-loom/template-core';

const template = compile(`
  <h1>{{ title$ }}</h1>
  <button on:click="increment">{{ count$ }}</button>
`);

const view = template.mount(container, viewModel); // -> { dispose(): void }

// later
view.dispose();
```

- `compile<TVm extends object = object>(source: string, options?: TemplateOptions): Template<TVm>` —
  the generic documents the intended ViewModel shape at call sites. Expressions inside the template
  string are _not_ statically checked against `TVm` (a known limitation of string templates vs. JSX);
  the mitigation is dev-mode warnings when a bound path resolves to `undefined` on a mounted
  template (typo detection), mirroring the missing-partial warning in §6.6.
- `Template.mount(container: Element, viewModel: TVm): Disposable` — attaches the template to a
  live container, wiring every binding's `effect()`; returns a `Disposable` (matches the
  `dispose()` convention already used by `BaseViewModel`/`Command` in `mvvm-core`).
- `Template.render(viewModel: TVm): { node: DocumentFragment; dispose(): void }` — builds a
  detached, already-reactive DOM subtree for callers that manage insertion themselves. The
  `Disposable` is returned _alongside_ the node — a bare-`Node` return would leave the cleanup
  handle unreachable.
- `Template.renderToString(viewModel: TVm): string` — Phase 3 (SSR), not required for v1.

```ts
interface TemplateOptions {
  delimiters?: [string, string]; // default ['{{', '}}']
  escape?: boolean; // default true
  helpers?: Record<string, (...args: unknown[]) => unknown>;
  partials?: Record<string, string | Template>; // see §6.6 — Phase 2
}
```

### 7.1 Lifecycle & Ownership

`view.dispose()` tears down what the **template** created: its `effect()`s, event listeners, `use:`
action disposals, and partial sub-views. It does **not** dispose the ViewModel — a VM may outlive
its view, or be mounted into several templates at once (§6.6's multiple-templates case). VM
lifecycle stays with the caller, matching the repo-wide convention (execute a command on mount,
dispose the VM when _its owner_ is done with it):

```ts
const view = template.mount(container, vm);
vm.fetchCommand.execute();

// teardown — view first, then the VM if this caller owns it
view.dispose();
vm.dispose();
```

## 8. Architecture

```
Template Source
      │  parse
      ▼
   AST  ──────────────────────────────┐
      │  build render plan            │ (static analysis / precompilation — Phase 3)
      ▼                                │
Renderer (runtime/renderer.ts) ◀───────┘
      │  per binding
      ▼
effect() from @web-loom/signals-core
      │
      ▼
Exact DOM node / attribute / class / style update
```

Proposed layout, mirroring the pattern already used by other `-core` packages:

```
src/
  compiler/
    parser.ts        # template string -> AST (lexer + parser combined for v1)
  runtime/
    renderer.ts       # AST -> DOM, creates/attaches bindings
    bindings.ts        # signal resolution (isSignal duck-typing, nested paths, effect wiring)
    scheduler.ts        # re-exports/wraps signals-core batch(); no separate scheduler is invented
  directives/
    if.ts, switch.ts, each.ts (keyed reconciliation), events.ts, attributes.ts, classes.ts, styles.ts, bind.ts
  index.ts
```

The renderer **reuses `signal`/`computed`/`effect`/`batch`/`observe`/`isSignal` from
`@web-loom/signals-core` directly** rather than inventing a parallel reactivity or scheduling system —
`signals-core` is a workspace dependency, not a peer to be duck-typed against generically.

### 8.1 How Parsing Works

`compile()` does not hand-write an HTML tokenizer. It delegates HTML structure entirely to the
browser's own parser and only adds a thin layer for the vocabulary this engine defines on top of it —
this is also what makes §2's "no compiler/build step" goal viable at all:

1. **Marker pre-pass (string level).** Before the HTML parser ever sees the source, block tags and
   partial references (`{{#if}}`, `{{else}}`, `{{/if}}`, `{{#each}}`, `{{#switch}}`/`{{#case}}`,
   `{{> name }}`) are rewritten to HTML comments: `<!--loom:#each todos$ key=id-->` …
   `<!--loom:/each-->`. This is not cosmetic — it's a correctness requirement. Raw text between
   `<table>` and `<tr>` gets **foster-parented** by the HTML parser (relocated _outside_ the table),
   so text-form block markers inside table markup would silently end up in the wrong place before any
   walker runs. Comments are legal in every insertion context, tables included. (Knockout's
   containerless control flow used the same comment-marker trick for the same reason.) These anchors
   also double as the stable hydration markers Phase 3 SSR will need — the pre-pass is not throwaway
   work.
2. **Native parse.** The pre-processed string is assigned to a detached `<template>` element's
   `innerHTML` (or run through `DOMParser` where a `<template>` isn't suitable). The browser handles
   every real HTML concern for us — tag matching, attribute parsing (including the fact that
   `on:click`, `:disabled`, `class:active`, etc. are all syntactically legal HTML attribute names,
   even though the browser has no idea what they mean and does nothing with them), entity decoding,
   void elements, and nesting rules. This is the same technique Alpine.js and petite-vue use to stay
   build-step-free. `<template>` content is inert, so `<img>`/`<script>` inside it do not load or
   execute during compilation.
3. **Single walk, once, at `compile()` time.** A `TreeWalker` traverses the resulting
   `DocumentFragment` exactly once and builds the AST:
   - **Element nodes** — attributes matching the directive vocabulary (`on:*`, `:*`, `class:*`,
     `style:*`, `bind:*`, `use:*`) are extracted into binding records and **removed** from the
     element so they never leak into the live DOM as inert attributes. Plain attributes whose values
     contain `{{ }}` interpolation (`src="{{ photo$ }}"`) are likewise extracted and **neutralized in
     the blueprint** — a cloned instance must never briefly render a literal mustache or eagerly
     fetch `{{ photo$ }}` as a URL before the first effect runs. Everything else is left untouched as
     ordinary HTML.
   - **Text nodes** — `textContent` is tokenized by splitting on `{{{ }}}` / `{{ }}` delimiters into
     alternating static-string and expression segments.
   - **Comment markers** from step 1 are consumed with a small stack-based scan; the DOM range
     between an open/close pair is lifted into a nested sub-template (its own AST fragment), which is
     exactly the recursive structure §6.2/§6.3/§6.6 rely on.
4. **The parsed fragment becomes a reusable blueprint.** Directive and interpolated attributes
   stripped, block ranges lifted out — what remains is `cloneNode(true)`-ed per `mount()` call (and
   per `{{#each}}` item), the same clone-a-`<template>` idiom the platform itself already uses. There
   is no VDOM diff step; the nodes the browser already parsed are the nodes that ship.

Net effect: `template-core`'s own parser only has to understand a small vocabulary (two delimiter
pairs, five attribute prefixes, a handful of block-tag keywords) layered on real HTML — not HTML
itself. Plain, non-directive HTML in a template (ordinary tags, standard attributes, even a native
`onclick=""` if an author writes one) passes straight through untouched.

Things this pushes onto implementation, flagged for whoever builds Phase 1:

- `<script>`/`<style>` subtree text is not tokenized for `{{ }}` (avoid interpolating inside script
  text).
- Templates whose _root_ is an SVG (or MathML) child element (`<circle>`, `<path>`) parse wrong
  without namespace context — the compiler must detect this, wrap in the proper container
  (`<svg>…</svg>`) during parsing, and unwrap in the blueprint.
- Phase 3 SSR needs a DOM-less path (`DOMParser`/`<template>` don't exist in Node) — likely a
  lightweight parse shim (e.g. `linkedom`) swapped in only for that renderer target, without changing
  the AST or binding model above it.

## 9. Security

`{{ }}` escapes by default. `{{{ }}}` renders raw HTML and must be explicitly opted into per binding;
the engine does not attempt to sanitize — that responsibility stays with the author, same as every
other templating system that offers a raw-HTML escape hatch.

Beyond escaping, the architecture itself narrows the injection surface: bound values are applied at
runtime via `textContent` / `setAttribute` / property assignment, never string-concatenated into
markup, so classic markup-injection vectors don't exist outside `{{{ }}}`. Two residual notes:

- **URL contexts:** escaping doesn't help when the _value itself_ is dangerous — a `javascript:` URL
  bound into `href`/`src` is a live link. URL-bearing values from untrusted input should be validated
  in the ViewModel (allow-list `http(s):`), where the check is testable.
- **CSP:** because expressions use a hand-rolled evaluator (§6.7) rather than `new Function`, the
  engine runs under a strict CSP with no `unsafe-eval` — a concrete advantage over Alpine-style
  runtime engines.

## 10. Performance Targets

| Metric                                | Target                                              |
| ------------------------------------- | --------------------------------------------------- |
| Initial render (typical template)     | < 50ms                                              |
| Update latency (single signal change) | < 16ms (one frame)                                  |
| Runtime bundle size                   | < 20KB gzipped                                      |
| DOM nodes patched per update          | proportional to changed bindings, not template size |

Targets are unfalsifiable without a reference workload, so they are measured against two named
benchmarks: (a) the todo-list template from §8's examples (the "typical template"), and (b) a
js-framework-benchmark-style keyed table — create 1,000 rows, update every 10th row, swap two rows —
which is what exercises `{{#each}}` reconciliation. Phase 1 lands with both as runnable benchmark
scripts so the numbers can pass or fail, not just aspire.

## 11. Roadmap

**Phase 1 — MVP (v0.9.0):** comment-marker pre-pass + native parse (§8.1), CSP-safe expression
evaluator (§6.7), `{{ }}`/`{{{ }}}` interpolation + escaping, `{{#if}}/{{else if}}/{{else}}`,
`{{#each}}` with keyed reconciliation and `{{else}}` empty block, `on:` (bare-path and call forms,
auto-`batch()`ed) / `:` (prop-vs-attr rule) / `class:` / `style:` bindings, `compile()` +
`Template.mount()`, dispose/cleanup, unit tests, and the two §10 benchmark scripts. This is the
smallest slice that proves §1's claim end to end (a real ViewModel from `packages/view-models`,
rendered with zero bridge code).

**Phase 2 — Advanced (v1.0.0):** `{{#switch}}`/`{{#default}}`, iteration helpers
(`@index`/`@first`/`@last`/`@even`/`@odd`), `bind:` two-way sugar, event modifiers
(`on:keydown.enter`, `.prevent`, `.stop`, …), `use:` element actions (the `ui-core`/`charts-core`/
`media-core` integration seam), partials (`{{> }}`), custom helpers.

**Phase 3 — Production:** `renderToString` (SSR), hydration (reusing §8.1's comment anchors),
precompilation/static analysis, dev-mode diagnostics (dependency inspection, unresolved-path and
invalid-expression warnings), source maps for template debugging.

## 12. Success Criteria

- A ViewModel already used by `mvvm-react` (or another existing adapter) mounts via `template-core`
  with no adapter/bridge code — the concrete proof of §1's claim.
- Signal changes produce surgical DOM updates (no full-template re-render) verified by tests that
  assert only the expected node(s) mutate.
- Bundle size and latency targets from §10 are met.
- Syntax is learnable by a developer with Mustache/Handlebars/Vue experience within minutes.

## 13. Provenance

This spec synthesizes four independent drafts (`docs/research/chatgpt-prd.md`,
`docs/research/deepseek-prd.md`, `docs/research/mistral-prd.md`, `docs/research/perplexity-prd.md`).
The ChatGPT and DeepSeek drafts were the most complete and form the backbone of §6–§8; grammar
ambiguities were resolved per §6.2, and the positioning in §1 — the actual gap across all four — was
added based on how this repo's existing adapters work today (see the table in §1), not by revisiting
the drafts again.
