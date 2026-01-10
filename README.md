<div align="center">
  <img src="webloom.png" alt="Web Loom Logo" width="200"/>

  # Web Loom - Framework-Agnostic UI Architecture Toolkit

  A comprehensive monorepo demonstrating MVVM architecture, headless UI patterns, and plugin systems across multiple frontend frameworks.
</div>

## Overview

**Web Loom** is a living demonstration that modern frontend architecture should prioritize **timeless patterns over trending frameworks**. While React, Vue, and Angular dominate today's landscape, they're ephemeral—tools that will eventually fade. What remains constant are architectural principles: MVVM separation, headless UI behaviors, and framework-agnostic design.

This monorepo proves you can write business logic **once** and deploy it across **five frameworks** (React, Angular, Vue, Lit, Vanilla JS) without modification. The same ViewModel, the same Model, the same UI behavior—zero rewrites.

**The Result**: When the next framework hype arrives, you rewrite 20% of your codebase (the View layer) instead of 100%. Your ViewModels, Models, and UI behaviors survive intact. This is **sustainable architecture**.

## Key Features

- **Framework Agnostic**: Core libraries work with any frontend framework or vanilla JS
- **MVVM Architecture**: Complete MVVM implementation with shared ViewModels across frameworks
- **Headless UI**: Atomic UI behaviors and composed patterns for building accessible interfaces
- **Plugin System**: Dynamic plugin architecture with framework adapters
- **Type-Safe**: Full TypeScript support across all packages
- **Reactive**: RxJS-powered reactive data flow with automatic UI updates

## Why Web Loom Exists

Modern frontend development suffers from **framework fatigue**. Every 2-3 years, a new framework emerges, and teams face the choice: rewrite everything or fall behind. This cycle is unsustainable.

**Web Loom demonstrates the alternative**: Build your architecture on **framework-agnostic foundations** that outlive any single framework:

1. **MVVM Architecture**: Business logic in ViewModels, not components. Test it independently, reuse it everywhere.
2. **Headless UI Behaviors**: Dialog logic, form validation, keyboard navigation—write once, use in React, Vue, Angular, or vanilla JS.
3. **Clean Separation**: Views are thin rendering layers. Swap React for Vue? Change 20% of code, not 100%.

The monorepo includes **five implementations** of the same greenhouse monitoring app across React, Angular, Vue, Lit, and vanilla JavaScript—all sharing the same ViewModels, Models, and UI behaviors. No code duplication. No framework lock-in.

**This isn't theoretical**. Companies like Microsoft (TypeScript compiler), Figma (rendering engine), and Linear (data sync) build their cores framework-agnostic. Web Loom shows you how.

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

#### [@web-loom/ui-core](packages/ui-core) ![Version](https://img.shields.io/badge/version-0.5.2-blue)

Framework-agnostic headless UI behaviors (Dialog, Form, List Selection, Roving Focus, Disclosure). Pure logic with no styling assumptions, usable across all frameworks.

**Key features**: Atomic behaviors, framework adapters, accessibility-first, <2KB per behavior

```typescript
import { createDialogBehavior } from '@web-loom/ui-core';
const dialog = createDialogBehavior({ onOpen: (content) => console.log(content) });
dialog.actions.open({ title: 'Hello' });
```

#### [@web-loom/ui-patterns](packages/ui-patterns) ![Version](https://img.shields.io/badge/version-0.5.2-blue)

Composed UI patterns (Master-Detail, Wizard, Modal, Command Palette, Tabbed Interface, Sidebar Shell, Toast Queue). Built by composing ui-core behaviors.

**Key features**: 7+ production patterns, event bus integration, validation support

```typescript
import { createWizard } from '@web-loom/ui-patterns';
const wizard = createWizard({ steps: [...], onComplete: (data) => {...} });
```

### State & Data Management

#### [@web-loom/mvvm-core](packages/mvvm-core) ![Version](https://img.shields.io/badge/version-0.5.2-blue)

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

