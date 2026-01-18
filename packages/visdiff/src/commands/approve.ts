/**
 * Approve Command Implementation
 * Approves visual changes as new baselines
 */

import chalk from 'chalk';
import { StorageManager } from '../storage/storage-manager.js';
import { loadConfig } from '../config/loader.js';
import type { VisDiffConfig } from '../config/schema.js';

export interface ApproveOptions {
  config?: string;
  backup?: boolean;
}

/**
 * Execute the approve command
 */
export async function approveCommand(identifiers: string[], options: ApproveOptions = {}): Promise<number> {
  const cwd = process.cwd();

  try {
    // Load configuration
    console.log(chalk.blue('Loading configuration...'));
    const config: VisDiffConfig = await loadConfig(cwd);

    // Initialize storage manager
    const storage = new StorageManager(cwd, config.storage);
    await storage.initialize();

    // Get the latest comparison report to find current screenshots
    console.log(chalk.blue('Loading latest comparison results...'));
    const report = await storage.getLatestReport();

    if (!report) {
      console.log(chalk.yellow('⚠️  No comparison results found'));
      console.log(chalk.gray('  Run "visdiff compare" first to generate comparison results'));
      return 0;
    }

    // Build map of current screenshots from the latest comparison
    // We need to re-capture or use the stored current screenshots
    // For now, we'll check which baselines exist and can be approved

    // Get all failed comparisons that need approval
    const failedResults = report.results.filter((r) => !r.passed && !r.error);

    if (failedResults.length === 0) {
      console.log(chalk.green('✓ No pending changes to approve'));
      console.log(chalk.gray('  All comparisons passed in the last run'));
      return 0;
    }

    // Determine which identifiers to approve
    const toApprove =
      identifiers.length > 0
        ? identifiers.filter((id) => failedResults.some((r) => r.identifier === id))
        : failedResults.map((r) => r.identifier);

    if (toApprove.length === 0) {
      console.log(chalk.yellow('⚠️  No matching identifiers found'));
      console.log(chalk.gray('  Available identifiers:'));
      for (const result of failedResults) {
        console.log(chalk.gray(`    - ${result.identifier}`));
      }
      return 0;
    }

    console.log(chalk.blue(`Approving ${toApprove.length} change(s)...`));
    console.log();

    // Create backup if enabled (default: true)
    if (options.backup !== false) {
      console.log(chalk.blue('Creating backup of existing baselines...'));
      await storage.backupBaselines();
      console.log(chalk.green('✓ Backup created'));
      console.log();
    }

    // For each identifier to approve, we need the current screenshot
    // In a real scenario, we'd need to either:
    // 1. Store current screenshots during comparison
    // 2. Re-capture them here
    // For now, we'll document this limitation and provide a basic implementation

    console.log(chalk.yellow('⚠️  Note: Approve command requires re-capturing screenshots'));
    console.log(chalk.gray('  This will be implemented in the next iteration'));
    console.log();

    // Output list of what would be approved
    console.log(chalk.blue('Would approve the following baselines:'));
    for (const identifier of toApprove) {
      console.log(chalk.gray(`  • ${identifier}`));
    }
    console.log();

    console.log(chalk.blue('ℹ️  To approve changes:'));
    console.log(chalk.gray('  1. Run "visdiff compare" to generate current screenshots'));
    console.log(chalk.gray('  2. Review the diff images in .visdiff/diffs/'));
    console.log(chalk.gray('  3. Copy current screenshots to baselines manually, or'));
    console.log(chalk.gray('  4. Use "visdiff capture" to create new baselines'));
    console.log();

    return 0;
  } catch (error) {
    console.error(chalk.red('✗ Approval failed'));
    console.error(chalk.red((error as Error).message));
    return 1;
  }
}
