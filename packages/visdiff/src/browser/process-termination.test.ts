/**
 * Property test: Process termination on exit
 * Feature: visdiff-phase1, Property 35: Process termination on exit
 * Validates: Requirements 8.3
 *
 * For any system exit, all browser processes should be terminated
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { BrowserManager } from './browser-manager.js';

describe('Property 35: Process termination on exit', () => {
  it('should terminate browser process when close is called', async () => {
    await fc.assert(
      fc.asyncProperty(fc.integer({ min: 0, max: 3 }), async (numPages) => {
        const manager = new BrowserManager({ headless: true });

        // Launch browser and get some pages
        await manager.launch();
        expect(manager.isRunning()).toBe(true);

        const pages = [];
        for (let i = 0; i < numPages; i++) {
          pages.push(await manager.getPage());
        }

        // Close the manager
        await manager.close();

        // Browser should no longer be running
        expect(manager.isRunning()).toBe(false);

        // Active and pooled page counts should be 0
        expect(manager.getActivePageCount()).toBe(0);
        expect(manager.getPooledPageCount()).toBe(0);
      }),
      { numRuns: 10 },
    );
  }, 60000);

  it('should handle close when browser is not running', async () => {
    await fc.assert(
      fc.asyncProperty(fc.constant(null), async () => {
        const manager = new BrowserManager({ headless: true });

        // Close without launching
        await manager.close();

        // Should not throw and browser should not be running
        expect(manager.isRunning()).toBe(false);
      }),
      { numRuns: 10 },
    );
  }, 60000);

  it('should close all pooled pages when closing browser', async () => {
    await fc.assert(
      fc.asyncProperty(fc.integer({ min: 1, max: 4 }), async (numPages) => {
        const manager = new BrowserManager({ headless: true });

        // Get and release pages to populate the pool
        const pages = [];
        for (let i = 0; i < numPages; i++) {
          pages.push(await manager.getPage());
        }

        for (const page of pages) {
          await manager.releasePage(page);
        }

        const pooledCountBefore = manager.getPooledPageCount();
        expect(pooledCountBefore).toBeGreaterThan(0);

        // Close the manager
        await manager.close();

        // Pool should be empty
        expect(manager.getPooledPageCount()).toBe(0);
      }),
      { numRuns: 10 },
    );
  }, 60000);

  it('should allow multiple close calls without error', async () => {
    await fc.assert(
      fc.asyncProperty(fc.integer({ min: 2, max: 5 }), async (numCloseCalls) => {
        const manager = new BrowserManager({ headless: true });

        // Launch browser
        await manager.launch();
        expect(manager.isRunning()).toBe(true);

        // Call close multiple times
        for (let i = 0; i < numCloseCalls; i++) {
          await manager.close();
          expect(manager.isRunning()).toBe(false);
        }

        // Should not throw
      }),
      { numRuns: 10 },
    );
  }, 60000);

  it('should terminate browser even with active pages', async () => {
    await fc.assert(
      fc.asyncProperty(fc.integer({ min: 1, max: 3 }), async (numPages) => {
        const manager = new BrowserManager({ headless: true });

        // Get pages but don't release them
        const pages = [];
        for (let i = 0; i < numPages; i++) {
          pages.push(await manager.getPage());
        }

        expect(manager.getActivePageCount()).toBe(numPages);

        // Close the manager with active pages
        await manager.close();

        // Browser should be terminated
        expect(manager.isRunning()).toBe(false);
        expect(manager.getActivePageCount()).toBe(0);
      }),
      { numRuns: 10 },
    );
  }, 60000);
});