#### [@web-loom/store-core](packages/store-core) ![Version](https://img.shields.io/badge/version-0.5.2-blue)

Minimal reactive state management library. Alternative to Redux/Zustand for simple state needs.

**Key features**: <1KB, observable-based, type-safe actions

```typescript
import { createStore } from '@web-loom/store-core';
const store = createStore(initialState, (set) => ({
  increment: () => set((state) => ({ count: state.count + 1 })),
}));
```

#### [@web-loom/query-core](packages/query-core) ![Version](https://img.shields.io/badge/version-0.5.2-blue)

Zero-dependency data fetching and caching library. Handles async data with automatic refetching and cache management.

**Key features**: Automatic caching, background refetching, request deduplication

```typescript
import QueryCore from '@web-loom/query-core';
const queryCore = new QueryCore();
queryCore.defineEndpoint('users', () => fetch('/api/users'));
```

### Communication & Events

#### [@web-loom/event-bus-core](packages/event-bus-core) ![Version](https://img.shields.io/badge/version-0.5.2-blue)

Lightweight pub-sub event bus for cross-component communication. Type-safe with zero dependencies.

**Key features**: <1KB gzipped, type-safe events, multiple listeners

```typescript
import { createEventBus } from '@web-loom/event-bus-core';
const eventBus = createEventBus<AppEvents>();
eventBus.on('user:login', (user) => console.log(user));
```

### Plugin Architecture

#### [@web-loom/plugin-core](packages/plugin-core) ![Version](https://img.shields.io/badge/version-0.5.2-blue)

Framework-agnostic plugin registry and management system with lifecycle states and manifest-based configuration.

**Key features**: Dynamic loading, framework adapters, type-safe manifests

### Utilities

#### [@web-loom/typography-core](packages/typography-core) ![Version](https://img.shields.io/badge/version-0.5.2-blue)

Typography and coloring utilities for design systems.

**Key features**: Typography, color manipulation, theme system

#### [@web-loom/design-core](packages/design-core) ![Version](https://img.shields.io/badge/version-0.5.2-blue)

Theme and CSS variable utilities for design systems.

## Applications

### MVVM Demonstrations

All apps share ViewModels from `packages/view-models`, demonstrating true cross-framework business logic reuse:

- **[mvvm-react](apps/mvvm-react)** - React implementation with hooks
- **[mvvm-angular](apps/mvvm-angular)** - Angular with dependency injection
- **[mvvm-vue](apps/mvvm-vue)** - Vue.js with Composition API
- **[mvvm-vanilla](apps/mvvm-vanilla)** - Vanilla JS + EJS templates
- **[mvvm-lit](apps/mvvm-lit)** - Lit web components implementation
- **[mvvm-react-native](apps/mvvm-react-native)** - React Native mobile app
- **[mvvm-react-integrated](apps/mvvm-react-integrated)** - React with integrated patterns
- **[mvvm-book](apps/mvvm-book)** - MVVM documentation/book app

### Plugin System

- **[plugin-react](apps/plugin-react)** - Plugin host with dynamic plugin loading
- **[plugin-docs](apps/plugin-docs)** - Plugin system documentation

### UI Playground

- **[ui-patterns-playground](apps/ui-patterns-playground)** - Interactive playground for UI patterns

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

