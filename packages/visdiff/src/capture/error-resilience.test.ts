/**
 * Property test: Error resilience during capture
 * Feature: visdiff-phase1, Property 6: Error resilience during capture
 * Validates: Requirements 2.4
 *
 * For any page that fails to load within the timeout period, the system should
 * report the error and continue capturing remaining pages
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fc from 'fast-check';
import { BrowserManager } from '../browser/browser-manager.js';
import { CaptureEngine } from './capture-engine.js';
import { Viewport, CaptureOptions } from '../config/schema.js';

describe('Property 6: Error resilience during capture', () => {
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

  it('should continue capturing after failures', async () => {
    const viewport: Viewport = {
      width: 800,
      height: 600,
      name: 'test',
    };

    const options: CaptureOptions = {
      fullPage: false,
      omitBackground: false,
      timeout: 500, // Short timeout to force failures
      waitForNetworkIdle: false,
    };

    // Mix of valid and invalid URLs
    const urls = [
      'about:blank', // Should succeed
      'http://192.0.2.1:9999', // Should fail (non-routable)
      'data:text/html,<h1>Test</h1>', // Should succeed
      'http://192.0.2.2:9999', // Should fail (non-routable)
      'about:blank', // Should succeed
    ];

    const summary = await captureEngine.captureAll(urls, [viewport], options);

    // Should have attempted all URLs
    expect(summary.total).toBe(urls.length);
    expect(summary.results.length).toBe(urls.length);

    // Should have both successes and failures
    expect(summary.successful).toBeGreaterThan(0);
    expect(summary.failed).toBeGreaterThan(0);

    // Verify each result
    for (const result of summary.results) {
      expect(result).toBeDefined();
      expect(result.url).toBeDefined();
      expect(result.timestamp).toBeInstanceOf(Date);

      if (!result.success) {
        expect(result.error).toBeDefined();
      }
    }
  });

  it('should report errors for failed captures', async () => {
    const viewport: Viewport = {
      width: 1024,
      height: 768,
      name: 'test',
    };

    const options: CaptureOptions = {
      fullPage: false,
      omitBackground: false,
      timeout: 300,
      waitForNetworkIdle: false,
    };

    // URL that will fail
    const failingUrl = 'http://192.0.2.1:9999';

    const result = await captureEngine.capture(failingUrl, viewport, options);

    // Should indicate failure
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error?.message).toBeDefined();

    // Should still have metadata
    expect(result.metadata).toBeDefined();
    expect(result.url).toBe(failingUrl);
    expect(result.viewport).toEqual(viewport);
  });

  it('should handle mixed success and failure scenarios', async () => {
    // Generator for URL patterns
    const urlPatternArb = fc.constantFrom(
      'about:blank',
      'data:text/html,<h1>Test</h1>',
      'http://192.0.2.1:9999' // Non-routable
    );

    const urlsArb = fc.array(urlPatternArb, { minLength: 3, maxLength: 8 });

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
      fc.asyncProperty(urlsArb, async (urls) => {
        const summary = await captureEngine.captureAll(urls, [viewport], options);

        // Should attempt all URLs
        expect(summary.total).toBe(urls.length);
        expect(summary.results.length).toBe(urls.length);

        // Sum of successful and failed should equal total
        expect(summary.successful + summary.failed).toBe(summary.total);

        // Each result should have required fields
        for (const result of summary.results) {
          expect(result.url).toBeDefined();
          expect(result.viewport).toBeDefined();
          expect(result.timestamp).toBeInstanceOf(Date);
          expect(result.metadata).toBeDefined();
        }
      }),
      {
        numRuns: 10,
        timeout: 120000,
      }
    );
  }, 150000);

  it('should continue with remaining viewports after one fails', async () => {
    const viewports: Viewport[] = [
      { width: 375, height: 667, name: 'mobile' },
      { width: 768, height: 1024, name: 'tablet' },
      { width: 1920, height: 1080, name: 'desktop' },
    ];

    const options: CaptureOptions = {
      fullPage: false,
      omitBackground: false,
      timeout: 500,
      waitForNetworkIdle: false,
    };

    // URL that will fail
    const failingUrl = 'http://192.0.2.1:9999';

    const summary = await captureEngine.captureAll([failingUrl], viewports, options);

    // Should have attempted all viewports
    expect(summary.total).toBe(viewports.length);
    expect(summary.results.length).toBe(viewports.length);

    // All should fail for the non-routable URL
    expect(summary.failed).toBe(viewports.length);

    // But all viewports should have been attempted
    for (const viewport of viewports) {
      const result = summary.results.find((r) => r.viewport.name === viewport.name);
      expect(result).toBeDefined();
      expect(result?.success).toBe(false);
      expect(result?.error).toBeDefined();
    }
  });

  it('should handle partial failures in batch captures', async () => {
    const viewports: Viewport[] = [
      { width: 800, height: 600, name: 'test1' },
      { width: 1024, height: 768, name: 'test2' },
    ];

    const urls = [
      'about:blank', // Should succeed
      'http://192.0.2.1:9999', // Should fail
    ];

    const options: CaptureOptions = {
      fullPage: false,
      omitBackground: false,
      timeout: 500,
      waitForNetworkIdle: false,
    };

    const summary = await captureEngine.captureAll(urls, viewports, options);

    // Should have attempted all combinations
    const expectedTotal = urls.length * viewports.length;
    expect(summary.total).toBe(expectedTotal);
    expect(summary.results.length).toBe(expectedTotal);

    // Should have both successes and failures
    expect(summary.successful).toBeGreaterThan(0);
    expect(summary.failed).toBeGreaterThan(0);

    // Verify about:blank succeeded for all viewports
    const successfulResults = summary.results.filter((r) => r.url === 'about:blank');
    expect(successfulResults.length).toBe(viewports.length);
    for (const result of successfulResults) {
      expect(result.success).toBe(true);
    }

    // Verify failing URL failed for all viewports
    const failedResults = summary.results.filter((r) => r.url === 'http://192.0.2.1:9999');
    expect(failedResults.length).toBe(viewports.length);
    for (const result of failedResults) {
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    }
  });
});
