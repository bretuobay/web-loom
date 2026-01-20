#!/usr/bin/env node
const { TASK_FLOW_TARGETS } = require('./constants');
const { formatAppTable, printDemoIntro, spawnApp, registerShutdown } = require('./helpers');

function showHelp() {
  console.log(`
Usage: node scripts/dev-helper/task-flow-runner.js [--dry-run]

  --dry-run   Show which commands would run without starting servers
  --help      Show this help text
`);
}

function main() {
  const args = process.argv.slice(2);
  if (args.includes('--help')) {
    showHelp();
    return;
  }

  const dryRun = args.includes('--dry-run');
  printDemoIntro('Task Flow Pair Runner', [
    `Ports: task-flow-api (${TASK_FLOW_TARGETS[0].port}), task-flow-ui (${TASK_FLOW_TARGETS[1].port})`,
    'The Task Flow stack ships as a pair and shares seeded/demo data.',
  ]);

  console.log('\nPinned ports for this session:');
  console.log(formatAppTable(TASK_FLOW_TARGETS));

  if (dryRun) {
    console.log('\nDry run commands:');
    TASK_FLOW_TARGETS.forEach((target) => {
      console.log(`  → cd ${target.path} && ${target.command}`);
    });
    return;
  }

  const children = [];
  TASK_FLOW_TARGETS.forEach((target) => {
    children.push(spawnApp(target));
  });

  registerShutdown(children);
}

main();
