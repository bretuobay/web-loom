import { describe, it, expect } from 'vitest';
import { AdaptiveRenderStrategy } from './render-strategy';
import { curveLinear, curveMonotoneX } from 'd3-shape';

describe('AdaptiveRenderStrategy', () => {
  const strategy = new AdaptiveRenderStrategy();

  describe('shouldUseCanvas', () => {
    it('should return false for point counts below threshold', () => {
      expect(strategy.shouldUseCanvas(5000)).toBe(false);
      expect(strategy.shouldUseCanvas(9999)).toBe(false);
    });

    it('should return false for point count at threshold', () => {
      expect(strategy.shouldUseCanvas(10000)).toBe(false);
    });

    it('should return true for point counts above 10K threshold', () => {
      expect(strategy.shouldUseCanvas(10001)).toBe(true);
      expect(strategy.shouldUseCanvas(15000)).toBe(true);
      expect(strategy.shouldUseCanvas(100000)).toBe(true);
    });
  });

  describe('getOptimalCurve', () => {
    it('should return curveMonotoneX for small datasets', () => {
      const curve = strategy.getOptimalCurve(1000, 1.5);
      expect(curve).toBe(curveMonotoneX);
    });

    it('should return curveMonotoneX for datasets at SVG threshold', () => {
      const curve = strategy.getOptimalCurve(5000, 1.5);
      expect(curve).toBe(curveMonotoneX);
    });

    it('should return curveLinear for large datasets above SVG threshold', () => {
      const curve = strategy.getOptimalCurve(5001, 1.5);
      expect(curve).toBe(curveLinear);
    });

    it('should return curveLinear for very large datasets', () => {
      const curve = strategy.getOptimalCurve(10000, 1.5);
      expect(curve).toBe(curveLinear);
    });
  });

  describe('getProgressiveChunkSize', () => {
    it('should return 1000 for progressive rendering', () => {
      expect(strategy.getProgressiveChunkSize()).toBe(1000);
    });
  });
});
