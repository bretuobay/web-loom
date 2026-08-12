#!/usr/bin/env node
/**
 * Build a minimal VSIX from an isolated staging folder so workspace symlinks
 * (hoisted node_modules, monorepo root) are never bundled into the extension.
 */
import { execSync } from 'node:child_process';
import { cpSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const stageRoot = join(packageRoot, '.vsix-stage');

const COPY_PATHS = ['package.json', 'language-configuration.json', 'README.md', 'LICENSE', 'syntaxes'];

rmSync(stageRoot, { recursive: true, force: true });
mkdirSync(stageRoot, { recursive: true });

for (const relativePath of COPY_PATHS) {
  cpSync(join(packageRoot, relativePath), join(stageRoot, relativePath), { recursive: true });
}

execSync('npx vsce package --allow-missing-repository --no-dependencies --out .', {
  cwd: stageRoot,
  stdio: 'inherit',
});

const vsixName = readdirSync(stageRoot).find((entry) => entry.endsWith('.vsix'));
if (!vsixName) {
  throw new Error('vsce did not produce a .vsix file');
}

const outputPath = join(packageRoot, vsixName);
cpSync(join(stageRoot, vsixName), outputPath);
rmSync(stageRoot, { recursive: true, force: true });

console.log(`\nVSIX ready: ${outputPath}`);
