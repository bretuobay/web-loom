# Web Loom - Framework-Agnostic UI Architecture Toolkit

A comprehensive monorepo demonstrating MVVM architecture, headless UI patterns, and plugin systems across multiple frontend frameworks.

## Overview

Web Loom showcases how framework-agnostic architecture patterns enable code reuse and consistency across React, Angular, Vue.js, and vanilla JavaScript. The project includes production-ready libraries for state management, UI behaviors, and plugin systems.

## Key Features

- **Framework Agnostic**: Core libraries work with any frontend framework or vanilla JS
- **MVVM Architecture**: Complete MVVM implementation with shared ViewModels across frameworks
- **Headless UI**: Atomic UI behaviors and composed patterns for building accessible interfaces
- **Plugin System**: Dynamic plugin architecture with framework adapters
- **Type-Safe**: Full TypeScript support across all packages
- **Reactive**: RxJS-powered reactive data flow with automatic UI updates

## Quick Start

```bash
# Install dependencies
npm install

# Run all development servers
npm run dev

# Build all packages
npm run build

# Run tests
npm run test
```

## Core Libraries

### UI & Interaction

#### [@web-loom/ui-core](packages/ui-core) ![Version](https://img.shields.io/badge/version-1.0.0-blue)

Framework-agnostic headless UI behaviors (Dialog, Form, List Selection, Roving Focus, Disclosure). Pure logic with no styling assumptions, usable across all frameworks.

**Key features**: Atomic behaviors, framework adapters, accessibility-first, <2KB per behavior

```typescript
import { createDialogBehavior } from '@web-loom/ui-core';
const dialog = createDialogBehavior({ onOpen: (content) => console.log(content) });
dialog.actions.open({ title: 'Hello' });
```

#### [@web-loom/ui-patterns](packages/ui-patterns) ![Version](https://img.shields.io/badge/version-1.0.0-blue)

Composed UI patterns (Master-Detail, Wizard, Modal, Command Palette, Tabbed Interface, Sidebar Shell, Toast Queue). Built by composing ui-core behaviors.

**Key features**: 7+ production patterns, event bus integration, validation support

```typescript
import { createWizard } from '@web-loom/ui-patterns';
const wizard = createWizard({ steps: [...], onComplete: (data) => {...} });
```

### State & Data Management

#### [@web-loom/mvvm-core](packages/mvvm-core) ![Version](https://img.shields.io/badge/version-0.5.1-blue)

Complete MVVM implementation with BaseModel, BaseViewModel, RestfulApiModel, QueryStateModel, and Command pattern. RxJS-powered with Zod validation.

**Key features**: Reactive models, RESTful API integration, optimistic updates, disposable resources

```typescript
import { RestfulApiViewModel } from '@web-loom/mvvm-core';
class UserViewModel extends RestfulApiViewModel<User[], typeof UserSchema> {
  constructor() {
    super(new UserApiModel());
  }
}
```

#### [@web-loom/store-core](packages/store-core) ![Version](https://img.shields.io/badge/version-0.0.4-blue)

Minimal reactive state management library. Alternative to Redux/Zustand for simple state needs.

**Key features**: <1KB, observable-based, type-safe actions

```typescript
import { createStore } from '@web-loom/store-core';
const store = createStore(initialState, (set) => ({
  increment: () => set((state) => ({ count: state.count + 1 })),
}));
```

#### [@web-loom/query-core](packages/query-core) ![Version](https://img.shields.io/badge/version-0.0.3-blue)

Zero-dependency data fetching and caching library. Handles async data with automatic refetching and cache management.

**Key features**: Automatic caching, background refetching, request deduplication

```typescript
import QueryCore from '@web-loom/query-core';
const queryCore = new QueryCore();
queryCore.defineEndpoint('users', () => fetch('/api/users'));
```

### Communication & Events

#### [@web-loom/event-bus-core](packages/event-bus-core) ![Version](https://img.shields.io/badge/version-0.0.2-blue)

Lightweight pub-sub event bus for cross-component communication. Type-safe with zero dependencies.

**Key features**: <1KB gzipped, type-safe events, multiple listeners

```typescript
import { createEventBus } from '@web-loom/event-bus-core';
const eventBus = createEventBus<AppEvents>();
eventBus.on('user:login', (user) => console.log(user));
```

### Plugin Architecture

#### [@web-loom/plugin-core](packages/plugin-core)

Framework-agnostic plugin registry and management system with lifecycle states and manifest-based configuration.

**Key features**: Dynamic loading, framework adapters, type-safe manifests

### Utilities

#### [@web-loom/prose-scriber](packages/prose-scriber) ![Version](https://img.shields.io/badge/version-0.0.4-blue)

Typography, color manipulation, and text animation utilities. Theme management with LAB color space support.

**Key features**: Color similarity (RGB/HSL/LAB), text animations (typewriter, fade), theme system

#### [@web-loom/design-core](packages/design-core)

Theme and CSS variable utilities for design systems.

## Applications

### MVVM Demonstrations

