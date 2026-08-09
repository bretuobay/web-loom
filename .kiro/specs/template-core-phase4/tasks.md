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

- [x] Build a Vite precompile plugin on top of the canonical compiler API.
- [x] Add Node-safe full template analysis (`analyzeTemplate`) and unify `precompileNode` on it.
- [x] Add opt-in Vite dev analyze mode with in-memory incremental cache.
- [x] Add ESLint plugin (`@web-loom/template-core-lint`) with five analyze-backed rules.
- [x] Add incremental/watch compilation and stable generated-module output for dev precompile
      (`templateCorePrecompile({ dev: 'precompile' })` + `PrecompileCache`).
- [x] Add a formatter that preserves source locations and reports syntax errors through diagnostics
      (`formatTemplate()` + `template-core-format` CLI; see `packages/template-core/docs/template-formatting.md`).
- [x] Add source-linked diagnostic output suitable for editor integrations
      (`@web-loom/template-core-tooling` `SourceLinkedDiagnostic`, ESLint + Vite wiring,
      VS Code problem matcher — see `packages/template-core/docs/editor-diagnostics.md`).
- [ ] Publish syntax-highlighting guidance or a compatible grammar.
      (Dedicated `.loom` template files — a separate authoring surface from
      this string-based tooling — are tracked as a deferred, optional track;
      see `template-core-phase5/`.)
- [x] Define opt-in template context declarations and helper/partial contract checks
      (`declareContext`, `PartialContexts` in `@web-loom/template-core`; see `docs/typing-spike.md`).
- [x] Add integration examples for the ecommerce SSR island and a client-only route outlet
      (`packages/template-core/docs/template-core-tooling.md`).

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

Run from repo root (WSL recommended).

> **Note:** `npm run lint check-types test` does **not** run three scripts — npm passes
> `check-types` and `test` as extra args to `lint`. Use separate `npm run` calls, `&&`, or
> `turbo run` (multiple task names).

```bash
npm install

# Build tooling chain first (downstream packages depend on these dist outputs)
npm run build --workspace=@web-loom/template-core
npm run build --workspace=@web-loom/template-core-tooling
npm run build --workspace=@web-loom/template-core-lint
npm run build --workspace=@web-loom/template-core-vite

# template-core (turbo for lint/types/test; bench/size are package-only scripts)
turbo run lint check-types test --filter=@web-loom/template-core
npm run bench --workspace=@web-loom/template-core
npm run size --workspace=@web-loom/template-core

# vite-ssr
turbo run lint check-types test build --filter=@web-loom/template-core-vite-ssr

# vite + lint (P2 tooling)
turbo run lint check-types test build --filter=@web-loom/template-core-vite
turbo run lint check-types test --filter=@web-loom/template-core-lint

# reference app (each script separately — no combined npm run)
npm run type-check --workspace=ecommerce-template-core
npm run lint --workspace=ecommerce-template-core
npm run test --workspace=ecommerce-template-core
npm run build:client --workspace=ecommerce-template-core
npm run build:server --workspace=ecommerce-template-core
```

One-liner alternative (same steps):

```bash
npm install && \
npm run build --workspace=@web-loom/template-core && \
npm run build --workspace=@web-loom/template-core-tooling && \
npm run build --workspace=@web-loom/template-core-lint && \
npm run build --workspace=@web-loom/template-core-vite && \
turbo run lint check-types test --filter=@web-loom/template-core && \
npm run bench --workspace=@web-loom/template-core && \
npm run size --workspace=@web-loom/template-core && \
turbo run lint check-types test build --filter=@web-loom/template-core-vite-ssr && \
turbo run lint check-types test build --filter=@web-loom/template-core-vite && \
turbo run lint check-types test --filter=@web-loom/template-core-lint && \
npm run type-check --workspace=ecommerce-template-core && \
npm run lint --workspace=ecommerce-template-core && \
npm run test --workspace=ecommerce-template-core && \
npm run build:client --workspace=ecommerce-template-core && \
npm run build:server --workspace=ecommerce-template-core
```

- [x] `@web-loom/template-core` lint, type-check, tests, benchmarks, and size budget pass.
      (Verified 2026-08-08 — see `phase4-validation-output.log`.)
- [x] `@web-loom/template-core-vite-ssr` lint, type-check, tests, and build pass.
      (Verified 2026-08-08.)
- [ ] `@web-loom/template-core-vite` lint, type-check, tests, and build pass.
      (Blocked on `analyzeTemplate` DOM scope + tooling link — fixes in tree; re-run after rebuild.)
- [ ] `@web-loom/template-core-lint` lint, type-check, tests pass.
      (Same `analyzeTemplate` / build-deps fix.)
- [ ] `ecommerce-template-core` type-check, tests, client build, server build, and SSR smoke test
      pass. (type-check, test, builds pass; lint fixed via named `configs` import — re-run lint.)
- [x] Existing Phase 1/2 behavior and all public APIs remain backward-compatible unless an additive
      migration is documented.
- [x] No P3 experiment is required for the stable Phase 4 release.
- [x] Final documentation explicitly labels implemented, experimental, and deferred capabilities
      (PRD §11, Phase 5 spec, `typing-spike.md`, cookbook §11).
