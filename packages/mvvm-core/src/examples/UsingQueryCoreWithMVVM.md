# Using QueryCore with MVVM Library

This document provides comprehensive guidance on integrating QueryCore as a data/caching layer with the MVVM library's RestfulApiModel and RestfulApiViewModel components.

## Overview

QueryCore is a data fetching and caching library that provides:

- **Smart caching** with configurable cache providers (localStorage, IndexedDB, in-memory)
- **Automatic refetching** based on staleness and network conditions
- **Observable-like subscriptions** for reactive data updates
- **Background refetching** when window focus or network connectivity is restored

The MVVM library provides:

- **RestfulApiModel**: Base model for RESTful API operations with RxJS observables
- **RestfulApiViewModel**: View model layer that orchestrates CRUD operations with commands
- **Reactive state management** with error handling and loading states

## Integration Patterns

### Pattern 1: QueryCore as Primary Data Layer

Replace the RestfulApiModel's direct API calls with QueryCore endpoints. This provides sophisticated caching and automatic refetching capabilities.

```typescript
import QueryCore from './QueryCore';
import { RestfulApiModel } from './models/RestfulApiModel';
import { z } from 'zod';

// Define your data schema
const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
});

type User = z.infer<typeof UserSchema>;

// Initialize QueryCore with desired cache provider
const queryCore = new QueryCore({
  cacheProvider: 'indexedDB', // or 'localStorage', 'inMemory'
  defaultRefetchAfter: 5 * 60 * 1000, // 5 minutes
});

// Enhanced RestfulApiModel with QueryCore integration
export class QueryCoreRestfulApiModel<TData, TSchema extends ZodSchema<TData>> extends RestfulApiModel<TData, TSchema> {
  private queryCore: QueryCore;

  constructor(config: TConstructorInput<TData, TSchema> & { queryCore: QueryCore }) {
    super(config);
    this.queryCore = config.queryCore;
  }

  /**
   * Override fetch to use QueryCore endpoints
   */
  async fetch(id?: string | string[]): Promise<TData> {
    const endpointKey = this.buildEndpointKey('fetch', id);

    // Define endpoint if not already defined
    if (!this.queryCore.getState(endpointKey).data && !this.queryCore.getState(endpointKey).isLoading) {
      this.queryCore.defineEndpoint(
        endpointKey,
        () => {
          return super.fetch(id); // Use parent's fetch logic
        },
        {
          refetchAfter: 5 * 60 * 1000, // 5 minutes
          cacheProvider: 'indexedDB',
        },
      );
    }

    // Subscribe to QueryCore state and update model observables
    const unsubscribe = this.queryCore.subscribe(endpointKey, (state) => {
      if (state.data !== undefined) {
        this.setData(state.data);
      }
      this.setLoading(state.isLoading);
      if (state.isError && state.error) {
        this.setError(state.error);
      }
    });

    // Trigger fetch and return promise
    await this.queryCore.refetch(endpointKey);
    const finalState = this.queryCore.getState<TData>(endpointKey);

    if (finalState.isError) {
      throw finalState.error;
    }

    return finalState.data!;
  }

  private buildEndpointKey(operation: string, id?: string | string[]): string {
    const baseKey = `${this.baseUrl}/${this.endpoint}`;
    if (id) {
      return `${baseKey}/${Array.isArray(id) ? id.join(',') : id}`;
    }
    return `${baseKey}/${operation}`;
  }
}
```

### Pattern 2: QueryCore as Cache Layer

```typescript
export class CachedRestfulApiViewModel<TData, TSchema extends ZodSchema<TData>> extends RestfulApiViewModel<
  TData,
  TSchema
> {
  private queryCore: QueryCore;
  private cacheKey: string;

  constructor(model: RestfulApiModel<TData, TSchema>, queryCore: QueryCore, cacheKey: string) {
    super(model);
    this.queryCore = queryCore;
    this.cacheKey = cacheKey;
    this.setupQueryCoreIntegration();
  }

  private setupQueryCoreIntegration(): void {
    this.queryCore.defineEndpoint(this.cacheKey, () => this.model.fetch(), {
      refetchAfter: 10 * 60 * 1000, // 10 minutes
      cacheProvider: 'indexedDB',
    });

    const queryCoreData$ = new BehaviorSubject<TData | null>(null);

    this.queryCore.subscribe<TData>(this.cacheKey, (state) => {
      if (state.data !== undefined) {
        queryCoreData$.next(state.data);
      }
      this.model.setLoading(state.isLoading);
      if (state.isError && state.error) {
        this.model.setError(state.error);
      }
    });

    (this as any).data$ = queryCoreData$.pipe(distinctUntilChanged());
  }

  async fetchWithCache(): Promise<void> {
    await this.queryCore.refetch(this.cacheKey);
  }

  async forceRefresh(): Promise<void> {
    await this.queryCore.invalidate(this.cacheKey);
    await this.queryCore.refetch(this.cacheKey, true);
  }
}
```

