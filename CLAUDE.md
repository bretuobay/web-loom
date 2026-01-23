# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Web Loom is a Turborepo monorepo demonstrating MVVM (Model-View-ViewModel) architecture across multiple frontend frameworks (React, Angular, Vue.js, Lit, Marko, vanilla JavaScript) and a plugin architecture system. The project showcases how business logic can be shared across different UI implementations using framework-agnostic core libraries.

**Core Philosophy**: Framework-agnostic architecture where ViewModels, Models, and UI behaviors survive framework changes. When migrating frameworks, only the View layer (20% of codebase) needs rewriting.

## Skills

Detailed instructions are available in `.claude/skills/`:

| Skill                        | Description                                                  |
| ---------------------------- | ------------------------------------------------------------ |
| **development.md**           | Dev commands, Turbo pipelines, building, linting, formatting |
| **testing.md**               | Vitest patterns, MVVM testing, mocking strategies            |
| **api.md**                   | Express.js API backend, SQLite, seeding                      |
| **architecture.md**          | MVVM patterns, Models, ViewModels, Commands, RxJS            |
| **design-theming.md**        | Design Core tokens, flat/paper UI, theming                   |
| **package-configuration.md** | Vite/Vitest/Turbo config, aliases, TypeScript                |
| **cross-framework.md**       | React/Angular/Vue/Lit/Vanilla integration patterns           |

## Quick Reference

```bash
nvm use 23               # Use preferred Node version (>=18 required)
npm install              # Installs deps + runs postinstall Vite fix
npm run dev              # Start all apps in dev mode (concurrency=50)
npm run build            # Build all packages and apps
npm run check-types      # Type-check all packages
npm run test             # Run all tests
npm run lint             # Lint all packages
npm run format           # Format with Prettier

# Demo runners
npm run demo:start       # Interactive demo app selector
npm run demo:task-flow   # Start TaskFlow UI + API together
```

## Monorepo Structure

```
apps/
  ├── mvvm-react/              # React MVVM demo
  ├── mvvm-angular/            # Angular MVVM demo
  ├── mvvm-vue/                # Vue.js MVVM demo
  ├── mvvm-vanilla/            # Vanilla JS + EJS MVVM demo
  ├── mvvm-lit/                # Lit web components MVVM demo
  ├── mvvm-marko/              # Marko MVVM demo
  ├── mvvm-react-integrated/   # React with integrated patterns + theming
  ├── mvvm-react-native/       # React Native mobile MVVM demo
  ├── mvvm-book/               # MVVM documentation/book app
  ├── task-flow-ui/            # TaskFlow React app
  ├── task-flow-api/           # TaskFlow API backend
  ├── plugin-react/            # Plugin host application
  ├── plugin-docs/             # Plugin system documentation
  ├── ui-patterns-playground/  # UI patterns playground
  ├── api/                     # Express + SQLite backend
  └── docs/                    # Next.js documentation site

packages/ (34 total)
  Core Architecture:
  ├── mvvm-core/            # Core MVVM library (BaseModel, BaseViewModel, Commands)
  ├── mvvm-patterns/        # MVVM design patterns
  ├── view-models/          # Shared application ViewModels (@repo/view-models)
  ├── models/               # Shared data models (@repo/models)

  UI & Interaction:
  ├── ui-core/              # Headless UI behaviors (Dialog, Form, List, RovingFocus)
  ├── ui-patterns/          # Composed UI patterns (Wizard, MasterDetail, CommandPalette)
  ├── ui-react/             # React UI component adapters

  State & Data:
  ├── store-core/           # Minimal reactive state management
  ├── query-core/           # Data fetching/caching library
  ├── event-bus-core/       # Pub-sub event bus
  ├── event-emitter-core/   # Event emitter utilities

  Forms & Media:
  ├── forms-core/           # Framework-agnostic form logic
  ├── forms-react/          # React form adapter
  ├── forms-vue/            # Vue form adapter
  ├── forms-vanilla/        # Vanilla JS form adapter
  ├── media-core/           # Media player core with plugins
  ├── media-react/          # React media player adapter
  ├── media-vue/            # Vue media player adapter

  Design & Theming:
  ├── design-core/          # Theme tokens and CSS utilities
  ├── typography-core/      # Typography and coloring utilities
  ├── charts-core/          # Chart utilities

  Infrastructure:
  ├── plugin-core/          # Plugin architecture system
  ├── http-core/            # HTTP client utilities
  ├── router-core/          # Routing utilities
  ├── storage-core/         # Storage abstraction (localStorage, sessionStorage)
  ├── i18n-core/            # Internationalization
  ├── error-core/           # Error handling utilities
  ├── notifications-core/   # Notification system
  ├── platform-core/        # Platform detection utilities
  ├── shared/               # Shared utilities
  └── visdiff/              # Visual diff utilities

  Config:
  ├── eslint-config/        # Shared ESLint config (@repo/eslint-config)
  ├── typescript-config/    # Shared TypeScript config (@repo/typescript-config)
  └── turbo-analyse/        # Turbo analysis utilities
```

