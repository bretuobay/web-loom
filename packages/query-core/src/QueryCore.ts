import { CacheProvider } from './cacheProviders/CacheProvider';
import { LocalStorageCacheProvider } from './cacheProviders/LocalStorageCacheProvider';
import { IndexedDBCacheProvider } from './cacheProviders/IndexedDBCacheProvider';
import { InMemoryCacheProvider } from './cacheProviders/InMemoryCacheProvider'; // Added import

// --- Core Library Interface ---

export interface QueryCoreOptions {
  cacheProvider?: 'localStorage' | 'indexedDB' | 'inMemory' | CacheProvider; // Allow custom provider instance
  defaultRefetchAfter?: number; // Global default for refetchAfter
}

export interface EndpointOptions {
  refetchAfter?: number; // in milliseconds
  cacheProvider?: 'localStorage' | 'indexedDB' | 'inMemory' | CacheProvider; // Override global cache provider
}

export interface EndpointState<TData> {
  data: TData | undefined;
  isLoading: boolean;
  isError: boolean;
  error: any | undefined;
  lastUpdated: number | undefined; // Timestamp of when data was last successfully fetched and cached
}

// Internal interface for storing endpoint details
interface Endpoint<TData = any> {
  fetcher: () => Promise<TData>;
  options: EndpointOptions; // Effective options for this endpoint
  state: EndpointState<TData>;
  subscribers: Set<(state: EndpointState<TData>) => void>;
  cache: CacheProvider; // Cache provider instance for this endpoint
}

class QueryCore {
  private globalOptions: QueryCoreOptions;
  private endpoints: Map<string, Endpoint<any>>;

  constructor(options?: QueryCoreOptions) {
    this.globalOptions = {
      cacheProvider: 'inMemory', // Default cache provider type
      defaultRefetchAfter: undefined, // No global refetchAfter by default
      ...options,
    };
    this.endpoints = new Map();

    // Bind methods to ensure 'this' context is correct
    this.defineEndpoint = this.defineEndpoint.bind(this);
    this.subscribe = this.subscribe.bind(this);
    this.refetch = this.refetch.bind(this);
    this.invalidate = this.invalidate.bind(this);
    this.getState = this.getState.bind(this);
    this._updateStateAndNotify = this._updateStateAndNotify.bind(this);
    this._getCacheProvider = this._getCacheProvider.bind(this);
    this._handleVisibilityChange = this._handleVisibilityChange.bind(this);
    this._handleOnlineStatus = this._handleOnlineStatus.bind(this);
    this._setupGlobalEventListeners = this._setupGlobalEventListeners.bind(this);

    this._setupGlobalEventListeners();
  }

