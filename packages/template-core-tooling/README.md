# @web-loom/template-core-tooling

Shared utilities for template-core **Vite**, **ESLint**, and **pre-commit** formatting:

- `findCompileCalls()` — AST scan for static `compile(\`...\`)`and`.compile(\`...\`)` call sites
- `collectSourceLinkedDiagnostics()` — `analyzeTemplate()` + **host-file** line/column mapping (M4)
- `formatCompileCallsInSource()` — pretty-print static template literals via `formatTemplate()` (M3)
- `formatSourceLinkedDiagnostic()` — stable `[template-core] path:line:col … [CODE]` terminal format

Consumed by `@web-loom/template-core-vite` and `@web-loom/template-core-lint`.

**CLI:** `template-core-format-calls --write|--check <files…>`

**Docs:** [`../template-core/docs/template-formatting.md`](../template-core/docs/template-formatting.md),
[`../template-core/docs/editor-diagnostics.md`](../template-core/docs/editor-diagnostics.md).
