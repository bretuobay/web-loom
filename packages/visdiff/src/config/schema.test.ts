import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  ViewportSchema,
  CaptureOptionsSchema,
  DiffOptionsSchema,
  StorageConfigSchema,
  VisDiffConfigSchema,
  DEFAULT_CONFIG,
} from './schema.js';

describe('Configuration Schema Validation', () => {
  /**
   * Feature: visdiff-phase1, Property 24: Configuration validation
   * For any configuration file, the system should validate it against the schema
   * and reject invalid configurations
   * Validates: Requirements 6.1
   */
  it('should validate valid viewport configurations', () => {
    fc.assert(
      fc.property(
        fc.record({
          width: fc.integer({ min: 1, max: 7680 }),
          height: fc.integer({ min: 1, max: 4320 }),
          name: fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
          deviceScaleFactor: fc.option(fc.double({ min: 0.1, max: 5, noNaN: true }), { nil: undefined }),
        }),
        (viewport) => {
          const result = ViewportSchema.safeParse(viewport);
          expect(result.success).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should reject invalid viewport configurations', () => {
    // Test invalid width
    const invalidWidth = { width: -1, height: 1080, name: 'test' };
    expect(ViewportSchema.safeParse(invalidWidth).success).toBe(false);

    // Test invalid height
    const invalidHeight = { width: 1920, height: -1, name: 'test' };
    expect(ViewportSchema.safeParse(invalidHeight).success).toBe(false);

    // Test empty name
    const emptyName = { width: 1920, height: 1080, name: '' };
    expect(ViewportSchema.safeParse(emptyName).success).toBe(false);

    // Test width exceeds max
    const widthTooLarge = { width: 10000, height: 1080, name: 'test' };
    expect(ViewportSchema.safeParse(widthTooLarge).success).toBe(false);
  });

  it('should validate valid capture options', () => {
    fc.assert(
      fc.property(
        fc.record({
          fullPage: fc.boolean(),
          omitBackground: fc.boolean(),
          timeout: fc.integer({ min: 1, max: 300000 }),
          waitForNetworkIdle: fc.option(fc.boolean(), { nil: undefined }),
          waitForSelector: fc.option(fc.string(), { nil: undefined }),
          customScript: fc.option(fc.string(), { nil: undefined }),
          animationDelay: fc.option(fc.integer({ min: 0, max: 10000 }), { nil: undefined }),
        }),
        (options) => {
          const result = CaptureOptionsSchema.safeParse(options);
          expect(result.success).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should reject invalid capture options', () => {
    // Test negative timeout
    const negativeTimeout = {
      fullPage: false,
      omitBackground: false,
      timeout: -1,
    };
    expect(CaptureOptionsSchema.safeParse(negativeTimeout).success).toBe(false);

    // Test timeout exceeds max
    const timeoutTooLarge = {
      fullPage: false,
      omitBackground: false,
      timeout: 400000,
    };
    expect(CaptureOptionsSchema.safeParse(timeoutTooLarge).success).toBe(false);
  });

  it('should validate valid diff options', () => {
    fc.assert(
      fc.property(
        fc.record({
          threshold: fc.double({ min: 0, max: 1, noNaN: true }),
          ignoreAntialiasing: fc.boolean(),
          ignoreColors: fc.boolean(),
          highlightColor: fc.constantFrom('#FF0000', '#00FF00', '#0000FF', '#FFFFFF', '#000000', '#ABCDEF', '#123456'),
        }),
        (options) => {
          const result = DiffOptionsSchema.safeParse(options);
          expect(result.success).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should reject invalid diff options', () => {
    // Test threshold below 0
    const thresholdTooLow = {
      threshold: -0.1,
      ignoreAntialiasing: true,
      ignoreColors: false,
      highlightColor: '#FF0000',
    };
    expect(DiffOptionsSchema.safeParse(thresholdTooLow).success).toBe(false);

    // Test threshold above 1
    const thresholdTooHigh = {
      threshold: 1.5,
      ignoreAntialiasing: true,
      ignoreColors: false,
      highlightColor: '#FF0000',
    };
    expect(DiffOptionsSchema.safeParse(thresholdTooHigh).success).toBe(false);

    // Test invalid highlight color
    const invalidColor = {
      threshold: 0.5,
      ignoreAntialiasing: true,
      ignoreColors: false,
      highlightColor: 'red',
    };
    expect(DiffOptionsSchema.safeParse(invalidColor).success).toBe(false);
  });

  it('should validate valid storage configurations', () => {
    fc.assert(
      fc.property(
        fc.record({
          baselineDir: fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0),
          diffDir: fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0),
          format: fc.constantFrom('png', 'jpeg'),
          compression: fc.option(fc.integer({ min: 0, max: 100 }), { nil: undefined }),
        }),
        (storage) => {
          const result = StorageConfigSchema.safeParse(storage);
          expect(result.success).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should reject invalid storage configurations', () => {
    // Test empty baselineDir
    const emptyBaselineDir = {
      baselineDir: '',
      diffDir: '.visdiff/diffs',
      format: 'png' as const,
    };
    expect(StorageConfigSchema.safeParse(emptyBaselineDir).success).toBe(false);

    // Test invalid format
    const invalidFormat = {
      baselineDir: '.visdiff/baselines',
      diffDir: '.visdiff/diffs',
      format: 'gif',
    };
    expect(StorageConfigSchema.safeParse(invalidFormat).success).toBe(false);

    // Test compression out of range
    const compressionTooHigh = {
      baselineDir: '.visdiff/baselines',
      diffDir: '.visdiff/diffs',
      format: 'jpeg' as const,
      compression: 150,
    };
    expect(StorageConfigSchema.safeParse(compressionTooHigh).success).toBe(false);
  });

  it('should validate complete valid configurations', () => {
    fc.assert(
      fc.property(
        fc.record({
          viewports: fc.array(
            fc.record({
              width: fc.integer({ min: 1, max: 7680 }),
              height: fc.integer({ min: 1, max: 4320 }),
              name: fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
            }),
            { minLength: 1, maxLength: 5 },
          ),
          paths: fc.array(
            fc.constantFrom(
              'http://localhost:3000',
              'https://example.com',
              'http://localhost:8080/page',
              'https://test.com/path',
            ),
            { minLength: 1, maxLength: 5 },
          ),
          captureOptions: fc.record({
            fullPage: fc.boolean(),
            omitBackground: fc.boolean(),
            timeout: fc.integer({ min: 1, max: 300000 }),
          }),
          diffOptions: fc.record({
            threshold: fc.double({ min: 0, max: 1, noNaN: true }),
            ignoreAntialiasing: fc.boolean(),
            ignoreColors: fc.boolean(),
            highlightColor: fc.constantFrom('#FF0000', '#00FF00', '#0000FF'),
          }),
          storage: fc.record({
            baselineDir: fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0),
            diffDir: fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0),
            format: fc.constantFrom('png', 'jpeg'),
          }),
        }),
        (config) => {
          const result = VisDiffConfigSchema.safeParse(config);
          expect(result.success).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should reject configurations with empty viewports array', () => {
    const invalidConfig = {
      ...DEFAULT_CONFIG,
      viewports: [],
    };
    expect(VisDiffConfigSchema.safeParse(invalidConfig).success).toBe(false);
  });

  it('should reject configurations with empty paths array', () => {
    const invalidConfig = {
      ...DEFAULT_CONFIG,
      paths: [],
    };
    expect(VisDiffConfigSchema.safeParse(invalidConfig).success).toBe(false);
  });

  it('should reject configurations with invalid URL paths', () => {
    const invalidConfig = {
      ...DEFAULT_CONFIG,
      paths: ['not-a-url', 'also-invalid'],
    };
    expect(VisDiffConfigSchema.safeParse(invalidConfig).success).toBe(false);
  });

  it('should validate the default configuration', () => {
    const result = VisDiffConfigSchema.safeParse(DEFAULT_CONFIG);
    expect(result.success).toBe(true);
  });
});
