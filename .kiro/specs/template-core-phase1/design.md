# Design Document: @web-loom/template-core Phase 1

## Overview

Phase 1 implements the MVP of Web Loom's signal-native template engine as specified in `packages/template-core/docs/PRD.md` §11: runtime compilation (marker pre-pass + native HTML parse), a CSP-safe expression evaluator, text/attribute/class/style/event bindings, `{{#if}}` and keyed `{{#each}}` control flow, and the mount/dispose lifecycle — culminating in a real ViewModel from `packages/view-models` mounting with zero bridge code.

The engine is a thin rendering layer over `@web-loom/signals-core`: every reactive binding is an `effect()`, every handler is `batch()`-wrapped, and signal detection is `isSignal()` duck-typing. No parallel reactivity system is introduced.

## Architecture

### Compile-Time Pipeline (runs once per `compile()` call)

```
Template Source (string)
      │
      ▼
┌──────────────────┐   {{#if}}/{{#each}}/{{else}}/{{/…}}  →  <!--loom:…-->
│ Marker Pre-pass  │   (string rewrite; survives table foster-parenting;
└────────┬─────────┘    standalone-line whitespace trimming)
      │
      ▼
┌──────────────────┐   detached <template>.innerHTML = source
│  Native Parse    │   (inert content: no fetches, no script execution;
└────────┬─────────┘    SVG-root sources wrapped in <svg> and unwrapped after)
      │
      ▼
┌──────────────────┐   single TreeWalker pass:
│  Compile Walk    │   • directive attrs → Binding Records, removed from DOM
└────────┬─────────┘   • interpolated attrs → Binding Records, neutralized
      │               • text nodes tokenized on {{{ }}} / {{ }}
      │               • comment markers → nested sub-templates (stack scan)
      ▼               • expression strings parsed to ExpressionNode ASTs
Blueprint (inert DocumentFragment) + AST (Binding Records, block sub-templates)
```

### Mount-Time Pipeline (runs per `mount()` call and per `{{#each}}` item)

```
Blueprint ──cloneNode(true)──▶ Instance DOM
                                    │
                    for each Binding Record:
                                    │
        ┌───────────────────────────┼─────────────────────────┐
        ▼                           ▼                         ▼
  static value              signal-backed value          on: handler
  (apply once,              effect(() => apply(          addEventListener(
   no effect)                 evaluate(expr, scope)))      batch-wrapped fn)
                                    │
                                    ▼
                      DisposalBag (effects + listeners + child instances)
                                    │
                                    ▼
                      MountedView { dispose() } — idempotent
```

### Component Responsibilities

**Marker Pre-pass (`compiler/preprocess.ts`)**

- Rewrite block open/close/else tags and `{{! }}` comments at string level
- Emit `<!--loom:#if expr-->`, `<!--loom:else-->`, `<!--loom:/if-->`, `<!--loom:#each expr key=…-->`, `<!--loom:/each-->`
- Trim standalone block-tag lines (Mustache standalone-line behavior)
- Leave `{{ }}` / `{{{ }}}` interpolations untouched (handled by the compile walk)

**Expression Parser & Evaluator (`compiler/expression.ts`)**

- Hand-rolled recursive-descent parser for the PRD §6.7 subset; no `eval`, no `new Function`
- Parse once at compile time into `ExpressionNode` ASTs; evaluate many times at runtime against a `Scope`
- Throw `TemplateSyntaxError` naming any disallowed construct at compile time

**Compile Walk (`compiler/parser.ts`)**

- One `TreeWalker` traversal producing the Blueprint + Binding Records
- Directive attribute extraction (`on:*`, `:*`, `class:*`, `style:*`) and removal
- Interpolated-attribute extraction and neutralization
- Text tokenization (skipping `<script>`/`<style>` subtrees)
- Comment-marker stack scan lifting block ranges into nested sub-templates
- Node addressing: each Binding Record stores a child-index path from the Blueprint root so the renderer can locate the corresponding node in any clone in O(depth)

**Binding Resolver (`runtime/bindings.ts`)**

