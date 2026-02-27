import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

describe('build packaging', () => {
  it('copies templates into dist/templates', () => {
    const result = spawnSync('npm', ['run', 'build'], {
      cwd: packageRoot,
      encoding: 'utf8',
      stdio: 'pipe',
    });

    if (result.status !== 0) {
      throw new Error(`build failed:\n${result.stdout ?? ''}\n${result.stderr ?? ''}`);
    }

    expect(existsSync(join(packageRoot, 'dist/templates/shared/src/viewmodels/CounterViewModel.ts'))).toBe(true);
    expect(existsSync(join(packageRoot, 'dist/templates/react/ts/src/App.tsx'))).toBe(true);
    expect(existsSync(join(packageRoot, 'dist/templates/qwik/ts/src/app.tsx'))).toBe(true);
    expect(existsSync(join(packageRoot, 'dist/templates/qwik/js/src/app.jsx'))).toBe(true);
  });
});
