/**
 * Capture Command Implementation
 * Captures baseline screenshots for specified URLs
 */

import chalk from 'chalk';
import { BrowserManager } from '../browser/browser-manager.js';
import { CaptureEngine } from '../capture/capture-engine.js';
import { StorageManager } from '../storage/storage-manager.js';
import { loadConfig } from '../config/loader.js';
import type { VisDiffConfig } from '../config/schema.js';

export interface CaptureOptions {
  config?: string;
  viewport?: string;
  fullPage?: boolean;
  timeout?: string;
}

/**
 * Generate identifier from URL and viewport name
 */
function generateIdentifier(url: string, viewportName: string): string {
  // Extract path from URL
  const urlObj = new URL(url);
  const path = urlObj.pathname === '/' ? 'home' : urlObj.pathname.replace(/\//g, '-').replace(/^-/, '');

  return `${path}-${viewportName}`;
}

/**
 * Execute the capture command
 */
export async function captureCommand(urls: string[], options: CaptureOptions = {}): Promise<number> {
  const cwd = process.cwd();
  let browserManager: BrowserManager | null = null;

  try {
    // Load configuration
    console.log(chalk.blue('Loading configuration...'));
    const config: VisDiffConfig = await loadConfig(cwd);

    // Determine URLs to capture
    const urlsToCapture = urls.length > 0 ? urls : config.paths;

    if (urlsToCapture.length === 0) {
      console.error(chalk.red('✗ No URLs specified'));
      console.log(chalk.gray('  Provide URLs as arguments or configure them in visdiff.config.js'));
      return 1;
    }

    // Determine viewports to use
    let viewports = config.viewports;
    if (options.viewport) {
      const selectedViewport = config.viewports.find((v) => v.name === options.viewport);
      if (!selectedViewport) {
        console.error(chalk.red(`✗ Viewport "${options.viewport}" not found in configuration`));
        return 1;
      }
      viewports = [selectedViewport];
    }

    // Override capture options if specified
    const captureOptions = {
      ...config.captureOptions,
      ...(options.fullPage !== undefined && { fullPage: options.fullPage }),
      ...(options.timeout && { timeout: parseInt(options.timeout, 10) }),
    };

    console.log(chalk.blue(`Capturing ${urlsToCapture.length} URL(s) across ${viewports.length} viewport(s)...`));
    console.log();

    // Initialize browser manager and capture engine
    browserManager = new BrowserManager();
    await browserManager.launch();

    const captureEngine = new CaptureEngine(browserManager);
    const storage = new StorageManager(cwd, config.storage);

    // Ensure storage directories exist
    await storage.initialize();

    // Capture all screenshots
    const summary = await captureEngine.captureAll(urlsToCapture, viewports, captureOptions);

    // Save baselines
    console.log(chalk.blue('Saving baselines...'));
    let savedCount = 0;

    for (const result of summary.results) {
      if (result.success) {
        const identifier = generateIdentifier(result.url, result.viewport.name);
        await storage.saveBaseline(identifier, result.image);

        console.log(chalk.green(`  ✓ ${identifier}`));
        console.log(
          chalk.gray(
            `    ${result.metadata.dimensions.width}x${result.metadata.dimensions.height} (${(result.metadata.imageSize / 1024).toFixed(1)}KB)`,
          ),
        );

        savedCount++;
      } else {
        const identifier = generateIdentifier(result.url, result.viewport.name);
        console.log(chalk.red(`  ✗ ${identifier}`));
        console.log(chalk.gray(`    ${result.error?.message || 'Unknown error'}`));
      }
    }

    console.log();

    // Output summary
    if (summary.successful === summary.total) {
      console.log(chalk.bold.green(`🎉 All ${summary.total} screenshot(s) captured successfully!`));
    } else {
      console.log(chalk.bold.yellow(`⚠️  Captured ${summary.successful}/${summary.total} screenshot(s)`));
      console.log(chalk.gray(`   ${summary.failed} failed`));
    }

    console.log();
    console.log(chalk.blue('ℹ️  Next steps:'));
    console.log(chalk.gray('  Run "visdiff compare" to check for visual regressions'));

    return summary.failed > 0 ? 1 : 0;
  } catch (error) {
    console.error(chalk.red('✗ Capture failed'));
    console.error(chalk.red((error as Error).message));
    return 1;
  } finally {
    // Clean up browser
    if (browserManager) {
      try {
        await browserManager.close();
      } catch (error) {
        console.error(chalk.yellow('Warning: Failed to close browser'), error);
      }
    }
  }
}
