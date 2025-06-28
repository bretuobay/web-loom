Web Framework/Library Requirements Document

1. Introduction
   This document outlines the requirements for a new web framework/library designed to facilitate the development of client-side web applications using the Model-View-ViewModel (MVVM) architectural pattern. The library aims to provide a set of core utilities that abstract common challenges in data management, API interaction, and state synchronization, making it easier to build complex, client-heavy applications like dashboards.

2. Goals and Objectives
   The primary goals of this library are:

To provide a robust and flexible foundation for building web applications following the MVVM pattern.

To enable developers to manage application state and data flow efficiently using Reactive Extensions for JavaScript (RxJS).

To ensure data integrity and validation through seamless integration with Zod.

To offer a framework-agnostic solution that can be integrated with popular client-side rendering libraries/frameworks such as React, Angular, and Vue.

To simplify the development of CRUD (Create, Read, Update, Delete) applications and data-intensive dashboards.

To reduce the need for framework-specific state management solutions by centralizing data handling within the library's models.

3. Target Audience
   This library is intended for:

Frontend developers building complex web applications.

Teams looking for a consistent and scalable approach to MVVM architecture across different frontend frameworks.

Developers working on data-heavy applications, dashboards, and single-page applications (SPAs) that require robust data management and real-time updates.

4. Key Features and Utilities
   4.1. MVVM Pattern Support
   The library shall provide core primitives to implement the MVVM pattern effectively.

Base Model:

Shall serve as the foundation for all data models.

Shall inherently manage its data, loading state, and error state.

data: An RxJS Observable representing the current state of the model's data.

isLoading: An RxJS Observable<boolean> indicating whether the model is currently fetching or processing data.

error: An RxJS Observable<any> representing any error encountered during data operations.

Shall be designed to act as a local store for its specific data.

Base View Model:

Shall serve as the foundation for all view models.

Shall be responsible for exposing data from models to the view in a consumable format.

Shall provide methods for interacting with models and triggering data operations.

Shall enable easy binding to the reactivity systems of various frontend frameworks (React, Angular, Vue) using RxJS observables.

New: Shall include mechanisms for proper subscription disposal to prevent memory leaks. (This is addressed by the `IDisposable` pattern implemented in `BaseModel` and `Command`. If a `BaseViewModel` owns its model or commands, it should call their `dispose()` methods in its own `dispose()` method.)

4.2. RESTful API Management
The library shall provide utilities for managing interactions with RESTful APIs, with models acting as the primary data stores.

Fetcher Integration:

Shall allow developers to provide a custom "fetcher" function (e.g., Axios, native fetch) to handle HTTP requests.

The model shall use this fetcher to perform API calls.

CRUD Operations:

Models shall support standard CRUD operations (e.g., fetch, create, update, delete) that interact with the configured API endpoints.
These operations now feature optimistic updates for a smoother user experience, with automatic rollback on error.

These operations shall automatically update the model's data, isLoading, and error observables.

Data Caching and Synchronization:

Models shall manage the lifecycle of fetched data, potentially including basic caching mechanisms to prevent redundant API calls.

Updates from CRUD operations (including optimistic ones) shall be reflected immediately in the model's data observable. Rollbacks on API error are automatically handled to maintain data consistency.

4.3. Validation with Zod
The library shall integrate Zod for robust data validation.

Schema Definition:

Models shall allow for the definition of Zod schemas to validate incoming and outgoing data.

Validation errors shall be exposed via the model's error observable or a dedicated validation error observable.

Automatic Validation:

Data passed into models (e.g., from API responses, user input) shall be automatically validated against the defined Zod schema.

New: The ViewModel should expose validation status and specific field-level validation messages derived from the Zod schema, allowing the UI to display granular error feedback.

4.4. Framework Agnostic Binding
The library shall be designed to be usable with any client-side web rendering library or framework.

RxJS as the Binding Mechanism:

The use of RxJS Observables for data, isLoading, and error shall allow for seamless integration with framework-specific reactivity systems (e.g., React hooks for subscriptions, Angular's async pipe, Vue's ref and computed properties).

No UI Framework Dependencies:

The core library shall have no direct dependencies on React, Angular, Vue, or any other UI framework.

