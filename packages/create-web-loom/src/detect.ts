import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export type Framework = 'vanilla' | 'vue' | 'react' | 'preact' | 'lit' | 'svelte' | 'solid' | 'qwik';
export type TemplateVariant = 'ts' | 'js';
export type PackageManager = 'npm' | 'pnpm' | 'yarn' | 'bun';

function readProjectPackage(projectDir: string): Record<string, unknown> | undefined {
  try {
    return JSON.parse(readFileSync(join(projectDir, 'package.json'), 'utf8')) as Record<string, unknown>;
  } catch {
    return undefined;
  }
}

function detectDeps(projectDir: string): Record<string, string> {
  const pkg = readProjectPackage(projectDir);
  if (!pkg) {
    return {};
  }

  return {
    ...((pkg['dependencies'] as Record<string, string>) ?? {}),
    ...((pkg['devDependencies'] as Record<string, string>) ?? {}),
  };
}

export function detectFramework(projectDir: string): Framework {
  const deps = detectDeps(projectDir);

  // Ordered by specificity to avoid false positives.
  if ('@builder.io/qwik' in deps) return 'qwik';
  if ('solid-js' in deps) return 'solid';
  if ('preact' in deps) return 'preact';
  if ('react' in deps) return 'react';
  if ('vue' in deps) return 'vue';
  if ('lit' in deps) return 'lit';
  if ('svelte' in deps) return 'svelte';
  return 'vanilla';
}

function hasAnyFile(projectDir: string, files: readonly string[]): boolean {
  return files.some((file) => existsSync(join(projectDir, file)));
}

export function detectTemplateVariant(projectDir: string, framework?: Framework): TemplateVariant {
  const deps = detectDeps(projectDir);
  if ('typescript' in deps) {
    return 'ts';
  }

  if (
    hasAnyFile(projectDir, [
      'src/main.ts',
      'src/main.tsx',
      'src/App.ts',
      'src/App.tsx',
      'src/app.ts',
      'src/app.tsx',
      'src/my-element.ts',
      'src/routes/index.tsx',
      'tsconfig.json',
      'tsconfig.app.json',
      'tsconfig.node.json',
    ])
  ) {
    return 'ts';
  }

  if (
    hasAnyFile(projectDir, [
      'src/main.js',
      'src/main.jsx',
      'src/App.js',
      'src/App.jsx',
      'src/app.js',
      'src/app.jsx',
      'src/my-element.js',
    ])
  ) {
    return 'js';
  }

  // Qwik starters are TSX-first in Vite. Default to TS if nothing else is discoverable.
  if (framework === 'qwik') {
    return 'ts';
  }

  return 'js';
}

export function detectScaffold(projectDir: string): { framework: Framework; variant: TemplateVariant } {
  const framework = detectFramework(projectDir);
  const variant = detectTemplateVariant(projectDir, framework);

  if (framework === 'vanilla' && !hasAnyFile(projectDir, ['src/main.ts', 'src/main.js'])) {
    throw new Error(
      'Could not map the generated Vite scaffold to a supported Web Loom template. Supported: vanilla, vue, react, preact, lit, svelte, solid, qwik.',
    );
  }

  return { framework, variant };
}

export function detectPackageManager(): PackageManager {
  const userAgent = process.env['npm_config_user_agent'] ?? '';
  if (userAgent.startsWith('pnpm/')) return 'pnpm';
  if (userAgent.startsWith('yarn/')) return 'yarn';
  if (userAgent.startsWith('bun/')) return 'bun';
  return 'npm';
}
