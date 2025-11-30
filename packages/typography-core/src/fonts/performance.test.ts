import { describe, it, expect } from 'vitest';
import { estimateFontTransferSavings, generateFontSubset, planFontSubsets } from './performance';

describe('font performance utilities', () => {
  it('creates a font subset with unicode range', () => {
    const subset = generateFontSubset('Type faster, read better!');
    expect(subset.uniqueGlyphs).toBeGreaterThan(5);
    expect(subset.unicodeRange).toContain('U+');
  });

  it('plans subsets for multiple usages', () => {
    const plan = planFontSubsets([
      { text: 'Headings' },
      { text: 'Paragraph content', weight: 400 },
    ]);
    expect(plan).toHaveLength(2);
  });

  it('estimates transfer savings from subsets', () => {
    const savings = estimateFontTransferSavings(100, 250, 1000);
    expect(savings).toBeGreaterThan(0);
  });
});