| Package                         | Description                           | Version |
| ------------------------------- | ------------------------------------- | ------- |
| `@web-loom/ui-core`             | Headless UI behaviors                 | 0.5.2   |
| `@web-loom/ui-patterns`         | Composed UI patterns                  | 0.5.2   |
| `@web-loom/ui-react`            | React UI component adapters           | 0.5.2   |
| `@web-loom/mvvm-core`           | MVVM architecture library             | 0.5.2   |
| `@web-loom/store-core`          | Reactive state management             | 0.5.2   |
| `@web-loom/event-bus-core`      | Event bus                             | 0.5.2   |
| `@web-loom/event-emitter-core`  | Event emitter utilities               | 0.5.2   |
| `@web-loom/query-core`          | Data fetching & caching               | 0.5.2   |
| `@web-loom/plugin-core`         | Plugin architecture                   | 0.5.2   |
| `@web-loom/media-core`          | Media player with plugins             | 0.5.2   |
| `@web-loom/media-react`         | React media player adapter            | 0.5.2   |
| `@web-loom/media-vue`           | Vue media player adapter              | 0.5.2   |
| `@web-loom/design-core`         | Theme utilities                       | 0.5.2   |
| `@web-loom/typography-core`     | Typography utilities                  | 0.5.2   |
| `@web-loom/forms-core`          | Form logic (framework-agnostic)       | 0.1.0   |
| `@web-loom/forms-react`         | React form adapter                    | 0.1.0   |
| `@web-loom/forms-vanilla`       | Vanilla JS form adapter               | 0.1.0   |
| `@web-loom/forms-vue`           | Vue form adapter                      | 0.1.0   |
| `@web-loom/http-core`           | HTTP utilities                        | 0.5.2   |
| `@web-loom/i18n-core`           | Internationalization utilities        | 0.5.2   |
| `@web-loom/storage-core`        | Storage abstraction layer             | 0.5.2   |
| `@web-loom/error-core`          | Error handling utilities              | 0.5.2   |
| `@web-loom/models`              | Shared models                         | 0.5.2   |
| `@web-loom/view-models`         | Shared ViewModels                     | 0.5.2   |
| `@web-loom/router-core`         | Routing utilities                     | 0.5.2   |
| `@web-loom/notifications-core`  | Notification utilities                | 0.5.2   |
| `@web-loom/platform-core`       | Platform utilities                    | 0.5.2   |
| `@web-loom/shared`              | Shared utilities                      | 0.5.2   |
| `@web-loom/visdiff`             | Visual diff utilities                 | 0.5.2   |
| `@repo/eslint-config`           | Shared ESLint configuration           | -       |
| `@repo/typescript-config`       | Shared TypeScript configuration       | -       |

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

- **Node.js**: >=18 (recommended `nvm use 23` for local development)
- **Language**: TypeScript 5.8.2
- **Package Manager**: npm 10.9.2
- **Build Tool**: Vite 6.x, Turborepo
- **Frameworks**: React 19, Angular (latest), Vue 3
- **Reactive**: RxJS 7.x
- **Validation**: Zod 3.x
- **Testing**: Vitest 3.x
- **Backend**: Express.js + SQLite (Sequelize)

## Environment & Agent Setup

- **Local tools**: Run `npm install` once, then use `nvm use 23` (or any Node >=18) before firing up tooling.
- **AI agent guidance**: `CLAUDE.md` and `.kiro/steering/instructions.md` are mirrors that describe how Claude/agent assistants should work with the repo; keep the two files synchronized whenever the guidance changes.

## Project Structure

```
web-loom/
├── apps/
│   ├── mvvm-react/              # React MVVM demo
│   ├── mvvm-angular/            # Angular MVVM demo
│   ├── mvvm-vue/                # Vue MVVM demo
│   ├── mvvm-vanilla/            # Vanilla JS MVVM
│   ├── mvvm-lit/                # Lit web components MVVM
│   ├── mvvm-react-native/       # React Native MVVM
│   ├── mvvm-react-integrated/   # React with integrated patterns
│   ├── mvvm-book/               # MVVM documentation app
│   ├── plugin-react/            # Plugin host app
│   ├── plugin-docs/             # Plugin documentation
│   ├── ui-patterns-playground/  # UI patterns playground
│   ├── api/                     # Express + SQLite backend
│   └── docs/                    # Next.js docs site
├── packages/
│   ├── mvvm-core/            # Core MVVM library
│   ├── view-models/          # Shared ViewModels
│   ├── models/               # Shared data models
│   ├── ui-core/              # Headless UI behaviors
│   ├── ui-patterns/          # Composed UI patterns
│   ├── ui-react/             # React UI adapters
│   ├── store-core/           # State management
│   ├── event-bus-core/       # Event bus
│   ├── event-emitter-core/   # Event emitter utilities
│   ├── query-core/           # Data fetching
│   ├── plugin-core/          # Plugin architecture
│   ├── media-core/           # Media player core
│   ├── media-react/          # React media adapter
│   ├── media-vue/            # Vue media adapter
│   ├── forms-core/           # Form logic core
│   ├── forms-react/          # React form adapter
│   ├── forms-vanilla/        # Vanilla JS form adapter
│   ├── forms-vue/            # Vue form adapter
│   ├── http-core/            # HTTP utilities
│   ├── i18n-core/            # Internationalization
│   ├── storage-core/         # Storage abstraction
│   ├── error-core/           # Error handling
│   ├── router-core/          # Routing utilities
│   ├── notifications-core/   # Notifications
│   ├── platform-core/        # Platform utilities
│   ├── typography-core/      # Typography & color utils
│   ├── design-core/          # Theme utilities
│   ├── visdiff/              # Visual diff utilities
│   ├── shared/               # Shared utilities
│   ├── eslint-config/        # Shared ESLint config
│   └── typescript-config/    # Shared TypeScript config
└── [configs and tooling]
```

