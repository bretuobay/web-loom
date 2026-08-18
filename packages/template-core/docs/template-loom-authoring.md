# `.loom` template files (Phase 5-b)

Optional **standalone template files** with the same grammar as `compile(\`...\`)` strings.
No new syntax, no second parser — only an authoring surface and Vite loader glue.

## When to use `.loom` vs strings

| Use `.loom` | Keep `compile(\`...\`)` in `.ts` |
| ----------- | -------------------------------- |
| Large markup-heavy templates | Small inline templates |
| Designers/editors focus on HTML | Template tightly coupled to TS module setup |
| Want file-scoped syntax highlighting | Already satisfied by injection grammar |
| Build should always precompile | Need `declareContext<T>()` wrapper in same file |

Both styles remain valid indefinitely. The ecommerce demo uses **both**: `header.loom` plus
string-based templates in other modules. The greenhouse demo
[`apps/mvvm-template-core`](../../../apps/mvvm-template-core) is a **full `.loom` app** — every
view is a standalone `.loom` file (dashboard, lists, cards, layout) with the same ViewModels as
`mvvm-react`.

## Setup

### 1. Vite plugin

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import { templateCoreLoom } from '@web-loom/template-core-vite';

export default defineConfig({
  plugins: [templateCoreLoom()],
});
```

Options:

```ts
templateCoreLoom({ ssr: true }); // import compile/fromPrecompiled from @web-loom/template-core/ssr
templateCoreLoom({ specifier: '@web-loom/template-core/ssr' });
```

### 2. TypeScript

```ts
// src/vite-env.d.ts
/// <reference types="vite/client" />
/// <reference types="@web-loom/template-core-vite/loom" />
```

### 3. Import

```ts
// src/templates/header.ts — thin re-export preserves existing API
export { default as headerTemplate } from './header.loom';
```

```loom
<!-- src/templates/header.loom -->
<header class="app-header">
  <h1>{{ title$ }}</h1>
</header>
```

Default export is a `Template` instance (`compile()` in dev, `fromPrecompiled()` in build).

## Dev vs build

| Mode | Emitted module | Runtime parser |
| ---- | -------------- | -------------- |
| `vite dev` | `compile(source, { name, sourcePath })` | Yes (same as strings) |
| `vite build` | `fromPrecompiled({ plan })` | No |

`sourcePath` is the absolute `.loom` file path — diagnostics and ESLint/analyze tooling use the
same codes as string templates.

## HMR

The dev module includes `import.meta.hot.accept()`. The plugin's `handleHotUpdate` invalidates
the virtual module when a `.loom` file changes.

**App responsibility:** re-mount or dispose views when the imported `Template` reference changes.
Template-only HMR does not automatically patch mounted DOM — same as changing a `compile()` return
value in a `.ts` module.

Manual check:

1. `npm run dev` in the app
2. Edit `header.loom`, save
3. Confirm Vite reloads without stale module errors
4. Confirm the app re-renders the header (may require route refresh depending on mount logic)

## Editor support

Install the local [`vscode-template-core-syntax`](../../vscode-template-core-syntax/) extension.
It registers:

- **Injection grammar** — `compile(\`...\`)` inside `.ts`/`.tsx`
- **Standalone grammar** — `.loom` files (`text.web-loom.template`)

## CLI (no plugin)

`.loom` files already work with the precompiler CLI — no extension validation:

```bash
npx template-core-precompile --input src/header.loom --output dist/header.plan.json --name header
```

## Related

- String-based tooling cookbook: [`template-core-tooling.md`](./template-core-tooling.md)
- Vite plugin README: [`../../template-core-vite/README.md`](../../template-core-vite/README.md)
- Phase 5 spec: [`.kiro/specs/template-core-phase5/`](../../.kiro/specs/template-core-phase5/)
