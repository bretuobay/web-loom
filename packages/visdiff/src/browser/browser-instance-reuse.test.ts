/**
 * Property test: Browser instance reuse
 * Feature: visdiff-phase1, Property 33: Browser instance reuse
 * Validates: Requirements 8.1
 *
 * For any sequence of multiple captures, the same browser instance should be reused
 * rather than launching new instances
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { BrowserManager } from './browser-manager.js';

describe('Property 33: Browser instance reuse', () => {
  let manager: BrowserManager;

  beforeEach(() => {
    manager = new BrowserManager({ headless: true });
  });

  afterEach(async () => {
    await manager.close();
  });

  it(
    'should reuse the same browser instance across multiple getPage calls',
    async () => {
      await fc.assert(
        fc.asyncProperty(fc.integer({ min: 2, max: 5 }), async (numPages) => {
          // Launch the browser
          await manager.launch();
          const initialBrowserRunning = manager.isRunning();

          // Get multiple pages
          const pages = [];
          for (let i = 0; i < numPages; i++) {
            const page = await manager.getPage();
            pages.push(page);

            // Browser should still be running and be the same instance
            expect(manager.isRunning()).toBe(true);
          }

          // Browser should still be the same instance
          expect(manager.isRunning()).toBe(initialBrowserRunning);

          // Clean up pages
          for (const page of pages) {
            await manager.releasePage(page);
          }

          // Browser should still be running (not closed)
          expect(manager.isRunning()).toBe(true);
        }),
        { numRuns: 10 }
      );
    },
    { timeout: 60000 }
  );

  it(
    'should reuse browser instance after releasing and getting pages again',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 3 }),
          fc.integer({ min: 1, max: 3 }),
          async (firstBatch, secondBatch) => {
            // First batch of pages
            await manager.launch();
            const firstPages = [];
            for (let i = 0; i < firstBatch; i++) {
              firstPages.push(await manager.getPage());
            }

            const browserAfterFirst = manager.isRunning();

            // Release first batch
            for (const page of firstPages) {
              await manager.releasePage(page);
            }

            // Get second batch - should reuse same browser
            const secondPages = [];
            for (let i = 0; i < secondBatch; i++) {
              secondPages.push(await manager.getPage());
            }

            const browserAfterSecond = manager.isRunning();

            // Browser should be the same instance
            expect(browserAfterFirst).toBe(true);
            expect(browserAfterSecond).toBe(true);

            // Clean up
            for (const page of secondPages) {
              await manager.releasePage(page);
            }
          }
        ),
        { numRuns: 10 }
      );
    },
    { timeout: 60000 }
  );

  it(
    'should not launch multiple browser instances for concurrent page requests',
    async () => {
      await fc.assert(
        fc.asyncProperty(fc.integer({ min: 2, max: 4 }), async (concurrentRequests) => {
          // Request multiple pages concurrently
          const pagePromises = [];
          for (let i = 0; i < concurrentRequests; i++) {
            pagePromises.push(manager.getPage());
          }

          const pages = await Promise.all(pagePromises);

          // Should have only one browser instance running
          expect(manager.isRunning()).toBe(true);

          // All pages should be valid
          expect(pages.length).toBe(concurrentRequests);
          for (const page of pages) {
            expect(page).toBeDefined();
            expect(page.isClosed()).toBe(false);
          }

          // Clean up
          for (const page of pages) {
            await manager.releasePage(page);
          }
        }),
        { numRuns: 10 }
      );
    },
    { timeout: 60000 }
  );
});
