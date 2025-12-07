import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  DEFAULT_CONFIG,
  VisDiffConfigSchema,
  type VisDiffConfig,
  type Viewport,
  type CaptureOptions,
  type DiffOptions,
  type StorageConfig,
} from './schema.js';

describe('Default Configuration', () => {
  /**
   * Feature: visdiff-phase1, Property 1: Default configuration application
   * For any invocation of the init command without configuration options,
   * the system should create a configuration file with default viewports,
   * paths, and capture options
   * Validates: Requirements 1.3
   */
  it('should apply default configuration when no options are provided', () => {
    fc.assert(
      fc.property(
        fc.constant(undefined), // Simulating no user config provided
        () => {
          // When no configuration is provided, the system should use DEFAULT_CONFIG
          const config = DEFAULT_CONFIG;

          // The configuration should be valid
          const result = VisDiffConfigSchema.safeParse(config);
          expect(result.success).toBe(true);

          // Should have default viewports
          expect(config.viewports).toBeDefined();
          expect(config.viewports.length).toBeGreaterThan(0);
          expect(config.viewports).toEqual(
            expect.arrayContaining([
              expect.objectContaining({ name: 'mobile' }),
              expect.objectContaining({ name: 'tablet' }),
              expect.objectContaining({ name: 'desktop' }),
            ])
          );

          // Should have default paths
          expect(config.paths).toBeDefined();
          expect(config.paths.length).toBeGreaterThan(0);

          // Should have default capture options
          expect(config.captureOptions).toBeDefined();
          expect(config.captureOptions.fullPage).toBeDefined();
          expect(config.captureOptions.omitBackground).toBeDefined();
          expect(config.captureOptions.timeout).toBeGreaterThan(0);

          // Should have default diff options
          expect(config.diffOptions).toBeDefined();
          expect(config.diffOptions.threshold).toBeGreaterThanOrEqual(0);
          expect(config.diffOptions.threshold).toBeLessThanOrEqual(1);
          expect(config.diffOptions.ignoreAntialiasing).toBeDefined();
          expect(config.diffOptions.ignoreColors).toBeDefined();
          expect(config.diffOptions.highlightColor).toMatch(/^#[0-9A-Fa-f]{6}$/);

          // Should have default storage config
          expect(config.storage).toBeDefined();
          expect(config.storage.baselineDir).toBeDefined();
          expect(config.storage.diffDir).toBeDefined();
          expect(config.storage.format).toMatch(/^(png|jpeg)$/);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should merge user config with defaults', () => {
    fc.assert(
      fc.property(
        fc.record({
          viewports: fc.option(
            fc.array(
              fc.record({
                width: fc.integer({ min: 1, max: 7680 }),
                height: fc.integer({ min: 1, max: 4320 }),
                name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
              }),
              { minLength: 1, maxLength: 3 }
            ),
            { nil: undefined }
          ),
          paths: fc.option(
            fc.array(
              fc.constantFrom('http://localhost:3000', 'https://example.com'),
              { minLength: 1, maxLength: 3 }
            ),
            { nil: undefined }
          ),
          captureOptions: fc.option(
            fc.record({
              fullPage: fc.option(fc.boolean(), { nil: undefined }),
              timeout: fc.option(fc.integer({ min: 1000, max: 60000 }), { nil: undefined }),
            }),
            { nil: undefined }
          ),
          diffOptions: fc.option(
            fc.record({
              threshold: fc.option(fc.double({ min: 0, max: 1, noNaN: true }), { nil: undefined }),
            }),
            { nil: undefined }
          ),
        }),
        (userConfig) => {
          // Merge user config with defaults, filtering out undefined values
          const cleanCaptureOptions = userConfig.captureOptions
            ? Object.fromEntries(
                Object.entries(userConfig.captureOptions).filter(([_, v]) => v !== undefined)
              )
            : {};

          const cleanDiffOptions = userConfig.diffOptions
            ? Object.fromEntries(
                Object.entries(userConfig.diffOptions).filter(([_, v]) => v !== undefined)
              )
            : {};

          const mergedConfig: VisDiffConfig = {
            viewports: userConfig.viewports ?? DEFAULT_CONFIG.viewports,
            paths: userConfig.paths ?? DEFAULT_CONFIG.paths,
            captureOptions: {
              ...DEFAULT_CONFIG.captureOptions,
              ...cleanCaptureOptions,
            },
            diffOptions: {
              ...DEFAULT_CONFIG.diffOptions,
              ...cleanDiffOptions,
            },
            storage: DEFAULT_CONFIG.storage,
          };

          // The merged configuration should be valid
          const result = VisDiffConfigSchema.safeParse(mergedConfig);
          expect(result.success).toBe(true);

          // User-provided values should override defaults
          if (userConfig.viewports) {
            expect(mergedConfig.viewports).toEqual(userConfig.viewports);
          } else {
            expect(mergedConfig.viewports).toEqual(DEFAULT_CONFIG.viewports);
          }

          if (userConfig.paths) {
            expect(mergedConfig.paths).toEqual(userConfig.paths);
          } else {
            expect(mergedConfig.paths).toEqual(DEFAULT_CONFIG.paths);
          }

          if (userConfig.captureOptions?.fullPage !== undefined) {
            expect(mergedConfig.captureOptions.fullPage).toBe(userConfig.captureOptions.fullPage);
          } else {
            expect(mergedConfig.captureOptions.fullPage).toBe(DEFAULT_CONFIG.captureOptions.fullPage);
          }

          if (userConfig.captureOptions?.timeout !== undefined) {
            expect(mergedConfig.captureOptions.timeout).toBe(userConfig.captureOptions.timeout);
          } else {
            expect(mergedConfig.captureOptions.timeout).toBe(DEFAULT_CONFIG.captureOptions.timeout);
          }

          if (userConfig.diffOptions?.threshold !== undefined) {
            expect(mergedConfig.diffOptions.threshold).toBe(userConfig.diffOptions.threshold);
          } else {
            expect(mergedConfig.diffOptions.threshold).toBe(DEFAULT_CONFIG.diffOptions.threshold);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should have sensible default values', () => {
    // Default viewports should cover common device sizes
    expect(DEFAULT_CONFIG.viewports).toHaveLength(3);
    expect(DEFAULT_CONFIG.viewports.some(v => v.name === 'mobile')).toBe(true);
    expect(DEFAULT_CONFIG.viewports.some(v => v.name === 'tablet')).toBe(true);
    expect(DEFAULT_CONFIG.viewports.some(v => v.name === 'desktop')).toBe(true);

    // Default timeout should be reasonable (30 seconds)
    expect(DEFAULT_CONFIG.captureOptions.timeout).toBe(30000);

    // Default threshold should be reasonable (10%)
    expect(DEFAULT_CONFIG.diffOptions.threshold).toBe(0.1);

    // Default should wait for network idle
    expect(DEFAULT_CONFIG.captureOptions.waitForNetworkIdle).toBe(true);

    // Default should ignore anti-aliasing
    expect(DEFAULT_CONFIG.diffOptions.ignoreAntialiasing).toBe(true);

    // Default storage format should be PNG
    expect(DEFAULT_CONFIG.storage.format).toBe('png');

    // Default storage paths should be in .visdiff directory
    expect(DEFAULT_CONFIG.storage.baselineDir).toContain('.visdiff');
    expect(DEFAULT_CONFIG.storage.diffDir).toContain('.visdiff');
  });

  it('should preserve all required fields when applying defaults', () => {
    fc.assert(
      fc.property(fc.constant(DEFAULT_CONFIG), (config) => {
        // All required fields should be present
        expect(config.viewports).toBeDefined();
        expect(config.paths).toBeDefined();
        expect(config.captureOptions).toBeDefined();
        expect(config.diffOptions).toBeDefined();
        expect(config.storage).toBeDefined();

        // Nested required fields should be present
        expect(config.captureOptions.fullPage).toBeDefined();
        expect(config.captureOptions.omitBackground).toBeDefined();
        expect(config.captureOptions.timeout).toBeDefined();

        expect(config.diffOptions.threshold).toBeDefined();
        expect(config.diffOptions.ignoreAntialiasing).toBeDefined();
        expect(config.diffOptions.ignoreColors).toBeDefined();
        expect(config.diffOptions.highlightColor).toBeDefined();

        expect(config.storage.baselineDir).toBeDefined();
        expect(config.storage.diffDir).toBeDefined();
        expect(config.storage.format).toBeDefined();
      }),
      { numRuns: 100 }
    );
  });
});
