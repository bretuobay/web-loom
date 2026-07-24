# Requirements Document: @web-loom/template-core Phase 1

## Introduction

`@web-loom/template-core` is Web Loom's native, signal-driven template engine — the "no adapter required" View over ViewModels built on `@web-loom/signals-core` and `@web-loom/mvvm-core`. Phase 1 (MVP, per `packages/template-core/docs/PRD.md` §11) delivers runtime template compilation with no build step, a CSP-safe expression subset, text/attribute/class/style/event bindings, `{{#if}}`/`{{#each}}` control flow with keyed reconciliation, mount/dispose lifecycle, and the end-to-end proof that a real ViewModel from `packages/view-models` mounts with zero bridge code. Server-side rendering, partials, `{{#switch}}`, event modifiers, and `use:` actions are explicitly out of Phase 1 scope.

## Glossary

- **Template Engine**: The `@web-loom/template-core` compiler and runtime as a whole
- **Template Source**: The HTML-plus-directives string passed to `compile()`
- **Marker Pre-pass**: The string-level rewrite of block tags (`{{#if}}`, `{{#each}}`, `{{else}}`, `{{/if}}`, `{{/each}}`) into HTML comment markers before native HTML parsing
- **Blueprint**: The inert, parsed `DocumentFragment` (directive attributes stripped, block ranges lifted) that is cloned per mount and per list item
- **Binding**: The association between one expression and one DOM location (text node, attribute, property, class, style, or event listener)
- **Binding Record**: The compile-time description of a Binding stored in the AST
- **Expression**: A string in the CSP-safe expression subset defined by PRD §6.7 (literals, scope paths, helper calls, `!`, comparisons, `&&`/`||`/`??`)
- **Scope Chain**: The runtime lookup chain for path resolution: item scope → enclosing scopes → ViewModel root
- **Signal**: A reactive value from `@web-loom/signals-core` recognized via `isSignal()` (read with `.get()`/`.peek()`, subscribed via `effect()`)
- **Keyed Reconciliation**: List update strategy that preserves existing DOM nodes for items whose key is unchanged, applying only inserts, removals, and moves
- **Disposable**: An object with a `dispose(): void` method that releases all resources it owns (matches the `mvvm-core` convention)
- **Mounted View**: The live, reactive DOM produced by `Template.mount()` together with its Disposable
- **ViewModel**: A plain object or `BaseViewModel` instance whose reactive properties are Signals (conventionally `$`-suffixed)

## Requirements

### Requirement 1: Runtime Template Compilation

**User Story:** As a Web Loom developer, I want to compile an HTML template string at runtime with no build step, so that I can define reactive views anywhere JavaScript runs, including under a strict Content-Security-Policy.

#### Acceptance Criteria

1. WHEN `compile()` is called with a Template Source THEN the Template Engine SHALL return a `Template` object without requiring any build-time tooling
2. WHEN the Template Source contains block tags THEN the Template Engine SHALL rewrite them into HTML comment markers before native HTML parsing (Marker Pre-pass)
3. WHEN block tags appear inside table markup (between `<table>`, `<tbody>`, or `<tr>` boundaries) THEN the Template Engine SHALL preserve their structural position (comment markers are immune to HTML parser foster-parenting)
4. WHEN parsing the pre-processed source THEN the Template Engine SHALL use the platform's native HTML parser via a detached `<template>` element so that template content stays inert (no image fetches, no script execution) during compilation
5. WHEN the compile walk encounters directive attributes (`on:*`, `:*`, `class:*`, `style:*`) THEN the Template Engine SHALL extract them into Binding Records and remove them from the Blueprint
6. WHEN a plain attribute value contains `{{ }}` interpolation THEN the Template Engine SHALL extract it into a Binding Record and neutralize the attribute in the Blueprint so a cloned instance never renders a literal mustache or eagerly fetches it as a URL
7. WHEN text appears inside `<script>` or `<style>` elements THEN the Template Engine SHALL NOT tokenize it for interpolation
8. WHEN the Template Source root is an SVG child element (e.g. `<circle>`) THEN the Template Engine SHALL parse it with correct namespace context and unwrap the container in the Blueprint
9. WHEN the Template Source contains malformed block structure (unclosed or mismatched block tags) THEN `compile()` SHALL throw an error that names the offending tag

### Requirement 2: Text Interpolation and Escaping

**User Story:** As a Web Loom developer, I want dynamic values interpolated into text safely by default, so that untrusted data cannot inject markup.

#### Acceptance Criteria

1. WHEN `{{ expr }}` appears in element text THEN the Template Engine SHALL render the resolved value as HTML-escaped text
2. WHEN the resolved value contains HTML-special characters (`<`, `>`, `&`, `"`) THEN the Template Engine SHALL render them inert (no elements are created from interpolated text)
3. WHEN `{{{ expr }}}` appears THEN the Template Engine SHALL render the resolved value as raw HTML without escaping
4. WHEN `{{! comment }}` appears THEN the Template Engine SHALL strip it at parse time and never render it
5. WHEN the resolved value is `null` or `undefined` THEN the Template Engine SHALL render an empty string

