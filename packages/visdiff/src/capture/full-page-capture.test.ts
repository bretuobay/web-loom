/**
 * Property test: Full-page capture height
 * Feature: visdiff-phase1, Property 8: Full-page capture height
 * Validates: Requirements 2.6
 *
 * For any page with content exceeding the viewport height, full-page capture
 * should produce an image taller than the viewport
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fc from 'fast-check';
import { BrowserManager } from '../browser/browser-manager.js';
import { CaptureEngine } from './capture-engine.js';
import { Viewport, CaptureOptions } from '../config/schema.js';

describe('Property 8: Full-page capture height', () => {
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

  it('should capture full page height exceeding viewport', async () => {
    // Generator for viewport heights
    const viewportHeightArb = fc.integer({ min: 400, max: 800 });

    await fc.assert(
      fc.asyncProperty(viewportHeightArb, async (viewportHeight) => {
        const viewport: Viewport = {
          width: 800,
          height: viewportHeight,
          name: 'test',
        };

        // Create a page with content taller than the viewport
        const contentHeight = viewportHeight * 3; // 3x viewport height
        const htmlContent = `data:text/html,
          <html>
            <head><style>body { margin: 0; padding: 0; }</style></head>
            <body>
              <div style="height: ${contentHeight}px; background: linear-gradient(red, blue);"></div>
            </body>
          </html>
        `;

        const fullPageOptions: CaptureOptions = {
          fullPage: true,
          omitBackground: false,
          timeout: 10000,
          waitForNetworkIdle: false,
        };

        const viewportOptions: CaptureOptions = {
          fullPage: false,
          omitBackground: false,
          timeout: 10000,
          waitForNetworkIdle: false,
        };

        // Capture full page
        const fullPageResult = await captureEngine.capture(htmlContent, viewport, fullPageOptions);

        // Capture viewport only
        const viewportResult = await captureEngine.capture(htmlContent, viewport, viewportOptions);

        // Both should succeed
        expect(fullPageResult.success).toBe(true);
        expect(viewportResult.success).toBe(true);

        // Full page capture should have greater height than viewport
        expect(fullPageResult.metadata.dimensions.height).toBeGreaterThan(viewportHeight);

        // Viewport capture should match viewport height
        expect(viewportResult.metadata.dimensions.height).toBe(viewportHeight);

        // Full page should be approximately the content height
        expect(fullPageResult.metadata.dimensions.height).toBeGreaterThanOrEqual(contentHeight * 0.9);
      }),
      {
        numRuns: 10,
        timeout: 120000,
      },
    );
  }, 150000);

  it('should capture entire page content when fullPage is true', async () => {
    const viewport: Viewport = {
      width: 800,
      height: 600,
      name: 'test',
    };

    // Create a tall page
    const htmlContent = `data:text/html,
      <html>
        <head><style>body { margin: 0; padding: 0; }</style></head>
        <body>
          <div style="height: 2000px; background: linear-gradient(to bottom, red, yellow, green, blue);"></div>
        </body>
      </html>
    `;

    const options: CaptureOptions = {
      fullPage: true,
      omitBackground: false,
      timeout: 10000,
      waitForNetworkIdle: false,
    };

    const result = await captureEngine.capture(htmlContent, viewport, options);

    expect(result.success).toBe(true);
    expect(result.metadata.dimensions.height).toBeGreaterThan(viewport.height);
    expect(result.metadata.dimensions.height).toBeGreaterThanOrEqual(1800); // Close to 2000px
  });

  it('should handle various content heights', async () => {
    const contentHeightArb = fc.integer({ min: 1000, max: 5000 });

    const viewport: Viewport = {
      width: 1024,
      height: 768,
      name: 'test',
    };

    await fc.assert(
      fc.asyncProperty(contentHeightArb, async (contentHeight) => {
        const htmlContent = `data:text/html,
          <html>
            <head><style>body { margin: 0; padding: 0; }</style></head>
            <body>
              <div style="height: ${contentHeight}px; background: blue;"></div>
            </body>
          </html>
        `;

        const options: CaptureOptions = {
          fullPage: true,
          omitBackground: false,
          timeout: 10000,
          waitForNetworkIdle: false,
        };

        const result = await captureEngine.capture(htmlContent, viewport, options);

        expect(result.success).toBe(true);
        expect(result.metadata.dimensions.height).toBeGreaterThan(viewport.height);
        // Allow some tolerance for browser rendering
        expect(result.metadata.dimensions.height).toBeGreaterThanOrEqual(contentHeight * 0.9);
      }),
      {
        numRuns: 10,
        timeout: 120000,
      },
    );
  }, 150000);

  it('should maintain width while capturing full height', async () => {
    const viewport: Viewport = {
      width: 1200,
      height: 800,
      name: 'test',
    };

    const htmlContent = `data:text/html,
      <html>
        <head><style>body { margin: 0; padding: 0; }</style></head>
        <body>
          <div style="height: 3000px; width: 100%; background: green;"></div>
        </body>
      </html>
    `;

    const options: CaptureOptions = {
      fullPage: true,
      omitBackground: false,
      timeout: 10000,
      waitForNetworkIdle: false,
    };

    const result = await captureEngine.capture(htmlContent, viewport, options);

    expect(result.success).toBe(true);
    expect(result.metadata.dimensions.width).toBe(viewport.width);
    expect(result.metadata.dimensions.height).toBeGreaterThan(viewport.height);
  });

  it('should handle pages with dynamic content height', async () => {
    const viewport: Viewport = {
      width: 800,
      height: 600,
      name: 'test',
    };

    // Page with multiple sections
    const htmlContent = `data:text/html,
      <html>
        <head><style>
          body { margin: 0; padding: 0; }
          .section { height: 500px; }
        </style></head>
        <body>
          <div class="section" style="background: red;"></div>
          <div class="section" style="background: green;"></div>
          <div class="section" style="background: blue;"></div>
          <div class="section" style="background: yellow;"></div>
        </body>
      </html>
    `;

    const options: CaptureOptions = {
      fullPage: true,
      omitBackground: false,
      timeout: 10000,
      waitForNetworkIdle: false,
    };

    const result = await captureEngine.capture(htmlContent, viewport, options);

    expect(result.success).toBe(true);
    // Should capture all 4 sections (4 * 500px = 2000px)
    expect(result.metadata.dimensions.height).toBeGreaterThanOrEqual(1800);
    expect(result.metadata.dimensions.height).toBeGreaterThan(viewport.height);
  });
});
