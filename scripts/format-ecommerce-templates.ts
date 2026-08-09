#!/usr/bin/env tsx
/**
 * Format template literals in ecommerce demo templates.
 * Uses source imports so it works before `dist/` is built (tsx + monorepo only).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { formatTemplate } from '../packages/template-core/src/compiler/format.ts';
import { DEFAULT_SPECIFIERS } from '../packages/template-core-tooling/src/constants.ts';
import { findCompileCalls } from '../packages/template-core-tooling/src/find-compile-calls.ts';
import { encodeTemplateLiteralContent } from '../packages/template-core-tooling/src/format-compile-calls.ts';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const templateDir = resolve(root, 'apps/ecommerce-template-core/src/templates');

const files = [
  'app-shell.ts',
  'cart-drawer.ts',
  'checkout.ts',
  'command-palette.ts',
  'confirmation-dialog.ts',
  'header.ts',
  'not-found.ts',
  'storefront.ts',
  'toast.ts',
];

const check = process.argv.includes('--check');
let exitCode = 0;

for (const name of files) {
  const filePath = resolve(templateDir, name);
  const source = readFileSync(filePath, 'utf8');
  const { matches } = findCompileCalls(source, filePath, DEFAULT_SPECIFIERS);

  let next = source;
  let changed = false;

  for (const match of [...matches].reverse()) {
    const result = formatTemplate(match.templateSource, {
      name: match.name,
      sourcePath: filePath,
    });

    if (!result.ok) {
      for (const diagnostic of result.diagnostics) {
        if (diagnostic.severity === 'error') {
          console.error(`${filePath}: ${diagnostic.code}: ${diagnostic.message}`);
          exitCode = 1;
        }
      }
      continue;
    }

    if (result.unchanged || !result.formatted) continue;

    const encoded = encodeTemplateLiteralContent(result.formatted);
    next = next.slice(0, match.templateContentStart) + encoded + next.slice(match.templateContentEnd);
    changed = true;
  }

  if (exitCode !== 0) continue;

  if (!changed) continue;

  if (check) {
    console.error(`${filePath}: template literals are not formatted`);
    exitCode = 1;
  } else {
    writeFileSync(filePath, next, 'utf8');
    console.log(`Formatted ${filePath}`);
  }
}

process.exit(exitCode);
