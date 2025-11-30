import { describe, it, expect, afterEach } from 'vitest';
import { createStorage } from './storage';
import type { Storage, MigrationFunction } from './types';

const hasIndexedDB = typeof indexedDB !== 'undefined';

describe('Storage with Migrations', () => {
  let storage: Storage;

  afterEach(async () => {
    if (storage) {
      await storage.dispose();
    }
  });

  describe.skipIf(!hasIndexedDB)('IndexedDB with Migrations', () => {
    it('should create storage with migrations', async () => {
      const migrations: Record<number, MigrationFunction> = {
        1: async () => {},
      };

      storage = await createStorage({
        backend: 'indexeddb',
        name: 'test-migrations-db',
        version: 1,
        migrations,
      });

      expect(storage.activeBackend).toBe('indexeddb');
      expect(storage.features.migrations).toBe(true);
    });

    it('should run migrations on initialization', async () => {
      let migrationRan = false;

      const migrations: Record<number, MigrationFunction> = {
        1: async () => {
          migrationRan = true;
        },
      };

      storage = await createStorage({
        backend: 'indexeddb',
        name: 'test-init-migrations',
        version: 1,
        migrations,
      });

      expect(migrationRan).toBe(true);
    });

    it('should migrate data between versions', async () => {
      // Create storage v1 with old data structure
      const storageV1 = await createStorage({
        backend: 'indexeddb',
        name: 'test-version-migration',
        version: 1,
        migrations: {
          1: async () => {},
        },
      });

      await storageV1.set('user', { userName: 'Alice', age: 30 });
      await storageV1.dispose();

      // Upgrade to v2 with migration
      const migrations: Record<number, MigrationFunction> = {
        1: async () => {},
        2: async (store) => {
          const entries = await store.entries();
          for (const [key, value] of entries) {
            if (value.userName) {
              value.displayName = value.userName;
              delete value.userName;
              await store.set(key, value);
            }
          }
        },
      };

      storage = await createStorage({
        backend: 'indexeddb',
        name: 'test-version-migration',
        version: 2,
        migrations,
      });

      const user = await storage.get('user');
      expect(user).toEqual({ displayName: 'Alice', age: 30 });
    });

    it('should handle multiple sequential migrations', async () => {
      const storageV1 = await createStorage({
        backend: 'indexeddb',
        name: 'test-multi-migration',
        version: 1,
        migrations: {
          1: async () => {},
        },
      });

      await storageV1.set('user', { name: 'Alice' });
      await storageV1.dispose();

      const migrations: Record<number, MigrationFunction> = {
        1: async () => {},
        2: async (store) => {
          const entries = await store.entries();
          for (const [key, value] of entries) {
            value.version = 2;
            await store.set(key, value);
          }
        },
        3: async (store) => {
          const entries = await store.entries();
          for (const [key, value] of entries) {
            value.version = 3;
            value.migrated = true;
            await store.set(key, value);
          }
        },
      };

      storage = await createStorage({
        backend: 'indexeddb',
        name: 'test-multi-migration',
        version: 3,
        migrations,
      });

      const user = await storage.get('user');
      expect(user).toEqual({ name: 'Alice', version: 3, migrated: true });
    });

    it('should throw error on invalid migrations', async () => {
      const migrations: Record<number, MigrationFunction> = {
        1: async () => {
          throw new Error('Migration error');
        },
      };

      await expect(
        createStorage({
          backend: 'indexeddb',
          name: 'test-invalid-migration',
          version: 1,
          migrations,
        }),
      ).rejects.toThrow('Migration');
    });

    it('should validate migrations before running', async () => {
      const migrations: any = {
        1: 'not a function',
      };

      await expect(
        createStorage({
          backend: 'indexeddb',
          name: 'test-validation',
          version: 1,
          migrations,
        }),
      ).rejects.toThrow('Migration validation failed');
    });
  });

  describe('Memory Backend with Migrations', () => {
    it('should support migrations on memory backend', async () => {
      let migrationRan = false;

      const migrations: Record<number, MigrationFunction> = {
        1: async () => {
          migrationRan = true;
        },
      };

      storage = await createStorage({
        backend: 'memory',
        name: 'test-memory-migrations',
        version: 1,
        migrations,
      });

      expect(migrationRan).toBe(true);
      expect(storage.features.migrations).toBe(false); // Memory doesn't persist migrations
    });
  });

  describe('Fallback with Migrations', () => {
    it('should run migrations on fallback backend', async () => {
      let migrationRan = false;

      const migrations: Record<number, MigrationFunction> = {
        1: async () => {
          migrationRan = true;
        },
      };

      storage = await createStorage({
        backend: ['indexeddb', 'memory'],
        name: 'test-fallback-migrations',
        version: 1,
        migrations,
      });

      expect(migrationRan).toBe(true);
    });
  });
});
