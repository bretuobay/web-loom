/**
 * Property Test: Failure exit code
 * Feature: visdiff-phase1, Property 15: Failure exit code
 * Validates: Requirements 3.8
 * 
 * For any comparison run where at least one comparison fails, the system should return a non-zero exit code
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

describe('Property 15: Failure exit code', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return non-zero exit code when at least one comparison fails', async () => {
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
        fc.float({ min: Math.fround(0.15), max: Math.fround(0.5) }), // Large differences that fail
        fc.integer({ min: 1, max: 10 }), // Number of failures
        async (urls, viewports, difference, numFailures) => {
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
              threshold: 0.1, // 10% threshold - differences will exceed this
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

          // Mock compare engine - some comparisons fail
          const totalComparisons = captureResults.length;
          const actualFailures = Math.min(numFailures, totalComparisons);
          
          const comparisonResults = captureResults.map((_, index) => ({
            identifier: `test-${index}`,
            passed: index >= actualFailures, // First N fail, rest pass
            difference: index < actualFailures ? difference : 0.01, // Failed ones have high difference
            diffImage: index < actualFailures ? Buffer.from('diff-image') : undefined,
            dimensions: { width: 100, height: 100 },
            pixelsDifferent: index < actualFailures ? Math.floor(difference * 10000) : 100,
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

          // Property: When at least one comparison fails, exit code should be non-zero
          expect(exitCode).not.toBe(0);
          expect(exitCode).toBe(1);
        }
      ),
      { numRuns: 100 }
    );
  });
});
