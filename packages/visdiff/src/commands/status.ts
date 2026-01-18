/**
 * Status Command Implementation
 * Displays the current diff status from the latest comparison
 */

import chalk from 'chalk';
import { StorageManager } from '../storage/storage-manager.js';
import { loadConfig } from '../config/loader.js';

export interface StatusOptions {
  config?: string;
  verbose?: boolean;
  json?: boolean;
}

/**
 * Execute the status command
 */
export async function statusCommand(options: StatusOptions = {}): Promise<number> {
  const cwd = process.cwd();

  try {
    // Load configuration
    const config = await loadConfig(cwd);
    const storage = new StorageManager(cwd, config.storage);

    // Load latest report
    const report = await storage.getLatestReport();

    // Handle case when no comparisons exist
    if (!report) {
      if (options.json) {
        console.log(JSON.stringify({ status: 'no_comparisons' }, null, 2));
      } else {
        console.log(chalk.yellow('⚠️  No comparison results found'));
        console.log(chalk.gray('  Run "visdiff compare" to perform your first comparison'));
      }
      return 0;
    }

    // Output as JSON if requested
    if (options.json) {
      const jsonOutput = {
        timestamp: report.timestamp.toISOString(),
        summary: report.summary,
        failed: report.results
          .filter((r) => !r.passed && !r.error)
          .map((r) => ({
            identifier: r.identifier,
            difference: r.difference,
            pixelsDifferent: r.pixelsDifferent,
          })),
      };
      console.log(JSON.stringify(jsonOutput, null, 2));
      return 0;
    }

    // Display summary counts
    console.log(chalk.bold.blue('Visual Regression Status'));
    console.log();
    console.log(chalk.gray(`Last comparison: ${formatTimestamp(report.timestamp)}`));
    console.log();

    // Display counts with color coding
    console.log(chalk.bold('Summary:'));
    console.log(chalk.gray(`  Total:  ${report.summary.total}`));

    if (report.summary.passed > 0) {
      console.log(chalk.green(`  Passed: ${report.summary.passed}`));
    }

    if (report.summary.failed > 0) {
      console.log(chalk.red(`  Failed: ${report.summary.failed}`));
    }

    if (report.summary.new > 0) {
      console.log(chalk.yellow(`  New:    ${report.summary.new}`));
    }

    // List failed paths and viewports
    const failedResults = report.results.filter((r) => !r.passed && !r.error);

    if (failedResults.length > 0) {
      console.log();
      console.log(chalk.bold.red('Failed Comparisons:'));

      for (const result of failedResults) {
        console.log(chalk.red(`  ✗ ${result.identifier}`));

        if (options.verbose) {
          console.log(chalk.gray(`    Difference: ${(result.difference * 100).toFixed(2)}%`));
          console.log(chalk.gray(`    Pixels different: ${result.pixelsDifferent.toLocaleString()}`));
          console.log(chalk.gray(`    Dimensions: ${result.dimensions.width}x${result.dimensions.height}`));
        } else {
          console.log(chalk.gray(`    Difference: ${(result.difference * 100).toFixed(2)}%`));
        }
      }

      console.log();
      console.log(chalk.blue('ℹ️  Next steps:'));
      console.log(chalk.gray('  1. Review diff images in .visdiff/diffs/'));
      console.log(chalk.gray('  2. Run "visdiff approve" to accept changes as new baselines'));
      console.log(chalk.gray('  3. Run "visdiff status --verbose" for more details'));
    }

    // List new baselines needed
    const newResults = report.results.filter((r) => r.error);

    if (newResults.length > 0) {
      console.log();
      console.log(chalk.bold.yellow('Missing Baselines:'));

      for (const result of newResults) {
        console.log(chalk.yellow(`  ⚠️  ${result.identifier}`));
      }

      console.log();
      console.log(chalk.blue('ℹ️  Run "visdiff capture" to create baselines'));
    }

    // Overall status
    console.log();
    if (report.summary.failed === 0 && report.summary.new === 0) {
      console.log(chalk.bold.green('✓ All comparisons passing'));
    } else {
      console.log(chalk.bold.yellow('⚠️  Visual differences detected'));
    }

    return 0;
  } catch (error) {
    if (options.json) {
      console.log(JSON.stringify({ error: (error as Error).message }, null, 2));
    } else {
      console.error(chalk.red('✗ Failed to check status'));
      console.error(chalk.red((error as Error).message));
    }
    return 1;
  }
}

/**
 * Format timestamp for display
 */
function formatTimestamp(timestamp: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - timestamp.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMinutes < 1) {
    return 'just now';
  } else if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  } else {
    return timestamp.toLocaleString();
  }
}
