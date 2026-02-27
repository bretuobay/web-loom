import { describe, expect, it, vi, beforeEach } from 'vitest';
import { installPackages } from '../install.js';
import * as childProcess from 'node:child_process';
import * as detect from '../detect.js';
import * as pkgList from '../packages.js';

vi.mock('node:child_process', () => ({
  spawnSync: vi.fn(),
}));

vi.mock('../detect.js', async () => {
  const actual = await vi.importActual<typeof import('../detect.js')>('../detect.js');
  return {
    ...actual,
    detectPackageManager: vi.fn(),
  };
});

vi.mock('../packages.js', async () => {
  const actual = await vi.importActual<typeof import('../packages.js')>('../packages.js');
  return {
    ...actual,
    getPackages: vi.fn(),
  };
});

describe('installPackages', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(detect.detectPackageManager).mockReturnValue('npm');
    vi.mocked(pkgList.getPackages).mockReturnValue(['@web-loom/a', '@web-loom/b']);
  });

  it('returns when bulk install succeeds', () => {
    vi.mocked(childProcess.spawnSync).mockReturnValue({ status: 0 } as never);

    expect(() => installPackages('/tmp/project', 'react')).not.toThrow();
    expect(childProcess.spawnSync).toHaveBeenCalledTimes(1);
    expect(childProcess.spawnSync).toHaveBeenCalledWith(
      'npm',
      ['install', '@web-loom/a', '@web-loom/b'],
      expect.objectContaining({ cwd: '/tmp/project' }),
    );
  });

  it('falls back to per-package install when bulk install fails', () => {
    vi.mocked(childProcess.spawnSync)
      .mockReturnValueOnce({ status: 1 } as never)
      .mockReturnValueOnce({ status: 0 } as never)
      .mockReturnValueOnce({ status: 1 } as never);

    expect(() => installPackages('/tmp/project', 'react')).not.toThrow();
    expect(childProcess.spawnSync).toHaveBeenCalledTimes(3);
    expect(childProcess.spawnSync).toHaveBeenNthCalledWith(
      2,
      'npm',
      ['install', '@web-loom/a'],
      expect.objectContaining({ cwd: '/tmp/project' }),
    );
    expect(childProcess.spawnSync).toHaveBeenNthCalledWith(
      3,
      'npm',
      ['install', '@web-loom/b'],
      expect.objectContaining({ cwd: '/tmp/project' }),
    );
  });

  it('throws when all package installs fail', () => {
    vi.mocked(childProcess.spawnSync)
      .mockReturnValueOnce({ status: 1 } as never)
      .mockReturnValueOnce({ status: 1 } as never)
      .mockReturnValueOnce({ status: 1 } as never);

    expect(() => installPackages('/tmp/project', 'react')).toThrow(
      'Failed to install Web Loom packages. None of the packages could be installed.',
    );
  });
});
