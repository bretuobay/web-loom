/**
 * Property test: Complete viewport coverage
 * Feature: visdiff-phase1, Property 4: Complete viewport coverage
 * Validates: Requirements 2.2
 *
 * For any set of configured viewports, the capture command should produce
 * screenshots for all viewports
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fc from 'fast-check';
import { BrowserManager } from '../browser/browser-manager.js';
import { CaptureEngine } from './capture-engine.js';
import { Viewport, CaptureOptions } from '../config/schema.js';

describe('Property 4: Complete viewport coverage', () => {
  let browserManager: BrowserManager;
  let captureEngine: CaptureEngine;

  beforeAll(async () => {
    browserManager = new BrowserManager({ headless: true });
    await browserManager.launch();
    captureEngine = new CaptureEngine(browserManager, 0);
  });

  afterAll(async () => {
    await browserManager.close();
  });

  it('should capture screenshots for all configured viewports', async () => {
    // Generator for viewport arrays
    const viewportArb = fc.record({
      width: fc.integer({ min: 320, max: 1920 }),
      height: fc.integer({ min: 240, max: 1080 }),
      name: fc.stringOf(fc.constantFrom('a', 'b', 'c', 'd'), { minLength: 3, maxLength: 10 }),
    });

    const viewportsArb = fc.array(viewportArb, { minLength: 1, maxLength: 5 });

    const url = 'about:blank';

    const options: CaptureOptions = {
      fullPage: false,
      omitBackground: false,
      timeout: 10000,
      waitForNetworkIdle: false,
    };

    await fc.assert(
      fc.asyncProperty(viewportsArb, async (viewports) => {
        const summary = await captureEngine.captureAll([url], viewports, options);

        // Should have results for all viewports
        expect(summary.total).toBe(viewports.length);
        expect(summary.results.length).toBe(viewports.length);

        // Each viewport should have a corresponding result
        for (const viewport of viewports) {
          const result = summary.results.find(
            (r) =>
              r.viewport.width === viewport.width &&
              r.viewport.height === viewport.height &&
              r.viewport.name === viewport.name,
          );

          expect(result).toBeDefined();
          expect(result?.url).toBe(url);
        }

        // All should succeed for about:blank
        expect(summary.successful).toBe(viewports.length);
        expect(summary.failed).toBe(0);
      }),
      {
        numRuns: 10,
        timeout: 120000,
      },
    );
  }, 150000);

  it('should capture for multiple URLs and viewports', async () => {
    const viewports: Viewport[] = [
      { width: 375, height: 667, name: 'mobile' },
      { width: 768, height: 1024, name: 'tablet' },
      { width: 1920, height: 1080, name: 'desktop' },
    ];

    const urls = ['about:blank', 'data:text/html,<h1>Test</h1>'];

    const options: CaptureOptions = {
      fullPage: false,
      omitBackground: false,
      timeout: 10000,
      waitForNetworkIdle: false,
    };

    const summary = await captureEngine.captureAll(urls, viewports, options);

    // Should have results for all combinations
    const expectedTotal = urls.length * viewports.length;
    expect(summary.total).toBe(expectedTotal);
    expect(summary.results.length).toBe(expectedTotal);

    // Verify each combination exists
    for (const url of urls) {
      for (const viewport of viewports) {
        const result = summary.results.find(
          (r) =>
            r.url === url &&
            r.viewport.width === viewport.width &&
            r.viewport.height === viewport.height &&
            r.viewport.name === viewport.name,
        );

        expect(result).toBeDefined();
        expect(result?.success).toBe(true);
      }
    }
  });

  it('should handle varying numbers of viewports', async () => {
    const viewportCountArb = fc.integer({ min: 1, max: 10 });

    const url = 'about:blank';

    const options: CaptureOptions = {
      fullPage: false,
      omitBackground: false,
      timeout: 10000,
      waitForNetworkIdle: false,
    };

    await fc.assert(
      fc.asyncProperty(viewportCountArb, async (count) => {
        // Generate unique viewports
        const viewports: Viewport[] = [];
        for (let i = 0; i < count; i++) {
          viewports.push({
            width: 400 + i * 100,
            height: 300 + i * 100,
            name: `viewport-${i}`,
          });
        }

        const summary = await captureEngine.captureAll([url], viewports, options);

        expect(summary.total).toBe(count);
        expect(summary.results.length).toBe(count);
        expect(summary.successful).toBe(count);
      }),
      {
        numRuns: 10,
        timeout: 120000,
      },
    );
  }, 150000);

  it('should maintain viewport dimensions in results', async () => {
    const viewports: Viewport[] = [
      { width: 320, height: 568, name: 'iphone-se' },
      { width: 375, height: 812, name: 'iphone-x' },
      { width: 414, height: 896, name: 'iphone-11' },
    ];

    const url = 'about:blank';

    const options: CaptureOptions = {
      fullPage: false,
      omitBackground: false,
      timeout: 10000,
      waitForNetworkIdle: false,
    };

    const summary = await captureEngine.captureAll([url], viewports, options);

    expect(summary.results.length).toBe(viewports.length);

    // Verify each result has correct viewport dimensions
    for (const result of summary.results) {
      const expectedViewport = viewports.find((v) => v.name === result.viewport.name);
      expect(expectedViewport).toBeDefined();
      expect(result.viewport.width).toBe(expectedViewport?.width);
      expect(result.viewport.height).toBe(expectedViewport?.height);
      expect(result.metadata.dimensions.width).toBe(expectedViewport?.width);
      expect(result.metadata.dimensions.height).toBe(expectedViewport?.height);
    }
  });

  it('should capture all viewports even with different aspect ratios', async () => {
    const aspectRatioArb = fc.record({
      width: fc.integer({ min: 320, max: 1920 }),
      height: fc.integer({ min: 240, max: 1080 }),
    });

    const viewportsArb = fc.array(aspectRatioArb, { minLength: 2, maxLength: 5 }).map((dims, idx) =>
      dims.map((d, i) => ({
        ...d,
        name: `viewport-${idx}-${i}`,
      })),
    );

    const url = 'about:blank';

    const options: CaptureOptions = {
      fullPage: false,
      omitBackground: false,
      timeout: 10000,
      waitForNetworkIdle: false,
    };

    await fc.assert(
      fc.asyncProperty(viewportsArb, async (viewports) => {
        const summary = await captureEngine.captureAll([url], viewports, options);

        // Should capture all viewports
        expect(summary.total).toBe(viewports.length);
        expect(summary.results.length).toBe(viewports.length);

        // All should succeed
        expect(summary.successful).toBe(viewports.length);
      }),
      {
        numRuns: 10,
        timeout: 120000,
      },
    );
  }, 150000);
});
