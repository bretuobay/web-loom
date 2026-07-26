import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';

const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
};

/**
 * Tiny static file server for the browser benchmark fixture. Serves the
 * built `dist/` output of two packages under distinct URL prefixes (the
 * built template-core browser bundle imports `@web-loom/signals-core` as a
 * bare specifier — resolved via an import map in fixture.html pointing at
 * the `/signals-core/` prefix this server exposes), plus fixture.html
 * itself at the server root.
 */
export function startStaticServer({ templateCoreDist, signalsCoreDist, fixtureDir, port = 0 }) {
  const server = createServer(async (req, res) => {
    try {
      const pathname = new URL(req.url ?? '/', 'http://localhost').pathname;
      let filePath;
      if (pathname.startsWith('/template-core/')) {
        filePath = join(templateCoreDist, pathname.slice('/template-core/'.length));
      } else if (pathname.startsWith('/signals-core/')) {
        filePath = join(signalsCoreDist, pathname.slice('/signals-core/'.length));
      } else if (pathname === '/' || pathname === '/fixture.html') {
        filePath = join(fixtureDir, 'fixture.html');
      } else {
        filePath = join(fixtureDir, pathname);
      }

      const resolved = resolve(filePath);
      const body = await readFile(resolved);
      res.statusCode = 200;
      res.setHeader('Content-Type', CONTENT_TYPES[extname(resolved)] ?? 'application/octet-stream');
      res.end(body);
    } catch {
      res.statusCode = 404;
      res.end('Not Found');
    }
  });

  return new Promise((resolvePromise, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', () => {
      server.off('error', reject);
      const address = server.address();
      resolvePromise({
        url: `http://127.0.0.1:${address.port}`,
        close: () => new Promise((resolveClose) => server.close(() => resolveClose())),
      });
    });
  });
}
