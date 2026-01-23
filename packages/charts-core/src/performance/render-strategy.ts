import { curveLinear, curveMonotoneX, type CurveFactory } from 'd3-shape';

export interface RenderStrategy {
  shouldUseCanvas(pointCount: number): boolean;
  getOptimalCurve(pointCount: number, aspectRatio: number): CurveFactory;
  getProgressiveChunkSize(): number;
}

export class AdaptiveRenderStrategy implements RenderStrategy {
  private readonly SVG_THRESHOLD = 5000;
  private readonly CANVAS_THRESHOLD = 10000;

  shouldUseCanvas(pointCount: number): boolean {
    return pointCount > this.CANVAS_THRESHOLD;
  }

  getOptimalCurve(pointCount: number, aspectRatio: number): CurveFactory {
    // Use linear for performance with large datasets
    if (pointCount > this.SVG_THRESHOLD) return curveLinear;
    // Use monotone for smooth appearance with smaller datasets
    return curveMonotoneX;
  }

  getProgressiveChunkSize(): number {
    // Render in chunks for smooth initial display
    return 1000;
  }
}
