/**
 * Capture Engine for @web-loom/visdiff
 * Handles screenshot capture with viewport management, network idle detection, and custom scripts
 */

import { Page } from 'puppeteer';
import { BrowserManager } from '../browser/browser-manager.js';
import { Viewport, CaptureOptions } from '../config/schema.js';

/**
 * Metadata about a capture operation
 */
export interface CaptureMetadata {
  loadTime: number;
  imageSize: number;
  dimensions: { width: number; height: number };
}

/**
 * Result of a single capture operation
 */
export interface CaptureResult {
  url: string;
  viewport: Viewport;
  image: Buffer;
  timestamp: Date;
  success: boolean;
  error?: Error;
  metadata: CaptureMetadata;
}

/**
 * Summary of a batch capture operation
 */
export interface CaptureSummary {
  total: number;
  successful: number;
  failed: number;
  results: CaptureResult[];
}

/**
 * Manages screenshot capture operations
 */
export class CaptureEngine {
  private browserManager: BrowserManager;
  private maxRetries: number;

  constructor(browserManager: BrowserManager, maxRetries = 2) {
    this.browserManager = browserManager;
    this.maxRetries = maxRetries;
  }

  /**
   * Capture a screenshot for a single URL and viewport
   */
  async capture(url: string, viewport: Viewport, options: CaptureOptions): Promise<CaptureResult> {
    const startTime = Date.now();
    let page: Page | null = null;
    let lastError: Error | null = null;

    // Retry logic with exponential backoff
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        page = await this.browserManager.getPage();

        // Set viewport
        await page.setViewport({
          width: viewport.width,
          height: viewport.height,
          deviceScaleFactor: viewport.deviceScaleFactor || 1,
        });

        // Navigate to URL with timeout
        const navigationOptions: any = {
          timeout: options.timeout,
          waitUntil: options.waitForNetworkIdle ? 'networkidle0' : 'load',
        };

        await page.goto(url, navigationOptions);

        // Wait for custom selector if specified
        if (options.waitForSelector) {
          await page.waitForSelector(options.waitForSelector, {
            timeout: options.timeout,
          });
        }

        // Execute custom script if provided
        if (options.customScript) {
          await page.evaluate(options.customScript);
        }

        // Wait for animation delay if specified
        if (options.animationDelay && options.animationDelay > 0) {
          await new Promise((resolve) => setTimeout(resolve, options.animationDelay));
        }

        // Capture screenshot
        const screenshotOptions: any = {
          type: 'png',
          fullPage: options.fullPage,
          omitBackground: options.omitBackground,
        };

        const image = await page.screenshot(screenshotOptions);
        const imageBuffer = Buffer.from(image);

        // Get image dimensions
        const dimensions = await this.getImageDimensions(page, options.fullPage);

        const loadTime = Date.now() - startTime;

        // Release page back to pool
        await this.browserManager.releasePage(page);

        return {
          url,
          viewport,
          image: imageBuffer,
          timestamp: new Date(),
          success: true,
          metadata: {
            loadTime,
            imageSize: imageBuffer.length,
            dimensions,
          },
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Release page if we got one
        if (page) {
          try {
            await this.browserManager.releasePage(page);
          } catch {
            // Ignore release errors
          }
          page = null;
        }

        // If this is not the last attempt, wait before retrying
        if (attempt < this.maxRetries) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff: 1s, 2s
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    // All retries failed
    return {
      url,
      viewport,
      image: Buffer.alloc(0),
      timestamp: new Date(),
      success: false,
      error: lastError || new Error('Capture failed after all retries'),
      metadata: {
        loadTime: Date.now() - startTime,
        imageSize: 0,
        dimensions: { width: 0, height: 0 },
      },
    };
  }

  /**
   * Get the dimensions of the captured image
   */
  private async getImageDimensions(page: Page, fullPage: boolean): Promise<{ width: number; height: number }> {
    if (fullPage) {
      // For full page, get the entire document dimensions
      const dimensions = await page.evaluate(() => {
        return {
          width: document.documentElement.scrollWidth,
          height: document.documentElement.scrollHeight,
        };
      });
      return dimensions;
    } else {
      // For viewport capture, use viewport dimensions
      const viewport = page.viewport();
      return {
        width: viewport?.width || 0,
        height: viewport?.height || 0,
      };
    }
  }

  /**
   * Capture screenshots for multiple URLs and viewports
   */
  async captureAll(urls: string[], viewports: Viewport[], options: CaptureOptions): Promise<CaptureSummary> {
    const results: CaptureResult[] = [];

    // Generate all combinations of URLs and viewports
    const tasks: Array<{ url: string; viewport: Viewport }> = [];
    for (const url of urls) {
      for (const viewport of viewports) {
        tasks.push({ url, viewport });
      }
    }

    // Capture all screenshots (with error resilience)
    for (const task of tasks) {
      const result = await this.capture(task.url, task.viewport, options);
      results.push(result);
    }

    // Calculate summary
    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    return {
      total: results.length,
      successful,
      failed,
      results,
    };
  }
}
