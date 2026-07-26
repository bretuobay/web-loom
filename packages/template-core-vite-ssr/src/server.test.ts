import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import http from 'node:http';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createTemplateCoreViteSsrServer, type TemplateCoreViteSsrServer } from './index.js';

const fixturesRoot = join(dirname(fileURLToPath(import.meta.url)), '__fixtures__');

let activeServer: TemplateCoreViteSsrServer | null = null;

async function startServer(
  entry: string,
): Promise<{ baseUrl: string; port: number; server: TemplateCoreViteSsrServer }> {
  const server = await createTemplateCoreViteSsrServer({
    root: fixturesRoot,
    entry: `./entries/${entry}`,
    mode: 'production',
    port: 0,
    host: '127.0.0.1',
  });
  activeServer = server;
  const httpServer = await server.listen();
  const address = httpServer.address();
  if (address === null || typeof address === 'string') throw new Error('Expected a bound TCP address.');
  return { baseUrl: `http://127.0.0.1:${address.port}`, port: address.port, server };
}

afterEach(async () => {
  await activeServer?.close();
  activeServer = null;
});

describe('createTemplateCoreViteSsrServer (production mode)', () => {
  it('honors a custom status code from the entry', async () => {
    const { baseUrl } = await startServer('status-entry.mjs');
    const res = await fetch(`${baseUrl}/anything`);
    expect(res.status).toBe(404);
  });

  it('applies custom response headers from the entry', async () => {
    const { baseUrl } = await startServer('headers-entry.mjs');
    const res = await fetch(`${baseUrl}/anything`);
    expect(res.headers.get('cache-control')).toBe('no-store');
    expect(res.headers.get('x-test')).toBe('yes');
  });

  it('redirects with a default 302 status and no rendered body', async () => {
    const { baseUrl } = await startServer('redirect-entry.mjs');
    const res = await fetch(`${baseUrl}/anything`, { redirect: 'manual' });
    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toBe('/new-place');
    const body = await res.text();
    expect(body).not.toContain('ssr-outlet');
  });

  it('redirects with a custom status when provided', async () => {
    const { baseUrl } = await startServer('redirect-301-entry.mjs');
    const res = await fetch(`${baseUrl}/anything`, { redirect: 'manual' });
    expect(res.status).toBe(301);
    expect(res.headers.get('location')).toBe('/moved');
  });

  it('serves a real static asset with the right content type', async () => {
    const { baseUrl } = await startServer('basic-entry.mjs');
    const res = await fetch(`${baseUrl}/style.css`);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/css');
    expect(await res.text()).toContain('color: red');
  });

  it('404s a missing static asset instead of falling through to a 200 SSR render', async () => {
    const { baseUrl } = await startServer('basic-entry.mjs');
    const res = await fetch(`${baseUrl}/no-such-file.css`);
    expect(res.status).toBe(404);
    expect(await res.text()).toBe('Not Found');
  });

  it('still SSR-renders extension-less app routes normally', async () => {
    const { baseUrl } = await startServer('basic-entry.mjs');
    const res = await fetch(`${baseUrl}/products/42`);
    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body).toContain('<p>ok</p>');
  });

  it('never leaks filesystem content for a path-traversal attempt', async () => {
    const { port } = await startServer('basic-entry.mjs');

    const body = await new Promise<{ status: number; text: string }>((resolvePromise, reject) => {
      const req = http.request(
        { host: '127.0.0.1', port, path: '/../../../../../../etc/passwd', method: 'GET' },
        (res) => {
          let text = '';
          res.on('data', (chunk) => (text += chunk));
          res.on('end', () => resolvePromise({ status: res.statusCode ?? 0, text }));
        },
      );
      req.on('error', reject);
      req.end();
    });

    expect(body.text).not.toContain('root:');
    expect([404, 200]).toContain(body.status);
  });

  it('returns a generic error body in production and logs the real error server-side', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const { baseUrl } = await startServer('throwing-entry.mjs');
      const res = await fetch(`${baseUrl}/anything`);
      expect(res.status).toBe(500);
      const body = await res.text();
      expect(body).toBe('Internal Server Error');
      expect(body).not.toContain('boom: sensitive stack detail');
      expect(body).not.toContain('.mjs');

      expect(errorSpy).toHaveBeenCalled();
      const loggedError = errorSpy.mock.calls.find((call) =>
        call.some((arg) => arg instanceof Error && arg.message.includes('boom: sensitive stack detail')),
      );
      expect(loggedError).toBeTruthy();
    } finally {
      errorSpy.mockRestore();
    }
  });
});

describe('createTemplateCoreViteSsrServer (development mode)', () => {
  it('returns the real error detail to the client in development', async () => {
    const server = await createTemplateCoreViteSsrServer({
      root: fixturesRoot,
      entry: '/entries/throwing-entry.mjs',
      mode: 'development',
      port: 0,
      host: '127.0.0.1',
    });
    activeServer = server;
    const httpServer = await server.listen();
    const address = httpServer.address();
    if (address === null || typeof address === 'string') throw new Error('Expected a bound TCP address.');

    const res = await fetch(`http://127.0.0.1:${address.port}/anything`);
    expect(res.status).toBe(500);
    const body = await res.text();
    expect(body).toContain('boom: sensitive stack detail');
  }, 15000);
});
