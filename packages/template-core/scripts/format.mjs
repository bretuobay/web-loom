#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { formatTemplate } from '../dist/compiler-node.es.js';

const args = process.argv.slice(2);
const valueFor = (name) => {
  const index = args.indexOf(name);
  return index === -1 ? undefined : args[index + 1];
};

const input = valueFor('--input') ?? args.find((arg) => !arg.startsWith('--'));
const write = args.includes('--write');
const check = args.includes('--check');
const indent = Number(valueFor('--indent') ?? 2);

if (!input) {
  console.error(
    'Usage: template-core-format --input template.html [--write] [--check] [--indent 2] [--name Name]',
  );
  process.exitCode = 1;
} else {
  const sourcePath = resolve(input);
  const source = await readFile(sourcePath, 'utf8');
  const result = formatTemplate(source, {
    name: valueFor('--name'),
    sourcePath,
    indent: Number.isFinite(indent) ? indent : 2,
  });

  if (!result.ok) {
    for (const diagnostic of result.diagnostics) {
      const location =
        diagnostic.line != null
          ? `${diagnostic.sourcePath ?? sourcePath}:${diagnostic.line}:${diagnostic.column ?? 1}`
          : (diagnostic.sourcePath ?? sourcePath);
      console.error(`[${diagnostic.severity}] ${location} ${diagnostic.code}: ${diagnostic.message}`);
    }
    process.exitCode = 1;
  } else if (check && !result.unchanged) {
    console.error(`${sourcePath} is not formatted`);
    process.exitCode = 1;
  } else if (write) {
    if (!result.unchanged && result.formatted) {
      await writeFile(sourcePath, result.formatted, 'utf8');
      console.log(`Formatted ${sourcePath}`);
    }
  } else {
    process.stdout.write(result.formatted ?? source);
  }
}
