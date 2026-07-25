#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { precompile } from '../dist/compiler.es.js';

const args = process.argv.slice(2);
const valueFor = (name) => {
  const index = args.indexOf(name);
  return index === -1 ? undefined : args[index + 1];
};

const input = valueFor('--input') ?? args.find((arg) => !arg.startsWith('--'));
const output = valueFor('--output');
if (!input || !output) {
  console.error('Usage: template-core-precompile --input template.html --output template.plan.json [--name Name]');
  process.exitCode = 1;
} else {
  const sourcePath = resolve(input);
  const plan = precompile(await readFile(sourcePath, 'utf8'), {
    name: valueFor('--name'),
    sourcePath,
  });
  const outputPath = resolve(output);
  await writeFile(outputPath, `${JSON.stringify(plan, null, 2)}\n`, 'utf8');
  console.log(`Wrote ${outputPath}`);
}
