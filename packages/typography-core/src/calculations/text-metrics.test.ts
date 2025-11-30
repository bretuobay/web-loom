import { describe, it, expect } from 'vitest';
import { calculateCharactersPerLine, measureText } from './index';

describe('calculateCharactersPerLine', () => {
  it('estimates CPL based on font metrics', () => {
    const cpl = calculateCharactersPerLine(16, 640, 'Inter');
    expect(cpl).toBeGreaterThan(60);
  });
});

describe('measureText', () => {
  it('measures width and height using canvas when available', () => {
    const metrics = measureText('Typographic Systems', 18, 'Inter');
    expect(metrics.width).toBeGreaterThan(0);
    expect(metrics.height).toBeGreaterThan(metrics.baseline * 0.9);
  });
});
