#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..', '..');
const targetFile = path.join(projectRoot, 'node_modules', 'vite', 'dist', 'node', 'chunks', 'dep-D4NMHUTW.js');
const brokenLine = 'const { fileURLToPath, pathToFileURL } = require$$1$1;';
const fixedLine = 'const { fileURLToPath, pathToFileURL } = require$1$1;';

function log(message) {
  console.log(`[vite-patch] ${message}`);
}

try {
  const original = fs.readFileSync(targetFile, 'utf8');

  if (original.includes(fixedLine)) {
    log('Patch already applied.');
    process.exit(0);
  }

  if (!original.includes(brokenLine)) {
    log('Pattern not found. Skipping patch.');
    process.exit(0);
  }

  const updated = original.replace(brokenLine, fixedLine);
  fs.writeFileSync(targetFile, updated, 'utf8');
  log('Applied require alias fix for Vite.');
} catch (error) {
  if (error.code === 'ENOENT') {
    log('Target file not found. Skipping patch.');
    process.exit(0);
  }

  console.error('[vite-patch] Failed to patch Vite chunk:', error);
  process.exit(1);
}
