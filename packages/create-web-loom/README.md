# create-web-loom

Scaffold a new Web Loom project in seconds.

```bash
npm create web-loom@latest
# or
pnpm create web-loom
# or
yarn create web-loom
# or
bun create web-loom
```

## What it does

1. **Runs Vite interactively** — you pick framework, variant, and project name exactly as you would with `npm create vite@latest`.
2. **Installs all published `@web-loom/*` packages** into the generated project.
3. **Injects MVVM boilerplate** — a `CounterViewModel`, a reactive `Counter` component, and a signals bridge hook — so the pattern is immediately visible and runnable.

## Usage

```bash
# Interactive (you are prompted for a project name and framework)
npm create web-loom@latest

# Pass a project name to skip the name prompt
npm create web-loom@latest my-app
```

After the CLI finishes:

```bash
cd my-app
npm install
npm run dev
```

## Generated file structure

The CLI writes a small set of MVVM starter files into `src/` after Vite scaffolds the project.

### React

```
src/
├── hooks/
│   └── useObservable.ts       # useSignal<T> — bridges signals-core to React state
├── viewmodels/
│   └── CounterViewModel.ts    # signal() + computed(), increment / decrement / reset
└── components/
    └── Counter.tsx             # View — reads signals via useSignal, calls VM methods
```

### Vue

```
src/
├── composables/
│   └── useObservable.ts       # useSignal<T> — bridges signals-core to Vue refs
├── viewmodels/
│   └── CounterViewModel.ts    # same ViewModel as React — no framework imports
└── components/
    └── Counter.vue             # <script setup> View consuming the composable
```

### Vanilla / Lit / others

```
src/
└── viewmodels/
    └── CounterViewModel.ts
counter.ts                     # DOM subscription entry point
counter.html                   # Minimal HTML wiring up the counter
```

## Installed packages

All currently published `@web-loom/*` packages are installed automatically:

| Package                        | Purpose                                               |
| ------------------------------ | ----------------------------------------------------- |
| `@web-loom/mvvm-core`          | `BaseModel`, `BaseViewModel`, `Command`               |
| `@web-loom/mvvm-patterns`      | Higher-level MVVM composition patterns                |
| `@web-loom/signals-core`       | Lightweight `signal()` / `computed()` / `effect()`    |
| `@web-loom/store-core`         | Minimal UI-state store with persistence adapters      |
| `@web-loom/query-core`         | Data fetching with caching and stale-while-revalidate |
| `@web-loom/event-bus-core`     | Typed pub/sub for cross-feature messaging             |
| `@web-loom/event-emitter-core` | Low-level event emitter utilities                     |
| `@web-loom/ui-core`            | Headless dialog, list, form, roving-focus behaviors   |
| `@web-loom/ui-patterns`        | Wizard, MasterDetail, CommandPalette shells           |
| `@web-loom/design-core`        | Design tokens and CSS theming utilities               |

## Package manager support

The CLI detects which package manager invoked it via `npm_config_user_agent` and forwards that same manager to both the Vite scaffold and the Web Loom package install.

| Command                      | Vite invoked as          |
| ---------------------------- | ------------------------ |
| `npm create web-loom@latest` | `npm create vite@latest` |
| `pnpm create web-loom`       | `pnpm create vite`       |
| `yarn create web-loom`       | `yarn create vite`       |
| `bun create web-loom`        | `bun create vite`        |

## Framework detection

After Vite scaffolds the project, the CLI reads `package.json` dependencies to identify the framework:

| Dependency present    | Detected as |
| --------------------- | ----------- |
| `react`               | `react`     |
| `vue`                 | `vue`       |
| `lit`                 | `lit`       |
| `@angular/core`       | `angular`   |
| `svelte`              | `svelte`    |
| _(none of the above)_ | `vanilla`   |

The detected framework determines which boilerplate files are written.

## Local development

```bash
# Build the CLI
cd packages/create-web-loom
npm run build         # vite build → dist/index.js

# Test locally without publishing
node dist/index.js my-test-app

# Verify the tarball contents
npm pack --dry-run
```
