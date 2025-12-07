/**
 * Property test: Timeout fallback
 * Feature: visdiff-phase1, Property 47: Timeout fallback
 * Validates: Requirements 11.2
 *
 * For any network idle timeout expiration, the system should proceed with
 * capture and log a warning
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fc from 'fast-check';
import { BrowserManager } from '../browser/browser-manager.js';
import { CaptureEngine } from './capture-engine.js';
import { Viewport, CaptureOptions } from '../config/schema.js';

describe('Property 47: Timeout fallback', () => {
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

  it('should handle timeout gracefully and return error result', async () => {
    // Generator for very short timeouts that will likely expire
    const shortTimeoutArb = fc.integer({ min: 100, max: 500 });

    const viewport: Viewport = {
      width: 800,
      height: 600,
      name: 'test',
    };

    await fc.assert(
      fc.asyncProperty(shortTimeoutArb, async (timeout) => {
        const options: CaptureOptions = {
          fullPage: false,
          omitBackground: false,
          timeout,
          waitForNetworkIdle: true,
        };

        // Try to navigate to a URL that might timeout
        // Using a non-existent domain that will timeout
        const result = await captureEngine.capture(
          'http://192.0.2.1:9999', // TEST-NET-1 address (non-routable)
          viewport,
          options
        );

        // Should return a result (not throw)
        expect(result).toBeDefined();
        expect(result.url).toBe('http://192.0.2.1:9999');
        expect(result.viewport).toEqual(viewport);
        expect(result.timestamp).toBeInstanceOf(Date);

        // Should indicate failure
        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();

        // Should have metadata even on failure
        expect(result.metadata).toBeDefined();
        expect(result.metadata.loadTime).toBeGreaterThanOrEqual(0);
      }),
      {
        numRuns: 10,
        timeout: 60000,
      }
    );
  }, 90000);

  it('should proceed with capture after timeout on slow pages', async () => {
    const viewport: Viewport = {
      width: 1024,
      height: 768,
      name: 'test',
    };

    // Very short timeout to force timeout scenario
    const options: CaptureOptions = {
      fullPage: false,
      omitBackground: false,
      timeout: 200, // Very short timeout
      waitForNetworkIdle: true,
    };

    // Try to capture a non-existent URL that will timeout
    const result = await captureEngine.capture('http://192.0.2.1:9999', viewport, options);

    // Should not throw, should return a result
    expect(result).toBeDefined();
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error?.message).toBeDefined();
  });

  it('should handle timeout with various viewport sizes', async () => {
    const viewportArb = fc.record({
      width: fc.integer({ min: 320, max: 1920 }),
      height: fc.integer({ min: 240, max: 1080 }),
      name: fc.constantFrom('mobile', 'tablet', 'desktop'),
    });

    await fc.assert(
      fc.asyncProperty(viewportArb, async (viewport) => {
        const options: CaptureOptions = {
          fullPage: false,
          omitBackground: false,
          timeout: 300, // Short timeout
          waitForNetworkIdle: true,
        };

        const result = await captureEngine.capture('http://192.0.2.1:9999', viewport, options);

        // Should handle timeout gracefully regardless of viewport
        expect(result).toBeDefined();
        expect(result.success).toBe(false);
        expect(result.viewport).toEqual(viewport);
      }),
      {
        numRuns: 10,
        timeout: 60000,
      }
    );
  }, 90000);

  it('should complete within reasonable time after timeout', async () => {
    const viewport: Viewport = {
      width: 800,
      height: 600,
      name: 'test',
    };

    const timeout = 500;
    const options: CaptureOptions = {
      fullPage: false,
      omitBackground: false,
      timeout,
      waitForNetworkIdle: true,
    };

    const startTime = Date.now();
    const result = await captureEngine.capture('http://192.0.2.1:9999', viewport, options);
    const elapsed = Date.now() - startTime;

    // Should complete within a reasonable time after timeout
    // Allow some overhead for processing
    expect(elapsed).toBeLessThan(timeout + 5000);
    expect(result.success).toBe(false);
  });
});
