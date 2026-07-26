import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const srcDir = dirname(fileURLToPath(import.meta.url));

const FORBIDDEN = [/from ['"]parse5['"]/, /from ['"]node:/, /require\(['"]node:/];

/** Node-only by design; excluded from the browser-boundary scan. */
const EXCLUDED_DIRS = ['ssr'];
const EXCLUDED_FILES = ['compiler/node.ts'];

function collectSourceFiles(dir: string, base = dir): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    const rel = relative(base, full);
    if (entry.isDirectory()) {
      if (EXCLUDED_DIRS.includes(entry.name)) continue;
      files.push(...collectSourceFiles(full, base));
      continue;
    }
    if (!entry.name.endsWith('.ts') || entry.name.endsWith('.test.ts')) continue;
    if (EXCLUDED_FILES.includes(rel)) continue;
    files.push(full);
  }
  return files;
}

describe('source-level bundle boundary guard', () => {
  it('browser-facing source files never import parse5 or node: built-ins', () => {
    const files = collectSourceFiles(srcDir);
    expect(files.length).toBeGreaterThan(10);

    const violations: string[] = [];
    for (const file of files) {
      const source = readFileSync(file, 'utf8');
      for (const pattern of FORBIDDEN) {
        if (pattern.test(source)) violations.push(`${relative(srcDir, file)} matches ${pattern}`);
      }
    }
    expect(violations).toEqual([]);
  });
});
