import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { mkdir, writeFile, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import {
  loadConfig,
  saveConfig,
  loadResolvedConfig,
  CONFIG_FILE_NAME,
} from './loader.js';
import { DEFAULT_CONFIG } from './schema.js';

describe('Configuration Preservation', () => {
  // Helper to create a unique test directory
  const createTestDir = async (): Promise<string> => {
    const dir = join(tmpdir(), `visdiff-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    await mkdir(dir, { recursive: true });
    return dir;
  };

  // Helper to cleanup test directory
  const cleanupTestDir = async (dir: string): Promise<void> => {
    try {
      await rm(dir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  };

  /**
   * Feature: visdiff-phase1, Property 2: Configuration preservation on re-initialization
   * For any existing configuration file, running the init command should preserve
   * the existing configuration without overwriting it
   * Validates: Requirements 1.4
   */
  it('should preserve existing configuration on re-initialization', () => {
    fc.assert(
      fc.asyncProperty(
        fc.record({
          viewports: fc.array(
            fc.record({
              width: fc.integer({ min: 1, max: 7680 }),
              height: fc.integer({ min: 1, max: 4320 }),
              name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
            }),
            { minLength: 1, maxLength: 3 }
          ),
          paths: fc.array(
            fc.constantFrom(
              'http://localhost:3000',
              'https://example.com',
              'http://localhost:8080'
            ),
            { minLength: 1, maxLength: 3 }
          ),
          captureOptions: fc.record({
            fullPage: fc.boolean(),
            omitBackground: fc.boolean(),
            timeout: fc.integer({ min: 1000, max: 60000 }),
          }),
          diffOptions: fc.record({
            threshold: fc.double({ min: 0, max: 1, noNaN: true }),
            ignoreAntialiasing: fc.boolean(),
            ignoreColors: fc.boolean(),
            highlightColor: fc.constantFrom('#FF0000', '#00FF00', '#0000FF'),
          }),
          storage: fc.record({
            baselineDir: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
            diffDir: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
            format: fc.constantFrom('png', 'jpeg'),
          }),
        }),
        async (existingConfig) => {
          const testDir = await createTestDir();
          try {
            // Step 1: Create an existing configuration file
            const configPath = join(testDir, CONFIG_FILE_NAME);
            await writeFile(
              configPath,
              `export default ${JSON.stringify(existingConfig, null, 2)};`,
              'utf-8'
            );

            // Step 2: Load the configuration (simulating first init)
            const loadedConfig1 = await loadConfig(testDir);

            // Step 3: Save the resolved configuration
            await saveConfig(loadedConfig1, testDir);

            // Step 4: Load the configuration again (simulating re-initialization)
            const loadedConfig2 = await loadConfig(testDir);

            // Step 5: Verify that the configuration is preserved
            expect(loadedConfig2.viewports).toEqual(loadedConfig1.viewports);
            expect(loadedConfig2.paths).toEqual(loadedConfig1.paths);
            expect(loadedConfig2.captureOptions).toEqual(loadedConfig1.captureOptions);
            expect(loadedConfig2.diffOptions).toEqual(loadedConfig1.diffOptions);
            expect(loadedConfig2.storage).toEqual(loadedConfig1.storage);

            // Step 6: Verify that the user config file still exists and is unchanged
            const reloadedUserConfig = await loadConfig(testDir);
            expect(reloadedUserConfig.viewports).toEqual(existingConfig.viewports);
            expect(reloadedUserConfig.paths).toEqual(existingConfig.paths);
          } finally {
            await cleanupTestDir(testDir);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not overwrite existing user configuration file', async () => {
    const testDir = await createTestDir();
    try {
      // Create an initial configuration
      const initialConfig = {
        viewports: [{ width: 800, height: 600, name: 'custom' }],
        paths: ['http://localhost:5000'],
      };

      const configPath = join(testDir, CONFIG_FILE_NAME);
      await writeFile(
        configPath,
        `export default ${JSON.stringify(initialConfig, null, 2)};`,
        'utf-8'
      );

      // Load and save configuration (simulating init)
      const loaded = await loadConfig(testDir);
      await saveConfig(loaded, testDir);

      // Load configuration again
      const reloaded = await loadConfig(testDir);

      // User configuration should be preserved
      expect(reloaded.viewports).toEqual(initialConfig.viewports);
      expect(reloaded.paths).toEqual(initialConfig.paths);
    } finally {
      await cleanupTestDir(testDir);
    }
  });

  it('should preserve resolved configuration across multiple loads', () => {
    fc.assert(
      fc.asyncProperty(
        fc.record({
          viewports: fc.array(
            fc.record({
              width: fc.integer({ min: 1, max: 7680 }),
              height: fc.integer({ min: 1, max: 4320 }),
              name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
            }),
            { minLength: 1, maxLength: 3 }
          ),
          paths: fc.array(
            fc.constantFrom('http://localhost:3000', 'https://example.com'),
            { minLength: 1, maxLength: 3 }
          ),
        }),
        async (userConfig) => {
          const testDir = await createTestDir();
          try {
            // Create user configuration
            const configPath = join(testDir, CONFIG_FILE_NAME);
            await writeFile(
              configPath,
              `export default ${JSON.stringify(userConfig, null, 2)};`,
              'utf-8'
            );

            // Load and save
            const config1 = await loadConfig(testDir);
            await saveConfig(config1, testDir);

            // Load resolved config multiple times
            const resolved1 = await loadResolvedConfig(testDir);
            const resolved2 = await loadResolvedConfig(testDir);
            const resolved3 = await loadResolvedConfig(testDir);

            // All loads should return the same configuration
            expect(resolved1).toEqual(resolved2);
            expect(resolved2).toEqual(resolved3);
            expect(resolved1).toEqual(config1);
          } finally {
            await cleanupTestDir(testDir);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle re-initialization with default config', async () => {
    const testDir = await createTestDir();
    try {
      // First initialization with no config file
      const config1 = await loadConfig(testDir);
      expect(config1).toEqual(DEFAULT_CONFIG);

      // Save the configuration
      await saveConfig(config1, testDir);

      // Re-initialization should still return default config
      const config2 = await loadConfig(testDir);
      expect(config2).toEqual(DEFAULT_CONFIG);

      // Resolved config should match
      const resolved = await loadResolvedConfig(testDir);
      expect(resolved).toEqual(DEFAULT_CONFIG);
    } finally {
      await cleanupTestDir(testDir);
    }
  });

  it('should preserve partial user configurations', () => {
    fc.assert(
      fc.asyncProperty(
        fc.record({
          paths: fc.option(
            fc.array(
              fc.constantFrom('http://localhost:3000', 'https://example.com'),
              { minLength: 1, maxLength: 2 }
            ),
            { nil: undefined }
          ),
          captureOptions: fc.option(
            fc.record({
              timeout: fc.integer({ min: 5000, max: 60000 }),
            }),
            { nil: undefined }
          ),
        }).filter(config => config.paths !== undefined || config.captureOptions !== undefined),
        async (partialConfig) => {
          const testDir = await createTestDir();
          try {
            // Create partial user configuration
            const configPath = join(testDir, CONFIG_FILE_NAME);
            await writeFile(
              configPath,
              `export default ${JSON.stringify(partialConfig, null, 2)};`,
              'utf-8'
            );

            // Load configuration
            const loaded1 = await loadConfig(testDir);

            // Save and reload
            await saveConfig(loaded1, testDir);
            const loaded2 = await loadConfig(testDir);

            // User-specified values should be preserved
            if (partialConfig.paths) {
              expect(loaded2.paths).toEqual(partialConfig.paths);
            }

            if (partialConfig.captureOptions?.timeout) {
              expect(loaded2.captureOptions.timeout).toBe(partialConfig.captureOptions.timeout);
            }

            // Defaults should be filled in for unspecified values
            expect(loaded2.viewports).toBeDefined();
            expect(loaded2.diffOptions).toBeDefined();
            expect(loaded2.storage).toBeDefined();
          } finally {
            await cleanupTestDir(testDir);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
