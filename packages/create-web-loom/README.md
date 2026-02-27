# create-web-loom

Scaffold a new Web Loom starter on top of a Vite project.

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

1. Runs `create-vite` interactively.
2. Detects the generated framework + JS/TS variant.
3. Installs published `@web-loom/*` packages.
4. Applies a **template overlay** from `src/templates/<framework>/<variant>` plus `src/templates/shared`.

The overlay intentionally replaces Vite's runnable starter entry files so `npm run dev` starts in a Web Loom MVVM starter immediately.
`create-vite` is invoked with `--no-immediate` so it cannot auto-install and start the dev server before Web Loom post-steps finish.

If the scaffold cannot be mapped to a supported framework template, the CLI exits with a clear unsupported-scaffold error.

## Framework support

| Framework | Variants | Overwritten runnable files |
| --- | --- | --- |
| React | TS, JS | `src/App.tsx` / `src/App.jsx` |
| Preact | TS, JS | `src/app.tsx` / `src/app.jsx` |
| Vue | TS, JS | `src/App.vue` |
| Solid | TS, JS | `src/App.tsx` / `src/App.jsx` |
| Svelte | TS, JS | `src/App.svelte` |
| Lit | TS, JS | `src/my-element.ts` / `src/my-element.js` |
| Vanilla | TS, JS | `src/main.ts` / `src/main.js` |
| Qwik | TS-first | `src/routes/index.tsx` |

Shared files are copied for every framework (for example `src/viewmodels/CounterViewModel.ts`).

## Template source of truth

Template content is file-based and lives in:

- `src/templates/shared/**`
- `src/templates/<framework>/<variant>/**`

During build, templates are copied into `dist/templates/**`. Runtime boilerplate injection reads from `dist/templates` so published CLI builds are self-contained.

## Usage

```bash
# Interactive
npm create web-loom@latest

# Pass project name
npm create web-loom@latest my-app
```

After generation:

```bash
cd my-app
npm install
npm run dev
```

## Installed packages

All currently published core packages are installed:

- `@web-loom/mvvm-core`
- `@web-loom/mvvm-patterns`
- `@web-loom/store-core`
- `@web-loom/query-core`
- `@web-loom/event-bus-core`
- `@web-loom/event-emitter-core`
- `@web-loom/signals-core`
- `@web-loom/design-core`
- `@web-loom/ui-core`
- `@web-loom/ui-patterns`

## Local development

```bash
cd packages/create-web-loom
npm run build
npm run test

# Try locally
node dist/index.js my-test-app

# Check publish contents
npm pack --dry-run
```
