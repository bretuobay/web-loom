# Turbo Repo Dependency Wiring Review

Purpose-built packages and apps are wired through npm workspaces and Turbo’s pipeline, but the current dependency graph still has a few unhealthy edges that hurt install/build determinism and inflate node_modules. This note collects the vendor wiring observations so you can tune the workspace before publishing or scaling the repo.

## Findings

1. **Unused `next` dependency in core libraries.**
   - Several `@web-loom` packages declare `next` as a runtime dependency: e.g., `packages/store-core/package.json:60`, `packages/design-core/package.json:78`, and `packages/event-bus-core/package.json:55`. A workspace-wide search (`rg -n "from 'next" packages/*/src`) returns no hits, so no source files import anything from Next.js.
   - Because the dependency is still declared, every install pulls a full `next` tree and its optional `@next/swc-*` binaries. For example, `packages/design-core/package-lock.json:4137` contains the Next package and its optional dependencies, which bloats build cache uploads and can trigger platform-specific installers when Turbo runs on macOS/Linux.
   - **Suggestion:** remove `next` from these packages (and any other core library that doesn’t need the Next runtime). If some tooling scripts require the CLI, keep it in the app that actually runs Next (e.g., `apps/mvvm-book`). This keeps `@web-loom/*` lean and avoids dragging Next’s 200+ transitive deps into every workspace consumer.

2. **`react-native` is declared where it’s not used.**
   - `packages/models/package.json:30` and `packages/plugin-core/package.json:16` both depend on `react-native`, but neither package imports or references it. Cross-package searches for `react-native` inside `packages/models/src` and `packages/plugin-core/src` return nothing, so the dependency merely pulls in React Native’s heavy toolchain for no reason.
   - Only `packages/shared/src/theme.ts:1` actually imports from `react-native`, which makes sense because `@repo/shared` exports theming helpers for React Native consumers.
   - **Suggestion:** drop `react-native` from `models` and `plugin-core`, or move it to a dev/peer dependency only in the packages that actually compile against it (`@repo/shared`). That keeps installs smaller and avoids false-positive native peer dependencies when publishing `@repo` packages.

3. **`@web-loom/storage-core` is still at v0.2.0 while everything else is at 0.5.2.**
   - The publishing guide explicitly states that every package in the repo is at 0.5.2 and that internal dependencies should be updated together (`PUBLISHING.md:97`). `packages/storage-core/package.json:7` nevertheless reports version `0.2.0`. The mismatch means Turbo’s workspace graph and the publish workflow may treat `storage-core` as an unrelated release, which could break `npm publish` ordering or cause apps to install the wrong version when the packages are released.
   - **Suggestion:** bump `@web-loom/storage-core` to 0.5.2 (or the current shared version), update any direct references/dependencies to use the same semver range, and re-run `npm install` so the lockfile registers the aligned version. That keeps the dependency resolver and the publishing pipeline stable.

## Next Steps

- Remove the unused `next` and `react-native` dependencies from the packages above, then rerun `npm install`/`turbo run build` to ensure the tree shrinks accordingly.
- Synchronize `@web-loom/storage-core`’s version with the rest of the torso and re-verify the publishing order documented in `PUBLISHING.md`.
- After the dependency cleanup, rerun Turbo’s `build`/`dev` pipelines to ensure no implicit dependency slips were hiding behind the old transitive baggage.
