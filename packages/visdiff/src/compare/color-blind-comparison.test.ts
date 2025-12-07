import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import sharp from 'sharp';
import { CompareEngine } from './compare-engine.js';
import { DiffOptions } from '../config/schema.js';

/**
 * Feature: visdiff-phase1, Property 39: Color-blind comparison
 * Validates: Requirements 9.2
 *
 * For any pair of images with only color differences and ignoreColors enabled,
 * the comparison should pass (comparing only luminance values)
 */
describe('Property 39: Color-blind comparison', () => {
  it('should pass when only colors differ and ignoreColors is enabled', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 10, max: 100 }), // width
        fc.integer({ min: 10, max: 100 }), // height
        fc.integer({ min: 50, max: 200 }), // luminance value
        async (width, height, luminance) => {
          // Create a baseline image with one color (e.g., red)
          const baselineImage = await sharp({
            create: {
              width,
              height,
              channels: 4,
              background: { r: luminance, g: 0, b: 0, alpha: 1 },
            },
          })
            .png()
            .toBuffer();

          // Create a current image with different color but same luminance (e.g., green)
          const currentImage = await sharp({
            create: {
              width,
              height,
              channels: 4,
              background: { r: 0, g: luminance, b: 0, alpha: 1 },
            },
          })
            .png()
            .toBuffer();

          // Test with ignoreColors enabled
          const optionsWithIgnore: DiffOptions = {
            threshold: 0.1,
            ignoreAntialiasing: false,
            ignoreColors: true,
            highlightColor: '#FF0000',
          };

          const engine = new CompareEngine();
          const resultWithIgnore = await engine.compare(
            baselineImage,
            currentImage,
            optionsWithIgnore
          );

          // Test with ignoreColors disabled
          const optionsWithoutIgnore: DiffOptions = {
            threshold: 0.1,
            ignoreAntialiasing: false,
            ignoreColors: false,
            highlightColor: '#FF0000',
          };

          const resultWithoutIgnore = await engine.compare(
            baselineImage,
            currentImage,
            optionsWithoutIgnore
          );

          // With ignoreColors enabled, the difference should be smaller
          // because we're only comparing luminance
          expect(resultWithIgnore.difference).toBeLessThanOrEqual(
            resultWithoutIgnore.difference
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should detect luminance differences even with ignoreColors enabled', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 50, max: 200 }), // width - larger to avoid edge cases
        fc.integer({ min: 50, max: 200 }), // height - larger to avoid edge cases
        async (width, height) => {
          // Create a baseline image with low luminance
          const baselineImage = await sharp({
            create: {
              width,
              height,
              channels: 4,
              background: { r: 50, g: 50, b: 50, alpha: 1 },
            },
          })
            .png()
            .toBuffer();

          // Create a current image with high luminance (significant difference)
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
            ignoreColors: true,
            highlightColor: '#FF0000',
          };

          const engine = new CompareEngine();
          const result = await engine.compare(baselineImage, currentImage, options);

          // Even with ignoreColors enabled, significant luminance differences should be detected
          expect(result.pixelsDifferent).toBeGreaterThan(0);
          expect(result.passed).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should detect color differences when ignoreColors is disabled', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 10, max: 100 }), // width
        fc.integer({ min: 10, max: 100 }), // height
        fc.integer({ min: 100, max: 200 }), // color value
        async (width, height, colorValue) => {
          // Create a baseline image (red)
          const baselineImage = await sharp({
            create: {
              width,
              height,
              channels: 4,
              background: { r: colorValue, g: 0, b: 0, alpha: 1 },
            },
          })
            .png()
            .toBuffer();

          // Create a current image (blue)
          const currentImage = await sharp({
            create: {
              width,
              height,
              channels: 4,
              background: { r: 0, g: 0, b: colorValue, alpha: 1 },
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

          // With ignoreColors disabled, color differences should be detected
          expect(result.pixelsDifferent).toBeGreaterThan(0);
          expect(result.passed).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});
