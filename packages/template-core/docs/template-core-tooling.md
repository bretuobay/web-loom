# Template Core Tooling Cookbook

Practical recipes for building applications with `@web-loom/template-core`, the Vite/ESLint
tooling packages, and partial SSR. Every pattern below is exercised in
[`apps/ecommerce-template-core`](../../apps/ecommerce-template-core).

**Packages covered**

| Package | Role |
| ------- | ---- |
| `@web-loom/template-core` | Runtime `compile()`, outlets, hydration |
| `@web-loom/template-core-vite-ssr` | Vite SSR server + HTML document composition |
| `@web-loom/template-core-vite` | Build precompile + optional dev analyze |
| `@web-loom/template-core-lint` | ESLint rules for static template checks |
| `@web-loom/template-core-tooling` | Shared `compile()` AST scanner (used by Vite + ESLint) |

---

## 1. Minimal client-only app

Start with runtime compilation — no build plugin required.

```ts
// src/main.ts
import { compile } from '@web-loom/template-core';
import { signal } from '@web-loom/signals-core';

const template = compile(`<button on:click="increment">Count: {{ count$ }}</button>`);

const vm = {
  count$: signal(0),
  increment() {
    vm.count$.update((n) => n + 1);
  },
};

const view = template.mount(document.getElementById('app')!, vm);
// later: view.dispose()
```

Templates are plain TypeScript modules. Group them under `src/templates/` and export compiled
`Template` instances.

---

## 2. Application shell with partials

Compose a page from named partials registered on `compile()`:

```ts
// src/templates/app-shell.ts
import { compile } from '@web-loom/template-core';
import { headerTemplate } from './header';
import { cartDrawerTemplate } from './cart-drawer';

export const appShellTemplate = compile(
  `
  <div class="app-shell">
    {{> header}}
    {{> cart}}
    <main data-template-slot="route"></main>
  </div>
`,
  {
    partials: {
      header: headerTemplate,
      cart: cartDrawerTemplate,
    },
  },
);
```

Reference: [`apps/ecommerce-template-core/src/templates/app-shell.ts`](../../apps/ecommerce-template-core/src/templates/app-shell.ts)

Mount the shell once; route content goes in a dedicated slot (see recipe 3).

---

## 3. Client-only route outlet

Use `createTemplateOutlet()` to swap route templates and **dispose** the previous view on navigation.

```ts
import { createTemplateOutlet } from '@web-loom/template-core';
import { storefrontTemplate, checkoutTemplate, notFoundTemplate } from '../templates';

const routeTemplates: Record<string, typeof storefrontTemplate> = {
  '/': storefrontTemplate,
  '/checkout': checkoutTemplate,
};

export function mountApp(container: Element, bindings: object, routeContainer: HTMLElement) {
  const shellView = appShellTemplate.mount(container, bindings);
  const outlet = createTemplateOutlet(routeContainer);

  const renderRoute = (path: string) => {
    const template = routeTemplates[path] ?? notFoundTemplate;
    outlet.show(template, bindings);
  };

  renderRoute(currentPath);
  const stop = router.route$.subscribe(renderRoute);

  return {
    dispose() {
      stop();
      outlet.dispose();
      shellView.dispose();
    },
  };
}
```

Reference: [`apps/ecommerce-template-core/src/app/view.ts`](../../apps/ecommerce-template-core/src/app/view.ts)

**Rules**

- One outlet per route region; call `outlet.show()` instead of manual `innerHTML = ''`.
- Always `dispose()` the outlet and every mounted template when tearing down the app.
- Keep browser-only state (cart, dialogs, theme) in the client shell — do not server-render it unless
  you have a deliberate hydration story for it.

---

## 4. Mixed page: SSR island + client shell

Render **one region** on the server; mount the interactive shell on the client.

### 4.1 HTML document markers

```html
<!-- index.html -->
<body>
  <div id="app"></div>
  <main id="storefront-island" class="app-content"><!--ssr-outlet--></main>
  <!--ssr-state-->
  <script type="module" src="/src/entry-client.ts"></script>
</body>
```

`@web-loom/template-core-vite-ssr` replaces:

| Marker | Purpose |
| ------ | ------- |
| `<!--ssr-head-->` | Optional injected `<title>`, meta, link tags |
| `<!--ssr-outlet-->` | Server-rendered HTML fragment |
| `<!--ssr-state-->` | Inert JSON bootstrap script (`__TEMPLATE_CORE_STATE__`) |

Reference: [`apps/ecommerce-template-core/index.html`](../../apps/ecommerce-template-core/index.html)

### 4.2 SSR entry

