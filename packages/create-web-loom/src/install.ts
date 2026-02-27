import { spawnSync } from 'node:child_process';
import { detectPackageManager, type Framework } from './detect.js';
import { getPackages } from './packages.js';

function installBatch(
  packageManager: string,
  command: string,
  projectDir: string,
  packages: string[],
): number | null {
  const result = spawnSync(packageManager, [command, ...packages], {
    stdio: 'inherit',
    cwd: projectDir,
    shell: true,
  });

  return result.status;
}

export function installPackages(projectDir: string, framework: Framework): void {
  const pm = detectPackageManager();
  const packages = getPackages(framework);
  const addCmd = pm === 'npm' ? 'install' : 'add';

  console.log(`\nInstalling Web Loom packages with ${pm}...\n`);

  const firstPassStatus = installBatch(pm, addCmd, projectDir, packages);
  if (firstPassStatus === 0) {
    return;
  }

  console.warn('\nBulk install failed. Retrying package-by-package and skipping unavailable packages...\n');

  const installedPackages: string[] = [];
  const skippedPackages: string[] = [];

  for (const pkg of packages) {
    console.log(`Installing ${pkg}...`);
    const status = installBatch(pm, addCmd, projectDir, [pkg]);
    if (status === 0) {
      installedPackages.push(pkg);
    } else {
      skippedPackages.push(pkg);
    }
  }

  if (skippedPackages.length > 0) {
    console.warn(`\nSkipped packages: ${skippedPackages.join(', ')}`);
  }

  if (installedPackages.length === 0) {
    throw new Error('Failed to install Web Loom packages. None of the packages could be installed.');
  }
}
