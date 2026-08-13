#!/usr/bin/env node
/**
 * Remove stale nested react/react-dom copies from workspaces and refresh the lockfile.
 * Run from repo root: npm run dedupe:react
 */
import { execSync } from 'node:child_process';
import { existsSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(new URL(import.meta.url)));
const repoRoot = join(root, '..');

const nestedPaths = [
  'apps/mvvm-react-native/node_modules/react-dom',
  'apps/mvvm-react-native/node_modules/react',
  'packages/ui-core/node_modules/react-dom',
  'packages/ui-core/node_modules/react',
  'packages/ui-core/node_modules/@testing-library/react',
  'packages/ui-core/node_modules/@types/react-dom',
];

for (const relativePath of nestedPaths) {
  const absolutePath = join(repoRoot, relativePath);
  if (existsSync(absolutePath)) {
    rmSync(absolutePath, { recursive: true, force: true });
    console.log(`removed ${relativePath}`);
  }
}

const run = (command) => {
  console.log(`\n> ${command}`);
  execSync(command, { cwd: repoRoot, stdio: 'inherit' });
};

run('npm install @testing-library/react@16.3.0 @types/react-dom@19.2.4 @types/react@19.2.4 react@19.2.3 react-dom@19.2.3 -w @web-loom/ui-core --save-dev --save-exact');
run('npm install react@19.2.3 react-dom@19.2.3 -w mvvm-react-native --save-exact');
run('npm install');
run('npm exec -w mvvm-react-native -- expo install react react-dom --fix');

console.log('\nDone. Verify with:');
console.log('  node -e "..."  # react-dom lock entries');
console.log('  cd apps/mvvm-react-native && npx expo-doctor');
