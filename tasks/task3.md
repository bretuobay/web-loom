### Task: Building the Models and View Models of our application

## Context

You have a turbo repo managed application to illustrate mvvm architecture for web applications.

Inside apps folder you have various apps (api, mvvm-angular, mvvm-react etc)
In this task, you care about mvvm-react. There are react components set up to display data inside apps/mvvm-react/src/components

GreenhouseList
SensorList
SensorReadingList
ThresholdAlertList

These already import their view models from :

@repo/view-models

Below I will give you for your reference what the base Model ( RestfulApiModel ) and the view-model (RestfulApiViewModel) from the package mvvm-core look like.
These have been used in the models and view-models package and already set up

In this task we want to execute a command to fetch data for our react components and display them as a list ( all components should just list).

You are allowed to modify the view models and the react components to achieve this call.

Create a pull request when done.

<!-- RestfulApiModel -->

```typescript
/**
 * @class RestfulApiModel
 * Extends BaseModel to provide capabilities for interacting with RESTful APIs.
 * It manages data, loading states, and errors specific to API operations.
 * Assumes TData can be either a single resource or an array of resources.
 * @template TData The type of data managed by the model (e.g., User, User[]).
 * @template TSchema The Zod schema type for validating the data.
 */
export declare class RestfulApiModel<TData, TSchema extends ZodSchema<TData>> extends BaseModel<TData, TSchema> {
    private readonly baseUrl;
    private readonly endpoint;
    private readonly fetcher;
    /**
     * @param baseUrl The base URL for the API (e.g., 'https://api.example.com').
     * @param endpoint The specific endpoint for this model (e.g., 'users').
     * @param fetcher A function to perform HTTP requests (e.g., window.fetch, Axios).
     * @param schema The Zod schema to validate the data.
     * @param initialData Optional initial data for the model.
     */
    constructor(input: TConstructorInput_2<TData, TSchema>);
    private getUrl;
    /**
     * Executes an API request, handles loading states, errors, and validates response.
     * @param url The URL for the request.
     * @param options Fetch API options.
     * @param expectedType The expected type of the response ('single' or 'collection').
     * @returns The validated response data.
     */
    private executeApiRequest;
    /**
     * Fetches data from the API.
     * If `id` is provided, fetches a single resource. Otherwise, fetches a collection.
     * The model's `data$` will be updated with the fetched data.
     * @param id Optional ID of the resource to fetch.
     * @returns A promise that resolves when the fetch operation is complete.
     */
    fetch(id?: string | string[]): Promise<void>;
    /**
     * Creates a new resource by sending a POST request to the API.
     * This method implements an optimistic update pattern:
     * 1. A temporary item is immediately added to the local `data$` observable. If the `payload`
     *    lacks an `id`, a temporary client-side ID (e.g., "temp_...") is generated for this item.
     *    This allows the UI to reflect the change instantly.
     * 2. The actual API request is made using the original `payload`.
     * 3. If the API request is successful, the temporary item in `data$` is replaced with the
     *    actual item returned by the server (which should include the permanent, server-assigned ID).
     * 4. If the API request fails, the optimistic change is reverted (the temporary item is removed),
     *    and the `error$` observable is updated with the error from the API.
     *
     * The behavior adapts based on whether `data$` currently holds an array or a single item:
     * - If `data$` is an array, the new/temporary item is appended.
     * - If `data$` is a single item (or null), it's replaced by the new/temporary item.
     *
     * @param payload The data for the new resource. It's recommended not to include an `id` if the
     *                server generates it, allowing the optimistic update to use a temporary ID.
     * @returns A promise that resolves with the created item (from the server response, including its final ID)
     *          if the API call is successful.
     *          Throws an error if the API request fails (after reverting optimistic changes and setting `error$`).
     */
    create(payload: Partial<TData>): Promise<TData | undefined>;
    /**
     * Updates an existing resource by sending a PUT/PATCH request to the API.
     * This method implements an optimistic update pattern:
     * 1. The item in the local `data$` observable (identified by `id`) is immediately
     *    updated with the properties from the `payload`. The UI reflects this change instantly.
     * 2. The actual API request is made.
     * 3. If the API request is successful, the item in `data$` is further updated with the
     *    item returned by the server. This is important if the server modifies the item in ways
     *    not included in the original `payload` (e.g., setting an `updatedAt` timestamp).
     * 4. If the API request fails, the optimistic change to the item is reverted to its original state
     *    before the optimistic update, and the `error$` observable is updated.
     *
     * The behavior adapts based on whether `data$` currently holds an array or a single item:
     * - If `data$` is an array, the corresponding item is updated in place.
     * - If `data$` is a single item and its ID matches the provided `id`, it's updated.
     * If the item with the given `id` is not found in `data$`, an error is thrown.
     *
     * @param id The ID of the resource to update.
     * @param payload The partial data to update the resource with.
     * @returns A promise that resolves with the updated item (from the server response) if successful.
     *          Throws an error if the API request fails (after reverting optimistic changes) or if the item to update is not found.
     */
    update(id: string, payload: Partial<TData>): Promise<TData | undefined>;
    /**
     * Deletes a resource by sending a DELETE request to the API.
     * This method implements an optimistic update pattern:
     * 1. The item identified by `id` is immediately removed from the local `data$` observable
     *    (if `data$` is an array) or `data$` is set to `null` (if it was a single item matching the `id`).
     *    The UI reflects this change instantly.
     * 2. The actual API request is made.
     * 3. If the API request is successful, the optimistic change is considered final.
     * 4. If the API request fails, the optimistic deletion is reverted (the item is restored to `data$`),
     *    and the `error$` observable is updated.
     *
     * If the item with the given `id` is not found in `data$`, the method may return without error or action,
     * treating the deletion of a non-existent item as a successful no-op from the client's perspective.
     *
     * @param id The ID of the resource to delete.
     * @returns A promise that resolves when the API deletion is successful.
     *          Throws an error if the API request fails (after reverting optimistic changes).
     */
    delete(id: string): Promise<void>;
    /**
     * Cleans up resources used by the RestfulApiModel.
     * This method primarily calls `super.dispose()` to ensure that the observables
     * inherited from `BaseModel` (`data$`, `isLoading$`, `error$`) are completed.
     * Any RestfulApiModel-specific resources, such as pending API request cancellation logic
     * (if the `fetcher` supported it), would be handled here in the future.
     */
    dispose(): void;
}

/**
 * @class RestfulApiViewModel
 * A generic ViewModel to facilitate CRUD operations and state management for a specific
 * RestfulApiModel. It exposes data, loading states, and operations as observables and commands,
 * making it easy to consume in frontend frameworks.
 * @template TData The type of data managed by the underlying RestfulApiModel (e.g., User, User[]).
 * @template TSchema The Zod schema type for validating the data.
 */
export declare class RestfulApiViewModel<TData, TSchema extends ZodSchema<TData>> {
    protected model: RestfulApiModel<TData, TSchema>;
    /**
     * Exposes the current data from the RestfulApiModel.
     * Use this in your UI to bind to the list or single item.
     */
    readonly data$: Observable<TData | null>;
    /**
     * Exposes the loading state of the RestfulApiModel.
     * Use this to show spinners or disable UI elements.
     */
    readonly isLoading$: Observable<boolean>;
    /**
     * Exposes any error encountered by the RestfulApiModel.
     * Use this to display error messages to the user.
     */
    readonly error$: Observable<any>;
    readonly fetchCommand: Command<string | string[] | void, void>;
    readonly createCommand: Command<Partial<TData>, void>;
    readonly updateCommand: Command<{
        id: string;
        payload: Partial<TData>;
    }, void>;
    readonly deleteCommand: Command<string, void>;
    readonly selectedItem$: Observable<ExtractItemType<TData> | null>;
    protected readonly _selectedItemId$: BehaviorSubject<string | null>;
    /**
     * @param model An instance of RestfulApiModel that this ViewModel will manage.
     */
    constructor(model: RestfulApiModel<TData, TSchema>);
    /**
     * Selects an item by its ID. Useful for showing details or for editing.
     * This is only meaningful if TData is an array of items with an 'id' property.
     * @param id The ID of the item to select. Pass null to clear selection.
     */
    selectItem(id: string | null): void;
    /**
     * Disposes of resources held by the ViewModel.
     * This includes disposing of the underlying model and any commands.
     */
    dispose(): void;
}

}
```
