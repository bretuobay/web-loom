<div align="center">
  <img src="webloom.png" alt="Web Loom Logo" width="200"/>

# Web Loom - A Production-Ready, Framework-Agnostic UI Architecture Toolkit

Welcome to Web Loom, a growing ecosystem of framework-agnostic patterns for the web. Our mission is to provide a comprehensive toolkit for building sustainable, maintainable, and scalable UI applications that stand the test of time.

</div>

## Vision

In an ever-evolving landscape of frontend frameworks, Web Loom champions a timeless approach to UI architecture. Inspired by the robust patterns of C#'s Prism framework, we have adapted and enhanced these concepts for the modern web. Our goal is to empower developers to build applications whose core logic is independent of any specific framework, ensuring that your investment in code pays dividends for years to come.

## Production-Ready Packages

All published npm packages are considered production-ready and are actively maintained. These packages form the stable foundation of the Web Loom ecosystem.

## Packages Under Development

We are constantly innovating and expanding the Web Loom ecosystem. Packages that are not yet published to npm are under active development and represent the future of our toolkit. We encourage the community to explore these packages and provide feedback to help shape their evolution.

## Core Principles

- **Framework-Agnostic**: Our core libraries are designed to work with any frontend framework, or even with vanilla JavaScript.
- **MVVM Architecture**: We provide a complete Model-View-ViewModel implementation, enabling a clean separation of concerns and testable business logic.
- **Headless UI**: Our UI patterns are headless, meaning they provide the logic and behavior for common UI components without imposing any specific styling.
- **Plugin System**: A dynamic plugin architecture allows for the creation of modular and extensible applications.
- **Type-Safe**: The entire ecosystem is written in TypeScript, ensuring type safety and improved developer experience.

## Getting Started

To get started with Web Loom, simply clone the repository and install the dependencies:

```bash
npm install
```

Then, you can run the development servers for all the applications:

```bash
npm run dev
```

## Learn More

To learn more about the Web Loom ecosystem, please refer to the documentation in each individual package. You can also read more about our philosophy and architecture in the following documents:

- [Prism to Web Loom Feature Mapping](docs/PRISM-WEBLOOM-COMPARISON.md)
- [MVVM-Core Enhancement Roadmap](docs/MVVM-CORE-PRISM-ENHANCEMENTS.md)

We are excited to have you on this journey with us. Welcome to the future of UI architecture. Welcome to Web Loom.

## Core Libraries

| Package                        | Description                                      |
| ------------------------------ | ------------------------------------------------ |
| `@web-loom/mvvm-core`          | Core MVVM architecture library                   |
| `@web-loom/ui-core`            | Headless UI behaviors                            |
| `@web-loom/ui-patterns`        | Composed UI patterns                             |
| `@web-loom/store-core`         | Reactive state management                        |
| `@web-loom/query-core`         | Data fetching & caching                          |
| `@web-loom/event-bus-core`     | Event bus for cross-component communication      |
| `@web-loom/plugin-core`        | Plugin architecture                              |
| `@web-loom/typography-core`    | Typography and coloring utilities                |
| `@web-loom/design-core`        | Theme and CSS variable utilities                 |

## Architecture

Web Loom is built on a solid foundation of architectural patterns that have been adapted and enhanced for the modern web. Our architecture is heavily inspired by the C# Prism framework, but has been reimagined to leverage the power of RxJS and TypeScript.

### MVVM (Model-View-ViewModel)

The core of our architecture is the Model-View-ViewModel (MVVM) pattern. This pattern provides a clean separation of concerns between the UI (View), the presentation logic (ViewModel), and the data and business logic (Model).

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

### Headless UI Patterns

Our UI patterns are headless, meaning they provide the logic and behavior for common UI components without imposing any specific styling. This allows you to build a design system that is truly your own, while still leveraging our powerful UI logic.

```
Atomic Behaviors (@web-loom/ui-core)
       ↓
Composed Patterns (@web-loom/ui-patterns)
       ↓
Framework-Specific Components (Your App)
```

### Plugin Architecture

Web Loom features a dynamic plugin architecture that allows you to build modular and extensible applications. Plugins can contribute new routes, UI components, and even new application logic.

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
