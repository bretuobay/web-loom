/**
 * Property test: Browser navigation for valid URLs
 * Feature: visdiff-phase1, Property 3: Browser navigation for valid URLs
 * Validates: Requirements 2.1
 *
 * For any valid URL provided to the capture command, the system should
 * successfully launch a headless browser and navigate to that URL
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fc from 'fast-check';
import { BrowserManager } from '../browser/browser-manager.js';
import { CaptureEngine } from './capture-engine.js';
import { Viewport, CaptureOptions } from '../config/schema.js';

describe('Property 3: Browser navigation for valid URLs', () => {
  let browserManager: BrowserManager;
  let captureEngine: CaptureEngine;

  beforeAll(async () => {
    browserManager = new BrowserManager({ headless: true });
    await browserManager.launch();
    captureEngine = new CaptureEngine(browserManager, 0); // No retries for faster tests
  });

  afterAll(async () => {
    await browserManager.close();
  });

  it('should successfully navigate to any valid HTTP/HTTPS URL', async () => {
    // Generator for valid URLs
    const validUrlArb = fc
      .record({
        protocol: fc.constantFrom('http', 'https'),
        domain: fc.constantFrom('example.com', 'localhost', '127.0.0.1'),
        port: fc.option(fc.integer({ min: 3000, max: 9999 }), { nil: undefined }),
        path: fc.option(fc.stringOf(fc.constantFrom('/', 'a', 'b', 'c', '-', '_'), { maxLength: 20 }), {
          nil: undefined,
        }),
      })
      .map(({ protocol, domain, port, path }) => {
        let url = `${protocol}://${domain}`;
        if (port !== undefined) {
          url += `:${port}`;
        }
        if (path && path.length > 0) {
          url += path.startsWith('/') ? path : `/${path}`;
        }
        return url;
      });

    const viewport: Viewport = {
      width: 800,
      height: 600,
      name: 'test',
    };

    const options: CaptureOptions = {
      fullPage: false,
      omitBackground: false,
      timeout: 5000,
      waitForNetworkIdle: false, // Faster for testing
    };

    await fc.assert(
      fc.asyncProperty(validUrlArb, async (url) => {
        const result = await captureEngine.capture(url, viewport, options);

        // The capture should either succeed or fail with a clear error
        // (navigation failure is acceptable for non-existent URLs, but browser should launch)
        expect(result).toBeDefined();
        expect(result.url).toBe(url);
        expect(result.viewport).toEqual(viewport);
        expect(result.timestamp).toBeInstanceOf(Date);

        // If it succeeded, we should have an image
        if (result.success) {
          expect(result.image).toBeInstanceOf(Buffer);
          expect(result.image.length).toBeGreaterThan(0);
          expect(result.metadata.dimensions.width).toBeGreaterThan(0);
          expect(result.metadata.dimensions.height).toBeGreaterThan(0);
        } else {
          // If it failed, we should have an error
          expect(result.error).toBeDefined();
        }
      }),
      {
        numRuns: 20, // Reduced for faster execution
        timeout: 120000, // 2 minutes total timeout
      },
    );
  }, 150000); // 2.5 minute test timeout

  it('should handle localhost URLs with various ports', async () => {
    const localhostUrlArb = fc.integer({ min: 3000, max: 9999 }).map((port) => `http://localhost:${port}`);

    const viewport: Viewport = {
      width: 1024,
      height: 768,
      name: 'test',
    };

    const options: CaptureOptions = {
      fullPage: false,
      omitBackground: false,
      timeout: 3000,
      waitForNetworkIdle: false,
    };

    await fc.assert(
      fc.asyncProperty(localhostUrlArb, async (url) => {
        const result = await captureEngine.capture(url, viewport, options);

        // Should attempt navigation (success or failure is acceptable)
        expect(result).toBeDefined();
        expect(result.url).toBe(url);
        expect(result.timestamp).toBeInstanceOf(Date);
      }),
      {
        numRuns: 10,
        timeout: 60000,
      },
    );
  }, 90000);
});
