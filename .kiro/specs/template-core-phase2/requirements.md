# Requirements and Implementation Plan: `@web-loom/template-core` Phase 2

## Status

Phase 2 is implemented and verified. It extends the Phase 1 runtime without changing the existing
signal-resolution, CSP-safe expression, keyed iteration, node-path, or disposal contracts.

Phase 3 remains out of scope: SSR, hydration, build-time precompilation, and expanded diagnostic
tooling.

## Intent and baseline

The implementation keeps the Phase 1 architecture:

- `compile()` parses source through a marker pre-pass and the native HTML template parser.
- The parser emits an inert `DocumentFragment` blueprint plus binding and block records.
- Stable node paths address cloned nodes at runtime.
- Reactive work is created with `signals-core` effects and owned by `DisposalBag` instances.
- Branches, list items, actions, listeners, and partial views are independently disposable.

The Phase 2 plan was to add advanced composition and element behavior as records and directives in
that existing pipeline, preserving Phase 1 behavior and iteration-helper semantics.

## Implementation plan and completed requirements

### 1. Extend the compiler and AST

- Extend preprocessing to preserve `switch`, `case`, `default`, closing markers, and partial
  references as HTML comments.
- Extend parser marker validation and nested-block scanning.
- Add switch branch records and partial records while retaining node-path addressing.
- Extend directive extraction for `bind:`, `use:`, and modifier-bearing `on:` attributes.
- Reject malformed partial headers, unsupported bind names, duplicate/invalid modifiers, and
  incompatible `.passive.prevent` combinations with descriptive `TemplateSyntaxError` messages.

### 2. Implement `switch` composition

- Support `{{#switch expr}}`, `{{#case value}}`, `{{#default}}`, and their closing tags.
- Evaluate cases with strict equality (`===`) and mount only the first matching case.
- Mount the default branch when no case matches.
- Subscribe only to the switch expression and the active branch’s bindings.
- Dispose the old branch before reconstructing the new branch when the selected case changes.
- Support nested `if`, `each`, `switch`, and partial blocks through normal recursive compilation.

### 3. Implement two-way bindings

- Add `bind:value` and `bind:checked` binding records.
- Use `input` for text inputs and textareas; use `change` for checkboxes, radios, and selects.
- Preserve reactive signal-to-DOM updates through an effect.
- Resolve the final target without unwrapping it, require a writable signal with `set()` and
  `update()`, and throw a descriptive runtime error otherwise.
- Wrap DOM-to-signal writes in `batch()` and register both the effect and listener for disposal.

### 4. Implement event modifiers

- Support `.prevent`, `.stop`, `.once`, `.capture`, `.passive`, `.enter`, and `.escape`.
- Apply prevent/stop before invoking the handler.
- Use native listener options for once/capture/passive.
- Filter keyboard handlers by `Enter` and `Escape` where requested.
- Continue resolving bare paths and call-form handlers through the existing scope/evaluator rules.
- Keep handlers batch-wrapped and remove them on disposal.

### 5. Implement element actions

- Add `use:action="expr"` records.
- Resolve action names from helpers or the scope chain.
- Invoke actions once with the mounted `Element`.
- Accept no return value or `{ dispose(): void }` and register returned cleanup with the owning bag.
- Throw a descriptive runtime error when the expression is not callable or returns an invalid value.
- Rely on child disposal ownership so actions clean up with branches, list items, partials, and the
  complete mounted view.

### 6. Implement named partials

- Add `partials?: Record<string, string | Template>` to `TemplateOptions`.
- Add and export `registerPartial(name, source)` and `unregisterPartial(name)`.
- Merge local entries over the global registry for each render context.
- Compile string partials lazily and cache compiled templates; reuse compiled `Template` instances.
- Support inherited scope with `{{> name}}`.
- Support explicit context with `{{> name context}}`, retaining the enclosing scope as the parent
  so `../` access remains available.
- Re-run explicit-context partials when the context signal changes while retaining fine-grained
  signal updates inside the existing context.
- Warn and render nothing for missing partials.
- Bound recursive expansion with a descriptive depth error.
- Dispose partial views through the parent disposal bag.

### 7. Update the public surface and documentation

- Preserve exports for `compile`, `Template`, `Disposable`, `TemplateOptions`, and
  `TemplateSyntaxError`.
- Export the partial registration functions.
- Document Phase 2 syntax, registries, lifecycle ownership, and Phase 3 exclusions in the README.
- Bump the package from `0.8.0` to `1.0.0`.
- Record this plan and its architecture in the Phase 2 Kiro requirements, design, and tasks files.

## Validation plan and results

The implementation was validated with the following checks:

- Existing Phase 1 tests retained and updated where their assertions described pre-Phase-2
  “not implemented” behavior.
- Phase 2 smoke coverage added for switch branch changes, two-way value binding, partial mounting,
  and action cleanup.
- Full package test suite: 19 test files, 179 tests passed.
- Type-check passed with `npm run check-types`.
- Production build passed with `npm run build`.
- Package lint passed with zero warnings under `--max-warnings 0`.
- Prettier formatting applied to changed source, tests, package metadata, README, and Kiro docs.
- `git diff --check` passed.

## Delivery chunks

The completed work was committed in three reviewable chunks:

1. `7bf687e` — `feat(template-core): add phase 2 directives and partials`
2. `5eb8f40` — `test(template-core): cover phase 2 directives`
3. `e1b2ca7` — `docs(template-core): document phase 2 and traceability`

## Integration API follow-up

The Phase 2 implementation was exercised by `apps/ecommerce-template-core`, which identified and
completed the following integration improvements:

- Scoped `TemplateRegistry` instances with local, scoped, and global partial precedence.
- `createTemplateOutlet()` for owned dynamic route/template replacement.
- Internal partial composition through the renderer API rather than a concrete-template root cast.
- Diagnostic callbacks, named templates, strict missing-partial mode, and recursive partial-chain
  errors.
- Explicit `bind:set` support for form libraries that expose snapshots plus setter actions.
- Reactive action `update()`/`dispose()` results while retaining the existing `use:` syntax.
- Event call-form usage with `this` for item-scoped product and cart actions.

These additions are covered by package integration tests and ecommerce app tests, and are documented
in both package and application READMEs.
