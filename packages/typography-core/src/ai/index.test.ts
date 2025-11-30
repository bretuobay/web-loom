import { describe, expect, it } from 'vitest';
import { generateTypographyRecommendations, suggestFontPairings } from './index';

describe('AI typography helpers', () => {
  it('suggests font pairings for known fonts', () => {
    const pairings = suggestFontPairings('Inter');
    expect(pairings.length).toBeGreaterThan(1);
    expect(pairings[0].primary).toBe('Inter');
  });

  it('generates recommendations with platform context', () => {
    const recommendations = generateTypographyRecommendations({ baseFont: 'Roboto', platform: 'mobile', audience: 'teen' });
    expect(recommendations.targetFontSize).toBeGreaterThan(18);
    expect(recommendations.fontPairings.length).toBeGreaterThan(0);
  });
});
