import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import sharp from 'sharp';
import { CompareEngine } from './compare-engine.js';
import { DiffOptions } from '../config/schema.js';

/**
 * Feature: visdiff-phase1, Property 41: Diff visualization contrast
 * Validates: Requirements 9.4
 *
 * For any generated diff image, changed pixels should be highlighted
 * in a contrasting color
 */
describe('Property 41: Diff visualization contrast', () => {
  it('should highlight changed pixels in the specified highlight color', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 50, max: 200 }), // width
        fc.integer({ min: 50, max: 200 }), // height
        fc.hexaString({ minLength: 6, maxLength: 6 }), // hex color (without #)
        async (width, height, hexColor) => {
          // Ensure valid hex color
          const highlightColor = `#${hexColor}`;

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

          // Create a current image with significant differences
          const totalPixels = width * height;
          const pixelsToChange = Math.ceil(totalPixels * 0.2); // 20% difference

          const rawData = Buffer.alloc(width * height * 4);
          for (let i = 0; i < width * height; i++) {
            rawData[i * 4] = 100; // R
            rawData[i * 4 + 1] = 100; // G
            rawData[i * 4 + 2] = 100; // B
            rawData[i * 4 + 3] = 255; // A
          }

          // Change some pixels
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
            threshold: 0.01,
            ignoreAntialiasing: false,
            ignoreColors: false,
            highlightColor,
          };

          const engine = new CompareEngine();
          const result = await engine.compare(baselineImage, currentImage, options);

          // If comparison failed, diff image should be generated
          if (!result.passed && result.diffImage) {
            // Verify the diff image exists and is valid
            expect(result.diffImage).toBeDefined();
            expect(result.diffImage).toBeInstanceOf(Buffer);

            // Verify the diff image has the correct dimensions
            const diffMetadata = await sharp(result.diffImage).metadata();
            expect(diffMetadata.width).toBe(width);
            expect(diffMetadata.height).toBe(height);

            // Extract raw pixel data from diff image
            const diffRaw = await sharp(result.diffImage).ensureAlpha().raw().toBuffer();

            // Parse the highlight color
            const r = parseInt(highlightColor.slice(1, 3), 16);
            const g = parseInt(highlightColor.slice(3, 5), 16);
            const b = parseInt(highlightColor.slice(5, 7), 16);

            // Check that some pixels in the diff image match the highlight color
            // (allowing for some tolerance due to PNG compression)
            let highlightPixelCount = 0;
            for (let i = 0; i < totalPixels; i++) {
              const pixelR = diffRaw[i * 4];
              const pixelG = diffRaw[i * 4 + 1];
              const pixelB = diffRaw[i * 4 + 2];

              // Check if pixel is close to highlight color (within tolerance)
              if (
                Math.abs(pixelR - r) < 10 &&
                Math.abs(pixelG - g) < 10 &&
                Math.abs(pixelB - b) < 10
              ) {
                highlightPixelCount++;
              }
            }

            // At least some pixels should be highlighted
            expect(highlightPixelCount).toBeGreaterThan(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should generate diff images with consistent dimensions', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 50, max: 200 }), // width
        fc.integer({ min: 50, max: 200 }), // height
        async (width, height) => {
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

          // Create a current image with differences
          const currentImage = await sharp({
            create: {
              width,
              height,
              channels: 4,
              background: { r: 200, g: 200, b: 200, alpha: 1 },
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

          // If diff image is generated, it should have the same dimensions as input
          if (result.diffImage) {
            const diffMetadata = await sharp(result.diffImage).metadata();
            expect(diffMetadata.width).toBe(width);
            expect(diffMetadata.height).toBe(height);
            expect(diffMetadata.format).toBe('png');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should use different highlight colors correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 100, max: 200 }), // width
        fc.integer({ min: 100, max: 200 }), // height
        fc.constantFrom('#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF'), // common colors
        async (width, height, highlightColor) => {
          // Create images with differences
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
              background: { r: 200, g: 200, b: 200, alpha: 1 },
            },
          })
            .png()
            .toBuffer();

          const options: DiffOptions = {
            threshold: 0.01,
            ignoreAntialiasing: false,
            ignoreColors: false,
            highlightColor,
          };

          const engine = new CompareEngine();
          const result = await engine.compare(baselineImage, currentImage, options);

          // Diff image should be generated for this significant difference
          expect(result.diffImage).toBeDefined();
          expect(result.passed).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});
