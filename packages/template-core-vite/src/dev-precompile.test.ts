import { findCompileCalls } from '@web-loom/template-core-tooling';
import { describe, expect, it, vi } from 'vitest';
import { runDevPrecompile } from './dev-precompile.js';
import { PrecompileCache } from './precompile-cache.js';

describe('runDevPrecompile', () => {
  it('returns cached transform output without calling precompile again', () => {
    const cache = new PrecompileCache();
    const code = 'export const t = 1;';
    cache.set('/app/a.ts', {
      contentHash: cache.hash(code),
      code: 'cached-output',
      map: null,
    });

    const error = vi.fn(() => {
      throw new Error('should not precompile');
    });

    const result = runDevPrecompile(
      { error },
      {
        cache,
        sourcePath: '/app/a.ts',
        code,
        found: { matches: [], specifiersNeedingImport: new Map() },
      },
    );

    expect(result.code).toBe('cached-output');
    expect(error).not.toHaveBeenCalled();
  });

  it('precompiles and caches on first transform', () => {
    const cache = new PrecompileCache();
    const code = [
      "import { compile } from '@web-loom/template-core';",
      'export const headerTemplate = compile(`<h1>{{ title }}</h1>`);',
      '',
    ].join('\n');
    const found = findCompileCalls(code, '/app/header.ts', ['@web-loom/template-core']);

    const result = runDevPrecompile(
      {
        error: (message) => {
          throw new Error(message);
        },
      },
      { cache, sourcePath: '/app/header.ts', code, found },
    );

    expect(result.code).toContain('fromPrecompiled(');
    expect(cache.get('/app/header.ts', cache.hash(code))?.code).toBe(result.code);
  });

  it('returns identical output on repeated transforms of unchanged source', () => {
    const cache = new PrecompileCache();
    const code = [
      "import { compile } from '@web-loom/template-core';",
      'export const headerTemplate = compile(`<p>ok</p>`);',
      '',
    ].join('\n');
    const found = findCompileCalls(code, '/app/stable.ts', ['@web-loom/template-core']);
    const ctx = {
      error: (message: string) => {
        throw new Error(message);
      },
    };

    const first = runDevPrecompile(ctx, { cache, sourcePath: '/app/stable.ts', code, found });
    const second = runDevPrecompile(ctx, { cache, sourcePath: '/app/stable.ts', code, found });

    expect(second.code).toBe(first.code);
  });
});