```ts
// src/entry-server.ts
import { compile } from '@web-loom/template-core/ssr';
import { storefrontTemplateSource } from './templates/storefront-source';

const storefrontServerTemplate = compile(storefrontTemplateSource, {
  name: 'storefront-ssr',
  partials: { 'product-card': productCardTemplateSource },
});

export async function render(_request: SsrRequest): Promise<SsrRenderResult> {
  const products = await loadCatalogForRequest();
  return {
    head: '<title>My Store · SSR</title>',
    html: storefrontServerTemplate.renderToString({ catalog: { filteredProducts: products, /* … */ } }),
    state: { products },
  };
}
```

Use `@web-loom/template-core/ssr` in the server entry — it never touches browser DOM APIs.

Reference: [`apps/ecommerce-template-core/src/entry-server.ts`](../../apps/ecommerce-template-core/src/entry-server.ts)

### 4.3 SSR server adapter

```ts
// server.ts
import { attachGracefulShutdown, createTemplateCoreViteSsrServer } from '@web-loom/template-core-vite-ssr';

const server = await createTemplateCoreViteSsrServer({
  root: process.cwd(),
  entry: '/src/entry-server.ts', // or './dist/server/entry-server.js' in production
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  port: 5182,
});
await server.listen();
attachGracefulShutdown(server);
```

Reference: [`apps/ecommerce-template-core/server.ts`](../../apps/ecommerce-template-core/server.ts)

Run: `npm run dev:ssr --workspace ecommerce-template-core`

### 4.4 Client entry: seed state + hydrate island

```ts
// src/entry-client.ts
function readInitialState() {
  const el = document.getElementById('__TEMPLATE_CORE_STATE__');
  return el?.textContent ? JSON.parse(el.textContent) : {};
}

const appContainer = document.getElementById('app')!;
const storefrontIsland = document.getElementById('storefront-island')!;
const initialState = readInitialState();

const viewModel = createViewModel(initialState);
const bindings = new AppBindings(viewModel);

// 1. Mount client-only shell into #app
appShellTemplate.mount(appContainer, bindings);

// 2. Hydrate SSR markup in #storefront-island on first visit to /
if (storefrontIsland.childNodes.length > 0) {
  storefrontTemplate.hydrate(storefrontIsland, bindings);
} else {
  createTemplateOutlet(storefrontIsland).show(storefrontTemplate, bindings);
}
```

Reference: [`apps/ecommerce-template-core/src/entry-client.ts`](../../apps/ecommerce-template-core/src/entry-client.ts) and
[`apps/ecommerce-template-core/src/app/view.ts`](../../apps/ecommerce-template-core/src/app/view.ts) (hydrate-on-first-route pattern).

**Hydration checklist**

- Server and client templates must produce **structurally compatible** markup (same tags, same
  `{{#each}}` keys, same partial shapes).
- Seed the ViewModel from `state` so bindings read the same data the server used.
- On mismatch, `template.hydrate()` warns and remounts the affected region — watch the console in
  development.

### 4.5 Build outputs

```json
{
  "scripts": {
    "build:client": "vite build --outDir dist/client",
    "build:server": "vite build --outDir dist/server --ssr src/entry-server.ts"
  }
}
```

Reference: [`apps/ecommerce-template-core/package.json`](../../apps/ecommerce-template-core/package.json)

---

## 5. Production precompile (Vite build)

Skip runtime HTML parsing in production bundles:

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import { templateCorePrecompile } from '@web-loom/template-core-vite';