## Documentation

Detailed documentation available in each package's README:

- [UI Core Documentation](packages/ui-core/README.md)
- [UI Patterns Documentation](packages/ui-patterns/README.md)
- [UI React Documentation](packages/ui-react/README.md)
- [MVVM Core Documentation](packages/mvvm-core/README.md)
- [Store Core Documentation](packages/store-core/README.md)
- [Event Bus Documentation](packages/event-bus-core/README.md)
- [Event Emitter Documentation](packages/event-emitter-core/README.md)
- [Query Core Documentation](packages/query-core/README.md)
- [Plugin Core Documentation](packages/plugin-core/README.md)
- [Media Core Documentation](packages/media-core/README.md)
- [Media React Documentation](packages/media-react/README.md)
- [Media Vue Documentation](packages/media-vue/README.md)
- [Design Core Documentation](packages/design-core/README.md)
- [Typography Core Documentation](packages/typography-core/README.md)
- [Forms Core Documentation](packages/forms-core/README.md)
- [Forms React Documentation](packages/forms-react/README.md)
- [Forms Vanilla Documentation](packages/forms-vanilla/README.md)
- [Forms Vue Documentation](packages/forms-vue/README.md)
- [HTTP Core Documentation](packages/http-core/README.md)
- [I18n Core Documentation](packages/i18n-core/README.md)
- [Storage Core Documentation](packages/storage-core/README.md)
- [Error Core Documentation](packages/error-core/README.md)
- [Models Documentation](packages/models/README.md)
- [View Models Documentation](packages/view-models/README.md)
- [Router Core Documentation](packages/router-core/README.md)
- [Notifications Core Documentation](packages/notifications-core/README.md)
- [Platform Core Documentation](packages/platform-core/README.md)
- [Visdiff Documentation](packages/visdiff/README.md)
- [Shared Documentation](packages/shared/README.md)

## Architecture Philosophy

> **Why Framework-Agnostic Architecture Matters**
>
> React, Vue, Angular, and Svelte are excellent UI rendering libraries, but they're just that—rendering layers. The real power lies in solid architectural foundations that transcend any single framework. Web Loom demonstrates how framework-agnostic patterns enable:
>
> - **Longevity**: Your business logic survives framework churn
> - **Maintainability**: Clean separation of concerns reduces complexity
> - **Flexibility**: Switch frameworks without rewriting core logic
> - **Testability**: Test business logic independently of UI
> - **Team Scalability**: Developers can work across different apps using the same patterns

## Architecture Diagrams