- Path resolution over the Scope Chain with `isSignal()` unwrapping at every level
- Static-vs-reactive decision: if evaluation touched no signal, apply once without creating an effect
- Bare-path method invocation binds `this` to the owning object (`fetchCommand.execute` → `fetchCommand.execute.call(fetchCommand, event)`)

**Renderer (`runtime/renderer.ts`)**

- Clone Blueprint, walk Binding Records, create effects/listeners, aggregate into a `DisposalBag`
- Implements `mount()`, `render()`, and instance independence

**Directives (`directives/`)**

- `text.ts` — escaped/raw text application
- `attributes.ts` — prop-vs-attr rule, boolean handling, interpolated attributes
- `classes.ts`, `styles.ts` — class toggle / CSS property set-remove
- `events.ts` — bare-path and call forms, `batch()` wrapping, listener registration in the DisposalBag
- `if.ts` — branch selection effect; disposes outgoing branch before mounting incoming
- `each.ts` — keyed reconciliation (map of key → instance), `{{else}}` block, item scopes

**DisposalBag (`runtime/disposal.ts`)**

- Ordered collection of teardown callbacks (effect disposals, `removeEventListener`, child bag disposals)
- Idempotent `dispose()`; child bags for `{{#if}}` branches and `{{#each}}` items nest under the view's root bag

## Components and Interfaces

### Public API

```typescript
export function compile<TVm extends object = object>(source: string, options?: TemplateOptions): Template<TVm>;

export interface TemplateOptions {
  delimiters?: [string, string]; // default ['{{', '}}']
  escape?: boolean; // default true
  helpers?: Record<string, (...args: unknown[]) => unknown>;
}

export interface Template<TVm extends object = object> {
  mount(container: Element, viewModel: TVm): Disposable;
  render(viewModel: TVm): { node: DocumentFragment; dispose(): void };
}

export interface Disposable {
  dispose(): void;
}

export class TemplateSyntaxError extends Error {
  // offending tag or construct, plus source offset when available
}
```

### AST Model

```typescript
type TemplateNode = RootTemplate;

interface RootTemplate {
  blueprint: DocumentFragment; // inert; cloned per instance
  bindings: BindingRecord[];
  blocks: BlockRecord[];
}

type BindingRecord =
  | { kind: 'text'; path: NodePath; parts: TextPart[] } // mixed static/expr segments
  | { kind: 'raw-html'; path: NodePath; expr: ExpressionNode }
  | { kind: 'attr-interp'; path: NodePath; name: string; parts: TextPart[] }
  | { kind: 'prop-or-attr'; path: NodePath; name: string; expr: ExpressionNode }
  | { kind: 'class'; path: NodePath; name: string; expr: ExpressionNode }
  | { kind: 'style'; path: NodePath; prop: string; expr: ExpressionNode }
  | { kind: 'event'; path: NodePath; event: string; handler: ExpressionNode };

type BlockRecord =
  | { kind: 'if'; path: NodePath; branches: { condition: ExpressionNode | null; template: RootTemplate }[] }
  | {
      kind: 'each';
      path: NodePath;
      source: ExpressionNode;
      key: ExpressionNode;
      template: RootTemplate;
      empty?: RootTemplate;
    };

type NodePath = number[]; // child indices from blueprint root
type TextPart = { static: string } | { expr: ExpressionNode };
```

### Expression Model

```typescript
type ExpressionNode =
  | { kind: 'literal'; value: string | number | boolean | null }
  | { kind: 'path'; segments: string[]; parentHops: number } // '../x' → parentHops: 1
  | { kind: 'helper-call'; callee: string; args: ExpressionNode[] }
  | { kind: 'unary-not'; operand: ExpressionNode }
  | { kind: 'binary'; op: '===' | '!==' | '<' | '<=' | '>' | '>='; left: ExpressionNode; right: ExpressionNode }
  | { kind: 'logical'; op: '&&' | '||' | '??'; left: ExpressionNode; right: ExpressionNode };
```

### Scope Model

```typescript
interface Scope {
  parent: Scope | null; // for '../' hops and fallthrough resolution
  self: unknown; // 'this' — the current item (or the ViewModel at root)
  locals: Record<string, unknown>; // '@index', '@first', '@last', '@even', '@odd', '$event'
}
```