## Practical Usage Examples

### Example 1: User Management

```typescript
const queryCore = new QueryCore({
  cacheProvider: 'indexedDB',
  defaultRefetchAfter: 5 * 60 * 1000,
});

const userModel = new QueryCoreRestfulApiModel<User[], typeof UserSchema>({
  baseUrl: 'https://api.example.com',
  endpoint: 'users',
  fetcher: fetch,
  schema: z.array(UserSchema),
  initialData: [],
  queryCore: queryCore,
});

const userViewModel = new CachedRestfulApiViewModel(userModel, queryCore, 'users_collection');

// React usage
function UserList() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const subscription = userViewModel.data$.subscribe(setUsers);
    const loadingSubscription = userViewModel.isLoading$.subscribe(setIsLoading);

    userViewModel.fetchWithCache();

    return () => {
      subscription.unsubscribe();
      loadingSubscription.unsubscribe();
    };
  }, []);

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <button onClick={() => userViewModel.forceRefresh()}>Refresh</button>
      <ul>
        {users.map((user) => (
          <li key={user.id}>
            {user.name} - {user.email}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### Example 2: QueryCore with Collections and Filtering

```typescript
import { QueryableCollectionViewModel } from './viewmodels/QueryableCollectionViewModel';

export class CachedQueryableCollectionViewModel<T> extends QueryableCollectionViewModel<T> {
  private queryCore: QueryCore;
  private baseCacheKey: string;

  constructor(items: T[], queryCore: QueryCore, baseCacheKey: string) {
    super(items);
    this.queryCore = queryCore;
    this.baseCacheKey = baseCacheKey;
    this.setupCachedCollections();
  }

  private setupCachedCollections(): void {
    this.queryCore.defineEndpoint(this.baseCacheKey, () => Promise.resolve(this.sourceItems$.value), {
      refetchAfter: 30 * 60 * 1000, // 30 minutes
      cacheProvider: 'indexedDB',
    });

    this.queryCore.subscribe<T[]>(this.baseCacheKey, (state) => {
      if (state.data) {
        this.sourceItems$.next(state.data);
      }
    });
  }

  updateCollection(newItems: T[]): void {
    this.sourceItems$.next(newItems);
    this.queryCore.invalidate(this.baseCacheKey).then(() => {
      this.queryCore.defineEndpoint(this.baseCacheKey, () => Promise.resolve(newItems), {
        refetchAfter: 30 * 60 * 1000,
        cacheProvider: 'indexedDB',
      });
    });
  }

  private cacheFilteredResults(filterTerm: string, results: T[]): void {
    if (filterTerm.length >= 3) {
      const filterCacheKey = `${this.baseCacheKey}_filter_${filterTerm}`;
      this.queryCore.defineEndpoint(filterCacheKey, () => Promise.resolve(results), {
        refetchAfter: 15 * 60 * 1000,
        cacheProvider: 'localStorage',
      });
    }
  }
}

// Product catalog example
const ProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
  price: z.number(),
});

type Product = z.infer<typeof ProductSchema>;

class ProductCatalogViewModel extends CachedQueryableCollectionViewModel<Product> {
  constructor() {
    const queryCore = new QueryCore({
      cacheProvider: 'indexedDB',
      defaultRefetchAfter: 15 * 60 * 1000,
    });
    super([], queryCore, 'product_catalog');
  }

  async loadProducts(): Promise<void> {
    try {
      const response = await fetch('https://api.example.com/products');
      const products = await response.json();
      this.updateCollection(products);
    } catch (error) {
      console.error('Failed to load products:', error);
    }
  }

  filterByCategory(category: string): Observable<Product[]> {
    return this.filteredItems$.pipe(map((items) => items.filter((item) => item.category === category)));
  }
}
```

## Best Practices

### 1. Cache Key Strategy

Use consistent, descriptive cache keys:

```typescript
// Good patterns
const listKey = 'users_list';
const detailKey = `user_detail_${userId}`;
const filteredKey = `users_filtered_${filterTerm}`;
const searchKey = `products_search_${query}`;
```

### 2. Cache Invalidation

Implement proper cache invalidation for data consistency:

```typescript
class SmartCachedViewModel {
  async createItem(itemData: Partial<Item>): Promise<void> {
    await this.model.create(itemData);

    // Invalidate related caches
    await this.queryCore.invalidate('items_list');
    await this.queryCore.refetch('items_list', true);
  }

  async updateItem(id: string, updates: Partial<Item>): Promise<void> {
    await this.model.update(id, updates);

    await this.queryCore.invalidate(`item_detail_${id}`);
    await this.queryCore.invalidate('items_list');
    await this.queryCore.refetch('items_list', true);
  }

