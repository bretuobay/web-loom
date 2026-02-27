import type { Framework } from './detect.js';

export const CORE_PACKAGES = [
  '@web-loom/mvvm-core',
  '@web-loom/mvvm-patterns',
  '@web-loom/store-core',
  '@web-loom/query-core',
  '@web-loom/event-bus-core',
  '@web-loom/event-emitter-core',
  '@web-loom/signals-core',
  '@web-loom/design-core',
  '@web-loom/ui-core',
  '@web-loom/ui-patterns',
];

export const FRAMEWORK_PACKAGES: Record<Framework, string[]> = {
  react: [],
  preact: [],
  vue: [],
  vanilla: [],
  lit: [],
  svelte: [],
  solid: [],
  qwik: [],
};

export function getPackages(framework: Framework): string[] {
  return [...CORE_PACKAGES, ...(FRAMEWORK_PACKAGES[framework] ?? [])];
}
