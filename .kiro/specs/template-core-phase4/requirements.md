# Template Core Phase 4 Requirements

## Status and intent

**Status:** Proposed. Phase 4 is the production-hardening and tooling phase for
`@web-loom/template-core`.

Phase 3 delivered the initial SSR, hydration, compiler, and precompilation surfaces, but several
Phase 3 promises are still represented as lightweight implementations. Phase 4 must first make
those contracts truthful and dependable before adding new rendering features.

This specification is intentionally priority-ordered:

| Priority | Meaning                                       | Delivery rule                                                    |
| -------- | --------------------------------------------- | ---------------------------------------------------------------- |
| P0       | Correctness and contract completion           | Required before Phase 4 can be declared complete                 |
| P1       | Production hardening                          | Required for a stable v1.2 release                               |
| P2       | Developer experience and reusable integration | Deliver after P0/P1, may ship incrementally                      |
| P3       | Exploratory capabilities                      | Research behind explicit experiments; not a Phase 4 release gate |

Phase 1, Phase 2, and compatible Phase 3 browser behavior remain the baseline. Phase 4 does not
add arbitrary JavaScript expressions, a virtual DOM, or a framework-specific component system.

## P0 — Complete the Phase 3 contract

### R1. Executable serialized render plans

The compiler SHALL emit a complete DOM-independent render plan rather than only storing the
original source and preprocessed source.

The plan SHALL contain, at minimum:

- element, text, comment, and namespace information;
- static attributes and directive records;
- interpolation parts and expression ASTs;
- nested `if`, `each`, `switch`, and partial block plans;
- stable node paths and hydration marker IDs;
- template name, source path, and source locations when available;
- a plan version and compatibility metadata.

`fromPrecompiled()` SHALL execute the serialized plan directly. It SHALL NOT invoke the runtime
HTML parser or reconstruct the plan from the original template source.

### R2. Structured diagnostics and source locations

Diagnostics SHALL use a stable, machine-readable shape:

```ts
interface TemplateDiagnostic {
  code: string;
  severity: 'warning' | 'error';
  message: string;
  template?: string;
  sourcePath?: string;
  line?: number;
  column?: number;
  expression?: string;
  nodePath?: number[];
  details?: unknown;
}
```

The runtime and compiler SHALL report stable codes for at least:

- unresolved paths;
- invalid expressions;
- missing or recursive partials;
- precompiled-plan version mismatches;
- hydration marker and structure mismatches;
- unsupported directive combinations.

Diagnostics SHALL preserve source locations from template text through compilation, SSR, hydration,
and runtime recovery. Existing warning callbacks and strict partial behavior SHALL remain
backward-compatible through an adapter or additive API.

### R3. Smallest-safe hydration recovery

Hydration SHALL validate marker ownership, node shape, directive structure, and nested block
boundaries. When a mismatch occurs, the runtime SHALL rebuild the smallest safe template region
whose contract is invalid. A full-container remount is permitted only when no narrower region can
be identified.

Recovery SHALL emit a structured diagnostic and SHALL not duplicate effects, listeners, actions,
partial views, or disposal callbacks.

### R4. Phase 3 documentation truthfulness

The PRD, README, API documentation, and Kiro traceability SHALL distinguish:

- delivered Phase 3 behavior;
- Phase 3 behavior completed by Phase 4;
- documented limitations;
- experimental or deferred capabilities.

The package version and roadmap language SHALL not claim a feature is complete when the public API
still uses a fallback implementation.

## P1 — Production hardening

### R5. SSR request and error boundaries

SSR rendering SHALL support request-scoped context without leaking state, subscriptions, partial
registries, or mutable ViewModels between requests.

The SSR integration SHALL provide documented handling for:

- response status and headers;
- redirects and not-found responses;
- rendering exceptions;
- asset lookup failures;
- graceful server shutdown;
- development stack traces versus production-safe error responses.

The core renderer SHALL remain DOM-free and shall not depend on a Node-only global in its SSR
entrypoint.

### R6. Security and platform correctness

The package SHALL document and test:

- text and attribute escaping in browser and SSR paths;
- safe handling of URL-bearing attributes;
- explicit raw HTML boundaries;
- Trusted Types integration or a clear integration hook;
- CSP compatibility and absence of `eval`/`new Function`;
- boolean properties and attributes;
- SVG namespaces;
- form controls and custom elements.

The engine SHALL not silently claim to sanitize untrusted HTML. Raw HTML SHALL remain opt-in and
the application SHALL own sanitization policy.

### R7. Performance and lifecycle evidence

The project SHALL maintain repeatable benchmarks for:

- browser initial mount;
- one-binding signal updates;
- keyed list reconciliation;
- SSR rendering;
- hydration;
- precompiled execution;
- repeated mount/dispose cycles.

Benchmarks SHALL report environment, workload, sample count, and regression thresholds. At least one
real-browser benchmark path SHALL complement jsdom tests.

The runtime SHALL include leak-oriented tests proving that disposed branches, list items, partials,
actions, and outlets release their effects and listeners.

## P2 — Developer experience and reusable integration

### R8. Compiler and editor tooling

The project SHOULD provide:

- a Vite precompile plugin or documented equivalent;
- incremental/watch-mode compilation;
- template formatting;
- lint rules for invalid directives, unresolved partials, and unsafe raw HTML;
- source-linked diagnostics suitable for editor integrations;
- syntax highlighting guidance or a TextMate-compatible grammar.

Tooling SHALL reuse the compiler plan and diagnostic model rather than implement a second parser.

### R9. Optional template contract checking

The project SHOULD provide opt-in static checks for:

- helper names and helper argument counts where declarations are available;
- partial names and registry declarations;
- supported directive names and modifier combinations;
- declared template context fields.

Static checking SHALL be additive. Dynamic ViewModels, computed fields, and plain JavaScript
contexts SHALL continue to work at runtime.

### R10. Partial SSR and hydration orchestration

The reusable Vite integration SHOULD formalize partial SSR/island composition with:

- explicit outlet identity;
- opt-in hydration policy;
- request-scoped serialized state;
- client seed/hydrate helpers;
- mismatch reporting tied to an outlet;
- documented integration with routers and browser-only state.

This API SHALL remain independent from the template grammar and SHALL not force applications to
server-render their entire shell.

## P3 — Exploratory, not release-blocking

### R11. Async and streaming SSR experiment

The project MAY prototype async template data resolution and streaming SSR behind an experimental
entrypoint. The experiment SHALL not add `{{#await}}` until its ownership, cancellation, error, and
hydration semantics are specified.

### R12. Scheduling and deferred hydration experiment

The project MAY prototype `load`, `idle`, `visible`, and manual hydration policies. Scheduling must
preserve disposal ownership and must not cause duplicate hydration.

### R13. Minimal composition experiment

The project MAY investigate explicit slots or view factories built on templates, partials, and
outlets. It SHALL not become a hidden component framework, introduce implicit global state, or
replace the existing explicit composition model without a separate proposal.

## Validation gates

Phase 4 P0/P1 is complete only when:

- all existing Phase 1/2/3 tests pass;
- serialized plans execute without runtime HTML parsing;
- diagnostics contain stable codes and source locations;
- hydration recovery is covered for nested blocks and partials;
- SSR isolation, security, disposal, and real-browser performance tests pass;
- browser, SSR, compiler, and Vite integration entrypoints have documented bundle and runtime
  boundaries;
- the ecommerce template-core demo exercises the supported partial SSR contract;
- README, PRD, API JSDoc, and Kiro documents agree with the shipped behavior.

P2 and P3 work may ship separately and must not weaken the P0/P1 gates.
