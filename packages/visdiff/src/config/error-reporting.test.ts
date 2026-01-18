import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { mkdir, writeFile, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { loadConfig, saveConfig, ConfigurationError, CONFIG_FILE_NAME } from './loader.js';
import type { VisDiffConfig } from './schema.js';

describe('Configuration Error Reporting', () => {
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
   * Feature: visdiff-phase1, Property 29: Configuration error reporting
   * For any invalid configuration, the system should report validation errors
   * with helpful messages
   * Validates: Requirements 6.6
   */
  it('should report helpful error messages for invalid configurations', () => {
    fc.assert(
      fc.asyncProperty(
        fc.oneof(
          // Invalid viewport configurations
          fc.record({
            viewports: fc.constantFrom(
              [], // Empty array
              [{ width: -1, height: 1080, name: 'invalid' }], // Negative width
              [{ width: 1920, height: -1, name: 'invalid' }], // Negative height
              [{ width: 10000, height: 1080, name: 'invalid' }], // Width too large
              [{ width: 1920, height: 10000, name: 'invalid' }], // Height too large
              [{ width: 1920, height: 1080, name: '' }], // Empty name
            ),
            paths: fc.constantFrom(['http://localhost:3000']),
          }),
          // Invalid paths
          fc.record({
            viewports: fc.constantFrom([{ width: 1920, height: 1080, name: 'desktop' }]),
            paths: fc.constantFrom(
              [], // Empty array
              ['not-a-url'], // Invalid URL
              ['ftp://invalid.com'], // Invalid protocol
            ),
          }),
          // Invalid capture options
          fc.record({
            viewports: fc.constantFrom([{ width: 1920, height: 1080, name: 'desktop' }]),
            paths: fc.constantFrom(['http://localhost:3000']),
            captureOptions: fc.constantFrom(
              { fullPage: false, omitBackground: false, timeout: -1 }, // Negative timeout
              { fullPage: false, omitBackground: false, timeout: 400000 }, // Timeout too large
            ),
          }),
          // Invalid diff options
          fc.record({
            viewports: fc.constantFrom([{ width: 1920, height: 1080, name: 'desktop' }]),
            paths: fc.constantFrom(['http://localhost:3000']),
            diffOptions: fc.constantFrom(
              {
                threshold: -0.1,
                ignoreAntialiasing: true,
                ignoreColors: false,
                highlightColor: '#FF0000',
              }, // Threshold too low
              {
                threshold: 1.5,
                ignoreAntialiasing: true,
                ignoreColors: false,
                highlightColor: '#FF0000',
              }, // Threshold too high
              {
                threshold: 0.5,
                ignoreAntialiasing: true,
                ignoreColors: false,
                highlightColor: 'red',
              }, // Invalid color format
            ),
          }),
          // Invalid storage config
          fc.record({
            viewports: fc.constantFrom([{ width: 1920, height: 1080, name: 'desktop' }]),
            paths: fc.constantFrom(['http://localhost:3000']),
            storage: fc.constantFrom(
              { baselineDir: '', diffDir: '.visdiff/diffs', format: 'png' as const }, // Empty baselineDir
              { baselineDir: '.visdiff/baselines', diffDir: '', format: 'png' as const }, // Empty diffDir
              { baselineDir: '.visdiff/baselines', diffDir: '.visdiff/diffs', format: 'gif' as const }, // Invalid format
            ),
          }),
        ),
        async (invalidConfig) => {
          const testDir = await createTestDir();
          try {
            // Create invalid configuration file
            const configPath = join(testDir, CONFIG_FILE_NAME);
            await writeFile(configPath, `export default ${JSON.stringify(invalidConfig, null, 2)};`, 'utf-8');

            // Attempt to load configuration
            try {
              await loadConfig(testDir);
              expect.fail('Should have thrown ConfigurationError');
            } catch (error) {
              // Should throw ConfigurationError
              expect(error).toBeInstanceOf(ConfigurationError);

              // Error message should be descriptive
              const configError = error as ConfigurationError;
              expect(configError.message).toBeDefined();
              expect(configError.message.length).toBeGreaterThan(0);
              expect(configError.message).toContain('Invalid configuration');

              // Error should include details
              expect(configError.details).toBeDefined();
            }
          } finally {
            await cleanupTestDir(testDir);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should provide specific error messages for different validation failures', async () => {
    const testCases = [
      {
        name: 'empty viewports array',
        config: {
          viewports: [],
          paths: ['http://localhost:3000'],
        },
        expectedInMessage: 'viewports',
      },
      {
        name: 'empty paths array',
        config: {
          viewports: [{ width: 1920, height: 1080, name: 'desktop' }],
          paths: [],
        },
        expectedInMessage: 'paths',
      },
      {
        name: 'invalid URL',
        config: {
          viewports: [{ width: 1920, height: 1080, name: 'desktop' }],
          paths: ['not-a-url'],
        },
        expectedInMessage: 'url',
      },
      {
        name: 'negative viewport width',
        config: {
          viewports: [{ width: -1, height: 1080, name: 'invalid' }],
          paths: ['http://localhost:3000'],
        },
        expectedInMessage: 'width',
      },
      {
        name: 'threshold out of range',
        config: {
          viewports: [{ width: 1920, height: 1080, name: 'desktop' }],
          paths: ['http://localhost:3000'],
          diffOptions: {
            threshold: 1.5,
            ignoreAntialiasing: true,
            ignoreColors: false,
            highlightColor: '#FF0000',
          },
        },
        expectedInMessage: 'threshold',
      },
    ];

    for (const testCase of testCases) {
      const testDir = await createTestDir();
      try {
        const configPath = join(testDir, CONFIG_FILE_NAME);
        await writeFile(configPath, `export default ${JSON.stringify(testCase.config, null, 2)};`, 'utf-8');

        try {
          await loadConfig(testDir);
          expect.fail(`Should have thrown ConfigurationError for ${testCase.name}`);
        } catch (error) {
          expect(error).toBeInstanceOf(ConfigurationError);
          const configError = error as ConfigurationError;

          // Error details should mention the problematic field
          const detailsStr = JSON.stringify(configError.details).toLowerCase();
          expect(detailsStr).toContain(testCase.expectedInMessage.toLowerCase());
        }
      } finally {
        await cleanupTestDir(testDir);
      }
    }
  });

  it('should report errors when saving invalid configurations', () => {
    fc.assert(
      fc.asyncProperty(
        fc.oneof(
          fc.record({
            viewports: fc.constantFrom([]),
            paths: fc.constantFrom(['http://localhost:3000']),
            captureOptions: fc.constant({
              fullPage: false,
              omitBackground: false,
              timeout: 30000,
            }),
            diffOptions: fc.constant({
              threshold: 0.1,
              ignoreAntialiasing: true,
              ignoreColors: false,
              highlightColor: '#FF0000',
            }),
            storage: fc.constant({
              baselineDir: '.visdiff/baselines',
              diffDir: '.visdiff/diffs',
              format: 'png' as const,
            }),
          }),
          fc.record({
            viewports: fc.constantFrom([{ width: 1920, height: 1080, name: 'desktop' }]),
            paths: fc.constantFrom([]),
            captureOptions: fc.constant({
              fullPage: false,
              omitBackground: false,
              timeout: 30000,
            }),
            diffOptions: fc.constant({
              threshold: 0.1,
              ignoreAntialiasing: true,
              ignoreColors: false,
              highlightColor: '#FF0000',
            }),
            storage: fc.constant({
              baselineDir: '.visdiff/baselines',
              diffDir: '.visdiff/diffs',
              format: 'png' as const,
            }),
          }),
        ),
        async (invalidConfig) => {
          const testDir = await createTestDir();
          try {
            // Attempt to save invalid configuration
            try {
              await saveConfig(invalidConfig as VisDiffConfig, testDir);
              expect.fail('Should have thrown ConfigurationError');
            } catch (error) {
              expect(error).toBeInstanceOf(ConfigurationError);
              const configError = error as ConfigurationError;
              expect(configError.message).toContain('Cannot save invalid configuration');
              expect(configError.details).toBeDefined();
            }
          } finally {
            await cleanupTestDir(testDir);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should handle malformed configuration files gracefully', async () => {
    const testDir = await createTestDir();
    try {
      const configPath = join(testDir, CONFIG_FILE_NAME);

      // Create a malformed JavaScript file
      await writeFile(configPath, 'export default { invalid syntax', 'utf-8');

      try {
        await loadConfig(testDir);
        expect.fail('Should have thrown ConfigurationError');
      } catch (error) {
        expect(error).toBeInstanceOf(ConfigurationError);
        const configError = error as ConfigurationError;
        expect(configError.message).toContain('Failed to load configuration');
      }
    } finally {
      await cleanupTestDir(testDir);
    }
  });

  it('should provide context in error messages', async () => {
    const testDir = await createTestDir();
    try {
      const invalidConfig = {
        viewports: [{ width: -100, height: -200, name: '' }],
        paths: ['not-a-url', 'also-not-a-url'],
        diffOptions: {
          threshold: 2.5,
          highlightColor: 'invalid-color',
        },
      };

      const configPath = join(testDir, CONFIG_FILE_NAME);
      await writeFile(configPath, `export default ${JSON.stringify(invalidConfig, null, 2)};`, 'utf-8');

      try {
        await loadConfig(testDir);
        expect.fail('Should have thrown ConfigurationError');
      } catch (error) {
        expect(error).toBeInstanceOf(ConfigurationError);
        const configError = error as ConfigurationError;

        // Error should provide context about multiple issues
        expect(configError.message).toBeDefined();
        expect(configError.details).toBeDefined();

        // Details should be structured and informative
        const detailsStr = JSON.stringify(configError.details);
        expect(detailsStr.length).toBeGreaterThan(50); // Should have substantial details
      }
    } finally {
      await cleanupTestDir(testDir);
    }
  });
});