### MVVM Architecture Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         VIEW LAYER                              │
│  (React / Angular / Vue / Lit / Vanilla - Framework-Specific)  │
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │  React   │  │ Angular  │  │   Vue    │  │   Lit    │      │
│  │Component │  │Component │  │Component │  │ Element  │      │
│  └─────┬────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘      │
│        │            │             │             │              │
│        └────────────┴─────────────┴─────────────┘              │
│                         │                                       │
│                    Subscribe to                                 │
│                    Observables                                  │
└─────────────────────────┼───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                      VIEWMODEL LAYER                            │
│       (packages/mvvm-core + packages/view-models)               │
│              Framework-Agnostic Business Logic                  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │            BaseViewModel / RestfulApiViewModel            │  │
│  │                                                            │  │
│  │  • Exposes: data$, isLoading$, error$, validationErrors$ │  │
│  │  • Commands: fetchCommand, createCommand, updateCommand   │  │
│  │  • Computed: Derived observables (e.g., activeSensors$)  │  │
│  │  • Lifecycle: dispose() for cleanup                       │  │
│  └────────────────────┬───────────────────────────────────────┘  │
│                       │ Uses                                     │
│                       ▼                                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Model Layer                            │  │
│  │         (BaseModel / RestfulApiModel)                     │  │
│  │                                                            │  │
│  │  • RxJS BehaviorSubjects for reactive state              │  │
│  │  • Zod schema validation                                  │  │
│  │  • HTTP communication (RestfulApiModel)                   │  │
│  │  • State management (data$, isLoading$, error$)          │  │
│  └────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### MVVM with Supporting Libraries Integration

```
┌────────────────────────────────────────────────────────────────────┐
│                          VIEW LAYER                                │
│         React Components / Angular / Vue / Lit / Vanilla          │
└────────────────────────────┬───────────────────────────────────────┘
                             │
                             ▼
┌────────────────────────────────────────────────────────────────────┐
│                       VIEWMODEL LAYER                              │
│                                                                    │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │                  UserViewModel (Example)                     │  │
│  │                                                              │  │
│  │  • Observables: users$, isLoading$, selectedUser$           │  │
│  │  • Commands: fetchUsers(), createUser(), deleteUser()       │  │
│  │  • Validation: validationErrors$                            │  │
│  │                                                              │  │
│  │  Integration Points:                                        │  │
│  │                                                              │  │
│  │  ┌─────────────────────────────────────────────────────┐   │  │
│  │  │  1. EVENT BUS (Cross-Feature Communication)         │   │  │
│  │  │     Where: When one feature needs to notify others  │   │  │
│  │  │                                                      │   │  │
│  │  │     eventBus.emit('user:created', user);            │   │  │
│  │  │     eventBus.on('auth:logout', () => this.reset()); │   │  │
│  │  └─────────────────────────────────────────────────────┘   │  │
│  │                                                              │  │
│  │  ┌─────────────────────────────────────────────────────┐   │  │
│  │  │  2. STORE (Shared UI State - NOT Business Logic)    │   │  │
│  │  │     Where: UI-only state (theme, sidebar, modals)   │   │  │
│  │  │     DON'T: Use for business data (use Model)        │   │  │
│  │  │                                                      │   │  │
│  │  │     const uiStore = createStore({ theme: 'dark' }); │   │  │
│  │  └─────────────────────────────────────────────────────┘   │  │
│  │                                                              │  │
│  │  ┌─────────────────────────────────────────────────────┐   │  │
│  │  │  3. QUERY CORE (Advanced Caching)                   │   │  │
│  │  │     Where: When Model's built-in caching isn't      │   │  │
│  │  │            enough (complex cache invalidation)      │   │  │
│  │  │                                                      │   │  │
│  │  │     queryCore.defineEndpoint('users', fetchUsers);  │   │  │
│  │  └─────────────────────────────────────────────────────┘   │  │
│  └──────────────────────────┬───────────────────────────────────┘  │
│                             ▼                                      │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                      MODEL LAYER                             │ │
│  │  • Business data and state (users, sensors, etc.)            │ │
│  │  • API communication (RestfulApiModel)                       │ │
│  │  • Validation (Zod schemas)                                  │ │
│  │  • This is the SOURCE OF TRUTH for business data             │ │
│  └──────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────┘

                               │
                               │ HTTP Requests
                               ▼
                    ┌─────────────────────┐
                    │    Backend API      │
                    │  (Express + SQLite) │
                    └─────────────────────┘
```

