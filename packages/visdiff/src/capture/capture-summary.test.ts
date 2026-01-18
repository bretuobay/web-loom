/**
 * Property test: Capture summary completeness
 * Feature: visdiff-phase1, Property 7: Capture summary completeness
 * Validates: Requirements 2.5
 *
 * For any capture run, the output summary should include counts of both
 * successful and failed captures
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fc from 'fast-check';
import { BrowserManager } from '../browser/browser-manager.js';
import { CaptureEngine } from './capture-engine.js';
import { Viewport, CaptureOptions } from '../config/schema.js';

describe('Property 7: Capture summary completeness', () => {
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

  it('should include success and failure counts in summary', async () => {
    // Generator for URL lists with mix of valid and invalid
    const urlListArb = fc.array(
      fc.constantFrom(
        'about:blank',
        'data:text/html,<h1>Test</h1>',
        'http://192.0.2.1:9999', // Non-routable
      ),
      { minLength: 2, maxLength: 6 },
    );

    const viewport: Viewport = {
      width: 800,
      height: 600,
      name: 'test',
    };

    const options: CaptureOptions = {
      fullPage: false,
      omitBackground: false,
      timeout: 500,
      waitForNetworkIdle: false,
    };

    await fc.assert(
      fc.asyncProperty(urlListArb, async (urls) => {
        const summary = await captureEngine.captureAll(urls, [viewport], options);

        // Summary should have all required fields
        expect(summary).toBeDefined();
        expect(summary.total).toBeDefined();
        expect(summary.successful).toBeDefined();
        expect(summary.failed).toBeDefined();
        expect(summary.results).toBeDefined();

        // Counts should be numbers
        expect(typeof summary.total).toBe('number');
        expect(typeof summary.successful).toBe('number');
        expect(typeof summary.failed).toBe('number');

        // Total should equal sum of successful and failed
        expect(summary.total).toBe(summary.successful + summary.failed);

        // Total should match number of URLs
        expect(summary.total).toBe(urls.length);

        // Results array should match total
        expect(summary.results.length).toBe(summary.total);

        // Counts should be non-negative
        expect(summary.total).toBeGreaterThanOrEqual(0);
        expect(summary.successful).toBeGreaterThanOrEqual(0);
        expect(summary.failed).toBeGreaterThanOrEqual(0);
      }),
      {
        numRuns: 10,
        timeout: 120000,
      },
    );
  }, 150000);

  it('should accurately count successful captures', async () => {
    const viewports: Viewport[] = [
      { width: 375, height: 667, name: 'mobile' },
      { width: 768, height: 1024, name: 'tablet' },
    ];

    const urls = ['about:blank', 'data:text/html,<h1>Success</h1>'];

    const options: CaptureOptions = {
      fullPage: false,
      omitBackground: false,
      timeout: 10000,
      waitForNetworkIdle: false,
    };

    const summary = await captureEngine.captureAll(urls, viewports, options);

    // All should succeed
    const expectedTotal = urls.length * viewports.length;
    expect(summary.total).toBe(expectedTotal);
    expect(summary.successful).toBe(expectedTotal);
    expect(summary.failed).toBe(0);

    // Verify all results are successful
    for (const result of summary.results) {
      expect(result.success).toBe(true);
    }
  });

  it('should accurately count failed captures', async () => {
    const viewports: Viewport[] = [
      { width: 800, height: 600, name: 'test1' },
      { width: 1024, height: 768, name: 'test2' },
    ];

    // URLs that will fail
    const urls = ['http://192.0.2.1:9999', 'http://192.0.2.2:9999'];

    const options: CaptureOptions = {
      fullPage: false,
      omitBackground: false,
      timeout: 300,
      waitForNetworkIdle: false,
    };

    const summary = await captureEngine.captureAll(urls, viewports, options);

    // All should fail
    const expectedTotal = urls.length * viewports.length;
    expect(summary.total).toBe(expectedTotal);
    expect(summary.successful).toBe(0);
    expect(summary.failed).toBe(expectedTotal);

    // Verify all results are failures
    for (const result of summary.results) {
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    }
  });

  it('should handle mixed success and failure counts', async () => {
    const viewport: Viewport = {
      width: 800,
      height: 600,
      name: 'test',
    };

    const urls = [
      'about:blank', // Success
      'http://192.0.2.1:9999', // Failure
      'data:text/html,<h1>Test</h1>', // Success
      'http://192.0.2.2:9999', // Failure
    ];

    const options: CaptureOptions = {
      fullPage: false,
      omitBackground: false,
      timeout: 500,
      waitForNetworkIdle: false,
    };

    const summary = await captureEngine.captureAll(urls, [viewport], options);

    expect(summary.total).toBe(4);
    expect(summary.successful).toBe(2);
    expect(summary.failed).toBe(2);
    expect(summary.successful + summary.failed).toBe(summary.total);
  });

  it('should include results array with all captures', async () => {
    const viewportCountArb = fc.integer({ min: 1, max: 4 });
    const urlCountArb = fc.integer({ min: 1, max: 4 });

    await fc.assert(
      fc.asyncProperty(viewportCountArb, urlCountArb, async (viewportCount, urlCount) => {
        const viewports: Viewport[] = [];
        for (let i = 0; i < viewportCount; i++) {
          viewports.push({
            width: 400 + i * 100,
            height: 300 + i * 100,
            name: `viewport-${i}`,
          });
        }

        const urls: string[] = [];
        for (let i = 0; i < urlCount; i++) {
          urls.push(i % 2 === 0 ? 'about:blank' : 'data:text/html,<h1>Test</h1>');
        }

        const options: CaptureOptions = {
          fullPage: false,
          omitBackground: false,
          timeout: 10000,
          waitForNetworkIdle: false,
        };

        const summary = await captureEngine.captureAll(urls, viewports, options);

        const expectedTotal = viewportCount * urlCount;
        expect(summary.total).toBe(expectedTotal);
        expect(summary.results.length).toBe(expectedTotal);

        // Each result should have required fields
        for (const result of summary.results) {
          expect(result.url).toBeDefined();
          expect(result.viewport).toBeDefined();
          expect(result.image).toBeDefined();
          expect(result.timestamp).toBeInstanceOf(Date);
          expect(result.metadata).toBeDefined();
          expect(typeof result.success).toBe('boolean');
        }
      }),
      {
        numRuns: 10,
        timeout: 120000,
      },
    );
  }, 150000);

  it('should maintain summary consistency across multiple runs', async () => {
    const viewport: Viewport = {
      width: 800,
      height: 600,
      name: 'test',
    };

    const urls = ['about:blank', 'data:text/html,<h1>Test</h1>'];

    const options: CaptureOptions = {
      fullPage: false,
      omitBackground: false,
      timeout: 10000,
      waitForNetworkIdle: false,
    };

    // Run multiple times
    const summaries = [];
    for (let i = 0; i < 3; i++) {
      const summary = await captureEngine.captureAll(urls, [viewport], options);
      summaries.push(summary);
    }

    // All summaries should have same counts
    for (const summary of summaries) {
      expect(summary.total).toBe(2);
      expect(summary.successful).toBe(2);
      expect(summary.failed).toBe(0);
    }
  });
});
