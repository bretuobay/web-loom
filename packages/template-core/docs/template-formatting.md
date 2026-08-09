# Template formatting (M3)

Pretty-print template source strings using the same **`analyzeTemplate`** pipeline as the linter,
Vite plugin, and precompiler. Syntax and static checks run first; invalid templates return
diagnostics and **no** formatted output — there is no second parser.

**Package:** `@web-loom/template-core/compiler-node`
**CLI:** `template-core-format` (shipped with `@web-loom/template-core`)

---

## Quick start

### Standalone `.html` file

```bash
# Preview formatted output
npx template-core-format --input src/partials/header.html

# Write in place
npx template-core-format --input src/partials/header.html --write

# CI — exit 1 when the file would change
npx template-core-format --input src/partials/header.html --check
```

### Programmatic

```ts
import { formatTemplate } from '@web-loom/template-core/compiler-node';

const { ok, formatted, diagnostics, unchanged } = formatTemplate(source, {
  name: 'Header',
  sourcePath: 'src/templates/header.ts',
  indent: 2,
});

if (!ok) {
  diagnostics.forEach((d) => console.error(d.code, d.message));
} else if (!unchanged && formatted) {
  await writeFile(path, formatted, 'utf8');
}
```

---

## What changes (and what does not)

The formatter is a **layout** tool, not a semantic rewriter. It tokenizes the **original source**
so directives, expressions, and attribute values stay byte-for-byte identical inside each token.

| Restructured | Preserved verbatim |
| ------------ | ------------------ |
| Line breaks before block tags (`{{#if}}`, `{{#each}}`, `{{else}}`, `{{/if}}`, …) | Expression text inside `{{ }}` / `{{{ }}}` |
| Line breaks before partials (`{{> name}}`) | Directives: `on:click`, `:href`, `class:`, `style:`, `bind:`, `use:` |
| Indentation of nested HTML tags | Tag attribute names and values (including modifier chains like `on:click.prevent`) |
| Collapsed inter-tag whitespace in text nodes | `<script>` and `<style>` interiors (opaque regions) |

### Before → after

**Input (minified):**

```html
<div>{{#if show}}<p>{{ title$ }}</p>{{else}}<p>Hidden</p>{{/if}}</div>
```

**Output (`indent: 2`):**

```html
<div>
  {{#if show}}
    <p>{{ title$ }}</p>
  {{else}}
    <p>Hidden</p>
  {{/if}}
</div>
```

**Directives unchanged:**

```html
<button on:click="save" class:active="isActive$" :disabled="busy$">{{ label$ }}</button>
```

becomes a multi-line layout; attribute strings are not reformatted or reordered.

---

## API reference

### `formatTemplate(source, options?)`

```ts
import type {
  FormatTemplateOptions,
  FormatTemplateResult,
} from '@web-loom/template-core/compiler-node';
```

#### `FormatTemplateOptions`

Extends [`AnalyzeOptions`](./editor-diagnostics.md) (same as `analyzeTemplate`):

| Field | Type | Default | Purpose |
| ----- | ---- | ------- | ------- |
| `indent` | `number` | `2` | Spaces per nesting level |
| `name` | `string` | — | Diagnostic template name |
| `sourcePath` | `string` | — | Diagnostic file path |
| `partials` | `Record<string, string>` | — | Static partial manifest for `MISSING_PARTIAL` checks |
| `strictPartials` | `boolean` | `false` | Promote missing partials to errors |

#### `FormatTemplateResult`

| Field | When set | Meaning |
| ----- | -------- | ------- |
| `ok` | always | `false` when any diagnostic has `severity: 'error'` |
| `formatted` | `ok === true` | Pretty-printed source (single trailing newline) |
| `diagnostics` | always | Full analyzer output (errors **or** warnings) |
| `unchanged` | `ok === true` | `true` when formatted output equals input after trailing-newline normalization |

**Error path:** invalid syntax, bad expressions, modifier conflicts, or `strictPartials` failures →
`{ ok: false, diagnostics }` with **no** `formatted` field. Same codes as ESLint / Vite analyze
(`INVALID_TEMPLATE`, `INVALID_EXPRESSION`, `MODIFIER_CONFLICT`, …).

**Warning path:** e.g. `RAW_HTML_UNSANITIZED`, `UNSAFE_URL_SCHEME`, `MISSING_PARTIAL` (non-strict)
→ `{ ok: true, formatted, diagnostics: [...warnings] }`. Formatting proceeds; gate warnings in CI
separately if needed.

---

## CLI reference

```
template-core-format --input <path> [--write] [--check] [--indent N] [--name Name]
```

