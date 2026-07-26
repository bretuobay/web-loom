# @web-loom/template-core-vite

Vite build-time plugin for `@web-loom/template-core`: replaces `compile(\`...\`)` call
sites with a precompiled plan at build time, so the runtime HTML parser never runs for
those templates in the shipped bundle.

This is Phase 4 P2's "canonical compiler API" tooling slice — it introduces no new
compiler or parser code. It is glue around `precompileNode()` and `fromPrecompiled()`,
which already exist and already accept an arbitrary `sourcePath` with no extension
validation.

## Usage

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import { templateCorePrecompile } from '@web-loom/template-core-vite';

export default defineConfig({
  plugins: [templateCorePrecompile()],
});
```

Then write templates exactly as before:

```ts
import { compile } from '@web-loom/template-core';

export const headerTemplate = compile(`<h1>{{ title }}</h1>`);
```

In dev (`vite dev`), nothing changes — the plugin only applies during `vite build`
(`apply: 'build'`), so `compile()` keeps running the runtime parser as normal.

In a production build, a matching call site is rewritten to:

```ts
import { compile } from '@web-loom/template-core';
import { fromPrecompiled } from '@web-loom/template-core';

export const headerTemplate = fromPrecompiled({ plan: /* embedded plan */ });
```

The original `compile` import is left in place even if now unused in that file — it's
inert and Rollup tree-shakes it out of the final bundle.

## What gets rewritten

Only call sites where:

- `compile` is imported (optionally aliased) from `@web-loom/template-core` or
  `@web-loom/template-core/ssr`, and
- the first argument is a literal string or a no-substitution template literal (no
  `${}` interpolation) — the source text must be statically readable from the AST.

A second, options argument (`compile(source, { partials, helpers, ... })`) is preserved
**verbatim** — including references to other module-scope values (e.g. a `partials` map
containing `Template` instances imported from other files). The plugin never parses or
rewrites the options argument.

Call sites whose source comes from anywhere else — an imported string constant, a
template literal with `${}` substitutions, a function call — are **silently left as
normal runtime `compile()` calls**. This is not an error or a warning; it's simply out
of scope for static rewriting. There is no regression, only a missed precompilation
opportunity for that specific call site.

## Options

```ts
interface TemplateCorePrecompilePluginOptions {
  include?: string | RegExp | (string | RegExp)[]; // default: [/\.tsx?$/]
  exclude?: string | RegExp | (string | RegExp)[]; // default: test/spec files, __tests__, __fixtures__, benchmarks, node_modules
  specifiers?: string[]; // default: ['@web-loom/template-core', '@web-loom/template-core/ssr']
}
```

## Known limitations

`precompileNode()` (the function this plugin delegates all compilation to) only parses
HTML **structure** via `parse5` — it does not parse or validate `{{ }}` expressions.
Expression parsing happens lazily, inside `compileFragment()`, the first time the
resulting `Template` actually renders. This means:

- A template with a malformed expression (e.g. `{{ !!! }}`) will **not** fail the Vite
  build after this plugin runs — it will still only fail at first render, exactly like
  today's runtime `compile()`.
- This plugin moves *when HTML-structural parsing happens* (build time instead of
  runtime) — it does not move *when expression parsing happens*.

This is a deliberate scope boundary, not an oversight: per
`.kiro/specs/template-core-phase4/design.md` §6, tooling must reuse the canonical
compiler/plan APIs rather than implement a second parser. Full expression
pre-validation would require exposing the runtime expression parser through that
canonical API first — a separate, future tooling item.

## Relationship to `@web-loom/template-core-vite-ssr`

This package is unrelated to `@web-loom/template-core-vite-ssr`, which is an HTTP/SSR
request-orchestration package (dev middleware, production entry loading, document
composition). This package does one thing only: a build-time source transform. Use both
together freely — they don't interact.
