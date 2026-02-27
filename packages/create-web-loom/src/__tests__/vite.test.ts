import { describe, expect, it, vi, beforeEach } from 'vitest';
import { buildViteArgs, runVite } from '../vite.js';
import * as childProcess from 'node:child_process';
import * as fs from 'node:fs';
import * as detect from '../detect.js';

vi.mock('node:child_process', () => ({
  spawnSync: vi.fn(),
}));

vi.mock('node:fs', () => ({
  readdirSync: vi.fn(),
}));

vi.mock('../detect.js', async () => {
  const actual = await vi.importActual<typeof import('../detect.js')>('../detect.js');
  return {
    ...actual,
    detectPackageManager: vi.fn(),
  };
});

describe('buildViteArgs', () => {
  it('adds -- --no-immediate for npm', () => {
    expect(buildViteArgs('npm', 'my-app')).toEqual(['create', 'vite@latest', 'my-app', '--', '--no-immediate']);
    expect(buildViteArgs('npm')).toEqual(['create', 'vite@latest', '--', '--no-immediate']);
  });

  it('adds --no-immediate for pnpm/yarn/bun', () => {
    expect(buildViteArgs('pnpm', 'my-app')).toEqual(['create', 'vite', 'my-app', '--no-immediate']);
    expect(buildViteArgs('yarn', 'my-app')).toEqual(['create', 'vite', 'my-app', '--no-immediate']);
    expect(buildViteArgs('bun', 'my-app')).toEqual(['create', 'vite', 'my-app', '--no-immediate']);
  });
});

describe('runVite', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(detect.detectPackageManager).mockReturnValue('npm');
    vi.mocked(fs.readdirSync).mockReturnValue([] as never);
  });

  it('throws a clear error when create-vite exits non-zero', () => {
    vi.mocked(childProcess.spawnSync).mockReturnValue({ status: 1 } as never);

    expect(() => runVite('my-app')).toThrow(
      'Vite scaffolding was cancelled or failed before Web Loom post-processing could run.',
    );
  });
});