| Flag | Behavior |
| ---- | -------- |
| _(none)_ | Print formatted source to **stdout** |
| `--write` | Overwrite `--input` when output would change |
| `--check` | Exit `1` if the file is not already formatted; no writes |
| `--indent N` | Indent width (default `2`) |
| `--name Name` | Passed through to analyzer diagnostics |

On analyzer errors, prints `[severity] path:line:col CODE: message` lines to **stderr** and exits `1`.

### npm script example

```json
{
  "scripts": {
    "format:templates": "template-core-format --input src/partials --write",
    "format:templates:check": "find src/partials -name '*.html' -exec template-core-format --input {} --check \\;"
  }
}
```

---

## Formatting `compile(\`...\`)` literals in TypeScript

Use **`formatCompileCallsInSource()`** from `@web-loom/template-core-tooling` (or the
`template-core-format-calls` CLI). It scans static `compile(\`...\`)` and `context.compile(\`...\`)`
sites via `findCompileCalls()`, then runs `formatTemplate()` on each literal.

### CLI (recommended)

```bash
# Format template literals in one or more .ts files (in place)
npx template-core-format-calls --write src/templates/header.ts

# CI / pre-commit check mode
npx template-core-format-calls --check src/templates/*.ts
```

From the monorepo root:

```bash
npm run format:templates -- apps/ecommerce-template-core/src/templates/header.ts
npm run format:ecommerce-templates          # all demo template modules (tsx, no dist required)
npm run format:ecommerce-templates:check    # CI gate for demo templates
```

### Pre-commit (monorepo)

`.husky/pre-commit` runs on **staged `.ts`/`.tsx` files**:

1. Builds `@web-loom/template-core` + `@web-loom/template-core-tooling` when `dist/` is missing
   (turbo-cached afterward).
2. Runs `npm run format:templates -- <staged files>` (`--write`).
3. Re-stages files that changed.

Invalid templates **block the commit** with source-linked diagnostics
(`path:line:col [CODE]`). Files without `compile()` call sites are unchanged.

### Programmatic

```ts
import { readFileSync, writeFileSync } from 'node:fs';
import { formatCompileCallsInSource } from '@web-loom/template-core-tooling';

const filePath = 'src/templates/storefront.ts';
const source = readFileSync(filePath, 'utf8');
const { changed, source: next, diagnostics } = formatCompileCallsInSource(source, { filePath });

if (diagnostics.some((d) => d.severity === 'error')) {
  throw new Error(diagnostics.map((d) => d.message).join('\n'));
}
if (changed) writeFileSync(filePath, next, 'utf8');
```

**Caveats**

- Only **static** template literals (no `${…}` inside the template body).
- Dynamic first arguments (`compile(variable)`) are skipped.
- Re-encoding escapes `` ` ``, `\`, and `${` in formatted output.

---

## CI integration

Typical pipeline:

1. **`npm run lint`** — `@web-loom/template-core-lint` on `.ts` templates (static rules).
2. **`template-core-format --check`** — layout drift on committed `.html` partials (if any).
3. **`turbo run build`** — Vite precompile (production plans).

`--check` is idempotent: running the formatter twice yields `unchanged: true` on the second pass.

---

## Architecture

```
source string
    │
    ▼
analyzeTemplate()  ──error──►  { ok: false, diagnostics }
    │
    ▼ ok (+ optional warnings)
tokenize original source  (tags, mustache, opaque script/style)
    │
    ▼
pretty-print (indent blocks + tags; preserve token interiors)
    │
    ▼
{ ok: true, formatted, diagnostics, unchanged }
```

Same diagnostic model as Phase 4 design §6 — no independent parser. See
[`.kiro/specs/template-core-phase4/design.md`](../../.kiro/specs/template-core-phase4/design.md).

---

## Limitations

- **Layout only** — does not wrap long lines, sort attributes, or reformat JavaScript/CSS inside
  `<script>` / `<style>`.
- **No source maps for formatted output** — formatted text is new layout; analyzer source spans refer
  to the input string passed to `formatTemplate`.
- **No VS Code “Format Document” integration yet** — use CLI, npm script, or programmatic API.
  Syntax highlighting for template literals: [`vscode-template-core-syntax`](../../vscode-template-core-syntax/).
- **No `.loom` file loader** — deferred to Phase 5; formatter works on extracted/plain strings today.

---

## Related docs

| Doc | Topic |
| --- | ----- |
| [`template-core-tooling.md`](./template-core-tooling.md) §13 | Cookbook recipe |
| [`editor-diagnostics.md`](./editor-diagnostics.md) | Source-linked positions (M4) |
| [`typing-spike.md`](./typing-spike.md) | Context typing at mount sites (M5) |
| [`../README.md`](../README.md) | Engine API + precompile CLI |
| [`.kiro/specs/template-core-phase4/`](../../.kiro/specs/template-core-phase4/) | R8 tooling requirements |
