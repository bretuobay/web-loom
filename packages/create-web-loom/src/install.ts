import { spawnSync } from 'node:child_process';
import { detectPackageManager, type Framework } from './detect.js';
import { getPackages } from './packages.js';

export function installPackages(projectDir: string, framework: Framework): void {
  const pm = detectPackageManager();
  const packages = getPackages(framework);
  const addCmd = pm === 'npm' ? 'install' : 'add';

  console.log(`\nInstalling Web Loom packages with ${pm}...\n`);

  const result = spawnSync(pm, [addCmd, ...packages], {
    stdio: 'inherit',
    cwd: projectDir,
    shell: true,
  });

  if (result.status !== 0) {
    throw new Error('Failed to install Web Loom packages.');
  }
}