All apps share ViewModels from `packages/view-models`, demonstrating true cross-framework business logic reuse:

- **[mvvm-react](apps/mvvm-react)** - React implementation with hooks
- **[mvvm-angular](apps/mvvm-angular)** - Angular with dependency injection
- **[mvvm-vue](apps/mvvm-vue)** - Vue.js with Composition API
- **[mvvm-vanilla](apps/mvvm-vanilla)** - Vanilla JS + EJS templates
- **[mvvm-react-native](apps/mvvm-react-native)** - React Native mobile app

### Plugin System

- **[plugin-react](apps/plugin-react)** - Plugin host with dynamic plugin loading
- **[plugin-docs](apps/plugin-docs)** - Plugin system documentation

### Backend

- **[api](apps/api)** - Express.js + SQLite API with Sequelize ORM

## Architecture Patterns

### MVVM (Model-View-ViewModel)

```
┌─────────────────────────────────────────────────────────┐
│                         View Layer                       │
│  (React / Angular / Vue / Vanilla JS - Framework UI)    │
└────────────────────┬────────────────────────────────────┘
                     │ Binds to observables
                     ▼
┌─────────────────────────────────────────────────────────┐
│                      ViewModel Layer                     │
│    (packages/view-models - Shared Business Logic)       │
│    • Exposes data$ / isLoading$ / error$ observables    │
│    • Handles user interactions                          │
│    • Framework-agnostic                                 │
└────────────────────┬────────────────────────────────────┘
                     │ Uses
                     ▼
┌─────────────────────────────────────────────────────────┐
│                       Model Layer                        │
│         (packages/mvvm-core - Data & Logic)             │
│    • BaseModel / RestfulApiModel                        │
│    • Zod validation                                     │
│    • RxJS reactive state                                │
└─────────────────────────────────────────────────────────┘
```

**Benefits**:

- Business logic tested independently of UI
- ViewModels reused across React, Angular, Vue, vanilla JS
- Type-safe data flow with Zod validation
- Reactive updates with RxJS

### Headless UI Patterns

```
Atomic Behaviors (@web-loom/ui-core)
       ↓
Composed Patterns (@web-loom/ui-patterns)
       ↓
Framework-Specific Components (Your App)
```

**Example**: A wizard pattern composes form behavior + validation + navigation logic, then frameworks provide the UI rendering.

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

## Package Overview

| Package                        | Description                     | Size      |
| ------------------------------ | ------------------------------- | --------- |
| `@web-loom/ui-core`            | Headless UI behaviors           | <2KB each |
| `@web-loom/ui-patterns`        | Composed UI patterns            | ~5KB      |
| `@web-loom/mvvm-core`          | MVVM architecture library       | ~15KB     |
| `@web-loom/store-core`         | Reactive state management       | <1KB      |
| `@web-loom/event-bus-core`     | Event bus                       | <1KB      |
| `@web-loom/query-core`         | Data fetching & caching         | ~5KB      |
| `@web-loom/plugin-core`        | Plugin architecture             | ~3KB      |
| `@web-loom/media-core`         | Media player with plugins       | ~5KB      |
| `@web-loom/design-core`        | Theme utilities                 | ~2KB      |
| `@web-loom/typography-core`    | Typography utilities            | ~2KB      |
| `@web-loom/forms-core`         | Form logic (framework-agnostic) | ~3KB      |
| `@web-loom/forms-react`        | React form adapter              | ~3KB      |
| `@web-loom/forms-vanilla`      | Vanilla JS form adapter         | ~3KB      |
| `@web-loom/forms-vue`          | Vue form adapter                | ~3KB      |
| `@web-loom/http-core`          | HTTP utilities                  | ~2KB      |
| `@web-loom/models`             | Shared models                   | ~2KB      |
| `@web-loom/view-models`        | Shared ViewModels               | ~3KB      |
| `@web-loom/router-core`        | Routing utilities               | ~2KB      |
| `@web-loom/notifications-core` | Notification utilities          | ~2KB      |
| `@web-loom/platform-core`      | Platform utilities              | ~2KB      |
| `@web-loom/shared`             | Shared utilities                | ~2KB      |

All packages are tree-shakeable with ESM support.

## Development

### Common Commands

```bash
# Development
npm run dev              # Start all apps in dev mode
npm run build            # Build all packages and apps
npm run lint             # Lint all packages
npm run format           # Format code with Prettier
npm run check-types      # Type-check all packages

# Testing
npm run test                              # Run all tests
cd packages/mvvm-core && npm test         # Test specific package
cd packages/mvvm-core && npm run test:watch    # Watch mode
cd packages/mvvm-core && npm run test:coverage # With coverage

# API Development
cd apps/api
npm run dev    # Start API with auto-reload
npm run seed   # Seed database with test data
```

### Working with Specific Apps

```bash
cd apps/mvvm-react && npm run dev
cd apps/mvvm-angular && npm run dev
cd apps/mvvm-vue && npm run dev
cd apps/plugin-react && npm run dev
```

