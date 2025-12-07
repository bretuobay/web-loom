import { z } from 'zod';

/**
 * Viewport configuration schema
 */
export const ViewportSchema = z.object({
  width: z.number().int().positive().max(7680, 'Width must be <= 7680'),
  height: z.number().int().positive().max(4320, 'Height must be <= 4320'),
  name: z.string().min(1, 'Viewport name is required'),
  deviceScaleFactor: z.number().positive().optional(),
});

export type Viewport = z.infer<typeof ViewportSchema>;

/**
 * Capture options schema
 */
export const CaptureOptionsSchema = z.object({
  fullPage: z.boolean(),
  omitBackground: z.boolean(),
  timeout: z.number().int().positive().max(300000, 'Timeout must be <= 300000ms'),
  waitForNetworkIdle: z.boolean().optional(),
  waitForSelector: z.string().optional(),
  customScript: z.string().optional(),
  animationDelay: z.number().int().nonnegative().optional(),
});

export type CaptureOptions = z.infer<typeof CaptureOptionsSchema>;

/**
 * Diff options schema
 */
export const DiffOptionsSchema = z.object({
  threshold: z
    .number()
    .min(0, 'Threshold must be >= 0')
    .max(1, 'Threshold must be <= 1'),
  ignoreAntialiasing: z.boolean(),
  ignoreColors: z.boolean(),
  highlightColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Highlight color must be a valid hex color (e.g., #FF0000)'),
});

export type DiffOptions = z.infer<typeof DiffOptionsSchema>;

/**
 * Storage configuration schema
 */
export const StorageConfigSchema = z.object({
  baselineDir: z.string().min(1, 'Baseline directory is required'),
  diffDir: z.string().min(1, 'Diff directory is required'),
  format: z.enum(['png', 'jpeg']),
  compression: z
    .number()
    .int()
    .min(0, 'Compression must be >= 0')
    .max(100, 'Compression must be <= 100')
    .optional(),
});

export type StorageConfig = z.infer<typeof StorageConfigSchema>;

/**
 * Main VisDiff configuration schema
 */
export const VisDiffConfigSchema = z.object({
  viewports: z.array(ViewportSchema).min(1, 'At least one viewport is required'),
  paths: z.array(z.string().url('Each path must be a valid URL')).min(1, 'At least one path is required'),
  captureOptions: CaptureOptionsSchema,
  diffOptions: DiffOptionsSchema,
  storage: StorageConfigSchema,
});

export type VisDiffConfig = z.infer<typeof VisDiffConfigSchema>;

/**
 * Default viewport configurations
 */
export const DEFAULT_VIEWPORTS: Viewport[] = [
  { width: 375, height: 667, name: 'mobile' },
  { width: 768, height: 1024, name: 'tablet' },
  { width: 1920, height: 1080, name: 'desktop' },
];

/**
 * Default capture options
 */
export const DEFAULT_CAPTURE_OPTIONS: CaptureOptions = {
  fullPage: false,
  omitBackground: false,
  timeout: 30000,
  waitForNetworkIdle: true,
  animationDelay: 0,
};

/**
 * Default diff options
 */
export const DEFAULT_DIFF_OPTIONS: DiffOptions = {
  threshold: 0.1,
  ignoreAntialiasing: true,
  ignoreColors: false,
  highlightColor: '#FF0000',
};

/**
 * Default storage configuration
 */
export const DEFAULT_STORAGE_CONFIG: StorageConfig = {
  baselineDir: '.visdiff/baselines',
  diffDir: '.visdiff/diffs',
  format: 'png',
};

/**
 * Default VisDiff configuration
 */
export const DEFAULT_CONFIG: VisDiffConfig = {
  viewports: DEFAULT_VIEWPORTS,
  paths: ['http://localhost:3000'],
  captureOptions: DEFAULT_CAPTURE_OPTIONS,
  diffOptions: DEFAULT_DIFF_OPTIONS,
  storage: DEFAULT_STORAGE_CONFIG,
};
