This PRD defines a small, focused CLI package `@web-loom/turbo-analyse` that can analyze any Turborepo-managed monorepo, starting with build metrics and workspace inspection, and is designed to be easily extensible for other developers.[1][2]

## Product overview

`@web-loom/turbo-analyse` is a Node-based CLI package intended to be installed in a Turborepo workspace or used via `npx` to inspect and report on repository structure and build outputs. It will read Turborepo configuration (`turbo.json` and workspace package.json files) and optionally invoke `turbo run` to gather metrics, then present results as human-readable tables and machine-readable JSON.[3][4][5][1]

The initial scope is intentionally small but provides a clear extension path, both internally (new subcommands) and externally (other developers can contribute without introducing third-party runtime dependencies).[6][7]

## Goals and non-goals

Goals:

- Provide a simple CLI that any Turborepo user can install or run via `npx` to inspect their monorepo.[2][1]
- Expose commands to:
  - List apps and packages (count and details).[4]
  - Compute and display build artifact sizes per app/package.[6]
- Integrate naturally with `turbo` by respecting `turbo.json` and existing tasks, not replacing them.[5][3]
- Design the CLI architecture so adding new analysis commands is straightforward and does not require third-party libraries.

Non-goals (initial version):

- No remote storage, dashboards, or CI integrations beyond standard exit codes and optional JSON output.[6]
- No custom bundling pipeline; the CLI reads existing build artifacts produced by the workspace’s normal build.[5]
- No dependency on external CLI frameworks; only Node core modules and inline utilities are allowed.

## Target users and usage

Primary users:

- Monorepo maintainers and developers using Turborepo for JavaScript/TypeScript projects.[1]
- CI engineers wanting quick metrics without integrating a heavy bundle-size tool.[6]

Expected invocations:

- Installed locally as a dev dependency:
  - `wl build metrics`
  - `wl workspace info`
- Via `npx` for one-off usage:
  - `npx @web-loom/turbo-analyse build metrics`
  - `npx @web-loom/turbo-analyse workspace list`

A simple alias `wl` can be provided via the package’s `bin` field.[7]

## Naming and distribution

- Package name: `@web-loom/turbo-analyse`.
- Executables (via `bin` in package.json):
  - `"turbo-analyse"` (primary)
  - `"wl"` (short alias)

This enables patterns like:

- `turbo-analyse build metrics`
- `wl build metrics`
- `npx @web-loom/turbo-analyse build metrics`

The package is published to npm and must work in any standard Turborepo workspace layout (Yarn, npm, or pnpm workspaces).[4][1]

## Supported environments and constraints

- Implementation language: TypeScript compiled to Node-compatible JavaScript.
- Runtime: Node 18+ (aligning with current ecosystem and modern ES module features).[1]
- No third-party runtime dependencies: rely only on Node core modules and hand-written helpers.
- Dev-time tooling (TypeScript, ESLint, etc.) is allowed but not shipped as runtime dependencies.

## Command design

The CLI is organized as `<binary> <domain> <action>`, starting with two domains: `build` and `workspace`.[1]

### Command: `build metrics`

Purpose: Report build artifact sizes per app/package and show an aggregated table.[6]

Behavior:

- Optionally run `turbo run build` if no recent artifacts exist, otherwise reuse existing outputs.[5]
- Discover apps and packages from workspace configuration and infer artifact locations using a simple convention (e.g. `dist/**`, `.next/**`, `build/**`), with override via config file.[4][6]
- Traverse each app/package directory, sum file sizes under configured artifact paths, and generate:
  - A human-readable table (project, type, artifact path, total size).
  - Optional JSON output for scripting/CI.

CLI shape:

- `wl build metrics`
- Flags:
  - `--project <name>`: limit to a specific workspace.
  - `--type app|package`: filter by project type (if determinable from config or simple heuristics). [4]
  - `--artifacts "<glob>"`: override artifact path pattern for this run.
  - `--json`: output machine-readable JSON instead of a table.
  - `--run-build`: force a `turbo run build` before analysis.[5]

Output examples (conceptual):

- Table with columns: `Project`, `Type`, `Artifact path`, `Total size (KB)`.
- JSON with array of objects: `{ name, type, artifactPath, totalBytes }`.

Exit codes:

- `0` on success.
- `1` on argument/config errors.
- `2` if artifacts could not be located for any workspace.

### Command: `workspace info`

Purpose: Provide high-level information about the Turborepo workspace.[2][4]

Behavior:

- Parse root `package.json` workspaces and `turbo.json` to identify known projects.[3][4]
- Count and list apps and packages.
- Optionally infer “app vs package” via simple rules (e.g. presence of `next`, `react-scripts`, or `bin` fields vs shared library patterns).

CLI shape:

- `wl workspace info` (summary counts).
- `wl workspace list` (detailed listing).

Flags:

- `--json`: machine-readable summary.
- `--with-paths`: show project root paths.
- `--with-scripts`: include main scripts (`build`, `test`, `lint`, etc.).[4]

Sample outputs:

- `workspace info`: “3 apps, 7 packages” plus a small table or list.
- `workspace list`: table with `Name`, `Type`, `Path`, `Has build`, `Has test`.