export default defineConfig({
  plugins: [templateCorePrecompile()],
});
```

Static `compile(\`...\`)` call sites become `fromPrecompiled({ plan })` at build time. Invalid
expressions **fail the build** (via `analyzeTemplate()` / M0).

Dynamic sources stay as runtime `compile()`:

```ts
import { source } from './storefront-source';
export const t = compile(source); // not rewritten — intentional
```

See [`packages/template-core-vite/README.md`](../template-core-vite/README.md).

---

## 6. Dev-time template feedback

### 6.1 Runtime diagnostics callback

```ts
const template = compile(source, {
  name: 'Catalog',
  sourcePath: 'src/templates/catalog.ts',
  diagnostics: {
    report(diagnostic) {
      console.warn(`[${diagnostic.code}] ${diagnostic.message}`);
    },
  },
});
```

Useful for missing partials, raw HTML warnings, and hydration mismatches at runtime.

### 6.2 Vite dev analyze (terminal)

```ts
// vite.config.ts
templateCorePrecompile({ dev: 'analyze' })
```

Scans static templates on file change, prints `[template-core] path:line … [CODE]` to the terminal,
leaves source unchanged. See [`packages/template-core-vite/README.md`](../template-core-vite/README.md).

### 6.3 Vite dev precompile (dev/prod parity)

```ts
// vite.config.ts
templateCorePrecompile({ dev: 'precompile' })
```

Rewrites static `compile(\`...\`)` call sites to `fromPrecompiled(plan)` during `vite dev` — same as
production build. Transformed output is cached by file content hash so unchanged modules skip
re-precompilation on HMR. Invalid templates fail the transform.

Use when you want the browser to skip the runtime HTML parser without running a full production
build. Pair with ESLint for editor squiggles; `dev: 'analyze'` and `dev: 'precompile'` are mutually
exclusive.

## 7. ESLint in CI

```js
// eslint.config.mjs
import { config as baseConfig } from '@repo/eslint-config/base';
import templateCoreLint from '@web-loom/template-core-lint';
import tsParser from '@typescript-eslint/parser';

export default [
  ...baseConfig,
  ...templateCoreLint.configs.recommended,
  {
    files: ['src/**/*.ts'],
    languageOptions: { parser: tsParser },
    settings: {
      'template-core': {
        partials: {
          header: 'src/templates/header.ts',
          cart: 'src/templates/cart-drawer.ts',
        },
      },
    },
  },
];
```

Rules (all backed by `analyzeTemplate()`):

| Rule | Default |
| ---- | ------- |
| `template-core/no-invalid-expression` | error |
| `template-core/no-unsupported-modifier` | error |
| `template-core/no-missing-partial` | error (when partials manifest set) |
| `template-core/no-raw-html` | warn |
| `template-core/no-unsafe-url` | warn |

Reference config: [`apps/ecommerce-template-core/eslint.config.mjs`](../../apps/ecommerce-template-core/eslint.config.mjs)

```bash
npm run lint --workspace ecommerce-template-core
```

**Scope limit:** only static `compile(\`literal\`)` sites are checked — same as the Vite plugin.

---

## 8. Node-safe analysis (CLI / custom tooling)

For scripts, CI gates, or editor integrations without ESLint:

```ts
import { analyzeTemplate, precompileNode } from '@web-loom/template-core/compiler-node';

const { ok, diagnostics, plan } = analyzeTemplate(source, {
  name: 'Catalog',
  sourcePath: 'src/catalog.ts',
  partials: { card: '' }, // keys only — values unused for lint-style checks
});

if (!ok) {
  diagnostics.forEach((d) => console.error(d));
  process.exit(1);
}

// Or throw-on-error for build pipelines:
const module = precompileNode(source, { name: 'Catalog' });
```

See [`packages/template-core/README.md`](../README.md) § SSR/precompile.

---

## 9. Anti-patterns

### 9.1 Binding the live ViewModel vs a DTO snapshot

Templates read whatever object you pass to `mount()` / `hydrate()`:

```ts
template.mount(el, viewModel.cart); // binds to CartViewModel public surface
template.mount(el, viewModel.cart.get()); // binds to plain CartDto snapshot
```

If the template says `{{#each cart.items}}` but `CartViewModel` only exposes `itemCount` and
`subtotalCents`, the list **silently renders empty** — there is no TypeScript check on expression
paths inside template strings.

**Guidance**

- Open the ViewModel source before writing new bindings.
- Prefer exposing the **whole DTO signal** over hand-picking computed mirrors field-by-field.
- Cover new bindings with DOM-asserting tests (`@testing-library/dom`), not visual review alone.

Full write-up: [`packages/template-core/README.md`](../README.md) § “Binding a ViewModel vs. binding a DTO snapshot”.

Reference bug context: [`apps/ecommerce-template-core/src/app/bindings.ts`](../../apps/ecommerce-template-core/src/app/bindings.ts) passes live ViewModels to templates.

### 9.2 Server-rendering browser-owned state

Do not SSR cart contents, open dialogs, or theme preference unless you serialize explicit
request-scoped state and hydrate it with the same shape. The ecommerce demo server-renders **only**
the catalog product list; cart/checkout/theme stay client-only.

### 9.3 Forgetting disposal

Every `mount()`, `outlet.show()`, and `hydrate()` returns or owns disposables. Route changes must
dispose outgoing views. App shutdown must dispose ViewModels **after** views (views may still read
signals during teardown).

### 9.4 Mixing SSR and client templates

The SSR entry and client entry can share template **source strings** (see
`storefront-source.ts` in the demo) but may use different `compile()` options (helpers, partials).
Keep the rendered HTML shape identical.

---

## 10. Quick reference: which tool when?

| Goal | Tool |
| ---- | ---- |
| Ship without runtime parser | `@web-loom/template-core-vite` (build) |
| Terminal feedback during `vite dev` | `@web-loom/template-core-vite` `{ dev: 'analyze' }` |
| Dev/prod precompile parity in `vite dev` | `@web-loom/template-core-vite` `{ dev: 'precompile' }` |
| CI / editor squiggles | `@web-loom/template-core-lint` + ESLint extension |
| Format `.html` / extracted literals | `formatTemplate()` / `template-core-format` |
| Custom scripts / pre-commit | `formatCompileCallsInSource()` / `npm run format:templates` |
| Partial SSR + document assembly | `@web-loom/template-core-vite-ssr` |
| Learn by reading code | [`apps/ecommerce-template-core`](../../apps/ecommerce-template-core) |

---

## Related docs

- Engine grammar & API: [`packages/template-core/README.md`](../README.md)
- PRD & roadmap: [`packages/template-core/docs/PRD.md`](PRD.md)
- Template formatting (M3): [`packages/template-core/docs/template-formatting.md`](template-formatting.md)
- Editor diagnostics (M4): [`packages/template-core/docs/editor-diagnostics.md`](editor-diagnostics.md)
- Context typing spike (go/no-go): [`packages/template-core/docs/typing-spike.md`](typing-spike.md)
- Phase 4 traceability: [`.kiro/specs/template-core-phase4/`](../../.kiro/specs/template-core-phase4/)

---

## 11. Context typing (`declareContext`)

Type-check the **bindings object** at `mount()` / `hydrate()` / `outlet.show()` call sites — not
template expression strings.

```ts
import { declareContext } from '@web-loom/template-core';
import type { TemplateAppBindings } from '../app/bindings';

const page = declareContext<TemplateAppBindings>();
export const storefrontTemplate = page.compile(storefrontTemplateSource, {
  partials: { 'product-card': productCardTemplate },
});

// view.ts — outlet.show() rejects wrong context types
outlet.show(storefrontTemplate, bindings);
```

Document partial shapes — TypeScript checks `options.partials` when you pass a
`PartialContexts` map to `compile()`:

```ts
import type { PartialContexts } from '@web-loom/template-core';

type AppPartials = PartialContexts<{
  header: TemplateAppBindings;
  cart: TemplateAppBindings;
  'product-card': CatalogProductDto;
}>;

const page = declareContext<TemplateAppBindings>();
export const appShell = page.compile<AppPartials>(source, {
  partials: { header: headerTemplate, cart: cartDrawerTemplate, /* … */ },
});
```

**Does not fix** silent `{{ cart.items }}` when `CartViewModel` lacks `items` — expressions remain
runtime strings. Use ESLint + DOM tests. Full rationale: [`docs/typing-spike.md`](typing-spike.md).

SSR templates: `compile<TContext>(source)` from `@web-loom/template-core/ssr` (same generic).

Reference: [`apps/ecommerce-template-core/src/templates/`](../../apps/ecommerce-template-core/src/templates/)

---

## 12. Editor diagnostics (M4)

Map analyzer output to **host file** line/column (inside `compile(\`...\`)` strings):

| Integration | How |
| ----------- | --- |
| **ESLint** | `@web-loom/template-core-lint` — squiggles in VS Code via ESLint extension |
| **Vite dev** | `templateCorePrecompile({ dev: 'analyze' })` — terminal + VS Code problem matcher |
| **Programmatic** | `collectSourceLinkedDiagnostics()` from `@web-loom/template-core-tooling` |
| **Format templates** | `formatTemplate()` from `compiler-node` or `template-core-format` CLI |

Full guide: [`docs/editor-diagnostics.md`](editor-diagnostics.md).

---

## 13. Template formatting (M3)

Pretty-print after the same static analysis used by ESLint and Vite — **one parser, one diagnostic
model** (Phase 4 R8).

**Standalone HTML**

```bash
npx template-core-format --input src/partials/card.html --write
npx template-core-format --input src/partials/card.html --check   # CI
```

**API**

```ts
import { formatTemplate } from '@web-loom/template-core/compiler-node';

const { ok, formatted, diagnostics, unchanged } = formatTemplate(source, {
  name: 'Storefront',
  sourcePath: 'src/templates/storefront.ts',
  indent: 2,
  partials: { 'product-card': productCardSource },
});
```

**TypeScript `compile(\`...\`)` modules**

```bash
npx template-core-format-calls --write src/templates/header.ts
npm run format:templates -- apps/ecommerce-template-core/src/templates/*.ts   # monorepo root
```

Pre-commit (`.husky/pre-commit`) auto-formats staged `.ts`/`.tsx` files via `format:templates`.

Programmatic: `formatCompileCallsInSource()` from `@web-loom/template-core-tooling`.

Full guide — API table, before/after examples, CI scripts, limitations:
[`docs/template-formatting.md`](template-formatting.md).
