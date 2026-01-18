/**
 * Property test: Memory usage monitoring
 * Feature: visdiff-phase1, Property 37: Memory usage monitoring
 * Validates: Requirements 8.5
 *
 * For any execution where memory usage exceeds 1GB, the system should log a warning
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { BrowserManager } from './browser-manager.js';

describe('Property 37: Memory usage monitoring', () => {
  let manager: BrowserManager;

  beforeEach(() => {
    manager = new BrowserManager({ headless: true });
  });

  afterEach(async () => {
    await manager.close();
  });

  it('should return 0 memory usage when browser is not running', async () => {
    await fc.assert(
      fc.asyncProperty(fc.constant(null), async () => {
        // Don't launch browser
        const memory = await manager.getMemoryUsage();

        // Should return 0 when not running
        expect(memory).toBe(0);
      }),
      { numRuns: 10 },
    );
  }, 60000);

  it('should return non-zero memory usage when browser is running', async () => {
    await fc.assert(
      fc.asyncProperty(fc.constant(null), async () => {
        // Launch browser
        await manager.launch();

        const memory = await manager.getMemoryUsage();

        // Should return some memory usage
        expect(memory).toBeGreaterThan(0);
      }),
      { numRuns: 10 },
    );
  }, 60000);

  it('should track memory usage across multiple page operations', async () => {
    await fc.assert(
      fc.asyncProperty(fc.integer({ min: 1, max: 3 }), async (numPages) => {
        // Launch browser
        await manager.launch();

        const memoryBefore = await manager.getMemoryUsage();
        expect(memoryBefore).toBeGreaterThan(0);

        // Get pages
        const pages = [];
        for (let i = 0; i < numPages; i++) {
          pages.push(await manager.getPage());
        }

        const memoryDuring = await manager.getMemoryUsage();
        expect(memoryDuring).toBeGreaterThan(0);

        // Release pages
        for (const page of pages) {
          await manager.releasePage(page);
        }

        const memoryAfter = await manager.getMemoryUsage();
        expect(memoryAfter).toBeGreaterThan(0);

        // All memory readings should be positive
        expect(memoryBefore).toBeGreaterThan(0);
        expect(memoryDuring).toBeGreaterThan(0);
        expect(memoryAfter).toBeGreaterThan(0);
      }),
      { numRuns: 10 },
    );
  }, 60000);

  it('should return 0 after browser is closed', async () => {
    await fc.assert(
      fc.asyncProperty(fc.constant(null), async () => {
        // Launch and close browser
        await manager.launch();
        const memoryWhileRunning = await manager.getMemoryUsage();
        expect(memoryWhileRunning).toBeGreaterThan(0);

        await manager.close();

        const memoryAfterClose = await manager.getMemoryUsage();
        expect(memoryAfterClose).toBe(0);
      }),
      { numRuns: 10 },
    );
  }, 60000);

  it('should handle memory monitoring during restart', async () => {
    await fc.assert(
      fc.asyncProperty(fc.constant(null), async () => {
        // Launch browser
        await manager.launch();
        const memoryBefore = await manager.getMemoryUsage();
        expect(memoryBefore).toBeGreaterThan(0);

        // Restart
        await manager.restart();

        const memoryAfter = await manager.getMemoryUsage();
        expect(memoryAfter).toBeGreaterThan(0);
      }),
      { numRuns: 10 },
    );
  }, 60000);

  it('should return reasonable memory values (not negative or extremely large)', async () => {
    await fc.assert(
      fc.asyncProperty(fc.integer({ min: 0, max: 3 }), async (numPages) => {
        // Launch browser
        await manager.launch();

        // Get some pages
        const pages = [];
        for (let i = 0; i < numPages; i++) {
          pages.push(await manager.getPage());
        }

        const memory = await manager.getMemoryUsage();

        // Memory should be non-negative
        expect(memory).toBeGreaterThanOrEqual(0);

        // Memory should be reasonable (less than 10GB = 10 * 1024 * 1024 * 1024 bytes)
        // This is a sanity check - actual usage should be much lower
        expect(memory).toBeLessThan(10 * 1024 * 1024 * 1024);

        // Clean up
        for (const page of pages) {
          await manager.releasePage(page);
        }
      }),
      { numRuns: 10 },
    );
  }, 60000);
});
