import { describe, expect, it, vi } from 'vitest';
import { AnalyzeCache } from './analyze-cache.js';
import { runDevAnalyze } from './dev-analyze.js';
import type { CompileCallMatch } from '@web-loom/template-core-tooling';

describe('runDevAnalyze', () => {
  const brokenMatch: CompileCallMatch = {
    start: 0,
    end: 1,
    templateContentStart: 0,
    templateContentEnd: 28,
    templateSource: '<p>{{ count + 1 }}</p>',
    specifier: '@web-loom/template-core',
    name: 'Broken',
  };

  it('reports analysis errors without mutating source', () => {
    const cache = new AnalyzeCache();
    const error = vi.fn<(message: string) => never>(() => {
      throw new Error('analysis failed');
    });
    const warn = vi.fn();

    expect(() =>
      runDevAnalyze(
        { warn, error },
        {
          cache,
          sourcePath: '/app/broken.ts',
          code: 'export const x = 1;',
          matches: [brokenMatch],
        },
      ),
    ).toThrow('analysis failed');

    expect(error).toHaveBeenCalled();
    const firstCall = vi.mocked(error).mock.calls[0];
    expect(String(firstCall?.[0])).toMatch(/INVALID_EXPRESSION/);
  });

  it('re-reports cached failures but skips work for clean cached files', () => {
    const cache = new AnalyzeCache();
    const code = 'export const ok = 1;';
    const warn = vi.fn();
    const error = vi.fn(() => {
      throw new Error('fail');
    });
    const okMatch: CompileCallMatch = { ...brokenMatch, templateSource: '<p>ok</p>', name: 'Ok' };

    runDevAnalyze({ warn, error }, { cache, sourcePath: '/app/ok.ts', code, matches: [okMatch] });
    expect(warn).not.toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();

    runDevAnalyze({ warn, error }, { cache, sourcePath: '/app/ok.ts', code, matches: [okMatch] });
    expect(warn).not.toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
  });
});
