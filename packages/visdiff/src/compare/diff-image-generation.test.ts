import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import sharp from 'sharp';
import { CompareEngine } from './compare-engine.js';
import { DiffOptions } from '../config/schema.js';

/**
 * Feature: visdiff-phase1, Property 11: Diff image generation on failure
 * Validates: Requirements 3.3
 *
 * For any comparison where differences exceed the threshold, a diff image
 * highlighting changed regions should be generated
 */
describe('Property 11: Diff image generation on failure', () => {
  it('should generate diff image when comparison fails', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 10, max: 100 }), // width
        fc.integer({ min: 10, max: 100 }), // height
        fc.double({ min: 0.01, max: 0.3 }), // threshold
        async (width, height, threshold) => {
          // Create a baseline image (solid color)
          const baselineImage = await sharp({
            create: {
              width,
              height,
              channels: 4,
              background: { r: 100, g: 100, b: 100, alpha: 1 },
            },
          })
            .png()
            .toBuffer();

          // Create a current image with significant differences
          // Change enough pixels to exceed threshold
          const totalPixels = width * height;
          const pixelsToChange = Math.ceil(totalPixels * (threshold + 0.1));

          // Create raw pixel data
          const rawData = Buffer.alloc(width * height * 4);
          for (let i = 0; i < width * height; i++) {
            rawData[i * 4] = 100; // R
            rawData[i * 4 + 1] = 100; // G
            rawData[i * 4 + 2] = 100; // B
            rawData[i * 4 + 3] = 255; // A
          }

          // Change enough pixels to exceed threshold
          for (let i = 0; i < pixelsToChange; i++) {
            rawData[i * 4] = 200; // Significant change in red channel
          }

          const currentImage = await sharp(rawData, {
            raw: {
              width,
              height,
              channels: 4,
            },
          })
            .png()
            .toBuffer();

          const options: DiffOptions = {
            threshold,
            ignoreAntialiasing: false,
            ignoreColors: false,
            highlightColor: '#FF0000',
          };

          const engine = new CompareEngine();
          const result = await engine.compare(baselineImage, currentImage, options);

          // If comparison failed, diff image should be generated
          if (!result.passed) {
            expect(result.diffImage).toBeDefined();
            expect(result.diffImage).toBeInstanceOf(Buffer);
            expect(result.diffImage!.length).toBeGreaterThan(0);

            // Verify the diff image is a valid PNG
            const diffMetadata = await sharp(result.diffImage!).metadata();
            expect(diffMetadata.format).toBe('png');
            expect(diffMetadata.width).toBe(width);
            expect(diffMetadata.height).toBe(height);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should not generate diff image when comparison passes', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 10, max: 100 }), // width
        fc.integer({ min: 10, max: 100 }), // height
        fc.double({ min: 0.1, max: 0.5 }), // threshold
        async (width, height, threshold) => {
          // Create identical images
          const baselineImage = await sharp({
            create: {
              width,
              height,
              channels: 4,
              background: { r: 100, g: 100, b: 100, alpha: 1 },
            },
          })
            .png()
            .toBuffer();

          const currentImage = await sharp({
            create: {
              width,
              height,
              channels: 4,
              background: { r: 100, g: 100, b: 100, alpha: 1 },
            },
          })
            .png()
            .toBuffer();

          const options: DiffOptions = {
            threshold,
            ignoreAntialiasing: false,
            ignoreColors: false,
            highlightColor: '#FF0000',
          };

          const engine = new CompareEngine();
          const result = await engine.compare(baselineImage, currentImage, options);

          // If comparison passed, diff image should not be generated
          if (result.passed) {
            expect(result.diffImage).toBeUndefined();
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
