MVVM Web Library Development Plan for API Coding Agent
This document outlines a step-by-step plan for an API coding agent to develop the MVVM web framework/library as specified in the "Web Framework/Library Requirements Document." The plan is broken down into manageable, functional chunks to facilitate iterative development and testing.

Phase 1: Core Library Setup and Base Components
Objective: Establish the project foundation and implement the fundamental BaseModel and BaseViewModel.

Steps:

Project Initialization:

Create a new TypeScript project.

Initialize package.json.

Configure tsconfig.json for a library (e.g., esnext, commonjs or esm module, declaration, outDir).

Install core dependencies: rxjs, zod.

Install dev dependencies: typescript, vitest (for testing setup).

Implement BaseModel<TData, TSchema>:

Create a BaseModel class in a new file (e.g., src/models/BaseModel.ts).

Define generic types TData and TSchema.

Implement data$, isLoading$, error$ as BehaviorSubject or ReplaySubject wrapped as Observable.

Implement setData, setLoading, setError, clearError methods to update the respective subjects.

Implement the validate method using Zod.

Add basic unit tests for BaseModel's properties and methods.

Implement BaseViewModel<TModel extends BaseModel<any, any>>:

Create a BaseViewModel class in a new file (e.g., src/viewmodels/BaseViewModel.ts).

Define generic type TModel constrained to BaseModel.

In the constructor, accept an instance of TModel.

Expose data$, isLoading$, error$ directly from the injected model.

Implement validationErrors$ observable, deriving it from the model's validation logic or a dedicated validation subject within the ViewModel.

Implement the dispose() method to handle RxJS subscription cleanup. This method should call `model.dispose()` if the ViewModel instance owns the lifecycle of the model instance. (Note: `BaseModel` now implements `IDisposable` and has a `dispose` method, which has been completed).

Add basic unit tests for BaseViewModel's properties and dispose method.

Phase 2: API Management and Commands
Objective: Add capabilities for RESTful API interaction and the Command pattern.

Steps:

Implement RestfulApiModel<TData, TSchema>:

Create a RestfulApiModel class (e.g., src/models/RestfulApiModel.ts) that extends BaseModel.

In the constructor, accept baseUrl, endpoint, fetcher function, and schema.

Implement fetch(id?: string | string[]) method:

Set isLoading$ to true.

Call the provided fetcher.

Validate the response data using the Zod schema.

Update data$ and isLoading$ (on success) or error$ (on failure).

Implement create(payload: Partial<TData>), update(id: string, payload: Partial<TData>), delete(id: string) methods:
These methods now include optimistic update logic. (Completed)

Similar logic to fetch regarding isLoading$, error$, and data$ updates, plus optimistic updates and rollback on error.

Ensure create adds the new item to data$ if it's a collection.

Ensure update modifies the existing item in data$.

Ensure delete removes the item from data$.
Implement `dispose()` method by calling `super.dispose()`. (Completed)

Add comprehensive unit tests for all CRUD methods, mocking the fetcher function, and testing optimistic update scenarios including rollbacks. (Completed)

Implement Command<TParam, TResult>:

Create a Command class (e.g., src/commands/Command.ts).

Define generic types TParam and TResult.

Implement canExecute$, isExecuting$, executeError$ as BehaviorSubject or ReplaySubject wrapped as Observable.

In the constructor, accept executeFn and optional canExecuteFn.

Implement the execute method:

Check canExecute$.

Set isExecuting$ to true.

Call executeFn and handle its Promise resolution/rejection.

Set isExecuting$ to false and update executeError$ accordingly.
Implement `dispose()` method to complete internal subjects (`isExecuting$`, `executeError$`). (Completed)

Add unit tests for Command's canExecute$, isExecuting$, execute behavior, error handling, and disposal. (Completed)

Phase 3: Observable Collections and Documentation
Objective: Implement reactive collections and provide initial documentation.

Steps:

Implement ObservableCollection<T>:

Create an ObservableCollection class (e.g., src/collections/ObservableCollection.ts).

Define generic type T.

Internally manage a private array of items.

Implement items$, itemAdded$, itemRemoved$, itemUpdated$ as Subject or ReplaySubject wrapped as Observable.

Implement add, remove, update, clear, setItems methods.

Ensure each method correctly modifies the internal array and emits on the relevant observables.

Add unit tests for ObservableCollection's methods and observable emissions.

Initial Documentation and Examples:

Create a README.md file in the root directory.

Provide a brief overview of the library, its purpose, and key features.

Add a "Getting Started" section with installation instructions.

Create simple usage examples in a examples/ directory:

A basic example demonstrating BaseModel and BaseViewModel with static data.

An example showing RestfulApiModel usage for fetching and displaying data.

An example demonstrating Command binding to a hypothetical UI element.

An example showcasing ObservableCollection for a dynamic list.

Ensure all code examples are clear, concise, and runnable.

Phase 4: Refinement and Testing
Objective: Ensure code quality, comprehensive testing, and readiness for consumption.

Steps:

Comprehensive Unit Testing:

Review and expand unit tests for all components to achieve high test coverage.

Focus on edge cases, error conditions, and observable lifecycle management.

Code Review and Refactoring:

Perform a thorough code review to ensure adherence to TypeScript best practices, RxJS patterns, and overall code quality.

Refactor any complex logic into smaller, more manageable functions.

Ensure consistent naming conventions and code style.

Build and Packaging:

Configure the build process (e.g., using tsc directly or a bundler like Rollup for multiple output formats like CommonJS, ES Modules).

Ensure type definitions (.d.ts files) are generated correctly.

Prepare package.json for publishing (e.g., main, module, types fields).

Final Documentation Review:

Review all documentation for clarity, accuracy, and completeness.

Add API reference generation (e.g., using TypeDoc) if not already planned.

Ensure examples are up-to-date with the final API.

This phased approach will allow the API coding agent to develop the library systematically, ensuring each core component is robust before moving to the next.
