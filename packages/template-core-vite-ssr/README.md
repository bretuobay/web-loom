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

An SSR entry receives `{ url, method, headers }` and returns
`{ html, head?, state?, status?, headers?, redirect? }`:

```ts
export function render(request: SsrRequest): SsrRenderResult {
  return {
    html: storefrontTemplate.renderToString(loadCatalog(request.url)),
    state: { products: loadCatalog(request.url) },
    headers: { 'Cache-Control': 'no-store' },
  };
}
```

The adapter replaces `<!--ssr-head-->`, `<!--ssr-outlet-->`, and `<!--ssr-state-->` markers in
`index.html`. State is emitted in an inert JSON script with HTML-sensitive characters escaped.
Keep state request-scoped and JSON-compatible; never serialize secrets or long-lived mutable
server objects.

`headers` sets additional response headers (applied after the default `Content-Type`, so they can
override it). `redirect: { location, status? }` (status defaults to `302`) short-circuits the
response to a redirect — no document body is rendered when it's set.

**Static assets and 404s.** In production mode (`mode: 'production'`, no Vite dev server), a
request whose path has a file extension is treated as a static-asset request: if the file exists
under `clientOutDir` it's served with the matching content type, and if it doesn't, the response is
a `404` — it does not fall through to an SSR-rendered document. Extension-less paths (app routes)
always fall through to SSR as before.

**Error responses.** When an entry's `render()` throws, the real error is always logged server-side
via `console.error`. The response body sent to the client depends on `mode`: in `development` it's
the full `error.stack` (routed through `vite.ssrFixStacktrace` for readable source locations); in
`production` it's a generic `Internal Server Error` — the engine never leaks stack traces, file
paths, or other implementation details to production clients.

**Graceful shutdown.** `close()` on the returned server closes the Vite dev server (if any) and the
HTTP server, but nothing wires it to process signals automatically — a library must not
unilaterally claim `SIGINT`/`SIGTERM` for a process it doesn't own. Opt in explicitly:

```ts
import { attachGracefulShutdown, createTemplateCoreViteSsrServer } from '@web-loom/template-core-vite-ssr';

const server = await createTemplateCoreViteSsrServer({ root, entry, mode });
await server.listen();
attachGracefulShutdown(server); // registers SIGINT/SIGTERM handlers that close() then exit(0)
```

`attachGracefulShutdown` returns a function that removes the registered listeners, if needed.

## Application contract

The client entry should read `__TEMPLATE_CORE_STATE__`, seed the same request data into its
ViewModel, and call `template.hydrate()` for the server-rendered outlet. Keep the server and client
templates structurally compatible. If a route is not server-rendered, mount it normally into the
same application-owned outlet.

See [`apps/ecommerce-template-core`](../../apps/ecommerce-template-core) for a partial SSR
storefront-island example.
