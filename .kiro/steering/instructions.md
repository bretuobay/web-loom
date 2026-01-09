# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Web Loom is a Turborepo monorepo demonstrating MVVM (Model-View-ViewModel) architecture across multiple frontend frameworks (React, Angular, Vue.js, vanilla JavaScript) and a plugin architecture system. The project showcases how business logic can be shared across different UI implementations using framework-agnostic core libraries.

## Common Commands

### Development

```bash
npm run dev              # Start all apps in dev mode (concurrency=20)
npm run build            # Build all packages and apps
npm run lint             # Lint all packages
npm run format           # Format code with Prettier
npm run check-types      # Type-check all packages
```

### Testing

```bash
# Run tests in specific packages (uses Vitest)
cd packages/mvvm-core && npm test              # Run tests once
cd packages/mvvm-core && npm run test:watch    # Watch mode
cd packages/mvvm-core && npm run test:coverage # With coverage

# Packages with tests: mvvm-core, store-core, event-bus-core, query-core, plugin-core, design-core, typography-core, ui-core, ui-patterns, forms-core, http-core, i18n-core, storage-core, error-core
```

### API Development

```bash
cd apps/api
npm run dev    # Start API with nodemon (auto-restart on changes)
npm run seed   # Seed SQLite database with test data
npm run build  # Build TypeScript to dist/
npm start      # Run built API
```

### Working with Specific Apps

```bash
# Each app can be run individually
cd apps/mvvm-react && npm run dev
cd apps/mvvm-angular && npm run dev
cd apps/mvvm-vue && npm run dev
cd apps/mvvm-lit && npm run dev
cd apps/mvvm-vanilla && npm run dev
cd apps/plugin-react && npm run dev
cd apps/ui-patterns-playground && npm run dev
```

## Architecture

### Core MVVM Pattern

The repository implements a strict separation of concerns:

1. **Models** (`packages/mvvm-core/src/models/`): Data and business logic layer
   - `BaseModel`: RxJS-powered reactive state with Zod validation
   - `RestfulApiModel`: Extends BaseModel with RESTful API operations
   - Exposes `data$`, `isLoading$`, `error$` observables

2. **ViewModels** (`packages/mvvm-core/src/viewmodels/`): Presentation logic layer
   - `BaseViewModel`: Connects to BaseModel, exposes observables to views
   - `RestfulApiViewModel`: Adds CRUD operations and pagination
   - `QueryStateModelView`: Handles query/filter state management
   - ViewModels are framework-agnostic and reusable

3. **Views** (in `apps/mvvm-*`): UI layer specific to each framework
   - React implementation uses hooks to subscribe to ViewModel observables
   - Angular uses dependency injection and async pipe
   - Vue uses Composition API
   - Lit uses decorators and reactive properties
   - Vanilla JS uses direct subscriptions with EJS templates

### Shared ViewModels

Application-specific ViewModels live in `packages/view-models/`:

- `GreenHouseViewModel.ts`
- `SensorReadingViewModel.ts`
- `SensorViewModel.ts`
- `ThresholdAlertViewModel.ts`

These are consumed by all framework implementations in `apps/mvvm-*`, demonstrating true cross-framework business logic sharing.

### Plugin Architecture

The plugin system (`packages/plugin-core/`) enables dynamic, runtime-loaded plugins:

- **PluginRegistry**: Framework-agnostic plugin management with lifecycle states (registered → loading → loaded → mounted → unmounted)
- **FrameworkAdapter**: Abstraction for mounting plugins in different frameworks
- **PluginManifest**: Zod-validated declarative plugin configuration
- **PluginSDK**: API exposed to plugins for host communication

The `apps/plugin-react` app demonstrates this with React-based plugin host and adapters.

### Supporting Libraries

- **store-core**: Minimal reactive state management (alternative to Redux/Zustand)
- **event-bus-core**: Framework-agnostic event bus for cross-component communication
- **event-emitter-core**: Event emitter utilities
- **query-core**: Zero-dependency data fetching and caching library
- **design-core**: Theme and CSS variable utilities
- **typography-core**: Typography and color utilities
- **models**: Shared data models (used by API and apps)
- **ui-core**: Headless UI behaviors (Dialog, Form, List Selection, Roving Focus, Disclosure)
- **ui-patterns**: Composed UI patterns (Master-Detail, Wizard, Modal, Command Palette, etc.)
- **ui-react**: React UI component adapters
- **media-core**: Media player with plugins
- **media-react**: React media player adapter
- **media-vue**: Vue media player adapter
- **forms-core**: Framework-agnostic form logic
- **forms-react/forms-vue/forms-vanilla**: Framework-specific form adapters
- **http-core**: HTTP utilities
- **i18n-core**: Internationalization utilities
- **storage-core**: Storage abstraction layer
- **error-core**: Error handling utilities
- **router-core**: Routing utilities
- **notifications-core**: Notification utilities
- **platform-core**: Platform utilities
- **visdiff**: Visual diff utilities

