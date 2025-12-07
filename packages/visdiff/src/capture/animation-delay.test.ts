/**
 * Property test: Animation delay respect
 * Feature: visdiff-phase1, Property 50: Animation delay respect
 * Validates: Requirements 11.5
 *
 * For any configured animation delay, the system should wait for that
 * duration before capturing
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fc from 'fast-check';
import { BrowserManager } from '../browser/browser-manager.js';
import { CaptureEngine } from './capture-engine.js';
import { Viewport, CaptureOptions } from '../config/schema.js';

describe('Property 50: Animation delay respect', () => {
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

  it('should wait for animation delay before capturing', async () => {
    // Generator for animation delays
    const delayArb = fc.integer({ min: 100, max: 1000 });

    const viewport: Viewport = {
      width: 800,
      height: 600,
      name: 'test',
    };

    const htmlContent = `data:text/html,
      <html>
        <head><style>body { margin: 0; }</style></head>
        <body>
          <div>Content</div>
        </body>
      </html>
    `;

    await fc.assert(
      fc.asyncProperty(delayArb, async (animationDelay) => {
        const options: CaptureOptions = {
          fullPage: false,
          omitBackground: false,
          timeout: 10000,
          waitForNetworkIdle: false,
          animationDelay,
        };

        const startTime = Date.now();
        const result = await captureEngine.capture(htmlContent, viewport, options);
        const elapsed = Date.now() - startTime;

        // Should succeed
        expect(result.success).toBe(true);
        expect(result.image.length).toBeGreaterThan(0);

        // Should have waited at least the animation delay
        // Allow some tolerance for processing time
        expect(elapsed).toBeGreaterThanOrEqual(animationDelay * 0.8);
      }),
      {
        numRuns: 10,
        timeout: 60000,
      }
    );
  }, 90000);

  it('should capture immediately when animation delay is 0', async () => {
    const viewport: Viewport = {
      width: 800,
      height: 600,
      name: 'test',
    };

    const htmlContent = `data:text/html,
      <html>
        <head><style>body { margin: 0; }</style></head>
        <body>
          <div>Content</div>
        </body>
      </html>
    `;

    const options: CaptureOptions = {
      fullPage: false,
      omitBackground: false,
      timeout: 10000,
      waitForNetworkIdle: false,
      animationDelay: 0,
    };

    const startTime = Date.now();
    const result = await captureEngine.capture(htmlContent, viewport, options);
    const elapsed = Date.now() - startTime;

    expect(result.success).toBe(true);
    expect(result.image.length).toBeGreaterThan(0);

    // Should be relatively fast (no artificial delay)
    expect(elapsed).toBeLessThan(5000);
  });

  it('should handle various delay durations', async () => {
    const viewport: Viewport = {
      width: 1024,
      height: 768,
      name: 'test',
    };

    const htmlContent = `data:text/html,
      <html>
        <head><style>body { margin: 0; }</style></head>
        <body>
          <div>Test content</div>
        </body>
      </html>
    `;

    const delays = [0, 100, 250, 500, 1000];

    for (const delay of delays) {
      const options: CaptureOptions = {
        fullPage: false,
        omitBackground: false,
        timeout: 10000,
        waitForNetworkIdle: false,
        animationDelay: delay,
      };

      const startTime = Date.now();
      const result = await captureEngine.capture(htmlContent, viewport, options);
      const elapsed = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(result.image.length).toBeGreaterThan(0);

      // Should have waited approximately the delay time
      if (delay > 0) {
        expect(elapsed).toBeGreaterThanOrEqual(delay * 0.8);
      }
    }
  });

  it('should combine animation delay with other options', async () => {
    const viewport: Viewport = {
      width: 800,
      height: 600,
      name: 'test',
    };

    const htmlContent = `data:text/html,
      <html>
        <head><style>
          body { margin: 0; }
        </style></head>
        <body>
          <div>Content ready</div>
        </body>
      </html>
    `;

    const options: CaptureOptions = {
      fullPage: false,
      omitBackground: true,
      timeout: 10000,
      waitForNetworkIdle: false,
      animationDelay: 300,
    };

    const startTime = Date.now();
    const result = await captureEngine.capture(htmlContent, viewport, options);
    const elapsed = Date.now() - startTime;

    expect(result.success).toBe(true);
    expect(result.image.length).toBeGreaterThan(0);

    // Should have waited for the animation delay
    expect(elapsed).toBeGreaterThanOrEqual(250);
  });

  it('should respect animation delay across multiple captures', async () => {
    const viewport: Viewport = {
      width: 800,
      height: 600,
      name: 'test',
    };

    const htmlContent = `data:text/html,
      <html>
        <head><style>body { margin: 0; }</style></head>
        <body>
          <div>Content</div>
        </body>
      </html>
    `;

    const animationDelay = 200;
    const options: CaptureOptions = {
      fullPage: false,
      omitBackground: false,
      timeout: 10000,
      waitForNetworkIdle: false,
      animationDelay,
    };

    // Capture multiple times
    const captures = 3;
    for (let i = 0; i < captures; i++) {
      const startTime = Date.now();
      const result = await captureEngine.capture(htmlContent, viewport, options);
      const elapsed = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(elapsed).toBeGreaterThanOrEqual(animationDelay * 0.8);
    }
  });

  it('should handle animation delay with different viewports', async () => {
    const viewportArb = fc.record({
      width: fc.integer({ min: 320, max: 1920 }),
      height: fc.integer({ min: 240, max: 1080 }),
      name: fc.constantFrom('mobile', 'tablet', 'desktop'),
    });

    const htmlContent = `data:text/html,
      <html>
        <head><style>body { margin: 0; }</style></head>
        <body>
          <div>Content</div>
        </body>
      </html>
    `;

    const animationDelay = 300;

    await fc.assert(
      fc.asyncProperty(viewportArb, async (viewport) => {
        const options: CaptureOptions = {
          fullPage: false,
          omitBackground: false,
          timeout: 10000,
          waitForNetworkIdle: false,
          animationDelay,
        };

        const startTime = Date.now();
        const result = await captureEngine.capture(htmlContent, viewport, options);
        const elapsed = Date.now() - startTime;

        expect(result.success).toBe(true);
        expect(result.viewport).toEqual(viewport);
        expect(elapsed).toBeGreaterThanOrEqual(animationDelay * 0.8);
      }),
      {
        numRuns: 10,
        timeout: 60000,
      }
    );
  }, 90000);
});
