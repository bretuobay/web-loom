/**
 * Property test for status timestamp inclusion
 * Feature: visdiff-phase1, Property 31: Status timestamp inclusion
 * Validates: Requirements 7.4
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { StorageManager } from '../storage/storage-manager.js';
import { statusCommand } from './status.js';
import type { ComparisonResult } from '../types';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

describe('Property 31: Status timestamp inclusion', () => {
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
      };`,
    );

    const manager = new StorageManager(uniqueDir);
    await manager.initialize();

    return { dir: uniqueDir, manager };
  }

  // Arbitrary for generating comparison results
  const comparisonResultArbitrary = fc.record({
    identifier: fc.stringMatching(/^[a-z][a-z0-9-]{0,20}$/),
    passed: fc.boolean(),
    difference: fc.double({ min: 0, max: 1, noNaN: true }),
    dimensions: fc.record({
      width: fc.integer({ min: 100, max: 3840 }),
      height: fc.integer({ min: 100, max: 2160 }),
    }),
    pixelsDifferent: fc.integer({ min: 0, max: 1000000 }),
  });

  it('should include timestamp in JSON output for any comparison report', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(comparisonResultArbitrary, { minLength: 1, maxLength: 20 }),
        fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') }),
        async (results, timestamp) => {
          const { dir, manager } = await createTestEnvironment();

          // Save a report with the generated results and timestamp
          await manager.saveReport(results, timestamp);

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

            // Verify timestamp is included
            expect(output.timestamp).toBeDefined();
            expect(typeof output.timestamp).toBe('string');

            // Verify timestamp is a valid ISO string
            const parsedTimestamp = new Date(output.timestamp);
            expect(parsedTimestamp.toString()).not.toBe('Invalid Date');

            // Verify timestamp matches the original (within millisecond precision)
            expect(parsedTimestamp.getTime()).toBe(timestamp.getTime());

            // Verify timestamp is in ISO format
            expect(output.timestamp).toBe(timestamp.toISOString());
          } finally {
            process.chdir(originalCwd);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should include timestamp for reports with no results', async () => {
    await fc.assert(
      fc.asyncProperty(fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') }), async (timestamp) => {
        const { dir, manager } = await createTestEnvironment();

        // Save a report with no results but with a timestamp
        await manager.saveReport([], timestamp);

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

          // Verify timestamp is included even with no results
          expect(output.timestamp).toBeDefined();
          expect(output.timestamp).toBe(timestamp.toISOString());
        } finally {
          process.chdir(originalCwd);
        }
      }),
      { numRuns: 100 },
    );
  });

  it('should include timestamp for reports with all passing results', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(comparisonResultArbitrary, { minLength: 1, maxLength: 10 }),
        fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') }),
        async (results, timestamp) => {
          const { dir, manager } = await createTestEnvironment();

          // Force all results to pass
          const passingResults = results.map((r) => ({ ...r, passed: true, difference: 0.001 }));

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

            expect(output.timestamp).toBeDefined();
            expect(output.timestamp).toBe(timestamp.toISOString());
          } finally {
            process.chdir(originalCwd);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should include timestamp for reports with all failing results', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(comparisonResultArbitrary, { minLength: 1, maxLength: 10 }),
        fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') }),
        async (results, timestamp) => {
          const { dir, manager } = await createTestEnvironment();

          // Force all results to fail
          const failingResults = results.map((r) => ({ ...r, passed: false, difference: 0.05 }));

          await manager.saveReport(failingResults, timestamp);

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

            expect(output.timestamp).toBeDefined();
            expect(output.timestamp).toBe(timestamp.toISOString());
          } finally {
            process.chdir(originalCwd);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should preserve timestamp precision across different dates', async () => {
    await fc.assert(
      fc.asyncProperty(fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }), async (timestamp) => {
        const { dir, manager } = await createTestEnvironment();

        // Create a simple result
        const results: ComparisonResult[] = [
          {
            identifier: 'test-page',
            passed: true,
            difference: 0.001,
            dimensions: { width: 1920, height: 1080 },
            pixelsDifferent: 10,
          },
        ];

        await manager.saveReport(results, timestamp);

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

          // Verify exact timestamp match
          const outputDate = new Date(output.timestamp);
          expect(outputDate.getTime()).toBe(timestamp.getTime());

          // Verify ISO format
          expect(output.timestamp).toBe(timestamp.toISOString());
        } finally {
          process.chdir(originalCwd);
        }
      }),
      { numRuns: 100 },
    );
  });

  it('should include timestamp in non-JSON output', async () => {
    const { dir, manager } = await createTestEnvironment();

    const timestamp = new Date('2024-12-07T14:30:22.000Z');
    const results: ComparisonResult[] = [
      {
        identifier: 'home-desktop',
        passed: true,
        difference: 0.001,
        dimensions: { width: 1920, height: 1080 },
        pixelsDifferent: 10,
      },
    ];

    await manager.saveReport(results, timestamp);

    const originalCwd = process.cwd();
    process.chdir(dir);

    try {
      // Capture console output
      const originalLog = console.log;
      const logs: string[] = [];
      console.log = (...args: any[]) => {
        logs.push(args.map((arg) => String(arg)).join(' '));
      };

      await statusCommand({ json: false });

      // Restore console.log
      console.log = originalLog;

      // Verify that some log contains timestamp information
      const hasTimestamp = logs.some(
        (log) => log.includes('Last comparison:') || log.includes('ago') || log.includes('just now'),
      );

      expect(hasTimestamp).toBe(true);
    } finally {
      process.chdir(originalCwd);
    }
  });

  it('should handle recent timestamps correctly', async () => {
    const { dir, manager } = await createTestEnvironment();

    // Create a very recent timestamp (within the last minute)
    const timestamp = new Date(Date.now() - 30000); // 30 seconds ago
    const results: ComparisonResult[] = [
      {
        identifier: 'test-page',
        passed: true,
        difference: 0.001,
        dimensions: { width: 1920, height: 1080 },
        pixelsDifferent: 10,
      },
    ];

    await manager.saveReport(results, timestamp);

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

      // Verify timestamp is included and matches
      expect(output.timestamp).toBeDefined();
      const outputDate = new Date(output.timestamp);
      expect(Math.abs(outputDate.getTime() - timestamp.getTime())).toBeLessThan(1000);
    } finally {
      process.chdir(originalCwd);
    }
  });

  it('should handle old timestamps correctly', async () => {
    const { dir, manager } = await createTestEnvironment();

    // Create an old timestamp (several days ago)
    const timestamp = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
    const results: ComparisonResult[] = [
      {
        identifier: 'test-page',
        passed: true,
        difference: 0.001,
        dimensions: { width: 1920, height: 1080 },
        pixelsDifferent: 10,
      },
    ];

    await manager.saveReport(results, timestamp);

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

      // Verify timestamp is included and matches
      expect(output.timestamp).toBeDefined();
      expect(output.timestamp).toBe(timestamp.toISOString());
    } finally {
      process.chdir(originalCwd);
    }
  });

  it('should handle edge case of timestamp at midnight', async () => {
    const { dir, manager } = await createTestEnvironment();

    const timestamp = new Date('2024-12-07T00:00:00.000Z');
    const results: ComparisonResult[] = [
      {
        identifier: 'test-page',
        passed: true,
        difference: 0.001,
        dimensions: { width: 1920, height: 1080 },
        pixelsDifferent: 10,
      },
    ];

    await manager.saveReport(results, timestamp);

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

      expect(output.timestamp).toBe('2024-12-07T00:00:00.000Z');
    } finally {
      process.chdir(originalCwd);
    }
  });

  it('should handle edge case of timestamp with milliseconds', async () => {
    const { dir, manager } = await createTestEnvironment();

    const timestamp = new Date('2024-12-07T14:30:22.456Z');
    const results: ComparisonResult[] = [
      {
        identifier: 'test-page',
        passed: true,
        difference: 0.001,
        dimensions: { width: 1920, height: 1080 },
        pixelsDifferent: 10,
      },
    ];

    await manager.saveReport(results, timestamp);

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

      expect(output.timestamp).toBe('2024-12-07T14:30:22.456Z');
    } finally {
      process.chdir(originalCwd);
    }
  });
});
