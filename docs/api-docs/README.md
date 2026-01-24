# Web Loom Published Packages - API Documentation

Comprehensive API documentation for all published Web Loom packages.

## Overview

Web Loom provides a suite of framework-agnostic, TypeScript-first packages for building modern web applications. All packages under the `@web-loom/*` scope are published to npm and available for public use.

## Published Packages

| Package | Version | Description | Size |
|---------|---------|-------------|------|
| [@web-loom/mvvm-core](./mvvm-core.md) | 0.5.4 | Complete MVVM framework with RxJS and Zod validation | Core |
| [@web-loom/query-core](./query-core.md) | 0.5.4 | Data fetching and caching library | Minimal |
| [@web-loom/store-core](./store-core.md) | 0.5.4 | Reactive state management library | <1KB |
| [@web-loom/event-bus-core](./event-bus-core.md) | 0.5.4 | Type-safe publish-subscribe event bus | <1KB |
| [@web-loom/event-emitter-core](./event-emitter-core.md) | 0.5.4 | Type-safe event emitter utility | Tiny |
| [@web-loom/ui-core](./ui-core.md) | 0.5.4 | Headless UI behaviors (Dialog, Form, List, etc.) | <2KB/behavior |
| [@web-loom/ui-patterns](./ui-patterns.md) | 0.5.4 | Composed UI patterns (Wizard, Modal, etc.) | Varies |
| [@web-loom/design-core](./design-core.md) | 0.5.6 | Design tokens and theming system | Minimal |
| [@web-loom/charts-core](./charts-core.md) | 0.1.0 | D3-based charting library | Moderate |
| [@web-loom/mvvm-patterns](./mvvm-patterns.md) | 0.0.1 | Advanced MVVM patterns (Interactions, Active Awareness) | Minimal |

## Package Categories

### Core Architecture
- **mvvm-core**: Foundation for MVVM architecture with Models, ViewModels, and Commands
- **mvvm-patterns**: Advanced ViewModel patterns inspired by Prism

### State Management
- **store-core**: Lightweight Redux-like state management
- **query-core**: Server state management with caching and auto-refetching

### Events & Communication
- **event-bus-core**: Pub-sub pattern for cross-component communication
- **event-emitter-core**: Low-level event emitter for internal package use

### UI & Interaction
- **ui-core**: Atomic headless UI behaviors
- **ui-patterns**: Composed UI patterns built from ui-core behaviors

### Design & Theming
- **design-core**: Design token system with CSS variables and theming
- **charts-core**: Charting and data visualization

## Installation

### Install Individual Packages

```bash
# MVVM Architecture
npm install @web-loom/mvvm-core rxjs zod
npm install @web-loom/mvvm-patterns

# State Management
npm install @web-loom/store-core
npm install @web-loom/query-core

# Events
npm install @web-loom/event-bus-core
npm install @web-loom/event-emitter-core

# UI
npm install @web-loom/ui-core
npm install @web-loom/ui-patterns

# Design & Theming
npm install @web-loom/design-core
npm install @web-loom/charts-core d3-array d3-axis d3-scale d3-selection d3-shape d3-transition
```

### Common Combinations

```bash
# Full MVVM stack
npm install @web-loom/mvvm-core @web-loom/mvvm-patterns @web-loom/query-core rxjs zod

# UI + Design system
npm install @web-loom/ui-core @web-loom/ui-patterns @web-loom/design-core

# Complete Web Loom experience
npm install @web-loom/mvvm-core @web-loom/query-core @web-loom/store-core @web-loom/event-bus-core @web-loom/ui-core @web-loom/ui-patterns @web-loom/design-core rxjs zod
```

## Quick Start

### MVVM Application

```typescript
import { RestfulApiViewModel } from '@web-loom/mvvm-core';
import { z } from 'zod';

const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
});

type User = z.infer<typeof UserSchema>;

class UserViewModel extends RestfulApiViewModel<User[], typeof UserSchema> {
  // CRUD commands automatically available
}

const vm = new UserViewModel();
await vm.fetchCommand.execute();
```

### State Management

```typescript
import { createStore } from '@web-loom/store-core';

const store = createStore(
  { count: 0 },
  (set) => ({
    increment: () => set(state => ({ count: state.count + 1 })),
  })
);

store.actions.increment();
console.log(store.getState()); // { count: 1 }
```

### UI Behaviors

```typescript
import { createDialogBehavior } from '@web-loom/ui-core';

const dialog = createDialogBehavior({
  onOpen: (content) => console.log('Opened:', content),
});

dialog.actions.open({ title: 'Hello World' });
```

### Design System

```typescript
import { createTheme, applyTheme, setTheme } from '@web-loom/design-core/utils';
import '@web-loom/design-core/design-system';

const darkTheme = createTheme('dark', {
  colors: {
    background: { page: '#121212' },
    text: { primary: '#E0E0E0' }
  }
});

await applyTheme(darkTheme);
setTheme('dark');
```

