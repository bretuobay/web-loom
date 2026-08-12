# Template Core Phase 5 Tasks

**All items in this file are deferred.** None are scheduled. This phase starts
only on demonstrated need, not by default — see `requirements.md` for the
priority rationale (P5-a/b/c) and `design.md` for the sequencing diagram.

## Preconditions (must be true before any item below starts)

- [x] Phase 4 P1 (production hardening) is complete —
      see `template-core-phase4/tasks.md` P1 block.
- [x] Phase 4 P2's "Build a Vite precompile plugin on top of the canonical
      compiler API" is complete — see `template-core-phase4/tasks.md:43`.

## P5-a — Editor syntax highlighting (cheapest validation step)

- [x] Write a TextMate grammar (or injection grammar) covering `{{ }}`,
      `{{#if}}/{{#each}}/{{#switch}}`, and `on:`/`:`/`class:`/`style:` attribute
      forms, layered over `text.html.basic`. See
      `packages/vscode-template-core-syntax/`. `on:`/`:`/`class:`/`style:`
      attribute forms are verified to render sensibly via `text.html.basic`'s
      own attribute tokenization rather than given bespoke scopes — see that
      package's README "Known limitations" for why, and for the
      attribute-*value* interpolation gap this implies.
- [x] Ship it as an injection grammar for `compile(\`...\`)` strings in `.ts`
      files first — this requires no `.loom` file format and no build tooling.
      Injects into `source.ts`/`.tsx`/`.js`/`.jsx`; not published to the
      Marketplace (local/dev-install only — see package README).
- [ ] Gather real usage signal (does this alone resolve the DX complaint that
      motivated this phase?) before starting P5-b. Not yet — this requires
      real developer usage over time, not something satisfiable in the same
      pass as writing the grammar. P5-b remains un-started until this is
      revisited.

## P5-b — `.loom` Vite loader (contingent on P5-a signal)

- [x] Design and implement `resolveId`/`load`/`transform` hooks for `.loom`
      files: dev mode emits a virtual module calling `compile()`; build mode
      calls `precompileNode()` and emits a module consumed via
      `fromPrecompiled()` (`templateCoreLoom()` in `@web-loom/template-core-vite`).
- [x] Specify and test HMR behavior explicitly (no stale module state, no
      double-mount, no lost component-local state across template-only edits).
      Dev module calls `import.meta.hot.accept()`; plugin `handleHotUpdate`
      invalidates the virtual module. Manual mount/dispose remains app-owned —
      see `docs/template-loom-authoring.md`.
- [x] Extend the P5-a grammar to cover standalone `.loom` files (not just the
      injection-grammar case) — `text.web-loom.template` in
      `packages/vscode-template-core-syntax`.
- [x] Write an authoring guide documenting when to use `.loom` vs. strings —
      explicit that both remain valid indefinitely, no migration is required
      (`packages/template-core/docs/template-loom-authoring.md`).
- [x] Migrate one ecommerce template (`header.loom`) as a reference integration.

## P5-c — Context-typing spike (exploratory, timeboxed, go/no-go)

- [x] Timebox a spike investigating a `declareContext<TVm>()`-style helper or
      `.loom.d.ts` stub that types a template module's *export* only.
      **Outcome (2026-08): go** — shipped in `@web-loom/template-core` as `declareContext`,
      `declarePartials`, `typedCompile`. See `packages/template-core/docs/typing-spike.md`.
- [x] Explicitly evaluate (and document the answer) whether shallow
      expression-to-context property checking is worth pursuing — default
      answer is no unless the spike finds a low-risk way to bound it.
      **Outcome: no-go** — documented in `typing-spike.md`.
- [x] Whatever the outcome, update `packages/template-core/README.md`'s
      "Binding a ViewModel vs. binding a DTO snapshot" section if this spike
      changes the story described there — added M5 typing subsection; failure mode unchanged.

## Validation checklist

- [ ] No item in this file blocks or delays any Phase 4 release.
- [ ] P5-a shipping (or not) does not imply any commitment to P5-b or P5-c.
- [ ] If P5-b ships, both authoring styles (string and `.loom`) remain
      supported — no forced migration of existing templates.
- [ ] Any go/no-go decision from P5-c is recorded in this file's status, not
      left implicit.