  async deleteItem(id: string): Promise<void> {
    await this.model.delete(id);

    await this.queryCore.invalidate(`item_detail_${id}`);
    await this.queryCore.invalidate('items_list');
    await this.queryCore.refetch('items_list', true);
  }
}
```

### 3. Error Handling and Fallbacks

```typescript
class ResilientCachedViewModel {
  async fetchWithFallback(): Promise<void> {
    try {
      await this.queryCore.refetch(this.cacheKey);
    } catch (cacheError) {
      console.warn('Cache fetch failed, using fallback:', cacheError);

      try {
        const data = await this.model.fetch();
        this.queryCore.defineEndpoint(this.cacheKey, () => Promise.resolve(data), { refetchAfter: 5 * 60 * 1000 });
      } catch (modelError) {
        console.error('Both cache and model fetch failed:', modelError);
        this.model.setError(modelError);
      }
    }
  }
}
```

### 4. Performance Optimization

Optimize performance with different cache providers based on data characteristics:

```typescript
const queryCore = new QueryCore({
  cacheProvider: 'indexedDB', // Default for large datasets
});

// Fast, frequently accessed data
queryCore.defineEndpoint('user_preferences', fetcher, {
  cacheProvider: 'localStorage', // Faster access
  refetchAfter: 60 * 60 * 1000, // 1 hour
});

// Large, less frequently accessed data
queryCore.defineEndpoint('analytics_data', fetcher, {
  cacheProvider: 'indexedDB', // Better for large data
  refetchAfter: 24 * 60 * 60 * 1000, // 24 hours
});

// Temporary, session-based data
queryCore.defineEndpoint('search_results', fetcher, {
  cacheProvider: 'inMemory', // Fastest, not persistent
  refetchAfter: 5 * 60 * 1000, // 5 minutes
});
```

## Integration Benefits

### 1. Automatic Background Refetching

QueryCore automatically refetches stale data when:

- Window regains focus
- Network connectivity is restored
- Data exceeds the configured `refetchAfter` time

### 2. Intelligent Caching

- Multiple cache provider options (localStorage, IndexedDB, in-memory)
- Configurable cache expiration per endpoint
- Automatic cache invalidation and cleanup

### 3. Reactive State Management

- Seamless integration with RxJS observables
- Automatic UI updates when cached data changes
- Loading and error state management

### 4. Network Optimization

- Prevents redundant API calls
- Reduces server load
- Improves user experience with instant data display

## Common Patterns and Gotchas

### 1. Subscription Management

Always clean up QueryCore subscriptions to prevent memory leaks:

```typescript
class ComponentWithCleanup {
  private unsubscribeCallbacks: (() => void)[] = [];

  setupSubscriptions(): void {
    const unsubscribe = this.queryCore.subscribe('endpoint', (state) => {
      // Handle state updates
    });
    this.unsubscribeCallbacks.push(unsubscribe);
  }

  cleanup(): void {
    this.unsubscribeCallbacks.forEach((unsub) => unsub());
    this.unsubscribeCallbacks = [];
  }
}
```

### 2. Cache Consistency

Be mindful of cache consistency across different endpoints:

```typescript
// When updating related data, invalidate all affected caches
async updateUserProfile(userId: string, profileData: any): Promise<void> {
  await this.userModel.update(userId, profileData);

  // Invalidate all related caches
  await Promise.all([
    this.queryCore.invalidate(`user_${userId}`),
    this.queryCore.invalidate('users_list'),
    this.queryCore.invalidate('user_profile_summary'),
  ]);
}
```

### 3. Schema Validation

Ensure cached data remains valid by integrating with Zod schemas:

```typescript
class ValidatedCachedModel extends QueryCoreRestfulApiModel {
  async fetchValidated(): Promise<TData> {
    const data = await super.fetch();

    if (this._shouldValidateSchema) {
      try {
        return this.schema.parse(data);
      } catch (validationError) {
        // Invalidate cache if validation fails
        await this.queryCore.invalidate(this.cacheKey);
        throw new Error(`Cached data validation failed: ${validationError.message}`);
      }
    }

    return data;
  }
}
```

## Conclusion

This integration provides a powerful combination of QueryCore's caching capabilities with the MVVM library's reactive state management. The result is applications that are both performant and maintainable, with automatic caching, intelligent refetching, and robust error handling.

Key advantages:

- **Reduced API calls** through intelligent caching
- **Better user experience** with instant data display
- **Automatic data freshness** through background refetching
- **Robust error handling** with fallback strategies
- **Type safety** through Zod schema integration
- **Reactive updates** through RxJS observables

Use these patterns as starting points and adapt them to your specific application needs. The combination of QueryCore and MVVM provides a solid foundation for building scalable, reactive applications with excellent caching strategies.
