const { spawn } = require('child_process');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');

function pad(str, width) {
  const padded = `${str}`.padEnd(width, ' ');
  return padded.slice(0, width);
}

function formatAppTable(apps) {
  const nameCol = 28;
  const portCol = 6;
  const frameworkCol = 30;
  const header = `${pad('NAME', nameCol)} ${pad('PORT', portCol)} ${pad('FRAMEWORK', frameworkCol)} NOTES`;
  const rows = apps.map((app) => {
    return `${pad(app.displayName, nameCol)} ${pad(String(app.port), portCol)} ${pad(app.framework, frameworkCol)} ${app.notes || ''}`;
  });
  return [header, ...rows].join('\n');
}

function printDemoIntro(title, summaryLines) {
  console.log('='.repeat(60));
  console.log(`🎯 ${title}`);
  console.log('This helper is for demo + exploratory work. Ports are pinned.');
  summaryLines.forEach((line) => console.log(line));
  console.log('Read PORT_ASSIGNMENTS.md if you need alternative ports or to add new apps.');
  console.log('Press CTRL+C once to stop all child servers.');
  console.log('='.repeat(60));
}

function spawnApp(target) {
  const commandParts = (target.command || 'npm run dev').split(' ').filter(Boolean);
  if (!commandParts.length) {
    throw new Error(`Invalid command for ${target.id}`);
  }
  const bin = commandParts[0];
  const args = commandParts.slice(1);
  const cwd = path.join(ROOT, target.path);
  const child = spawn(bin, args, {
    cwd,
    env: { ...process.env },
    stdio: 'inherit',
  });

  child.on('error', (err) => {
    console.error(`[${target.displayName}] failed to start:`, err.message);
  });

  child.on('exit', (code, signal) => {
    if (signal) {
      console.log(`[${target.displayName}] stopped (${signal})`);
    } else {
      console.log(`[${target.displayName}] exited with code ${code}`);
    }
  });

  return child;
}

function registerShutdown(children) {
  const signals = ['SIGINT', 'SIGTERM'];
  signals.forEach((signal) => {
    process.on(signal, () => {
      console.log(`\n[dev-helper] Received ${signal}, aborting ${children.length} child process(es)...`);
      children.forEach((child) => {
        if (!child.killed) {
          child.kill(signal);
        }
      });
    });
  });
}

module.exports = {
  formatAppTable,
  printDemoIntro,
  spawnApp,
  registerShutdown,
};
