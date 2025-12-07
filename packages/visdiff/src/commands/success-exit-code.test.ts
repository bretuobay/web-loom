/**
 * Property Test: Success exit code
 * Feature: visdiff-phase1, Property 14: Success exit code
 * Validates: Requirements 3.7
 * 
 * For any comparison run where all comparisons pass, the system should return exit code 0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { compareCommand } from './compare.js';
import * as configLoader from '../config/loader.js';
import { BrowserManager } from '../browser/browser-manager.js';
import { CaptureEngine } from '../capture/capture-engine.js';
import { CompareEngine } from '../compare/compare-engine.js';
import { StorageManager } from '../storage/storage-manager.js';

// Mock all dependencies
vi.mock('../config/loader.js');
vi.mock('../browser/browser-manager.js');
vi.mock('../capture/capture-engine.js');
vi.mock('../compare/compare-engine.js');
vi.mock('../storage/storage-manager.js');

describe('Property 14: Success exit code', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return exit code 0 when all comparisons pass', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.webUrl(), { minLength: 1, maxLength: 5 }),
        fc.array(
          fc.record({
            width: fc.integer({ min: 320, max: 1920 }),
            height: fc.integer({ min: 480, max: 1080 }),
            name: fc.constantFrom('mobile', 'tablet', 'desktop'),
          }),
          { minLength: 1, maxLength: 3 }
        ),
        fc.float({ min: 0, max: Math.fround(0.05) }), // Small differences that pass
        async (urls, viewports, difference) => {
          // Mock configuration
          vi.mocked(configLoader.loadConfig).mockResolvedValue({
            viewports,
            paths: urls,
            captureOptions: {
              fullPage: true,
              omitBackground: false,
              timeout: 30000,
              waitForNetworkIdle: true,
              animationDelay: 0,
            },
            diffOptions: {
              threshold: 0.1, // 10% threshold - differences will be below this
              ignoreAntialiasing: true,
              ignoreColors: false,
              highlightColor: '#ff00ff',
            },
            storage: {
              baselineDir: '.visdiff/baselines',
              diffDir: '.visdiff/diffs',
              format: 'png',
            },
          });

          // Mock browser manager
          const mockBrowserManager = {
            launch: vi.fn().mockResolvedValue(undefined),
            close: vi.fn().mockResolvedValue(undefined),
          };
          vi.mocked(BrowserManager).mockImplementation(() => mockBrowserManager as any);

          // Mock capture engine - all captures succeed
          const captureResults = urls.flatMap(url =>
            viewports.map(viewport => ({
              url,
              viewport,
              image: Buffer.from('mock-image'),
              timestamp: new Date(),
              success: true,
              metadata: {
                loadTime: 1000,
                imageSize: 1024,
                dimensions: { width: viewport.width, height: viewport.height },
              },
            }))
          );

          const mockCaptureEngine = {
            captureAll: vi.fn().mockResolvedValue({
              total: captureResults.length,
              successful: captureResults.length,
              failed: 0,
              results: captureResults,
            }),
          };
          vi.mocked(CaptureEngine).mockImplementation(() => mockCaptureEngine as any);

          // Mock compare engine - all comparisons pass
          const comparisonResults = captureResults.map((_, index) => ({
            identifier: `test-${index}`,
            passed: true, // All pass
            difference, // Below threshold
            dimensions: { width: 100, height: 100 },
            pixelsDifferent: Math.floor(difference * 10000),
          }));

          const mockCompareEngine = {
            compareAll: vi.fn().mockResolvedValue(comparisonResults),
          };
          vi.mocked(CompareEngine).mockImplementation(() => mockCompareEngine as any);

          // Mock storage manager
          const mockStorage = {
            initialize: vi.fn().mockResolvedValue(undefined),
            loadBaseline: vi.fn().mockResolvedValue(Buffer.from('baseline')),
            saveReport: vi.fn().mockResolvedValue(undefined),
            saveDiff: vi.fn().mockResolvedValue(undefined),
          };
          vi.mocked(StorageManager).mockImplementation(() => mockStorage as any);

          // Execute compare command
          const exitCode = await compareCommand([], {});

          // Property: When all comparisons pass, exit code should be 0
          expect(exitCode).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});