## Key Concepts

### Shared ViewModels

Application-specific ViewModels in `packages/view-models/`:

- `GreenHouseViewModel.ts`
- `SensorReadingViewModel.ts`
- `SensorViewModel.ts`
- `ThresholdAlertViewModel.ts`

These ViewModels are consumed by ALL framework implementations, demonstrating true cross-framework business logic sharing.

### Reactive Data Flow

All state uses RxJS observables:

```typescript
viewModel.data$.subscribe((data) => updateUI(data));
viewModel.isLoading$.subscribe((loading) => showSpinner(loading));
viewModel.error$.subscribe((error) => showError(error));
```

### Resource Management

Components implement `IDisposable` for cleanup:

```typescript
const viewModel = new UserViewModel();
// ... use viewModel
viewModel.dispose(); // Cleanup subscriptions
```

## Tech Stack

- **Language**: TypeScript 5.8.2
- **Package Manager**: npm 10.9.2
- **Build Tool**: Vite 6.x, Turborepo
- **Frameworks**: React 19, Angular (latest), Vue 3
- **Reactive**: RxJS 7.x
- **Validation**: Zod 3.x
- **Testing**: Vitest 3.x
- **Backend**: Express.js + SQLite (Sequelize)

## Project Structure

```
web-loom/
├── apps/
│   ├── mvvm-react/           # React MVVM demo
│   ├── mvvm-angular/         # Angular MVVM demo
│   ├── mvvm-vue/             # Vue MVVM demo
│   ├── mvvm-vanilla/         # Vanilla JS MVVM
│   ├── mvvm-react-native/    # React Native MVVM
│   ├── plugin-react/         # Plugin host app
│   ├── api/                  # Express + SQLite backend
│   └── docs/                 # Next.js docs site
├── packages/
│   ├── mvvm-core/            # Core MVVM library
│   ├── view-models/          # Shared ViewModels
│   ├── ui-core/              # Headless UI behaviors
│   ├── ui-patterns/          # Composed UI patterns
│   ├── store-core/           # State management
│   ├── event-bus-core/       # Event bus
│   ├── query-core/           # Data fetching
│   ├── plugin-core/          # Plugin architecture
│   ├── prose-scriber/        # Typography & color utils
│   └── design-core/          # Theme utilities
└── [configs and tooling]
```

## Documentation

Detailed documentation available in each package's README:

- [UI Core Documentation](packages/ui-core/README.md)
- [UI Patterns Documentation](packages/ui-patterns/README.md)
- [MVVM Core Documentation](packages/mvvm-core/README.md)
- [Event Bus Documentation](packages/event-bus-core/README.md)
- [Plugin Core Documentation](packages/plugin-core/README.md)
- [Media Core Documentation](packages/media-core/README.md)
- [Design Core Documentation](packages/design-core/README.md)
- [Typography Core Documentation](packages/typography-core/README.md)
- [Forms Core Documentation](packages/forms-core/README.md)
- [Forms React Documentation](packages/forms-react/README.md)
- [Forms Vanilla Documentation](packages/forms-vanilla/README.md)
- [Forms Vue Documentation](packages/forms-vue/README.md)
- [HTTP Core Documentation](packages/http-core/README.md)
- [Models Documentation](packages/models/README.md)
- [View Models Documentation](packages/view-models/README.md)
- [Router Core Documentation](packages/router-core/README.md)
- [Notifications Core Documentation](packages/notifications-core/README.md)
- [Platform Core Documentation](packages/platform-core/README.md)
- [Shared Documentation](packages/shared/README.md)

## Examples

### Cross-Framework Data Sharing

```typescript
// packages/view-models/sensor.viewmodel.ts (Shared)
export class SensorViewModel extends RestfulApiViewModel<Sensor[], typeof SensorSchema> {
  constructor() {
    super(new SensorModel());
  }

  get activeSensors$() {
    return this.data$.pipe(
      map(sensors => sensors?.filter(s => s.active))
    );
  }
}

// Used in React
function SensorList() {
  const vm = useMemo(() => new SensorViewModel(), []);
  const sensors = useObservable(vm.activeSensors$, []);
  return <ul>{sensors.map(s => <li>{s.name}</li>)}</ul>;
}

// Used in Angular
@Component({...})
class SensorListComponent {
  constructor(public vm: SensorViewModel) {}
  sensors$ = this.vm.activeSensors$;
}

// Used in Vue
setup() {
  const vm = new SensorViewModel();
  const sensors = ref([]);
  watch(() => vm.activeSensors$, (obs) => {
    obs.subscribe(s => sensors.value = s);
  });
  return { sensors };
}
```

## Contributing

This is a demonstration project. See individual package READMEs for architecture details and usage patterns.

## License

MIT

## Learn More

- [MVVM Architecture Guide](packages/mvvm-core/README.md)
- [Headless UI Patterns](packages/ui-patterns/README.md)
- [Plugin System Guide](packages/plugin-core/README.md)
- [Turborepo Documentation](https://turborepo.com/docs)
