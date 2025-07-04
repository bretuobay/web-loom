import { ZodSchema, z } from 'zod';
import { BaseModel } from './BaseModel';
import { EndpointState, QueryCore } from '@web-loom/query-core'; // Assuming QueryCore is available as a package

// Helper for temporary ID generation (can be shared if used elsewhere)
const tempIdPrefix = 'temp_';
function generateTempId(): string {
  return `${tempIdPrefix}${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// Helper to manage item with ID (can be shared)
interface ItemWithId {
  id: string;
  [key: string]: any;
}

// Helper type to extract the underlying type if T is an array, otherwise returns T
export type ExtractItemType<T> = T extends (infer U)[] ? U : T;

export type TCachedConstructorInput<TData, TSchema extends ZodSchema<TData>> = {
  queryCore: QueryCore;
  endpointKey: string; // Unique key for QueryCore to identify this data source
  schema: TSchema;
  initialData?: TData | null; // Optional initial data, QueryCore might hydrate this
  // baseUrl and endpoint might still be needed for constructing specific URLs for CUD operations
  // if QueryCore's fetcher is generic and needs the full URL.
  // However, the primary fetch will be via queryCore.
  // For CUD, we might need a separate mechanism or assume QueryCore handles it via specific fetchers.
  // Let's assume for now that CUD operations also go through QueryCore or a configured fetcher within it.
  // If direct fetch calls are needed for CUD, fetcher and baseUrl/endpoint would be required.
  // For this iteration, we'll focus on QueryCore for data retrieval.
  // CUD operations will need careful consideration on how they interact with QueryCore's caching.
  // A simple approach is to have dedicated fetcher functions for CUD operations
  // that QueryCore can call, or the model calls directly and then invalidates QueryCore's cache.

  // For CUD operations that are not directly handled by a generic QueryCore query:
  fetcher?: <TResponse = any>(url: string, options?: RequestInit) => Promise<TResponse>; // For CUD
  baseUrl?: string; // For CUD
  endpoint?: string; // For CUD (e.g., 'users')
  validateSchema?: boolean;
};

/**
 * @class CachedRestfulApiModel
 * Extends BaseModel to provide capabilities for interacting with data sources via QueryCore.
 * It manages data, loading states, and errors, leveraging QueryCore for caching and data fetching.
 * @template TData The type of data managed by the model (e.g., User, User[]).
 * @template TSchema The Zod schema type for validating the data.
 */
export class CachedRestfulApiModel<TData, TSchema extends ZodSchema<TData>> extends BaseModel<TData, TSchema> {
  private readonly queryCore: QueryCore;
  private readonly endpointKey: string;
  private readonly _shouldValidateSchema: boolean;

  // Optional members for CUD operations if not handled by QueryCore's primary query
  private readonly fetcher?: <TResponse = any>(url: string, options?: RequestInit) => Promise<TResponse>;
  private readonly baseUrl?: string;
  private readonly endpoint?: string;

  private unsubscribeFromQueryCore?: () => void;

  constructor(input: TCachedConstructorInput<TData, TSchema>) {
    const { queryCore, endpointKey, schema, initialData, fetcher, baseUrl, endpoint, validateSchema } = input;
    super({ initialData: initialData || null, schema });

    if (!queryCore || !endpointKey) {
      throw new Error('CachedRestfulApiModel requires queryCore and endpointKey.');
    }
    this.queryCore = queryCore;
    this.endpointKey = endpointKey;
    this._shouldValidateSchema = validateSchema === undefined ? true : validateSchema;

    // Store CUD related properties if provided
    if (fetcher && baseUrl && endpoint) {
      this.fetcher = fetcher;
      this.baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
      this.endpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    } else if (fetcher || baseUrl || endpoint) {
      // If some CUD params are provided but not all, it's a configuration issue.
      console.warn(
        'CachedRestfulApiModel: For CUD operations, fetcher, baseUrl, and endpoint must all be provided if one is provided. CUD operations might not work as expected.',
      );
    }

    this.subscribeToQueryCore();
  }

  private subscribeToQueryCore(): void {
    // Unsubscribe from any previous subscription
    if (this.unsubscribeFromQueryCore) {
      this.unsubscribeFromQueryCore();
    }

    this.unsubscribeFromQueryCore = this.queryCore.subscribe<TData>(this.endpointKey, (state: EndpointState<TData>) => {
      this.setLoading(state.isLoading);
      if (state.isError) {
        this.setError(state.error);
      } else {
        this.clearError(); // Clear error if current state is not error
      }

      if (state.data !== undefined) {
        if (this._shouldValidateSchema && this.schema) {
          try {
            const validatedData = this.schema.parse(state.data);
            this.setData(validatedData);
          } catch (validationError) {
            this.setError(validationError);
            // Potentially set data to null or keep stale data, depending on desired behavior
            // For now, we set an error and the data might remain stale or become undefined.
          }
        } else {
          this.setData(state.data);
        }
      } else if (!state.isLoading && !state.isError) {
        // If data is undefined, not loading, and no error, it implies empty or no data.
        // This could be initial state or after an invalidation.
        // BaseModel's setData(null) handles this.
        this.setData(null);
      }
      // If state.data is undefined but it's loading or error, data$ shouldn't be nulled out
      // as it might hold stale data that's preferred over null during loading/error.
      // BaseModel's setData handles the BehaviorSubject update.
    });

    // Optionally, trigger an initial fetch if the data is stale or not present,
    // QueryCore's subscribe method itself might handle this based on its internal logic.
    // If QueryCore's subscribe doesn't auto-fetch, we might need:
    // this.queryCore.refetch(this.endpointKey);
    // However, QueryCore's design is that subscription itself triggers fetch if stale/empty.
  }

  /**
   * Initiates a data fetch (or refetch) using QueryCore.
   * QueryCore handles the actual fetching, caching, and state updates.
   * This model subscribes to QueryCore's state updates.
   * @param forceRefetch Optionally force QueryCore to refetch regardless of cache status.
   */
  public async query(forceRefetch = false): Promise<void> {
    try {
      // setLoading and clearError will be handled by the QueryCore subscription callback
      await this.queryCore.refetch(this.endpointKey, forceRefetch);
      // The actual data update, loading, and error states are managed via the subscription to QueryCore.
    } catch (error) {
      // This catch block might be redundant if QueryCore's refetch itself doesn't throw
      // but rather updates its state with the error, which our subscription picks up.
      // If QueryCore.refetch can throw for reasons other than data fetching issues (e.g., config error),
      // then this catch is relevant.
      this.setError(error); // Ensure model's error state is set.
      throw error; // Re-throw to allow caller to handle
    }
  }

  private getCudUrl(id?: string): string {
    if (!this.baseUrl || !this.endpoint) {
      throw new Error('CUD operations require baseUrl and endpoint to be configured.');
    }
    if (id) {
      return `${this.baseUrl}/${this.endpoint}/${id}`;
    }
    return `${this.baseUrl}/${this.endpoint}`;
  }

  // CUD operations:
  // These will perform direct API calls and then interact with QueryCore
  // to ensure cache consistency (e.g., by invalidating or updating the cache).

  /**
   * Creates a new resource.
   * After a successful creation, it invalidates the QueryCore cache for this endpointKey
   * to ensure fresh data is fetched on the next query.
   * Optimistic updates can be implemented similarly to RestfulApiModel if desired.
   * @param payload The data for the new resource.
   * @returns A promise that resolves with the created item.
   */
  public async create(
    payload: Partial<ExtractItemType<TData>> | Partial<ExtractItemType<TData>>[],
  ): Promise<ExtractItemType<TData> | ExtractItemType<TData>[] | undefined> {
    if (!this.fetcher) {
      throw new Error('Fetcher not configured for CUD operations.');
    }
    this.setLoading(true);
    this.clearError();

    // Basic implementation without optimistic updates for now.
    // For optimistic updates, refer to RestfulApiModel's create method.
    try {
      const isPayloadArray = Array.isArray(payload);
      let result: ExtractItemType<TData> | ExtractItemType<TData>[] | undefined;

      if (isPayloadArray) {
        const results = await Promise.all(
          (payload as Partial<ExtractItemType<TData>>[]).map((item) =>
            this.fetcher!(this.getCudUrl(), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(item),
            }),
          ),
        );
        // Assuming the fetcher returns the created item(s) parsed.
        // And schema validation for the response.
        result = this._shouldValidateSchema
          ? z.array(this.schema.element ? (this.schema as z.ZodArray<any>).element : this.schema).parse(results) // Heuristic
          : results;
      } else {
        const singleResult = await this.fetcher!(this.getCudUrl(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        result = this._shouldValidateSchema
          ? (this.schema.element ? (this.schema as z.ZodArray<any>).element : this.schema).parse(singleResult) // Heuristic
          : singleResult;
      }

      await this.queryCore.invalidate(this.endpointKey); // Invalidate cache
      await this.queryCore.refetch(this.endpointKey, true); // Refetch to update the model's data via subscription
      return result;
    } catch (err) {
      this.setError(err);
      throw err;
    } finally {
      this.setLoading(false); // Handled by queryCore subscription eventually, but good for immediate feedback
    }
  }

  /**
   * Updates an existing resource.
   * After a successful update, it invalidates the QueryCore cache for this endpointKey.
   * @param id The ID of the resource to update.
   * @param payload The partial data to update the resource with.
   * @returns A promise that resolves with the updated item.
   */
  public async update(
    id: string,
    payload: Partial<ExtractItemType<TData>>,
  ): Promise<ExtractItemType<TData> | undefined> {
    if (!this.fetcher) {
      throw new Error('Fetcher not configured for CUD operations.');
    }
    this.setLoading(true);
    this.clearError();
    try {
      const result = await this.fetcher!(this.getCudUrl(id), {
        method: 'PUT', // Or 'PATCH'
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const validatedResult = this._shouldValidateSchema
        ? (this.schema.element ? (this.schema as z.ZodArray<any>).element : this.schema).parse(result) // Heuristic
        : result;

      await this.queryCore.invalidate(this.endpointKey);
      await this.queryCore.refetch(this.endpointKey, true);
      return validatedResult;
    } catch (err) {
      this.setError(err);
      throw err;
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Deletes a resource.
   * After a successful deletion, it invalidates the QueryCore cache for this endpointKey.
   * @param id The ID of the resource to delete.
   * @returns A promise that resolves when the deletion is complete.
   */
  public async delete(id: string): Promise<void> {
    if (!this.fetcher) {
      throw new Error('Fetcher not configured for CUD operations.');
    }
    this.setLoading(true);
    this.clearError();
    try {
      await this.fetcher!(this.getCudUrl(id), { method: 'DELETE' });
      await this.queryCore.invalidate(this.endpointKey);
      await this.queryCore.refetch(this.endpointKey, true);
    } catch (err) {
      this.setError(err);
      throw err;
    } finally {
      this.setLoading(false);
    }
  }

  public dispose(): void {
    if (this.unsubscribeFromQueryCore) {
      this.unsubscribeFromQueryCore();
      this.unsubscribeFromQueryCore = undefined;
    }
    super.dispose();
  }
}

// Interface for CachedRestfulApiModel
export interface ICachedRestfulApiModel<TData, TSchema extends ZodSchema<TData>> extends BaseModel<TData, TSchema> {
  query(forceRefetch?: boolean): Promise<void>;
  create(
    payload: Partial<ExtractItemType<TData>> | Partial<ExtractItemType<TData>>[],
  ): Promise<ExtractItemType<TData> | ExtractItemType<TData>[] | undefined>;
  update(id: string, payload: Partial<ExtractItemType<TData>>): Promise<ExtractItemType<TData> | undefined>;
  delete(id: string): Promise<void>;
}
