---
name: package-configuration
description: Configure workspace apps or packages to match the repo-wide Vite/Vitest/Turbo conventions (aliases, shared TypeScript configs, scripts, and caching). Use when Codex needs to set up or change tooling for an app/package or explain how the dev/test/build pipeline is wired across workspaces.
---

# Package configuration reference

Follow this skill whenever you touch tooling for an app or package (Vite, Vitest, or Turbo). The guidance keeps tooling aligned with existing workspace conventions.

## Vite + Vitest wiring

- Start from the React app templates in `apps/mvvm-react` and `apps/task-flow-ui`. The Vite configs there define the alias maps (e.g., linking `@repo/models`, `@repo/view-models`, `@web-loom/mvvm-core`, `@web-loom/ui-core`, etc., to `../../packages/...`) and the plugin stack (`@vitejs/plugin-react-swc`). Extend the alias resolver whenever you expose a new shared package; keep `optimizeDeps.include` in sync when dependencies must be pre-bundled. See `references/vite-and-vitest.md` for the patterns.

- Vitest uses the same alias map so tests resolve workspace packages the way builds do. The shared `test` config blocks (globals, `jsdom` environment, coverage filters, `setupFiles`) are already captured in `apps/mvvm-react/vitest.config.ts`.

## Turbo repository pipelines

- Root `turbo.json` governs caching and task dependencies (`build`, `lint`, `check-types`, `test`, `dev`). Keep new tasks aligned with these definitions: e.g., `dev` is marked `cache: false` and `persistent: true`, while `test` depends on `^build`. When adding a new app/package, give it the standard scripts (`dev`, `build`, `lint`, `test`, `check-types`) so Turbo can orchestrate it out-of-the-box. Refer to `turbo.json` for inputs/outputs and to the root `package.json` scripts (e.g., `npm run dev`, `npm run test`) that wrap `turbo run`.

## TypeScript + workspace sharing

- Every package relies on `@repo/typescript-config` variants (`base.json`, `react-library.json`, etc.). Extend or compose those configs when adding new tsconfig(s). Make sure `tsconfig.json` references the correct root `packages/typescript-config`. When publishing or building, run `npm run check-types`/`tsc --noEmit` via Turbo so emitted `dist` artifacts stay accurate.

- Share code through the `apps/*` and `packages/*` workspace layout defined in the root `package.json`. Depend on packages with workspace ranges (`"@repo/shared": "*"`) and export from each package via `exports`/`main`/`types` so Vite/Vitest/Turbo resolve them correctly.

## Verification checklist

1. `npm run lint`, `npm run check-types`, `npm run test` (or filtered Turbo task) succeed from the workspace root.
2. `npm run dev` (or `turbo run dev --filter=<app>...`) starts the intended app—watch the console for alias resolution warnings.
3. Any new package gets referenced aliases updated in the Vite/Vitest configs and the `packages/typescript-config` setups.

See [references/vite-and-vitest.md](references/vite-and-vitest.md) for concrete config snippets derived from the existing apps.
