import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { detectPackageManager } from './detect.js';

function buildViteArgs(pm: string, projectName?: string): string[] {
  switch (pm) {
    case 'pnpm':
      return ['create', 'vite', ...(projectName ? [projectName] : [])];
    case 'yarn':
      return ['create', 'vite', ...(projectName ? [projectName] : [])];
    case 'bun':
      return ['create', 'vite', ...(projectName ? [projectName] : [])];
    default:
      // npm: npm create vite@latest [name]
      return ['create', 'vite@latest', ...(projectName ? [projectName] : [])];
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

  const result = spawnSync(pm, args, { stdio: 'inherit', shell: true, cwd });

  if (result.status !== 0) {
    throw new Error('Vite scaffolding failed or was cancelled.');
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
