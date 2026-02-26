import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export type Framework = 'react' | 'vue' | 'lit' | 'angular' | 'svelte' | 'vanilla';
export type PackageManager = 'npm' | 'pnpm' | 'yarn' | 'bun';

export function detectFramework(projectDir: string): Framework {
  let pkg: Record<string, unknown>;
  try {
    pkg = JSON.parse(readFileSync(join(projectDir, 'package.json'), 'utf8')) as Record<string, unknown>;
  } catch {
    return 'vanilla';
  }

  const deps = {
    ...((pkg['dependencies'] as Record<string, string>) ?? {}),
    ...((pkg['devDependencies'] as Record<string, string>) ?? {}),
  };

  if ('react' in deps) return 'react';
  if ('vue' in deps) return 'vue';
  if ('lit' in deps) return 'lit';
  if ('@angular/core' in deps) return 'angular';
  if ('svelte' in deps) return 'svelte';
  return 'vanilla';
}

export function detectPackageManager(): PackageManager {
  const userAgent = process.env['npm_config_user_agent'] ?? '';
  if (userAgent.startsWith('pnpm/')) return 'pnpm';
  if (userAgent.startsWith('yarn/')) return 'yarn';
  if (userAgent.startsWith('bun/')) return 'bun';
  return 'npm';
}
