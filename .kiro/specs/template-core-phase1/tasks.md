# Implementation Plan: @web-loom/template-core Phase 1

- [ ] 1. Prepare package infrastructure
  - Add `@web-loom/signals-core` as a runtime dependency (workspace `"*"`); externalize it in `vite.config.ts` `rollupOptions.external`
  - Switch `vitest.config.ts` environment from `node` to `jsdom`
  - Add `@web-loom/mvvm-core` and `@repo/view-models` as dev dependencies (integration test only)
  - Add a `size` script that gzips `dist/index.es.js` and fails when over 20KB
  - Create `src/compiler/`, `src/runtime/`, `src/directives/` structure per design
  - _Requirements: 11.5 (setup for all others)_

- [ ] 2. Implement expression parser and evaluator (`compiler/expression.ts`)
- [ ] 2.1 Implement recursive-descent parser for the §6.7 grammar
  - Literals (string/number/boolean/null), paths (`a.b`, `this`, `../x`, `@index`, `$event`), helper calls, unary `!`, comparisons, `&&`/`||`/`??`
  - Produce `ExpressionNode` ASTs; no `eval` or `new Function` anywhere
  - Throw `TemplateSyntaxError` naming disallowed constructs (assignment, arithmetic, `new`, ternaries, template literals)
  - _Requirements: 4.1, 4.2, 4.3_

- [ ] 2.2 Implement evaluator over `Scope`
  - Resolution order: locals → self → parent chain; `parentHops` for `../`
  - `isSignal()` unwrapping at every path segment (tracked reads inside effects)
  - Helper callee resolution: `options.helpers` first, then scope chain
  - Bare-path method resolution retains the owning object for `this` binding
  - _Requirements: 3.3, 4.2, 4.4, 7.2_

- [ ] 2.3 Write tests for expression accept/reject and evaluation semantics
  - **Properties 13, 14** — grammar acceptance/rejection table; helper resolution order
  - **Validates: Requirements 4.1, 4.2, 4.3, 4.4**

- [ ] 3. Implement marker pre-pass (`compiler/preprocess.ts`)
- [ ] 3.1 Rewrite block tags to comment markers at string level
  - `{{#if}}`/`{{else if}}`/`{{else}}`/`{{/if}}`, `{{#each}}`/`{{/each}}`, `{{! }}` stripping
  - Standalone block-tag lines trimmed (no stray whitespace text nodes)
  - Leave `{{ }}`/`{{{ }}}` interpolations untouched
  - _Requirements: 1.2, 2.4, 4.5_

- [ ] 3.2 Write tests for pre-pass output, including table placement
  - **Properties 2, 9 (comment part), 15** — markers between `<table>`/`<tbody>` and `<tr>` survive native parsing in position
  - **Validates: Requirements 1.2, 1.3, 2.4, 4.5**

- [ ] 4. Implement compile walk (`compiler/parser.ts`)
- [ ] 4.1 Native parse and blueprint construction
  - Detached `<template>` parse of pre-processed source (inert content)
  - SVG-child-root detection: wrap in `<svg>` for parsing, unwrap in blueprint
  - _Requirements: 1.1, 1.4, 1.8_

- [ ] 4.2 Single TreeWalker pass producing Binding Records and Block Records
  - Extract and remove directive attributes (`on:*`, `:*`, `class:*`, `style:*`)
  - Extract and neutralize plain attributes containing `{{ }}`
  - Tokenize text nodes on `{{{ }}}`/`{{ }}`; skip `<script>`/`<style>` subtrees
  - Stack-scan comment markers into nested `RootTemplate` sub-templates; throw `TemplateSyntaxError` on unclosed/mismatched blocks naming the tag
  - Record `NodePath` child-index addresses for every binding
  - _Requirements: 1.5, 1.6, 1.7, 1.9_

- [ ] 4.3 Write tests for compilation
  - **Properties 1, 3, 4, 5, 6, 7** — build-free compile, inertness (no fetch/execution), directive stripping, script/style opacity, SVG namespace, malformed-block errors
  - **Validates: Requirements 1.1, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9**

- [ ] 5. Implement disposal and binding runtime (`runtime/disposal.ts`, `runtime/bindings.ts`)
- [ ] 5.1 Implement `DisposalBag`
  - Ordered teardown (reverse registration), child-bag nesting, idempotent `dispose()`, error aggregation without aborting teardown
  - _Requirements: 9.2, 9.4_

- [ ] 5.2 Implement binding application core
  - Static-vs-reactive decision: no effect created when first evaluation touches no signal
  - Reactive bindings via `effect()`; disposals collected into the bag
  - `undefined` mid-path resolves to empty/no-op without throwing
  - _Requirements: 3.1, 3.2, 3.5_

- [ ] 5.3 Write tests for signal resolution
  - **Properties 10, 11, 12** — duck-typed reactivity (no `$` dependence), nested-path tracking, MutationObserver-verified surgical updates
  - **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

- [ ] 6. Implement text and attribute directives (`directives/text.ts`, `attributes.ts`, `classes.ts`, `styles.ts`)
- [ ] 6.1 Text interpolation
  - Escaped via `textContent`; raw HTML for `{{{ }}}`; nullish → empty string
  - _Requirements: 2.1, 2.2, 2.3, 2.5_

