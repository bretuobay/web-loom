/**
 * Property test for file naming convention
 * Feature: visdiff-phase1, Property 5: Consistent file naming convention
 * Validates: Requirements 2.3
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { StorageManager } from './storage-manager';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

describe('Property 5: Consistent file naming convention', () => {
  let tempDir: string;
  let storageManager: StorageManager;

  beforeEach(async () => {
    // Create a temporary directory for testing
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'visdiff-test-'));
    storageManager = new StorageManager(tempDir);
    await storageManager.initialize();
  });

  afterEach(async () => {
    // Clean up temporary directory
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('should store screenshots with consistent naming convention including page name and viewport', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate page names (alphanumeric with hyphens)
        fc.stringMatching(/^[a-z][a-z0-9-]{0,20}$/),
        // Generate viewport names (alphanumeric)
        fc.stringMatching(/^[a-z][a-z0-9]{0,10}$/),
        async (pageName, viewportName) => {
          // Create identifier from page name and viewport
          const identifier = `${pageName}-${viewportName}`;

          // Create a dummy image buffer
          const imageBuffer = Buffer.from('fake-image-data');

          // Save the baseline
          await storageManager.saveBaseline(identifier, imageBuffer);

          // Check that the file exists with the expected naming convention
          const baselineDir = path.join(tempDir, '.visdiff/baselines');
          const expectedFilename = `${identifier}.png`;
          const expectedPath = path.join(baselineDir, expectedFilename);

          // Verify file exists
          const fileExists = await fs
            .access(expectedPath)
            .then(() => true)
            .catch(() => false);

          expect(fileExists).toBe(true);

          // Verify filename includes both page name and viewport name
          expect(expectedFilename).toContain(pageName);
          expect(expectedFilename).toContain(viewportName);
          expect(expectedFilename).toMatch(/\.png$/);

          // Verify we can load it back
          const loaded = await storageManager.loadBaseline(identifier);
          expect(loaded).not.toBeNull();
          expect(loaded?.toString()).toBe(imageBuffer.toString());
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should use consistent naming for diff files', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.stringMatching(/^[a-z][a-z0-9-]{0,20}$/),
        fc.stringMatching(/^[a-z][a-z0-9]{0,10}$/),
        async (pageName, viewportName) => {
          const identifier = `${pageName}-${viewportName}`;
          const timestamp = new Date();

          const result = {
            identifier,
            passed: false,
            difference: 0.5,
            diffImage: Buffer.from('fake-diff-image'),
            dimensions: { width: 800, height: 600 },
            pixelsDifferent: 1000,
          };

          await storageManager.saveDiff(result, timestamp);

          // Check that diff file follows naming convention
          const year = timestamp.getFullYear();
          const month = String(timestamp.getMonth() + 1).padStart(2, '0');
          const day = String(timestamp.getDate()).padStart(2, '0');
          const hours = String(timestamp.getHours()).padStart(2, '0');
          const minutes = String(timestamp.getMinutes()).padStart(2, '0');
          const seconds = String(timestamp.getSeconds()).padStart(2, '0');
          const timestampDir = `${year}-${month}-${day}-${hours}-${minutes}-${seconds}`;

          const diffPath = path.join(tempDir, '.visdiff/diffs', timestampDir, `diff-${identifier}.png`);

          const fileExists = await fs
            .access(diffPath)
            .then(() => true)
            .catch(() => false);

          expect(fileExists).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });
});