4.5. New: Command Pattern Implementation
A fundamental aspect of MVVM in desktop/mobile is the Command pattern, which encapsulates actions and their execution logic, enabling easy binding to UI elements (buttons, menu items) while handling canExecute state (whether the action is enabled) and isExecuting state (whether the action is currently running).

ICommand Interface/Class:

Shall provide an execute() method.

Shall provide an canExecute$ (or isEnabled$) Observable<boolean> indicating if the command can currently be executed.

Shall provide an isExecuting$ Observable<boolean> indicating if the command is currently running.

Shall provide a trigger() method that initiates the command's execution, automatically managing isExecuting$.

Purpose: Decouples UI event handlers from ViewModel logic, making ViewModels more testable and UI elements easier to bind. Useful for actions like "Save," "Submit," "Refresh."

4.6. New: Observable Collections
For managing lists of data (e.g., a list of users, products, or dashboard widgets), a standard JavaScript array doesn't inherently notify subscribers of changes (additions, removals, updates to individual items). Observable collections are crucial for reactive list management.

ObservableCollection<T> Class:

Shall extend or wrap a standard array-like structure.

Shall emit RxJS observables when items are added, removed, or updated within the collection.

added$: Observable<T>

removed$: Observable<T>

updated$: Observable<T>

collectionChanged$: Observable<void> (or Observable<CollectionChangeType>) for general changes.

Purpose: Allows UI frameworks to efficiently re-render lists without full re-renders, reacting only to specific changes.

4.7. New: Dependency Injection / Service Locator Pattern (Guidance)
While not necessarily a direct utility within the core library, providing a recommended pattern or a simple abstract mechanism for ViewModels to receive their dependencies (other models, services, etc.) is vital for larger applications.

Requirement: The library documentation and examples should strongly advocate for a dependency injection or service locator pattern to construct ViewModels, promoting testability and modularity.

Purpose: Decouples ViewModels from concrete implementations of their dependencies, making them easier to test and manage.

5. Technical Requirements
   Language: TypeScript (mandatory for type safety and developer experience).

Reactive Programming: RxJS (version 7+ recommended).

Schema Validation: Zod (latest stable version).

Modularity: The library shall be designed with a modular structure, allowing developers to import only the necessary utilities.

Bundling: Shall be compatible with modern module bundlers (e.g., Webpack, Rollup, Vite).

Browser Compatibility: Shall support evergreen browsers (Chrome, Firefox, Safari, Edge).

6. Non-Functional Requirements
   Performance:

Data updates and view re-renders should be efficient, minimizing unnecessary computations.

API interactions should be optimized (e.g., debouncing, throttling, caching where appropriate).

Scalability:

The architecture should support large-scale applications with many models and views without significant performance degradation.

Maintainability:

The codebase shall be well-structured, documented, and adhere to best practices for TypeScript and RxJS.

Easy to extend and integrate new features or custom logic.

Usability (Developer Experience):

Clear and intuitive API for defining models, view models, and bindings.

Comprehensive documentation with examples for various frontend frameworks.

Good TypeScript type definitions for auto-completion and compile-time checks.

Testability:

Components of the library (models, view models, utilities) shall be easily testable in isolation.

Documentation:

Comprehensive API documentation (e.g., TypeDoc).

Getting started guides and tutorials for common use cases.

Examples demonstrating integration with React, Angular, and Vue.

7. Core Components Detailed
   7.1. BaseModel<TData, TSchema>
   Generics: TData for the shape of the data, TSchema for the Zod schema type.

Properties (Observables):

data$: Observable<TData | null>: Emits the current data.

isLoading$: Observable<boolean>: Emits true when an operation is in progress, false otherwise.

error$: Observable<any>: Emits error objects if an operation fails.

Methods:

setData(newData: TData): Updates the internal data and emits on data$.

setLoading(status: boolean): Updates the loading status.

setError(err: any): Sets an error.

clearError(): Clears any active error.

validate(data: any): TData: Validates data against TSchema using Zod. Throws if invalid.

7.2. BaseViewModel<TModel extends BaseModel<any, any>>
Generics: TModel constrained to BaseModel.

Constructor: Takes an instance of a BaseModel.

