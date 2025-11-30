import { describe, it, expect, beforeEach } from 'vitest';
import { createMigrationEngine } from './migrations';
import { MemoryBackend } from '../backends/memory';
import type { StorageBackend, MigrationFunction } from '../types';

describe('MigrationEngine', () => {
  let backend: StorageBackend;

  beforeEach(async () => {
    backend = new MemoryBackend('test');
    await backend.init();
  });

  describe('Version Management', () => {
    it('should start at version 0', async () => {
      const migrations = {};
      const engine = createMigrationEngine(backend, migrations, 1);
      expect(await engine.getCurrentVersion()).toBe(0);
    });

    it('should detect when migration is needed', async () => {
      const migrations = {
        1: async () => {},
      };
      const engine = createMigrationEngine(backend, migrations, 1);
      expect(await engine.needsMigration()).toBe(true);
    });

    it('should not need migration when at target version', async () => {
      const migrations = {
        1: async () => {},
      };
      const engine = createMigrationEngine(backend, migrations, 1);
      await engine.migrate();
      expect(await engine.needsMigration()).toBe(false);
    });
  });

  describe('Migration Execution', () => {
    it('should run a single migration', async () => {
      let migrationRan = false;
      const migrations: Record<number, MigrationFunction> = {
        1: async () => {
          migrationRan = true;
        },
      };

      const engine = createMigrationEngine(backend, migrations, 1);
      await engine.migrate();

      expect(migrationRan).toBe(true);
      expect(await engine.getCurrentVersion()).toBe(1);
    });

    it('should run multiple migrations in order', async () => {
      const order: number[] = [];
      const migrations: Record<number, MigrationFunction> = {
        1: async () => {
          order.push(1);
        },
        2: async () => {
          order.push(2);
        },
        3: async () => {
          order.push(3);
        },
      };

      const engine = createMigrationEngine(backend, migrations, 3);
      await engine.migrate();

      expect(order).toEqual([1, 2, 3]);
      expect(await engine.getCurrentVersion()).toBe(3);
    });

    it('should transform data during migration', async () => {
      await backend.set('user', { userName: 'Alice' });

      const migrations: Record<number, MigrationFunction> = {
        1: async (store) => {
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

      const engine = createMigrationEngine(backend, migrations, 1);
      await engine.migrate();

      const user = await backend.get('user');
      expect(user).toEqual({ displayName: 'Alice' });
    });

    it('should skip already-run migrations', async () => {
      let count = 0;
      const migrations: Record<number, MigrationFunction> = {
        1: async () => {
          count++;
        },
      };

      const engine = createMigrationEngine(backend, migrations, 1);
      await engine.migrate();
      await engine.migrate(); // Run again

      expect(count).toBe(1); // Should only run once
    });
  });

  describe('Migration History', () => {
    it('should record successful migrations', async () => {
      const migrations: Record<number, MigrationFunction> = {
        1: async () => {},
      };

      const engine = createMigrationEngine(backend, migrations, 1);
      await engine.migrate();

      const history = await engine.getHistory();
      expect(history).toHaveLength(1);
      expect(history[0].version).toBe(1);
      expect(history[0].success).toBe(true);
    });

    it('should record failed migrations', async () => {
      const migrations: Record<number, MigrationFunction> = {
        1: async () => {
          throw new Error('Migration failed');
        },
      };

      const engine = createMigrationEngine(backend, migrations, 1);

      try {
        await engine.migrate();
      } catch {
        // Expected
      }

      const history = await engine.getHistory();
      expect(history).toHaveLength(1);
      expect(history[0].version).toBe(1);
      expect(history[0].success).toBe(false);
      expect(history[0].error).toContain('Migration failed');
    });
  });

  describe('Rollback', () => {
    it('should rollback on migration failure', async () => {
      await backend.set('data', 'original');

      const migrations: Record<number, MigrationFunction> = {
        1: async (store) => {
          await store.set('data', 'modified');
          throw new Error('Migration failed');
        },
      };

      const engine = createMigrationEngine(backend, migrations, 1);

      try {
        await engine.migrate();
      } catch {
        // Expected
      }

      const data = await backend.get('data');
      expect(data).toBe('original'); // Should be rolled back
    });

    it('should not rollback on successful migration', async () => {
      await backend.set('data', 'original');

      const migrations: Record<number, MigrationFunction> = {
        1: async (store) => {
          await store.set('data', 'modified');
        },
      };

      const engine = createMigrationEngine(backend, migrations, 1);
      await engine.migrate();

      const data = await backend.get('data');
      expect(data).toBe('modified');
    });
  });

  describe('Dry Run', () => {
    it('should validate migrations without running them', async () => {
      let migrationRan = false;
      const migrations: Record<number, MigrationFunction> = {
        1: async () => {
          migrationRan = true;
        },
      };

      const engine = createMigrationEngine(backend, migrations, 1);
      await engine.migrate({ dryRun: true });

      expect(migrationRan).toBe(false);
      expect(await engine.getCurrentVersion()).toBe(0);
    });

    it('should not throw if no migrations needed in dry run', async () => {
      const migrations: Record<number, MigrationFunction> = {};
      const engine = createMigrationEngine(backend, migrations, 1);

      // No migrations to run, should not throw
      await engine.migrate({ dryRun: true });
    });
  });

  describe('Progress Callback', () => {
    it('should call progress callback during migration', async () => {
      const progress: number[] = [];
      const migrations: Record<number, MigrationFunction> = {
        1: async () => {},
        2: async () => {},
        3: async () => {},
      };

      const engine = createMigrationEngine(backend, migrations, 3);
      await engine.migrate({
        onProgress: (version) => {
          progress.push(version);
        },
      });

      expect(progress).toEqual([1, 2, 3]);
    });
  });

  describe('Validation', () => {
    it('should validate migrations successfully', async () => {
      const migrations: Record<number, MigrationFunction> = {
        1: async () => {},
        2: async () => {},
      };

      const engine = createMigrationEngine(backend, migrations, 2);
      const result = await engine.validate();

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect invalid version numbers', async () => {
      const migrations: Record<number, MigrationFunction> = {
        0: async () => {},
        1: async () => {},
      };

      const engine = createMigrationEngine(backend, migrations, 1);
      const result = await engine.validate();

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid version number: 0');
    });

    it('should detect non-function migrations', async () => {
      const migrations: any = {
        1: 'not a function',
      };

      const engine = createMigrationEngine(backend, migrations, 1);
      const result = await engine.validate();

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('not a function'))).toBe(true);
    });

    it('should detect missing target version', async () => {
      const migrations: Record<number, MigrationFunction> = {
        1: async () => {},
      };

      const engine = createMigrationEngine(backend, migrations, 2);
      const result = await engine.validate();

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Target version 2 has no migration defined');
    });
  });

  describe('Reset', () => {
    it('should reset migration state', async () => {
      const migrations: Record<number, MigrationFunction> = {
        1: async () => {},
      };

      const engine = createMigrationEngine(backend, migrations, 1);
      await engine.migrate();

      expect(await engine.getCurrentVersion()).toBe(1);

      await engine.reset();
      expect(await engine.getCurrentVersion()).toBe(0);
    });
  });
});