### Integration Guidelines: When to Use What

#### ✅ DO: Use Event Bus in ViewModel

**Use Case**: Cross-feature communication (user created → refresh dashboard)

```typescript
class UserViewModel extends RestfulApiViewModel {
  async createUser(data: User) {
    const user = await this.model.create(data);
    // Notify other features
    eventBus.emit('user:created', user);
    return user;
  }
}

class DashboardViewModel extends BaseViewModel {
  init() {
    // Listen for events from other features
    eventBus.on('user:created', () => this.refreshStats());
  }
}
```

#### ❌ DON'T: Use Store for Business Data

**Wrong**:
```typescript
// ❌ BAD: Business data in UI store
const store = createStore({ users: [] });
```

**Right**:
```typescript
// ✅ GOOD: Business data in Model
class UserModel extends RestfulApiModel<User[]> {
  // data$ observable contains users
}
```

#### ✅ DO: Use Store for UI-Only State

**Use Case**: Sidebar open/closed, theme, modal state

```typescript
// ✅ GOOD: Pure UI state
const uiStore = createStore({
  sidebarOpen: true,
  theme: 'dark',
  activeModal: null
}, (set) => ({
  toggleSidebar: () => set(s => ({ sidebarOpen: !s.sidebarOpen })),
  setTheme: (theme) => set({ theme })
}));
```

#### ✅ DO: Use Query Core for Advanced Caching

**Use Case**: When you need fine-grained cache invalidation beyond Model's built-in caching

```typescript
// For most cases, RestfulApiModel's built-in caching is enough
class UserViewModel extends RestfulApiViewModel {
  // Built-in caching via Model
}

// Use QueryCore when you need more control:
queryCore.defineEndpoint('users', fetchUsers, {
  cacheTime: 5 * 60 * 1000,
  refetchOnWindowFocus: true,
  invalidateOn: ['user:created', 'user:updated']
});
```

### Layered Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  PRESENTATION LAYER (Views)                                 │
│  • React/Vue/Angular Components                             │
│  • Headless UI Behaviors (from @web-loom/ui-core)          │
│  • NO business logic here                                   │
└────────────────────────────┬────────────────────────────────┘
                             │ Binds to
                             ▼
┌─────────────────────────────────────────────────────────────┐
│  BUSINESS LOGIC LAYER (ViewModels)                          │
│  • Presentation logic                                       │
│  • User interaction handlers                                │
│  • Computed observables                                     │
│  • Event Bus integration (cross-feature events)             │
└────────────────────────────┬────────────────────────────────┘
                             │ Uses
                             ▼
┌─────────────────────────────────────────────────────────────┐
│  DATA LAYER (Models)                                        │
│  • Data fetching & persistence                              │
│  • Validation (Zod)                                         │
│  • State management (RxJS)                                  │
│  • Single source of truth                                   │
└────────────────────────────┬────────────────────────────────┘
                             │ Calls
                             ▼
┌─────────────────────────────────────────────────────────────┐
│  INFRASTRUCTURE LAYER                                       │
│  • HTTP Client (@web-loom/http-core)                        │
│  • Storage (@web-loom/storage-core)                         │
│  • Error Handling (@web-loom/error-core)                    │
│  • i18n (@web-loom/i18n-core)                               │
└─────────────────────────────────────────────────────────────┘

