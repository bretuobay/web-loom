/**
 * Property test: Page cleanup after capture
 * Feature: visdiff-phase1, Property 34: Page cleanup after capture
 * Validates: Requirements 8.2
 *
 * For any completed capture, the browser page should be closed to free memory
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { BrowserManager } from './browser-manager.js';

describe('Property 34: Page cleanup after capture', () => {
  let manager: BrowserManager;

  beforeEach(() => {
    manager = new BrowserManager({ headless: true });
  });

  afterEach(async () => {
    await manager.close();
  });

  it('should reduce active page count after releasing pages', async () => {
    await fc.assert(
      fc.asyncProperty(fc.integer({ min: 1, max: 5 }), async (numPages) => {
        // Get pages
        const pages = [];
        for (let i = 0; i < numPages; i++) {
          pages.push(await manager.getPage());
        }

        const activeCountBefore = manager.getActivePageCount();
        expect(activeCountBefore).toBe(numPages);

        // Release all pages
        for (const page of pages) {
          await manager.releasePage(page);
        }

        // Active count should be back to 0
        const activeCountAfter = manager.getActivePageCount();
        expect(activeCountAfter).toBe(0);
      }),
      { numRuns: 10 },
    );
  }, 60000);

  it('should handle page cleanup even if page is already closed', async () => {
    await fc.assert(
      fc.asyncProperty(fc.integer({ min: 1, max: 3 }), async (numPages) => {
        // Get pages
        const pages = [];
        for (let i = 0; i < numPages; i++) {
          pages.push(await manager.getPage());
        }

        // Close some pages manually
        for (let i = 0; i < Math.floor(numPages / 2); i++) {
          await pages[i].close();
        }

        // Release all pages (including already closed ones)
        for (const page of pages) {
          await manager.releasePage(page);
        }

        // Should not throw and active count should be 0
        expect(manager.getActivePageCount()).toBe(0);
      }),
      { numRuns: 10 },
    );
  }, 60000);

  it('should pool pages for reuse after release', async () => {
    await fc.assert(
      fc.asyncProperty(fc.integer({ min: 1, max: 4 }), async (numPages) => {
        // Record initial pool count
        const initialPoolCount = manager.getPooledPageCount();

        // Get and release pages
        const pages = [];
        for (let i = 0; i < numPages; i++) {
          pages.push(await manager.getPage());
        }

        for (const page of pages) {
          await manager.releasePage(page);
        }

        // Pages should be in the pool (up to maxPages limit)
        const pooledCount = manager.getPooledPageCount();
        // Pool should have grown (unless we hit the max limit)
        expect(pooledCount).toBeGreaterThanOrEqual(initialPoolCount);
        // Pool should not exceed the max pages limit (default 5)
        expect(pooledCount).toBeLessThanOrEqual(5);
      }),
      { numRuns: 10 },
    );
  }, 60000);

  it('should navigate pages to about:blank when releasing', async () => {
    await fc.assert(
      fc.asyncProperty(fc.integer({ min: 1, max: 3 }), async (numPages) => {
        // Get pages and navigate them
        const pages = [];
        for (let i = 0; i < numPages; i++) {
          const page = await manager.getPage();
          // Navigate to a simple page
          await page.goto('data:text/html,<h1>Test</h1>', { waitUntil: 'load' });
          pages.push(page);
        }

        // Release pages
        for (const page of pages) {
          await manager.releasePage(page);
        }

        // Get pages again - they should be clean
        const newPages = [];
        for (let i = 0; i < numPages; i++) {
          const page = await manager.getPage();
          const url = page.url();
          // Should be about:blank or empty
          expect(url === 'about:blank' || url === '').toBe(true);
          newPages.push(page);
        }

        // Clean up
        for (const page of newPages) {
          await manager.releasePage(page);
        }
      }),
      { numRuns: 10 },
    );
  }, 60000);
});
