# @web-loom/template-core-vite

Vite plugin for `@web-loom/template-core`:

- **Build** — replaces static `compile(\`...\`)` call sites with `fromPrecompiled(plan)` so the
  runtime HTML parser never runs for those templates in the shipped bundle.
- **Dev analyze** (opt-in) — runs `analyzeTemplate()` on changed files, reports diagnostics to
  the terminal, and leaves source unchanged.
- **Dev precompile** (opt-in) — same rewrite as build during `vite dev`, with an in-memory cache
  for stable output across HMR passes.

This is Phase 4 P2 tooling — glue around `analyzeTemplate()` / `precompileNode()` / `fromPrecompiled()`,
with no second parser.

## Usage

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import { templateCorePrecompile } from '@web-loom/template-core-vite';

export default defineConfig({
  plugins: [
    // Build precompile only (default)
    templateCorePrecompile(),

    // Or: compile-time feedback during dev (source unchanged)
    // templateCorePrecompile({ dev: 'analyze' }),

    // Or: production-style precompile during dev (recommended for perf parity)
    // templateCorePrecompile({ dev: 'precompile' }),
  ],
});
```

Write templates as before:

```ts
import { compile } from '@web-loom/template-core';

export const headerTemplate = compile(`<h1>{{ title }}</h1>`);
```

### Build behavior

In `vite build`, matching call sites are rewritten to:

```ts
import { fromPrecompiled } from '@web-loom/template-core';

export const headerTemplate = fromPrecompiled({ plan: /* embedded plan */ });
```

Invalid expressions and template syntax errors **fail the build** via `precompileNode()`.

### Dev analyze behavior

With `dev: 'analyze'`, the plugin:

1. Scans the same static `compile(\`...\`)` call sites as build mode
2. Runs `analyzeTemplate()` (Node-safe full compile from M0)
3. Emits `[template-core] file:line:col … [CODE]` warnings/errors to the Vite terminal
4. Returns source **unchanged** — runtime `compile()` still runs in the browser

Results are cached in memory by file content hash, so unchanged files are not re-analyzed on
every HMR pass. Fix a template, save, and diagnostics refresh when the hash changes.

### Dev precompile behavior

With `dev: 'precompile'`, the plugin:

1. Applies the **same** `compile()` → `fromPrecompiled(plan)` rewrite as production build
2. Caches the transformed module output by file content hash — unchanged files skip
   re-precompilation on repeated HMR transforms
3. Fails the transform on invalid templates (same as build)

Use this when you want dev/prod parity (no runtime HTML parser in the browser for static templates)
without waiting for a production build. Pair with ESLint (`@web-loom/template-core-lint`) or
`dev: 'analyze'` during authoring if you want editor/terminal feedback without precompiling.

`dev: 'analyze'` and `dev: 'precompile'` are mutually exclusive — pick one per config.

## `.loom` files (Phase 5-b)

Use `templateCoreLoom()` alongside (or instead of) string-based templates:

```ts
import { templateCoreLoom, templateCorePrecompile } from '@web-loom/template-core-vite';

export default defineConfig({
  plugins: [
    templateCoreLoom(),
    templateCorePrecompile(), // optional — still needed for compile() strings in .ts
  ],
});
```

```ts
// header.ts
export { default as headerTemplate } from './header.loom';
```

- **`vite dev`** — emits `compile(source, { name, sourcePath })` + HMR `accept()`
- **`vite build`** — emits `fromPrecompiled(plan)` via `precompileNode()`

TypeScript: `/// <reference types="@web-loom/template-core-vite/loom" />`

Full guide: [`../template-core/docs/template-loom-authoring.md`](../template-core/docs/template-loom-authoring.md).

## What gets processed

Only call sites where:

- `compile` is imported from `@web-loom/template-core` or `@web-loom/template-core/ssr`, and
- the first argument is a literal string or no-substitution template literal (no `${}`).

Dynamic sources (imported constants, interpolated literals) are silently skipped — same as build
mode. They remain runtime `compile()` calls.

## Options

```ts
interface TemplateCorePrecompilePluginOptions {
  include?: string | RegExp | (string | RegExp)[]; // default: [/\.tsx?$/]
  exclude?: string | RegExp | (string | RegExp)[]; // default: test/spec, __tests__, __fixtures__, benchmarks, node_modules
  specifiers?: string[]; // default: ['@web-loom/template-core', '@web-loom/template-core/ssr']
  dev?: 'analyze' | 'precompile'; // opt-in dev-server behavior
}

interface TemplateCoreLoomPluginOptions {
  specifier?: string; // default: @web-loom/template-core (or ssr entry when ssr: true)
  ssr?: boolean;
}
```

## Relationship to `@web-loom/template-core-vite-ssr`

Unrelated — that package is HTTP/SSR orchestration. Use both together freely; they don't interact.

For end-to-end integration recipes (SSR islands, outlets, lint, precompile), see the
[tooling cookbook](../template-core/docs/template-core-tooling.md).
