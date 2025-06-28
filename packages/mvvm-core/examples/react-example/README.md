# React Todo App (MVVM Core Example)

This is a basic Todo application built with React and Vite, demonstrating how to use the `mvvm-core` library for state management and application logic.

## Overview

The application showcases the following components from the `mvvm-core` library:

- **`BaseModel`**: Used as the base for `TodoItem.ts`, where each todo item manages its own data (id, text, completion status).
- **`BaseViewModel`**: Used as the base for `TodoListViewModel.ts`, which manages the overall state of the todo list, including a collection of `TodoItem`s and commands.
- **`Command`**: Used in `TodoListViewModel` for actions like adding a new todo (`addTodoCommand`) and toggling a todo's completion status (`toggleTodoCommand`).
- **`ObservableCollection`**: Used in `TodoListViewModel` to hold the list of `TodoItem`s and notify subscribers of changes to the collection.

The React components subscribe to observables exposed by the ViewModel and Models to reactively update the UI.

## Project Structure

- **`public/`**: Static assets.
- **`src/`**: Source files for the React application.
  - **`assets/`**: (If any, typically for images, etc. - not used in this basic example)
  - **`components/`**: React components for the UI.
    - `AddTodoForm.tsx`: Component for adding new todos.
    - `TodoListItem.tsx`: Component for displaying a single todo item.
    - `TodoList.tsx`: Component for displaying the list of todos.
  - **`models/`**: Data models.
    - `TodoItem.ts`: Model for an individual todo item, extends `BaseModel`.
  - **`viewmodels/`**: ViewModels.
    - `TodoListViewModel.ts`: ViewModel for managing the todo list and related logic, extends `BaseViewModel`.
  - `App.css`: Styles for the `App` component.
  - `App.tsx`: Main application component that instantiates the ViewModel and composes the UI.
  - `index.css`: Global styles.
  - `main.tsx`: Entry point for the React application.
- `index.html`: Main HTML file for Vite.
- `package.json`: Project dependencies and scripts. Note that `mvvm-core` is linked locally using a `file:` path.
- `vite.config.ts`: Vite configuration.
- `tsconfig.json` & `tsconfig.node.json`: TypeScript configurations.

## Prerequisites

- Node.js (version 18.x or later recommended)
- npm (or yarn/pnpm)

## Getting Started

1.  **Navigate to the example directory:**

    ```bash
    cd examples/react-example
    ```

2.  **Install dependencies:**
    This will install React, ReactDOM, Vite, TypeScript, and also link the local `mvvm-core` library from the root of this repository.

    ```bash
    npm install
    ```

    _(If you are in an environment where the `mvvm-core` root directory's `dist` folder (build output) is not yet built, you might need to build the main library first. Typically, this would be `npm run build` in the root directory of the `mvvm-core` project.)_

3.  **Run the development server:**
    ```bash
    npm run dev
    ```
    This will start the Vite development server, and you should see a URL (usually `http://localhost:5173` or similar) in your terminal. Open this URL in your web browser to see the application.

## How it Works

1.  `App.tsx` creates an instance of `TodoListViewModel`.
2.  This ViewModel is passed down to `AddTodoForm` and `TodoList` components.
3.  `AddTodoForm` uses `viewModel.newTodoText` (via `newTodoText$` and setters) for its input and `viewModel.addTodoCommand` to add new todos. The button's enabled state is tied to `addTodoCommand.canExecute$`.
4.  `TodoList` subscribes to `viewModel.todos.items$` to get the list of `TodoItem` models.
5.  Each `TodoItem` model is passed to a `TodoListItem` component.
6.  `TodoListItem` subscribes to its respective `todo.data$` to display the text and completion status. It uses `viewModel.toggleTodoCommand` to toggle the completion status.
7.  Changes in Models and the ViewModel propagate via RxJS observables, and React components update their state using `useState` and `useEffect` hooks to re-render the UI.
8.  The `dispose` method on the ViewModel (and subsequently on Models and Commands) is called when the `App` component unmounts to clean up subscriptions and prevent memory leaks.

This example demonstrates a clean separation of concerns, where the ViewModel handles application logic and state, Models represent the data, and React Components focus on presentation and user interaction.
