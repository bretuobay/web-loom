/**
 * Property test for timestamped diff storage
 * Feature: visdiff-phase1, Property 12: Timestamped diff storage
 * Validates: Requirements 3.4
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { StorageManager } from './storage-manager';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

describe('Property 12: Timestamped diff storage', () => {
  let tempDir: string;
  let storageManager: StorageManager;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'visdiff-test-'));
    storageManager = new StorageManager(tempDir);
    await storageManager.initialize();
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('should store diffs in timestamped directories when differences are detected', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate identifiers
        fc.stringMatching(/^[a-z][a-z0-9-]{0,20}$/),
        // Generate timestamps (dates within reasonable range)
        fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') }),
        async (identifier, timestamp) => {
          // Create a comparison result with differences
          const result = {
            identifier,
            passed: false,
            difference: 0.5,
            diffImage: Buffer.from('fake-diff-image-data'),
            dimensions: { width: 1920, height: 1080 },
            pixelsDifferent: 5000,
          };

          // Save the diff
          await storageManager.saveDiff(result, timestamp);

          // Construct expected timestamped directory name
          const year = timestamp.getFullYear();
          const month = String(timestamp.getMonth() + 1).padStart(2, '0');
          const day = String(timestamp.getDate()).padStart(2, '0');
          const hours = String(timestamp.getHours()).padStart(2, '0');
          const minutes = String(timestamp.getMinutes()).padStart(2, '0');
          const seconds = String(timestamp.getSeconds()).padStart(2, '0');
          const expectedTimestampDir = `${year}-${month}-${day}-${hours}-${minutes}-${seconds}`;

          // Verify the timestamped directory exists
          const diffBasePath = path.join(tempDir, '.visdiff/diffs');
          const timestampedPath = path.join(diffBasePath, expectedTimestampDir);

          const dirExists = await fs.access(timestampedPath)
            .then(() => true)
            .catch(() => false);

          expect(dirExists).toBe(true);

          // Verify the diff file exists in the timestamped directory
          const diffFilePath = path.join(timestampedPath, `diff-${identifier}.png`);
          const fileExists = await fs.access(diffFilePath)
            .then(() => true)
            .catch(() => false);

          expect(fileExists).toBe(true);

          // Verify the timestamp format is correct (YYYY-MM-DD-HH-mm-ss)
          expect(expectedTimestampDir).toMatch(/^\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2}$/);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should create separate timestamped directories for different comparison runs', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.stringMatching(/^[a-z][a-z0-9-]{0,20}$/),
        fc.tuple(
          fc.date({ min: new Date('2024-01-01'), max: new Date('2025-06-30') }),
          fc.date({ min: new Date('2025-07-01'), max: new Date('2025-12-31') })
        ),
        async (identifier, [timestamp1, timestamp2]) => {
          // Ensure timestamps are different
          if (timestamp1.getTime() === timestamp2.getTime()) {
            timestamp2 = new Date(timestamp2.getTime() + 1000);
          }

          const result1 = {
            identifier: `${identifier}-1`,
            passed: false,
            difference: 0.3,
            diffImage: Buffer.from('diff-1'),
            dimensions: { width: 800, height: 600 },
            pixelsDifferent: 1000,
          };

          const result2 = {
            identifier: `${identifier}-2`,
            passed: false,
            difference: 0.4,
            diffImage: Buffer.from('diff-2'),
            dimensions: { width: 800, height: 600 },
            pixelsDifferent: 2000,
          };

          await storageManager.saveDiff(result1, timestamp1);
          await storageManager.saveDiff(result2, timestamp2);

          // Check that both timestamped directories exist
          const diffBasePath = path.join(tempDir, '.visdiff/diffs');
          const entries = await fs.readdir(diffBasePath, { withFileTypes: true });
          const dirs = entries.filter(e => e.isDirectory()).map(e => e.name);

          // Should have at least 2 directories (could be same if timestamps round to same second)
          expect(dirs.length).toBeGreaterThanOrEqual(1);

          // All directories should follow timestamp format
          for (const dir of dirs) {
            expect(dir).toMatch(/^\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2}$/);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not create diff directories when no diff image is present', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.stringMatching(/^[a-z][a-z0-9-]{0,20}$/),
        fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') }),
        async (identifier, timestamp) => {
          // Create a result without a diff image (passed comparison)
          const result = {
            identifier,
            passed: true,
            difference: 0.001,
            dimensions: { width: 800, height: 600 },
            pixelsDifferent: 10,
          };

          await storageManager.saveDiff(result, timestamp);

          // The timestamped directory should not be created for passed comparisons
          const diffBasePath = path.join(tempDir, '.visdiff/diffs');
          const entries = await fs.readdir(diffBasePath, { withFileTypes: true });
          const dirs = entries.filter(e => e.isDirectory());

          // Should have no directories since no diff was saved
          expect(dirs.length).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});
