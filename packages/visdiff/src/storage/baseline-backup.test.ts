/**
 * Property test for baseline backup on approval
 * Feature: visdiff-phase1, Property 17: Baseline backup on approval
 * Validates: Requirements 4.2
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { StorageManager } from './storage-manager';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

describe('Property 17: Baseline backup on approval', () => {
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

  it('should preserve original baselines in backup directory before approval', async () => {
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

          // Create map of current screenshots
          const currentScreenshots = new Map<string, Buffer>();
          currentScreenshots.set(identifier, newScreenshot);

          // Approve changes (this should create a backup)
          await storageManager.approveChanges(currentScreenshots);

          // Check that backup directory exists and contains the original baseline
          const backupDir = path.join(tempDir, '.visdiff/backups');
          const backupEntries = await fs.readdir(backupDir, { withFileTypes: true });
          const backupDirs = backupEntries.filter(e => e.isDirectory());

          // Should have at least one backup directory
          expect(backupDirs.length).toBeGreaterThan(0);

          // Get the most recent backup directory (they're timestamped)
          const latestBackupDir = backupDirs.sort((a, b) => b.name.localeCompare(a.name))[0];
          const backupFilePath = path.join(backupDir, latestBackupDir.name, `${identifier}.png`);

          // Verify the backup file exists
          const backupExists = await fs.access(backupFilePath)
            .then(() => true)
            .catch(() => false);

          expect(backupExists).toBe(true);

          // Verify the backup contains the original data
          const backupContent = await fs.readFile(backupFilePath);
          expect(backupContent.equals(originalBaseline)).toBe(true);
          expect(backupContent.equals(newScreenshot)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should backup all baselines when approving multiple changes', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            identifier: fc.stringMatching(/^[a-z][a-z0-9-]{0,15}$/),
            original: fc.uint8Array({ minLength: 10, maxLength: 50 }),
            updated: fc.uint8Array({ minLength: 10, maxLength: 50 }),
          }),
          { minLength: 2, maxLength: 5 }
        ),
        async (items) => {
          // Make identifiers unique and ensure data is different
          const uniqueItems = items.map((item, idx) => ({
            identifier: `${item.identifier}-${idx}`,
            original: Buffer.from(item.original),
            updated: Buffer.from([...item.updated, idx]),
          }));

          // Save original baselines
          for (const item of uniqueItems) {
            await storageManager.saveBaseline(item.identifier, item.original);
          }

          // Create map of current screenshots
          const currentScreenshots = new Map<string, Buffer>();
          for (const item of uniqueItems) {
            currentScreenshots.set(item.identifier, Buffer.from(item.updated));
          }

          // Approve all changes
          await storageManager.approveChanges(currentScreenshots);

          // Check backup directory
          const backupDir = path.join(tempDir, '.visdiff/backups');
          const backupEntries = await fs.readdir(backupDir, { withFileTypes: true });
          const backupDirs = backupEntries.filter(e => e.isDirectory());

          expect(backupDirs.length).toBeGreaterThan(0);

          // Get the latest backup directory
          const latestBackupDir = backupDirs.sort((a, b) => b.name.localeCompare(a.name))[0];
          const backupPath = path.join(backupDir, latestBackupDir.name);

          // Verify all original baselines are backed up
          for (const item of uniqueItems) {
            const backupFilePath = path.join(backupPath, `${item.identifier}.png`);
            const backupContent = await fs.readFile(backupFilePath);
            expect(backupContent.equals(item.original)).toBe(true);
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should create timestamped backup directories', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.stringMatching(/^[a-z][a-z0-9-]{0,20}$/),
        fc.uint8Array({ minLength: 10, maxLength: 100 }),
        fc.uint8Array({ minLength: 10, maxLength: 100 }),
        async (identifier, originalData, newData) => {
          if (Buffer.from(originalData).equals(Buffer.from(newData))) {
            newData[0] = (newData[0] + 1) % 256;
          }

          const originalBaseline = Buffer.from(originalData);
          const newScreenshot = Buffer.from(newData);

          await storageManager.saveBaseline(identifier, originalBaseline);

          const currentScreenshots = new Map<string, Buffer>();
          currentScreenshots.set(identifier, newScreenshot);

          // Record time before approval
          const beforeApproval = new Date();

          await storageManager.approveChanges(currentScreenshots);

          // Check backup directory naming
          const backupDir = path.join(tempDir, '.visdiff/backups');
          const backupEntries = await fs.readdir(backupDir, { withFileTypes: true });
          const backupDirs = backupEntries.filter(e => e.isDirectory());

          expect(backupDirs.length).toBeGreaterThan(0);

          // Verify the backup directory name follows timestamp format (YYYY-MM-DD-HH-mm-ss)
          const latestBackupDir = backupDirs.sort((a, b) => b.name.localeCompare(a.name))[0];
          expect(latestBackupDir.name).toMatch(/^\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2}$/);

          // Parse the timestamp from the directory name
          const [year, month, day, hours, minutes, seconds] = latestBackupDir.name.split('-').map(Number);
          const backupTimestamp = new Date(year, month - 1, day, hours, minutes, seconds);

          // Verify the timestamp is reasonable (within a few seconds of approval time)
          const timeDiff = Math.abs(backupTimestamp.getTime() - beforeApproval.getTime());
          expect(timeDiff).toBeLessThan(5000); // Within 5 seconds
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle approval when no existing baselines exist', async () => {
    let iterationCount = 0;
    await fc.assert(
      fc.asyncProperty(
        fc.stringMatching(/^[a-z][a-z0-9-]{0,20}$/),
        fc.uint8Array({ minLength: 10, maxLength: 100 }),
        async (identifier, data) => {
          const uniqueIdentifier = `${identifier}-iter${iterationCount++}`;
          const screenshot = Buffer.from(data);

          // No existing baseline
          const currentScreenshots = new Map<string, Buffer>();
          currentScreenshots.set(uniqueIdentifier, screenshot);

          // Approve changes (should still create backup directory, even if empty)
          await storageManager.approveChanges(currentScreenshots);

          // Backup directory should exist
          const backupDir = path.join(tempDir, '.visdiff/backups');
          const backupExists = await fs.access(backupDir)
            .then(() => true)
            .catch(() => false);

          expect(backupExists).toBe(true);

          // There should be at least one backup directory (even if it's empty)
          const backupEntries = await fs.readdir(backupDir, { withFileTypes: true });
          const backupDirs = backupEntries.filter(e => e.isDirectory());
          expect(backupDirs.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});
