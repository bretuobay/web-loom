/**
 * Property test for status count accuracy
 * Feature: visdiff-phase1, Property 30: Status count accuracy
 * Validates: Requirements 7.2
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { StorageManager } from '../storage/storage-manager.js';
import { statusCommand } from './status.js';
import type { ComparisonResult } from '../types';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

describe('Property 30: Status count accuracy', () => {
  let baseTempDir: string;

  beforeEach(async () => {
    baseTempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'visdiff-test-'));
  });

  afterEach(async () => {
    await fs.rm(baseTempDir, { recursive: true, force: true });
  });

  // Helper to create a unique test directory with config
  async function createTestEnvironment(): Promise<{ dir: string; manager: StorageManager }> {
    const uniqueDir = await fs.mkdtemp(path.join(baseTempDir, 'iter-'));
    
    // Create config file
    const configPath = path.join(uniqueDir, 'visdiff.config.js');
    await fs.writeFile(
      configPath,
      `export default {
        viewports: [{ width: 1920, height: 1080, name: 'desktop' }],
        paths: ['http://localhost:3000'],
        captureOptions: { fullPage: false, omitBackground: false, timeout: 30000 },
        diffOptions: { threshold: 0.01, ignoreAntialiasing: true, ignoreColors: false, highlightColor: '#ff00ff' },
        storage: { baselineDir: '.visdiff/baselines', diffDir: '.visdiff/diffs', format: 'png' }
      };`
    );

    const manager = new StorageManager(uniqueDir);
    await manager.initialize();
    
    return { dir: uniqueDir, manager };
  }

  // Arbitrary for generating comparison results with controlled pass/fail/error states
  // We need to ensure logical consistency:
  // - If error exists, passed should be false
  // - If passed is true, error should be undefined
  const comparisonResultArbitrary = fc.oneof(
    // Case 1: Passed comparison (no error)
    fc.record({
      identifier: fc.stringMatching(/^[a-z][a-z0-9-]{0,20}$/),
      passed: fc.constant(true),
      difference: fc.double({ min: 0, max: 0.01, noNaN: true }), // Low difference for passed
      dimensions: fc.record({
        width: fc.integer({ min: 100, max: 3840 }),
        height: fc.integer({ min: 100, max: 2160 }),
      }),
      pixelsDifferent: fc.integer({ min: 0, max: 1000 }),
      error: fc.constant(undefined),
    }),
    // Case 2: Failed comparison (no error, just threshold exceeded)
    fc.record({
      identifier: fc.stringMatching(/^[a-z][a-z0-9-]{0,20}$/),
      passed: fc.constant(false),
      difference: fc.double({ min: 0.01, max: 1, noNaN: true }), // High difference for failed
      dimensions: fc.record({
        width: fc.integer({ min: 100, max: 3840 }),
        height: fc.integer({ min: 100, max: 2160 }),
      }),
      pixelsDifferent: fc.integer({ min: 1000, max: 1000000 }),
      error: fc.constant(undefined),
    }),
    // Case 3: Error case (missing baseline, etc.)
    fc.record({
      identifier: fc.stringMatching(/^[a-z][a-z0-9-]{0,20}$/),
      passed: fc.constant(false),
      difference: fc.constant(0),
      dimensions: fc.record({
        width: fc.integer({ min: 100, max: 3840 }),
        height: fc.integer({ min: 100, max: 2160 }),
      }),
      pixelsDifferent: fc.constant(0),
      error: fc.record({
        message: fc.constantFrom('Baseline not found', 'Image decode error', 'Dimension mismatch'),
      }),
    })
  );

  it('should display counts matching the latest comparison results', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(comparisonResultArbitrary, { minLength: 1, maxLength: 50 }),
        fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') }),
        async (results, timestamp) => {
          const { dir, manager } = await createTestEnvironment();
          
          // Save a report with the generated results
          await manager.saveReport(results, timestamp);

          // Calculate expected counts
          const expectedTotal = results.length;
          const expectedPassed = results.filter(r => r.passed).length;
          const expectedFailed = results.filter(r => !r.passed && !r.error).length;
          const expectedNew = results.filter(r => r.error).length;

          // Change to test directory and run status command
          const originalCwd = process.cwd();
          process.chdir(dir);

          try {
            // Capture console output
            const originalLog = console.log;
            let jsonOutput = '';
            console.log = (msg: string) => {
              jsonOutput = msg;
            };

            const exitCode = await statusCommand({ json: true });

            // Restore console.log
            console.log = originalLog;

            // Verify exit code
            expect(exitCode).toBe(0);

            // Parse JSON output
            const output = JSON.parse(jsonOutput);

            // Verify the counts match exactly
            expect(output.summary.total).toBe(expectedTotal);
            expect(output.summary.passed).toBe(expectedPassed);
            expect(output.summary.failed).toBe(expectedFailed);
            expect(output.summary.new).toBe(expectedNew);

            // Verify counts add up correctly
            expect(output.summary.passed + output.summary.failed + output.summary.new)
              .toBe(output.summary.total);

            // Verify failed results are listed correctly
            const failedResults = results.filter(r => !r.passed && !r.error);
            expect(output.failed.length).toBe(failedResults.length);

            // Verify each failed result is included
            for (const failedResult of failedResults) {
              const found = output.failed.find((f: any) => f.identifier === failedResult.identifier);
              expect(found).toBeDefined();
              expect(found.difference).toBe(failedResult.difference);
              expect(found.pixelsDifferent).toBe(failedResult.pixelsDifferent);
            }
          } finally {
            process.chdir(originalCwd);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should accurately count passed comparisons', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(comparisonResultArbitrary, { minLength: 5, maxLength: 30 }),
        fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') }),
        async (results, timestamp) => {
          const { dir, manager } = await createTestEnvironment();
          
          await manager.saveReport(results, timestamp);

          const expectedPassed = results.filter(r => r.passed).length;

          const originalCwd = process.cwd();
          process.chdir(dir);

          try {
            const originalLog = console.log;
            let jsonOutput = '';
            console.log = (msg: string) => {
              jsonOutput = msg;
            };

            await statusCommand({ json: true });
            console.log = originalLog;

            const output = JSON.parse(jsonOutput);
            expect(output.summary.passed).toBe(expectedPassed);
          } finally {
            process.chdir(originalCwd);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should accurately count failed comparisons', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(comparisonResultArbitrary, { minLength: 5, maxLength: 30 }),
        fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') }),
        async (results, timestamp) => {
          const { dir, manager } = await createTestEnvironment();
          
          await manager.saveReport(results, timestamp);

          // Failed = not passed AND no error
          const expectedFailed = results.filter(r => !r.passed && !r.error).length;

          const originalCwd = process.cwd();
          process.chdir(dir);

          try {
            const originalLog = console.log;
            let jsonOutput = '';
            console.log = (msg: string) => {
              jsonOutput = msg;
            };

            await statusCommand({ json: true });
            console.log = originalLog;

            const output = JSON.parse(jsonOutput);
            expect(output.summary.failed).toBe(expectedFailed);
          } finally {
            process.chdir(originalCwd);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should accurately count new baselines needed', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(comparisonResultArbitrary, { minLength: 5, maxLength: 30 }),
        fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') }),
        async (results, timestamp) => {
          const { dir, manager } = await createTestEnvironment();
          
          await manager.saveReport(results, timestamp);

          // New = results with errors (missing baselines)
          const expectedNew = results.filter(r => r.error).length;

          const originalCwd = process.cwd();
          process.chdir(dir);

          try {
            const originalLog = console.log;
            let jsonOutput = '';
            console.log = (msg: string) => {
              jsonOutput = msg;
            };

            await statusCommand({ json: true });
            console.log = originalLog;

            const output = JSON.parse(jsonOutput);
            expect(output.summary.new).toBe(expectedNew);
          } finally {
            process.chdir(originalCwd);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle edge case of all passing comparisons', async () => {
    const { dir, manager } = await createTestEnvironment();
    
    // Create results where all pass
    const results: ComparisonResult[] = [
      {
        identifier: 'home-desktop',
        passed: true,
        difference: 0.001,
        dimensions: { width: 1920, height: 1080 },
        pixelsDifferent: 10,
      },
      {
        identifier: 'about-desktop',
        passed: true,
        difference: 0.002,
        dimensions: { width: 1920, height: 1080 },
        pixelsDifferent: 20,
      },
    ];

    await manager.saveReport(results, new Date());

    const originalCwd = process.cwd();
    process.chdir(dir);

    try {
      const originalLog = console.log;
      let jsonOutput = '';
      console.log = (msg: string) => {
        jsonOutput = msg;
      };

      await statusCommand({ json: true });
      console.log = originalLog;

      const output = JSON.parse(jsonOutput);
      expect(output.summary.total).toBe(2);
      expect(output.summary.passed).toBe(2);
      expect(output.summary.failed).toBe(0);
      expect(output.summary.new).toBe(0);
      expect(output.failed.length).toBe(0);
    } finally {
      process.chdir(originalCwd);
    }
  });

  it('should handle edge case of all failing comparisons', async () => {
    const { dir, manager } = await createTestEnvironment();
    
    // Create results where all fail
    const results: ComparisonResult[] = [
      {
        identifier: 'home-desktop',
        passed: false,
        difference: 0.05,
        dimensions: { width: 1920, height: 1080 },
        pixelsDifferent: 1000,
      },
      {
        identifier: 'about-desktop',
        passed: false,
        difference: 0.08,
        dimensions: { width: 1920, height: 1080 },
        pixelsDifferent: 2000,
      },
    ];

    await manager.saveReport(results, new Date());

    const originalCwd = process.cwd();
    process.chdir(dir);

    try {
      const originalLog = console.log;
      let jsonOutput = '';
      console.log = (msg: string) => {
        jsonOutput = msg;
      };

      await statusCommand({ json: true });
      console.log = originalLog;

      const output = JSON.parse(jsonOutput);
      expect(output.summary.total).toBe(2);
      expect(output.summary.passed).toBe(0);
      expect(output.summary.failed).toBe(2);
      expect(output.summary.new).toBe(0);
      expect(output.failed.length).toBe(2);
    } finally {
      process.chdir(originalCwd);
    }
  });

  it('should handle edge case of all new baselines', async () => {
    const { dir, manager } = await createTestEnvironment();
    
    // Create results where all need new baselines
    const results: ComparisonResult[] = [
      {
        identifier: 'home-desktop',
        passed: false,
        difference: 0,
        dimensions: { width: 1920, height: 1080 },
        pixelsDifferent: 0,
        error: { message: 'Baseline not found' },
      },
      {
        identifier: 'about-desktop',
        passed: false,
        difference: 0,
        dimensions: { width: 1920, height: 1080 },
        pixelsDifferent: 0,
        error: { message: 'Baseline not found' },
      },
    ];

    await manager.saveReport(results, new Date());

    const originalCwd = process.cwd();
    process.chdir(dir);

    try {
      const originalLog = console.log;
      let jsonOutput = '';
      console.log = (msg: string) => {
        jsonOutput = msg;
      };

      await statusCommand({ json: true });
      console.log = originalLog;

      const output = JSON.parse(jsonOutput);
      expect(output.summary.total).toBe(2);
      expect(output.summary.passed).toBe(0);
      expect(output.summary.failed).toBe(0);
      expect(output.summary.new).toBe(2);
      expect(output.failed.length).toBe(0);
    } finally {
      process.chdir(originalCwd);
    }
  });

  it('should handle mixed results correctly', async () => {
    const { dir, manager } = await createTestEnvironment();
    
    // Create a mix of passed, failed, and new
    const results: ComparisonResult[] = [
      {
        identifier: 'home-desktop',
        passed: true,
        difference: 0.001,
        dimensions: { width: 1920, height: 1080 },
        pixelsDifferent: 10,
      },
      {
        identifier: 'about-desktop',
        passed: false,
        difference: 0.05,
        dimensions: { width: 1920, height: 1080 },
        pixelsDifferent: 1000,
      },
      {
        identifier: 'contact-desktop',
        passed: false,
        difference: 0,
        dimensions: { width: 1920, height: 1080 },
        pixelsDifferent: 0,
        error: { message: 'Baseline not found' },
      },
    ];

    await manager.saveReport(results, new Date());

    const originalCwd = process.cwd();
    process.chdir(dir);

    try {
      const originalLog = console.log;
      let jsonOutput = '';
      console.log = (msg: string) => {
        jsonOutput = msg;
      };

      await statusCommand({ json: true });
      console.log = originalLog;

      const output = JSON.parse(jsonOutput);
      expect(output.summary.total).toBe(3);
      expect(output.summary.passed).toBe(1);
      expect(output.summary.failed).toBe(1);
      expect(output.summary.new).toBe(1);
      expect(output.failed.length).toBe(1);
      
      // Verify the counts add up
      expect(output.summary.passed + output.summary.failed + output.summary.new)
        .toBe(output.summary.total);
    } finally {
      process.chdir(originalCwd);
    }
  });
});
