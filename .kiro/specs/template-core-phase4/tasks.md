# Template Core Phase 4 Tasks

Tasks are ordered by priority. P0 and P1 are release-gating; P2 is incremental production tooling;
P3 is explicitly experimental.

## P0 — Phase 3 contract completion

- [x] Audit the current Phase 3 implementation against `packages/template-core/docs/PRD.md` and
      record each gap as a testable issue.
- [x] Define and version the canonical JSON-safe render-plan schema.
- [x] Compile elements, text, comments, namespaces, attributes, directives, expressions, blocks,
      partials, source spans, and hydration markers into the plan.
- [x] Update browser mount/render, SSR, hydration, and precompiled execution to consume the plan.
- [x] Ensure `fromPrecompiled()` never reparses template source during execution.
- [x] Add plan version validation and a clear incompatible-plan diagnostic.
- [x] Define stable diagnostic codes, severity, source spans, node paths, and structured details.
- [x] Add a normalized reporter while preserving the existing warning/error callbacks.
- [x] Thread source metadata through compiler, SSR, hydration, partial, and runtime diagnostics.
- [x] Implement marker-aware smallest-region hydration recovery.
- [x] Test recovery for text/attribute bindings, nested `if`, keyed `each`, `switch`, partials,
      actions, and event listeners.
- [x] Verify recovery disposes and recreates each owner exactly once.
- [x] Reconcile README, API JSDoc, PRD status, Phase 3 traceability, and Phase 4 traceability.

## P1 — Production hardening

- [x] Add request isolation tests for SSR partial registries, diagnostics, state, and ViewModels.
- [x] Document and test SSR status, headers, redirects, not-found responses, exceptions, and
      graceful shutdown in the Vite adapter.
- [x] Review static asset serving and production error responses for path and information leaks.
- [x] Add browser/SSR parity tests for text, attributes, URLs, raw HTML, boolean properties, forms,
      SVG, and custom elements.
- [x] Add Trusted Types/CSP integration guidance and development warnings for raw HTML and unsafe
      URL schemes.
- [x] Keep sanitization application-owned; do not imply that the renderer sanitizes arbitrary HTML.
- [x] Add real-browser mount, update, keyed-list, hydration, and disposal benchmarks.
- [x] Add SSR and precompiled execution benchmarks with recorded environments and thresholds.
- [x] Add repeated mount/dispose and route/outlet replacement leak tests.
- [x] Validate browser, SSR, compiler, and Vite package dependency and bundle boundaries.

## P2 — Tooling and integration

- [ ] Build a Vite precompile plugin on top of the canonical compiler API.
- [ ] Add incremental/watch compilation and stable generated-module output.
- [ ] Add a formatter that preserves source locations and reports syntax errors through diagnostics.
- [ ] Add lint rules for unsupported directives, modifier conflicts, missing partials, and unsafe raw
      HTML.
- [ ] Add source-linked diagnostic output suitable for editor integrations.
- [ ] Publish syntax-highlighting guidance or a compatible grammar.
      (Dedicated `.loom` template files — a separate authoring surface from
      this string-based tooling — are tracked as a deferred, optional track;
      see `template-core-phase5/`.)
- [ ] Define opt-in template context declarations and helper/partial contract checks.
- [ ] Add integration examples for the ecommerce SSR island and a client-only route outlet.

## P3 — Explicit experiments, not release gates

- [ ] Write a separate async SSR design note covering data loading, cancellation, errors, and
      hydration identity.
- [ ] Prototype streaming SSR behind an experimental entrypoint only after the async design is
      accepted.
- [ ] Write a separate hydration scheduling design for manual, idle, and visible policies.
- [ ] Prototype deferred hydration without changing the stable grammar or duplicating hydration.
- [ ] Write a separate minimal composition/slots proposal based on templates, partials, and outlets.
- [ ] Reject or defer the composition proposal if it requires hidden global state or a component
      lifecycle framework.

## Validation checklist

- [ ] `@web-loom/template-core` lint, type-check, tests, benchmarks, and size budget pass.
- [ ] `@web-loom/template-core-vite-ssr` lint, type-check, tests, and build pass.
- [ ] `ecommerce-template-core` type-check, tests, client build, server build, and SSR smoke test
      pass.
- [ ] Existing Phase 1/2 behavior and all public APIs remain backward-compatible unless an additive
      migration is documented.
- [ ] No P3 experiment is required for the stable Phase 4 release.
- [ ] Final documentation explicitly labels implemented, experimental, and deferred capabilities.
