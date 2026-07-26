import { readFile } from 'node:fs/promises';
import { createServer as createHttpServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import { extname, relative, resolve } from 'node:path';
import { createServer as createViteServer, type ViteDevServer } from 'vite';

export interface SsrRequest {
  url: string;
  method: string;
  headers: IncomingMessage['headers'];
}

export interface SsrRenderResult {
  html: string;
  head?: string;
  state?: unknown;
  status?: number;
  /** Extra response headers to set. Applied after the default `Content-Type`, so these can override it. */
  headers?: Record<string, string | string[]>;
  /** When set, the response is a redirect and no document body is rendered. Status defaults to 302. */
  redirect?: { location: string; status?: number };
}

export interface SsrEntryModule {
  render(request: SsrRequest): Promise<SsrRenderResult> | SsrRenderResult;
}

export interface TemplateCoreViteSsrOptions {
  root: string;
  entry: string;
  port?: number;
  host?: string;
  mode?: 'development' | 'production';
  clientOutDir?: string;
  serverOutDir?: string;
}

export interface TemplateCoreViteSsrServer {
  listen(): Promise<Server>;
  close(): Promise<void>;
  vite?: ViteDevServer;
}

export function serializeInitialState(state: unknown): string {
  return JSON.stringify(state).replaceAll('<', '\\u003c').replaceAll('>', '\\u003e').replaceAll('&', '\\u0026');
}

export function renderDocument(template: string, result: SsrRenderResult): string {
  const stateScript =
    result.state === undefined
      ? ''
      : `<script type="application/json" id="__TEMPLATE_CORE_STATE__">${serializeInitialState(result.state)}</script>`;
  const head = result.head ?? '';
  const document = template
    .replace('<!--ssr-head-->', head)
    .replace('<!--ssr-outlet-->', result.html)
    .replace('<!--ssr-state-->', stateScript);
  return template.includes('<!--ssr-state-->') ? document : `${document}${stateScript}`;
}

async function loadEntry(root: string, entry: string, vite: ViteDevServer | undefined): Promise<SsrEntryModule> {
  if (vite) return (await vite.ssrLoadModule(entry)) as SsrEntryModule;
  const modulePath = resolve(root, entry);
  return (await import(modulePath)) as SsrEntryModule;
}

async function sendDocument(
  req: IncomingMessage,
  res: ServerResponse,
  options: TemplateCoreViteSsrOptions,
  vite: ViteDevServer | undefined,
): Promise<void> {
  try {
    const indexPath = vite
      ? resolve(options.root, 'index.html')
      : resolve(options.root, options.clientOutDir ?? 'dist/client/index.html');
    let template = await readFile(indexPath, 'utf8');
    const url = req.url ?? '/';
    if (vite) template = await vite.transformIndexHtml(url, template);
    const entry = await loadEntry(options.root, options.entry, vite);
    const result = await entry.render({ url, method: req.method ?? 'GET', headers: req.headers });

    if (result.redirect) {
      res.statusCode = result.redirect.status ?? 302;
      res.setHeader('Location', result.redirect.location);
      res.end();
      return;
    }

    res.statusCode = result.status ?? 200;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    for (const [name, value] of Object.entries(result.headers ?? {})) res.setHeader(name, value);
    res.end(renderDocument(template, result));
  } catch (error) {
    if (vite && error instanceof Error) vite.ssrFixStacktrace(error);
    const isProduction = (options.mode ?? 'development') === 'production';
    console.error('[template-core-vite-ssr] SSR render failed:', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end(
      isProduction ? 'Internal Server Error' : error instanceof Error ? (error.stack ?? error.message) : String(error),
    );
  }
}

/**
 * 'served' — the asset was found and written to `res`.
 * 'not-found' — the request looked like an asset request (had an extension) but no file matched;
 * the caller should respond 404, not fall through to `sendDocument`.
 * 'skip' — not an asset request at all (no extension, e.g. an app route); the caller should
 * fall through to `sendDocument` as before.
 */
type StaticAssetResult = 'served' | 'not-found' | 'skip';

async function serveStaticAsset(
  req: IncomingMessage,
  res: ServerResponse,
  options: TemplateCoreViteSsrOptions,
): Promise<StaticAssetResult> {
  const pathname = new URL(req.url ?? '/', 'http://template-core.local').pathname;
  if (pathname === '/' || !extname(pathname)) return 'skip';
  const publicRoot = resolve(options.root, options.clientOutDir ?? 'dist/client');
  const assetPath = resolve(publicRoot, `.${pathname}`);
  if (relative(publicRoot, assetPath).startsWith('..')) return 'not-found';
  try {
    const body = await readFile(assetPath);
    const contentTypes: Record<string, string> = {
      '.css': 'text/css; charset=utf-8',
      '.html': 'text/html; charset=utf-8',
      '.js': 'text/javascript; charset=utf-8',
      '.json': 'application/json; charset=utf-8',
      '.svg': 'image/svg+xml',
      '.woff': 'font/woff',
      '.woff2': 'font/woff2',
    };
    res.statusCode = 200;
    res.setHeader('Content-Type', contentTypes[extname(assetPath)] ?? 'application/octet-stream');
    res.end(body);
    return 'served';
  } catch {
    return 'not-found';
  }
}

export async function createTemplateCoreViteSsrServer(
  options: TemplateCoreViteSsrOptions,
): Promise<TemplateCoreViteSsrServer> {
  const isDevelopment = (options.mode ?? 'development') === 'development';
  const vite = isDevelopment
    ? await createViteServer({
        root: options.root,
        server: { middlewareMode: true },
        appType: 'custom',
      })
    : undefined;

  const server = createHttpServer(async (req, res) => {
    if (vite) {
      let handled = false;
      await new Promise<void>((resolveNext) => {
        const finish = () => {
          handled = true;
          res.off('finish', finish);
          res.off('close', finish);
          resolveNext();
        };
        res.once('finish', finish);
        res.once('close', finish);
        vite.middlewares(req, res, () => {
          res.off('finish', finish);
          res.off('close', finish);
          resolveNext();
        });
        if (res.writableEnded) finish();
      });
      if (handled || res.writableEnded) return;
    }
    if (!vite) {
      const assetResult = await serveStaticAsset(req, res, options);
      if (assetResult === 'served') return;
      if (assetResult === 'not-found') {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.end('Not Found');
        return;
      }
    }
    await sendDocument(req, res, options, vite);
  });

  return {
    vite,
    listen: () =>
      new Promise<Server>((resolveServer, reject) => {
        server.once('error', reject);
        server.listen(options.port ?? 5173, options.host ?? 'localhost', () => {
          server.off('error', reject);
          resolveServer(server);
        });
      }),
    close: async () => {
      await vite?.close();
      await new Promise<void>((resolveClose, reject) => {
        if (!server.listening) return resolveClose();
        server.close((error) => (error ? reject(error) : resolveClose()));
      });
    },
  };
}

/**
 * Registers `SIGINT`/`SIGTERM` handlers that close the server (and the Vite dev server, if any)
 * before exiting. Opt-in — not wired automatically by {@link createTemplateCoreViteSsrServer} —
 * since a library must not unilaterally claim process signals for a process it doesn't own (e.g.
 * an app running inside a supervisor with its own shutdown sequencing, or multiple servers in one
 * process). Returns a function that removes the registered listeners.
 */
export function attachGracefulShutdown(
  server: TemplateCoreViteSsrServer,
  options: { signals?: NodeJS.Signals[] } = {},
): () => void {
  const signals = options.signals ?? ['SIGINT', 'SIGTERM'];
  let shuttingDown = false;
  const handler = (): void => {
    if (shuttingDown) return;
    shuttingDown = true;
    void server
      .close()
      .catch((error: unknown) => console.error('[template-core-vite-ssr] error during graceful shutdown:', error))
      .finally(() => process.exit(0));
  };
  for (const signal of signals) process.on(signal, handler);
  return () => {
    for (const signal of signals) process.off(signal, handler);
  };
}
