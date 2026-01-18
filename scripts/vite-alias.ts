import { resolve } from 'path';

/**
 * Centralized Vite alias configuration for Web Loom monorepo.
 *
 * This module provides consistent alias mappings across all apps and packages,
 * ensuring Vite, Vitest, and TypeScript resolve workspace packages the same way.
 *
 * Usage in vite.config.ts:
 * ```ts
 * import { createAliases } from '../../scripts/vite-alias';
 *
 * export default defineConfig({
 *   resolve: {
 *     alias: createAliases(__dirname),
 *   },
 *   optimizeDeps: {
 *     // Only include external packages, NOT workspace packages (they're linked)
 *     include: ['react', 'react-dom'],
 *   },
 * });
 * ```
 *
 * Note: Workspace packages (@repo/*, @web-loom/*) should NOT be in optimizeDeps.include
 * because they're symlinked via npm workspaces. Vite handles linked packages differently.
 */

/** All @web-loom/* workspace packages */
export const webLoomPackages = [
  '@web-loom/mvvm-core',
  '@web-loom/design-core',
  '@web-loom/store-core',
  '@web-loom/query-core',
  '@web-loom/event-bus-core',
  '@web-loom/event-emitter-core',
  '@web-loom/ui-core',
  '@web-loom/ui-patterns',
  '@web-loom/forms-core',
  '@web-loom/forms-react',
  '@web-loom/forms-vue',
  '@web-loom/forms-vanilla',
  '@web-loom/http-core',
  '@web-loom/i18n-core',
  '@web-loom/error-core',
  '@web-loom/media-core',
  '@web-loom/media-react',
  '@web-loom/media-vue',
  '@web-loom/notifications-core',
  '@web-loom/platform-core',
  '@web-loom/router-core',
  '@web-loom/storage-core',
  '@web-loom/typography-core',
] as const;

/** All @repo/* workspace packages */
export const repoPackages = [
  '@repo/models',
  '@repo/view-models',
  '@repo/shared',
  '@repo/plugin-core',
  '@repo/ui-react',
] as const;

/** Combined list of all workspace packages for optimizeDeps.include */
export const workspacePackages = [...webLoomPackages, ...repoPackages] as const;

/** Package name to source directory mapping */
const packagePaths: Record<string, string> = {
  // @web-loom packages
  '@web-loom/mvvm-core': 'packages/mvvm-core/src',
  '@web-loom/design-core': 'packages/design-core/src',
  '@web-loom/store-core': 'packages/store-core/src',
  '@web-loom/query-core': 'packages/query-core/src',
  '@web-loom/event-bus-core': 'packages/event-bus-core/src',
  '@web-loom/event-emitter-core': 'packages/event-emitter-core/src',
  '@web-loom/ui-core': 'packages/ui-core/src',
  '@web-loom/ui-patterns': 'packages/ui-patterns/src',
  '@web-loom/forms-core': 'packages/forms-core/src',
  '@web-loom/forms-react': 'packages/forms-react/src',
  '@web-loom/forms-vue': 'packages/forms-vue/src',
  '@web-loom/forms-vanilla': 'packages/forms-vanilla/src',
  '@web-loom/http-core': 'packages/http-core/src',
  '@web-loom/i18n-core': 'packages/i18n-core/src',
  '@web-loom/error-core': 'packages/error-core/src',
  '@web-loom/media-core': 'packages/media-core/src',
  '@web-loom/media-react': 'packages/media-react/src',
  '@web-loom/media-vue': 'packages/media-vue/src',
  '@web-loom/notifications-core': 'packages/notifications-core/src',
  '@web-loom/platform-core': 'packages/platform-core/src',
  '@web-loom/router-core': 'packages/router-core/src',
  '@web-loom/storage-core': 'packages/storage-core/src',
  '@web-loom/typography-core': 'packages/typography-core/src',
  // @repo packages
  '@repo/models': 'packages/models/src',
  '@repo/view-models': 'packages/view-models/src',
  '@repo/shared': 'packages/shared/src',
  '@repo/plugin-core': 'packages/plugin-core/src',
  '@repo/ui-react': 'packages/ui-react/src',
};

