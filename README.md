<div align="center">
  <img src="webloom.png" alt="Web Loom Logo" width="200"/>

# Web Loom - A Production-Ready, Framework-Agnostic UI Ecosystem

**Inspired by the C# Prism Framework, Web Loom is a growing ecosystem of framework-agnostic patterns for the web.** All published npm packages are production-ready, while others are under active development.

</div>

## Overview

**Web Loom** is an ecosystem of libraries and tools designed to bring battle-tested architectural patterns to modern web development. Originally inspired by the stability and structure of the C# Prism Framework, Web Loom has evolved to embrace a wider range of framework-agnostic patterns for building sustainable, maintainable, and scalable web applications.

Our core philosophy is simple: **build on patterns, not just on platforms.** While frameworks come and go, the underlying principles of good software design remain. Web Loom provides a solid foundation of well-designed, production-ready packages that allow you to write your business logic once and run it anywhere—React, Angular, Vue, or vanilla JavaScript.

## Production-Ready Packages

All published npm packages are considered production-ready and are actively maintained.

### Core Libraries

- **[@web-loom/mvvm-core](packages/mvvm-core)**: A complete MVVM implementation with a reactive, observable-based architecture.
- **[@web-loom/ui-core](packages/ui-core)**: A suite of headless UI behaviors for creating accessible, framework-agnostic UI components.
- **[@web-loom/plugin-core](packages/plugin-core)**: A powerful plugin architecture for building modular and extensible applications.
- **[@web-loom/store-core](packages/store-core)**: A minimal, reactive state management library for when you need a simple, lightweight store.
- **[@web-loom/query-core](packages/query-core)**: A zero-dependency data fetching and caching library that simplifies server-state management.
- **[@web-loom/event-bus-core](packages/event-bus-core)**: A lightweight, type-safe event bus for cross-component communication.

## Packages Under Development

The following packages are under active development and are not yet recommended for production use.

- **[@web-loom/ui-patterns](packages/ui-patterns)**: A collection of composed UI patterns built on top of `ui-core`.
- **[@web-loom/forms-core](packages/forms-core)**: A framework-agnostic form management library.
- **[@web-loom/media-core](packages/media-core)**: A media player with a plugin-based architecture.
- **And many more...**

## Getting Started

```bash
# Install dependencies
npm install

# Build all packages
npm run build

# Run all development servers
npm run dev
```

## Learn More

- **[Prism to Web Loom Comparison](docs/PRISM-WEBLOOM-COMPARISON.md)**: A detailed comparison of the original Prism Framework and Web Loom.
- **[MVVM-Core Prism Enhancements](docs/MVVM-CORE-PRISM-ENHANCEMENTS.md)**: Learn about the new framework-agnostic patterns introduced in Web Loom.

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for more information.

## License

This project is licensed under the MIT License.
