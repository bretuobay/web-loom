# web-loom-template-core-syntax

A minimal, local VS Code extension providing a TextMate **injection grammar**
that highlights `@web-loom/template-core` template syntax — `{{ }}`,
`{{{ }}}` (raw HTML), `{{#if}}/{{else if}}/{{else}}/{{/if}}`,
`{{#each}}/{{/each}}`, `{{#switch}}/{{#case}}/{{#default}}/{{/switch}}`,
`{{> partial}}` — inside `compile(\`...\`)` template-literal strings in
`.ts`/`.tsx`/`.js`/`.jsx` source.

This is Phase 5's P5-a: "Editor syntax highlighting (cheapest validation
step)" — `.kiro/specs/template-core-phase5/tasks.md`. It requires **no
`.loom` file format and no build tooling**; it works today, on the existing
string-based `compile()` authoring style.

## Scope

Injects into `source.ts`/`source.tsx`/`source.js`/`source.jsx` wherever a
`compile(` call is immediately followed by a template-literal (backtick)
string. The literal's content is treated as embedded `text.html.basic`, with
Web Loom's own mustache/block syntax layered on top.

**What gets tagged**, beyond ordinary HTML (which VS Code's built-in HTML
grammar already handles):

- `{{ expr }}` — plain interpolation
- `{{{ expr }}}` — raw HTML (distinct scope from plain interpolation)
- `{{#if}}` / `{{else if}}` / `{{else}}` / `{{/if}}`
- `{{#each ... key=...}}` / `{{/each}}`
- `{{#switch}}` / `{{#case}}` / `{{#default}}` / `{{/switch}}` (and their
  matching `{{/case}}`/`{{/default}}` closes)
- `{{> name}}` partial references
- `@index` / `@key` / `$event` / `this` inside expressions, as language
  variables

`on:`/`:`/`class:`/`style:`/`bind:`/`use:` attribute-form directives are
**not** given a bespoke scope — they're ordinary HTML attribute names as far
as VS Code's HTML grammar is concerned, and it already renders them
sensibly (attribute-name + string-value coloring). Giving them a distinct
color would require injecting into the HTML grammar's own internal
attribute-name scope, which is a materially bigger, more fragile piece of
work than this first pass — see "Known limitations" below.

## Known limitations

- **Lexical, not semantic.** The grammar matches on the literal text
  `compile(` immediately preceding a backtick — it does not resolve imports.
  An unrelated function also named `compile` (e.g. `pattern.compile(...)`)
  won't trigger the injection because of a `.` immediately before it, but a
  bare top-level `compile(\`...\`)` from any source would still match. This
  is an inherent limitation of TextMate grammars (no cross-reference
  capability), not specific to this implementation.
- **Interpolations inside attribute *values*** (e.g.
  `data-index="{{ @index }}"`) render as plain string content, without
  special mustache coloring — only interpolations in text-node content
  between tags get the full treatment. Once inside an HTML tag, VS Code's
  HTML grammar owns tokenization of everything up to the closing `>`, and
  our sibling patterns aren't consulted there. Fixing this would require a
  second injection specifically targeting the HTML grammar's internal
  attribute-value scope — out of scope for this first pass.
- **No `.loom` file support.** That authoring surface doesn't exist (see
  `template-core-phase5/requirements.md`); this grammar only covers the
  injection-into-`.ts`-strings case, which is explicitly the cheaper, first
  step.
- **No in-editor diagnostics or go-to-definition.** Syntax highlighting only
  — that tier would need a real language server and is out of scope for this
  phase (see `template-core-phase5/design.md` §2).

## Try it locally

This extension isn't published to the Marketplace. To try it:

1. Open `packages/vscode-template-core-syntax/` as its own VS Code workspace
   folder (or open the monorepo root — either works, since VS Code resolves
   `.vscode/launch.json` relative to the folder containing it).
2. Run the "Run Extension (Web Loom template syntax)" launch config (F5). A
   new Extension Development Host window opens with the grammar active.
3. Open any file with a `compile(\`...\`)` call, e.g.
   `apps/ecommerce-template-core/src/templates/header.ts`.

## Testing

`src/tokenize.test.ts` drives the grammar headlessly via `vscode-textmate` +
`vscode-oniguruma` — the same tokenizer engine VS Code itself uses — against
minimal stand-in `source.ts`/`text.html.basic` grammars (not the real,
much larger VS Code TypeScript/HTML grammars, which aren't this package's
responsibility to test). Run with `npm test`.
