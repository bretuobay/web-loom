# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Web Loom is a Turborepo monorepo demonstrating MVVM (Model-View-ViewModel) architecture across multiple frontend frameworks (React, Angular, Vue.js, vanilla JavaScript) and a plugin architecture system. The project showcases how business logic can be shared across different UI implementations using framework-agnostic core libraries.

## Skills

Detailed instructions are available in `.claude/skills/`:

| Skill | Description |
|-------|-------------|
| **development.md** | Dev commands, Turbo pipelines, building, linting, formatting |
| **testing.md** | Vitest patterns, MVVM testing, mocking strategies |
| **api.md** | Express.js API backend, SQLite, seeding |
| **architecture.md** | MVVM patterns, Models, ViewModels, Commands, RxJS |
| **design-theming.md** | Design Core tokens, flat/paper UI, theming |
| **package-configuration.md** | Vite/Vitest/Turbo config, aliases, TypeScript |
| **cross-framework.md** | React/Angular/Vue/Lit/Vanilla integration patterns |

## Quick Reference

```bash
nvm use 23               # Use preferred Node version
npm run dev              # Start all apps in dev mode
npm run build            # Build all packages and apps
npm run check-types      # Type-check all packages
npm run test             # Run all tests
```

## Monorepo Structure

```
apps/
  ├── mvvm-react/              # React MVVM demo
  ├── mvvm-angular/            # Angular MVVM demo
  ├── mvvm-vue/                # Vue.js MVVM demo
  ├── mvvm-vanilla/            # Vanilla JS + EJS MVVM demo
  ├── mvvm-lit/                # Lit web components MVVM demo
  ├── mvvm-react-integrated/   # React with integrated patterns + theming
  ├── task-flow-ui/            # TaskFlow React app
  ├── task-flow-api/           # TaskFlow API backend
  ├── plugin-react/            # Plugin host application
  ├── ui-patterns-playground/  # UI patterns playground
  ├── api/                     # Express + SQLite backend
  └── docs/                    # Next.js documentation site

packages/
  ├── mvvm-core/            # Core MVVM library (BaseModel, BaseViewModel, Commands)
  ├── view-models/          # Shared application ViewModels
  ├── models/               # Shared data models
  ├── design-core/          # Theme tokens and CSS utilities
  ├── ui-core/              # Headless UI behaviors
  ├── ui-patterns/          # Composed UI patterns
  ├── store-core/           # State management library
  ├── query-core/           # Data fetching/caching library
  ├── forms-core/           # Form logic core
  └── ...                   # See full list in skills/development.md
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
vm.fetchCommand.execute();     // Trigger action
vm.fetchCommand.isExecuting$;  // Loading spinner
vm.fetchCommand.canExecute$;   // Button enablement
```

### Always Dispose ViewModels

```typescript
useEffect(() => {
  vm.fetchCommand.execute();
  return () => vm.dispose();
}, []);
```

## Important Notes

- **Node version**: >=18 (preferred: `nvm use 23`)
- **Package manager**: npm@10.9.2
- **TypeScript**: v5.8.2 with `erasableSyntaxOnly: true`
- **Framework versions**: React 19, Angular latest, Vue 3, Lit 3

## Development Workflow

1. **Before committing**: `npm run check-types && npm run lint && npm run test`
2. **Adding packages**: See `skills/package-configuration.md`
3. **Cross-package deps**: Use workspace protocol (`"@repo/models": "*"`)
4. **Turbo cache bypass**: `turbo run build --force`
