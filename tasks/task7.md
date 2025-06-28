Your task is to start working on the documentation of this project inside the apps/docs.
This is a nextjs app.
Context:
This project is about mvvm architecture. Sample apps have been built under apps

- `mvvm-angular`: an [Angular](https://angular.io/) app demonstrating MVVM
- `mvvm-react`: a [React](https://react.dev/) app demonstrating MVVM
- `mvvm-vue`: a [Vue.js](https://vuejs.org/) app demonstrating MVVM

To illustrate how to use mvvm in different frontend frameworks.

The docs app is for documentation and the web is for general info on the project.

- `docs`: a [Next.js](https://nextjs.org/) app
- `web`: another [Next.js](https://nextjs.org/) app

- `packages/models`: contains the data models for the applications
- `packages/view-models`: contains the view models for the applications
- `packages/shared`: contains styling and view models and other utils

other packages are:

- `@repo/ui`: a stub React component library shared by both `web` and `docs` applications
- `@repo/eslint-config`: `eslint` configurations (includes `eslint-config-next` and `eslint-config-prettier`)
- `@repo/typescript-config`: `tsconfig.json`s used throughout the monorepo

The docs should have a general section explaining mvvm.
How the mvvm-core is used in the:

packages/models

and
packages/view-models
How to view models are used in different frameworks.

In this iteration of the documentation. You are free to look at the nextjs ecosystem and
use the best libraries and tools to help build the documentation.
