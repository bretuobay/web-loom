import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { detectPackageManager } from './detect.js';

export function buildViteArgs(pm: string, projectName?: string): string[] {
  switch (pm) {
    case 'pnpm':
      return ['create', 'vite', ...(projectName ? [projectName] : []), '--no-immediate'];
    case 'yarn':
      return ['create', 'vite', ...(projectName ? [projectName] : []), '--no-immediate'];
    case 'bun':
      return ['create', 'vite', ...(projectName ? [projectName] : []), '--no-immediate'];
    default:
      // npm: npm create vite@latest [name] -- --no-immediate
      return ['create', 'vite@latest', ...(projectName ? [projectName] : []), '--', '--no-immediate'];
  }
}

function inferCreatedDir(before: string[]): string | undefined {
  const after = readdirSync(process.cwd());
  const newDirs = after.filter(
    (d) => !before.includes(d) && !d.startsWith('.'),
  );
  return newDirs[0];
}

export function runVite(projectName?: string): { projectDir: string; projectName: string } {
  const pm = detectPackageManager();
  const args = buildViteArgs(pm, projectName);
  const cwd = process.cwd();

  // Snapshot existing dirs before Vite runs so we can detect the new one
  const dirsBefore = readdirSync(cwd);

  console.log('\nRunning create-vite with --no-immediate so Web Loom post-scaffold steps can complete...');
  const result = spawnSync(pm, args, { stdio: 'inherit', shell: true, cwd });

  if (result.status !== 0) {
    throw new Error('Vite scaffolding was cancelled or failed before Web Loom post-processing could run.');
  }

  let resolvedName: string;
  if (projectName) {
    resolvedName = projectName;
  } else {
    const inferred = inferCreatedDir(dirsBefore);
    if (!inferred) {
      throw new Error('Could not detect the project directory created by Vite.');
    }
    resolvedName = inferred;
  }

  return {
    projectDir: resolve(cwd, resolvedName),
    projectName: resolvedName,
  };
}
