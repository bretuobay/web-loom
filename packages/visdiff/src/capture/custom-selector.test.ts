/**
 * Property test: Custom selector waiting
 * Feature: visdiff-phase1, Property 48: Custom selector waiting
 * Validates: Requirements 11.3
 *
 * For any custom wait selector specified, the system should wait for that
 * selector to appear before capturing
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fc from 'fast-check';
import { BrowserManager } from '../browser/browser-manager.js';
import { CaptureEngine } from './capture-engine.js';
import { Viewport, CaptureOptions } from '../config/schema.js';

describe('Property 48: Custom selector waiting', () => {
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

  it('should wait for custom selector before capturing', async () => {
    // Generator for various CSS selectors
    const selectorArb = fc.constantFrom(
      'h1',
      '#test-id',
      '.test-class',
      'div',
      'body',
      '[data-test]'
    );

    const viewport: Viewport = {
      width: 800,
      height: 600,
      name: 'test',
    };

    await fc.assert(
      fc.asyncProperty(selectorArb, async (selector) => {
        // Create HTML with the selector
        const htmlContent = `data:text/html,
          <html>
            <head><style>body { margin: 0; }</style></head>
            <body>
              <h1 id="test-id" class="test-class" data-test="true">Test Content</h1>
              <div>More content</div>
            </body>
          </html>
        `;

        const options: CaptureOptions = {
          fullPage: false,
          omitBackground: false,
          timeout: 10000,
          waitForNetworkIdle: false,
          waitForSelector: selector,
        };

        const result = await captureEngine.capture(htmlContent, viewport, options);

        // Should succeed when selector exists
        expect(result.success).toBe(true);
        expect(result.image.length).toBeGreaterThan(0);
      }),
      {
        numRuns: 10,
        timeout: 60000,
      }
    );
  }, 90000);

  it('should capture after selector appears', async () => {
    const viewport: Viewport = {
      width: 1024,
      height: 768,
      name: 'test',
    };

    const htmlContent = `data:text/html,
      <html>
        <head><style>body { margin: 0; }</style></head>
        <body>
          <div id="content">Content is ready</div>
        </body>
      </html>
    `;

    const options: CaptureOptions = {
      fullPage: false,
      omitBackground: false,
      timeout: 10000,
      waitForNetworkIdle: false,
      waitForSelector: '#content',
    };

    const result = await captureEngine.capture(htmlContent, viewport, options);

    expect(result.success).toBe(true);
    expect(result.image).toBeInstanceOf(Buffer);
    expect(result.image.length).toBeGreaterThan(0);
  });

  it('should timeout if selector never appears', async () => {
    const viewport: Viewport = {
      width: 800,
      height: 600,
      name: 'test',
    };

    const htmlContent = `data:text/html,
      <html>
        <head><style>body { margin: 0; }</style></head>
        <body>
          <div>No matching selector here</div>
        </body>
      </html>
    `;

    const options: CaptureOptions = {
      fullPage: false,
      omitBackground: false,
      timeout: 500, // Short timeout
      waitForNetworkIdle: false,
      waitForSelector: '#non-existent-selector',
    };

    const result = await captureEngine.capture(htmlContent, viewport, options);

    // Should fail when selector doesn't exist
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should work with various selector types', async () => {
    const viewport: Viewport = {
      width: 800,
      height: 600,
      name: 'test',
    };

    const testCases = [
      { selector: 'h1', html: '<h1>Title</h1>' },
      { selector: '#my-id', html: '<div id="my-id">Content</div>' },
      { selector: '.my-class', html: '<span class="my-class">Text</span>' },
      { selector: '[data-ready]', html: '<div data-ready="true">Ready</div>' },
      { selector: 'button', html: '<button>Click</button>' },
    ];

    for (const testCase of testCases) {
      const htmlContent = `data:text/html,
        <html>
          <head><style>body { margin: 0; }</style></head>
          <body>${testCase.html}</body>
        </html>
      `;

      const options: CaptureOptions = {
        fullPage: false,
        omitBackground: false,
        timeout: 10000,
        waitForNetworkIdle: false,
        waitForSelector: testCase.selector,
      };

      const result = await captureEngine.capture(htmlContent, viewport, options);

      expect(result.success).toBe(true);
      expect(result.image.length).toBeGreaterThan(0);
    }
  });

  it('should handle selector waiting with different viewports', async () => {
    const viewportArb = fc.record({
      width: fc.integer({ min: 320, max: 1920 }),
      height: fc.integer({ min: 240, max: 1080 }),
      name: fc.constantFrom('mobile', 'tablet', 'desktop'),
    });

    const htmlContent = `data:text/html,
      <html>
        <head><style>body { margin: 0; }</style></head>
        <body>
          <div id="ready-marker">Content loaded</div>
        </body>
      </html>
    `;

    await fc.assert(
      fc.asyncProperty(viewportArb, async (viewport) => {
        const options: CaptureOptions = {
          fullPage: false,
          omitBackground: false,
          timeout: 10000,
          waitForNetworkIdle: false,
          waitForSelector: '#ready-marker',
        };

        const result = await captureEngine.capture(htmlContent, viewport, options);

        expect(result.success).toBe(true);
        expect(result.viewport).toEqual(viewport);
        expect(result.image.length).toBeGreaterThan(0);
      }),
      {
        numRuns: 10,
        timeout: 60000,
      }
    );
  }, 90000);

  it('should combine selector waiting with other options', async () => {
    const viewport: Viewport = {
      width: 800,
      height: 600,
      name: 'test',
    };

    const htmlContent = `data:text/html,
      <html>
        <head><style>body { margin: 0; background: white; }</style></head>
        <body>
          <div id="content">Ready</div>
        </body>
      </html>
    `;

    const options: CaptureOptions = {
      fullPage: true,
      omitBackground: true,
      timeout: 10000,
      waitForNetworkIdle: false,
      waitForSelector: '#content',
    };

    const result = await captureEngine.capture(htmlContent, viewport, options);

    expect(result.success).toBe(true);
    expect(result.image.length).toBeGreaterThan(0);
  });
});
