import { ZodSchema } from 'zod';
import { BaseModel } from './BaseModel';
export type ExtractItemType<T> = T extends (infer U)[] ? U : T;
/**
 * Defines a generic fetcher function type.
 * @template TResponse The expected type of the response data.
 */
export type Fetcher = <TResponse = any>(url: string, options?: RequestInit) => Promise<TResponse>;
export type TConstructorInput<TData, TSchema extends ZodSchema<TData>> = {
    baseUrl: string | null;
    endpoint: string | null;
    fetcher: Fetcher | null;
    schema: TSchema;
    initialData: TData | null;
    validateSchema?: boolean;
};
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
    private readonly _shouldValidateSchema;
    /**
     * @param baseUrl The base URL for the API (e.g., 'https://api.example.com').
     * @param endpoint The specific endpoint for this model (e.g., 'users').
     * @param fetcher A function to perform HTTP requests (e.g., window.fetch, Axios).
     * @param schema The Zod schema to validate the data.
     * @param initialData Optional initial data for the model.
     */
    constructor(input: TConstructorInput<TData, TSchema>);
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
     * @returns A promise that resolves with the created item(s) (from the server response, including final IDs)
     *          if the API call is successful.
     *          Throws an error if any API request fails (after reverting optimistic changes and setting `error$`).
     */
    create(payload: Partial<ExtractItemType<TData>> | Partial<ExtractItemType<TData>>[]): Promise<ExtractItemType<TData> | ExtractItemType<TData>[] | undefined>;
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
    update(id: string, payload: Partial<ExtractItemType<TData>>): Promise<ExtractItemType<TData> | undefined>;
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
export interface IRestfulApiModel<TData, TSchema extends ZodSchema<TData>> extends BaseModel<TData, TSchema> {
    fetch(id?: string | string[]): Promise<void>;
    create(payload: Partial<ExtractItemType<TData>> | Partial<ExtractItemType<TData>>[]): Promise<ExtractItemType<TData> | ExtractItemType<TData>[] | undefined>;
    update(id: string, payload: Partial<ExtractItemType<TData>>): Promise<ExtractItemType<TData> | undefined>;
    delete(id: string): Promise<void>;
}
//# sourceMappingURL=RestfulApiModel.d.ts.map