CROSS-CUTTING CONCERNS (Used Across All Layers):
┌─────────────────────────────────────────────────────────────┐
│  • Event Bus (cross-feature communication)                  │
│  • Store (UI-only state like theme, sidebar)                │
│  • Router (navigation state)                                │
│  • Notifications (user feedback)                            │
└─────────────────────────────────────────────────────────────┘
```

## Headless UI Patterns & Behaviors: The Modern Necessity

### Why Headless UI Matters

Modern frontend development has a critical flaw: **tight coupling between logic and presentation**. Most component libraries (Material-UI, Ant Design, Bootstrap) bundle behavior with styling, making them:

- **Inflexible**: Difficult to customize without fighting the library
- **Bloated**: Ship CSS you don't need
- **Framework-locked**: Can't reuse across React, Vue, Angular
- **Update-dependent**: Breaking changes force rewrites

**Headless UI** solves this by separating **behavior** from **presentation**:

```
Traditional Component:
┌────────────────────────────┐
│   <MaterialButton />       │
│  ┌──────────────────────┐  │
│  │ Logic + Styles + DOM │  │  ❌ All coupled together
│  └──────────────────────┘  │
└────────────────────────────┘

Headless Approach:
┌────────────────────────────┐
│  createDialogBehavior()    │
│  ┌──────────────────────┐  │
│  │    Pure Logic Only   │  │  ✅ Framework-agnostic
│  └──────────────────────┘  │
└────────────────────────────┘
         │
         ▼ Use in ANY framework with YOUR styling
┌─────────┬─────────┬─────────┬─────────┐
│ React   │ Vue     │ Angular │ Vanilla │
└─────────┴─────────┴─────────┴─────────┘
```

### Web Loom's Headless Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  @web-loom/ui-core (Atomic Behaviors)                       │
│  Framework-agnostic, behavior-only, <2KB each              │
│                                                             │
│  • DialogBehavior     - Modal/dialog management            │
│  • FormBehavior       - Form state & validation            │
│  • ListSelection      - Keyboard navigation & selection    │
│  • RovingFocus        - Accessible focus management        │
│  • Disclosure         - Expand/collapse logic              │
│  • DragDrop           - Drag and drop state                │
│  • Accordion          - Accordion behavior                 │
│  • Tabs               - Tab navigation                     │
└──────────────────────────┬──────────────────────────────────┘
                           │ Composed into
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  @web-loom/ui-patterns (Composite Patterns)                 │
│  Higher-level patterns built from behaviors                 │
│                                                             │
│  • Wizard            = FormBehavior + Navigation            │
│  • MasterDetail      = ListSelection + Focus                │
│  • CommandPalette    = Search + ListSelection + Keyboard   │
│  • Modal             = DialogBehavior + Focus Trap          │
│  • Sidebar           = Disclosure + Navigation              │
└──────────────────────────┬──────────────────────────────────┘
                           │ Used by
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  Framework-Specific Components (Your App)                   │
│  You provide the styling, we provide the behavior           │
│                                                             │
│  React:    <Dialog behavior={dialogBehavior} />            │
│  Vue:      <Dialog v-model="dialog.state" />               │
│  Angular:  <dialog [behavior]="dialog">                    │
│  Vanilla:  dialog.mount(element)                           │
└─────────────────────────────────────────────────────────────┘
```

### Key Benefits Demonstrated in Web Loom

#### 1. **Framework Portability**

The same `createDialogBehavior()` works in:
- React: `mvvm-react` app
- Vue: `mvvm-vue` app
- Angular: `mvvm-angular` app
- Lit: `mvvm-lit` app
- Vanilla JS: `mvvm-vanilla` app

**Business Value**: Migrate frameworks without rewriting logic.

#### 2. **Accessibility by Default**

Behaviors include proper:
- Keyboard navigation (Arrow keys, Enter, Escape)
- Focus management (Focus trap, roving tabindex)
- ARIA attributes (roles, states, properties)
- Screen reader support

**Business Value**: Meet WCAG compliance without accessibility experts on every feature.

#### 3. **Testability**

```typescript
// Test behavior independently of UI
const dialog = createDialogBehavior();
dialog.actions.open({ title: 'Test' });
expect(dialog.state.isOpen).toBe(true);
expect(dialog.state.content.title).toBe('Test');
```

**Business Value**: Faster tests, fewer bugs.

#### 4. **Zero Style Conflicts**

No CSS shipped. Use Tailwind, CSS Modules, Styled Components—whatever you want.

**Business Value**: No `!important` hacks, no style overrides.

