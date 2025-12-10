#!/usr/bin/env node

/**
 * @web-loom/visdiff CLI Entry Point
 *
 * This is the main entry point for the visdiff command-line tool.
 */

import { Command } from 'commander';
import { initCommand } from './commands/init.js';
import { captureCommand } from './commands/capture.js';
import { compareCommand } from './commands/compare.js';
import { approveCommand } from './commands/approve.js';
import { statusCommand } from './commands/status.js';
import { watchCommand } from './commands/watch.js';

const program = new Command();

program.name('visdiff').description('Local-first visual regression testing tool').version('0.1.0');

/**
 * Init Command
 * Initialize visdiff in a project with default configuration
 */
program
  .command('init')
  .description('Initialize visdiff in your project')
  .option('-c, --config <path>', 'Path to configuration file', 'visdiff.config.js')
  .option('-f, --force', 'Overwrite existing configuration', false)
  .action(async (options) => {
    const exitCode = await initCommand(options);
    process.exit(exitCode);
  });

/**
 * Capture Command
 * Capture baseline screenshots for specified URLs
 */
program
  .command('capture')
  .description('Capture baseline screenshots')
  .argument('[urls...]', 'URLs to capture (uses config if not specified)')
  .option('-c, --config <path>', 'Path to configuration file', 'visdiff.config.js')
  .option('-v, --viewport <name>', 'Capture only specific viewport')
  .option('--full-page', 'Capture full page (override config)')
  .option('--timeout <ms>', 'Navigation timeout in milliseconds', '30000')
  .action(async (urls, options) => {
    const exitCode = await captureCommand(urls, options);
    process.exit(exitCode);
  });

/**
 * Compare Command
 * Compare current screenshots against baselines
 */
program
  .command('compare')
  .description('Compare current screenshots against baselines')
  .argument('[urls...]', 'URLs to compare (uses config if not specified)')
  .option('-c, --config <path>', 'Path to configuration file', 'visdiff.config.js')
  .option('-t, --threshold <value>', 'Diff threshold (0-1)', '0.01')
  .option('--update-on-pass', 'Update baselines if comparison passes', false)
  .option('--fail-on-missing', 'Fail if baseline is missing', true)
  .action(async (urls, options) => {
    const exitCode = await compareCommand(urls, options);
    process.exit(exitCode);
  });

/**
 * Approve Command
 * Approve visual changes as new baselines
 */
program
  .command('approve')
  .description('Approve visual changes as new baselines')
  .argument('[identifiers...]', 'Specific identifiers to approve (approves all if not specified)')
  .option('-c, --config <path>', 'Path to configuration file', 'visdiff.config.js')
  .option('--no-backup', 'Skip creating backup of old baselines', false)
  .action(async (identifiers, options) => {
    const exitCode = await approveCommand(identifiers, options);
    process.exit(exitCode);
  });

/**
 * Status Command
 * Check current diff status
 */
program
  .command('status')
  .description('Check current diff status')
  .option('-c, --config <path>', 'Path to configuration file', 'visdiff.config.js')
  .option('-v, --verbose', 'Show detailed status information', false)
  .option('--json', 'Output status as JSON', false)
  .action(async (options) => {
    const exitCode = await statusCommand(options);
    process.exit(exitCode);
  });

/**
 * Watch Command
 * Watch for changes and automatically compare
 */
program
  .command('watch')
  .description('Watch for changes and automatically compare')
  .argument('[url]', 'URL to watch (uses config if not specified)')
  .option('-c, --config <path>', 'Path to configuration file', 'visdiff.config.js')
  .option('-i, --interval <ms>', 'Polling interval in milliseconds', '2000')
  .option('--debounce <ms>', 'Debounce delay in milliseconds', '500')
  .action(async (url, options) => {
    const exitCode = await watchCommand(url, options);
    process.exit(exitCode);
  });

// Add help examples
program.addHelpText(
  'after',
  `

Examples:
  $ visdiff init
  $ visdiff capture http://localhost:3000
  $ visdiff compare
  $ visdiff approve home-mobile home-tablet
  $ visdiff status --verbose
  $ visdiff watch http://localhost:3000

For more information, visit: https://github.com/bretuobay/web-loom.git/visdiff
`,
);

// Parse command line arguments
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
