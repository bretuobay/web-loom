The repository is and experimental mvvm library for building user interfaces.
The requirements are stored in Product Requirements Document.md and this has been implemented

Add the following utilities to the framework (directory under src/)
Make sure you add tests.

Add examples in: /src/examples so that we can use these extra utils form building apps.

Form Management ViewModel (FormViewModel<TData, TSchema>):

Purpose: Simplify handling user input forms, including real-time validation, dirty state, and submission.
Features:
formData$: BehaviorSubject<Partial<TData>>: Holds the current form input values.
isValid$: Observable<boolean>: Derived from Zod schema, indicates if the current form data is valid.
errors$: Observable<ZodError | null>: Emits validation errors.
fieldErrors$: Observable<Record<string, string[]>>: Maps errors to individual form fields.
isDirty$: Observable<boolean>: Indicates if the form data has changed from its initial state.
submitCommand: Command<void, TResult>: A command to handle form submission, potentially calling a RestfulApiModel's create or update method.
Methods to update individual fields (updateField(key, value)), reset the form, etc.
Benefit: Reduces boilerplate for forms, integrates Zod validation seamlessly, and makes form submission reactive.
Pagination/Filtering/Sorting for Collections (QueryableCollectionViewModel<T>):

Purpose: Enhance ObservableCollection (or RestfulApiViewModel when dealing with collections) with common data presentation features.
Features:
currentPage$: BehaviorSubject<number>
pageSize$: BehaviorSubject<number>
filterBy$: BehaviorSubject<string> (for search queries)
sortBy$: BehaviorSubject<keyof T | null>
sortDirection$: BehaviorSubject<'asc' | 'desc'>
paginatedItems$: Observable<T[]>: The currently displayed items, reacting to pagination/filter/sort changes.
totalPages$: Observable<number>
Commands for goToPage(page), nextPage(), prevPage(), setFilter(query), setSort(key, direction).
Benefit: Handles complex UI table/list interactions declaratively and reactively, offloading logic from components.
Notification/Toast Service (NotificationService):

Purpose: Provide a centralized way for any part of your application (models, viewmodels, commands) to dispatch user-facing notifications (success, error, info messages).
Features:
notifications$: Observable<Notification[]>: A stream of active notifications.
showSuccess(message: string), showError(message: string), showInfo(message: string) methods.
Logic to auto-dismiss notifications after a timeout.
Benefit: Decouples notification display from the components that trigger them, allowing for a single notification UI component to manage all messages.
Global Error Handling Service (GlobalErrorService):

Purpose: Catch unhandled errors from commands, observables, or other parts of the application and provide a centralized way to log them, display them, or send them to an error tracking service.
Features:
uncaughtErrors$: Observable<any>: A stream of all unhandled errors.
handleError(error: any): A method to manually log or process errors.
Benefit: Provides a single place to manage application-wide error reporting and user feedback.
Dependency Injection Container (Simple Inversion of Control):

Purpose: While not strictly a "utility" in the same vein, a simple DI container (e.g., using reflect-metadata or just a registry pattern) helps manage the lifecycle and dependencies of your models, viewmodels, and services.
Benefit: Improves testability, maintainability, and scalability by allowing you to easily swap implementations (e.g., mock RestfulApiModel in tests) and manage singletons without global variables.
By adding these utilities, your MVVM library will become a much more comprehensive and invaluable toolkit for building complex, reactive frontend applications.
