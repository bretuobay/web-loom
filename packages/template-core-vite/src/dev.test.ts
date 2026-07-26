import { afterEach, describe, expect, it } from 'vitest';
import { createServer, type ViteDevServer } from 'vite';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const fixtureRoot = join(here, '__fixtures__', 'basic-app');

describe('templateCorePrecompile — dev/serve mode', () => {
  let server: ViteDevServer | undefined;

  afterEach(async () => {
    await server?.close();
    server = undefined;
  });

  it('does not transform compile() call sites in dev mode (apply: "build" only)', async () => {
    server = await createServer({
      root: fixtureRoot,
      configFile: resolve(fixtureRoot, 'vite.config.ts'),
      server: { middlewareMode: true },
      appType: 'custom',
      logLevel: 'silent',
    });

    const result = await server.transformRequest('/template-browser.ts');
    expect(result).not.toBeNull();
    expect(result!.code).toContain('compile(');
    expect(result!.code).not.toContain('fromPrecompiled(');
  }, 30_000);
});