### Command: `workspace validate` (stretch v1)

Purpose: Basic workspace sanity checks (non-blocking but useful).[4]

Behavior:

- Check for projects defined in workspaces but missing directories.
- Check that common scripts like `build` exist for app-type projects.
- Return non-zero exit code if serious mismatches are detected.

CLI shape:

- `wl workspace validate`

Flags:

- `--json` to get validation results as structured data.

## Future commands and extensibility

The CLI should be designed so adding new commands is straightforward:

Potential future commands:

- `build timings`: run `turbo run` for one or more tasks and aggregate timings (using `turbo` logs or a timing wrapper) to show slowest projects and tasks.[5][1]
- `build cache`: summarize cache hits/misses (local vs remote) if accessible via `turbo` output or config.[3][1]
- `workspace affected`: accept `--base` and `--head` git refs, compute which projects are affected, and report them. (Implementation may reuse `git diff` and workspace mapping logic.)[8][9]

Extensibility strategy (no external plugin system initially):

- Internal architecture will treat each command as a module implementing a simple interface:
  - `name`, `description`, `run(args, context)`.
- Commands are registered in a central `commands` registry that the top-level dispatcher consults.
- New commands are added by contributing a new module and registering it; the dispatcher remains untouched or minimally changed.

This design allows future evolution into a plugin system (e.g. loading commands discovered from a config file) without breaking the core implementation.

## Internal architecture

High-level modules:

- `bin/wl` and `bin/turbo-analyse`
  - Small Node shims that forward to the main CLI entry point.
  - Parse `process.argv` minimally (domain/action + raw args) and delegate to the dispatcher.

- `src/cli/dispatcher.ts`
  - Resolve `<domain> <action>` into a command module.
  - Provide help output when commands are unknown or `--help` is passed.
  - Normalize flags into an `args` object.

- `src/core/workspace.ts`
  - Load and parse `package.json` and `turbo.json` from the current working directory.[3][4]
  - Discover workspace packages and basic metadata.
  - Offer utility functions like `getProjects()`, `findProject(name)`, and `inferProjectType(project)`.

- `src/core/buildArtifacts.ts`
  - Given a project and config, determine its artifact paths (using defaults and overrides).
  - Compute directory sizes recursively with Node’s filesystem APIs.

- `src/core/output.ts`
  - Render tables (simple column width calculation and padding) and JSON.
  - Centralize formatting so all commands share consistent output styles.

- `src/commands/build/metrics.ts`
  - Implements `build metrics`.
  - Uses `workspace` and `buildArtifacts` modules.

- `src/commands/workspace/info.ts` and `src/commands/workspace/list.ts`
  - Implement workspace inspection commands.

Integration with Turborepo:

- Use `turbo.json` to understand tasks and outputs when possible, especially for future timing/cache commands.[3][5]
- Provide a `--run-build` flag that shells out to `npx turbo run build` (or `pnpm turbo run build` based on heuristics) when explicitly requested.[5]

## Configuration

Configuration file (optional):

- Name: `turbo-analyse.config.json` at repo root.
- Purpose: Allow users to override defaults without touching CLI code.
- Example fields:
  - `artifactGlobs`: default glob patterns per project type or name.
  - `projectTypes`: manual mapping of project name to type if the heuristics fail.
- The config will be loaded if present, otherwise sensible defaults are used.

This mirrors patterns used by other monorepo tooling, where a small config file lives alongside `package.json` and `turbo.json`.[4][6]

## Developer experience and publishing

Developer expectations for using the CLI in their own repos:

- Install: `npm i -D @web-loom/turbo-analyse` or use `npx @web-loom/turbo-analyse`.[1]
- Add scripts (optional) to root `package.json`:
  - `"analysis:build": "wl build metrics"`
  - `"analysis:workspace": "wl workspace info"`
- Run locally and in CI without extra configuration for simple cases.

Internal development inside `web-loom` Turborepo:

- `@web-loom/turbo-analyse` lives as a package in the `web-loom` monorepo, built with TypeScript, and published as a standard npm package.[7]
- The package should be independent of the rest of `web-loom` so external consumers only get the CLI and not internal code.

This PRD defines the initial command set and architecture for `@web-loom/turbo-analyse`, focusing on build metrics and workspace inspection while laying the groundwork for additional analysis commands that other developers can extend without extra dependencies.[2][1]

[1](https://turbo.build)
[2](https://turborepo.com/docs/reference)
[3](https://turborepo.com/docs/reference/configuration)
[4](https://app.studyraid.com/en/read/12467/402936/configuring-packagejson-for-turborepo)
[5](https://turborepo.com/docs/crafting-your-repository/configuring-tasks)
[6](https://github.com/microsoft/monosize)
[7](https://github.com/dan5py/turborepo-cli-template)
[8](https://github.com/vercel/turborepo/issues/1495)
[9](https://graphite.com/guides/optimizing-ci-pipelines-monorepos)
[10](https://github.com/preconstruct/preconstruct/issues/230)
[11](https://github.com/npm/cli/issues/7137)
