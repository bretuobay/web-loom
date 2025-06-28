// Example: QueryCore + MVVM Integration Demo

// # npm
// npm install query-core-client

// # yarn
// yarn add query-core-client
//  use query chore client
import QueryCore from './QueryCore';
import { RestfulApiModel } from '../models/RestfulApiModel';
import { RestfulApiViewModel } from '../viewmodels/RestfulApiViewModel';
import { z } from 'zod';

// Schema definition for array of todos
const TodoArraySchema = z.array(
  z.object({
    id: z.string(),
    title: z.string(),
    completed: z.boolean(),
    userId: z.string(),
  }),
);

type TodoArray = z.infer<typeof TodoArraySchema>;

// Enhanced Model with QueryCore
class QueryCoreTodoModel extends RestfulApiModel<TodoArray, typeof TodoArraySchema> {
  private queryCore: QueryCore;
  private cacheKey: string;

  constructor(queryCore: QueryCore) {
    super({
      baseUrl: 'https://jsonplaceholder.typicode.com',
      endpoint: 'todos',
      fetcher: fetch,
      schema: TodoArraySchema,
      initialData: [],
    });

    this.queryCore = queryCore;
    this.cacheKey = 'todos_list';
    this.setupQueryCoreIntegration();
  }

  private setupQueryCoreIntegration(): void {
    // Define QueryCore endpoint
    this.queryCore.defineEndpoint(this.cacheKey, () => this.fetchFromApi(), {
      refetchAfter: 10 * 60 * 1000, // 10 minutes
      cacheProvider: 'indexedDB',
    });

    // Subscribe to QueryCore state changes
    this.queryCore.subscribe<TodoArray>(this.cacheKey, (state: any) => {
      if (state.data !== undefined) {
        this.setData(state.data);
      }
      this.setLoading(state.isLoading);
      if (state.isError && state.error) {
        this.setError(state.error);
      } else if (!state.isError) {
        this.setError(null);
      }
    });
  }

  private async fetchFromApi(): Promise<TodoArray> {
    console.log('Fetching todos from API...');
    const response = await fetch('https://jsonplaceholder.typicode.com/todos');
    const data = await response.json();
    return TodoArraySchema.parse(data);
  }

  // Override fetch to use QueryCore
  async fetch(): Promise<void> {
    await this.queryCore.refetch(this.cacheKey);
    const state = this.queryCore.getState<TodoArray>(this.cacheKey);

    if (state.isError) {
      throw state.error;
    }
  }

  // Force refresh bypassing cache
  async forceRefresh(): Promise<void> {
    await this.queryCore.invalidate(this.cacheKey);
    await this.fetch();
  }
}

// Enhanced ViewModel with QueryCore
class QueryCoreTodoViewModel extends RestfulApiViewModel<TodoArray, typeof TodoArraySchema> {
  private queryCore: QueryCore;

  constructor(queryCore: QueryCore) {
    const model = new QueryCoreTodoModel(queryCore);
    super(model);
    this.queryCore = queryCore;
  }

  // Additional methods for cache management
  async refreshData(): Promise<void> {
    if (this.model instanceof QueryCoreTodoModel) {
      await this.model.forceRefresh();
    }
  }

  // Get cache status
  getCacheStatus(): {
    hasData: boolean;
    isStale: boolean;
    lastUpdated?: number;
  } {
    const state = this.queryCore.getState('todos_list');
    const isStale = state.lastUpdated ? Date.now() - state.lastUpdated > 10 * 60 * 1000 : true;

    return {
      hasData: !!state.data,
      isStale,
      lastUpdated: state.lastUpdated,
    };
  }
}

// Usage Example
async function demonstrateIntegration() {
  // Initialize QueryCore
  const queryCore = new QueryCore({
    cacheProvider: 'indexedDB',
    defaultRefetchAfter: 5 * 60 * 1000, // 5 minutes
  });

  // Create ViewModel
  const todoViewModel = new QueryCoreTodoViewModel(queryCore);

  // Subscribe to data changes
  const dataSubscription = todoViewModel.data$.subscribe((todos) => {
    console.log('Todos updated:', todos?.length || 0, 'items');
  });

  const loadingSubscription = todoViewModel.isLoading$.subscribe((isLoading) => {
    console.log('Loading state:', isLoading);
  });

  const errorSubscription = todoViewModel.error$.subscribe((error) => {
    if (error) {
      console.error('Error:', error);
    }
  });

  try {
    // Initial fetch (will use cache if available)
    console.log('Triggering initial fetch...');
    await todoViewModel.fetchCommand.execute();

    // Check cache status
    const cacheStatus = todoViewModel.getCacheStatus();
    console.log('Cache status:', cacheStatus);

    // Simulate user refresh action
    setTimeout(async () => {
      console.log('Forcing refresh...');
      await todoViewModel.refreshData();
    }, 2000);

    // Simulate another fetch (should use cache if still fresh)
    setTimeout(async () => {
      console.log('Second fetch (should use cache)...');
      await todoViewModel.fetchCommand.execute();
    }, 4000);
  } catch (error) {
    console.error('Demo error:', error);
  }

  // Cleanup after demo
  setTimeout(() => {
    dataSubscription.unsubscribe();
    loadingSubscription.unsubscribe();
    errorSubscription.unsubscribe();
    console.log('Demo completed, subscriptions cleaned up');
  }, 6000);
}

// Export for use in examples
export { demonstrateIntegration, QueryCoreTodoModel, QueryCoreTodoViewModel };
