# Ecommerce Template Core Demo

`ecommerce-template-core` is the Web Loom ecommerce reference app rendered with
`@web-loom/template-core`. It uses the same MVVM-oriented models and signals as the other ecommerce
demo surfaces, but keeps the view layer framework-free: templates mount directly against the
ViewModel without React, Vue, Lit, or an adapter bridge.

## What it demonstrates

The app also demonstrates a Vite SSR boundary: the storefront catalog is rendered on the server
and hydrated in place, while checkout, cart state, command palette, dialogs, theme persistence, and
toast behavior remain client-only. This keeps browser-owned state out of the server request and
makes the hydration boundary visible in the source.

The app is a practical Phase 2 and Phase 3 example of the template engine:

- The application shell composes header, cart, command palette, confirmation, and toast views with
  named local partials.
- The storefront renders each product with a local `product-card` partial and keyed `each` block.
- The theme control uses `switch`/`case`/`default` rendering.
- Product search uses `bind:value` directly against a writable signal.
- Navigation and nested cart actions use event modifiers such as `.prevent` and `.stop`.
- The search field uses a `use:` element action for mount-time DOM behavior.
- Route content is managed by `createTemplateOutlet()`, so route changes dispose the previous route
  view before mounting the next one.
- The SSR storefront island is constrained by the same centered `1200px` content layout as the
  client-rendered routes; only the catalog island is server-rendered, not the browser-owned shell.
- Checkout fields use `bind:value` with explicit `bind:set` callbacks, keeping form-library writes
  explicit instead of mutating nested snapshots.
- Product and cart handlers use event call forms such as `addToCart(this)` and
  `updateQuantity(this, -1)` rather than querying item IDs from the DOM.

## Run it

From the repository root:

```bash
npm run dev --workspace ecommerce-template-core
```

Or from this directory:

```bash
npm run dev
```

Run the SSR development server with Vite middleware mode:

```bash
npm run dev:ssr
```

Then inspect page source before JavaScript executes: the product cards are already present in the
`storefront-island` element. After hydration, search and product actions update the existing DOM
nodes without replacing the server-rendered product cards. `npm run build` produces separate
`dist/client` and `dist/server` outputs.

The app uses the mock ecommerce API by default, so no backend configuration is required.

## Verify it

```bash
npm test
npm run type-check
npm run lint
npm run build
npm run build:client
npm run build:server
```

The application tests cover catalog rendering, SSR output, hydration identity, search, cart
interaction, navigation, and disposal of the ViewModel and mounted template views.

## Structure

| Area                          | Responsibility                                                               |
| ----------------------------- | ---------------------------------------------------------------------------- |
| `src/TemplateAppViewModel.ts` | Composes state, catalog/cart ViewModels, actions, routing, and subscriptions |
| `src/app/view.ts`             | Mounts the partial-composed shell and swaps route templates                  |
| `src/app/bindings.ts`         | View-bound actions and element action callbacks                              |
| `src/templates/`              | Compiled templates, `declareContext` typing, and partial composition         |
| `src/features/catalog/`       | Product loading, filtering, and selection                                    |
| `src/features/cart/`          | Cart state, checkout form, and cart commands                                 |
| `src/infrastructure/`         | Mock API, event bus, and persisted UI preferences                            |
| `src/entry-server.ts`         | Request-scoped SSR catalog render and initial-state payload                  |
| `src/entry-client.ts`         | Client ViewModel seeding and storefront-island hydration                     |
| `server.ts`                   | Reusable Vite SSR server adapter entry                                       |

See [`packages/template-core/README.md`](../../packages/template-core/README.md) for the complete
template grammar, [`packages/template-core/docs/PRD.md`](../../packages/template-core/docs/PRD.md)
for the engine design, and [`packages/template-core/docs/template-core-tooling.md`](../../packages/template-core/docs/template-core-tooling.md)
for SSR/tooling recipes (this app is the reference implementation). Context typing:
[`declareContext`](../../packages/template-core/docs/typing-spike.md) in `src/templates/`.
