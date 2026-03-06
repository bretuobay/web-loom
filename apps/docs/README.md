# Web Loom Docs

The main documentation site for the [Web Loom](https://github.com/bretuobay/web-loom) framework. It covers the MVVM architecture, all published and in-development packages, framework integration guides, and the `create-web-loom` CLI starter.

Built with Next.js 15 + Turbopack, Tailwind CSS 4, and MDX. Part of the web-loom monorepo.

## What This Site Documents

**Core architecture** — `BaseModel`, `BaseViewModel`, Commands, and the MVVM layering pattern that keeps business logic framework-agnostic.

**Published packages** (10 on npm under `@web-loom/*`):

| Package | Description |
|---------|-------------|
| `mvvm-core` | Base classes for Model, ViewModel, and Commands |
| `mvvm-patterns` | Higher-level MVVM design patterns |
| `signals-core` | Zero-dependency reactive primitives |
| `query-core` | Typed caching layer over fetch |
| `store-core` | Minimal reactive store for UI state |
| `event-bus-core` | Typed pub/sub over EventTarget |
| `event-emitter-core` | Strongly typed event emitter with disposal |
| `ui-core` | Headless accessibility behaviors |
| `ui-patterns` | Composed UI patterns (Wizard, MasterDetail, CommandPalette) |
| `design-core` | Design tokens as CSS custom properties |

**Package roadmap** — 24 additional packages fully implemented in the monorepo but not yet published: forms, media, HTTP, storage, router, i18n, notifications, error handling, platform detection, and more.

**Framework guides** — Integration patterns and worked examples for React, Vue, Angular, Lit, Marko, Svelte, Solid, Qwik, React Native, and Vanilla TypeScript.

**`create-web-loom`** — CLI scaffolder that generates Vite + MVVM starter apps across all supported frameworks and variants.

## Local Development

From the monorepo root:

```bash
nvm use 23
npm install
turbo run dev --filter=docs
```

Or from this directory:

```bash
npm run dev
```

The site runs at [http://localhost:4000](http://localhost:4000).

## Editing Content

Documentation pages live in `content/docs/` as `.mdx` files:

```
content/docs/
  getting-started.mdx
  core-concepts.mdx
  fundamentals.mdx
  mvvm-core.mdx
  viewmodels.mdx
  models.mdx
  signals-core.mdx
  query-core.mdx
  store-core.mdx
  event-bus-core.mdx
  ui-core.mdx
  design-core.mdx
  packages-roadmap.mdx
  create-web-loom.mdx
  mvvm-react-use-case.mdx
  mvvm-vue-use-case.mdx
  mvvm-angular-use-case.mdx
  ... (one file per framework)
```

Pages are discovered automatically from the filesystem. Frontmatter drives the sidebar title and navigation links.

## Building

```bash
npm run build
```

## Tech Stack

- [Next.js 15](https://nextjs.org/) with Turbopack
- [Tailwind CSS 4](https://tailwindcss.com/)
- MDX for documentation content
- TypeScript 5
