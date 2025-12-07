import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdir, writeFile, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import {
  loadConfig,
  saveConfig,
  loadResolvedConfig,
  configExists,
  resolvedConfigExists,
  ConfigurationError,
  CONFIG_FILE_NAME,
  RESOLVED_CONFIG_DIR,
  RESOLVED_CONFIG_FILE,
} from './loader.js';
import { DEFAULT_CONFIG, type VisDiffConfig } from './schema.js';

describe('Configuration Loader', () => {
  let testDir: string;

  beforeEach(async () => {
    // Create a unique temporary directory for each test
    testDir = join(tmpdir(), `visdiff-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    // Clean up test directory
    try {
      await rm(testDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('loadConfig', () => {
    it('should return default config when no config file exists', async () => {
      const config = await loadConfig(testDir);
      expect(config).toEqual(DEFAULT_CONFIG);
    });

    it('should load and merge user config with defaults', async () => {
      const userConfig = {
        viewports: [{ width: 1024, height: 768, name: 'custom' }],
        paths: ['http://localhost:4000'],
      };

      const configPath = join(testDir, CONFIG_FILE_NAME);
      await writeFile(
        configPath,
        `export default ${JSON.stringify(userConfig, null, 2)};`,
        'utf-8'
      );

      const config = await loadConfig(testDir);

      expect(config.viewports).toEqual(userConfig.viewports);
      expect(config.paths).toEqual(userConfig.paths);
      // Should have default values for other fields
      expect(config.captureOptions).toEqual(DEFAULT_CONFIG.captureOptions);
      expect(config.diffOptions).toEqual(DEFAULT_CONFIG.diffOptions);
      expect(config.storage).toEqual(DEFAULT_CONFIG.storage);
    });

    it('should throw ConfigurationError for invalid config', async () => {
      const invalidConfig = {
        viewports: [], // Invalid: empty array
        paths: ['http://localhost:3000'],
      };

      const configPath = join(testDir, CONFIG_FILE_NAME);
      await writeFile(
        configPath,
        `export default ${JSON.stringify(invalidConfig, null, 2)};`,
        'utf-8'
      );

      await expect(loadConfig(testDir)).rejects.toThrow(ConfigurationError);
    });

    it('should handle missing configuration files gracefully', async () => {
      const config = await loadConfig(testDir);
      expect(config).toBeDefined();
      expect(config.viewports).toBeDefined();
      expect(config.paths).toBeDefined();
    });
  });

  describe('saveConfig', () => {
    it('should save configuration to .visdiff/config.json', async () => {
      await saveConfig(DEFAULT_CONFIG, testDir);

      const configPath = join(testDir, RESOLVED_CONFIG_DIR, RESOLVED_CONFIG_FILE);
      const exists = await resolvedConfigExists(testDir);
      expect(exists).toBe(true);
    });

    it('should create .visdiff directory if it does not exist', async () => {
      await saveConfig(DEFAULT_CONFIG, testDir);

      const configPath = join(testDir, RESOLVED_CONFIG_DIR, RESOLVED_CONFIG_FILE);
      const exists = await resolvedConfigExists(testDir);
      expect(exists).toBe(true);
    });

    it('should throw ConfigurationError for invalid config', async () => {
      const invalidConfig = {
        ...DEFAULT_CONFIG,
        viewports: [], // Invalid: empty array
      } as VisDiffConfig;

      await expect(saveConfig(invalidConfig, testDir)).rejects.toThrow(ConfigurationError);
    });

    it('should save valid JSON that can be loaded back', async () => {
      await saveConfig(DEFAULT_CONFIG, testDir);

      const loaded = await loadResolvedConfig(testDir);
      expect(loaded).toEqual(DEFAULT_CONFIG);
    });
  });

  describe('loadResolvedConfig', () => {
    it('should return null when no resolved config exists', async () => {
      const config = await loadResolvedConfig(testDir);
      expect(config).toBeNull();
    });

    it('should load saved configuration', async () => {
      await saveConfig(DEFAULT_CONFIG, testDir);

      const loaded = await loadResolvedConfig(testDir);
      expect(loaded).toEqual(DEFAULT_CONFIG);
    });

    it('should throw ConfigurationError for invalid JSON', async () => {
      const configDir = join(testDir, RESOLVED_CONFIG_DIR);
      const configPath = join(configDir, RESOLVED_CONFIG_FILE);

      await mkdir(configDir, { recursive: true });
      await writeFile(configPath, 'invalid json', 'utf-8');

      await expect(loadResolvedConfig(testDir)).rejects.toThrow();
    });

    it('should throw ConfigurationError for invalid config schema', async () => {
      const configDir = join(testDir, RESOLVED_CONFIG_DIR);
      const configPath = join(configDir, RESOLVED_CONFIG_FILE);

      await mkdir(configDir, { recursive: true });
      await writeFile(
        configPath,
        JSON.stringify({ viewports: [], paths: [] }), // Invalid
        'utf-8'
      );

      await expect(loadResolvedConfig(testDir)).rejects.toThrow(ConfigurationError);
    });
  });

  describe('configExists', () => {
    it('should return false when config file does not exist', async () => {
      const exists = await configExists(testDir);
      expect(exists).toBe(false);
    });

    it('should return true when config file exists', async () => {
      const configPath = join(testDir, CONFIG_FILE_NAME);
      await writeFile(configPath, 'export default {};', 'utf-8');

      const exists = await configExists(testDir);
      expect(exists).toBe(true);
    });
  });

  describe('resolvedConfigExists', () => {
    it('should return false when resolved config does not exist', async () => {
      const exists = await resolvedConfigExists(testDir);
      expect(exists).toBe(false);
    });

    it('should return true when resolved config exists', async () => {
      await saveConfig(DEFAULT_CONFIG, testDir);

      const exists = await resolvedConfigExists(testDir);
      expect(exists).toBe(true);
    });
  });

  describe('configuration merging', () => {
    it('should preserve user values and fill in defaults', async () => {
      const userConfig = {
        paths: ['http://localhost:5000'],
        captureOptions: {
          timeout: 60000,
        },
      };

      const configPath = join(testDir, CONFIG_FILE_NAME);
      await writeFile(
        configPath,
        `export default ${JSON.stringify(userConfig, null, 2)};`,
        'utf-8'
      );

      const config = await loadConfig(testDir);

      // User values should be preserved
      expect(config.paths).toEqual(userConfig.paths);
      expect(config.captureOptions.timeout).toBe(60000);

      // Defaults should be filled in
      expect(config.viewports).toEqual(DEFAULT_CONFIG.viewports);
      expect(config.captureOptions.fullPage).toBe(DEFAULT_CONFIG.captureOptions.fullPage);
      expect(config.diffOptions).toEqual(DEFAULT_CONFIG.diffOptions);
    });

    it('should handle partial nested configuration', async () => {
      const userConfig = {
        diffOptions: {
          threshold: 0.05,
        },
      };

      const configPath = join(testDir, CONFIG_FILE_NAME);
      await writeFile(
        configPath,
        `export default ${JSON.stringify(userConfig, null, 2)};`,
        'utf-8'
      );

      const config = await loadConfig(testDir);

      // User value should override
      expect(config.diffOptions.threshold).toBe(0.05);

      // Other diff options should use defaults
      expect(config.diffOptions.ignoreAntialiasing).toBe(DEFAULT_CONFIG.diffOptions.ignoreAntialiasing);
      expect(config.diffOptions.ignoreColors).toBe(DEFAULT_CONFIG.diffOptions.ignoreColors);
      expect(config.diffOptions.highlightColor).toBe(DEFAULT_CONFIG.diffOptions.highlightColor);
    });
  });

  describe('error reporting', () => {
    it('should provide helpful error messages for validation errors', async () => {
      const invalidConfig = {
        viewports: [{ width: -1, height: 1080, name: 'invalid' }],
        paths: ['http://localhost:3000'],
      };

      const configPath = join(testDir, CONFIG_FILE_NAME);
      await writeFile(
        configPath,
        `export default ${JSON.stringify(invalidConfig, null, 2)};`,
        'utf-8'
      );

      try {
        await loadConfig(testDir);
        expect.fail('Should have thrown ConfigurationError');
      } catch (error) {
        expect(error).toBeInstanceOf(ConfigurationError);
        expect((error as ConfigurationError).message).toContain('Invalid configuration');
        expect((error as ConfigurationError).details).toBeDefined();
      }
    });
  });
});
