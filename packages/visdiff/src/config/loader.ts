import { readFile, writeFile, mkdir, access } from 'fs/promises';
import { join } from 'path';
import { pathToFileURL } from 'url';
import { VisDiffConfigSchema, DEFAULT_CONFIG, type VisDiffConfig } from './schema.js';

/**
 * Configuration file paths
 */
export const CONFIG_FILE_NAME = 'visdiff.config.js';
export const RESOLVED_CONFIG_DIR = '.visdiff';
export const RESOLVED_CONFIG_FILE = 'config.json';

/**
 * Error thrown when configuration is invalid
 */
export class ConfigurationError extends Error {
  constructor(
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

/**
 * Load configuration from visdiff.config.js
 * Falls back to default configuration if file doesn't exist
 */
export async function loadConfig(cwd: string = process.cwd()): Promise<VisDiffConfig> {
  const configPath = join(cwd, CONFIG_FILE_NAME);

  try {
    // Check if config file exists
    await access(configPath);

    // Import the config file as ES module
    const configUrl = pathToFileURL(configPath).href;
    const configModule = await import(configUrl);
    const userConfig = configModule.default || configModule;

    // Merge user config with defaults
    const mergedConfig = mergeWithDefaults(userConfig);

    // Validate the merged configuration
    const result = VisDiffConfigSchema.safeParse(mergedConfig);

    if (!result.success) {
      throw new ConfigurationError('Invalid configuration in visdiff.config.js', result.error.format());
    }

    return result.data;
  } catch (error) {
    // If file doesn't exist, return default config
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return DEFAULT_CONFIG;
    }

    // Re-throw configuration errors
    if (error instanceof ConfigurationError) {
      throw error;
    }

    // Wrap other errors
    throw new ConfigurationError(`Failed to load configuration: ${(error as Error).message}`, error);
  }
}

/**
 * Save resolved configuration to .visdiff/config.json
 */
export async function saveConfig(config: VisDiffConfig, cwd: string = process.cwd()): Promise<void> {
  const configDir = join(cwd, RESOLVED_CONFIG_DIR);
  const configPath = join(configDir, RESOLVED_CONFIG_FILE);

  try {
    // Validate configuration before saving
    const result = VisDiffConfigSchema.safeParse(config);

    if (!result.success) {
      throw new ConfigurationError('Cannot save invalid configuration', result.error.format());
    }

    // Ensure .visdiff directory exists
    await mkdir(configDir, { recursive: true });

    // Write configuration as JSON
    await writeFile(configPath, JSON.stringify(result.data, null, 2), 'utf-8');
  } catch (error) {
    if (error instanceof ConfigurationError) {
      throw error;
    }

    throw new ConfigurationError(`Failed to save configuration: ${(error as Error).message}`, error);
  }
}

/**
 * Load resolved configuration from .visdiff/config.json
 * Returns null if file doesn't exist
 */
export async function loadResolvedConfig(cwd: string = process.cwd()): Promise<VisDiffConfig | null> {
  const configPath = join(cwd, RESOLVED_CONFIG_DIR, RESOLVED_CONFIG_FILE);

  try {
    const content = await readFile(configPath, 'utf-8');
    const config = JSON.parse(content);

    // Validate the configuration
    const result = VisDiffConfigSchema.safeParse(config);

    if (!result.success) {
      throw new ConfigurationError('Invalid resolved configuration in .visdiff/config.json', result.error.format());
    }

    return result.data;
  } catch (error) {
    // If file doesn't exist, return null
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null;
    }

    // Re-throw configuration errors
    if (error instanceof ConfigurationError) {
      throw error;
    }

    // Wrap other errors
    throw new ConfigurationError(`Failed to load resolved configuration: ${(error as Error).message}`, error);
  }
}

/**
 * Merge user configuration with defaults
 * User values override defaults, but missing values are filled in
 */
function mergeWithDefaults(userConfig: Partial<VisDiffConfig>): VisDiffConfig {
  // Helper to filter out undefined values from an object
  const filterUndefined = <T extends Record<string, unknown>>(obj: T): Partial<T> => {
    return Object.fromEntries(Object.entries(obj).filter(([_, v]) => v !== undefined)) as Partial<T>;
  };

  return {
    viewports: userConfig.viewports ?? DEFAULT_CONFIG.viewports,
    paths: userConfig.paths ?? DEFAULT_CONFIG.paths,
    captureOptions: {
      ...DEFAULT_CONFIG.captureOptions,
      ...(userConfig.captureOptions ? filterUndefined(userConfig.captureOptions) : {}),
    },
    diffOptions: {
      ...DEFAULT_CONFIG.diffOptions,
      ...(userConfig.diffOptions ? filterUndefined(userConfig.diffOptions) : {}),
    },
    storage: {
      ...DEFAULT_CONFIG.storage,
      ...(userConfig.storage ? filterUndefined(userConfig.storage) : {}),
    },
  };
}

/**
 * Check if a configuration file exists
 */
export async function configExists(cwd: string = process.cwd()): Promise<boolean> {
  const configPath = join(cwd, CONFIG_FILE_NAME);

  try {
    await access(configPath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if resolved configuration exists
 */
export async function resolvedConfigExists(cwd: string = process.cwd()): Promise<boolean> {
  const configPath = join(cwd, RESOLVED_CONFIG_DIR, RESOLVED_CONFIG_FILE);

  try {
    await access(configPath);
    return true;
  } catch {
    return false;
  }
}
