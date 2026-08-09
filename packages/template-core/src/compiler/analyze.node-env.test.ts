/**
 * @vitest-environment node
 *
 * Ensures analyzeTemplate works when vitest has not pre-installed jsdom globals
 * (matches Vite plugin / ESLint lint-file call sites).
 */
import { describe, expect, it } from 'vitest';
import { analyzeTemplate } from './node.js';

describe('analyzeTemplate without vitest jsdom', () => {
  it('returns a compiled plan in plain Node', () => {
    const result = analyzeTemplate('<button on:click="save">{{ title$ }}</button>', {
      name: 'Header',
    });
    expect(result.ok).toBe(true);
    expect(result.plan.root?.compiled).toBe(true);
    expect(result.diagnostics).toEqual([]);
  });

  it('warns on unsafe bound URL schemes', () => {
    const result = analyzeTemplate('<a :href="\'javascript:alert(1)\'">link</a>');
    expect(result.ok).toBe(true);
    expect(result.diagnostics.some((d) => d.code === 'UNSAFE_URL_SCHEME')).toBe(true);
  });
});
