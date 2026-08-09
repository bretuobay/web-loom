# Template Core Phase 4 Design

## Design principles

Phase 4 strengthens the existing compiler/runtime boundary instead of adding a second rendering
model. The browser renderer, SSR renderer, hydration runtime, and precompiled runtime must consume
the same logical plan and expression semantics.

The release is staged so that correctness work is isolated from exploratory SSR scheduling and
composition work:

```text
P0 shared plan + diagnostics + hydration recovery
             ↓
P1 security + request isolation + lifecycle/performance evidence
             ↓
P2 compiler/editor/Vite integration tooling
             ↓
P3 async SSR + deferred hydration + slots (experiments only)
```

## 1. Canonical render plan

Introduce a versioned, JSON-safe plan model as the compiler's actual output. A plan node should
identify its type, namespace, static data, source location, node path, and children. Expressions
should remain AST records interpreted by the existing evaluator.

The browser compiler may still create a `DocumentFragment` blueprint as an optimization, but that
blueprint must be derived from the canonical plan. SSR and precompiled execution must not depend on
browser DOM objects.

Recommended layers:

```text
template source
    ↓
preprocessor + source map
    ↓
canonical serializable plan
    ├── browser blueprint/mount consumer
    ├── SSR string consumer
    ├── hydration consumer
    └── precompiled module consumer
```

Plan versions must be validated before execution. A version mismatch should produce a diagnostic
and fail clearly rather than silently interpreting an incompatible plan.

## 2. Structured diagnostics

Create one diagnostic factory and one normalization path used by compiler, browser runtime, SSR,
hydration, partial resolution, and precompiled execution. Existing `warn(message, details)` and
`error(message, details)` callbacks can be retained as compatibility adapters.

Diagnostics should carry a source span and a runtime location independently. A compiler diagnostic
may have a line and column but no node path; a hydration diagnostic may have a node path and marker
ID but no source line. This avoids inventing inaccurate locations.

Diagnostics should be emitted through an injectable reporter. The default development reporter may
log to the console; production applications can collect, throw, or route diagnostics to telemetry.

## 3. Hydration recovery

Every dynamic block owns a marker range and a disposal bag. Hydration first validates the range,
then binds it in place. On failure, the owner removes only its range and mounts a fresh instance.
Parents must be able to fall back to their own range when a child has no independently identifiable
range.

Recovery must be idempotent:

```text
validate range
  ├── valid → attach effects/listeners/actions once
  └── invalid → dispose owner → remove owner range → mount owner once
```

The implementation must avoid using a successful server render followed by a full string comparison
as its only hydration strategy. Comparisons may remain a development diagnostic, but marker-aware
validation is the ownership mechanism.

## 4. SSR adapter boundary

`@web-loom/template-core/ssr` remains the DOM-free renderer. The Vite package remains an HTTP/Vite
orchestration package. Request handling belongs to the adapter, while template rendering belongs to
template-core.

The Vite adapter should expose small helpers for:

- request-scoped render invocation;
- outlet and head replacement;
- safe initial-state serialization;
- status/header/error mapping;
- optional island metadata.

It must not create a global partial registry per request or serialize live signals, ViewModels,
functions, or secrets.

## 5. Security model

Keep escaping and raw HTML behavior explicit. Add a security utility boundary rather than embedding
application-specific sanitization in the renderer:

- renderer escapes text and attribute contexts;
- application validates URL values;
- application or an optional Trusted Types policy owns raw HTML sanitization;
- diagnostics can warn on suspicious URL schemes or raw HTML usage in development.

Security tests should exercise both browser and SSR consumers because equivalent source must not have
different escaping behavior by target.

## 6. Tooling architecture

The CLI, Vite plugin, formatter, linter, and editor integrations should all consume the canonical
plan and diagnostic APIs. None should parse template syntax independently.

The first tooling slice should be a Vite precompile plugin and source-linked diagnostics. Formatter,
linter, and editor support can then build on the same parser and source-span model.

**Formatter (M3, implemented):** `formatTemplate()` in `@web-loom/template-core/compiler-node` calls
`analyzeTemplate()` first; on success it pretty-prints by tokenizing the **original** source (not the
serialized plan) so directives and expressions stay intact. CLI: `template-core-format`. Doc:
[`packages/template-core/docs/template-formatting.md`](../../../packages/template-core/docs/template-formatting.md).

## 7. Deferred experiments

Async/streaming SSR, hydration scheduling, and slots are intentionally isolated behind experimental
APIs. Each experiment requires a design note covering cancellation, errors, disposal, hydration
identity, and backwards compatibility before implementation.

No experiment may change the stable Phase 1/2 grammar or make a browser-only feature mandatory for
SSR.

## Public API direction

The exact names should be finalized during implementation, but the public surface should trend
toward additive APIs such as:

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

interface TemplateDiagnostics {
  report?(diagnostic: TemplateDiagnostic): void;
  warn?(message: string, details?: unknown): void; // compatibility
  error?(message: string, details?: unknown): void; // compatibility
}

interface HydrationOptions {
  recover?: 'region' | 'template' | 'throw';
}
```

Avoid committing to a large component API in Phase 4. Templates, partials, registries, outlets, and
explicit ViewModel context should remain the primary composition primitives.
