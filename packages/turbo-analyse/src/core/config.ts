import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import type { Config } from '../cli/dispatcher.js';

export async function loadConfig(cwd: string): Promise<Config | undefined> {
  const configPath = join(cwd, 'turbo-analyse.config.json');

  if (!existsSync(configPath)) {
    return undefined;
  }

  try {
    const configContent = await readFile(configPath, 'utf8');
    const config = JSON.parse(configContent) as Config;

    // Validate config structure
    validateConfig(config);

    return config;
  } catch (error) {
    console.warn(
      `Warning: Could not load config from ${configPath}: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
    return undefined;
  }
}

function validateConfig(config: any): asserts config is Config {
  if (typeof config !== 'object' || config === null) {
    throw new Error('Config must be an object');
  }

  if (config.artifactGlobs !== undefined) {
    if (typeof config.artifactGlobs !== 'object' || config.artifactGlobs === null) {
      throw new Error('artifactGlobs must be an object');
    }

    for (const [key, value] of Object.entries(config.artifactGlobs)) {
      if (typeof value !== 'string') {
        throw new Error(`artifactGlobs.${key} must be a string`);
      }
    }
  }

  if (config.projectTypes !== undefined) {
    if (typeof config.projectTypes !== 'object' || config.projectTypes === null) {
      throw new Error('projectTypes must be an object');
    }

    for (const [key, value] of Object.entries(config.projectTypes)) {
      if (typeof value !== 'string') {
        throw new Error(`projectTypes.${key} must be a string`);
      }
    }
  }
}

export function createDefaultConfig(): Config {
  return {
    artifactGlobs: {
      // Default patterns for common project types
      'next-app': '.next,dist',
      'react-app': 'build,dist',
      'vite-app': 'dist',
      package: 'dist,lib',
    },
    projectTypes: {
      // Manual overrides for project types
    },
  };
}

export async function createConfigFile(cwd: string): Promise<void> {
  const configPath = join(cwd, 'turbo-analyse.config.json');
  const defaultConfig = createDefaultConfig();

  const configContent = JSON.stringify(defaultConfig, null, 2);

  const { writeFile } = await import('node:fs/promises');
  await writeFile(configPath, configContent, 'utf8');

  console.log(`Created config file at ${configPath}`);
}
