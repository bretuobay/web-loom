/**
 * Schema migration engine
 */

import type { StorageBackend, MigrationFunction } from '../types';

const MIGRATION_VERSION_KEY = '__migration_version__';
const MIGRATION_HISTORY_KEY = '__migration_history__';

export interface MigrationHistoryEntry {
  version: number;
  timestamp: number;
  success: boolean;
  error?: string;
}

export interface MigrationOptions {
  dryRun?: boolean;
  onProgress?: (version: number, total: number) => void;
}

/**
 * Migration engine for handling schema versioning
 */
export class MigrationEngine {
  private backend: StorageBackend;
  private migrations: Record<number, MigrationFunction>;
  private targetVersion: number;

  constructor(backend: StorageBackend, migrations: Record<number, MigrationFunction>, targetVersion: number) {
    this.backend = backend;
    this.migrations = migrations;
    this.targetVersion = targetVersion;
  }

  /**
   * Get the current migration version
   */
  async getCurrentVersion(): Promise<number> {
    const version = await this.backend.get<number>(MIGRATION_VERSION_KEY);
    return version ?? 0;
  }

  /**
   * Set the current migration version
   */
  private async setCurrentVersion(version: number): Promise<void> {
    await this.backend.set(MIGRATION_VERSION_KEY, version);
  }

  /**
   * Get migration history
   */
  async getHistory(): Promise<MigrationHistoryEntry[]> {
    const history = await this.backend.get<MigrationHistoryEntry[]>(MIGRATION_HISTORY_KEY);
    return history ?? [];
  }

  /**
   * Add entry to migration history
   */
  private async addHistoryEntry(entry: MigrationHistoryEntry): Promise<void> {
    const history = await this.getHistory();
    history.push(entry);
    await this.backend.set(MIGRATION_HISTORY_KEY, history);
  }

  /**
   * Check if migrations are needed
   */
  async needsMigration(): Promise<boolean> {
    const currentVersion = await this.getCurrentVersion();
    return currentVersion < this.targetVersion;
  }

  /**
   * Run all pending migrations
   */
  async migrate(options: MigrationOptions = {}): Promise<void> {
    const currentVersion = await this.getCurrentVersion();

    if (currentVersion >= this.targetVersion) {
      return; // Already at target version
    }

    // Get versions to migrate
    const versionsToMigrate = this.getVersionsToMigrate(currentVersion, this.targetVersion);

    if (versionsToMigrate.length === 0) {
      return;
    }

    // Dry run mode - just validate migrations exist
    if (options.dryRun) {
      for (const version of versionsToMigrate) {
        if (!this.migrations[version]) {
          throw new Error(`Migration for version ${version} not found`);
        }
      }
      return;
    }

    // Create backup before migration
    const backup = await this.createBackup();

    try {
      // Run migrations sequentially
      for (let i = 0; i < versionsToMigrate.length; i++) {
        const version = versionsToMigrate[i];

        if (options.onProgress) {
          options.onProgress(version, versionsToMigrate.length);
        }

        await this.runMigration(version);
      }
    } catch (error) {
      // Rollback on failure
      await this.rollback(backup);
      throw error;
    }
  }

  /**
   * Run a single migration
   */
  private async runMigration(version: number): Promise<void> {
    const migration = this.migrations[version];

    if (!migration) {
      throw new Error(`Migration for version ${version} not found`);
    }

    try {
      // Run the migration
      await migration(this.backend);

      // Update version
      await this.setCurrentVersion(version);

      // Record success
      await this.addHistoryEntry({
        version,
        timestamp: Date.now(),
        success: true,
      });
    } catch (error) {
      // Record failure
      await this.addHistoryEntry({
        version,
        timestamp: Date.now(),
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });

      throw new Error(
        `Migration to version ${version} failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Get list of versions to migrate
   */
  private getVersionsToMigrate(currentVersion: number, targetVersion: number): number[] {
    const versions: number[] = [];

    for (let v = currentVersion + 1; v <= targetVersion; v++) {
      if (this.migrations[v]) {
        versions.push(v);
      }
    }

    return versions;
  }

  /**
   * Create a backup of current data
   */
  private async createBackup(): Promise<Map<string, any>> {
    const entries = await this.backend.entries();
    const backup = new Map<string, any>();

    for (const [key, value] of entries) {
      // Don't backup migration metadata
      if (key !== MIGRATION_VERSION_KEY && key !== MIGRATION_HISTORY_KEY) {
        backup.set(key, value);
      }
    }

    return backup;
  }

  /**
   * Rollback to a previous backup
   */
  private async rollback(backup: Map<string, any>): Promise<void> {
    // Clear current data (except migration metadata)
    const currentKeys = await this.backend.keys();

    for (const key of currentKeys) {
      if (key !== MIGRATION_VERSION_KEY && key !== MIGRATION_HISTORY_KEY) {
        await this.backend.delete(key);
      }
    }

    // Restore backup
    for (const [key, value] of backup.entries()) {
      await this.backend.set(key, value);
    }
  }

  /**
   * Validate all migrations
   */
  async validate(): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Check that migrations are sequential
    const versions = Object.keys(this.migrations)
      .map(Number)
      .sort((a, b) => a - b);

    for (let i = 0; i < versions.length; i++) {
      const version = versions[i];

      // Check version is positive
      if (version <= 0) {
        errors.push(`Invalid version number: ${version}`);
      }

      // Check migration function exists
      if (typeof this.migrations[version] !== 'function') {
        errors.push(`Migration for version ${version} is not a function`);
      }
    }

    // Check target version exists
    if (this.targetVersion > 0 && !this.migrations[this.targetVersion]) {
      errors.push(`Target version ${this.targetVersion} has no migration defined`);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Reset migrations (for testing)
   */
  async reset(): Promise<void> {
    await this.backend.delete(MIGRATION_VERSION_KEY);
    await this.backend.delete(MIGRATION_HISTORY_KEY);
  }
}

/**
 * Create a migration engine
 */
export function createMigrationEngine(
  backend: StorageBackend,
  migrations: Record<number, MigrationFunction>,
  targetVersion: number,
): MigrationEngine {
  return new MigrationEngine(backend, migrations, targetVersion);
}
