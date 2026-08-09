import { describe, expect, it } from 'vitest';
import { AnalyzeCache } from './analyze-cache.js';

describe('AnalyzeCache', () => {
  it('returns a hit only when the content hash matches', () => {
    const cache = new AnalyzeCache();
    cache.set('/app/header.ts', {
      contentHash: cache.hash('v1'),
      ok: true,
      diagnostics: [],
    });

    expect(cache.get('/app/header.ts', cache.hash('v1'))).toBeDefined();
    expect(cache.get('/app/header.ts', cache.hash('v2'))).toBeUndefined();
  });

  it('clears entries on delete', () => {
    const cache = new AnalyzeCache();
    const hash = cache.hash('source');
    cache.set('/app/a.ts', { contentHash: hash, ok: false, diagnostics: [] });
    cache.delete('/app/a.ts');
    expect(cache.get('/app/a.ts', hash)).toBeUndefined();
  });
});
