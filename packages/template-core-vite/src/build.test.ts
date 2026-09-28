import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { build } from 'vite';
import { readFile, rm } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { compile as compileSsr } from '@web-loom/template-core/ssr';

const here = dirname(fileURLToPath(import.meta.url));
const fixtureRoot = join(here, '__fixtures__', 'basic-app');
const distDir = join(fixtureRoot, 'dist');

describe('templateCorePrecompile — real Vite build', () => {
  beforeAll(async () => {
    await build({
      root: fixtureRoot,
      configFile: resolve(fixtureRoot, 'vite.config.ts'),
      logLevel: 'silent',
    });
  }, 30_000);

  afterAll(async () => {
    await rm(distDir, { recursive: true, force: true });
  });

  it('rewrites the browser-specifier template into fromPrecompiled with an embedded plan', async () => {
    const code = await readFile(join(distDir, 'template-browser.js'), 'utf8');
    expect(code).toContain('fromPrecompiled(');
    expect(code).toMatch(/"version"\s*:\s*2/);
    expect(code).not.toMatch(/compile\(`<p>/);
  });

  it('rewrites the SSR-specifier template and imports fromPrecompiled from the ssr specifier', async () => {
    const code = await readFile(join(distDir, 'template-ssr.js'), 'utf8');
    expect(code).toContain('fromPrecompiled(');
    expect(code).toMatch(/from ['"]@web-loom\/template-core\/ssr['"]/);
  });

  it('leaves a non-literal (cross-module) source untouched', async () => {
    const code = await readFile(join(distDir, 'template-nonliteral.js'), 'utf8');
    expect(code).not.toContain('fromPrecompiled(');
    expect(code).toContain('compile(');
  });

  it('the precompiled SSR template renders identically to the un-precompiled equivalent', async () => {
    const modulePath = join(distDir, 'template-ssr.js');
    const built = (await import(pathToFileURL(modulePath).href)) as {
      ssrTemplate: { renderToString(vm: unknown): string };
    };

    const reference = compileSsr('<p>{{ msg }}</p>');

    const vm = { msg: 'hello & <world>' };
    expect(built.ssrTemplate.renderToString(vm)).toBe(reference.renderToString(vm));
  });
});
