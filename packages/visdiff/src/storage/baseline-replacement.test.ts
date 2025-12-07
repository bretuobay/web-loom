/**
 * Property test for baseline replacement on approval
 * Feature: visdiff-phase1, Property 16: Baseline replacement on approval
 * Validates: Requirements 4.1
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { StorageManager } from './storage-manager';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

describe('Property 16: Baseline replacement on approval', () => {
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

  it('should replace existing baselines with current screenshots on approval', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.stringMatching(/^[a-z][a-z0-9-]{0,20}$/),
        fc.uint8Array({ minLength: 10, maxLength: 100 }),
        fc.uint8Array({ minLength: 10, maxLength: 100 }),
        async (identifier, originalData, newData) => {
          // Ensure the data is different
          if (Buffer.from(originalData).equals(Buffer.from(newData))) {
            newData[0] = (newData[0] + 1) % 256;
          }

          const originalBaseline = Buffer.from(originalData);
          const newScreenshot = Buffer.from(newData);

          // Save original baseline
          await storageManager.saveBaseline(identifier, originalBaseline);

          // Verify original baseline exists
          const loadedOriginal = await storageManager.loadBaseline(identifier);
          expect(loadedOriginal).not.toBeNull();
          expect(loadedOriginal?.equals(originalBaseline)).toBe(true);

          // Create map of current screenshots
          const currentScreenshots = new Map<string, Buffer>();
          currentScreenshots.set(identifier, newScreenshot);

          // Approve changes
          const approved = await storageManager.approveChanges(currentScreenshots);

          // Verify the identifier was approved
          expect(approved).toContain(identifier);

          // Load the baseline again - it should now be the new screenshot
          const loadedNew = await storageManager.loadBaseline(identifier);
          expect(loadedNew).not.toBeNull();
          expect(loadedNew?.equals(newScreenshot)).toBe(true);
          expect(loadedNew?.equals(originalBaseline)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should replace multiple baselines when approving all changes', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            identifier: fc.stringMatching(/^[a-z][a-z0-9-]{0,15}$/),
            original: fc.uint8Array({ minLength: 10, maxLength: 50 }),
            updated: fc.uint8Array({ minLength: 10, maxLength: 50 }),
          }),
          { minLength: 2, maxLength: 10 }
        ),
        async (items) => {
          // Ensure each item has different original and updated data
          const uniqueItems = items.map((item, idx) => ({
            ...item,
            identifier: `${item.identifier}-${idx}`, // Make identifiers unique
            updated: Buffer.from([...item.updated, idx]), // Make updated different
          }));

          // Save original baselines
          for (const item of uniqueItems) {
            await storageManager.saveBaseline(item.identifier, Buffer.from(item.original));
          }

          // Create map of current screenshots
          const currentScreenshots = new Map<string, Buffer>();
          for (const item of uniqueItems) {
            currentScreenshots.set(item.identifier, Buffer.from(item.updated));
          }

          // Approve all changes
          const approved = await storageManager.approveChanges(currentScreenshots);

          // Verify all identifiers were approved
          expect(approved.length).toBe(uniqueItems.length);
          for (const item of uniqueItems) {
            expect(approved).toContain(item.identifier);
          }

          // Verify all baselines were replaced
          for (const item of uniqueItems) {
            const loaded = await storageManager.loadBaseline(item.identifier);
            expect(loaded).not.toBeNull();
            expect(loaded?.equals(Buffer.from(item.updated))).toBe(true);
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should handle approval when no existing baseline exists', async () => {
    let iterationCount = 0;
    await fc.assert(
      fc.asyncProperty(
        fc.stringMatching(/^[a-z][a-z0-9-]{0,20}$/),
        fc.uint8Array({ minLength: 10, maxLength: 100 }),
        async (identifier, data) => {
          // Make identifier unique per iteration to avoid conflicts
          const uniqueIdentifier = `${identifier}-iter${iterationCount++}`;
          const screenshot = Buffer.from(data);

          // Verify no baseline exists
          const existing = await storageManager.loadBaseline(uniqueIdentifier);
          expect(existing).toBeNull();

          // Create map of current screenshots
          const currentScreenshots = new Map<string, Buffer>();
          currentScreenshots.set(uniqueIdentifier, screenshot);

          // Approve changes (creating new baseline)
          const approved = await storageManager.approveChanges(currentScreenshots);

          // Verify the identifier was approved
          expect(approved).toContain(uniqueIdentifier);

          // Verify the baseline now exists
          const loaded = await storageManager.loadBaseline(uniqueIdentifier);
          expect(loaded).not.toBeNull();
          expect(loaded?.equals(screenshot)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});
