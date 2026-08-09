import { describe, expect, it } from 'vitest';
import { PrecompileCache } from './precompile-cache.js';

describe('PrecompileCache', () => {
  it('returns a hit only when the content hash matches', () => {
    const cache = new PrecompileCache();
    cache.set('/app/header.ts', {
      contentHash: cache.hash('v1'),
      code: 'fromPrecompiled()',
      map: null,
    });

    expect(cache.get('/app/header.ts', cache.hash('v1'))?.code).toBe('fromPrecompiled()');
    expect(cache.get('/app/header.ts', cache.hash('v2'))).toBeUndefined();
  });
});