#### 5. **Tree-Shakeable**

```typescript
// Only import what you need
import { createDialogBehavior } from '@web-loom/ui-core';
// DialogBehavior is ~1.8KB, not 100KB+ like full component libraries
```

**Business Value**: Faster load times, better Core Web Vitals.

### Real-World Pattern: Command Palette

```
Command Palette = Composition of Behaviors
┌─────────────────────────────────────────────┐
│           createCommandPalette()            │
│                                             │
│  ┌────────────────────────────────────┐    │
│  │  DialogBehavior                    │    │
│  │  • isOpen state                    │    │
│  │  • open/close actions              │    │
│  └────────────────────────────────────┘    │
│              +                              │
│  ┌────────────────────────────────────┐    │
│  │  FormBehavior (Search Input)       │    │
│  │  • Search query state              │    │
│  │  • Input validation                │    │
│  └────────────────────────────────────┘    │
│              +                              │
│  ┌────────────────────────────────────┐    │
│  │  ListSelectionBehavior             │    │
│  │  • Arrow key navigation            │    │
│  │  • Selected item                   │    │
│  └────────────────────────────────────┘    │
│              +                              │
│  ┌────────────────────────────────────┐    │
│  │  Event Bus Integration             │    │
│  │  • Emit 'command:executed' event   │    │
│  └────────────────────────────────────┘    │
└─────────────────────────────────────────────┘
```

Each behavior is:
- **Tested independently**: Unit test each behavior
- **Reusable**: Use `ListSelectionBehavior` in dropdowns, tables, menus
- **Framework-agnostic**: Write once, use everywhere

### Study These Patterns for Modern Apps

Web Loom demonstrates production-ready patterns you should master:

1. **Separation of Concerns**: Behavior vs. Presentation
2. **Composition over Inheritance**: Build complex patterns from simple behaviors
3. **Accessibility First**: Bake it into behaviors, not bolt it on later
4. **Framework Agnostic**: Don't bet your architecture on React's longevity
5. **Type Safety**: TypeScript across behaviors, patterns, and adapters

**Why This Matters**: In 2-3 years, when the next framework hype comes, you'll migrate the View layer but keep your behaviors, ViewModels, and business logic intact.

## The Web Loom Advantage

```
Traditional Approach:
Framework (React) → Rewrite Everything → New Framework (Vue)
├─ Components (100%)  ❌ Rewrite
├─ Business Logic (100%)  ❌ Rewrite
└─ State Management (100%)  ❌ Rewrite

Web Loom Approach:
Framework (React) → Swap View Layer → New Framework (Vue)
├─ Views (20% of codebase)  ❌ Rewrite
├─ ViewModels (30%)  ✅ Keep
├─ Models (30%)  ✅ Keep
├─ UI Behaviors (10%)  ✅ Keep
└─ Infrastructure (10%)  ✅ Keep

**Result**: Rewrite 20%, keep 80%
```

## Contributing

This is a demonstration project. See individual package READMEs for architecture details and usage patterns.

## License

MIT

## Learn More

### Core Architectural Concepts
- [MVVM Architecture Guide](packages/mvvm-core/README.md) - Deep dive into Models, ViewModels, and reactive patterns
- [Headless UI Behaviors](packages/ui-core/README.md) - Framework-agnostic UI behaviors
- [Headless UI Patterns](packages/ui-patterns/README.md) - Composed patterns like Wizard, MasterDetail, CommandPalette
- [Plugin System Guide](packages/plugin-core/README.md) - Dynamic plugin architecture

### Supporting Libraries
- [Store Core](packages/store-core/README.md) - Minimal reactive state management
- [Event Bus Core](packages/event-bus-core/README.md) - Cross-feature communication
- [Query Core](packages/query-core/README.md) - Advanced data fetching and caching
- [Forms Core](packages/forms-core/README.md) - Framework-agnostic form management

### Tools & Infrastructure
- [Turborepo Documentation](https://turborepo.com/docs) - Monorepo build system
