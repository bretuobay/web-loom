import { describe, it, expect } from 'vitest';
import { calculateOptimalLineHeight, generateVerticalRhythm } from './index';

describe('calculateOptimalLineHeight', () => {
  it('returns larger ratios for body text than headings', () => {
    const body = calculateOptimalLineHeight(16, 'body');
    const heading = calculateOptimalLineHeight(32, 'heading');
    expect(body).toBeGreaterThan(heading);
    expect(body).toBeLessThanOrEqual(2);
    expect(heading).toBeGreaterThanOrEqual(1.2);
  });

  it('throws for invalid font size', () => {
    expect(() => calculateOptimalLineHeight(0)).toThrow('fontSize must be greater than zero');
  });
});

describe('generateVerticalRhythm', () => {
  it('returns token map for provided scale', () => {
    const rhythm = generateVerticalRhythm(24, [0.5, 1, 1.5]);
    expect(rhythm.rhythm).toHaveLength(3);
    expect(rhythm.tokens.step_1).toBe('24px');
  });
});
