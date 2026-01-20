#!/usr/bin/env node
const { FRONTENDS, DEMO_API } = require('./constants');
const { formatAppTable, printDemoIntro, spawnApp, registerShutdown } = require('./helpers');

const DEFAULT_FRONTEND = 'mvvm-react';

function showHelp() {
  console.log(`
Usage: node scripts/dev-helper/demo-runner.js [options]

Options:
  --help               Show this help message
  --list               List all known mvvm-* frontends with port info
  --frontends=names    Comma-list the frontends you want to run (default: ${DEFAULT_FRONTEND})
                       Use "all" to run every frontend that can safely run in this demo environment
  --dry-run            Print which commands would run without starting child servers
`);
}

function parseArgs(argv) {
  const opts = {
    list: false,
    dryRun: false,
    requested: [],
  };

  argv.forEach((arg) => {
    if (arg === '--help') {
      opts.help = true;
      return;
    }
    if (arg === '--list') {
      opts.list = true;
      return;
    }
    if (arg === '--dry-run') {
      opts.dryRun = true;
      return;
    }
    if (arg.startsWith('--frontends=')) {
      const value = arg.split('=')[1] || '';
      opts.requested = value.split(',').map((entry) => entry.trim()).filter(Boolean);
      return;
    }
    console.warn(`Unknown option '${arg}'. Use --help for guidance.`);
  });

  const envFrontends = process.env.npm_config_frontends || '';
  if (envFrontends) {
    opts.requested.push(
      ...envFrontends
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean),
    );
  }

  return opts;
}

function resolveFrontends(requested) {
  if (requested.length === 0) {
    return [DEFAULT_FRONTEND];
  }

  const normalized = requested.map((entry) => entry.toLowerCase());
  if (normalized.includes('all')) {
    return FRONTENDS.filter((entry) => entry.recommended).map((entry) => entry.id);
  }

  return normalized;
}

function lookupFrontends(ids) {
  const selected = [];
  const unknown = [];

  ids.forEach((id) => {
    const match = FRONTENDS.find((entry) => entry.id === id);
    if (match) {
      selected.push(match);
    } else {
      unknown.push(id);
    }
  });

  if (unknown.length) {
    console.warn(`Unknown frontend(s): ${unknown.join(', ')}. Falling back to ${DEFAULT_FRONTEND}.`);
    return [FRONTENDS.find((entry) => entry.id === DEFAULT_FRONTEND)];
  }

  return selected;
}

function formatCommand(target) {
  return `cd ${target.path} && ${target.command}`;
}

function runDemo(selectedFrontends, opts) {
  const targets = [DEMO_API, ...selectedFrontends];
  printDemoIntro('Web Loom Demo Runner', [
    `Demo API port: ${DEMO_API.port}`,
    `Frontends: ${selectedFrontends.map((entry) => `${entry.id} (port ${entry.port})`).join(', ')}`,
    'All work here is demo-only; seeded database, strict ports, no production guarantees.',
  ]);

  console.log('\nPort assignments for this session:');
  console.log(formatAppTable(targets));

  if (opts.dryRun) {
    console.log('\nDry run (no servers starting):');
    targets.forEach((target) => {
      console.log(`  → ${formatCommand(target)}`);
    });
    return;
  }

  const running = [];
  const apiProcess = spawnApp(DEMO_API);
  running.push(apiProcess);

  setTimeout(() => {
    selectedFrontends.forEach((frontend) => {
      const child = spawnApp(frontend);
      running.push(child);
    });
  }, 1200);

  registerShutdown(running);
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) {
    showHelp();
    return;
  }
  if (opts.list) {
    console.log('Known mvvm-* frontends and their ports:');
    console.log(formatAppTable(FRONTENDS));
    return;
  }

  const frontendIds = resolveFrontends(opts.requested);
  const frontends = lookupFrontends(frontendIds);

  runDemo(frontends, opts);
}

main();