Resolution order for a path head: `locals` → `self` (own/inherited properties) → walk `parent` chain → `undefined`. Signals encountered at any segment are unwrapped via `.get()` (tracked when inside an effect). `@index` locals are themselves signals in keyed lists so a move updates `@index`-dependent bindings without re-creating the instance.

## Data Models

### Signal Integration Contract

| Concern                  | Mechanism (all from `@web-loom/signals-core`)         |
| ------------------------ | ----------------------------------------------------- |
| Reactive read            | `.get()` inside `effect()` — auto-tracked             |
| Static check             | `isSignal(value)` guard — never name-based            |
| Handler write coalescing | `batch(() => handler(event))`                         |
| Effect teardown          | `effect()` → `{ dispose() }` collected in DisposalBag |

### Keyed Reconciliation Data

```typescript
interface EachState {
  instances: Map<unknown, ItemInstance>; // key → live instance
  order: unknown[]; // keys in current DOM order
}

interface ItemInstance {
  scope: Scope; // self = item; locals.@index is a WritableSignal<number>
  nodes: Node[]; // the instance's top-level nodes (for moves)
  bag: DisposalBag;
  itemRef: unknown; // last-seen item reference, for same-key/new-reference re-resolution
}
```

Diff algorithm: single pass building the new key order; unchanged prefix/suffix skipped; removed keys → dispose + remove nodes; new keys → clone + mount before their successor; moved keys → `insertBefore` existing nodes (no re-clone); surviving keys with a changed `itemRef` → update `scope.self` and re-run the instance's bindings' effects.

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of the system. Properties bridge the human-readable requirements and machine-verifiable tests._

### Property 1: Build-free compilation

_For any_ valid Template Source, `compile()` returns a usable `Template` in a plain browser/jsdom environment with no bundler plugins and no `unsafe-eval`
**Validates: Requirements 1.1, 4.1**

### Property 2: Table-safe block markers

_For any_ template placing `{{#each}}` between `<table>`/`<tbody>` and `<tr>`, the rendered rows appear inside the table (never foster-parented before it)
**Validates: Requirements 1.2, 1.3**

### Property 3: Inert compilation

_For any_ template containing `<img src>` or `<script>`, compilation triggers no network fetch and no script execution
**Validates: Requirements 1.4**

### Property 4: Directive stripping

_For any_ compiled template, no `on:*`, `:*`, `class:*`, `style:*` attribute and no literal `{{` appears in mounted DOM markup
**Validates: Requirements 1.5, 1.6**

### Property 5: Script/style opacity

_For any_ `{{ }}` sequence inside `<script>` or `<style>` content, the text is rendered verbatim and no Binding is created
**Validates: Requirements 1.7**

### Property 6: SVG namespace preservation

_For any_ template rooted at an SVG child element, mounted nodes are in the SVG namespace
**Validates: Requirements 1.8**

### Property 7: Malformed-block rejection

_For any_ template with unclosed or mismatched block tags, `compile()` throws a `TemplateSyntaxError` naming the offending tag
**Validates: Requirements 1.9**

### Property 8: Escaping by default

_For any_ interpolated string containing HTML-special characters, `{{ }}` output creates no elements while `{{{ }}}` output parses as HTML
**Validates: Requirements 2.1, 2.2, 2.3**

### Property 9: Comment and nullish handling

_For any_ `{{! }}` comment, nothing renders; for any binding resolving to `null`/`undefined`, an empty string renders
**Validates: Requirements 2.4, 2.5**

### Property 10: Duck-typed reactivity

_For any_ ViewModel mixing signal and non-signal properties (regardless of `$` naming), signal-backed bindings update on change and non-signal bindings never re-evaluate
**Validates: Requirements 3.1, 3.2, 3.4**

### Property 11: Nested-path unwrapping

_For any_ path with signals at any combination of levels, the binding tracks every signal on the path and updates when any of them changes
**Validates: Requirements 3.3**

### Property 12: Surgical updates

_For any_ signal change, only DOM locations bound to that signal mutate (verified via MutationObserver counts)
**Validates: Requirements 3.5, 11.4**

