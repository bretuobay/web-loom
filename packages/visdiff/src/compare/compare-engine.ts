import pixelmatch from 'pixelmatch';
import sharp from 'sharp';
import { DiffOptions } from '../config/schema.js';
import { ComparisonResult } from '../types.js';

/**
 * Comparison pair for batch comparisons
 */
export interface ComparisonPair {
  baseline: Buffer;
  current: Buffer;
  identifier: string;
}

/**
 * Compare Engine - handles pixel-level image comparison
 */
export class CompareEngine {
  /**
   * Compare two images and generate a diff
   * @param baseline - Baseline image buffer
   * @param current - Current image buffer
   * @param options - Diff options
   * @returns Comparison result with pass/fail status and diff image
   */
  async compare(
    baseline: Buffer,
    current: Buffer,
    options: DiffOptions
  ): Promise<ComparisonResult> {
    try {
      // Load images with sharp
      const baselineImage = sharp(baseline);
      const currentImage = sharp(current);

      // Get metadata
      const baselineMetadata = await baselineImage.metadata();
      const currentMetadata = await currentImage.metadata();

      // Check dimensions match
      if (
        baselineMetadata.width !== currentMetadata.width ||
        baselineMetadata.height !== currentMetadata.height
      ) {
        return {
          identifier: '',
          passed: false,
          difference: 1,
          dimensions: {
            width: currentMetadata.width || 0,
            height: currentMetadata.height || 0,
          },
          pixelsDifferent: 0,
          error: new Error(
            `Dimension mismatch: baseline ${baselineMetadata.width}x${baselineMetadata.height} vs current ${currentMetadata.width}x${currentMetadata.height}`
          ),
        };
      }

      const width = baselineMetadata.width!;
      const height = baselineMetadata.height!;

      // Convert images to raw pixel data (RGBA)
      let baselineRaw = await baselineImage.ensureAlpha().raw().toBuffer();
      let currentRaw = await currentImage.ensureAlpha().raw().toBuffer();

      // If ignoreColors is enabled, convert to grayscale manually
      if (options.ignoreColors) {
        baselineRaw = this.convertToGrayscale(baselineRaw);
        currentRaw = this.convertToGrayscale(currentRaw);
      }

      // Create diff buffer
      const diffBuffer = Buffer.alloc(width * height * 4);

      // Parse highlight color
      const highlightRGB = this.parseHexColor(options.highlightColor);

      // Perform pixel comparison
      const pixelsDifferent = pixelmatch(
        baselineRaw,
        currentRaw,
        diffBuffer,
        width,
        height,
        {
          threshold: options.threshold,
          includeAA: !options.ignoreAntialiasing,
          alpha: 0.1,
          aaColor: [255, 255, 0], // Yellow for anti-aliasing differences
          diffColor: highlightRGB,
        }
      );

      // Calculate difference percentage
      const totalPixels = width * height;
      const difference = pixelsDifferent / totalPixels;

      // Determine if comparison passed
      const passed = difference <= options.threshold;

      // Generate diff image if comparison failed
      let diffImage: Buffer | undefined;
      if (!passed) {
        diffImage = await sharp(diffBuffer, {
          raw: {
            width,
            height,
            channels: 4,
          },
        })
          .png()
          .toBuffer();
      }

      return {
        identifier: '',
        passed,
        difference,
        diffImage,
        dimensions: { width, height },
        pixelsDifferent,
      };
    } catch (error) {
      return {
        identifier: '',
        passed: false,
        difference: 1,
        dimensions: { width: 0, height: 0 },
        pixelsDifferent: 0,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }

  /**
   * Compare multiple image pairs in parallel
   * @param comparisons - Array of comparison pairs
   * @param options - Diff options
   * @returns Array of comparison results
   */
  async compareAll(
    comparisons: ComparisonPair[],
    options: DiffOptions
  ): Promise<ComparisonResult[]> {
    const results = await Promise.all(
      comparisons.map(async (pair) => {
        const result = await this.compare(pair.baseline, pair.current, options);
        return {
          ...result,
          identifier: pair.identifier,
        };
      })
    );

    return results;
  }

  /**
   * Parse hex color string to RGB array
   * @param hex - Hex color string (e.g., "#FF0000")
   * @returns RGB array [r, g, b]
   */
  private parseHexColor(hex: string): [number, number, number] {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return [r, g, b];
  }

  /**
   * Convert RGBA buffer to grayscale by setting R=G=B to luminance value
   * Uses the standard luminance formula: 0.299*R + 0.587*G + 0.114*B
   * @param buffer - RGBA buffer
   * @returns Grayscale RGBA buffer
   */
  private convertToGrayscale(buffer: Buffer): Buffer {
    const result = Buffer.alloc(buffer.length);
    for (let i = 0; i < buffer.length; i += 4) {
      const r = buffer[i];
      const g = buffer[i + 1];
      const b = buffer[i + 2];
      const a = buffer[i + 3];

      // Calculate luminance using standard formula
      const luminance = Math.round(0.299 * (r ?? 0) + 0.587 * (g ?? 0) + 0.114 * (b ?? 0));

      // Set R, G, B to the same luminance value
      result[i] = luminance;
      result[i + 1] = luminance;
      result[i + 2] = luminance;
      result[i + 3] = a ?? 255;
    }
    return result;
  }
}
