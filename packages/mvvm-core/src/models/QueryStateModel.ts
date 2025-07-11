import { ZodSchema } from 'zod';
import { BaseModel, IBaseModel } from './BaseModel';
import { EndpointState, QueryCore } from '@web-loom/query-core'; // Assuming QueryCore is available via this path
import { IStore, State } from './Store'; // Import IStore

// Helper type to extract the underlying type if T is an array, otherwise returns T
export type ExtractItemType<T> = T extends (infer U)[] ? U : T;

export interface IQueryStateModel<
  TData,
  TSchema extends ZodSchema<TData>,
  S extends State = State, // Allow specifying a more specific store state type
> extends IBaseModel<TData, TSchema> {
  // Define specific methods for QueryStateModel if they differ from BaseModel
  // or if new public methods are introduced.
  // For now, it will rely on QueryCore for most operations.
  // We might need a manual refetch trigger.
  refetch(refetchFlag?: boolean): Promise<void>;
  invalidate(): Promise<void>;
  store?: IStore<S>; // Expose the optional store instance
}

export type TQueryStateModelConstructor<
  TData,
  TSchema extends ZodSchema<TData>,
  S extends State = State, // Allow specifying a more specific store state type
> = {
  queryCore: QueryCore;
  endpointKey: string;
  schema: TSchema; // Zod schema for validating TData. If TData is an array, this schema should validate the array (e.g., z.array(itemSchema)).
  initialData?: TData | null; // Initial data can still be useful for optimistic updates or seeding
  // fetcherFn is needed if QueryCore endpoint isn't predefined with a fetcher
  fetcherFn?: () => Promise<TData>;
  // Default refetchAfter for this specific endpoint, if not globally configured in QueryCore
  refetchAfter?: number;
  store?: IStore<S>; // Optional generic store instance
};

/**
 * @class QueryStateModel
 * Extends BaseModel to provide capabilities for interacting with data sources
 * managed by QueryCore. It handles data, loading states, and errors based on
 * QueryCore's state management and caching. It can also expose an optional generic store.
 * @template TData The type of data managed by the model (e.g., User, User[]).
 * @template TSchema The Zod schema type for validating the data.
 * @template S The specific type of the state managed by the optional store.
 */
