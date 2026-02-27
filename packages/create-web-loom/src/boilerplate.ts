import { copyFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Framework, TemplateVariant } from './detect.js';

export interface ScaffoldTarget {
  framework: Framework;
  variant: TemplateVariant;
}

function copyTree(sourceDir: string, targetDir: string): void {
  const entries = readdirSync(sourceDir, { withFileTypes: true });
  for (const entry of entries) {
    const sourcePath = join(sourceDir, entry.name);
    const targetPath = join(targetDir, entry.name);

    if (entry.isDirectory()) {
      mkdirSync(targetPath, { recursive: true });
      copyTree(sourcePath, targetPath);
      continue;
    }

    mkdirSync(dirname(targetPath), { recursive: true });
    copyFileSync(sourcePath, targetPath);
  }
}

function resolveTemplateRoot(): string {
  const runtimeDir = dirname(fileURLToPath(import.meta.url));
  const templateRoot = join(runtimeDir, 'templates');

  if (!existsSync(templateRoot)) {
    throw new Error(`Template root not found at ${templateRoot}. Build may be missing dist/templates.`);
  }

  return templateRoot;
}

export function injectBoilerplate(projectDir: string, scaffold: ScaffoldTarget): void {
  const templateRoot = resolveTemplateRoot();

  const sharedTemplateDir = join(templateRoot, 'shared');
  if (!existsSync(sharedTemplateDir)) {
    throw new Error(`Shared template directory not found: ${sharedTemplateDir}`);
  }

  const frameworkTemplateDir = join(templateRoot, scaffold.framework, scaffold.variant);
  if (!existsSync(frameworkTemplateDir)) {
    throw new Error(`No templates found for ${scaffold.framework}/${scaffold.variant} at ${frameworkTemplateDir}`);
  }

  // Overwrite policy is intentional: Web Loom starter replaces Vite's runnable starter files.
  copyTree(sharedTemplateDir, projectDir);
  copyTree(frameworkTemplateDir, projectDir);
}
