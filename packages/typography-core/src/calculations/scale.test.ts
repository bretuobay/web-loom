import { describe, it, expect } from 'vitest';
import { createFluidType, generateModularScale } from './index';

describe('generateModularScale', () => {
  it('creates symmetrical values around the base size', () => {
    const result = generateModularScale(16, 1.25, 2);
    expect(result.values.length).toBe(5);
    expect(result.map[-2]).toBeCloseTo(10.24, 2);
    expect(result.map[0]).toBe(16);
    expect(result.map[2]).toBeCloseTo(25, 0);
  });

  it('throws when ratio is invalid', () => {
    expect(() => generateModularScale(16, 1, 2)).toThrow(/Ratio must be greater than 1/);
  });
});

describe('createFluidType', () => {
  it('creates a clamp expression', () => {
    const clampValue = createFluidType(16, 24, 320, 1440);
    expect(clampValue.startsWith('clamp(')).toBe(true);
    expect(clampValue.includes('vw')).toBe(true);
  });
});