/**
 * Creates Vite alias configuration relative to a given directory.
 *
 * @param dirname - The __dirname of the config file (typically an app or package)
 * @param additionalAliases - Optional extra aliases to merge
 * @returns Alias configuration object for Vite
 */
export function createAliases(
  dirname: string,
  additionalAliases: Record<string, string> = {}
): Record<string, string> {
  // Calculate the root path (assumes apps are in apps/ or packages are in packages/)
  const isInApps = dirname.includes('/apps/');
  const isInPackages = dirname.includes('/packages/');
  const rootPath = isInApps || isInPackages
    ? resolve(dirname, '../..')
    : dirname;

  const aliases: Record<string, string> = {
    '@': resolve(dirname, './src'),
  };

  // Add all workspace package aliases
  for (const [pkg, relativePath] of Object.entries(packagePaths)) {
    aliases[pkg] = resolve(rootPath, relativePath);
  }

  // Merge additional aliases
  return { ...aliases, ...additionalAliases };
}

/**
 * Creates Vite alias configuration using the array format (for regex patterns).
 * Use this when you need regex-based aliases.
 *
 * @param dirname - The __dirname of the config file
 * @param additionalAliases - Optional extra aliases to merge
 * @returns Array-format alias configuration for Vite
 */
export function createAliasArray(
  dirname: string,
  additionalAliases: Array<{ find: string | RegExp; replacement: string }> = []
): Array<{ find: string | RegExp; replacement: string }> {
  const objectAliases = createAliases(dirname);

  const aliasArray = Object.entries(objectAliases).map(([find, replacement]) => ({
    find,
    replacement,
  }));

  return [...additionalAliases, ...aliasArray];
}

/**
 * Filter workspace packages to only those actually used by an app/package.
 * Use this for optimizeDeps.include to only pre-bundle what's needed.
 *
 * @param usedPackages - Array of package names the app imports
 * @returns Filtered list of workspace packages
 */
export function filterWorkspacePackages(
  usedPackages: readonly string[]
): string[] {
  return usedPackages.filter(
    (pkg) => webLoomPackages.includes(pkg as any) || repoPackages.includes(pkg as any)
  );
}

/**
 * Common externals for library builds.
 * Libraries should externalize these to avoid bundling workspace dependencies.
 */
export const libraryExternals = [
  'react',
  'react-dom',
  'react/jsx-runtime',
  'vue',
  ...webLoomPackages,
  ...repoPackages,
] as const;

/**
 * Common globals for library builds (UMD format).
 */
export const libraryGlobals: Record<string, string> = {
  react: 'React',
  'react-dom': 'ReactDOM',
  'react/jsx-runtime': 'jsxRuntime',
  vue: 'Vue',
  '@web-loom/mvvm-core': 'MvvmCore',
  '@web-loom/design-core': 'DesignCore',
  '@web-loom/store-core': 'StoreCore',
  '@web-loom/query-core': 'QueryCore',
  '@web-loom/event-bus-core': 'EventBusCore',
  '@web-loom/event-emitter-core': 'EventEmitterCore',
  '@web-loom/ui-core': 'UICore',
  '@web-loom/ui-patterns': 'UIPatterns',
  '@web-loom/forms-core': 'FormsCore',
  '@web-loom/forms-react': 'FormsReact',
  '@web-loom/forms-vue': 'FormsVue',
  '@web-loom/forms-vanilla': 'FormsVanilla',
  '@web-loom/http-core': 'HttpCore',
  '@web-loom/i18n-core': 'I18nCore',
  '@web-loom/error-core': 'ErrorCore',
  '@web-loom/media-core': 'MediaCore',
  '@web-loom/media-react': 'MediaReact',
  '@web-loom/media-vue': 'MediaVue',
  '@web-loom/notifications-core': 'NotificationsCore',
  '@web-loom/platform-core': 'PlatformCore',
  '@web-loom/router-core': 'RouterCore',
  '@web-loom/storage-core': 'StorageCore',
  '@web-loom/typography-core': 'TypographyCore',
  '@repo/models': 'RepoModels',
  '@repo/view-models': 'RepoViewModels',
  '@repo/shared': 'RepoShared',
  '@repo/plugin-core': 'RepoPluginCore',
  '@repo/ui-react': 'RepoUIReact',
};