  private _setupGlobalEventListeners(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('visibilitychange', this._handleVisibilityChange);
      window.addEventListener('online', this._handleOnlineStatus);
      // No need to listen to 'offline' specifically to act, only when it comes back 'online'
    }
  }

  private _handleVisibilityChange(): void {
    if (document.visibilityState === 'visible') {
      console.log('QueryCore: Window focused. Refetching observed stale queries.');
      this.endpoints.forEach((endpoint, key) => {
        if (endpoint.subscribers.size > 0) {
          // Only refetch if observed
          // forceRefetch = false to respect refetchAfter
          this.refetch(key, false);
        }
      });
    }
  }

  private _handleOnlineStatus(): void {
    console.log('QueryCore: Network connection restored. Refetching observed stale queries.');
    this.endpoints.forEach((endpoint, key) => {
      if (endpoint.subscribers.size > 0) {
        // Only refetch if observed
        // forceRefetch = true because network was just restored, data might be stale regardless of timer
        this.refetch(key, true);
      }
    });
  }

  private _getCacheProvider(
    providerOption: 'localStorage' | 'indexedDB' | 'inMemory' | CacheProvider | undefined,
  ): CacheProvider {
    if (typeof providerOption === 'object') {
      return providerOption; // User provided a custom cache provider instance
    }
    if (providerOption === 'indexedDB') {
      return new IndexedDBCacheProvider();
    }
    if (providerOption === 'localStorage') {
      return new LocalStorageCacheProvider();
    }
    // Default to InMemoryCacheProvider if 'inMemory' or undefined (or any other string not matched)
    return new InMemoryCacheProvider();
  }

  /**
   * Defines and configures an endpoint.
   * This method is now async due to cache interactions.
   */
  public async defineEndpoint<TData>(
    endpointKey: string,
    fetcher: () => Promise<TData>,
    options: EndpointOptions = {}, // Default to empty object
  ): Promise<void> {
    if (this.endpoints.has(endpointKey)) {
      console.warn(
        `QueryCore: Endpoint with key "${endpointKey}" is already defined. Overwriting existing definition.`,
      );
    }

    const effectiveOptions: EndpointOptions = {
      refetchAfter: this.globalOptions.defaultRefetchAfter,
      ...options, // Endpoint-specific options override global defaults
    };

    const cacheProviderType = effectiveOptions.cacheProvider || this.globalOptions.cacheProvider;
    const cache = this._getCacheProvider(cacheProviderType);

    // Attempt to load initial data from cache
    const cachedItem = await cache.get<TData>(endpointKey); // Await the async cache get
    const initialEndpointState: EndpointState<TData> = {
      data: cachedItem?.data,
      isLoading: false, // Should not be loading initially from cache
      isError: false,
      error: undefined,
      lastUpdated: cachedItem?.lastUpdated,
    };

    this.endpoints.set(endpointKey, {
      fetcher,
      options: effectiveOptions,
      state: initialEndpointState,
      subscribers: new Set(),
      cache: cache,
    });
    console.log(
      `QueryCore: Endpoint "${endpointKey}" defined. Initial state loaded from cache (if available). Options:`,
      effectiveOptions,
    );

    // Trigger an immediate state notification for subscribers who might have been added
    // before defineEndpoint completed (if that scenario is possible, though unlikely with current API).
    // More importantly, this ensures that any component subscribing immediately after definition gets the cached state.
    this._updateStateAndNotify(endpointKey, {}); // Notify with current state

    // TODO: Add logic here or in subscribe to automatically refetch if data is stale or missing,
    // based on refetchAfter and lastUpdated. This will be part of "Automatic Refetching".
  }

  // Centralized state update and notification
  private _updateStateAndNotify<TData>(endpointKey: string, partialState: Partial<EndpointState<TData>>): void {
    const endpoint = this.endpoints.get(endpointKey) as Endpoint<TData> | undefined;
    if (endpoint) {
      endpoint.state = { ...endpoint.state, ...partialState };
      // Create a copy of the state for subscribers, with a deep copy for 'data'
      const stateForSubscriber = { ...endpoint.state };
      if (stateForSubscriber.data !== undefined) {
        try {
          stateForSubscriber.data = structuredClone(stateForSubscriber.data);
        } catch (e) {
          // Fallback or specific handling if structuredClone fails (e.g. for non-cloneable types)
          console.warn(
            `QueryCore: Could not structured-clone data for endpoint ${endpointKey}. Subscribers will get a shallow copy of data.`,
            e,
          );
        }
      }
      endpoint.subscribers.forEach((callback) => callback(stateForSubscriber));
    }
  }

  /**
   * Subscribes to an endpoint's state changes.
   * The callback is immediately invoked with the current state.
   */
  public subscribe<TData>(endpointKey: string, callback: (state: EndpointState<TData>) => void): () => void {
    // Returns an unsubscribe function
    const endpoint = this.endpoints.get(endpointKey) as Endpoint<TData> | undefined;

    if (!endpoint) {
      console.error(
        `QueryCore: Cannot subscribe. Endpoint "${endpointKey}" not defined. Define it first using defineEndpoint.`,
      );
      callback({
        data: undefined,
        isLoading: false,
        isError: true,
        error: new Error(`Endpoint "${endpointKey}" not defined.`),
        lastUpdated: undefined,
      });
      return () => {}; // Return a no-op unsubscribe function
    }

    endpoint.subscribers.add(callback);
    // Immediately call callback with current state (copied)
    callback({ ...endpoint.state });

    // Observer-based refetching: if data is stale, trigger a refetch.
    // This respects refetchAfter by calling refetch with forceRefetch = false.
    // refetch itself will handle the isLoading state and subsequent notifications.
    const { refetchAfter } = endpoint.options;
    const { lastUpdated, isLoading } = endpoint.state;

    if (!isLoading) {
      // Only consider refetch if not already loading
      if (refetchAfter && lastUpdated) {
        const timeSinceLastFetch = Date.now() - lastUpdated;
        if (timeSinceLastFetch >= refetchAfter) {
          console.log(`QueryCore: Data for "${endpointKey}" is stale upon subscription. Triggering refetch.`);
          this.refetch(endpointKey, false); // Do not force, respect refetchAfter interval precisely
        }
        // function is always defined. Did you mean to call it instead? } else if (!lastUpdated && endpoint.fetcher) {
      } else if (!lastUpdated) {
        // Data has never been fetched for this endpoint by this instance, and it's being observed.
        // This handles the case where an endpoint is defined, cache is empty/miss, and then subscribed to.
        console.log(`QueryCore: Data for "${endpointKey}" not present upon subscription. Triggering initial fetch.`);
        this.refetch(endpointKey, true); // Force fetch as there's no data.
      }
    }

    return () => {
      endpoint.subscribers.delete(callback);
      console.log(`QueryCore: Unsubscribed from "${endpointKey}". Remaining subscribers: ${endpoint.subscribers.size}`);
      // TODO: Add logic for potential cleanup if no subscribers are left for an endpoint (e.g., cancel pending timeouts for polling refetches if implemented)
    };
  }

  /**
   * Manually triggers a refetch for an endpoint.
   * If a fetch is already in progress for this endpoint, the new refetch request will be ignored.
   */
  public async refetch<TData>(endpointKey: string, forceRefetch = false): Promise<void> {
    const endpoint = this.endpoints.get(endpointKey) as Endpoint<TData> | undefined;
    if (!endpoint) {
      console.error(`QueryCore: Cannot refetch. Endpoint "${endpointKey}" not defined.`);
      return Promise.resolve();
    }

    if (endpoint.state.isLoading) {
      console.warn(`QueryCore: Refetch for "${endpointKey}" aborted, a fetch is already in progress.`);
      return Promise.resolve();
    }

    // Time-based refetching logic
    const { refetchAfter } = endpoint.options;
    const { lastUpdated } = endpoint.state;
    if (!forceRefetch && refetchAfter && lastUpdated) {
      const timeSinceLastFetch = Date.now() - lastUpdated;
      if (timeSinceLastFetch < refetchAfter) {
        console.log(
          `QueryCore: Refetch for "${endpointKey}" skipped, data is still fresh (fetched ${timeSinceLastFetch / 1000}s ago, refetchAfter ${refetchAfter / 1000}s).`,
        );
        // Ensure subscribers are notified of current (fresh) data if they weren't already
        this._updateStateAndNotify(endpointKey, {}); // Notify with current state
        return Promise.resolve();
      }
    }

    this._updateStateAndNotify(endpointKey, { isLoading: true, isError: false, error: undefined });

    try {
      const data = await endpoint.fetcher();
      const newLastUpdated = Date.now();
      await endpoint.cache.set<TData>(endpointKey, { data, lastUpdated: newLastUpdated }); // Await cache set
      this._updateStateAndNotify(endpointKey, {
        data,
        isLoading: false,
        lastUpdated: newLastUpdated,
        isError: false,
        error: undefined,
      });
      console.log(`QueryCore: Endpoint "${endpointKey}" refetched successfully.`);
    } catch (error) {
      this._updateStateAndNotify(endpointKey, {
        isLoading: false,
        isError: true,
        error,
        // lastUpdated: Date.now(), // PRD: "timestamp of the last successful fetch" - so don't update on error.
      });
      console.error(`QueryCore: Error refetching endpoint "${endpointKey}":`, error);
      // Do not throw here; the error is part of the state.
    }
  }

  /**
   * Manually invalidates the cache for an endpoint.
   * This will clear the cached data for the endpoint.
   * Future subscriptions or getState calls might trigger a new fetch if data is needed.
   * This method is now async due to cache interactions.
   */
  public async invalidate(endpointKey: string): Promise<void> {
    const endpoint = this.endpoints.get(endpointKey);
    if (!endpoint) {
      console.warn(`QueryCore: Cannot invalidate. Endpoint "${endpointKey}" not defined.`);
      return;
    }
    await endpoint.cache.remove(endpointKey); // Await cache removal
    // Also clear the data from the in-memory state and reset relevant fields.
    this._updateStateAndNotify(endpointKey, {
      data: undefined,
      lastUpdated: undefined,
      error: undefined,
      isError: false,
    });
    console.log(`QueryCore: Cache invalidated for "${endpointKey}". Data cleared from cache and current state.`);
  }

  /**
   * Retrieves the current state of an endpoint without subscribing.
   * Returns a copy of the state.
   */
  public getState<TData>(endpointKey: string): EndpointState<TData> {
    const endpoint = this.endpoints.get(endpointKey) as Endpoint<TData> | undefined;
    if (endpoint) {
      const stateCopy = { ...endpoint.state };
      if (stateCopy.data !== undefined) {
        try {
          stateCopy.data = structuredClone(stateCopy.data);
        } catch (e) {
          console.warn(
            `QueryCore: Could not structured-clone data for endpoint ${endpointKey} in getState. Returning shallow copy of data.`,
            e,
          );
        }
      }
      return stateCopy;
    }
    // Return a default "not found" or "initial" state if endpoint doesn't exist
    console.warn(
      `QueryCore: getState called for undefined endpoint "${endpointKey}". Returning default initial state.`,
    );
    return {
      data: undefined,
      isLoading: false,
      isError: false, // Or true with an error? PRD implies it's just the state.
      error: undefined, // Could set new Error('Endpoint not defined')
      lastUpdated: undefined,
    };
  }
}

export default QueryCore;
