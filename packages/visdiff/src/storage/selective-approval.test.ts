/**
 * Property test for selective approval
 * Feature: visdiff-phase1, Property 19: Selective approval
 * Validates: Requirements 4.5
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { StorageManager } from './storage-manager';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

describe('Property 19: Selective approval', () => {
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

  it('should only update baselines for specified identifiers', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            identifier: fc.stringMatching(/^[a-z][a-z0-9-]{0,15}$/),
            original: fc.uint8Array({ minLength: 10, maxLength: 50 }),
            updated: fc.uint8Array({ minLength: 10, maxLength: 50 }),
          }),
          { minLength: 3, maxLength: 10 },
        ),
        async (items) => {
          // Make identifiers unique and ensure data is different
          const uniqueItems = items.map((item, idx) => ({
            identifier: `${item.identifier}-${idx}`,
            original: Buffer.from(item.original),
            updated: Buffer.from([...item.updated, idx]),
          }));

          // Save original baselines for all items
          for (const item of uniqueItems) {
            await storageManager.saveBaseline(item.identifier, item.original);
          }

          // Create map of current screenshots for all items
          const currentScreenshots = new Map<string, Buffer>();
          for (const item of uniqueItems) {
            currentScreenshots.set(item.identifier, Buffer.from(item.updated));
          }

          // Select a subset to approve (at least 1, but not all)
          const numToApprove = Math.max(1, Math.floor(uniqueItems.length / 2));
          const toApprove = uniqueItems.slice(0, numToApprove).map((item) => item.identifier);
          const notToApprove = uniqueItems.slice(numToApprove);

          // Approve only the selected identifiers
          const approved = await storageManager.approveChanges(currentScreenshots, toApprove);

          // Verify only the selected identifiers were approved
          expect(approved.length).toBe(toApprove.length);
          for (const id of toApprove) {
            expect(approved).toContain(id);
          }

          // Verify approved baselines were updated
          for (const item of uniqueItems.slice(0, numToApprove)) {
            const loaded = await storageManager.loadBaseline(item.identifier);
            expect(loaded).not.toBeNull();
            expect(loaded?.equals(item.updated)).toBe(true);
            expect(loaded?.equals(item.original)).toBe(false);
          }

          // Verify non-approved baselines remain unchanged
          for (const item of notToApprove) {
            const loaded = await storageManager.loadBaseline(item.identifier);
            expect(loaded).not.toBeNull();
            expect(loaded?.equals(item.original)).toBe(true);
            expect(loaded?.equals(item.updated)).toBe(false);
          }
        },
      ),
      { numRuns: 50 },
    );
  });

  it('should handle selective approval with single identifier', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            identifier: fc.stringMatching(/^[a-z][a-z0-9-]{0,15}$/),
            original: fc.uint8Array({ minLength: 10, maxLength: 50 }),
            updated: fc.uint8Array({ minLength: 10, maxLength: 50 }),
          }),
          { minLength: 2, maxLength: 5 },
        ),
        async (items) => {
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

          // Approve only the first identifier
          const toApprove = [uniqueItems[0].identifier];
          const approved = await storageManager.approveChanges(currentScreenshots, toApprove);

          // Verify only one was approved
          expect(approved.length).toBe(1);
          expect(approved[0]).toBe(uniqueItems[0].identifier);

          // Verify first baseline was updated
          const firstLoaded = await storageManager.loadBaseline(uniqueItems[0].identifier);
          expect(firstLoaded?.equals(uniqueItems[0].updated)).toBe(true);

          // Verify others remain unchanged
          for (let i = 1; i < uniqueItems.length; i++) {
            const loaded = await storageManager.loadBaseline(uniqueItems[i].identifier);
            expect(loaded?.equals(uniqueItems[i].original)).toBe(true);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should handle selective approval with non-existent identifiers gracefully', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            identifier: fc.stringMatching(/^[a-z][a-z0-9-]{0,15}$/),
            original: fc.uint8Array({ minLength: 10, maxLength: 50 }),
            updated: fc.uint8Array({ minLength: 10, maxLength: 50 }),
          }),
          { minLength: 2, maxLength: 5 },
        ),
        fc.stringMatching(/^nonexistent-[a-z0-9]{5}$/),
        async (items, nonExistentId) => {
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

          // Try to approve a mix of existing and non-existent identifiers
          const toApprove = [uniqueItems[0].identifier, nonExistentId];
          const approved = await storageManager.approveChanges(currentScreenshots, toApprove);

          // Should only approve the existing one
          expect(approved.length).toBe(1);
          expect(approved[0]).toBe(uniqueItems[0].identifier);
          expect(approved).not.toContain(nonExistentId);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should handle empty selective approval list', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            identifier: fc.stringMatching(/^[a-z][a-z0-9-]{0,15}$/),
            original: fc.uint8Array({ minLength: 10, maxLength: 50 }),
            updated: fc.uint8Array({ minLength: 10, maxLength: 50 }),
          }),
          { minLength: 2, maxLength: 5 },
        ),
        async (items) => {
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

          // Approve with empty list
          const approved = await storageManager.approveChanges(currentScreenshots, []);

          // Should approve nothing
          expect(approved.length).toBe(0);

          // Verify all baselines remain unchanged
          for (const item of uniqueItems) {
            const loaded = await storageManager.loadBaseline(item.identifier);
            expect(loaded?.equals(item.original)).toBe(true);
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
