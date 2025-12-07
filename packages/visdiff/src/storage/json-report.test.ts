/**
 * Property test for JSON report generation
 * Feature: visdiff-phase1, Property 13: JSON report generation
 * Validates: Requirements 3.5
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { StorageManager } from './storage-manager';
import type { ComparisonResult } from '../types';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

describe('Property 13: JSON report generation', () => {
  let baseTempDir: string;

  beforeEach(async () => {
    baseTempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'visdiff-test-'));
  });

  afterEach(async () => {
    await fs.rm(baseTempDir, { recursive: true, force: true });
  });

  // Helper to create a unique storage manager for each iteration
  async function createStorageManager(): Promise<{ manager: StorageManager; dir: string }> {
    const uniqueDir = await fs.mkdtemp(path.join(baseTempDir, 'iter-'));
    const manager = new StorageManager(uniqueDir);
    await manager.initialize();
    return { manager, dir: uniqueDir };
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

  it('should generate valid JSON reports for any completed comparison', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(comparisonResultArbitrary, { minLength: 1, maxLength: 20 }),
        fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') }),
        async (results, timestamp) => {
          const { manager, dir: tempDir } = await createStorageManager();
          
          // Save the report
          await manager.saveReport(results, timestamp);

          // Construct expected path
          const year = timestamp.getFullYear();
          const month = String(timestamp.getMonth() + 1).padStart(2, '0');
          const day = String(timestamp.getDate()).padStart(2, '0');
          const hours = String(timestamp.getHours()).padStart(2, '0');
          const minutes = String(timestamp.getMinutes()).padStart(2, '0');
          const seconds = String(timestamp.getSeconds()).padStart(2, '0');
          const timestampDir = `${year}-${month}-${day}-${hours}-${minutes}-${seconds}`;

          const reportPath = path.join(
            tempDir,
            '.visdiff/diffs',
            timestampDir,
            'report.json'
          );

          // Verify file exists
          const fileExists = await fs.access(reportPath)
            .then(() => true)
            .catch(() => false);

          expect(fileExists).toBe(true);

          // Read and parse the JSON
          const content = await fs.readFile(reportPath, 'utf-8');
          let report;
          
          // Verify it's valid JSON
          expect(() => {
            report = JSON.parse(content);
          }).not.toThrow();

          report = JSON.parse(content);

          // Verify report structure
          expect(report).toHaveProperty('timestamp');
          expect(report).toHaveProperty('results');
          expect(report).toHaveProperty('summary');

          // Verify summary structure
          expect(report.summary).toHaveProperty('total');
          expect(report.summary).toHaveProperty('passed');
          expect(report.summary).toHaveProperty('failed');
          expect(report.summary).toHaveProperty('new');

          // Verify summary counts are correct
          expect(report.summary.total).toBe(results.length);
          expect(report.summary.passed).toBe(results.filter(r => r.passed).length);
          expect(report.summary.failed).toBe(results.filter(r => !r.passed && !r.error).length);

          // Verify results array
          expect(Array.isArray(report.results)).toBe(true);
          expect(report.results.length).toBe(results.length);

          // Verify each result has required fields
          for (const result of report.results) {
            expect(result).toHaveProperty('identifier');
            expect(result).toHaveProperty('passed');
            expect(result).toHaveProperty('difference');
            expect(result).toHaveProperty('dimensions');
            expect(result).toHaveProperty('pixelsDifferent');
            
            // Verify diffImage buffer is not included in JSON
            expect(result.diffImage).toBeUndefined();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should correctly calculate summary statistics', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(comparisonResultArbitrary, { minLength: 5, maxLength: 50 }),
        fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') }),
        async (results, timestamp) => {
          const { manager } = await createStorageManager();
          
          await manager.saveReport(results, timestamp);

          const report = await manager.getLatestReport();
          expect(report).not.toBeNull();

          if (report) {
            // Verify total count
            expect(report.summary.total).toBe(results.length);

            // Verify passed count
            const expectedPassed = results.filter(r => r.passed).length;
            expect(report.summary.passed).toBe(expectedPassed);

            // Verify failed count (not passed and no error)
            const expectedFailed = results.filter(r => !r.passed && !r.error).length;
            expect(report.summary.failed).toBe(expectedFailed);

            // Verify new count (results with errors)
            const expectedNew = results.filter(r => r.error).length;
            expect(report.summary.new).toBe(expectedNew);

            // Verify counts add up correctly
            expect(report.summary.passed + report.summary.failed + report.summary.new)
              .toBe(report.summary.total);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve timestamp information in reports', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(comparisonResultArbitrary, { minLength: 1, maxLength: 10 }),
        fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') }),
        async (results, timestamp) => {
          const { manager } = await createStorageManager();
          
          await manager.saveReport(results, timestamp);

          const report = await manager.getLatestReport();
          expect(report).not.toBeNull();

          if (report) {
            // Verify timestamp is preserved
            expect(report.timestamp).toBeInstanceOf(Date);
            
            // Verify the timestamp matches exactly (after JSON serialization round-trip)
            // We compare the ISO strings since that's what gets serialized
            expect(report.timestamp.toISOString()).toBe(timestamp.toISOString());
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle empty result arrays', async () => {
    const { manager } = await createStorageManager();
    const timestamp = new Date();
    await manager.saveReport([], timestamp);

    const report = await manager.getLatestReport();
    expect(report).not.toBeNull();

    if (report) {
      expect(report.summary.total).toBe(0);
      expect(report.summary.passed).toBe(0);
      expect(report.summary.failed).toBe(0);
      expect(report.summary.new).toBe(0);
      expect(report.results).toEqual([]);
    }
  });

  it('should retrieve the most recent report when multiple exist', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(comparisonResultArbitrary, { minLength: 1, maxLength: 5 }),
        fc.tuple(
          fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }),
          fc.date({ min: new Date('2025-01-01'), max: new Date('2025-12-31') })
        ),
        async (results, [olderTimestamp, newerTimestamp]) => {
          const { manager } = await createStorageManager();
          
          // Save older report
          await manager.saveReport(
            results.map(r => ({ ...r, identifier: `old-${r.identifier}` })),
            olderTimestamp
          );

          // Save newer report
          await manager.saveReport(
            results.map(r => ({ ...r, identifier: `new-${r.identifier}` })),
            newerTimestamp
          );

          // Get latest should return the newer one
          const latest = await manager.getLatestReport();
          expect(latest).not.toBeNull();

          if (latest) {
            // Verify it's the newer report by checking identifiers
            expect(latest.results[0].identifier).toContain('new-');
          }
        }
      ),
      { numRuns: 50 }
    );
  });
});