## Key Technical Details

### RxJS Usage

- All reactive state uses RxJS `BehaviorSubject` and `Observable`
- ViewModels use `takeUntil(this._destroy$)` pattern for subscription cleanup
- Always call `dispose()` on ViewModels when unmounting components

### Validation

- Zod schemas validate data at the Model layer
- Validation errors flow through `error$` observable and are mapped to `validationErrors$` in ViewModels
- Models reject invalid data; Views display validation errors reactively

### Dependency Injection

The `packages/mvvm-core/src/core/di-container.ts` provides simple DI for managing ViewModel/Model instances in Angular and other frameworks.

### Testing

- Tests use Vitest with jsdom environment
- Test timeout set to 20000ms (see `vitest.config.js`)
- Tests are co-located with source files (`.test.ts` suffix)
- Test pattern: `src/**/*.{test,spec}.{js,ts}`

### API Backend

- Express.js server with SQLite database (Sequelize ORM)
- Located in `apps/api`
- Models use `sequelize-typescript` decorators
- CORS enabled for local development

## Monorepo Structure

```
apps/
  ├── mvvm-react/              # React MVVM demo
  ├── mvvm-angular/            # Angular MVVM demo
  ├── mvvm-vue/                # Vue.js MVVM demo
  ├── mvvm-vanilla/            # Vanilla JS + EJS MVVM demo
  ├── mvvm-lit/                # Lit web components MVVM demo
  ├── mvvm-react-integrated/   # React with integrated patterns
  ├── mvvm-react-native/       # React Native MVVM
  ├── mvvm-book/               # MVVM documentation app
  ├── plugin-react/            # Plugin host application
  ├── plugin-docs/             # Plugin documentation
  ├── ui-patterns-playground/  # UI patterns playground
  ├── api/                     # Express + SQLite backend
  └── docs/                    # Next.js documentation site

packages/
  ├── mvvm-core/            # Core MVVM library (BaseModel, BaseViewModel, etc.)
  ├── view-models/          # Shared application ViewModels
  ├── models/               # Shared data models
  ├── plugin-core/          # Plugin architecture library
  ├── store-core/           # State management library
  ├── event-bus-core/       # Event bus library
  ├── event-emitter-core/   # Event emitter utilities
  ├── query-core/           # Data fetching/caching library
  ├── ui-core/              # Headless UI behaviors
  ├── ui-patterns/          # Composed UI patterns
  ├── ui-react/             # React UI component adapters
  ├── media-core/           # Media player core
  ├── media-react/          # React media adapter
  ├── media-vue/            # Vue media adapter
  ├── forms-core/           # Form logic core
  ├── forms-react/          # React form adapter
  ├── forms-vanilla/        # Vanilla JS form adapter
  ├── forms-vue/            # Vue form adapter
  ├── http-core/            # HTTP utilities
  ├── i18n-core/            # Internationalization
  ├── storage-core/         # Storage abstraction
  ├── error-core/           # Error handling
  ├── router-core/          # Routing utilities
  ├── notifications-core/   # Notifications
  ├── platform-core/        # Platform utilities
  ├── design-core/          # Theme utilities
  ├── typography-core/      # Typography & color utilities
  ├── visdiff/              # Visual diff utilities
  ├── shared/               # Shared utilities and styles
  ├── eslint-config/        # Shared ESLint config
  └── typescript-config/    # Shared TypeScript config
```

## Development Workflow

1. **Adding a new package**: Create in `packages/` or `apps/`, add to workspace in root `package.json`
2. **Cross-package dependencies**: Reference using workspace protocol (`"@repo/ui": "*"` or `"@web-loom/mvvm-core": "0.5.0"`)
3. **Building**: Turbo caches builds; use `turbo run build --force` to rebuild from scratch
4. **Type checking**: Run `npm run check-types` before committing
5. **Formatting**: Auto-format on save or run `npm run format` before commits

## Important Notes

- **Node version**: Requires Node.js >=18 (see `.nvmrc`)
- **Node 23** nvm use 23 , the preferred version
- **Package manager**: npm@10.9.2 (specified in `package.json`)
- **Framework versions**: React 19, Angular latest, Vue 3, Lit 3 (check individual app `package.json`)
- **TypeScript**: v5.8.2 across the monorepo
- **Build outputs**: `.next/`, `dist/` directories are gitignored

## Cross-Framework Patterns

When implementing features across frameworks:

1. Add business logic to a ViewModel in `packages/view-models/` or extend `BaseViewModel`
2. If data comes from API, extend `RestfulApiModel` for the Model
3. Implement View layer in each framework app (`apps/mvvm-*`)
4. Subscribe to ViewModel observables using framework-specific patterns:
   - React: `useEffect` + `subscribe()`
   - Angular: `async` pipe in templates
   - Vue: `watchEffect` or `computed`
   - Lit: Reactive controllers or `@state` decorators with subscriptions
   - Vanilla: Direct `.subscribe()` with manual cleanup
