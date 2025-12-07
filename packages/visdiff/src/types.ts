/**
 * Core type definitions for @web-loom/visdiff
 */

/**
 * Comparison result for a single screenshot pair
 */
export interface ComparisonResult {
  identifier: string;
  passed: boolean;
  difference: number; // 0-1, percentage of pixels that differ
  diffImage?: Buffer;
  dimensions: { width: number; height: number };
  pixelsDifferent: number;
  error?: Error;
}

/**
 * Viewport configuration
 */
export interface Viewport {
  width: number;
  height: number;
  name: string;
  deviceScaleFactor?: number;
}