export class QueryStateModel<
    TData,
    TSchema extends ZodSchema<TData>,
    S extends State = State, // Default S to State
  >
  extends BaseModel<TData, TSchema>
  implements IQueryStateModel<TData, TSchema, S>
{
  private queryCore: QueryCore;
  private endpointKey: string;
  private querySubscription: (() => void) | null = null; // Unsubscribe function from QueryCore
  public store?: IStore<S>; // Publicly expose the store

  /**
   * @param queryCore An instance of QueryCore.
   * @param endpointKey A unique key for the data endpoint in QueryCore.
   * @param schema The Zod schema for validating individual items of the data.
   * @param initialData Optional initial data.
   * @param fetcherFn Optional fetcher function if the endpoint needs to be defined.
   * @param refetchAfter Optional refetch interval for this endpoint.
   * @param store Optional generic store instance.
   */
  constructor(input: TQueryStateModelConstructor<TData, TSchema, S>) {
    super({ initialData: input.initialData ?? null, schema: input.schema });

    this.queryCore = input.queryCore;
    this.endpointKey = input.endpointKey;
    this.store = input.store; // Assign the store if provided

    // Define the endpoint if a fetcher function is provided.
    // This allows the model to be self-contained in defining its data source
    // if not already managed externally by QueryCore.
    if (input.fetcherFn) {
      // Check if endpoint already exists to avoid overwriting with potentially different options.
      // QueryCore itself warns on re-definition.
      // A "pristine" state from QueryCore for an unknown key has undefined data, no error, not loading, and no lastUpdated.
      const existingState = this.queryCore.getState<TData>(this.endpointKey);
      if (
        existingState.data === undefined &&
        !existingState.isLoading &&
        !existingState.isError &&
        !existingState.lastUpdated
      ) {
        // This suggests the endpoint hasn't been successfully fetched or defined with initial data through QueryCore yet.
        this.queryCore
          .defineEndpoint<TData>(this.endpointKey, input.fetcherFn, { refetchAfter: input.refetchAfter })
          .catch((err) => {
            console.error(`Failed to define endpoint ${this.endpointKey}:`, err);
            this.setError(err);
          });
      }
    }
    this.subscribeToQueryChanges();
  }

  private subscribeToQueryChanges(): void {
    if (this.querySubscription) {
      this.querySubscription(); // Unsubscribe from previous if any
    }

    this.querySubscription = this.queryCore.subscribe<TData>(this.endpointKey, (state: EndpointState<TData>) => {
      this.setLoading(state.isLoading);
      if (state.isError && state.error) {
        this.setError(state.error);
        // Optionally, clear data on error or keep stale data:
        // this.setData(null);
      } else if (state.data !== undefined) {
        // queryCore should provide data that is already validated if schema is part of its fetcher.
        // However, if we want to re-validate or if QueryCore doesn't validate, do it here.
        // For now, assume QueryCore's data is what we set.
        // If schema validation is needed here:
        // try {
        //   const validatedData = this.schema.parse(state.data); // Or z.array(this.schema).parse(state.data)
        //   this.setData(validatedData);
        //   this.clearError();
        // } catch (validationError) {
        //   this.setError(validationError);
        //   this.setData(null); // Or keep stale data
        // }
        this.setData(state.data);
        if (!state.isError) this.clearError(); // Clear error if data is successfully set
      } else if (!state.isLoading && !state.isError && state.data === undefined) {
        // Explicitly handle when data is undefined (e.g. after invalidation or if initial state is undefined)
        this.setData(null); // Pass undefined, not null
        if (!state.isError) this.clearError();
      }
      // If state.data is undefined but it's loading or an error state, those are handled by setLoading/setError.
      // No explicit setData(null) is needed for those cases unless desired.
    });
  }

  /**
   * Triggers a refetch of the data for this endpoint via QueryCore.
   * @param force Optional, whether to force a refetch ignoring `refetchAfter` settings.
   */
  public async refetch(force: boolean = false): Promise<void> {
    try {
      await this.queryCore.refetch<TData>(this.endpointKey, force);
    } catch (error) {
      // QueryCore's refetch internally handles setting its state (error, isLoading).
      // The subscription will pick up these changes.
      // We might want to log this or handle specific UI feedback if needed directly.
      console.error(`Error during refetch for ${this.endpointKey}:`, error);
      // The error should be propagated via the subscription, so no direct setError here.
    }
  }

  /**
   * Invalidates the cached data for this endpoint in QueryCore.
   * This will typically clear the data and may trigger a refetch on next subscription
   * or manual refetch, depending on QueryCore's configuration.
   */
  public async invalidate(): Promise<void> {
    try {
      await this.queryCore.invalidate(this.endpointKey);
      // After invalidation, QueryCore state will update, and subscription will reflect it.
      // This might mean data becomes undefined/null.
    } catch (error) {
      console.error(`Error during cache invalidation for ${this.endpointKey}:`, error);
      this.setError(error); // Set error if invalidation itself fails critically
    }
  }

  /**
   * The create, update, and delete operations for a cached model fundamentally
   * differ from a traditional RESTful model. They primarily involve:
   * 1. Making an API call (often via a custom function passed to QueryCore or a separate service).
   * 2. Upon success, invalidating or refetching the relevant QueryCore query to ensure the cache is updated.
   *
   * QueryCore itself is read-focused. Mutations are typically handled outside QueryCore's direct responsibility,
   * with QueryCore then being told to update its cache (e.g., via refetch or invalidate).
   *
   * For this generic QueryStateModel, we cannot assume how mutations are performed.
   * The consumer of this model would typically:
   * - Call their own API service for CUD operations.
   * - Then call `this.model.refetch()` or `this.model.invalidate()` on this model instance.
   *
   * If optimistic updates are desired, they would be managed by the calling code or a ViewModel,
   * potentially by directly manipulating QueryCore's cache if QueryCore exposes such APIs,
   * or by managing local temporary state until the refetch/invalidation confirms the change.
   *
   * Placeholder methods are provided. In a real-world scenario, these might take a callback
   * to perform the mutation, then automatically handle cache updates.
   */

  // Example:
  // public async createItem(itemData: Partial<ExtractItemType<TData>>, mutationFn: (data: Partial<ExtractItemType<TData>>) => Promise<ExtractItemType<TData>>): Promise<ExtractItemType<TData>> {
  //   this.setLoading(true);
  //   try {
  //     const newItem = await mutationFn(itemData);
  //     await this.refetch(true); // Force refetch after creation
  //     return newItem;
  //   } catch (error) {
  //     this.setError(error);
  //     throw error;
  //   } finally {
  //     this.setLoading(false);
  //   }
  // }
  // Similar for updateItem, deleteItem.

  /**
   * Disposes of resources held by the model, primarily unsubscribing from QueryCore.
   */
  public dispose(): void {
    if (this.querySubscription) {
      this.querySubscription();
      this.querySubscription = null;
    }
    super.dispose(); // Completes the BehaviorSubjects in BaseModel
  }
}
