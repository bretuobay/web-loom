import { describe, it, expect } from 'vitest';
import { applyGoldenRatio, calculateOpticalSize, createOpticalSizeRamp, generateGoldenScale } from './typography-math';

describe('typography math utilities', () => {
  it('applies golden ratio', () => {
    const increased = applyGoldenRatio(16);
    expect(increased).toBeGreaterThan(16);
    const decreased = applyGoldenRatio(16, 'down');
    expect(decreased).toBeLessThan(16);
  });

  it('creates a golden scale', () => {
    const scale = generateGoldenScale(16, 2);
    expect(scale.length).toBe(5);
  });

  it('calculates optical size with viewing distance', () => {
    const optical = calculateOpticalSize(16, 50, 220);
    expect(optical).toBeGreaterThan(0);
  });

  it('generates device-ready optical size ramp', () => {
    const ramp = createOpticalSizeRamp(16);
    expect(ramp.mobile).toBeLessThan(ramp.desktop);
  });
});