Properties (Derived from Model):

data$: Observable<TModel['data']>: Directly exposes the model's data observable.

isLoading$: Observable<TModel['isLoading']>: Directly exposes the model's loading observable.

error$: Observable<TModel['error']>: Directly exposes the model's error observable.

New: validationErrors$: Observable<Zod.ZodError | null>: An observable that emits Zod validation errors, allowing for fine-grained UI feedback.

Methods:

bindToView<T>(observable: Observable<T>): T: A utility method (conceptual) that provides a way to subscribe to an observable and manage its lifecycle within a UI framework's component. (Actual implementation would depend on the framework, e.g., React hooks for useState and useEffect).

New: dispose(): void: A method to clean up all RxJS subscriptions managed by the ViewModel, preventing memory leaks. (Note: `BaseModel` now has its own `dispose` method. If `BaseViewModel` creates/owns its model instance, it should call `model.dispose()` within its own `dispose` method.)

7.3. RestfulApiModel<TData, TSchema> (Extends BaseModel)
Constructor: Takes baseUrl: string, endpoint: string, fetcher: (url: string, options?: RequestInit) => Promise<Response>, and schema: TSchema.
Implements `IDisposable` via `BaseModel` (as `BaseModel` implements `IDisposable`).

Methods:

fetch(id?: string | string[]): Promise<void>: Fetches data from the API. Can fetch a single item or a collection.

create(payload: Partial<TData>): Promise<TData | undefined>: Sends a POST request to create a new resource. Implements optimistic updates. Returns the created item from the server response.

update(id: string, payload: Partial<TData>): Promise<TData | undefined>: Sends a PUT/PATCH request to update an existing resource. Implements optimistic updates. Returns the updated item from the server response.

delete(id: string): Promise<void>: Sends a DELETE request to remove a resource. Implements optimistic updates.

All methods shall automatically update isLoading$ and error$. `data$` reflects optimistic changes immediately, then server confirmation, or rollback on error.

7.4. New: Command Class
Generics: TParam for the type of parameter passed to execute, TResult for the return type of the command's asynchronous operation.
Implements `IDisposable`.

Constructor: Takes an executeFn: (param: TParam) => Promise<TResult> and an optional canExecuteFn: (param: TParam) => Observable<boolean> | boolean.

Properties:

canExecute$: Observable<boolean>: Emits true if the command can be executed, false otherwise.

isExecuting$: Observable<boolean>: Emits true if the command is currently running, false otherwise.

executeError$: Observable<any>: Emits any error encountered during execution.

Methods:

execute(param: TParam): Promise<TResult>: Triggers the command's execution. Automatically manages isExecuting$ and executeError$.

7.5. New: ObservableCollection<T> Class
Generics: T for the type of items in the collection.

Properties:

items$: Observable<T[]>: An observable that emits the current array of items whenever the collection changes.

itemAdded$: Observable<T>: Emits the item that was added.

itemRemoved$: Observable<T>: Emits the item that was removed.

itemUpdated$: Observable<{ oldItem: T, newItem: T }>: Emits old and new item when an item is updated (e.g., by ID).

Methods:

add(item: T): void

remove(predicate: (item: T) => boolean): void

update(predicate: (item: T) => boolean, newItem: T): void

clear(): void

setItems(newItems: T[]): void (replaces all items and emits items$)

8. Benefits
   Reduced Boilerplate: Provides ready-to-use patterns for data management and API interaction.

Improved Consistency: Enforces a consistent MVVM architecture across the application, regardless of the UI framework.

Centralized State: Models act as single sources of truth for their respective data, simplifying state management.

Enhanced Reactivity: Leverages RxJS for powerful, declarative data flow and real-time updates.

Robust Validation: Integrates Zod for compile-time and runtime data validation, with improved UI feedback.

Framework Flexibility: Allows teams to use their preferred UI framework while maintaining a unified backend logic layer.

Easier Testing: Decoupling logic into models, view models, and commands makes unit testing more straightforward.

Clearer Action Handling: The Command pattern provides a clean, testable way to encapsulate UI actions.

Efficient List Rendering: ObservableCollection enables optimized rendering of dynamic lists.
