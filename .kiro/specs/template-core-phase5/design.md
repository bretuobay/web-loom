# Template Core Phase 5 Design

## Design principle

Phase 5 adds, at most, an _optional second authoring surface_ over the unchanged
compiler/runtime — it does not fork the grammar, does not add a second parser,
and does not change the Phase 1–4 public API contract. Every piece below reuses
an existing entry point (`compile`, `precompileNode`, `fromPrecompiled`,
`template-core-precompile`); none of them require new template-syntax parsing.

This mirrors the reuse principle already stated in
`template-core-phase4/design.md` §6: "The CLI, Vite plugin, formatter, linter, and
editor integrations should all consume the canonical plan and diagnostic APIs.
None should parse template syntax independently."

## Sequencing

```text
Phase 4 P1 (production hardening — release-gating, must land first)
        ↓
Phase 4 P2 — generic Vite precompile plugin for string-based compile(`...`) calls
        (already a committed, unstarted P2 item; prerequisite regardless of .loom)
        ↓
P5-a — TextMate/injection grammar for compile(`...`) strings and .loom files
        (cheapest step; validates whether the DX pain is real before building a loader)
        ↓  (only if real usage signal follows P5-a)
P5-b — .loom Vite loader (resolveId/load/transform)
        dev:   compile()            — unchanged runtime entry point
        build: precompileNode() → SerializableTemplatePlan → fromPrecompiled()
        ↓  (only if pursued further)
P5-c — Context-typing spike (timeboxed, capped scope, explicit go/no-go)
```

P5-a is the only item this phase recommends starting without further discussion.
P5-b and P5-c are contingent, in that order, on evidence that the prior step
produced real developer value.

## 1. Two-mode compile pipeline (P5-b)

If `.loom` file support is built, it branches on Vite's `command`, matching the
existing dev/build split already implicit in `compile()` vs. `precompileNode()`:

- **Dev (`serve`)** — the plugin's `load()`/`transform()` hook reads the `.loom`
  file's raw text and emits a virtual module:

  ```ts
  import { compile } from '@web-loom/template-core';
  export default compile(<source>, { name, sourcePath });
  ```

  This is the same runtime `compile()` every template already uses
  (`packages/template-core/src/runtime/renderer.ts`), unchanged. HMR is a
  standard Vite file-transform pattern: on change, re-transform and let
  `import.meta.hot.accept` re-run mount with the new compiled module.

- **Build** — the plugin instead calls `precompileNode(source, { name,
sourcePath })` (`packages/template-core/src/compiler/node.ts:32-51` — the same
  function the `template-core-precompile` CLI already calls) and emits a module
  exporting the serialized `SerializableTemplatePlan`, consumed via
  `fromPrecompiled()` (`renderer.ts` for browser, `src/ssr/index.ts` for SSR).
  This keeps parse5/preprocessing out of the client bundle.

**Zero net-new compiler work is the load-bearing fact here.** `precompile()` /
`precompileNode()` already accept an arbitrary `sourcePath` purely as diagnostic
metadata (`compiler/index.ts:6-17`, `compiler/node.ts:32-51`), and the CLI
(`scripts/precompile.mjs`) already does `readFile(sourcePath, 'utf8')` with zero
extension validation — a `.loom` file already flows through the existing CLI
today with no code changes at all. The only genuinely new code for P5-b is the
Vite `resolveId`/`load`/`transform` glue itself; no existing package in this repo
is a precedent for it (`@web-loom/template-core-vite-ssr` is SSR _document_
orchestration — middleware-mode dev server plus marker string-replacement on
`index.html` — not a file-transform plugin).

## 2. Editor tooling tiers (P5-a vs. future)

- **P5-a (in scope for this phase):** a TextMate grammar that `include`s
  `text.html.basic` and layers scope injections for `{{ }}`, block keywords
  (`#if`/`#each`/`#switch`), and the `on:`/`:`/`class:`/`style:` attribute
  forms. No parsing infrastructure, no server process. Works as an _injection_
  grammar inside `compile(\`...\`)`strings in`.ts`files today — this doesn't
require`.loom` to exist at all, which is why it's sequenced first.
- **Beyond this phase (explicitly not specified here):** in-editor diagnostics
  and go-to-definition would need a real language server. The diagnostics half
  has existing plumbing to build on — `sourcePath`/`line`/`column`-aware
  diagnostics already exist (`renderer.ts`, README "SSR, hydration, and
  precompilation"), and `compiler/node.ts`'s per-node `SourceLocation` tracking
  (populated from parse5's `sourceCodeLocation`) is exactly the data an LSP would
  translate into `Diagnostic.range`. Go-to-definition has no foundation until
  P5-c's typing question is resolved — there is nothing to jump _to_ without a
  declared context type. This tier is out of scope for Phase 5 and would need
  its own proposal.

## 3. Effort / risk

| Piece                                               | Size                                | Notes                                                                                                                                     |
| --------------------------------------------------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Generic Vite precompile plugin (Phase 4 P2, prereq) | M                                   | AST-scans `.ts` for `compile(\`...\`)` call sites; dev/build branching; already committed, not part of this phase's scope but blocks P5-b |
| P5-a TextMate/injection grammar                     | S                                   | Mechanical: extend `text.html.basic`, ~4-5 scope injection rules                                                                          |
| P5-b `.loom` Vite loader                            | S–M                                 | Thin once the P2 plugin exists; first-time Vite-plugin-API ramp-up since no in-repo precedent exists                                      |
| CLI reuse for `.loom`                               | ~0                                  | Already works unmodified today                                                                                                            |
| P5-c context-typing spike                           | M (spike), open-ended if not capped | Real risk is scope creep past the timebox                                                                                                 |
| Docs (authoring guide, "`.loom` vs. strings")       | S                                   |                                                                                                                                           |

**Risks to weigh before starting P5-b or P5-c:**

- **Fragmented authoring story** — two ways to write the same template means
  every doc example and every "how do I..." answer needs to cover both; a repo
  with inconsistent adoption across template files looks worse than either
  option alone.
- **Adoption uncertainty** — no user request or spec precedent currently exists
  for `.loom` beyond this proposal; P5-a's injection grammar may fully satisfy
  the actual DX complaint without ever needing a loader.
- **HMR correctness** — the piece most likely to eat unplanned time relative to
  its S/M sizing; hand-rolled Vite loaders are easy to get subtly wrong (stale
  module state, double-mount, lost component-local state across template-only
  edits).
- **Grammar drift** — the string and `.loom` grammars must stay identical by
  construction; every future grammar change (new directive, new block type) now
  has two authoring surfaces whose docs/tooling must be updated in lockstep.
- **Typing scope creep** — "shallow context checking" (P5-c) is deceptively easy
  to start and hard to bound; treat the timebox as a hard constraint.
