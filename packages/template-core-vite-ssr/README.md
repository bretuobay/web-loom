# @web-loom/template-core-vite-ssr

Reusable Vite SSR orchestration for applications rendered with
`@web-loom/template-core`.

The package provides a Vite middleware-mode development server, production entry loading,
HTML document composition, and safe JSON state serialization. Application-specific routes,
ViewModels, data loading, and templates remain in the consuming app.

It is intentionally an orchestration layer rather than a full application framework: the app
chooses which route or island to render on the server and owns the client entry that hydrates it.
This makes partial SSR practical for applications that still keep cart state, dialogs, themes, or
other browser-owned concerns client-only.

## Server setup

```ts
const server = await createTemplateCoreViteSsrServer({
  root: process.cwd(),
  entry: '/src/entry-server.ts',
  port: 5173,
});
await server.listen();
```

The server runs Vite in middleware mode by default. Set `mode: 'production'` to load the built SSR
entry and serve assets from `clientOutDir` (default: `dist/client`). The built server entry is
loaded from `root` plus `entry`, so production applications should pass its emitted server entry
path explicitly.

An SSR entry receives `{ url, method, headers }` and returns `{ html, head?, state?, status? }`:

```ts
export function render(request: SsrRequest): SsrRenderResult {
  return {
    html: storefrontTemplate.renderToString(loadCatalog(request.url)),
    state: { products: loadCatalog(request.url) },
  };
}
```

The adapter replaces `<!--ssr-head-->`, `<!--ssr-outlet-->`, and `<!--ssr-state-->` markers in
`index.html`. State is emitted in an inert JSON script with HTML-sensitive characters escaped.
Keep state request-scoped and JSON-compatible; never serialize secrets or long-lived mutable
server objects.

## Application contract

The client entry should read `__TEMPLATE_CORE_STATE__`, seed the same request data into its
ViewModel, and call `template.hydrate()` for the server-rendered outlet. Keep the server and client
templates structurally compatible. If a route is not server-rendered, mount it normally into the
same application-owned outlet.

See [`apps/ecommerce-template-core`](../../apps/ecommerce-template-core) for a partial SSR
storefront-island example.
