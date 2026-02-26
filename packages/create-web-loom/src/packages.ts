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
  '@web-loom/charts-core',
];

export const FRAMEWORK_PACKAGES: Record<string, string[]> = {
  react: [],
  vue: [],
  vanilla: [],
  lit: [],
  angular: [],
  svelte: [],
};

export function getPackages(framework: string): string[] {
  return [...CORE_PACKAGES, ...(FRAMEWORK_PACKAGES[framework] ?? [])];
}
