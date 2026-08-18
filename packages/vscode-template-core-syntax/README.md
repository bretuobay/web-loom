# web-loom-template-core-syntax

VS Code / Cursor extension — TextMate grammars for `@web-loom/template-core`:

- **Injection grammar** — highlights `compile(\`...\`)` template literals in `.ts`/`.tsx`/`.js`/`.jsx`
- **Standalone `.loom` files** — full-file highlighting for Phase 5-b template modules
- **Problem matcher** — `template-core` for Vite `dev: 'analyze'` terminal output

Syntax covered: `{{ }}`, `{{{ }}}`, `{{#if}}/{{#each}}/{{#switch}}`, `{{> partial}}`, plus HTML via `text.html.basic`.

## Install locally (VSIX)

No Marketplace publish required. Build a `.vsix` and install it once:

```bash
cd packages/vscode-template-core-syntax
npm install
npm run package:vsix
```

This writes `web-loom-template-core-syntax-0.8.0.vsix` (~10 KB) in this folder. Packaging uses an isolated staging directory so the monorepo root is **not** bundled (avoid running raw `vsce package` in a npm workspace — it can follow symlinks and produce a 1 GB VSIX).

### VS Code

**UI:** Extensions sidebar → `···` menu → **Install from VSIX…** → pick the `.vsix` file.

**CLI (Windows):**

```powershell
code --install-extension .\packages\vscode-template-core-syntax\web-loom-template-core-syntax-0.8.0.vsix
```

**CLI (WSL / Linux):**

```bash
code --install-extension packages/vscode-template-core-syntax/web-loom-template-core-syntax-0.8.0.vsix
```

**Cursor:** Same flow — Extensions → Install from VSIX, or:

```bash
cursor --install-extension packages/vscode-template-core-syntax/web-loom-template-core-syntax-0.8.0.vsix
```

Reload the window after install. Open `header.loom` or `compile(\`...\`)` in a `.ts` file to verify highlighting.

### Monorepo shortcut

From repo root (after `npm install`):

```bash
npm run package:vscode-syntax
```

## Extension Development Host (F5)

For grammar hacking without packaging:

1. Open `packages/vscode-template-core-syntax/` in VS Code / Cursor.
2. Run **Run Extension (Web Loom template syntax)** from `.vscode/launch.json` (F5).
3. In the Extension Development Host window, open
   `apps/ecommerce-template-core/src/templates/header.loom` or any `compile(\`...\`)` file.

## What gets highlighted

| Surface | Grammar |
| ------- | ------- |
| `compile(\`...\`)` in TS/JS | `inline.web-loom-template` (injection) |
| `*.loom` files | `text.web-loom.template` |

Tagged beyond built-in HTML:

- `{{ expr }}`, `{{{ expr }}}` (raw HTML)
- Block tags: `{{#if}}`, `{{#each}}`, `{{#switch}}`, `{{else}}`, partials `{{> name}}`
- Expression helpers: `@index`, `@key`, `$event`, `this`

`on:` / `:` / `class:` / `style:` directives use normal HTML attribute coloring (see limitations).

## Known limitations

- **Lexical, not semantic** — matches `compile(` before a backtick; does not resolve imports.
- **Attribute-value interpolations** — `attr="{{ x }}"` may not color mustache inside the string.
- **No LSP** — squiggles come from ESLint (`@web-loom/template-core-lint`) or Vite analyze + the bundled problem matcher.

## Testing

```bash
npm test
```

Headless grammar tests via `vscode-textmate` + `vscode-oniguruma`.

## Publishing (optional)

This repo ships VSIX for local install only. To publish to the [VS Code Marketplace](https://code.visualstudio.com/api/working-with-extensions/publishing-extension), create a publisher, add a PAT, and run `vsce publish` — not required for monorepo use.
