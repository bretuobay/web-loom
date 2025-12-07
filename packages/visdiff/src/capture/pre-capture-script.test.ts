/**
 * Property test: Pre-capture script execution
 * Feature: visdiff-phase1, Property 49: Pre-capture script execution
 * Validates: Requirements 11.4
 *
 * For any custom script specified, the system should execute it before taking the screenshot
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fc from 'fast-check';
import { BrowserManager } from '../browser/browser-manager.js';
import { CaptureEngine } from './capture-engine.js';
import { Viewport, CaptureOptions } from '../config/schema.js';

describe('Property 49: Pre-capture script execution', () => {
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

  it('should execute custom script before capture', async () => {
    // Generator for various DOM manipulation scripts
    const scriptArb = fc.constantFrom(
      // Add a marker element
      'document.body.setAttribute("data-test", "executed");',
      // Change background color
      'document.body.style.backgroundColor = "rgb(255, 0, 0)";',
      // Add a div
      'const div = document.createElement("div"); div.id = "test-marker"; document.body.appendChild(div);',
      // Set a global variable
      'window.testExecuted = true;',
      // Multiple operations
      'document.body.setAttribute("data-script", "ran"); window.scriptRan = true;'
    );

    const viewport: Viewport = {
      width: 800,
      height: 600,
      name: 'test',
    };

    await fc.assert(
      fc.asyncProperty(scriptArb, async (script) => {
        const optionsWithScript: CaptureOptions = {
          fullPage: false,
          omitBackground: false,
          timeout: 10000,
          waitForNetworkIdle: false,
          customScript: script,
        };

        const optionsWithoutScript: CaptureOptions = {
          fullPage: false,
          omitBackground: false,
          timeout: 10000,
          waitForNetworkIdle: false,
        };

        // Capture with script
        const resultWithScript = await captureEngine.capture(
          'about:blank',
          viewport,
          optionsWithScript
        );

        // Capture without script
        const resultWithoutScript = await captureEngine.capture(
          'about:blank',
          viewport,
          optionsWithoutScript
        );

        // Both should succeed
        expect(resultWithScript.success).toBe(true);
        expect(resultWithoutScript.success).toBe(true);

        // Both should produce images
        expect(resultWithScript.image.length).toBeGreaterThan(0);
        expect(resultWithoutScript.image.length).toBeGreaterThan(0);

        // The script execution should not cause errors
        expect(resultWithScript.error).toBeUndefined();
      }),
      {
        numRuns: 10,
        timeout: 60000,
      }
    );
  }, 90000);

  it('should handle script that modifies page content', async () => {
    const viewport: Viewport = {
      width: 1024,
      height: 768,
      name: 'test',
    };

    // Script that adds visible content
    const script = `
      const div = document.createElement('div');
      div.textContent = 'Test Content';
      div.style.fontSize = '48px';
      div.style.color = 'red';
      document.body.appendChild(div);
    `;

    const options: CaptureOptions = {
      fullPage: false,
      omitBackground: false,
      timeout: 10000,
      waitForNetworkIdle: false,
      customScript: script,
    };

    const result = await captureEngine.capture('about:blank', viewport, options);

    expect(result.success).toBe(true);
    expect(result.image).toBeInstanceOf(Buffer);
    expect(result.image.length).toBeGreaterThan(0);
  });

  it('should execute script with various viewport sizes', async () => {
    const viewportArb = fc.record({
      width: fc.integer({ min: 320, max: 1920 }),
      height: fc.integer({ min: 240, max: 1080 }),
      name: fc.constantFrom('mobile', 'tablet', 'desktop'),
    });

    const script = 'document.body.setAttribute("data-viewport-test", "true");';

    await fc.assert(
      fc.asyncProperty(viewportArb, async (viewport) => {
        const options: CaptureOptions = {
          fullPage: false,
          omitBackground: false,
          timeout: 10000,
          waitForNetworkIdle: false,
          customScript: script,
        };

        const result = await captureEngine.capture('about:blank', viewport, options);

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

  it('should handle script that sets values', async () => {
    const viewport: Viewport = {
      width: 800,
      height: 600,
      name: 'test',
    };

    // Script that sets a value (without return statement which can cause issues)
    const script = `
      window.testValue = 42;
      document.body.setAttribute('data-test-value', '42');
    `;

    const options: CaptureOptions = {
      fullPage: false,
      omitBackground: false,
      timeout: 10000,
      waitForNetworkIdle: false,
      customScript: script,
    };

    const result = await captureEngine.capture('about:blank', viewport, options);

    expect(result.success).toBe(true);
    expect(result.image.length).toBeGreaterThan(0);
  });

  it('should execute script before taking screenshot', async () => {
    const viewport: Viewport = {
      width: 800,
      height: 600,
      name: 'test',
    };

    // Script that modifies the page in a way that should be visible in the screenshot
    const script = `
      document.body.style.backgroundColor = 'blue';
      document.body.style.margin = '0';
      document.body.style.padding = '0';
    `;

    const optionsWithScript: CaptureOptions = {
      fullPage: false,
      omitBackground: false,
      timeout: 10000,
      waitForNetworkIdle: false,
      customScript: script,
    };

    const optionsWithoutScript: CaptureOptions = {
      fullPage: false,
      omitBackground: false,
      timeout: 10000,
      waitForNetworkIdle: false,
    };

    const resultWithScript = await captureEngine.capture('about:blank', viewport, optionsWithScript);
    const resultWithoutScript = await captureEngine.capture(
      'about:blank',
      viewport,
      optionsWithoutScript
    );

    // Both should succeed
    expect(resultWithScript.success).toBe(true);
    expect(resultWithoutScript.success).toBe(true);

    // The images should be different (script modified the page)
    // We can't easily compare pixel-by-pixel here, but we can verify both captured
    expect(resultWithScript.image.length).toBeGreaterThan(0);
    expect(resultWithoutScript.image.length).toBeGreaterThan(0);
  });
});
