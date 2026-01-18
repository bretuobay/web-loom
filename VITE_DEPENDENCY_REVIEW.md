# Vite Dependency Wiring Review

Vite configs across apps/packages already wire workspace aliases, optimizeDeps, and rollup settings, but a few dependency wiring gaps slow dev loops or produce larger-than-necessary build artifacts. The following observations call out spots where aligning the alias/external lists, optimizeDeps, and shared configuration would reduce maintenance overhead and keep output predictable.

## Findings

1. **OptimizeDeps excludes the `@repo` workspace packages apps actually import.**
   - `apps/mvvm-react/vite.config.ts:22-24` only pre-bundles `react`, `react-dom`, and three `@web-loom/*` libraries even though the app imports `@repo/models`, `@repo/view-models`, and `@repo/shared`. The server must re-traverse each alias on cold start, which bloats the cache and slows HMR.
   - `apps/task-flow-ui/vite.config.ts:27-39` includes `@repo/models` but omits `@repo/shared` and `@repo/plugin-core`, which this app uses heavily. Because optimizeDeps does not know those packages are part of the workspace, Vite falls back to repeatedly scanning the entire `packages` tree and rebuilding them on every server start.
   - **Impact:** The dev server spends time analyzing workspace-only packages that are never pre-bundled, so cold starts stay sluggish and caching is inconsistent.

2. **Library builds bundle dependencies that keep their own entry points, defeating shared deduplication.**
   - `packages/ui-react/package.json:77-84` depends on `@web-loom/forms-core` and `@web-loom/forms-react`, but `packages/ui-react/vite.config.ts:52-78` does not mark them as externals. During `npm run build`, those dependencies are bundled into `@repo/ui-react`, meaning downstream apps that also depend on `forms-core`/`forms-react` pull dupe code and can't share their eagerly built outputs.
   - **Suggestion:** Mirror every `@web-loom/*` dependency in `rollupOptions.external` (and `globals`) so all workspace packages rely on a single canonical build output. That also keeps `@repo/ui-react`’s artifact size smaller and its consumers can dedupe via `peerDependencies`.

3. **Alias maps are duplicated per app, which breeds drift and makes adding new workspace packages error-prone.**
   - `apps/mvvm-react/vite.config.ts:11-24` and `apps/task-flow-ui/vite.config.ts:11-25` both define long alias objects that point to `../../packages/*/src`. Every time a new shared package is created (e.g., `@repo/plugin-core`, `@web-loom/storage-core`), you must remember to edit each app’s Vite config, Vitest config, and TypeScript `paths`. The duplication also makes it easy to forget to alias a package, which surfaces as an inconsistent dev experience.
   - **Opportunity:** Extract a shared alias map (could live in `packages/typescript-config` or a `scripts/vite-alias-map.ts` that exports the same object) and import it into every Vite/Vitest config. That keeps alias wiring DRY and ensures `resolve.alias` stays in sync with `tsconfig`/`paths`.

## Recommendations

- Align each app's `optimizeDeps.include` with the workspace packages it actually imports; include both `@repo/*` and `@web-loom/*` dependencies so cold starts pre-bundle everything that is symlinked.
- Mirror every runtime dependency listed in a package’s `package.json` inside `rollupOptions.external` when publishing libraries (e.g., add `@web-loom/forms-core`/`forms-react` to `packages/ui-react/vite.config.ts`) so downstream consumers can dedupe and apply their own bundler logic.
- Centralize alias maps and path mappings so Vite, Vitest, Storybook, and TypeScript share the same wiring; this avoids repeated edits and ensures new dependencies are aliased everywhere once.

## Next Steps

1. Update `optimizeDeps.include` inside each app (starting with `mvvm-react`, `mvvm-react-integrated`, `task-flow-ui`, etc.) to cover all imported workspace packages.
2. Review the library `rollupOptions.external` lists (`ui-react`, `ui-core`, `ui-patterns`, etc.) for every declared `@web-loom/*` dependency and add the missing externals/globals.
3. Define a reusable alias helper (e.g., `scripts/vite-alias.ts`) and import it from every Vite/Vitest config, then sync the helper with any shared `tsconfig` `paths`.

Summary

All Vite configuration improvements from VITE_DEPENDENCY_REVIEW.md have been implemented:

1. Created Centralized Alias Helper (scripts/vite-alias.ts)

- Exports createAliases(dirname) - generates consistent alias mappings
- Exports webLoomPackages and repoPackages - lists of all workspace packages
- Exports libraryExternals and libraryGlobals - for library builds
- Single source of truth for all alias configurations

2. Updated App Configs with Proper optimizeDeps.include
   App: mvvm-react
   Added to optimizeDeps: @repo/models, @repo/view-models, @repo/shared
   ────────────────────────────────────────
   App: task-flow-ui
   Added to optimizeDeps: @repo/shared, @repo/plugin-core,
   @web-loom/event-emitter-core
   ────────────────────────────────────────
   App: mvvm-react-integrated
   Added to optimizeDeps: @repo/shared, @repo/ui-react, @repo/view-models
3. Updated Library Build Externals (ui-react/vite.config.ts)

Added missing externals to prevent bundling workspace dependencies:

- @web-loom/forms-core
- @web-loom/forms-react
- @web-loom/event-emitter-core

Benefits

- Faster cold starts - Vite pre-bundles all workspace packages
- Smaller library builds - ui-react no longer bundles forms-core/forms-react
- Reduced maintenance - Centralized alias helper eliminates duplication
- Consistent behavior - All apps share the same alias resolution
