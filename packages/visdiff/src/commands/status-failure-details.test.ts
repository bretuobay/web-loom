/**
 * Property test for status failure details
 * Feature: visdiff-phase1, Property 32: Status failure details
 * Validates: Requirements 7.5
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { StorageManager } from '../storage/storage-manager.js';
import { statusCommand } from './status.js';
import type { ComparisonResult } from '../types';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

describe('Property 32: Status failure details', () => {
  let baseTempDir: string;

  beforeEach(async () => {
    baseTempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'visdiff-test-'));
  });

  afterEach(async () => {
    await fs.rm(baseTempDir, { recursive: true, force: true });
  });

  // Helper to create a unique test environment with config
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

  // Arbitrary for generating failed comparison results
  // Failed comparisons are those with passed=false and no error
  const failedComparisonArbitrary = fc.record({
    identifier: fc.stringMatching(/^[a-z][a-z0-9-]{0,20}$/),
    passed: fc.constant(false),
    difference: fc.double({ min: 0.01, max: 1, noNaN: true }), // Above threshold
    dimensions: fc.record({
      width: fc.integer({ min: 100, max: 3840 }),
      height: fc.integer({ min: 100, max: 2160 }),
    }),
    pixelsDifferent: fc.integer({ min: 1000, max: 1000000 }),
    error: fc.constant(undefined),
  });

  // Arbitrary for generating passing comparison results
  const passingComparisonArbitrary = fc.record({
    identifier: fc.stringMatching(/^[a-z][a-z0-9-]{0,20}$/),
    passed: fc.constant(true),
    difference: fc.double({ min: 0, max: 0.01, noNaN: true }),
    dimensions: fc.record({
      width: fc.integer({ min: 100, max: 3840 }),
      height: fc.integer({ min: 100, max: 2160 }),
    }),
    pixelsDifferent: fc.integer({ min: 0, max: 1000 }),
    error: fc.constant(undefined),
  });

  it('should list all failed comparison identifiers in JSON output', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(failedComparisonArbitrary, { minLength: 1, maxLength: 20 }),
        fc.array(passingComparisonArbitrary, { minLength: 0, maxLength: 10 }),
        fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') }),
        async (failedResults, passingResults, timestamp) => {
          const { dir, manager } = await createTestEnvironment();
          
          // Make identifiers unique by adding index suffix
          const uniqueFailedResults = failedResults.map((r, i) => ({
            ...r,
            identifier: `${r.identifier}-f${i}`,
          }));
          
          const uniquePassingResults = passingResults.map((r, i) => ({
            ...r,
            identifier: `${r.identifier}-p${i}`,
          }));
          
          // Combine failed and passing results
          const allResults = [...uniqueFailedResults, ...uniquePassingResults];
          
          // Save report
          await manager.saveReport(allResults, timestamp);

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

            // Verify all failed results are listed
            expect(output.failed).toBeDefined();
            expect(Array.isArray(output.failed)).toBe(true);
            expect(output.failed.length).toBe(uniqueFailedResults.length);

            // Verify each failed result is included with correct identifier
            for (const failedResult of uniqueFailedResults) {
              const found = output.failed.find((f: any) => f.identifier === failedResult.identifier);
              expect(found).toBeDefined();
              expect(found.identifier).toBe(failedResult.identifier);
            }

            // Verify no passing results are in the failed list
            for (const passingResult of uniquePassingResults) {
              const found = output.failed.find((f: any) => f.identifier === passingResult.identifier);
              expect(found).toBeUndefined();
            }
          } finally {
            process.chdir(originalCwd);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should include difference percentage for each failed comparison', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(failedComparisonArbitrary, { minLength: 1, maxLength: 15 }),
        fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') }),
        async (failedResults, timestamp) => {
          const { dir, manager } = await createTestEnvironment();
          
          // Make identifiers unique
          const uniqueFailedResults = failedResults.map((r, i) => ({
            ...r,
            identifier: `${r.identifier}-${i}`,
          }));
          
          await manager.saveReport(uniqueFailedResults, timestamp);

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

            // Verify each failed result includes difference
            for (const failedResult of uniqueFailedResults) {
              const found = output.failed.find((f: any) => f.identifier === failedResult.identifier);
              expect(found).toBeDefined();
              expect(found.difference).toBeDefined();
              expect(typeof found.difference).toBe('number');
              expect(found.difference).toBe(failedResult.difference);
            }
          } finally {
            process.chdir(originalCwd);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should include pixel count for each failed comparison', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(failedComparisonArbitrary, { minLength: 1, maxLength: 15 }),
        fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') }),
        async (failedResults, timestamp) => {
          const { dir, manager } = await createTestEnvironment();
          
          // Make identifiers unique
          const uniqueFailedResults = failedResults.map((r, i) => ({
            ...r,
            identifier: `${r.identifier}-${i}`,
          }));
          
          await manager.saveReport(uniqueFailedResults, timestamp);

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

            // Verify each failed result includes pixelsDifferent
            for (const failedResult of uniqueFailedResults) {
              const found = output.failed.find((f: any) => f.identifier === failedResult.identifier);
              expect(found).toBeDefined();
              expect(found.pixelsDifferent).toBeDefined();
              expect(typeof found.pixelsDifferent).toBe('number');
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

  it('should list failed comparisons in non-JSON output', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(failedComparisonArbitrary, { minLength: 1, maxLength: 10 }),
        fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') }),
        async (failedResults, timestamp) => {
          const { dir, manager } = await createTestEnvironment();
          
          await manager.saveReport(failedResults, timestamp);

          const originalCwd = process.cwd();
          process.chdir(dir);

          try {
            // Capture console output
            const originalLog = console.log;
            const logs: string[] = [];
            console.log = (...args: any[]) => {
              logs.push(args.map(arg => String(arg)).join(' '));
            };

            await statusCommand({ json: false });

            // Restore console.log
            console.log = originalLog;

            // Verify that output contains "Failed Comparisons:" section
            const hasFailedSection = logs.some(log => log.includes('Failed Comparisons:'));
            expect(hasFailedSection).toBe(true);

            // Verify each failed identifier appears in the output
            for (const failedResult of failedResults) {
              const identifierFound = logs.some(log => log.includes(failedResult.identifier));
              expect(identifierFound).toBe(true);
            }

            // Verify difference percentages are shown
            for (const failedResult of failedResults) {
              const percentageStr = (failedResult.difference * 100).toFixed(2);
              const percentageFound = logs.some(log => log.includes(percentageStr));
              expect(percentageFound).toBe(true);
            }
          } finally {
            process.chdir(originalCwd);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not list failed comparisons when all pass', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(passingComparisonArbitrary, { minLength: 1, maxLength: 10 }),
        fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') }),
        async (passingResults, timestamp) => {
          const { dir, manager } = await createTestEnvironment();
          
          await manager.saveReport(passingResults, timestamp);

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

            // Verify failed list is empty
            expect(output.failed).toBeDefined();
            expect(Array.isArray(output.failed)).toBe(true);
            expect(output.failed.length).toBe(0);
          } finally {
            process.chdir(originalCwd);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle edge case of single failed comparison', async () => {
    const { dir, manager } = await createTestEnvironment();
    
    const results: ComparisonResult[] = [
      {
        identifier: 'home-desktop',
        passed: false,
        difference: 0.05,
        dimensions: { width: 1920, height: 1080 },
        pixelsDifferent: 5000,
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

      expect(output.failed.length).toBe(1);
      expect(output.failed[0].identifier).toBe('home-desktop');
      expect(output.failed[0].difference).toBe(0.05);
      expect(output.failed[0].pixelsDifferent).toBe(5000);
    } finally {
      process.chdir(originalCwd);
    }
  });

  it('should handle edge case of many failed comparisons', async () => {
    const { dir, manager } = await createTestEnvironment();
    
    // Create 50 failed comparisons
    const results: ComparisonResult[] = Array.from({ length: 50 }, (_, i) => ({
      identifier: `page-${i}-desktop`,
      passed: false,
      difference: 0.02 + (i * 0.001),
      dimensions: { width: 1920, height: 1080 },
      pixelsDifferent: 1000 + (i * 100),
    }));

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

      // Verify all 50 failed comparisons are listed
      expect(output.failed.length).toBe(50);
      
      // Verify each has correct details
      for (let i = 0; i < 50; i++) {
        const found = output.failed.find((f: any) => f.identifier === `page-${i}-desktop`);
        expect(found).toBeDefined();
        expect(found.difference).toBeCloseTo(0.02 + (i * 0.001), 5);
        expect(found.pixelsDifferent).toBe(1000 + (i * 100));
      }
    } finally {
      process.chdir(originalCwd);
    }
  });

  it('should handle mixed results with some failed', async () => {
    const { dir, manager } = await createTestEnvironment();
    
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
        pixelsDifferent: 5000,
      },
      {
        identifier: 'contact-desktop',
        passed: true,
        difference: 0.002,
        dimensions: { width: 1920, height: 1080 },
        pixelsDifferent: 20,
      },
      {
        identifier: 'products-desktop',
        passed: false,
        difference: 0.08,
        dimensions: { width: 1920, height: 1080 },
        pixelsDifferent: 8000,
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

      // Verify only the 2 failed comparisons are listed
      expect(output.failed.length).toBe(2);
      
      const aboutFound = output.failed.find((f: any) => f.identifier === 'about-desktop');
      expect(aboutFound).toBeDefined();
      expect(aboutFound.difference).toBe(0.05);
      expect(aboutFound.pixelsDifferent).toBe(5000);

      const productsFound = output.failed.find((f: any) => f.identifier === 'products-desktop');
      expect(productsFound).toBeDefined();
      expect(productsFound.difference).toBe(0.08);
      expect(productsFound.pixelsDifferent).toBe(8000);

      // Verify passing results are not in failed list
      const homeFound = output.failed.find((f: any) => f.identifier === 'home-desktop');
      expect(homeFound).toBeUndefined();

      const contactFound = output.failed.find((f: any) => f.identifier === 'contact-desktop');
      expect(contactFound).toBeUndefined();
    } finally {
      process.chdir(originalCwd);
    }
  });

  it('should exclude error results from failed list', async () => {
    const { dir, manager } = await createTestEnvironment();
    
    const results: ComparisonResult[] = [
      {
        identifier: 'home-desktop',
        passed: false,
        difference: 0.05,
        dimensions: { width: 1920, height: 1080 },
        pixelsDifferent: 5000,
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

      // Verify only the actual failed comparison is listed (not the error)
      expect(output.failed.length).toBe(1);
      expect(output.failed[0].identifier).toBe('home-desktop');
      
      // Verify error result is not in failed list
      const errorFound = output.failed.find((f: any) => f.identifier === 'about-desktop');
      expect(errorFound).toBeUndefined();
    } finally {
      process.chdir(originalCwd);
    }
  });

  it('should preserve identifier format in output', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            identifier: fc.stringMatching(/^[a-z][a-z0-9-]{0,20}$/),
            passed: fc.constant(false),
            difference: fc.double({ min: 0.01, max: 1, noNaN: true }),
            dimensions: fc.record({
              width: fc.integer({ min: 100, max: 3840 }),
              height: fc.integer({ min: 100, max: 2160 }),
            }),
            pixelsDifferent: fc.integer({ min: 1000, max: 1000000 }),
            error: fc.constant(undefined),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') }),
        async (failedResults, timestamp) => {
          const { dir, manager } = await createTestEnvironment();
          
          await manager.saveReport(failedResults, timestamp);

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

            // Verify identifiers are preserved exactly
            for (const failedResult of failedResults) {
              const found = output.failed.find((f: any) => f.identifier === failedResult.identifier);
              expect(found).toBeDefined();
              expect(found.identifier).toBe(failedResult.identifier);
              expect(typeof found.identifier).toBe('string');
            }
          } finally {
            process.chdir(originalCwd);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should show verbose details when verbose flag is set', async () => {
    const { dir, manager } = await createTestEnvironment();
    
    const results: ComparisonResult[] = [
      {
        identifier: 'home-desktop',
        passed: false,
        difference: 0.05,
        dimensions: { width: 1920, height: 1080 },
        pixelsDifferent: 5000,
      },
    ];

    await manager.saveReport(results, new Date());

    const originalCwd = process.cwd();
    process.chdir(dir);

    try {
      const originalLog = console.log;
      const logs: string[] = [];
      console.log = (...args: any[]) => {
        logs.push(args.map(arg => String(arg)).join(' '));
      };

      await statusCommand({ json: false, verbose: true });
      console.log = originalLog;

      // Verify verbose output includes dimensions
      const hasDimensions = logs.some(log => log.includes('Dimensions:') && log.includes('1920x1080'));
      expect(hasDimensions).toBe(true);

      // Verify verbose output includes pixel count
      const hasPixelCount = logs.some(log => log.includes('Pixels different:') && log.includes('5,000'));
      expect(hasPixelCount).toBe(true);
    } finally {
      process.chdir(originalCwd);
    }
  });
});
