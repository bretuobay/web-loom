#!/usr/bin/env node

/**
 * @web-loom/visdiff CLI Entry Point
 * 
 * This is the main entry point for the visdiff command-line tool.
 * It will be expanded in future tasks to include command parsing and execution.
 */

import { Command } from 'commander';

const program = new Command();

program
  .name('visdiff')
  .description('Local-first visual regression testing tool')
  .version('0.1.0');

// Commands will be added in subsequent tasks:
// - init: Initialize visdiff in a project
// - capture: Capture baseline screenshots
// - compare: Compare current screenshots against baselines
// - approve: Approve visual changes as new baselines
// - watch: Watch for changes and auto-compare
// - status: Check current diff status

program.parse(process.argv);
