# MVVM Architecture

This project is to illustrate mvvm architecture in various frontend frameworks.

## Using this example

Run the following command:

```sh
npx create-turbo@latest
```

## What's inside?

This Turborepo includes the following packages/apps:

### Apps and Packages

- `docs`: a [Next.js](https://nextjs.org/) app
- `web`: another [Next.js](https://nextjs.org/) app
- `mvvm-angular`: an [Angular](https://angular.io/) app demonstrating MVVM
- `mvvm-react`: a [React](https://react.dev/) app demonstrating MVVM
- `mvvm-vue`: a [Vue.js](https://vuejs.org/) app demonstrating MVVM
- `@repo/ui`: a stub React component library shared by both `web` and `docs` applications
- `@repo/eslint-config`: `eslint` configurations (includes `eslint-config-next` and `eslint-config-prettier`)
- `@repo/typescript-config`: `tsconfig.json`s used throughout the monorepo
- `packages/models`: contains the data models for the applications
- `packages/view-models`: contains the view models for the applications

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

- `apps/mvvm-angular`
- `apps/mvvm-react`
- `apps/mvvm-vue`

These applications demonstrate how common Models and ViewModels can be used to provide data and state management to different frontend technologies.

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
