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

In this task we want to execute a command to fetch data for our react components and display them as a list ( all components should just list).

You are allowed to modify the view models and the react components to achieve this call.

Create a pull request when done.

<!-- RestfulApiModel -->

```typescript
import { z, ZodSchema } from "zod";
import { BaseModel } from "./BaseModel"; // Assuming IDisposable is also needed/exported

// Helper for temporary ID
const tempIdPrefix = "temp_";
function generateTempId(): string {
  return `${tempIdPrefix}${Date.now()}_${Math.random()
    .toString(36)
    .substring(2, 9)}`;
}

// Helper to manage item with ID
interface ItemWithId {
  id: string;
  [key: string]: any;
}

/**
 * Defines a generic fetcher function type.
 * @template TResponse The expected type of the response data.
 */
export type Fetcher = <TResponse = any>(
  url: string,
  options?: RequestInit
) => Promise<TResponse>;

export type TConstructorInput<TData, TSchema extends ZodSchema<TData>> = {
  baseUrl: string | null;
  endpoint: string | null;
  fetcher: Fetcher | null;
  schema: TSchema;
  initialData: TData | null;
};

/**
 * @class RestfulApiModel
 * Extends BaseModel to provide capabilities for interacting with RESTful APIs.
 * It manages data, loading states, and errors specific to API operations.
 * Assumes TData can be either a single resource or an array of resources.
 * @template TData The type of data managed by the model (e.g., User, User[]).
 * @template TSchema The Zod schema type for validating the data.
 */
export class RestfulApiModel<
  TData,
  TSchema extends ZodSchema<TData>
> extends BaseModel<TData, TSchema> {
  private readonly baseUrl: string;
  private readonly endpoint: string;
  private readonly fetcher: Fetcher;

  /**
   * @param baseUrl The base URL for the API (e.g., 'https://api.example.com').
   * @param endpoint The specific endpoint for this model (e.g., 'users').
   * @param fetcher A function to perform HTTP requests (e.g., window.fetch, Axios).
   * @param schema The Zod schema to validate the data.
   * @param initialData Optional initial data for the model.
   */
  constructor(input: TConstructorInput<TData, TSchema>) {
    const { baseUrl, endpoint, fetcher, schema, initialData } = input;
    super({ initialData, schema });
    if (!baseUrl || !endpoint || !fetcher) {
      throw new Error(
        "RestfulApiModel requires baseUrl, endpoint, and fetcher."
      );
    }
    this.baseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
    this.endpoint = endpoint.startsWith("/") ? endpoint.slice(1) : endpoint;
    this.fetcher = fetcher;
  }

  private getUrl(id?: string): string {
    if (id) {
      return `${this.baseUrl}/${this.endpoint}/${id}`;
    }
    return `${this.baseUrl}/${this.endpoint}`;
  }

  /**
   * Executes an API request, handles loading states, errors, and validates response.
   * @param url The URL for the request.
   * @param options Fetch API options.
   * @param expectedType The expected type of the response ('single' or 'collection').
   * @returns The validated response data.
   */
  private async executeApiRequest(
    url: string,
    options: RequestInit = {},
    expectedType: "single" | "collection" | "none" = "single"
  ): Promise<any> {
    this.setLoading(true);
    this.clearError();
    try {
      const response = await this.fetcher(url, options);
      if (!response) {
        // For fetcher that might return null/undefined on non-2xx status before throwing
        throw new Error(`API request to ${url} failed with empty response.`);
      }

      // Attempt to parse JSON only if content-type suggests it
      const contentType = response.headers?.get("content-type");
      let data: any = null;
      if (contentType && contentType.includes("application/json")) {
        data = await (response as Response).json();
      } else if (response instanceof Response && response.status === 204) {
        // No content for 204
        data = null;
      } else if (response instanceof Response) {
        // For other non-JSON responses, e.g. text
        data = await response.text();
      } else {
        // If fetcher doesn't return a Response object but processed data directly (e.g. Axios already parses)
        data = response;
      }

      if (this.schema && expectedType !== "none") {
        if (expectedType === "collection") {
          return z.array(this.schema).parse(data); // Use imported 'z'
        } else {
          // 'single'
          return this.schema.parse(data);
        }
      }
      return data;
    } catch (err) {
      this.setError(err);
      throw err; // Re-throw to allow caller to handle
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Fetches data from the API.
   * If `id` is provided, fetches a single resource. Otherwise, fetches a collection.
   * The model's `data$` will be updated with the fetched data.
   * @param id Optional ID of the resource to fetch.
   * @returns A promise that resolves when the fetch operation is complete.
   */
  public async fetch(id?: string | string[]): Promise<void> {
    let url = this.getUrl();
    let expectedType: "single" | "collection" = "collection";

    if (id) {
      if (Array.isArray(id)) {
        url = `${this.getUrl()}?ids=${id.join(",")}`; // Example for fetching multiple by ID
        expectedType = "collection";
      } else {
        url = this.getUrl(id);
        expectedType = "single";
      }
    }

    try {
      const fetchedData = await this.executeApiRequest(
        url,
        { method: "GET" },
        expectedType
      );
      this.setData(fetchedData);
    } catch (error) {
      // Error already set by executeApiRequest
    }
  }

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
  public async create(payload: Partial<TData>): Promise<TData | undefined> {
    const originalData = this._data$.getValue();
    let tempItem: TData;
    let optimisticData: TData | null = null;
    let tempItemId: string | null = null;

    if (Array.isArray(originalData)) {
      // Ensure payload has a temporary ID if it doesn't have one
      if (!(payload as unknown as ItemWithId).id) {
        tempItemId = generateTempId();
        tempItem = { ...payload, id: tempItemId } as TData;
      } else {
        tempItem = payload as TData; // Assume payload is sufficiently TData-like
      }
      optimisticData = [...originalData, tempItem] as TData;
    } else {
      // For single item, payload becomes the temp item. If it needs an ID, it should be there or server assigned.
      // If the model holds a single item, optimistic update replaces it.
      // Server will return the full item with ID.
      if (!(payload as unknown as ItemWithId).id) {
        tempItemId = generateTempId(); // Useful if we need to confirm replacement
        tempItem = { ...payload, id: tempItemId } as TData;
      } else {
        tempItem = payload as TData;
      }
      optimisticData = tempItem;
    }
    this.setData(optimisticData);

    try {
      const createdItem = (await this.executeApiRequest(
        this.getUrl(),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload), // Send original payload without tempId
        },
        "single"
      )) as TData; // Assuming TData is the type of a single item

      // Success: Update data with server response
      const currentDataAfterRequest = this._data$.getValue();
      if (Array.isArray(currentDataAfterRequest)) {
        this.setData(
          currentDataAfterRequest.map((item: any) =>
            (tempItemId && item.id === tempItemId) || item === tempItem // Reference check if no tempId was used
              ? createdItem
              : // Fallback: if payload had an ID, and server confirms it (or changes it)
              // This part is tricky if server can change ID that client sent in payload.
              // For now, tempId match is primary for arrays.
              (payload as unknown as ItemWithId).id &&
                item.id === (payload as unknown as ItemWithId).id &&
                tempItemId === null
              ? createdItem
              : item
          ) as TData
        );
      } else {
        // For single item, or if array was cleared and set to single due to other ops
        this.setData(createdItem);
      }
      return createdItem;
    } catch (error) {
      // Failure: Revert to original data
      this.setData(originalData);
      // Error already set by executeApiRequest, re-throw if needed by caller
      throw error;
    }
  }

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
  public async update(
    id: string,
    payload: Partial<TData>
  ): Promise<TData | undefined> {
    const originalData = this._data$.getValue();
    let itemToUpdateOriginal: TData | undefined;
    let optimisticData: TData | null = null;

    if (Array.isArray(originalData)) {
      itemToUpdateOriginal = originalData.find(
        (item: any) => item.id === id
      ) as TData | undefined;
      if (!itemToUpdateOriginal) {
        // Item not found, perhaps throw an error or handle as per requirements
        console.error(`Item with id ${id} not found for update.`);
        throw new Error(`Item with id ${id} not found for update.`);
      }
      const optimisticallyUpdatedItem = { ...itemToUpdateOriginal, ...payload };
      optimisticData = originalData.map((item: any) =>
        item.id === id ? optimisticallyUpdatedItem : item
      ) as TData;
    } else if (originalData && (originalData as any).id === id) {
      itemToUpdateOriginal = originalData;
      optimisticData = { ...originalData, ...payload } as TData;
    } else {
      console.error(
        `Item with id ${id} not found for update in single data mode.`
      );
      throw new Error(
        `Item with id ${id} not found for update in single data mode.`
      );
    }

    if (itemToUpdateOriginal === undefined) {
      // Should be caught by earlier checks
      this.setError(new Error(`Update failed: Item with id ${id} not found.`));
      throw this._error$.getValue();
    }

    this.setData(optimisticData);

    try {
      const updatedItemFromServer = (await this.executeApiRequest(
        this.getUrl(id),
        {
          method: "PUT", // Or 'PATCH'
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload), // Send only the payload
        },
        "single"
      )) as TData;

      // Success: Update data with server response (if different from optimistic)
      // This step is important if server returns additional fields like updatedAt
      const currentDataAfterRequest = this._data$.getValue();
      if (Array.isArray(currentDataAfterRequest)) {
        this.setData(
          currentDataAfterRequest.map((item: any) =>
            item.id === id ? updatedItemFromServer : item
          ) as TData
        );
      } else if (
        currentDataAfterRequest &&
        (currentDataAfterRequest as any).id === id
      ) {
        this.setData(updatedItemFromServer);
      }
      return updatedItemFromServer;
    } catch (error) {
      // Failure: Revert to original data state before optimistic update
      if (Array.isArray(originalData) && itemToUpdateOriginal) {
        this.setData(
          originalData.map((item: any) =>
            item.id === id ? itemToUpdateOriginal : item
          ) as TData
        );
      } else if (
        originalData &&
        (originalData as any).id === id &&
        itemToUpdateOriginal
      ) {
        this.setData(itemToUpdateOriginal);
      } else {
        // Fallback to full original data if specific item cannot be restored
        this.setData(originalData);
      }
      throw error;
    }
  }

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
  public async delete(id: string): Promise<void> {
    const originalData = this._data$.getValue();
    let itemWasDeleted = false;

    if (Array.isArray(originalData)) {
      const dataAfterOptimisticDelete = originalData.filter(
        (item: any) => item.id !== id
      );
      if (dataAfterOptimisticDelete.length < originalData.length) {
        this.setData(dataAfterOptimisticDelete as TData);
        itemWasDeleted = true;
      }
    } else if (originalData && (originalData as any).id === id) {
      this.setData(null);
      itemWasDeleted = true;
    }

    if (!itemWasDeleted) {
      // Item not found for deletion, could be an error or just a no-op.
      // For now, let's assume it's not an error to try to delete a non-existent item.
      // If it were an error, we'd throw here.
      return;
    }

    try {
      await this.executeApiRequest(
        this.getUrl(id),
        { method: "DELETE" },
        "none"
      );
      // Success: Optimistic update is already the final state.
    } catch (error) {
      // Failure: Revert to original data
      this.setData(originalData);
      throw error;
    }
  }

  // Ensure BaseModel's dispose is called if RestfulApiModel overrides it
  // For now, no additional subscriptions are made in RestfulApiModel itself
  // that aren't handled by BaseModel's subjects or executeApiRequest's lifecycle.
  // If RestfulApiModel were to, for instance, subscribe to an external observable
  // for configuration, that subscription would need cleanup here.
  /**
   * Cleans up resources used by the RestfulApiModel.
   * This method primarily calls `super.dispose()` to ensure that the observables
   * inherited from `BaseModel` (`data$`, `isLoading$`, `error$`) are completed.
   * Any RestfulApiModel-specific resources, such as pending API request cancellation logic
   * (if the `fetcher` supported it), would be handled here in the future.
   */
  public dispose(): void {
    super.dispose(); // Call if BaseModel has a dispose method
    // Add any RestfulApiModel specific cleanup here if needed in the future
    // e.g., cancelling ongoing fetch requests if the fetcher supported it.
  }
}

// Ensure IDisposable is re-exported or handled if BaseModel exports it
// and RestfulApiModel is intended to be disposable in the same way.
// This depends on whether BaseModel itself implements IDisposable.
// From previous context, BaseModel does implement IDisposable.
export interface IRestfulApiModel<TData, TSchema extends ZodSchema<TData>>
  extends BaseModel<TData, TSchema> {
  // This implies it also extends IDisposable
  // Define any additional public methods specific to RestfulApiModel if needed for the interface
  fetch(id?: string | string[]): Promise<void>;
  create(payload: Partial<TData>): Promise<TData | undefined>;
  update(id: string, payload: Partial<TData>): Promise<TData | undefined>;
  delete(id: string): Promise<void>;
}

<!-- RestfulApiViewModel -->

// src/viewmodels/RestfulApiViewModel.ts
import { BehaviorSubject, combineLatest, Observable } from "rxjs";
import { map, startWith } from "rxjs/operators";
import { RestfulApiModel } from "../models/RestfulApiModel";
import { Command } from "../commands/Command"; // Assuming Command is in '../commands'
import { ZodSchema } from "zod";

// Helper type to check if TData is an array and extract item type
type ItemWithId = { id: string; [key: string]: any };
type ExtractItemType<T> = T extends (infer U)[] ? U : T;

/**
 * @class RestfulApiViewModel
 * A generic ViewModel to facilitate CRUD operations and state management for a specific
 * RestfulApiModel. It exposes data, loading states, and operations as observables and commands,
 * making it easy to consume in frontend frameworks.
 * @template TData The type of data managed by the underlying RestfulApiModel (e.g., User, User[]).
 * @template TSchema The Zod schema type for validating the data.
 */
export class RestfulApiViewModel<TData, TSchema extends ZodSchema<TData>> {
  protected model: RestfulApiModel<TData, TSchema>;

  /**
   * Exposes the current data from the RestfulApiModel.
   * Use this in your UI to bind to the list or single item.
   */
  public readonly data$: Observable<TData | null>;

  /**
   * Exposes the loading state of the RestfulApiModel.
   * Use this to show spinners or disable UI elements.
   */
  public readonly isLoading$: Observable<boolean>;

  /**
   * Exposes any error encountered by the RestfulApiModel.
   * Use this to display error messages to the user.
   */
  public readonly error$: Observable<any>;

  // Commands for CRUD operations
  public readonly fetchCommand: Command<string | string[] | void, void>;
  public readonly createCommand: Command<Partial<TData>, void>;
  public readonly updateCommand: Command<
    { id: string; payload: Partial<TData> },
    void
  >;
  public readonly deleteCommand: Command<string, void>;

  // Optional: Example of view-specific state for a collection
  // If TData is an array, you might want to manage selections, filters, etc.
  // This example assumes TData can be an array where items have an 'id'
  public readonly selectedItem$: Observable<ExtractItemType<TData> | null>;
  protected readonly _selectedItemId$ = new BehaviorSubject<string | null>(
    null
  );

  /**
   * @param model An instance of RestfulApiModel that this ViewModel will manage.
   */
  constructor(model: RestfulApiModel<TData, TSchema>) {
    if (!(model instanceof RestfulApiModel)) {
      throw new Error(
        "RestfulApiViewModel requires an instance of RestfulApiModel."
      );
    }
    this.model = model;

    this.data$ = this.model.data$;
    this.isLoading$ = this.model.isLoading$;
    this.error$ = this.model.error$;

    // Initialize Commands
    /** Look into issue with TypeScript:
     * Type 'string | void | string[]' is not assignable to type 'string | string[] | undefined'.
    Type 'void' is not assignable to type 'string | string[] | undefined'.
     */
    this.fetchCommand = new Command(async (id: string | string[] | void) => {
      // void parameter implies undefined
      const ids = Array.isArray(id) ? id : id ? [id] : undefined;
      await this.model.fetch(ids);
    });

    this.createCommand = new Command(async (payload: Partial<TData>) => {
      await this.model.create(payload);
    });

    this.updateCommand = new Command(async ({ id, payload }) => {
      await this.model.update(id, payload);
    });

    this.deleteCommand = new Command(async (id: string) => {
      await this.model.delete(id);
    });

    // Example for selected item (assumes TData is an array of objects with 'id')
    this.selectedItem$ = combineLatest([
      this.model.data$, // Use model.data$ directly for clarity
      this._selectedItemId$,
    ]).pipe(
      map(([data, selectedId]) => {
        if (Array.isArray(data) && selectedId) {
          // Type guard to ensure items have an 'id' property of type string
          const itemWithId = data.find((item: unknown): item is ItemWithId => {
            return (
              typeof item === "object" &&
              item !== null &&
              "id" in item &&
              typeof (item as any).id === "string" &&
              (item as any).id === selectedId
            );
          });
          return (itemWithId as ExtractItemType<TData>) || null;
        }
        return null;
      }),
      startWith(null) // Ensure initial value
    );
    // Note: No explicit subscription to this.selectedItem$ is made *within* this class,
    // so _selectedItemSubscription is not used for this specific observable.
    // It's declared for good practice if other internal subscriptions were needed.
  }

  /**
   * Selects an item by its ID. Useful for showing details or for editing.
   * This is only meaningful if TData is an array of items with an 'id' property.
   * @param id The ID of the item to select. Pass null to clear selection.
   */
  public selectItem(id: string | null): void {
    this._selectedItemId$.next(id);
  }

  /**
   * Disposes of resources held by the ViewModel.
   * This includes disposing of the underlying model and any commands.
   */
  public dispose(): void {
    this.model.dispose();
    this.fetchCommand.dispose();
    this.createCommand.dispose();
    this.updateCommand.dispose();
    this.deleteCommand.dispose();
    this._selectedItemId$.complete(); // Complete the subject

    // If _selectedItemSubscription was used for an internal subscription:
    // if (this._selectedItemSubscription) {
    //   this._selectedItemSubscription.unsubscribe();
    // }
  }
}
```
