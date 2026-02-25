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
export declare const webLoomPackages: readonly ["@web-loom/mvvm-core", "@web-loom/design-core", "@web-loom/store-core", "@web-loom/query-core", "@web-loom/event-bus-core", "@web-loom/event-emitter-core", "@web-loom/ui-core", "@web-loom/ui-patterns", "@web-loom/forms-core", "@web-loom/forms-react", "@web-loom/forms-vue", "@web-loom/forms-vanilla", "@web-loom/http-core", "@web-loom/i18n-core", "@web-loom/error-core", "@web-loom/media-core", "@web-loom/media-react", "@web-loom/media-vue", "@web-loom/notifications-core", "@web-loom/platform-core", "@web-loom/router-core", "@web-loom/storage-core", "@web-loom/typography-core"];
/** All @repo/* workspace packages */
export declare const repoPackages: readonly ["@repo/models", "@repo/view-models", "@repo/shared", "@repo/plugin-core", "@repo/ui-react"];
/** Combined list of all workspace packages for optimizeDeps.include */
export declare const workspacePackages: readonly ["@web-loom/mvvm-core", "@web-loom/design-core", "@web-loom/store-core", "@web-loom/query-core", "@web-loom/event-bus-core", "@web-loom/event-emitter-core", "@web-loom/ui-core", "@web-loom/ui-patterns", "@web-loom/forms-core", "@web-loom/forms-react", "@web-loom/forms-vue", "@web-loom/forms-vanilla", "@web-loom/http-core", "@web-loom/i18n-core", "@web-loom/error-core", "@web-loom/media-core", "@web-loom/media-react", "@web-loom/media-vue", "@web-loom/notifications-core", "@web-loom/platform-core", "@web-loom/router-core", "@web-loom/storage-core", "@web-loom/typography-core", "@repo/models", "@repo/view-models", "@repo/shared", "@repo/plugin-core", "@repo/ui-react"];
/**
 * Creates Vite alias configuration relative to a given directory.
 *
 * @param dirname - The __dirname of the config file (typically an app or package)
 * @param additionalAliases - Optional extra aliases to merge
 * @returns Alias configuration object for Vite
 */
export declare function createAliases(dirname: string, additionalAliases?: Record<string, string>): Record<string, string>;
/**
 * Creates Vite alias configuration using the array format (for regex patterns).
 * Use this when you need regex-based aliases.
 *
 * @param dirname - The __dirname of the config file
 * @param additionalAliases - Optional extra aliases to merge
 * @returns Array-format alias configuration for Vite
 */
export declare function createAliasArray(dirname: string, additionalAliases?: Array<{
    find: string | RegExp;
    replacement: string;
}>): Array<{
    find: string | RegExp;
    replacement: string;
}>;
/**
 * Filter workspace packages to only those actually used by an app/package.
 * Use this for optimizeDeps.include to only pre-bundle what's needed.
 *
 * @param usedPackages - Array of package names the app imports
 * @returns Filtered list of workspace packages
 */
export declare function filterWorkspacePackages(usedPackages: readonly string[]): string[];
/**
 * Common externals for library builds.
 * Libraries should externalize these to avoid bundling workspace dependencies.
 */
export declare const libraryExternals: readonly ["react", "react-dom", "react/jsx-runtime", "vue", "@web-loom/mvvm-core", "@web-loom/design-core", "@web-loom/store-core", "@web-loom/query-core", "@web-loom/event-bus-core", "@web-loom/event-emitter-core", "@web-loom/ui-core", "@web-loom/ui-patterns", "@web-loom/forms-core", "@web-loom/forms-react", "@web-loom/forms-vue", "@web-loom/forms-vanilla", "@web-loom/http-core", "@web-loom/i18n-core", "@web-loom/error-core", "@web-loom/media-core", "@web-loom/media-react", "@web-loom/media-vue", "@web-loom/notifications-core", "@web-loom/platform-core", "@web-loom/router-core", "@web-loom/storage-core", "@web-loom/typography-core", "@repo/models", "@repo/view-models", "@repo/shared", "@repo/plugin-core", "@repo/ui-react"];
/**
 * Common globals for library builds (UMD format).
 */
export declare const libraryGlobals: Record<string, string>;