### Requirement 3: Signal Resolution

**User Story:** As a Web Loom developer, I want the engine to detect signals by their shape rather than their name, so that any mix of signals and plain values in my ViewModel binds correctly with fine-grained updates.

#### Acceptance Criteria

1. WHEN a bound value satisfies `isSignal()` THEN the Template Engine SHALL read it via `.get()` inside an `effect()` so the Binding re-runs when the Signal changes
2. WHEN a bound value does not satisfy `isSignal()` THEN the Template Engine SHALL render it once and never re-evaluate it
3. WHEN a dotted path contains a Signal at any level (e.g. `user$.profile.name$`) THEN the Template Engine SHALL unwrap the Signal at each level and track every Signal on the path as a dependency of that Binding
4. THE Template Engine SHALL NOT determine reactivity from property naming conventions (the `$` suffix is documentation only)
5. WHEN a Signal changes THEN the Template Engine SHALL update only the DOM locations bound to that Signal, leaving all other Bindings untouched

### Requirement 4: CSP-Safe Expression Evaluation

**User Story:** As a Web Loom developer, I want template expressions evaluated without `eval` or `new Function`, so that my application runs under a strict Content-Security-Policy and complex logic stays in testable ViewModel `computed()`s.

#### Acceptance Criteria

1. THE Template Engine SHALL evaluate all expressions with a hand-rolled evaluator and SHALL NOT invoke `eval` or the `Function` constructor
2. WHEN an Expression contains literals, scope paths (including `this`, `../`, `@index`-style helpers, and `$event`), helper calls, unary `!`, comparisons (`===`, `!==`, `<`, `<=`, `>`, `>=`), or logical operators (`&&`, `||`, `??`) THEN the Template Engine SHALL evaluate it per the PRD §6.7 grammar
3. WHEN an Expression contains syntax outside the grammar (assignment, arithmetic, `new`, template literals, ternaries) THEN `compile()` SHALL throw a parse error naming the disallowed construct
4. WHEN a helper call is evaluated THEN the Template Engine SHALL resolve the callee through `options.helpers` first, then the Scope Chain
5. WHEN a line of the Template Source contains only a block tag THEN the Template Engine SHALL trim it (standalone-line behavior) so block markers leave no stray whitespace text nodes

### Requirement 5: Conditional Rendering

**User Story:** As a Web Loom developer, I want `{{#if}}`/`{{else if}}`/`{{else}}` blocks that subscribe only to the active branch, so that inactive UI costs nothing.

#### Acceptance Criteria

1. WHEN an `{{#if}}` chain is evaluated THEN the Template Engine SHALL mount only the first branch whose condition is truthy, evaluating conditions top-down
2. WHEN no condition is truthy and an `{{else}}` branch exists THEN the Template Engine SHALL mount the `{{else}}` branch
3. WHEN a condition Signal changes such that a different branch becomes active THEN the Template Engine SHALL dispose the outgoing branch's effects and listeners before mounting the incoming branch
4. WHILE a branch is inactive THE Template Engine SHALL NOT subscribe to any Signal referenced only inside that branch
5. WHEN a branch is re-mounted after toggling off THEN the Template Engine SHALL rebuild it from the Blueprint (transient DOM state within the branch is not preserved)

### Requirement 6: Keyed Iteration

**User Story:** As a Web Loom developer, I want `{{#each}}` with keyed reconciliation, so that list updates preserve DOM nodes and stay proportional to what actually changed.

#### Acceptance Criteria

1. WHEN `{{#each}}` iterates an array THEN the Template Engine SHALL render one instance of the block per item, in array order
2. WHEN the iterated array Signal changes THEN the Template Engine SHALL preserve existing DOM nodes for items whose key is unchanged, applying only inserts, removals, and moves
3. WHEN an item's key survives a diff but the object reference behind it changed THEN the Template Engine SHALL re-resolve that item's Bindings against the new object while preserving its DOM node
4. WHEN the array is empty and an `{{else}}` block exists THEN the Template Engine SHALL render the `{{else}}` block
5. WHEN `key=this` is specified THEN the Template Engine SHALL key items by their own value (primitive arrays)
6. WHEN a block instance renders THEN the Template Engine SHALL provide an item scope exposing `this`, parent access via `../`, and the iteration helpers `@index`, `@first`, `@last`, `@even`, `@odd`
7. WHEN an item property is itself a Signal THEN the Template Engine SHALL propagate property updates through that item's Bindings without re-diffing the list
8. WHEN an item is removed from the array THEN the Template Engine SHALL dispose that instance's effects and listeners

### Requirement 7: Event Bindings

