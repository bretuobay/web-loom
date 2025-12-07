/**
 * Compare Command Implementation
 * Compares current screenshots against baselines
 */

import chalk from 'chalk';
import { BrowserManager } from '../browser/browser-manager.js';
import { CaptureEngine } from '../capture/capture-engine.js';
import { CompareEngine, ComparisonPair } from '../compare/compare-engine.js';
import { StorageManager } from '../storage/storage-manager.js';
import { loadConfig } from '../config/loader.js';
import type { VisDiffConfig } from '../config/schema.js';

export interface CompareOptions {
  config?: string;
  threshold?: string;
  updateOnPass?: boolean;
  failOnMissing?: boolean;
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
 * Execute the compare command
 */
export async function compareCommand(
  urls: string[],
  options: CompareOptions = {}
): Promise<number> {
  const cwd = process.cwd();
  let browserManager: BrowserManager | null = null;

  try {
    // Load configuration
    console.log(chalk.blue('Loading configuration...'));
    const config: VisDiffConfig = await loadConfig(cwd);

    // Determine URLs to compare
    const urlsToCompare = urls.length > 0 ? urls : config.paths;
    
    if (urlsToCompare.length === 0) {
      console.error(chalk.red('✗ No URLs specified'));
      console.log(chalk.gray('  Provide URLs as arguments or configure them in visdiff.config.js'));
      return 1;
    }

    // Override diff options if specified
    const diffOptions = {
      ...config.diffOptions,
      ...(options.threshold && { threshold: parseFloat(options.threshold) }),
    };

    console.log(chalk.blue(`Comparing ${urlsToCompare.length} URL(s) across ${config.viewports.length} viewport(s)...`));
    console.log();

    // Initialize components
    browserManager = new BrowserManager();
    await browserManager.launch();

    const captureEngine = new CaptureEngine(browserManager);
    const compareEngine = new CompareEngine();
    const storage = new StorageManager(cwd, config.storage);

    // Ensure storage directories exist
    await storage.initialize();

    // Capture current screenshots
    console.log(chalk.blue('Capturing current screenshots...'));
    const captureSummary = await captureEngine.captureAll(
      urlsToCompare,
      config.viewports,
      config.captureOptions
    );

    if (captureSummary.failed > 0) {
      console.log(chalk.yellow(`⚠️  ${captureSummary.failed} capture(s) failed`));
    }
    console.log();

    // Load baselines and prepare comparisons
    console.log(chalk.blue('Loading baselines and comparing...'));
    const comparisons: ComparisonPair[] = [];
    const missingBaselines: string[] = [];

    for (const result of captureSummary.results) {
      if (!result.success) {
        continue; // Skip failed captures
      }

      const identifier = generateIdentifier(result.url, result.viewport.name);
      const baseline = await storage.loadBaseline(identifier);

      if (!baseline) {
        missingBaselines.push(identifier);
        if (options.failOnMissing !== false) {
          console.log(chalk.yellow(`  ⚠️  ${identifier} - No baseline found`));
        }
        continue;
      }

      comparisons.push({
        baseline,
        current: result.image,
        identifier,
      });
    }

    // Perform comparisons
    const comparisonResults = await compareEngine.compareAll(comparisons, diffOptions);

    // Save diff images and generate report
    const timestamp = new Date();
    let failedCount = 0;
    let passedCount = 0;

    console.log();
    console.log(chalk.blue('Comparison results:'));

    for (const result of comparisonResults) {
      if (result.passed) {
        console.log(chalk.green(`  ✓ ${result.identifier}`));
        console.log(chalk.gray(`    Difference: ${(result.difference * 100).toFixed(2)}%`));
        passedCount++;
      } else {
        console.log(chalk.red(`  ✗ ${result.identifier}`));
        console.log(chalk.gray(`    Difference: ${(result.difference * 100).toFixed(2)}% (threshold: ${(diffOptions.threshold * 100).toFixed(2)}%)`));
        
        // Save diff image
        if (result.diffImage) {
          await storage.saveDiff(result, timestamp);
        }
        
        failedCount++;
      }
    }

    // Handle missing baselines
    if (missingBaselines.length > 0) {
      console.log();
      console.log(chalk.yellow(`⚠️  ${missingBaselines.length} missing baseline(s):`));
      for (const identifier of missingBaselines) {
        console.log(chalk.gray(`    ${identifier}`));
      }
    }

    // Save report
    await storage.saveReport(comparisonResults, timestamp);

    console.log();

    // Output summary
    const totalComparisons = comparisonResults.length;
    const newBaselines = missingBaselines.length;

    if (failedCount === 0 && newBaselines === 0) {
      console.log(chalk.bold.green(`🎉 All ${totalComparisons} comparison(s) passed!`));
      console.log();
      return 0;
    } else {
      console.log(chalk.bold.yellow('⚠️  Visual differences detected'));
      console.log(chalk.gray(`   Passed: ${passedCount}`));
      console.log(chalk.gray(`   Failed: ${failedCount}`));
      if (newBaselines > 0) {
        console.log(chalk.gray(`   New: ${newBaselines}`));
      }
      console.log();
      
      if (failedCount > 0) {
        console.log(chalk.blue('ℹ️  Next steps:'));
        console.log(chalk.gray('  1. Review diff images in .visdiff/diffs/'));
        console.log(chalk.gray('  2. Run "visdiff approve" to accept changes as new baselines'));
      }
      
      if (newBaselines > 0 && options.failOnMissing !== false) {
        console.log(chalk.blue('ℹ️  Missing baselines:'));
        console.log(chalk.gray('  Run "visdiff capture" to create baselines for new screenshots'));
      }
      
      console.log();
      return 1;
    }
  } catch (error) {
    console.error(chalk.red('✗ Comparison failed'));
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
