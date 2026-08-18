import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { build } from 'vite';
import { readFile, rm } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const fixtureRoot = join(here, '__fixtures__', 'loom-app');
const distDir = join(fixtureRoot, 'dist');

describe('templateCoreLoom — real Vite build', () => {
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

  it('precompiles a .loom import into fromPrecompiled(plan)', async () => {
    const code = await readFile(join(distDir, 'importer.js'), 'utf8');
    expect(code).toContain('fromPrecompiled(');
    expect(code).toMatch(/"version"\s*:\s*2/);
    expect(code).not.toContain('compile(');
  });
});