### Property 13: Expression grammar acceptance and rejection

_For any_ expression within the §6.7 grammar, evaluation matches expected semantics; for any expression outside it, `compile()` throws naming the construct
**Validates: Requirements 4.2, 4.3**

### Property 14: Helper resolution order

_For any_ name present in both `options.helpers` and the ViewModel, the helper wins for call-form callees
**Validates: Requirements 4.4**

### Property 15: Standalone-line trimming

_For any_ block written on its own line, no whitespace-only text node is created between sibling instances
**Validates: Requirements 4.5**

### Property 16: First-truthy-branch mounting

_For any_ `{{#if}}`/`{{else if}}`/`{{else}}` chain and any condition values, exactly the first truthy branch (or `{{else}}`) is in the DOM
**Validates: Requirements 5.1, 5.2**

### Property 17: Branch swap disposal

_For any_ branch switch, the outgoing branch's effects stop firing (writes to its signals cause no DOM mutation) before the incoming branch mounts
**Validates: Requirements 5.3, 5.5**

### Property 18: Inactive-branch isolation

_For any_ signal referenced only in an inactive branch, changing it causes no subscription callback and no DOM mutation
**Validates: Requirements 5.4**

### Property 19: Keyed node preservation

_For any_ reorder/insert/remove of a keyed list, DOM nodes of surviving keys are identical (same object identity) before and after
**Validates: Requirements 6.1, 6.2**

### Property 20: Same-key re-resolution

_For any_ item replaced by a new object with the same key, the instance's node is preserved and its bound values reflect the new object
**Validates: Requirements 6.3**

### Property 21: Empty-list block

_For any_ transition between empty and non-empty arrays, the `{{else}}` block mounts exactly when the array is empty
**Validates: Requirements 6.4**

### Property 22: Item scope correctness

_For any_ item position, `this`, `../`, `@index`, `@first`, `@last`, `@even`, `@odd` resolve to correct values, including after reorders
**Validates: Requirements 6.5, 6.6**

### Property 23: Signal-property items bypass the diff

_For any_ update to an item's signal property, the item's binding updates with zero list-diff work and zero sibling DOM mutations
**Validates: Requirements 6.7**

### Property 24: Item removal disposal

_For any_ removed item, its effects stop firing and its listeners are removed
**Validates: Requirements 6.8**

### Property 25: Handler invocation forms

_For any_ bare-path handler, the function receives the DOM event and its owning object as `this`; for any call-form handler, arguments evaluate with `this`/`$event`/iteration helpers in scope
**Validates: Requirements 7.1, 7.2, 7.3**

### Property 26: Handler batching

_For any_ handler performing N signal writes with a shared dependent, the dependent binding applies once per event dispatch
**Validates: Requirements 7.4**

### Property 27: Prop-vs-attr resolution

_For any_ `:name` binding, element properties are assigned for property targets (`input.value`, `checked`) and `setAttribute` is used otherwise (`aria-*`, `data-*`), with boolean toggling
**Validates: Requirements 8.1, 8.2, 8.3**

### Property 28: Class and style toggling

_For any_ boolean sequence on `class:`/`style:` bindings, class membership and style properties track the value, with nullish removing the style property
**Validates: Requirements 8.4, 8.5**

### Property 29: Reactive interpolated attributes

_For any_ signal used in a plain interpolated attribute, the attribute value updates on signal change
**Validates: Requirements 8.6**

### Property 30: Lifecycle completeness

_For any_ Mounted View, `dispose()` stops all effects and listeners, never disposes the ViewModel's signals, and is idempotent; `render()` returns a reactive fragment with a working `dispose`
**Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5**

### Property 31: Instance independence

_For any_ Template mounted twice, disposing one view leaves the other fully reactive
**Validates: Requirements 9.6**

### Property 32: Zero-bridge MVVM mount

_For any_ shared ViewModel exposing `data$`/`isLoading$`/`error$` and Commands, a template binds and updates through the full loading→success/error flow with no adapter code
**Validates: Requirements 10.1, 10.2, 10.3**

## Error Handling

