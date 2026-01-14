# Vite & Vitest patterns

The workspace shares two Vite-based apps whose configs should be the reference implementation:

- `apps/mvvm-react/vite.config.ts`:
  - `server.port` + `strictPort` keep the dev server stable.
  - `build.target` is `esnext` with `sourcemap: true`.
  - `define.__DEV__` mirrors `process.env.NODE_ENV`.
  - `resolve.alias` ties `@repo/*` and `@web-loom/*` imports to `../../packages/...`.
  - `optimizeDeps.include` lists the workspace packages that need to be pre-bundled when those packages expose non-compiled exports.

- `apps/task-flow-ui/vite.config.ts`:
  - Same alias strategy as above plus local alias `@` for `src`.
  - React plugin is configured through `@vitejs/plugin-react-swc`.
  - Server listens on a fixed port (`5178`).

- `apps/mvvm-react/vitest.config.ts`:
  - Mirrors the Vite alias map so tests and builds resolve identical sources.
  - `test` block uses `globals: true`, `environment: 'jsdom'`, `include`/`exclude` globs for `.test`/`.spec`.
  - `coverage.provider: 'v8'` with text/json/html reporters and workspace-friendly exclusions.
  - `setupFiles` points to `./src/test/setup.ts` for shared fixtures.

**When adding or editing an app/package:**

1. Replicate the alias map (or import it) so that `@repo/*` and `@web-loom/*` point to the correct package source directories.
2. Sync plugin lists (React SWC for React apps, others for non-React apps).
3. Keep Vitest coverage exclusions aligned with `node_modules`, `dist`, and config files.
4. If the package exposes new entry points, update the alias lists in both Vite and Vitest configs to avoid resolving `dist` artifacts instead of `src`.
