# Web Loom - MVVM Architecture Toolkit

Web Loom is a comprehensive collection of tools and libraries for implementing MVVM Architecture across different web application frameworks and environments. This project demonstrates how the MVVM pattern can be applied consistently across React, Angular, Vue.js, vanilla JavaScript, and even plugin-based architectures.

## Key Features

- **Framework Agnostic**: Core MVVM libraries work with any frontend framework
- **Plugin Architecture**: Dynamic plugin system with framework adapters
- **Reactive State Management**: RxJS-powered reactive data flow
- **Type Safety**: Full TypeScript support across all packages
- **Shared Business Logic**: Reusable ViewModels across different UI implementations

This project is to illustrate mvvm architecture in various frontend frameworks and demonstrate the versatility of the MVVM pattern.

## Using this example

Run the following command:

```sh
npx create-turbo@latest
```

## What's inside?

This Turborepo includes the following packages/apps:

### Apps and Packages

- `docs`: a [Next.js](https://nextjs.org/) app for documentation
- `web`: a [Next.js](https://nextjs.org/) app
- `api`: a backend API service with SQLite database
- `mvvm-angular`: an [Angular](https://angular.io/) app demonstrating MVVM
- `mvvm-react`: a [React](https://react.dev/) app demonstrating MVVM
- `mvvm-vue`: a [Vue.js](https://vuejs.org/) app demonstrating MVVM
- `mvvm-vanilla`: a vanilla JavaScript + EJS app demonstrating MVVM without frameworks
- `plugin-react`: a React-based plugin host application demonstrating dynamic plugin architecture
- `@repo/ui`: a React component library shared across applications
- `@repo/shared`: shared utilities and styles used across applications
- `@repo/eslint-config`: `eslint` configurations (includes `eslint-config-next` and `eslint-config-prettier`)
- `@repo/typescript-config`: `tsconfig.json`s used throughout the monorepo
- `packages/models`: contains the data models for the applications
- `packages/view-models`: contains the view models for the applications
- `packages/store-core`: a minimal, framework-agnostic client-side state management library designed for building reactive web applications. It provides a simple and efficient way to manage UI state with a focus on type safety and predictability.
- `packages/event-bus-core`: a lightweight, framework-agnostic Event Bus library for cross-component communication.
- `packages/mvvm-core`: A framework-agnostic web library for building robust client-side applications using the Model-View-ViewModel (MVVM) pattern. This library leverages the power of RxJS for reactive data flow and Zod for strong data validation, aiming to simplify state management and API interactions across various frontend frameworks like React, Angular, and Vue.
- `packages/query-core`: QueryCore is a lightweight, zero-dependency library for managing asynchronous data fetching, caching, and state management in JavaScript applications.
- `packages/plugin-core`: Core plugin architecture library providing framework-agnostic plugin registry and management capabilities for dynamic plugin systems.

Each package/app is 100% [TypeScript](https://www.typescriptlang.org/).

## MVVM Architecture

This project utilizes the Model-View-ViewModel (MVVM) architecture to structure its frontend applications. This architectural pattern helps in separating the user interface (View) from the business logic and data (Model) through an intermediary layer called the ViewModel.

- **Model**: Represents the data and business logic of the application. In this project, the data models are located in the `packages/models` directory.
- **View**: Represents the UI elements that the user interacts with. The `mvvm-angular`, `mvvm-react`, and `mvvm-vue` apps contain the Views for their respective frameworks.
- **ViewModel**: Acts as a bridge between the View and the Model. It prepares data from the Model in a way that is easily consumable by the View and handles user interactions from the View. The ViewModels are located in the `packages/view-models` directory.

This separation of concerns offers several benefits:

- **Improved Code Organization**: Code is more structured and easier to understand.
- **Enhanced Testability**: Business logic in the ViewModel can be tested independently of the UI.
- **Better Reusability**: Models and ViewModels can potentially be shared across different Views or even different UI frameworks.

This architecture is leveraged by the following applications in this monorepo:

- `apps/mvvm-angular`: Angular implementation demonstrating MVVM with dependency injection
- `apps/mvvm-react`: React implementation using hooks and functional components
- `apps/mvvm-vue`: Vue.js implementation with Composition API
- `apps/mvvm-vanilla`: Pure JavaScript implementation with EJS templates, demonstrating that MVVM can work without any framework
- `apps/plugin-react`: Plugin host application showcasing dynamic plugin architecture with MVVM

These applications demonstrate how common Models and ViewModels can be used to provide data and state management to different frontend technologies, including framework-free implementations.

## Plugin Architecture

The project also includes a plugin architecture demonstration with the following components:

- **Plugin Host (`apps/plugin-react`)**: A React-based host application that dynamically loads and renders plugins
- **Plugin Core (`packages/plugin-core`)**: Framework-agnostic plugin registry and management system
- **Framework Adapters**: Adapters for mounting plugins in different frameworks (React, Angular, Vue, etc.)
- **Dynamic Loading**: Support for both static and dynamic plugin loading strategies

### Plugin System Features

- **Framework Agnostic Core**: Plugin registry works independently of UI framework
- **Type Safety**: Full TypeScript support for plugin manifests and components
- **Dynamic Mounting**: Plugins can be loaded and mounted at runtime
- **Lifecycle Management**: Proper plugin initialization, mounting, and cleanup
- **Manifest-Based Configuration**: Declarative plugin configuration with metadata

The plugin system demonstrates how MVVM principles can be extended to support modular, extensible applications where functionality can be added dynamically without modifying the core application.

### Utilities

This Turborepo has some additional tools already setup for you:

- [TypeScript](https://www.typescriptlang.org/) for static type checking
- [ESLint](https://eslint.org/) for code linting
- [Prettier](https://prettier.io) for code formatting

### Build

To build all apps and packages, run the following command:

```
cd my-turborepo
pnpm build
```

### Develop

To develop all apps and packages, run the following command:

```
cd my-turborepo
pnpm dev
```

### Remote Caching

> [!TIP]
> Vercel Remote Cache is free for all plans. Get started today at [vercel.com](https://vercel.com/signup?/signup?utm_source=remote-cache-sdk&utm_campaign=free_remote_cache).

Turborepo can use a technique known as [Remote Caching](https://turborepo.com/docs/core-concepts/remote-caching) to share cache artifacts across machines, enabling you to share build caches with your team and CI/CD pipelines.

By default, Turborepo will cache locally. To enable Remote Caching you will need an account with Vercel. If you don't have an account you can [create one](https://vercel.com/signup?utm_source=turborepo-examples), then enter the following commands:

```
cd my-turborepo
npx turbo login
```

This will authenticate the Turborepo CLI with your [Vercel account](https://vercel.com/docs/concepts/personal-accounts/overview).

Next, you can link your Turborepo to your Remote Cache by running the following command from the root of your Turborepo:

```
npx turbo link
```

## Useful Links

Learn more about the power of Turborepo:

- [Tasks](https://turborepo.com/docs/crafting-your-repository/running-tasks)
- [Caching](https://turborepo.com/docs/crafting-your-repository/caching)
- [Remote Caching](https://turborepo.com/docs/core-concepts/remote-caching)
- [Filtering](https://turborepo.com/docs/crafting-your-repository/running-tasks#using-filters)
- [Configuration Options](https://turborepo.com/docs/reference/configuration)
- [CLI Usage](https://turborepo.com/docs/reference/command-line-reference)