### Compile-Time Errors (`TemplateSyntaxError`)

- Unclosed / mismatched / stray-close block tags — name the tag and, when available, the source offset
- Disallowed expression syntax — name the construct (e.g. "assignment is not allowed in template expressions; move this logic to a ViewModel computed()")
- Unknown directive prefixes are **not** errors — unknown attributes pass through as plain HTML (forward compatibility with Phase 2 `use:`/modifiers)

### Runtime Resolution

- A path resolving to `undefined` mid-chain renders as empty string / no-op — it must not throw (data may legitimately be absent while loading). Dev-mode warnings for unresolved paths are Phase 3 (PRD §11)
- A bare-path `on:` handler resolving to a non-function throws a descriptive `TypeError` at event dispatch (silent no-op would hide wiring bugs)
- `dispose()` is defensive: teardown callbacks run in reverse registration order; a throwing callback does not prevent the remaining teardowns (errors aggregated and rethrown after the bag is drained)

## Testing Strategy

Vitest with **jsdom** environment (the package's `vitest.config.ts` currently sets `environment: 'node'` and must change), tests co-located as `src/**/*.test.ts` per repo convention.

- **Unit tests per component**: pre-pass (marker output, standalone trimming, table cases), expression parser (accept/reject tables), evaluator (semantics, helper order, `this` binding), compile walk (stripping, neutralization, script/style, SVG, malformed errors), each directive in isolation
- **Behavioral tests**: mount real templates against plain-object ViewModels built with `signal()`/`computed()`; assert DOM state transitions; use MutationObserver to assert surgical-update properties (12, 23)
- **Integration test (Requirement 10)**: mount a ViewModel from `@repo/view-models` (dev dependency) with a mocked fetcher (repo testing pattern), drive `fetchCommand.execute()`, assert loading → data/error rendering; always `vm.dispose()` and `view.dispose()` in cleanup
- **Disposal hygiene**: every test disposes views in cleanup; a shared helper asserts no effect fires after disposal
- **Benchmarks** (Requirement 11): `benchmarks/` scripts (run via `vitest bench` or `tsx`), excluded from the published bundle; a `size` script gzips `dist/index.es.js` and fails over 20KB

## Dependencies

- `@web-loom/signals-core` — **runtime dependency** (workspace protocol `"*"`); externalized in `vite.config.ts` `rollupOptions.external` so it is not bundled
- `@repo/view-models`, `@web-loom/mvvm-core` — **dev dependencies** for the integration test only
- No other runtime dependencies

## Performance Considerations

- Parse once, clone many: all string parsing and expression parsing happens in `compile()`; `mount()` and per-item instantiation only clone and wire
- Static bindings (no signal touched during first evaluation) create no effect — zero ongoing cost
- `NodePath` child-index addressing avoids per-clone `querySelector` calls
- Keyed diff is O(n) with prefix/suffix fast paths; moves reuse nodes via `insertBefore`
- Targets (PRD §10): initial render < 50ms (todo template), single-signal update < 16ms, bundle < 20KB gzipped, mutations proportional to changed bindings

## Security Considerations

- `{{ }}` escapes via `textContent` assignment — no string-concatenated markup anywhere in the runtime
- `{{{ }}}` is the only raw-HTML path and requires the distinct triple-brace opt-in per binding
- No `eval`/`new Function` — runs under strict CSP without `unsafe-eval`
- `javascript:` URLs bound into `href`/`src` are the author's responsibility (validate in the ViewModel); out of engine scope per PRD §9

## Future Extensibility (Phase 2/3 Seams)

- **Directive registry**: `directives/` modules register against attribute prefixes; Phase 2 `use:` actions and event modifiers plug into the same table without parser changes
- **Block registry**: the marker pre-pass and stack scan are keyword-driven; `{{#switch}}`/`{{#case}}` and `{{> partial }}` add keywords, not new mechanisms
- **Comment markers as hydration anchors**: `<!--loom:…-->` markers are stable and content-addressed — Phase 3 SSR/hydration reuses them
- **`TemplateOptions.partials`** is reserved in the PRD (§6.6) and intentionally absent from Phase 1's options type — adding it is additive
