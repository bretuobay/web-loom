import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import sharp from 'sharp';
import { CompareEngine } from './compare-engine.js';
import { DiffOptions } from '../config/schema.js';

/**
 * Feature: visdiff-phase1, Property 40: Threshold-based identity
 * Validates: Requirements 9.3
 *
 * For any pixel difference percentage below the configured threshold,
 * the images should be considered identical
 */
describe('Property 40: Threshold-based identity', () => {
  it('should consider images identical when difference is below threshold', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 50, max: 200 }), // width
        fc.integer({ min: 50, max: 200 }), // height
        fc.double({ min: 0.05, max: 0.5 }), // threshold
        async (width, height, threshold) => {
          // Create a baseline image
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

          // Create a current image with differences below threshold
          const totalPixels = width * height;
          const pixelsToChange = Math.floor(totalPixels * threshold * 0.5); // Half of threshold

          const rawData = Buffer.alloc(width * height * 4);
          for (let i = 0; i < width * height; i++) {
            rawData[i * 4] = 100; // R
            rawData[i * 4 + 1] = 100; // G
            rawData[i * 4 + 2] = 100; // B
            rawData[i * 4 + 3] = 255; // A
          }

          // Change some pixels (less than threshold)
          for (let i = 0; i < pixelsToChange; i++) {
            rawData[i * 4] = 150; // Change red channel
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

          // If difference is below threshold, images should be considered identical (passed)
          if (result.difference < threshold) {
            expect(result.passed).toBe(true);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should not consider images identical when difference equals or exceeds threshold', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 50, max: 200 }), // width
        fc.integer({ min: 50, max: 200 }), // height
        fc.double({ min: 0.05, max: 0.3 }), // threshold
        async (width, height, threshold) => {
          // Create a baseline image
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

          // Create a current image with differences exceeding threshold
          const totalPixels = width * height;
          const pixelsToChange = Math.ceil(totalPixels * (threshold + 0.05)); // Exceed threshold

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

          // If difference exceeds threshold, images should not be considered identical
          if (result.difference > threshold) {
            expect(result.passed).toBe(false);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should handle edge case where difference exactly equals threshold', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 100, max: 200 }), // width
        fc.integer({ min: 100, max: 200 }), // height
        fc.double({ min: 0.1, max: 0.3 }), // threshold
        async (width, height, threshold) => {
          // Create a baseline image
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

          // Create a current image with differences at threshold
          const totalPixels = width * height;
          const pixelsToChange = Math.floor(totalPixels * threshold);

          const rawData = Buffer.alloc(width * height * 4);
          for (let i = 0; i < width * height; i++) {
            rawData[i * 4] = 100; // R
            rawData[i * 4 + 1] = 100; // G
            rawData[i * 4 + 2] = 100; // B
            rawData[i * 4 + 3] = 255; // A
          }

          // Change pixels to match threshold
          for (let i = 0; i < pixelsToChange; i++) {
            rawData[i * 4] = 200; // Change red channel
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

          // The result should be consistent with the threshold comparison
          // passed should be true if difference <= threshold
          expect(result.passed).toBe(result.difference <= threshold);
        },
      ),
      { numRuns: 100 },
    );
  });
});
