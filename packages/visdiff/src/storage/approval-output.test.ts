/**
 * Property test for approval output listing
 * Feature: visdiff-phase1, Property 18: Approval output listing
 * Validates: Requirements 4.3
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { StorageManager } from './storage-manager';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

describe('Property 18: Approval output listing', () => {
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

  it('should output a list containing all baselines that were updated', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            identifier: fc.stringMatching(/^[a-z][a-z0-9-]{0,15}$/),
            data: fc.uint8Array({ minLength: 10, maxLength: 50 }),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        async (items) => {
          // Make identifiers unique
          const uniqueItems = items.map((item, idx) => {
            const newData = Buffer.alloc(item.data.length + 1);
            item.data.copy(newData);
            newData[item.data.length] = idx;
            return {
              identifier: `${item.identifier}-${idx}`,
              data: newData,
            };
          });

          // Create map of current screenshots
          const currentScreenshots = new Map<string, Buffer>();
          for (const item of uniqueItems) {
            currentScreenshots.set(item.identifier, item.data);
          }

          // Approve changes
          const approved = await storageManager.approveChanges(currentScreenshots);

          // Verify the output list contains all updated baselines
          expect(approved).toHaveLength(uniqueItems.length);
          
          // Verify each identifier appears in the output
          for (const item of uniqueItems) {
            expect(approved).toContain(item.identifier);
          }

          // Verify no duplicates in the output
          const uniqueApproved = new Set(approved);
          expect(uniqueApproved.size).toBe(approved.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should output only the identifiers that were actually updated', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            identifier: fc.stringMatching(/^[a-z][a-z0-9-]{0,15}$/),
            data: fc.uint8Array({ minLength: 10, maxLength: 50 }),
          }),
          { minLength: 2, maxLength: 10 }
        ),
        fc.array(fc.stringMatching(/^[a-z][a-z0-9-]{0,15}$/), { minLength: 1, maxLength: 5 }),
        async (items, extraIdentifiers) => {
          // Make identifiers unique
          const uniqueItems = items.map((item, idx) => {
            const newData = Buffer.alloc(item.data.length + 1);
            item.data.copy(newData);
            newData[item.data.length] = idx;
            return {
              identifier: `${item.identifier}-${idx}`,
              data: newData,
            };
          });

          // Create map with only some screenshots
          const currentScreenshots = new Map<string, Buffer>();
          for (const item of uniqueItems) {
            currentScreenshots.set(item.identifier, item.data);
          }

          // Try to approve with extra identifiers that don't have screenshots
          const toApprove = [
            ...uniqueItems.map(i => i.identifier),
            ...extraIdentifiers.map((id, idx) => `${id}-extra-${idx}`)
          ];

          const approved = await storageManager.approveChanges(currentScreenshots, toApprove);

          // Verify only the identifiers with actual screenshots were approved
          expect(approved).toHaveLength(uniqueItems.length);
          
          for (const item of uniqueItems) {
            expect(approved).toContain(item.identifier);
          }

          // Verify extra identifiers are NOT in the output
          for (const extraId of extraIdentifiers) {
            const extraIdWithSuffix = extraId.match(/^[a-z][a-z0-9-]{0,15}$/) 
              ? extraIdentifiers.map((id, idx) => `${id}-extra-${idx}`)
              : [];
            for (const id of extraIdWithSuffix) {
              expect(approved).not.toContain(id);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should output an empty list when no baselines are updated', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.stringMatching(/^[a-z][a-z0-9-]{0,15}$/), { minLength: 1, maxLength: 5 }),
        async (identifiers) => {
          // Make identifiers unique
          const uniqueIdentifiers = identifiers.map((id, idx) => `${id}-${idx}`);

          // Create empty map of current screenshots
          const currentScreenshots = new Map<string, Buffer>();

          // Try to approve with identifiers that don't have screenshots
          const approved = await storageManager.approveChanges(currentScreenshots, uniqueIdentifiers);

          // Verify output is empty
          expect(approved).toHaveLength(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should output list in consistent order matching the input', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            identifier: fc.stringMatching(/^[a-z][a-z0-9-]{0,15}$/),
            data: fc.uint8Array({ minLength: 10, maxLength: 50 }),
          }),
          { minLength: 2, maxLength: 10 }
        ),
        async (items) => {
          // Make identifiers unique
          const uniqueItems = items.map((item, idx) => {
            const newData = Buffer.alloc(item.data.length + 1);
            item.data.copy(newData);
            newData[item.data.length] = idx;
            return {
              identifier: `${item.identifier}-${idx}`,
              data: newData,
            };
          });

          // Create map of current screenshots
          const currentScreenshots = new Map<string, Buffer>();
          for (const item of uniqueItems) {
            currentScreenshots.set(item.identifier, item.data);
          }

          // Approve with explicit order
          const orderedIdentifiers = uniqueItems.map(i => i.identifier);
          const approved = await storageManager.approveChanges(currentScreenshots, orderedIdentifiers);

          // Verify the output maintains the same order
          expect(approved).toEqual(orderedIdentifiers);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should output list containing only successfully saved baselines', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            identifier: fc.stringMatching(/^[a-z][a-z0-9-]{0,15}$/),
            data: fc.uint8Array({ minLength: 10, maxLength: 50 }),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        async (items) => {
          // Make identifiers unique
          const uniqueItems = items.map((item, idx) => {
            const newData = Buffer.alloc(item.data.length + 1);
            item.data.copy(newData);
            newData[item.data.length] = idx;
            return {
              identifier: `${item.identifier}-${idx}`,
              data: newData,
            };
          });

          // Create map of current screenshots
          const currentScreenshots = new Map<string, Buffer>();
          for (const item of uniqueItems) {
            currentScreenshots.set(item.identifier, item.data);
          }

          // Approve changes
          const approved = await storageManager.approveChanges(currentScreenshots);

          // Verify each identifier in the output has a corresponding saved baseline
          for (const identifier of approved) {
            const loaded = await storageManager.loadBaseline(identifier);
            expect(loaded).not.toBeNull();
            
            // Verify it matches the screenshot we approved
            const expectedData = currentScreenshots.get(identifier);
            expect(loaded?.equals(expectedData!)).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