- [ ] 6.2 Property/attribute/class/style application
  - Prop-vs-attr rule (`name in element` → property, else `setAttribute`); boolean toggling
  - `class:` truthiness toggle; `style:` set / nullish-remove
  - Reactive plain interpolated attributes
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

- [ ] 6.3 Write tests for text and attribute behavior
  - **Properties 8, 9, 27, 28, 29** — escaping/XSS inertness, prop-vs-attr targets (`input.value`, `checked`, `aria-*`, `data-*`), class/style toggling, reactive attributes
  - **Validates: Requirements 2.1, 2.2, 2.3, 2.5, 8.1–8.6**

- [ ] 7. Implement event directive (`directives/events.ts`)
  - Bare-path form → `fn.call(owner, event)`; call form with `this`/`$event`/iteration helpers
  - All handlers wrapped in `batch()`
  - Listener registration and removal via the DisposalBag
  - Non-function bare-path resolution throws a descriptive `TypeError` at dispatch
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 7.1 Write tests for event handling
  - **Properties 25, 26** — invocation forms and `this` binding; single dependent application for multi-write handlers
  - **Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5**

- [ ] 8. Implement conditional blocks (`directives/if.ts`)
  - Branch-selection effect evaluating conditions top-down; mount first truthy (or `{{else}}`)
  - Dispose outgoing branch bag before mounting incoming; rebuild from blueprint on re-entry
  - Inactive branches create no subscriptions
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 8.1 Write tests for conditionals
  - **Properties 16, 17, 18** — first-truthy mounting across chains, swap disposal, inactive-branch isolation
  - **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5**

- [ ] 9. Implement keyed iteration (`directives/each.ts`)
- [ ] 9.1 Item instantiation and scope
  - Per-item clone + child bag; scope with `this`, parent chain, `@index` (as a writable signal for move updates), `@first`/`@last`/`@even`/`@odd`
  - `key=` path evaluation; `key=this` for primitives
  - _Requirements: 6.1, 6.5, 6.6_

- [ ] 9.2 Keyed reconciliation
  - O(n) diff with prefix/suffix fast paths; `insertBefore` moves reusing nodes; removal disposes item bags
  - Same-key/new-reference: update `scope.self` and re-run instance bindings, preserving nodes
  - `{{else}}` empty block mounting/unmounting on empty transitions
  - Signal-property items: property updates flow through item bindings with no list diff
  - _Requirements: 6.2, 6.3, 6.4, 6.7, 6.8_

- [ ] 9.3 Write tests for iteration
  - **Properties 19, 20, 21, 22, 23, 24** — node identity across reorder/insert/remove, same-key re-resolution, empty block, scope/helper correctness after reorders, diff-free signal-item updates, removal disposal
  - **Validates: Requirements 6.1–6.8**

- [ ] 10. Implement public API (`runtime/renderer.ts`, `index.ts`)
  - `compile<TVm>()` with `TemplateOptions` (delimiters, escape, helpers)
  - `Template.mount()` → Disposable; `Template.render()` → `{ node, dispose }`
  - Instance independence across multiple mounts; `dispose()` never touches ViewModel signals
  - Export `compile`, `Template`, `Disposable`, `TemplateSyntaxError`, `TemplateOptions` types; replace the placeholder `VERSION` export in `src/index.ts`
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

- [ ] 10.1 Write tests for lifecycle
  - **Properties 30, 31** — full teardown, VM untouched, idempotent dispose, reactive `render()` fragment, independent instances
  - **Validates: Requirements 9.1–9.6**

- [ ] 11. MVVM integration proof
  - Mount a ViewModel from `@repo/view-models` (mocked fetcher per repo testing pattern) with zero bridge code
  - Template covers the `{{#if isLoading$}}` / `{{else if error$}}` / `{{else}}` data flow and a Command bound via `on:click`
  - Assert loading → success and loading → error DOM transitions; `view.dispose()` + `vm.dispose()` in cleanup
  - **Property 32**
  - _Requirements: 10.1, 10.2, 10.3_

- [ ] 12. Benchmarks and size verification
  - `benchmarks/todo.bench.ts` — PRD §8 todo template initial render (< 50ms target)
  - `benchmarks/table.bench.ts` — create 1,000 keyed rows, update every 10th, swap two rows (< 16ms single-signal update)
  - MutationObserver assertions that update work is proportional to changed bindings (shared with Property 12 tests)
  - Run `size` script; record gzipped bundle size (< 20KB)
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [ ] 13. Documentation
  - Update `packages/template-core/README.md`: remove "spec only" status, document implemented Phase 1 surface with working examples, note Phase 2/3 items as not yet available
  - Add JSDoc to all public API exports
  - _Requirements: All_

- [ ] 14. Final checkpoint
  - `npx turbo run lint build test check-types --filter=@web-loom/template-core` passes
  - All correctness properties (1–32) covered by at least one test; benchmarks runnable; size check green
  - Ask the user if questions arise
