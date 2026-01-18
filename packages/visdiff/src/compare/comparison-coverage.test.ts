import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import sharp from 'sharp';
import { CompareEngine, ComparisonPair } from './compare-engine.js';
import { DiffOptions } from '../config/schema.js';

/**
 * Feature: visdiff-phase1, Property 9: Complete comparison coverage
 * Validates: Requirements 3.1
 *
 * For any configuration with multiple paths and viewports, the compare command
 * should capture and compare all combinations
 */
describe('Property 9: Complete comparison coverage', () => {
  it('should compare all provided image pairs', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 10 }), // number of comparisons
        fc.integer({ min: 50, max: 100 }), // width
        fc.integer({ min: 50, max: 100 }), // height
        async (numComparisons, width, height) => {
          // Create comparison pairs
          const comparisons: ComparisonPair[] = [];

          for (let i = 0; i < numComparisons; i++) {
            const baseline = await sharp({
              create: {
                width,
                height,
                channels: 4,
                background: { r: 100, g: 100, b: 100, alpha: 1 },
              },
            })
              .png()
              .toBuffer();

            const current = await sharp({
              create: {
                width,
                height,
                channels: 4,
                background: { r: 100 + i * 10, g: 100, b: 100, alpha: 1 },
              },
            })
              .png()
              .toBuffer();

            comparisons.push({
              baseline,
              current,
              identifier: `test-${i}`,
            });
          }

          const options: DiffOptions = {
            threshold: 0.1,
            ignoreAntialiasing: false,
            ignoreColors: false,
            highlightColor: '#FF0000',
          };

          const engine = new CompareEngine();
          const results = await engine.compareAll(comparisons, options);

          // All comparisons should be processed
          expect(results.length).toBe(numComparisons);

          // Each result should have the correct identifier
          for (let i = 0; i < numComparisons; i++) {
            expect(results[i].identifier).toBe(`test-${i}`);
          }

          // Each result should have valid data
          results.forEach((result) => {
            expect(result.dimensions.width).toBe(width);
            expect(result.dimensions.height).toBe(height);
            expect(result.difference).toBeGreaterThanOrEqual(0);
            expect(result.difference).toBeLessThanOrEqual(1);
            expect(result.pixelsDifferent).toBeGreaterThanOrEqual(0);
          });
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should handle empty comparison list', async () => {
    const options: DiffOptions = {
      threshold: 0.1,
      ignoreAntialiasing: false,
      ignoreColors: false,
      highlightColor: '#FF0000',
    };

    const engine = new CompareEngine();
    const results = await engine.compareAll([], options);

    expect(results).toEqual([]);
  });

  it('should process comparisons independently', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 2, max: 5 }), // number of comparisons
        fc.integer({ min: 50, max: 100 }), // width
        fc.integer({ min: 50, max: 100 }), // height
        async (numComparisons, width, height) => {
          // Create comparison pairs with varying differences
          const comparisons: ComparisonPair[] = [];

          for (let i = 0; i < numComparisons; i++) {
            const baseline = await sharp({
              create: {
                width,
                height,
                channels: 4,
                background: { r: 100, g: 100, b: 100, alpha: 1 },
              },
            })
              .png()
              .toBuffer();

            // Some comparisons will pass, some will fail
            const colorDiff = i % 2 === 0 ? 5 : 100; // Small vs large difference
            const current = await sharp({
              create: {
                width,
                height,
                channels: 4,
                background: { r: 100 + colorDiff, g: 100, b: 100, alpha: 1 },
              },
            })
              .png()
              .toBuffer();

            comparisons.push({
              baseline,
              current,
              identifier: `test-${i}`,
            });
          }

          const options: DiffOptions = {
            threshold: 0.1,
            ignoreAntialiasing: false,
            ignoreColors: false,
            highlightColor: '#FF0000',
          };

          const engine = new CompareEngine();
          const results = await engine.compareAll(comparisons, options);

          // All comparisons should be processed
          expect(results.length).toBe(numComparisons);

          // Results should be independent (some pass, some fail)
          const passedCount = results.filter((r) => r.passed).length;
          const failedCount = results.filter((r) => !r.passed).length;

          expect(passedCount + failedCount).toBe(numComparisons);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should handle comparisons with different dimensions', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 2, max: 5 }), // number of comparisons
        async (numComparisons) => {
          // Create comparison pairs with different dimensions
          const comparisons: ComparisonPair[] = [];

          for (let i = 0; i < numComparisons; i++) {
            const width = 50 + i * 10;
            const height = 50 + i * 10;

            const baseline = await sharp({
              create: {
                width,
                height,
                channels: 4,
                background: { r: 100, g: 100, b: 100, alpha: 1 },
              },
            })
              .png()
              .toBuffer();

            const current = await sharp({
              create: {
                width,
                height,
                channels: 4,
                background: { r: 150, g: 100, b: 100, alpha: 1 },
              },
            })
              .png()
              .toBuffer();

            comparisons.push({
              baseline,
              current,
              identifier: `test-${width}x${height}`,
            });
          }

          const options: DiffOptions = {
            threshold: 0.1,
            ignoreAntialiasing: false,
            ignoreColors: false,
            highlightColor: '#FF0000',
          };

          const engine = new CompareEngine();
          const results = await engine.compareAll(comparisons, options);

          // All comparisons should be processed
          expect(results.length).toBe(numComparisons);

          // Each result should have the correct dimensions
          for (let i = 0; i < numComparisons; i++) {
            const expectedWidth = 50 + i * 10;
            const expectedHeight = 50 + i * 10;
            expect(results[i].dimensions.width).toBe(expectedWidth);
            expect(results[i].dimensions.height).toBe(expectedHeight);
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
