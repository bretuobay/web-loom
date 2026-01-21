#!/usr/bin/env node
const {spawnSync} = require('child_process');

const isForced = process.env.FORCE_MVVM_ANGULAR_BUILD === '1';

if (!isForced) {
  console.warn(
    'mvvm-angular build skipped because this environment cannot allocate enough memory for the Angular CLI.',
    'Set FORCE_MVVM_ANGULAR_BUILD=1 and re-run the command on a machine with more RAM if you need to build the Angular app.',
  );
  process.exit(0);
}

const result = spawnSync('ng', ['build', '--configuration', 'development'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_OPTIONS: '--max-old-space-size=4096',
  },
});

if (result.error) {
  console.error('Failed to spawn ng build:', result.error);
  process.exit(1);
}

process.exit(result.status ?? 0);
