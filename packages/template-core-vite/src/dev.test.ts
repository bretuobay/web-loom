import { afterEach, describe, expect, it } from 'vitest';
import { createServer, type ViteDevServer } from 'vite';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { templateCorePrecompile } from './index.js';

const here = dirname(fileURLToPath(import.meta.url));
const fixtureRoot = join(here, '__fixtures__', 'basic-app');

describe('templateCorePrecompile — dev/serve mode', () => {
  let server: ViteDevServer | undefined;

  afterEach(async () => {
    await server?.close();
    server = undefined;
  });

  it('does not register the plugin during dev when dev analyze is disabled', async () => {
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

  it('analyzes templates in dev without rewriting source when dev: "analyze" is enabled', async () => {
    server = await createServer({
      root: fixtureRoot,
      server: { middlewareMode: true },
      appType: 'custom',
      logLevel: 'silent',
      plugins: [templateCorePrecompile({ dev: 'analyze', exclude: [/node_modules\//] })],
    });

    const result = await server.transformRequest('/template-browser.ts');
    expect(result).not.toBeNull();
    expect(result!.code).toContain('compile(');
    expect(result!.code).not.toContain('fromPrecompiled(');
  }, 30_000);

  it('surfaces invalid template expressions as transform errors in dev analyze mode', async () => {
    server = await createServer({
      root: fixtureRoot,
      server: { middlewareMode: true },
      appType: 'custom',
      logLevel: 'silent',
      plugins: [templateCorePrecompile({ dev: 'analyze', exclude: [/node_modules\//] })],
    });

    await expect(server.transformRequest('/template-broken.ts')).rejects.toThrow(/INVALID_EXPRESSION/i);
  }, 30_000);

  it('precompiles templates in dev when dev: "precompile" is enabled', async () => {
    server = await createServer({
      root: fixtureRoot,
      server: { middlewareMode: true },
      appType: 'custom',
      logLevel: 'silent',
      plugins: [templateCorePrecompile({ dev: 'precompile', exclude: [/node_modules\//] })],
    });

    const result = await server.transformRequest('/template-browser.ts');
    expect(result).not.toBeNull();
    expect(result!.code).toContain('fromPrecompiled(');
    expect(result!.code).toMatch(/"version"\s*:\s*2/);
    expect(result!.code).not.toMatch(/compile\(`<p>/);
  }, 30_000);

  it('fails dev precompile for invalid template expressions', async () => {
    server = await createServer({
      root: fixtureRoot,
      server: { middlewareMode: true },
      appType: 'custom',
      logLevel: 'silent',
      plugins: [templateCorePrecompile({ dev: 'precompile', exclude: [/node_modules\//] })],
    });

    await expect(server.transformRequest('/template-broken.ts')).rejects.toThrow(/INVALID_EXPRESSION|precompile/i);
  }, 30_000);
});
