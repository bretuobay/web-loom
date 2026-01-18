import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import sharp from 'sharp';
import { CompareEngine } from './compare-engine.js';
import { DiffOptions } from '../config/schema.js';

/**
 * Feature: visdiff-phase1, Property 53: Comparison failure percentage
 * Validates: Requirements 12.3
 *
 * For any image comparison failure, the system should report the percentage difference
 */
describe('Property 53: Comparison failure percentage', () => {
  it('should report percentage difference for all comparisons', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 50, max: 200 }), // width
        fc.integer({ min: 50, max: 200 }), // height
        fc.double({ min: 0.01, max: 0.5 }), // difference ratio
        async (width, height, diffRatio) => {
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

          // Create a current image with controlled differences
          const totalPixels = width * height;
          const pixelsToChange = Math.floor(totalPixels * diffRatio);

          const rawData = Buffer.alloc(width * height * 4);
          for (let i = 0; i < width * height; i++) {
            rawData[i * 4] = 100; // R
            rawData[i * 4 + 1] = 100; // G
            rawData[i * 4 + 2] = 100; // B
            rawData[i * 4 + 3] = 255; // A
          }

          // Change specific pixels
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
            highlightColor: '#FF0000',
          };

          const engine = new CompareEngine();
          const result = await engine.compare(baselineImage, currentImage, options);

          // The difference should be reported as a percentage (0-1)
          expect(result.difference).toBeGreaterThanOrEqual(0);
          expect(result.difference).toBeLessThanOrEqual(1);

          // The difference should be approximately equal to the expected ratio
          // (allowing for some tolerance due to pixelmatch's algorithm)
          expect(result.difference).toBeGreaterThan(0);
          expect(result.difference).toBeLessThanOrEqual(diffRatio + 0.1);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should report zero difference for identical images', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 50, max: 200 }), // width
        fc.integer({ min: 50, max: 200 }), // height
        async (width, height) => {
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
            threshold: 0.1,
            ignoreAntialiasing: false,
            ignoreColors: false,
            highlightColor: '#FF0000',
          };

          const engine = new CompareEngine();
          const result = await engine.compare(baselineImage, currentImage, options);

          // Identical images should have zero difference
          expect(result.difference).toBe(0);
          expect(result.pixelsDifferent).toBe(0);
          expect(result.passed).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should report 100% difference for completely different images', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 50, max: 200 }), // width
        fc.integer({ min: 50, max: 200 }), // height
        async (width, height) => {
          // Create completely different images
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

          const currentImage = await sharp({
            create: {
              width,
              height,
              channels: 4,
              background: { r: 255, g: 255, b: 255, alpha: 1 },
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

          // Completely different images should have high difference
          expect(result.difference).toBeGreaterThan(0.9);
          expect(result.pixelsDifferent).toBe(width * height);
          expect(result.passed).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should include pixel count in comparison results', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 50, max: 200 }), // width
        fc.integer({ min: 50, max: 200 }), // height
        fc.double({ min: 0.1, max: 0.5 }), // difference ratio
        async (width, height, diffRatio) => {
          // Create images with known differences
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

          const totalPixels = width * height;
          const pixelsToChange = Math.floor(totalPixels * diffRatio);

          const rawData = Buffer.alloc(width * height * 4);
          for (let i = 0; i < width * height; i++) {
            rawData[i * 4] = 100; // R
            rawData[i * 4 + 1] = 100; // G
            rawData[i * 4 + 2] = 100; // B
            rawData[i * 4 + 3] = 255; // A
          }

          for (let i = 0; i < pixelsToChange; i++) {
            rawData[i * 4] = 200;
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
            highlightColor: '#FF0000',
          };

          const engine = new CompareEngine();
          const result = await engine.compare(baselineImage, currentImage, options);

          // Pixel count should be reported
          expect(result.pixelsDifferent).toBeGreaterThanOrEqual(0);
          expect(result.pixelsDifferent).toBeLessThanOrEqual(totalPixels);

          // Difference percentage should match pixel count
          const calculatedDiff = result.pixelsDifferent / totalPixels;
          expect(Math.abs(result.difference - calculatedDiff)).toBeLessThan(0.001);
        },
      ),
      { numRuns: 100 },
    );
  });
});