## Framework Support

All Web Loom packages are framework-agnostic and work with:

- **React** (18+)
- **Vue** (3+)
- **Angular** (latest)
- **Svelte**
- **Lit**
- **Vanilla JavaScript**

Framework-specific adapters are provided where needed (e.g., React hooks for ui-core).

## TypeScript Support

All packages are written in TypeScript and provide comprehensive type definitions. Minimum TypeScript version: 5.0+

## Browser Support

- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions
- Safari: Latest 2 versions
- Node.js: 18+

## Package Dependencies

### Dependency Graph

```
mvvm-core ──┬──→ query-core
            └──→ RxJS, Zod

ui-core ────────→ store-core
            ├──→ event-bus-core
            └──→ event-emitter-core

ui-patterns ─────→ ui-core
            ├──→ store-core
            ├──→ event-bus-core
            ├──→ mvvm-core (optional peer)
            └──→ query-core (optional peer)

event-bus-core ──→ event-emitter-core

mvvm-patterns ────→ mvvm-core
              └──→ RxJS

charts-core ──────→ D3.js modules
```

### Peer Dependencies

Most packages have minimal or zero dependencies:

- **mvvm-core**: Requires RxJS (^7.8.2) and Zod (^3.25.0)
- **mvvm-patterns**: Requires RxJS (^7.8.0)
- **charts-core**: Requires D3.js modules (d3-array, d3-axis, d3-scale, etc.)
- **All other packages**: Zero dependencies or internal Web Loom packages only

## Architecture Philosophy

Web Loom follows these core principles:

1. **Framework Agnostic**: Business logic survives framework changes
2. **Type Safety**: Full TypeScript support with comprehensive type inference
3. **Minimal Dependencies**: Keep bundle sizes small
4. **Tree-Shakeable**: Import only what you need
5. **Separation of Concerns**: Clear boundaries between layers (Model, ViewModel, View)
6. **Reactive by Default**: Observable patterns with RxJS
7. **Testability**: Easy to test without UI frameworks

## Common Use Cases

### Building a CRUD Application

Combine mvvm-core, query-core, and ui-patterns:

```typescript
import { RestfulApiViewModel } from '@web-loom/mvvm-core';
import { createMasterDetail } from '@web-loom/ui-patterns';
import QueryCore from '@web-loom/query-core';

const queryCore = new QueryCore();
// Define your endpoints, create ViewModels, compose UI patterns
```

### State Management Only

Use store-core as a lightweight alternative to Redux:

```typescript
import { createStore, LocalStorageAdapter } from '@web-loom/store-core';

const store = createStore(
  initialState,
  (set) => ({ /* actions */ }),
  { adapter: new LocalStorageAdapter(), key: 'app-state' }
);
```

### Headless UI Components

Use ui-core and ui-patterns for framework-agnostic UI logic:

```typescript
import { createWizard } from '@web-loom/ui-patterns';

const wizard = createWizard({
  steps: [/* ... */],
  onComplete: async (data) => { /* ... */ }
});
```

## Best Practices

1. **Always dispose ViewModels**: Call `dispose()` when components unmount to prevent memory leaks
2. **Use type-safe schemas**: Define Zod schemas for all data structures
3. **Leverage computed observables**: Derive state with RxJS operators
4. **Keep business logic in Models**: Don't mix UI state with business data
5. **Use Commands for actions**: Encapsulate operations with Command pattern
6. **Test ViewModels independently**: They're framework-agnostic and easily testable

## Migration Guides

- [From Redux to store-core](./migrations/redux-to-store-core.md) (Coming soon)
- [From MobX to mvvm-core](./migrations/mobx-to-mvvm-core.md) (Coming soon)
- [Framework Migration Guide](./migrations/framework-migration.md) (Coming soon)

## Contributing

Web Loom is open source and welcomes contributions. See the main repository for contribution guidelines.

## Support

- **Documentation**: [Web Loom Docs](https://github.com/bretuobay/web-loom)
- **Issues**: [GitHub Issues](https://github.com/bretuobay/web-loom/issues)
- **Discussions**: [GitHub Discussions](https://github.com/bretuobay/web-loom/discussions)

## License

All Web Loom packages are licensed under the MIT License.

---

## Quick Links

- [mvvm-core API](./mvvm-core.md) - MVVM architecture foundation
- [query-core API](./query-core.md) - Data fetching and caching
- [store-core API](./store-core.md) - State management
- [event-bus-core API](./event-bus-core.md) - Event communication
- [event-emitter-core API](./event-emitter-core.md) - Event emitter utility
- [ui-core API](./ui-core.md) - Headless UI behaviors
- [ui-patterns API](./ui-patterns.md) - UI patterns library
- [design-core API](./design-core.md) - Design tokens and theming
- [charts-core API](./charts-core.md) - Charting library
- [mvvm-patterns API](./mvvm-patterns.md) - Advanced MVVM patterns
