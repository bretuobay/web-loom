/**
 * Property test: Browser crash recovery
 * Feature: visdiff-phase1, Property 36: Browser crash recovery
 * Validates: Requirements 8.4
 *
 * For any browser crash, the system should detect the failure and restart the browser
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { BrowserManager } from './browser-manager.js';

describe('Property 36: Browser crash recovery', () => {
  let manager: BrowserManager;

  beforeEach(() => {
    manager = new BrowserManager({ headless: true });
  });

  afterEach(async () => {
    await manager.close();
  });

  it(
    'should restart browser after close and allow new operations',
    async () => {
      await fc.assert(
        fc.asyncProperty(fc.integer({ min: 1, max: 3 }), async (numPages) => {
          // Launch and use browser
          await manager.launch();
          const page1 = await manager.getPage();
          await manager.releasePage(page1);

          // Simulate crash by closing
          await manager.close();
          expect(manager.isRunning()).toBe(false);

          // Restart should work
          await manager.restart();
          expect(manager.isRunning()).toBe(true);

          // Should be able to get pages again
          const pages = [];
          for (let i = 0; i < numPages; i++) {
            pages.push(await manager.getPage());
          }

          expect(pages.length).toBe(numPages);

          // Clean up
          for (const page of pages) {
            await manager.releasePage(page);
          }
        }),
        { numRuns: 10 }
      );
    },
    60000
  );

  it(
    'should clear page pool after restart',
    async () => {
      await fc.assert(
        fc.asyncProperty(fc.integer({ min: 1, max: 3 }), async (numPages) => {
          // Get and release pages to populate pool
          const pages = [];
          for (let i = 0; i < numPages; i++) {
            pages.push(await manager.getPage());
          }

          for (const page of pages) {
            await manager.releasePage(page);
          }

          const pooledBefore = manager.getPooledPageCount();
          expect(pooledBefore).toBeGreaterThan(0);

          // Restart
          await manager.restart();

          // Pool should be cleared
          expect(manager.getPooledPageCount()).toBe(0);
          expect(manager.getActivePageCount()).toBe(0);
        }),
        { numRuns: 10 }
      );
    },
    60000
  );

  it(
    'should handle restart when browser is not running',
    async () => {
      await fc.assert(
        fc.asyncProperty(fc.constant(null), async () => {
          // Restart without launching
          await manager.restart();

          // Should be running after restart
          expect(manager.isRunning()).toBe(true);

          // Should be able to get a page
          const page = await manager.getPage();
          expect(page).toBeDefined();
          await manager.releasePage(page);
        }),
        { numRuns: 10 }
      );
    },
    60000
  );

  it(
    'should handle multiple restart calls',
    async () => {
      await fc.assert(
        fc.asyncProperty(fc.integer({ min: 2, max: 4 }), async (numRestarts) => {
          // Launch initially
          await manager.launch();

          // Restart multiple times
          for (let i = 0; i < numRestarts; i++) {
            await manager.restart();
            expect(manager.isRunning()).toBe(true);

            // Should be able to get a page after each restart
            const page = await manager.getPage();
            expect(page).toBeDefined();
            await manager.releasePage(page);
          }
        }),
        { numRuns: 10 }
      );
    },
    60000
  );

  it(
    'should detect disconnection and clear state',
    async () => {
      await fc.assert(
        fc.asyncProperty(fc.integer({ min: 1, max: 3 }), async (numPages) => {
          // Get pages
          const pages = [];
          for (let i = 0; i < numPages; i++) {
            pages.push(await manager.getPage());
          }

          // Release to pool
          for (const page of pages) {
            await manager.releasePage(page);
          }

          expect(manager.getPooledPageCount()).toBeGreaterThan(0);

          // Close browser (simulates crash/disconnect)
          await manager.close();

          // State should be cleared
          expect(manager.isRunning()).toBe(false);
          expect(manager.getPooledPageCount()).toBe(0);
          expect(manager.getActivePageCount()).toBe(0);
        }),
        { numRuns: 10 }
      );
    },
    60000
  );
});
