# Template Core Phase 5 Tasks

**All items in this file are deferred.** None are scheduled. This phase starts
only on demonstrated need, not by default — see `requirements.md` for the
priority rationale (P5-a/b/c) and `design.md` for the sequencing diagram.

## Preconditions (must be true before any item below starts)

- [ ] Phase 4 P1 (production hardening) is complete —
      see `template-core-phase4/tasks.md` P1 block.
- [ ] Phase 4 P2's "Build a Vite precompile plugin on top of the canonical
      compiler API" is complete — see `template-core-phase4/tasks.md:43`.

## P5-a — Editor syntax highlighting (cheapest validation step)

- [ ] Write a TextMate grammar (or injection grammar) covering `{{ }}`,
      `{{#if}}/{{#each}}/{{#switch}}`, and `on:`/`:`/`class:`/`style:` attribute
      forms, layered over `text.html.basic`.
- [ ] Ship it as an injection grammar for `compile(\`...\`)` strings in `.ts`
      files first — this requires no `.loom` file format and no build tooling.
- [ ] Gather real usage signal (does this alone resolve the DX complaint that
      motivated this phase?) before starting P5-b.

## P5-b — `.loom` Vite loader (contingent on P5-a signal)

- [ ] Design and implement `resolveId`/`load`/`transform` hooks for `.loom`
      files: dev mode emits a virtual module calling `compile()`; build mode
      calls `precompileNode()` and emits a module consumed via
      `fromPrecompiled()`.
- [ ] Specify and test HMR behavior explicitly (no stale module state, no
      double-mount, no lost component-local state across template-only edits).
- [ ] Extend the P5-a grammar to cover standalone `.loom` files (not just the
      injection-grammar case).
- [ ] Write an authoring guide documenting when to use `.loom` vs. strings —
      explicit that both remain valid indefinitely, no migration is required.

## P5-c — Context-typing spike (exploratory, timeboxed, go/no-go)

- [ ] Timebox a spike investigating a `declareContext<TVm>()`-style helper or
      `.loom.d.ts` stub that types a template module's *export* only.
- [ ] Explicitly evaluate (and document the answer) whether shallow
      expression-to-context property checking is worth pursuing — default
      answer is no unless the spike finds a low-risk way to bound it.
- [ ] Whatever the outcome, update `packages/template-core/README.md`'s
      "Binding a ViewModel vs. binding a DTO snapshot" section if this spike
      changes the story described there — otherwise leave it as-is, since the
      spike is not expected to change that failure mode.

## Validation checklist

- [ ] No item in this file blocks or delays any Phase 4 release.
- [ ] P5-a shipping (or not) does not imply any commitment to P5-b or P5-c.
- [ ] If P5-b ships, both authoring styles (string and `.loom`) remain
      supported — no forced migration of existing templates.
- [ ] Any go/no-go decision from P5-c is recorded in this file's status, not
      left implicit.