**User Story:** As a Web Loom developer, I want declarative event bindings that reach my ViewModel methods — including knowing which list item an event belongs to — so that user interactions flow into the ViewModel without manual `addEventListener` wiring.

#### Acceptance Criteria

1. WHEN `on:event="path"` uses the bare-path form THEN the Template Engine SHALL resolve the path through the Scope Chain and invoke the function as `fn(event)`
2. WHEN a bare path resolves to a method on an object (e.g. `fetchCommand.execute`) THEN the Template Engine SHALL invoke it with its owning object as `this`
3. WHEN `on:event="fn(args)"` uses the call form THEN the Template Engine SHALL evaluate arguments per the Expression grammar with `this` (current item), `$event` (the DOM event), and iteration helpers available
4. WHEN any generated handler executes THEN the Template Engine SHALL wrap its execution in `batch()` so multiple synchronous Signal writes notify dependents once
5. WHEN the Mounted View is disposed THEN the Template Engine SHALL remove all event listeners it attached

### Requirement 8: Attribute, Class, and Style Bindings

**User Story:** As a Web Loom developer, I want property-aware attribute bindings plus class and style toggles, so that form controls, ARIA attributes, and visual states all bind correctly.

#### Acceptance Criteria

1. WHEN `:name="expr"` binds and `name` is a property of the target element THEN the Template Engine SHALL assign the element property (required for `value`, `checked`, and similar live-state properties)
2. WHEN `:name="expr"` binds and `name` is not a property of the target element THEN the Template Engine SHALL use `setAttribute` (covers `aria-*`, `data-*`, and SVG attributes)
3. WHEN a `:name` bound value is boolean THEN the Template Engine SHALL toggle attribute presence (or assign property truthiness for property targets)
4. WHEN `class:name="expr"` binds THEN the Template Engine SHALL add the class while the value is truthy and remove it while falsy
5. WHEN `style:prop="expr"` binds THEN the Template Engine SHALL set the CSS property to the value, and remove the property when the value is `null` or `undefined`
6. WHEN a plain attribute contains `{{ }}` interpolation THEN the Template Engine SHALL update the attribute value reactively as its Signal dependencies change

### Requirement 9: Mount, Render, and Dispose Lifecycle

**User Story:** As a Web Loom developer, I want a single `dispose()` that tears down everything a view created — without touching my ViewModel — so that cleanup is one call and VMs can outlive or be shared across views.

#### Acceptance Criteria

1. WHEN `Template.mount(container, viewModel)` is called THEN the Template Engine SHALL clone the Blueprint, wire all Bindings, append the result to the container, and return a Disposable
2. WHEN the returned `dispose()` is called THEN the Template Engine SHALL dispose all effects, remove all event listeners, and dispose all nested branch and item instances created by that Mounted View
3. WHEN `dispose()` is called THEN the Template Engine SHALL NOT dispose the ViewModel or any Signal it references
4. WHEN `dispose()` is called more than once THEN subsequent calls SHALL be no-ops
5. WHEN `Template.render(viewModel)` is called THEN the Template Engine SHALL return `{ node, dispose }` where `node` is a detached, already-reactive `DocumentFragment`
6. WHEN one `Template` is mounted multiple times (same or different ViewModels) THEN each Mounted View SHALL be independent in state and disposal

### Requirement 10: MVVM Integration Proof

**User Story:** As a Web Loom maintainer, I want a real shared ViewModel to mount through the Template Engine with zero bridge code, so that the framework's render-target-agnostic claim is demonstrated, not asserted.

#### Acceptance Criteria

1. WHEN a ViewModel from `packages/view-models` (or a `BaseViewModel` from `@web-loom/mvvm-core`) is passed to `Template.mount()` THEN the Template Engine SHALL bind its `$`-suffixed Signal properties with no adapter, hook, or wrapper code
2. WHEN the ViewModel exposes `isLoading$`/`error$`/`data$` THEN an `{{#if}}` chain over those Signals SHALL render loading, error, and success states that update as the Signals change
3. WHEN a `Command`'s `execute` is bound via `on:` THEN triggering the event SHALL execute the command, and Bindings on `isExecuting$`/`canExecute$` SHALL update accordingly

### Requirement 11: Performance Verification

**User Story:** As a Web Loom maintainer, I want the PRD's performance targets verified by runnable benchmarks, so that the numbers can pass or fail rather than aspire.

#### Acceptance Criteria

1. THE package SHALL include a runnable benchmark for the PRD §8 todo-list template (initial render target: < 50ms)
2. THE package SHALL include a runnable keyed-table benchmark — create 1,000 rows, update every 10th row, swap two rows — exercising `{{#each}}` reconciliation
3. WHEN a single Signal changes THEN the measured update latency SHALL be under 16ms in the benchmark environment
4. WHEN benchmarks run THEN update work SHALL be proportional to changed Bindings, not template size (verified by DOM mutation counts in tests)
5. THE built ES bundle SHALL remain under 20KB gzipped
