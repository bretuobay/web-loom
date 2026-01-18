export {
  ViewportSchema,
  CaptureOptionsSchema,
  DiffOptionsSchema,
  StorageConfigSchema,
  VisDiffConfigSchema,
  DEFAULT_VIEWPORTS,
  DEFAULT_CAPTURE_OPTIONS,
  DEFAULT_DIFF_OPTIONS,
  DEFAULT_STORAGE_CONFIG,
  DEFAULT_CONFIG,
} from './schema.js';

export type { Viewport, CaptureOptions, DiffOptions, StorageConfig, VisDiffConfig } from './schema.js';

export {
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
