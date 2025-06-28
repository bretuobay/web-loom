# Vue 3 Todo App (MVVM Core Example)

This is a basic Todo application built with Vue 3 (using the Composition API with `<script setup>`) and Vite. It demonstrates how to use the `mvvm-core` library for state management and application logic within a Vue project.

## Overview

The application showcases the following components from the `mvvm-core` library:

- **`BaseModel`**: Used as the base for `TodoItem.ts`, where each todo item manages its own data (id, text, completion status) via RxJS observables.
- **`BaseViewModel`**: Used as the base for `TodoListViewModel.ts`, which manages the overall state of the todo list. This includes an `ObservableCollection` of `TodoItem`s and `Command` instances for actions.
- **`Command`**: Used in `TodoListViewModel` for actions like adding a new todo (`addTodoCommand`) and toggling a todo's completion status (`toggleTodoCommand`). The `canExecute$` observable from commands is used to manage UI element states (e.g., disabling a button).
- **`ObservableCollection`**: Used in `TodoListViewModel` to hold the list of `TodoItem`s and notify subscribers (like Vue components) of changes to the collection.

Vue components subscribe to these RxJS observables (from the ViewModel and Models) using Vue's Composition API (`onMounted`, `onUnmounted`, `ref`, `watch`) to reactively update the UI.

## Project Structure

- **`public/`**: Static assets provided by Vite.
- **`src/`**: Source files for the Vue application.
  - **`assets/`**: Global CSS files (e.g., `main.css`).
  - **`components/`**: Vue Single File Components (SFCs).
    - `AddTodoForm.vue`: Component for the new todo input and add button.
    - `TodoListItem.vue`: Component for displaying a single todo item.
    - `TodoList.vue`: Component for displaying the list of todos.
  - **`models/`**: Data models (reused from the React example).
    - `TodoItem.ts`: Model for an individual todo item, extends `BaseModel`.
  - **`viewmodels/`**: ViewModels (reused from the React example).
    - `TodoListViewModel.ts`: ViewModel for managing the todo list logic, extends `BaseViewModel`.
  - `App.vue`: Main application component that instantiates `TodoListViewModel` and composes the UI.
  - `main.ts`: Entry point for the Vue application (creates Vue app instance and mounts `App.vue`).
  - `vite-env.d.ts`: TypeScript definitions for Vite environment variables.
- `index.html`: Main HTML file for Vite.
- `package.json`: Project dependencies (including `mvvm-core` linked locally) and scripts.
- `vite.config.ts`: Vite configuration.
- `tsconfig.json`, `tsconfig.node.json`: TypeScript configurations.

## Prerequisites

- Node.js (version 18.x or later recommended)
- NPM (This example uses `npm` as per user request, though `pnpm` or `yarn` would also work with minor command changes). The project was scaffolded with `pnpm`, so `pnpm-lock.yaml` might exist, but `npm install` should also work.

## Getting Started

1.  **Navigate to the example directory:**

    ```bash
    cd examples/vue-example
    ```

2.  **Install dependencies:**
    This will install Vue, Vite, TypeScript, `rxjs`, and also link the local `mvvm-core` library from the root of this repository.

    ```bash
    npm install
    ```

    _(Note: The `mvvm-core` library is linked using `"mvvm-core": "file:../.."`. If the main `mvvm-core` library hasn't been built yet (i.e., its `dist` folder is missing or outdated), you may need to build it first by running `npm run build` in the root directory of the `mvvm-core` project.)_

3.  **Run the development server:**
    ```bash
    npm run dev
    ```
    This will start the Vite development server. Open the URL provided in your terminal (usually `http://localhost:5173` or similar) in your web browser to see the application.

## How it Works

1.  `App.vue` creates an instance of `TodoListViewModel`.
2.  This ViewModel is passed as a prop to the `AddTodoForm.vue` and `TodoList.vue` components.
3.  Vue components use Composition API functions (`onMounted`, `onUnmounted`, `ref`, `watch`) to:
    - Subscribe to RxJS observables from the ViewModel (e.g., `newTodoText$`, `addTodoCommand.canExecute$`, `todos.items$`).
    - Update local reactive Vue `ref`s when these observables emit new values, causing the UI to re-render.
    - Call ViewModel methods or execute commands in response to user interactions (e.g., typing in the input field, clicking buttons).
4.  The `dispose` method on the ViewModel (and subsequently on its managed Models and Commands) is called via `onUnmounted` in `App.vue` to clean up subscriptions and prevent memory leaks.

This example illustrates how `mvvm-core` can provide a structured, reactive, and testable (though tests were skipped for this example build) architecture for Vue applications, separating concerns effectively.

```

```