## Key Patterns

### MVVM Flow

```
Model (data$, isLoading$, error$)
  ↓
ViewModel (commands, computed observables)
  ↓
View (framework-specific subscriptions)
```

### Command Pattern

```typescript
vm.fetchCommand.execute(); // Trigger action
vm.fetchCommand.isExecuting$; // Loading spinner
vm.fetchCommand.canExecute$; // Button enablement
```

### Always Dispose ViewModels

```typescript
useEffect(() => {
  vm.fetchCommand.execute();
  return () => vm.dispose();
}, []);
```

## Architecture Layers

Web Loom uses a strict layered architecture:

```
View (Framework-specific)
  ↓ subscribes to observables
ViewModel (Framework-agnostic business logic)
  ↓ uses
Model (Data & API layer)
  ↓ calls
Infrastructure (HTTP, Storage, i18n, etc.)
```

**Cross-cutting concerns** (used across all layers):
- Event Bus (cross-feature communication)
- Store (UI-only state like theme, sidebar)
- Router (navigation state)
- Notifications (user feedback)

**Important**: Keep business data in Models, not in Store. Store is for UI-only state (theme, sidebar open/closed, modal visibility). Business data belongs in Models with reactive observables.

## Package Naming Conventions

- `@web-loom/*` - Published packages (npm public scope)
  - Examples: `@web-loom/mvvm-core`, `@web-loom/ui-core`, `@web-loom/store-core`
  - These are intended for external use and follow semantic versioning
- `@repo/*` - Internal workspace packages (monorepo only)
  - Examples: `@repo/models`, `@repo/view-models`, `@repo/eslint-config`, `@repo/typescript-config`
  - These are shared within the monorepo but not published to npm

## Important Notes

- **Node version**: >=18 (preferred: `nvm use 23`)
- **Package manager**: npm@10.9.2 (locked via `packageManager` field)
- **TypeScript**: v5.8.2 with `erasableSyntaxOnly: true` (performance optimization)
- **Framework versions**: React 19, Angular latest, Vue 3, Lit 3, Marko 5
- **Postinstall hook**: Runs `scripts/postinstall/vite-require-fix.cjs` automatically after npm install
- **Husky**: Git hooks enabled (`npm run prepare`) for commit linting with conventional commits
- **Overrides**: Security fixes for `tmp`, `@babel/traverse`, `@babel/core`, `@babel/types`

## Development Workflow

1. **Before committing**: `npm run check-types && npm run lint && npm run test`
   - Husky pre-commit hooks will enforce commit message format (conventional commits)
2. **Adding packages**: See `.claude/skills/package-configuration.md`
3. **Cross-package deps**: Use workspace protocol (`"@repo/models": "*"` or `"@web-loom/mvvm-core": "*"`)
4. **Turbo cache bypass**: `turbo run build --force`
5. **Working on specific apps**:
   - Use Turbo filters: `turbo run dev --filter=mvvm-react`
   - Or cd into app: `cd apps/mvvm-react && npm run dev`

## Utility Scripts

```bash
npm run count-loc           # Count lines of code (custom script)
npm run count-loc:json      # LOC output in JSON format
npm run count-loc:cloc      # Use cloc tool for LOC analysis
npm run count-loc:visualize # Visualize LOC distribution
```

## Testing

All core packages use Vitest with jsdom environment:

```bash
# Run all tests
npm run test

# Test specific package
cd packages/mvvm-core && npm test         # Run once
cd packages/mvvm-core && npm run test:watch    # Watch mode
cd packages/mvvm-core && npm run test:coverage # With coverage

# Test specific app
turbo run test --filter=mvvm-react
```

**Key testing patterns:**
- Test ViewModels independently of UI by mocking fetchers
- Use RxJS `firstValueFrom` for single emissions, `.subscribe()` for state transitions
- Always call `vm.dispose()` in test cleanup to prevent memory leaks
- Tests are co-located with source: `*.test.ts` or `*.spec.ts` files in `src/`

## Default Ports

- `mvvm-react`: 5173
- `task-flow-ui`: 5178
- `api`: 3000
- `task-flow-api`: 3001

## Turbo Configuration

The `turbo.json` defines task dependencies:
- `build`: Depends on `^build` (upstream builds), cached
- `lint`: Independent, cached
- `check-types`: Independent, cached
- `test`: Depends on `^build`, cached
- `dev`: Not cached, persistent (long-running dev servers)
