# RxJS → Signals Migration Gaps

**Date:** 2026-08-19
**Reviewer:** Claude Code
**Trigger:** `CONTRIBUTING.md` still tells contributors to "Use RxJS for reactivity" as the current pattern. A full repo scan found more of the same, plus real code-level bugs.
**Scope:** every `rxjs`/`RxJS` reference in source code, `package.json` manifests, and documentation (~90 files touched RxJS in some way; all were triaged, the ones worth fixing are itemized below).

---

## Executive summary

Web Loom's reactive core moved from RxJS to `@web-loom/signals-core` (`signal()`/`computed()`/`effect()`). That migration is **complete and correct in the actual runtime code** for every package the architecture treats as "core" — `mvvm-core`, `mvvm-patterns`, `view-models`, `store-core`, `query-core`, `router-core`, `http-core`, `ui-patterns` — and the primary docs site (`apps/docs/content/docs/*.mdx`), the blog posts, and the `mvvm-book` chapters all correctly present RxJS as historical/optional interop, not the current pattern.

Two kinds of gaps were found:

1. **Documentation debt** — contributor- and agent-facing guidance (`CONTRIBUTING.md`, root `CLAUDE.md`, `.claude/skills/testing.md`, the `mvvm-development` skill, `.kiro/steering/instructions.md`) taught RxJS as the reactive primitive and RxJS-based testing patterns, contradicting the actual codebase.
2. **Real code gaps** — a few packages (`platform-core`, `forms-core`, `ui-core`'s Angular adapters, one `mvvm-patterns` example) never migrated and, in two cases, didn't even declare `rxjs` as a dependency despite importing it.

**Status: all mechanical corrections (§1.1, §1.2, §2.2, most of §2.3) have been applied in this pass** — see the ✅ markers below and the diff on this branch. The one item left open is a genuine product decision, not a mechanical fix: **§2.1 — whether `forms-core`'s RxJS-based classes and `platform-core` should be migrated to signals-core or explicitly documented as intentional RxJS-interop packages.** That's called out separately at the end.

---

## 1. Documentation gaps — presented RxJS as the *current* pattern

### 1.1 Contributor/agent-facing guidance — highest priority, ✅ fixed

These are the files a new contributor or an AI coding agent reads first, so a stale pattern here compounds.

| File | Issue | Status |
| --- | --- | --- |
| `CONTRIBUTING.md:109-121` | "✅ DO" code example for framework-agnostic behavior imported `BehaviorSubject` from `rxjs` — the actual pattern (see `ui-core/src/behaviors/*`) is a `signal()`-returning factory. | ✅ Fixed — example now uses `signal()`. |
| `CONTRIBUTING.md:460` | "Use RxJS for reactivity" listed as a rule for `mvvm-core`, `ui-core`, `ui-patterns`, `store-core`, `query-core`, `event-bus-core`, `plugin-core`, `router-core`, `forms-core` — **none of these actually depend on rxjs** except `forms-core` (see §2.1). | ✅ Fixed — now says "Use `@web-loom/signals-core`," with a pointer to this doc for the `forms-core`/`platform-core` exception. |
| `CLAUDE.md:20` | Skills table described `architecture.md` as covering "Commands, RxJS" instead of Commands/signals. | ✅ Fixed. |
| `CLAUDE.md:218` | Testing section: "Use RxJS `firstValueFrom` for single emissions, `.subscribe()` for state transitions" — signals aren't Promises; the actual pattern is reading `.get()`/`.peek()` or using `effect()`/`observe()`. | ✅ Fixed. |
| `.claude/skills/testing.md:79-146` | Section headed "### Testing with RxJS" with `firstValueFrom`/`.subscribe()` examples, `vm.data$.getValue()` (an RxJS `BehaviorSubject` method, not the signals API), plus "### Stub RxJS Subjects" using `BehaviorSubject` — this is the skill Claude Code loads for testing work in this repo. | ✅ Fixed — rewritten against the real signals-core API (`.get()`, `observe()`), verified against real `.test.ts` files in `mvvm-core`. |
| `skills/mvvm-development/SKILL.md:12,23,41` | "the RxJS/Zod patterns the library enforces"; "keep RxJS subscriptions disciplined"; "provide stubbed RxJS subjects when exercising models/view models." | ✅ Fixed. |
| `skills/mvvm-development/references/mvvm-core-overview.md:13` | "Always call `dispose()` on view models to release RxJS subscriptions." | ✅ Fixed. |
| `skills/mvvm-development/references/mvvm-react-example.md:6,11` | Described a `useObservable` hook that "bridges RxJS observables" and "RxJS async pipes" — doubly stale: the real React adapter is `useSignal` (`useSyncExternalStore`-based, see `apps/mvvm-react/src/hooks/useSignal.ts`), not an RxJS-named hook at all. | ✅ Fixed — corrected to `useSignal` and named the real Angular/Vue equivalents (`fromLoomSignal`, `useSignal`/`shallowRef`). |
| `.kiro/steering/instructions.md:61,124-128` | "`BaseModel`: RxJS-powered reactive state with Zod validation"; section "### RxJS Usage" stated "All reactive state uses RxJS `BehaviorSubject` and `Observable`" and described a `takeUntil(this._destroy$)` cleanup pattern that isn't how the current code works. This is a steering doc meant to guide automated/agent contributions. | ✅ Fixed — now describes signals-core and the real `addSubscription()`/`dispose()` pattern. |

### 1.2 Roadmap / package docs — ✅ fixed

| File | Issue | Status |
| --- | --- | --- |
| `apps/docs/content/docs/packages-roadmap.mdx:92,169` | Described `http-core` as "zero dependencies outside of RxJS" and `router-core` as exposing an "RxJS `currentRoute$` observable." **Verified against the real packages**: `http-core` and `router-core` have zero rxjs dependency in their actual `package.json` — this never happened. (Line 316's `platform-core` claim was left unchanged — it's accurate, see §2.1.) | ✅ Fixed — `http-core` line now says "zero dependencies"; `router-core` line now describes the real `router.subscribe()` callback API. |
| `packages/mvvm-patterns/README.md:11` | Features list: "RxJS-based reactive state management" — `mvvm-patterns`' `package.json` depends only on `@web-loom/signals-core`, no rxjs. | ✅ Fixed. |
| `packages/mvvm-core/src/state/README.md:11` | "RxJS Observables: Reactive streams for `isBusy$`, `operations$`, `busyReasons$`, `currentReason$`" — `BusyState.ts` (the file this documents) is built entirely on `signal()`/`computed()` from `@web-loom/signals-core`, confirmed by reading the source. | ✅ Fixed. |
| `apps/mvvm-marko/README.md:29` | "ViewModels live inside `@repo/view-models` and wrap the shared models in reusable RxJS-powered observables" — `packages/view-models` depends only on `@web-loom/signals-core`/`@web-loom/mvvm-core`; no rxjs anywhere in its source. | ✅ Fixed. |

### 1.3 Confirmed clean — no action needed (listed for audit completeness)

Checked and correctly frame RxJS as historical, optional interop, or Angular-specific — not flagged:

- Root `README.md` (explicitly: "reactive signals in place of RxJS")
- `apps/docs/content/docs/{core-concepts,fundamentals,getting-started,mvvm-core,signals-core,mvvm-angular-use-case,mvvm-marko-use-case}.mdx`
- `apps/docs/content/blog/{01-mvvm-core,02-signals-core,03-event-emitter-core,10-mvvm-patterns}.md`
- All 11 spot-checked `mvvm-book` chapters (3, 5, 6, 7, 10, 11, 12, 13, 14, 16, 23) — chapter 13 and 23 in particular are explicitly the "Signals by default, RxJS as opt-in interop" migration narrative chapters
- `packages/mvvm-core/README.md`, `packages/platform-core/README.md`, `packages/signals-core/README.md`, `packages/forms-core/src/{state,validation}/README.md`, `packages/ui-core/docs/examples/ANGULAR_EXAMPLES.md` — all accurately describe their package's real current state

---

## 2. Source-code gaps

### 2.1 Packages genuinely still on RxJS (unmigrated)

| Package | Status | Consumed by? |
| --- | --- | --- |
| `packages/platform-core` | Fully RxJS-based (`src/observables/{network,viewport,battery}.ts`), real `"rxjs": "^7.8.2"` dependency, `"private": true` (unpublished). | Not consumed by any app in this repo — only referenced by `scripts/vite-alias.ts` and the MCP server's `list-packages` tool. |
| `packages/forms-core` | `ErrorsContainer`, `AsyncErrorsContainer`, `state/DirtyTracker.ts` (`FieldDirtyTracker`/`DirtyTracker`) are built on `Observable`/`Subject`/`BehaviorSubject`, all exported from the package's public `index.ts`. `"private": false"` — **published to npm** in this state. | Not consumed by any app in this repo either — only referenced by the MCP server's docs/scaffolding tools (`explain-pattern.ts`, `list-packages.ts`, `select-package.ts`, `architecture.ts`, `scaffold-form.ts`/`templates/form.ts`). The scaffolding tool itself generates `FormFactory`-based code (event-emitter-core, not RxJS), so it isn't actively propagating the RxJS surface — but the package's public API still exposes it. |
| `packages/ui-core/src/adapters/angular/*` | Deliberate interop: wraps signal-based behaviors as RxJS `Observable`/`BehaviorSubject` for Angular's `async` pipe idiom. **This pattern itself is legitimate** — Angular's ecosystem expects Observables — but see the dependency bug in §2.2. | `apps/mvvm-angular` presumably, via `@web-loom/ui-core`'s Angular subpath (not independently verified this session). |

### 2.2 Undeclared dependencies (real bugs — currently worked only via npm hoisting) — ✅ fixed

| File | Bug | Status |
| --- | --- | --- |
| `packages/forms-core/package.json` | Imports `rxjs`/`rxjs/operators` in real (non-test) source (`ErrorsContainer.ts`, `AsyncErrorsContainer.ts`, `DirtyTracker.ts`) but declared **no `rxjs` dependency anywhere**. Worked only because some other workspace package hoists `rxjs` into the shared `node_modules`. | ✅ Fixed — `"rxjs": "^7.8.2"` added to `dependencies`, matching the version pin used elsewhere (`platform-core`, `signals-core`). All 142 forms-core tests still pass. |
| `packages/ui-core/package.json` | `src/adapters/angular/*.ts` imports both `@angular/core` and `rxjs` directly, but `package.json` declared neither as a dependency or peer dependency (only `react`/`vue` were peer deps). | ✅ Fixed — added `@angular/core` and `rxjs` as optional `peerDependencies` (same `optional: true` pattern already used for `react`/`vue`). All 680 ui-core tests (including the 8 Angular adapter suites) still pass. |
| `packages/mvvm-patterns/package.json` | `examples/tab-example.ts` imports `interval`/`Subscription` from `rxjs`, undeclared (package only depends on `signals-core`). It's an example file, not part of the built `dist`, and also looks stale relative to the current `ActiveAwareViewModel`/`BaseModel` signals API regardless of the RxJS question. | Left as-is — a judgment call (update to signals or delete), not a mechanical fix. See remediation item below. |

### 2.3 Stale `package.json` metadata (cosmetic, no functional impact) — ✅ fixed

- `packages/query-core/package.json` — `"rxjs"` was listed in `keywords` only; removed (no real dependency).
- `packages/store-core/package.json` — same; removed.
- `packages/mvvm-core/tsconfig.json:23-24` — deleted the two dead commented-out `paths` entries referencing an `rxjs` alias (comment already said "Removed").

### 2.4 Confirmed correct, not a gap

- `packages/signals-core`'s `./rxjs` export subpath and optional `rxjs` peer dependency — this is the deliberate, documented interop bridge (`observe()`-style adapters), exactly as intended.
- `apps/mvvm-angular`'s real `rxjs` dependency — no direct source usage found; this is Angular's own framework/CLI requirement, not something Web Loom's migration controls.
- `packages/ui-patterns` — no rxjs or signals-core dependency declared directly; not implicated.

---

## 3. Not deeply reviewed this pass (lower priority, spot-check candidates)

These matched the initial grep but were judged unlikely to be current-guidance gaps and weren't read in depth — flagging so they aren't lost, not asserting they're clean:

- `.kiro/specs/mvvm-book-rewrite/*`, `.kiro/specs/mvvm-core-signals-migration/*`, `.kiro/specs/ui-core-and-patterns/*`, `.kiro/specs/ui-core-gaps/tasks.md` — planning/spec docs; the migration spec is definitionally about RxJS→signals and the book-rewrite specs likely mirror the (confirmed-clean) book chapters, but not independently verified.
- `docs/MVVM-CORE-PRISM-ENHANCEMENTS.md`, `docs/PRISM-WEBLOOM-COMPARISON.md`, `docs/api-docs/{README,mvvm-core,query-core,store-core}.md`, `paper/{prompt,white-paper}.md` — comparison/academic content, low priority.
- `packages/http-core/{CHANGELOG,GAPS-ANALYSIS,IMPLEMENTATION-SUMMARY,IMPLEMENTATION_SUMMARY,P0-FIXES,README}.md` — `http-core` has zero rxjs dependency (confirmed), so these mentions are almost certainly incidental comparisons (e.g. "unlike axios/rxjs...").
- `packages/mvvm-core/{BUSY_STATE_IMPLEMENTATION,COMMAND_FLUENT_API_IMPLEMENTATION,COMPOSITE_COMMAND_IMPLEMENTATION,MVVM Web Library Development Plan for API Coding Agent,Product Requirements Document}.md`, `packages/mvvm-core/task/task2.md` — implementation notes/early planning docs, likely predate the migration; archival, not user-facing.
- `packages/mvvm-patterns/{CHECKLIST,COMPLETE_IMPLEMENTATION_SUMMARY,IMPLEMENTATION_SUMMARY,INTERACTION_REQUEST_CHECKLIST,INTERACTION_REQUEST_SUMMARY}.md` — implementation notes, same category.
- `packages/forms-core/{DIRTY_TRACKING_IMPLEMENTATION,ERRORS_CONTAINER_IMPLEMENTATION}.md` — likely accurate given `forms-core` genuinely still has RxJS-based `DirtyTracker`/`ErrorsContainer` (§2.1), but not independently verified.
- `packages/ui-patterns/docs/{FLOATING_ACTION_BUTTON,HUB_AND_SPOKE,PATTERN_ENHANCEMENTS}.md` — not reviewed.
- `apps/plugin-docs/content/docs/{03-framework-agnostic-design-principles,13-dashboard-analytics-plugins}.mdx`, `.../plugin_architecture_notes/kibana/*.md` — plugin-docs referencing an external framework's (Kibana's) architecture for comparison; unlikely to be about *our* RxJS usage.

---

## Remaining work

Everything mechanical (§1.1, §1.2, §2.2, §2.3) is done as of this pass. Two things are still open, both genuine decisions rather than typo fixes:

1. **Decide `forms-core`'s and `platform-core`'s fate.** Both are unconsumed by any app in this repo (only referenced by tooling/MCP-server scaffolding). Either:
   - migrate `ErrorsContainer`/`AsyncErrorsContainer`/`DirtyTracker` (forms-core) and the `network`/`viewport`/`battery` observables (platform-core) to signals-core for ecosystem consistency, or
   - explicitly document both as intentional RxJS-interop packages (the same framing already correctly applied to `ui-core`'s Angular adapters) and stop implying elsewhere that every core package is signals-based.

   This doc's fixes assumed the latter framing for now (`CONTRIBUTING.md` now names `forms-core`/`platform-core` as the exception) — but the actual package code/READMEs weren't changed, since that's a real engineering decision, not a docs fix.

2. **`packages/mvvm-patterns/examples/tab-example.ts`** — stale RxJS-based example (`interval`/`Subscription`, undeclared dependency) that also looks outdated relative to the current `ActiveAwareViewModel`/`BaseModel` API independent of the RxJS question. Update it to the current API or delete it.
