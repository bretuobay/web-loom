<div align="center">
  <img src="webloom.png" alt="Web Loom Logo" width="200"/>

# Web Loom — A Framework-Agnostic UI Architecture Toolkit

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![npm](https://img.shields.io/npm/v/%40web-loom%2Fmvvm-core.svg?label=%40web-loom%2Fmvvm-core)](https://www.npmjs.com/package/@web-loom/mvvm-core)

Web Loom is a growing ecosystem of framework-agnostic patterns for the web, built around **signals** and **MVVM**. Business logic lives in Models and ViewModels that don't import React, Vue, Angular, or anything else — only the View layer changes when you change your mind about a framework, and Web Loom now ships its own native View too, so you don't have to pick a framework at all.

</div>

## Vision

In an ever-evolving landscape of frontend frameworks, Web Loom champions a timeless approach to UI architecture. Inspired by the robust patterns of C#'s Prism framework, we've adapted and enhanced these concepts for the modern web with reactive signals in place of RxJS/WPF-style dependency properties. The goal: your core logic — Models, ViewModels, Commands, validation — pays dividends for years, independent of whichever framework is fashionable this year.

## Two Ways to Build

Every Web Loom app starts the same way: a `@web-loom/mvvm-core` `BaseViewModel` exposing signal-backed state (`data$`, `isLoading$`, `error$`) and `Command`s from `@web-loom/signals-core`. What differs is the View.

### 1. Bring your own framework

Write a thin bridge that subscribes your framework's rendering model to the ViewModel's signals. Every demo app in `apps/` does exactly this, in a few lines:

| App                                                        | Framework        | How it bridges to the ViewModel's signals                                                  |
| ---------------------------------------------------------- | ---------------- | ------------------------------------------------------------------------------------------ |
| [`apps/mvvm-react`](apps/mvvm-react)                       | React            | `useSignal(sig)` → `useSyncExternalStore(sig.subscribe, sig.get, sig.get)`                 |
| [`apps/mvvm-vue`](apps/mvvm-vue)                           | Vue 3            | `useSignal(sig)` → `shallowRef` seeded via `.peek()`, synced via `observe()`               |
| [`apps/mvvm-solid`](apps/mvvm-solid)                       | SolidJS          | `useSignal(sig)` → Solid `createSignal` seeded via `observe()`; view uses `<Show>`/`<For>` |
| [`apps/mvvm-angular`](apps/mvvm-angular)                   | Angular          | `fromLoomSignal(sig, destroyRef)` → mirrors into a native Angular `signal()`               |
| [`apps/mvvm-lit`](apps/mvvm-lit)                           | Lit              | manual `@state()` field updated via `observe()` in `connectedCallback`                     |
| [`apps/mvvm-marko`](apps/mvvm-marko)                       | Marko            | `subscribeToObservable(sig, updateFn)` wrapping `observe`/`subscribe`                      |
| [`apps/mvvm-vanilla`](apps/mvvm-vanilla)                   | Vanilla JS + EJS | direct `observe(vm.data$, callback)` calls that manually patch the DOM                     |
| [`apps/mvvm-react-native`](apps/mvvm-react-native)         | React Native     | same bridge as `mvvm-react`, native components                                             |
| [`apps/mvvm-react-integrated`](apps/mvvm-react-integrated) | React            | React + Design Core theming, integrated patterns                                           |

Reach for this path when you want a specific framework's ecosystem, tooling, or team familiarity.

### 2. The complete Web Loom stack

Or skip the bridge entirely: `@web-loom/template-core` renders the same ViewModels directly, because its bindings _are_ signal subscriptions. No virtual DOM, no component re-render, no adapter code.

```ts
import { signal } from '@web-loom/signals-core';
import { compile } from '@web-loom/template-core';

const vm = { count$: signal(0), increment: () => vm.count$.update((n) => n + 1) };

const template = compile(`<button on:click="increment">Count: {{ count$ }}</button>`);
const view = template.mount(document.getElementById('app')!, vm);
// later: view.dispose()
```

[`apps/ecommerce-template-core`](apps/ecommerce-template-core) is the ecommerce proof: a full catalog/cart/checkout/SSR app built with **zero** JS framework — only `signals-core`, `mvvm-core`, and `template-core`. [`apps/mvvm-template-core`](apps/mvvm-template-core) is the same idea for the greenhouse dashboard: it clones [`apps/mvvm-react`](apps/mvvm-react) with `.loom` templates instead of React components, sharing the same ViewModels. [`apps/ecommerce-mvvm`](apps/ecommerce-mvvm) is the React ecommerce sibling.

> `template-core` and its tooling siblings are implemented and used across the demo apps but not yet published to npm — see [Packages](#packages) below. Use them today via the workspace; `npm install` support is coming.

## Core Principles

- **Framework-Agnostic**: Core libraries work with any frontend framework, or with no framework at all.
- **Signals-First Reactivity**: `@web-loom/signals-core` provides `signal`/`computed`/`effect` primitives with no virtual DOM required — the same signal graph drives every View option above.
- **MVVM Architecture**: A complete Model-View-ViewModel implementation for clean separation of concerns and testable business logic.
- **Headless UI**: UI patterns provide logic and behavior for common components without imposing any styling.
- **Plugin System**: A dynamic plugin architecture for modular, extensible applications.
- **Type-Safe**: The entire ecosystem is TypeScript, with Zod validation at the Model boundary.

## Getting Started

The fastest way to start a new project is the `create-web-loom` CLI, which scaffolds a Vite app and overlays a working, signals-backed MVVM starter:

```bash
npm create web-loom@latest
```

It detects your chosen framework (React, Preact, Vue, Solid, Svelte, Lit, Vanilla, or Qwik) and wires up a starter `ViewModel` plus the matching signal bridge automatically.

To explore this monorepo itself — all the demo apps, `template-core`, and the ecommerce comparison — clone and install:

```bash
npm install
npm run dev
```

## Packages

All packages version in lockstep, gated at **0.8.0** until the API surface is ready to commit to 1.0.0 — no package's version exceeds `mvvm-core`/`signals-core`, the two most-exercised packages in the ecosystem, and releases between now and 1.0.0 are patch-only (see [Versioning Policy](#versioning-policy)).

### Published

These are live on npm today.

| Package                                                       | Description                                                                                |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| [`@web-loom/mvvm-core`](packages/mvvm-core)                   | Signals-backed MVVM framework — `BaseModel`, `RestfulApiModel`, `BaseViewModel`, `Command` |
| [`@web-loom/signals-core`](packages/signals-core)             | Framework-agnostic reactive signals — `signal`, `computed`, `effect`, `batch`              |
| [`@web-loom/query-core`](packages/query-core)                 | Server state management with caching, deduplication, and background refetch                |
| [`@web-loom/store-core`](packages/store-core)                 | Minimal client state management for UI-only state                                          |
| [`@web-loom/ui-core`](packages/ui-core)                       | Headless UI behaviors — Dialog, Form, List Selection, Roving Focus, Drag & Drop            |
| [`@web-loom/ui-patterns`](packages/ui-patterns)               | Composed UI patterns built on `ui-core` — Wizard, Master-Detail, Command Palette           |
| [`@web-loom/design-core`](packages/design-core)               | Design tokens and theming system                                                           |
| [`@web-loom/forms-core`](packages/forms-core)                 | Framework-agnostic form state management with Zod integration                              |
| [`@web-loom/event-bus-core`](packages/event-bus-core)         | Type-safe pub-sub event bus for cross-feature communication                                |
| [`@web-loom/event-emitter-core`](packages/event-emitter-core) | Tiny type-safe event emitter shared across Web Loom packages                               |
| [`@web-loom/mcp-server`](packages/mcp-server)                 | MCP server exposing scaffolding, docs, and guided patterns for `@web-loom/*`               |
| [`create-web-loom`](packages/create-web-loom)                 | CLI scaffolder — `npm create web-loom@latest`                                              |

Framework-specific adapters (React/Vue/vanilla form bindings, media players, charts) live in the sibling [`web-loom-extensions`](https://github.com/bretuobay/web-loom-extensions) repo, published under the same `@web-loom/*` npm scope.

### Coming soon

Fully implemented and exercised in the demo apps, but not yet published to npm — use via the workspace in the meantime.

| Package                                                               | Description                                                                           |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| [`@web-loom/template-core`](packages/template-core)                   | Signal-native reactive template engine — no VDOM, no framework adapter                |
| [`@web-loom/template-core-vite`](packages/template-core-vite)         | Vite plugin for `template-core` — build-time precompile, dev analyze/precompile modes |
| [`@web-loom/template-core-vite-ssr`](packages/template-core-vite-ssr) | Reusable Vite SSR dev/production server for `template-core` apps                      |
| [`@web-loom/template-core-lint`](packages/template-core-lint)         | ESLint plugin with static-analysis rules for `template-core` templates                |
| [`@web-loom/template-core-tooling`](packages/template-core-tooling)   | Shared AST utilities and source-linked diagnostics behind the two packages above      |
| [`@web-loom/mvvm-patterns`](packages/mvvm-patterns)                   | Application-level MVVM patterns — interaction requests, active-aware ViewModels       |
| [`@web-loom/embed-core`](packages/embed-core)                         | Framework-agnostic embeddable widget SDK and host integration layer                   |

### Internal / workspace-only

A supporting cast used by the demo apps and not meant for external installation: shared domain models and ViewModels (`@repo/models`, `@repo/view-models`, `@repo/shared`), the plugin registry (`@repo/plugin-core`), infrastructure libraries still maturing toward a first release (`http-core`, `storage-core`, `platform-core`, `notifications-core`, `router-core`, `error-core`, `i18n-core`, `typography-core`), the docs site theme (`@repo/docs-theme`), the editor extension (`vscode-template-core-syntax`), and internal tooling config (`@repo/eslint-config`, `@repo/typescript-config`).

### Versioning Policy

Every package in this repo — published, coming-soon, or internal — moves in **lockstep** and stays at or below `mvvm-core`/`signals-core`'s version. Until the ecosystem is ready to commit to a stable public API, releases are **patch-only**: no package's `major.minor` changes without a deliberate, repo-wide decision to cross into 1.0.0. A CI check enforces this on every pull request; see [`.claude/skills/versioning.md`](.claude/skills/versioning.md) for the full policy and rationale.

## Templating: `@web-loom/template-core`

`template-core` is a Mustache/Handlebars-flavored HTML template engine whose bindings _are_ `signals-core` subscriptions — a signal write updates exactly the DOM node or attribute that reads it, nothing else re-renders.

```html
<h1>{{ title$ }}</h1>
{{#if isLoading$}}
<p>Loading…</p>
{{else if error$}}
<p>{{ error$ }}</p>
{{/if}} {{#each todos$ key=id}}
<li on:click="remove(this)">{{ text }}</li>
{{else}}
<li>Nothing to do</li>
{{/each}} <input bind:value="name$" />
```

Templates compile at runtime via the browser's native `<template>` parser plus a small CSP-safe expression evaluator (no `eval`/`new Function`), or precompile offline to a serializable render plan for production builds. It also supports SSR/hydration without a DOM, via `parse5`.

It isn't meant to replace the React/Vue/Angular/Lit/Marko adapters in general — it's Web Loom's own reference View, the one that keeps the rest of the ecosystem honest about the ViewModel boundary. Its tooling packages (`template-core-vite`, `template-core-vite-ssr`, `template-core-lint`, `template-core-tooling`, `vscode-template-core-syntax`) round out the authoring experience with build-time precompilation, SSR, linting, and editor syntax highlighting.

See [`packages/template-core/README.md`](packages/template-core/README.md) and its [PRD](packages/template-core/docs/PRD.md) for the full grammar and design rationale. [`apps/mvvm-template-core`](apps/mvvm-template-core) is the `.loom` greenhouse demo; [`apps/ecommerce-template-core`](apps/ecommerce-template-core) is the ecommerce/SSR reference.

## Architecture

Web Loom's architecture is heavily inspired by the C# Prism framework, reimagined around reactive signals (`@web-loom/signals-core`) and TypeScript. For the full package dependency graph, see [`paper/architecture-overview.md`](paper/architecture-overview.md).

### MVVM (Model-View-ViewModel)

```
┌─────────────────────────────────────────────────────────┐
│                         View Layer                       │
│   Any framework (React/Vue/Angular/Lit/Marko/Vanilla)    │
│              — or @web-loom/template-core                │
└────────────────────┬────────────────────────────────────┘
                     │ Binds to signals
                     ▼
┌─────────────────────────────────────────────────────────┐
│                      ViewModel Layer                     │
│    (packages/view-models - Shared Business Logic)       │
│    • Exposes data$ / isLoading$ / error$ signals        │
│    • Handles user interactions via Commands              │
│    • Framework-agnostic                                 │
└────────────────────┬────────────────────────────────────┘
                     │ Uses
                     ▼
┌─────────────────────────────────────────────────────────┐
│                       Model Layer                        │
│         (packages/mvvm-core - Data & Logic)             │
│    • BaseModel / RestfulApiModel                        │
│    • Zod validation                                     │
│    • Signal-based reactive state                        │
└─────────────────────────────────────────────────────────┘
```

### Headless UI Patterns

```
Atomic Behaviors (@web-loom/ui-core)
       ↓
Composed Patterns (@web-loom/ui-patterns)
       ↓
Framework-Specific Components — or template-core, directly
```

### Plugin Architecture

```
┌────────────────────────────────────────┐
│         Plugin Host Application         │
│  (Loads and manages plugins at runtime) │
└──────────────┬─────────────────────────┘
               │
        ┌──────┴──────┐
        │ Plugin Core │ (Framework-agnostic registry)
        └──────┬──────┘
               │
    ┌──────────┼──────────┐
    ▼          ▼          ▼
┌─────────┐ ┌─────────┐ ┌─────────┐
│React    │ │Angular  │ │Vue      │
│Adapter  │ │Adapter  │ │Adapter  │
└─────────┘ └─────────┘ └─────────┘
```

## Learn More

- [Prism to Web Loom Feature Mapping](docs/PRISM-WEBLOOM-COMPARISON.md)
- [MVVM-Core Enhancement Roadmap](docs/MVVM-CORE-PRISM-ENHANCEMENTS.md)
- [White Paper: the case for framework-agnostic MVVM](paper/white-paper.md)
- [Architecture Overview](paper/architecture-overview.md)
- [Contributing](CONTRIBUTING.md)
- [License (MIT)](LICENSE)

We are excited to have you on this journey with us. Welcome to the future of UI architecture. Welcome to Web Loom.
