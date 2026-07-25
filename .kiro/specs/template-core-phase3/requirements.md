# Template Core Phase 3 Requirements

## Status and intent

Phase 3 is the production expansion of `@web-loom/template-core`. Phase 1 and Phase 2 browser
behavior remains the compatibility baseline. Phase 3 adds server rendering, hydration,
precompilation, and structured diagnostics without introducing arbitrary JavaScript expressions or
a component framework.

## Requirements

### R1. Shared serializable render plan

- The compiler SHALL produce a DOM-independent, serializable render plan.
- Browser mounting, SSR, hydration, and precompiled modules SHALL consume equivalent plan data.
- The plan SHALL retain binding records, block records, source locations, namespaces, static
  attributes, and stable marker IDs.
- Existing `if`, `each`, `switch`, partial, binding, action, registry, and disposal semantics SHALL
  remain compatible.

### R2. Server-side rendering

- `Template.renderToString(viewModel)` SHALL render without `document`, `Element`, or
  `DocumentFragment` globals.
- SSR SHALL support interpolation, escaping/raw HTML, attributes, classes, styles, `if`, `each`,
  `switch`, partials, helpers, and explicit partial contexts.
- Events and element actions SHALL not execute during SSR or appear as runtime event attributes.
- SSR output SHALL include deterministic Loom markers required for hydration.

### R3. Hydration

- `Template.hydrate(container, viewModel)` SHALL attach bindings to matching server-rendered nodes
  without replacing them.
- Hydration SHALL attach listeners, effects, actions, nested partials, branches, and keyed lists
  exactly once.
- Hydration SHALL preserve normal `Disposable` ownership and ViewModel ownership boundaries.
- Mismatches SHALL produce diagnostics and recover by rebuilding the smallest safe region, falling
  back to a full remount when necessary.

### R4. Precompilation

- A Node compiler API SHALL emit a serializable render-plan module.
- A CLI SHALL compile template files into importable modules.
- Precompiled plans SHALL work with browser mounting, hydration, SSR, partials, and registries.
- Precompiled execution SHALL not invoke runtime HTML parsing.

### R5. Diagnostics and source mapping

- Diagnostics SHALL support codes, severity, template name, source path, line/column, expression,
  node path, and structured details.
- Development diagnostics SHALL report unresolved paths, invalid expressions, missing partials,
  recursive partials, and hydration mismatches.
- Source metadata SHALL map plan nodes and runtime markers back to template source locations.
- Existing warning-by-default and strict partial behavior SHALL remain supported.

### R6. Compatibility and validation

- Existing Phase 1/2 tests SHALL remain passing.
- The package SHALL retain browser entrypoint compatibility and keep compiler/SSR-only dependencies
  out of the browser bundle.
- The ecommerce template-core demo SHALL continue to type-check, test, and build against the new
  package APIs.
- README, PRD, API JSDoc, and Kiro traceability SHALL document Phase 3 behavior.

## Explicit non-goals

Streaming SSR, automatic nested-object mutation, arbitrary JavaScript, a component system, and
framework-specific router integration remain outside Phase 3.
