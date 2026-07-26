# Template Core Phase 5 Requirements

## Status and intent

**Status:** Proposed / deferred — not scheduled.

This specification records a roadmap decision, not a committed deliverable: whether
`@web-loom/template-core` should offer dedicated template files (e.g.
`header.loom`) as an optional second authoring surface alongside today's
`compile(\`...\`)` tagged-template-literal strings, for developer-experience
reasons (separate files, syntax highlighting, tooling).

As of this writing, **no such feature exists or is planned** in
`packages/template-core/docs/PRD.md` or any of
`.kiro/specs/template-core-phase{1,2,3,4}/`. The nearest related item is
`template-core-phase4/tasks.md`'s unstarted P2 line, "Publish syntax-highlighting
guidance or a compatible grammar" — scoped only as tooling around the existing
string pipeline, not a new file format.

This phase is **explicitly gated** behind work that is already committed
elsewhere and must land first:

1. Phase 4 P1 (production hardening) — release-gating, unimplemented as of this
   writing. A new authoring surface should not be built on an engine whose SSR
   isolation, CSP guidance, and leak/benchmark story haven't been validated yet.
2. Phase 4 P2's "Build a Vite precompile plugin on top of the canonical compiler
   API" (`template-core-phase4/tasks.md`, P2) — a prerequisite building block
   regardless of whether `.loom` ever ships; it validates the
   `precompileNode`-in-a-Vite-plugin integration pattern this phase would reuse.

Every requirement below is P2/P3-equivalent in the Phase 4 priority scheme
("developer experience" / "exploratory") — this document defines no P0 or P1
requirements, and none of it is a release gate for any other phase.

| Priority | Meaning                        | Delivery rule                                             |
| -------- | ------------------------------- | ----------------------------------------------------------- |
| P5-a     | Cheapest validation step         | Only work that should start without further discussion      |
| P5-b     | Loader, contingent on P5-a signal | Starts only if P5-a demonstrates real developer demand      |
| P5-c     | Exploratory, timeboxed spike     | Explicit go/no-go; not a commitment to ship a type checker   |

## Guiding constraint

`@web-loom/template-core`'s grammar and runtime contract are stable and must not
fork. Per `template-core-phase4/design.md` §6: tooling must "consume the canonical
plan and diagnostic APIs... none should parse template syntax independently." A
`.loom` file's contents are byte-identical in grammar to what's inside today's
`compile(\`...\`)` backticks — no new syntax, no new expression grammar, no new
directive. This phase is authoring ergonomics only.

## P5-a. Editor syntax highlighting (MVP, no new file format required)

A TextMate grammar (or injection grammar) that highlights Web Loom template
syntax — `{{ }}`, `{{#if}}/{{#each}}/{{#switch}}`, `on:`, `:attr`, `class:`,
`style:` — SHALL be pursued first, independent of whether `.loom` files are ever
introduced. It SHOULD work two ways:

- As an injection grammar inside `compile(\`...\`)` template-literal strings in
  `.ts`/`.js` source (works today, zero new file format, zero build tooling).
- As a standalone grammar for a `.loom` file, if and when one exists.

This requirement exists to let the cheapest, highest-leverage deliverable ship
(and the real DX need be validated) without waiting on any other requirement in
this document.

## P5-b. `.loom` file format and Vite integration

IF pursued (contingent on demonstrated need after P5-a ships):

- A `.loom` file SHALL contain exactly the same grammar as a `compile()` string
  argument today. No new syntax.
- A Vite plugin SHALL resolve/load/transform `.loom` files:
  - In dev (`command === 'serve'`), it SHALL emit a virtual module that calls the
    existing runtime `compile()` (`packages/template-core/src/runtime/renderer.ts`)
    unchanged.
  - In build (`command === 'build'`), it SHALL call the existing
    `precompileNode()` (`packages/template-core/src/compiler/node.ts`) and emit a
    module exporting the serialized `SerializableTemplatePlan`, consumed via
    `fromPrecompiled()`.
- The plugin SHALL introduce no new compiler or parser code — it is glue around
  `compile`/`precompileNode`/`fromPrecompiled`, which already exist and already
  accept arbitrary `sourcePath` values with no extension validation
  (`packages/template-core/scripts/precompile.mjs`).
- HMR behavior SHALL be specified and tested before this requirement is
  considered met — hand-rolled Vite loaders are the most likely source of subtle
  bugs (stale module state, double-mount, lost local state across edits).

## P5-c. Template context typing (exploratory only)

Context typing for `.loom`/string templates is capped by the same constraint the
engine already has: `PRD.md` states "deep static JavaScript type analysis is out
of scope." This requirement SHALL NOT be read as a commitment to build a type
checker. It exists only to scope what a bounded spike may investigate:

- A `declareContext<TVm>()`-style helper (or `.loom.d.ts` stub) that types a
  template *module's export* is in scope for a spike.
- Cross-referencing expression paths inside `{{ }}`/`on:`/`:attr` against a
  declared context type (shallow property-name checking) is speculative,
  genuinely new static-analysis work, and requires an explicit go/no-go before
  any implementation begins.
- This requirement explicitly does **not** fix the class of bug documented in
  `packages/template-core/README.md`'s "Binding a ViewModel vs. binding a DTO
  snapshot" section (added after the `ecommerce-template-core` cart-drawer bug):
  expression-to-context resolution is runtime string lookup by design (no
  `eval`/`new Function`, per PRD §6.7), and no tooling proposed in this phase
  changes that failure mode. Any spike report MUST say this explicitly rather
  than imply the typing story fixes it.

## Non-goals

- No new template expression grammar or directive.
- No requirement to migrate any existing string-based template
  (`apps/ecommerce-template-core/src/templates/*.ts`) to `.loom` — both authoring
  styles remain valid indefinitely if `.loom` ships at all.
- No commitment that P5-b or P5-c ever ship — P5-a is the only unconditionally
  worthwhile item; everything past it is contingent on demonstrated need.
- No in-editor diagnostics or go-to-definition in this document's scope — that
  tier would require a language server and is not specified here.
