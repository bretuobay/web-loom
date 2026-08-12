#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  formatCompileCallsInSource,
  formatSourceLinkedDiagnostic,
} from '../dist/index.es.js';

const args = process.argv.slice(2);
const check = args.includes('--check');
const write = args.includes('--write') || (!check && !args.includes('--stdout'));
const files = args.filter((arg) => !arg.startsWith('--'));

if (files.length === 0) {
  console.error(
    'Usage: template-core-format-calls [--write|--check|--stdout] <file.ts> [file2.ts ...]',
  );
  process.exitCode = 1;
} else {
  let exitCode = 0;

  for (const file of files) {
    const filePath = resolve(file);
    const source = readFileSync(filePath, 'utf8');
    const result = formatCompileCallsInSource(source, { filePath });

    for (const diagnostic of result.diagnostics) {
      console.error(formatSourceLinkedDiagnostic(diagnostic));
      if (diagnostic.severity === 'error') {
        exitCode = 1;
      }
    }

    if (exitCode !== 0) continue;

    if (!result.changed) continue;

    if (check) {
      console.error(`${filePath}: template literals are not formatted`);
      exitCode = 1;
      continue;
    }

    if (write) {
      writeFileSync(filePath, result.source, 'utf8');
      console.log(`Formatted template literals in ${filePath}`);
    } else {
      process.stdout.write(result.source);
    }
  }

  process.exitCode = exitCode;
}
