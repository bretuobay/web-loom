import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import sharp from 'sharp';
import { CompareEngine } from './compare-engine.js';
import { DiffOptions } from '../config/schema.js';

/**
 * Feature: visdiff-phase1, Property 10: Threshold respect
 * Validates: Requirements 3.2
 *
 * For any configured threshold value, pixel differences below that threshold
 * should result in a passing comparison
 */
describe('Property 10: Threshold respect', () => {
  it('should pass when pixel differences are below threshold', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 10, max: 100 }), // width
        fc.integer({ min: 10, max: 100 }), // height
        fc.double({ min: 0.01, max: 0.5 }), // threshold
        fc.integer({ min: 1, max: 10 }), // number of pixels to change
        async (width, height, threshold, pixelsToChange) => {
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

          // Create a current image with slight differences
          // Change a small number of pixels
          const totalPixels = width * height;
          const actualPixelsToChange = Math.min(pixelsToChange, Math.floor(totalPixels * threshold * 0.5));

          // Create raw pixel data
          const rawData = Buffer.alloc(width * height * 4);
          for (let i = 0; i < width * height; i++) {
            rawData[i * 4] = 100; // R
            rawData[i * 4 + 1] = 100; // G
            rawData[i * 4 + 2] = 100; // B
            rawData[i * 4 + 3] = 255; // A
          }

          // Change some pixels
          for (let i = 0; i < actualPixelsToChange; i++) {
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

          // The comparison should pass if difference is below threshold
          if (result.difference <= threshold) {
            expect(result.passed).toBe(true);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should fail when pixel differences exceed threshold', async () => {
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

          // The comparison should fail if difference exceeds threshold
          if (result.difference > threshold) {
            expect(result.passed).toBe(false);
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
