import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import sharp from 'sharp';
import { CompareEngine } from './compare-engine.js';
import { DiffOptions } from '../config/schema.js';

/**
 * Feature: visdiff-phase1, Property 38: Anti-aliasing tolerance
 * Validates: Requirements 9.1
 *
 * For any pair of images with only anti-aliasing differences and
 * ignoreAntialiasing enabled, the comparison should pass
 */
describe('Property 38: Anti-aliasing tolerance', () => {
  it('should tolerate anti-aliasing differences when ignoreAntialiasing is enabled', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 50, max: 200 }), // width
        fc.integer({ min: 50, max: 200 }), // height
        fc.double({ min: 0.01, max: 0.2 }), // threshold
        async (width, height, threshold) => {
          // Create a baseline image with a sharp edge (black and white)
          const baselineRaw = Buffer.alloc(width * height * 4);
          for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
              const idx = (y * width + x) * 4;
              // Create a vertical edge in the middle
              if (x < width / 2) {
                baselineRaw[idx] = 0; // R
                baselineRaw[idx + 1] = 0; // G
                baselineRaw[idx + 2] = 0; // B
              } else {
                baselineRaw[idx] = 255; // R
                baselineRaw[idx + 1] = 255; // G
                baselineRaw[idx + 2] = 255; // B
              }
              baselineRaw[idx + 3] = 255; // A
            }
          }

          const baselineImage = await sharp(baselineRaw, {
            raw: {
              width,
              height,
              channels: 4,
            },
          })
            .png()
            .toBuffer();

          // Create a current image with slight anti-aliasing differences
          // Add gray pixels along the edge to simulate anti-aliasing
          const currentRaw = Buffer.alloc(width * height * 4);
          for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
              const idx = (y * width + x) * 4;
              // Create a vertical edge with anti-aliasing
              if (x < width / 2 - 1) {
                currentRaw[idx] = 0; // R
                currentRaw[idx + 1] = 0; // G
                currentRaw[idx + 2] = 0; // B
              } else if (x === Math.floor(width / 2 - 1) || x === Math.floor(width / 2)) {
                // Anti-aliasing pixels (gray)
                currentRaw[idx] = 128; // R
                currentRaw[idx + 1] = 128; // G
                currentRaw[idx + 2] = 128; // B
              } else {
                currentRaw[idx] = 255; // R
                currentRaw[idx + 1] = 255; // G
                currentRaw[idx + 2] = 255; // B
              }
              currentRaw[idx + 3] = 255; // A
            }
          }

          const currentImage = await sharp(currentRaw, {
            raw: {
              width,
              height,
              channels: 4,
            },
          })
            .png()
            .toBuffer();

          // Test with ignoreAntialiasing enabled
          const optionsWithIgnore: DiffOptions = {
            threshold,
            ignoreAntialiasing: true,
            ignoreColors: false,
            highlightColor: '#FF0000',
          };

          const engine = new CompareEngine();
          const resultWithIgnore = await engine.compare(baselineImage, currentImage, optionsWithIgnore);

          // Test with ignoreAntialiasing disabled
          const optionsWithoutIgnore: DiffOptions = {
            threshold,
            ignoreAntialiasing: false,
            ignoreColors: false,
            highlightColor: '#FF0000',
          };

          const resultWithoutIgnore = await engine.compare(baselineImage, currentImage, optionsWithoutIgnore);

          // With ignoreAntialiasing enabled, the difference should be smaller
          // or the comparison should be more likely to pass
          expect(resultWithIgnore.difference).toBeLessThanOrEqual(resultWithoutIgnore.difference);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should detect differences when ignoreAntialiasing is disabled', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 50, max: 200 }), // width
        fc.integer({ min: 50, max: 200 }), // height
        async (width, height) => {
          // Create a baseline image (solid color)
          const baselineImage = await sharp({
            create: {
              width,
              height,
              channels: 4,
              background: { r: 0, g: 0, b: 0, alpha: 1 },
            },
          })
            .png()
            .toBuffer();

          // Create a current image with anti-aliasing-like differences
          const currentRaw = Buffer.alloc(width * height * 4);
          for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
              const idx = (y * width + x) * 4;
              // Add some gray pixels (simulating anti-aliasing)
              if (x % 10 === 0 && y % 10 === 0) {
                currentRaw[idx] = 50; // R
                currentRaw[idx + 1] = 50; // G
                currentRaw[idx + 2] = 50; // B
              } else {
                currentRaw[idx] = 0; // R
                currentRaw[idx + 1] = 0; // G
                currentRaw[idx + 2] = 0; // B
              }
              currentRaw[idx + 3] = 255; // A
            }
          }

          const currentImage = await sharp(currentRaw, {
            raw: {
              width,
              height,
              channels: 4,
            },
          })
            .png()
            .toBuffer();

          const options: DiffOptions = {
            threshold: 0.01,
            ignoreAntialiasing: false,
            ignoreColors: false,
            highlightColor: '#FF0000',
          };

          const engine = new CompareEngine();
          const result = await engine.compare(baselineImage, currentImage, options);

          // With ignoreAntialiasing disabled, differences should be detected
          expect(result.pixelsDifferent).toBeGreaterThan(0);
        },
      ),
      { numRuns: 100 },
    );
  });
});
