# Editor diagnostics (M4)

Source-linked diagnostics map template-core analyzer output to **positions inside your
`.ts`/`.tsx` files** — typically on the exact line inside a `compile(\`...\`)` template literal.

All tooling shares one implementation in `@web-loom/template-core-tooling`:

| API                                                      | Purpose                                                                             |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `collectSourceLinkedDiagnostics(file, source, options?)` | Scan a file and return linked diagnostics                                           |
| `analyzeCompileMatches(file, source, matches, options?)` | Same, when Vite already found `compile()` calls                                     |
| `SourceLinkedDiagnostic`                                 | `{ filePath, line, column, code, severity, message, templateName?, templateLine? }` |
| `formatSourceLinkedDiagnostic(d)`                        | Stable terminal line for Vite + VS Code problem matchers                            |

Template-relative spans from `analyzeTemplate()` are converted using `CompileCallMatch.templateContentStart`.

## ESLint (recommended for in-editor squiggles)

`@web-loom/template-core-lint` reports at the mapped **file line/column** (inside the template literal).

Enable in `eslint.config.mjs` with `@typescript-eslint/parser` — see
[`template-core-tooling.md`](./template-core-tooling.md) §7 and `apps/ecommerce-template-core`.

Requires the ESLint VS Code extension (or CI `npm run lint`).

## Vite dev analyze

```ts
templateCorePrecompile({ dev: 'analyze' });
```

Terminal output uses the same `[template-core] path:line:col … [CODE]` format. Lines/columns refer to
the **host source file**, not template-only coordinates.

### VS Code problem matcher

The [`web-loom-template-core-syntax`](../../vscode-template-core-syntax/) extension contributes a
`template-core` problem matcher. In `.vscode/tasks.json`:

```json
{
  "label": "vite dev (template analyze)",
  "type": "shell",
  "command": "npm run dev",
  "options": { "cwd": "${workspaceFolder}/apps/ecommerce-template-core" },
  "problemMatcher": ["template-core"]
}
```

Use with a Vite config that sets `dev: 'analyze'`. Diagnostics appear in the **Problems** panel when
Vite prints them to the integrated terminal.

## Programmatic / CI

```ts
import { collectSourceLinkedDiagnostics } from '@web-loom/template-core-tooling';

const diagnostics = collectSourceLinkedDiagnostics('src/templates/page.ts', source, {
  partials: { header: 'src/templates/header.ts' },
  strictPartials: true,
});

for (const d of diagnostics) {
  console.log(`${d.filePath}:${d.line}:${d.column} [${d.code}] ${d.message}`);
}
```

## Formatter (M3)

`formatTemplate()` from `@web-loom/template-core/compiler-node` runs the **same** `analyzeTemplate()`
pass before pretty-printing. When formatting fails, diagnostics use template-relative line/column;
offset them with `CompileCallMatch.templateContentStart` (from `findCompileCalls`) to report against
the host `.ts` file.

See [`template-formatting.md`](./template-formatting.md) for CLI usage, before/after examples, and a
TypeScript literal rewrite recipe.

## Limitations

- Only **static** `compile(\`literal\`)` call sites (same as Vite precompile / ESLint).
- Positions require analyzer source spans; syntax errors without line/column fall back to the
  `compile(` call start.
- Full LSP (hover, go-to-definition inside templates) is **not** in scope — see Phase 5 notes in
  `vscode-template-core-syntax/README.md`.
