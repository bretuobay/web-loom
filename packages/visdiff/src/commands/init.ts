/**
 * Init Command Implementation
 * Initializes visdiff in a project with default configuration
 */

import { writeFile } from 'fs/promises';
import { join } from 'path';
import chalk from 'chalk';
import { StorageManager } from '../storage/storage-manager.js';
import { DEFAULT_CONFIG } from '../config/schema.js';
import { saveConfig, configExists, CONFIG_FILE_NAME } from '../config/loader.js';

export interface InitOptions {
  config?: string;
  force?: boolean;
}

/**
 * Default configuration file template
 */
const DEFAULT_CONFIG_TEMPLATE = `/**
 * VisDiff Configuration
 * 
 * This file defines the configuration for visual regression testing.
 * Customize viewports, paths, and options to match your project needs.
 */

export default {
  // Viewports to capture screenshots at
  viewports: [
    { width: 375, height: 667, name: 'mobile' },
    { width: 768, height: 1024, name: 'tablet' },
    { width: 1920, height: 1080, name: 'desktop' },
  ],

  // URLs or paths to capture
  paths: [
    'http://localhost:3000',
  ],

  // Capture options
  captureOptions: {
    fullPage: true,
    omitBackground: false,
    timeout: 30000,
    waitForNetworkIdle: true,
    animationDelay: 0,
  },

  // Diff comparison options
  diffOptions: {
    threshold: 0.01, // 1% difference threshold
    ignoreAntialiasing: true,
    ignoreColors: false,
    highlightColor: '#ff00ff',
  },

  // Storage configuration
  storage: {
    baselineDir: '.visdiff/baselines',
    diffDir: '.visdiff/diffs',
    format: 'png',
  },
};
`;

/**
 * Execute the init command
 */
export async function initCommand(options: InitOptions = {}): Promise<number> {
  const cwd = process.cwd();
  const configPath = join(cwd, options.config || CONFIG_FILE_NAME);

  try {
    // Check if configuration already exists
    const exists = await configExists(cwd);

    if (exists && !options.force) {
      console.log(chalk.yellow('⚠️  Configuration file already exists'));
      console.log(chalk.gray(`   ${configPath}`));
      console.log();
      console.log(chalk.blue('ℹ️  Existing configuration preserved'));
      console.log(chalk.gray('   Use --force to overwrite'));
      console.log();
    } else {
      // Create default configuration file
      await writeFile(configPath, DEFAULT_CONFIG_TEMPLATE, 'utf-8');

      if (options.force) {
        console.log(chalk.green('✓ Configuration file updated'));
      } else {
        console.log(chalk.green('✓ Configuration file created'));
      }
      console.log(chalk.gray(`   ${configPath}`));
      console.log();
    }

    // Initialize storage manager and create directory structure
    const storage = new StorageManager(cwd);
    await storage.initialize();

    console.log(chalk.green('✓ Directory structure created'));
    console.log(chalk.gray('   .visdiff/baselines'));
    console.log(chalk.gray('   .visdiff/diffs'));
    console.log(chalk.gray('   .visdiff/backups'));
    console.log();

    // Save resolved configuration
    await saveConfig(DEFAULT_CONFIG, cwd);
    console.log(chalk.green('✓ Resolved configuration saved'));
    console.log(chalk.gray('   .visdiff/config.json'));
    console.log();

    // Output success message with next steps
    console.log(chalk.bold.green('🎉 VisDiff initialized successfully!'));
    console.log();
    console.log(chalk.bold('Next steps:'));
    console.log(chalk.gray('  1. Edit visdiff.config.js to customize your configuration'));
    console.log(chalk.gray('  2. Run "visdiff capture <url>" to capture baseline screenshots'));
    console.log(chalk.gray('  3. Run "visdiff compare" to check for visual regressions'));
    console.log();
    console.log(chalk.blue('ℹ️  For more information, run: visdiff --help'));

    return 0;
  } catch (error) {
    console.error(chalk.red('✗ Initialization failed'));
    console.error(chalk.red((error as Error).message));
    return 1;
  }
}
