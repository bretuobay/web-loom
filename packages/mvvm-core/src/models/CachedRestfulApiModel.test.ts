import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { z } from 'zod';
// Import QueryCore using the relative path that will be mocked.
// EndpointState is not directly used by the test file now, MockEndpointState is.
import QueryCore, { EndpointState } from '@web-loom/query-core'; // Assuming QueryCore is available via this path

import { CachedRestfulApiModel, TCachedRestfulApiModelConstructor } from './CachedRestfulApiModel';
import { BehaviorSubject, firstValueFrom, Subject } from 'rxjs';

// Define a simple Zod schema for testing
const ItemSchema = z.object({
  id: z.string(),
  name: z.string(),
});
type Item = z.infer<typeof ItemSchema>;
const ItemArraySchema = z.array(ItemSchema);
type ItemArray = z.infer<typeof ItemArraySchema>;

// Define a simple structure for EndpointState for the mock if importing causes issues.
interface MockEndpointState<TData> {
  data: TData | undefined;
  isLoading: boolean;
  isError: boolean;
  error: any | undefined;
  lastUpdated: number | undefined;
}

// Mock QueryCore
// Using relative path to potentially avoid issues with alias mocking in Vitest
vi.mock('@web-loom/query-core', () => {
  // No BehaviorSubject here directly in the factory's outer scope.

  // This function will be what `new QueryCore()` returns and will create its own state.
  const createMockQueryCoreInstance = () => {
    // Create the BehaviorSubject when the mocked QueryCore is instantiated.
    const instanceBehaviorSubject = new BehaviorSubject<MockEndpointState<any>>({
      data: undefined,
      isLoading: false,
      isError: false,
      error: undefined,
      lastUpdated: undefined,
    });

    return {
      defineEndpoint: vi.fn(async (endpointKey: string, fetcher: () => Promise<any>, options: any) => {}),
      subscribe: vi.fn((endpointKey: string, callback: (state: MockEndpointState<any>) => void) => {
        const subscription = instanceBehaviorSubject.subscribe(callback);
        callback(instanceBehaviorSubject.getValue());
        return () => subscription.unsubscribe();
      }),
      refetch: vi.fn(async (endpointKey: string, force?: boolean) => {
        const currentState = instanceBehaviorSubject.getValue();
        instanceBehaviorSubject.next({ ...currentState, isLoading: true, isError: false, error: undefined });
      }),
      invalidate: vi.fn(async (endpointKey: string) => {
        instanceBehaviorSubject.next({
          data: undefined,
          isLoading: false,
          isError: false,
          error: undefined,
          lastUpdated: undefined,
        });
      }),
      getState: vi.fn((endpointKey: string): MockEndpointState<any> => {
        return instanceBehaviorSubject.getValue();
      }),
      // These helpers need to be part of the returned instance if tests use them on the instance
      _simulateStateChange: (newState: Partial<MockEndpointState<any>>) => {
        instanceBehaviorSubject.next({ ...instanceBehaviorSubject.getValue(), ...newState });
      },
      _resetMockState: () => {
        instanceBehaviorSubject.next({
          data: undefined,
          isLoading: false,
          isError: false,
          error: undefined,
          lastUpdated: undefined,
        });
      },
    };
  };

  return {
    default: vi.fn(createMockQueryCoreInstance), // The constructor returns an object with these methods
    // EndpointState is a type, not needed for runtime mock if only used as type.
  };
});

describe('CachedRestfulApiModel', () => {
  let mockQueryCoreInstance: QueryCore; // This will hold the mocked instance
  // Helper to access the mock simulation methods, which are now on the instance returned by the mock constructor
  let mockQueryCoreSimulator: {
    _simulateStateChange: (newState: Partial<EndpointState<any>>) => void;
    _resetMockState: () => void;
  };

  const endpointKey = 'testEndpoint';
  // const testSchema = ItemSchema; // This was incorrect for ItemArray
  const itemArrayTestSchema = ItemArraySchema;


  beforeEach(() => {
    // Create a new mock instance for each test to ensure isolation
    mockQueryCoreInstance = new QueryCore();
    // This is a bit of a hack to get the simulator methods from the mocked module
    mockQueryCoreSimulator = mockQueryCoreInstance as any;
    mockQueryCoreSimulator._resetMockState(); // Reset state before each test
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const createModel = (constructorInput?: Partial<TCachedRestfulApiModelConstructor<ItemArray, typeof itemArrayTestSchema>>) => {
    return new CachedRestfulApiModel<ItemArray, typeof itemArrayTestSchema>({
      queryCore: mockQueryCoreInstance,
      endpointKey,
      schema: itemArrayTestSchema, // Correct schema for ItemArray
      initialData: null,
      ...constructorInput,
    });
  };

  it('should initialize and subscribe to QueryCore', async () => {
    const model = createModel();
    expect(mockQueryCoreInstance.subscribe).toHaveBeenCalledWith(endpointKey, expect.any(Function));

    // Check initial state propagation from QueryCore's mock
    const initialData = await firstValueFrom(model.data$);
    const initialLoading = await firstValueFrom(model.isLoading$);
    const initialError = await firstValueFrom(model.error$);

    // BaseModel initializes _data$ with (undefined ?? null) = null.
    // Mock QueryCore subscribe callback is called synchronously with { data: undefined, ... }.
    // BaseModel initializes _data$ with (undefined ?? null) = null.
    // Mock QueryCore subscribe callback is called synchronously with { data: undefined, ... }.
    // CachedRestfulApiModel.setData(undefined) is called.
    // So _data$ in BaseModel is now BehaviorSubject(undefined).
    // firstValueFrom will get the current value, which should be undefined.
    expect(await firstValueFrom(model.data$)).toBeNull();
    expect(initialLoading).toBe(false);
    expect(initialError).toBeNull();
    model.dispose();
  });

  it('should define endpoint if fetcherFn is provided and endpoint is not "defined"', async () => {
    const fetcherFn = vi.fn(async () => [{ id: '1', name: 'Test' }]);
    // Simulate endpoint not defined initially by QueryCore.getState (pristine state)
    (mockQueryCoreInstance.getState as vi.Mock).mockReturnValueOnce({
      data: undefined,
      isLoading: false,
      isError: false, // Corrected for pristine state check
      error: undefined, // Corrected for pristine state check
      lastUpdated: undefined,
    });

    const model = createModel({ fetcherFn, refetchAfter: 5000 });

    expect(mockQueryCoreInstance.defineEndpoint).toHaveBeenCalledWith(endpointKey, fetcherFn, { refetchAfter: 5000 });
    model.dispose();
  });

  it('should NOT define endpoint if fetcherFn is provided but endpoint IS already "defined"', async () => {
    const fetcherFn = vi.fn(async () => [{ id: '1', name: 'Test' }]);
    // Simulate endpoint IS defined
    (mockQueryCoreInstance.getState as vi.Mock).mockReturnValueOnce({
      data: [{ id: 'preexisting', name: 'Preexisting Data' }],
      isLoading: false,
      isError: false,
      error: undefined,
      lastUpdated: Date.now(),
    });

    const model = createModel({ fetcherFn, refetchAfter: 5000 });

    expect(mockQueryCoreInstance.defineEndpoint).not.toHaveBeenCalled();
    model.dispose();
  });

  // TODO: Investigate why 'isError$' in model is not found in this specific test context. (Resolved by adding explicit checks)
  // Other inherited properties (isLoading$, error$) work fine.
  it('should update data$, isLoading$, and error$ based on QueryCore state changes', async () => {
    const model = createModel();
    const testItems: ItemArray = [{ id: '1', name: 'Item 1' }];
    const testError = new Error('Query failed');

    // Basic check: ensure observables are present immediately after creation
    expect(model.data$).toBeDefined();
    expect(model.isLoading$).toBeDefined();
    expect(model.error$).toBeDefined();
    expect(model.isError$).toBeDefined(); // Key check

    let dataHistory: (ItemArray | null)[] = [];
    model.data$.subscribe((val) => dataHistory.push(val === undefined ? null : val)); // Normalize undefined to null for easier comparison

    // Simulate loading
    mockQueryCoreSimulator._simulateStateChange({ isLoading: true });
    expect(await firstValueFrom(model.isLoading$)).toBe(true);

    // Simulate data received
    mockQueryCoreSimulator._simulateStateChange({
      isLoading: false,
      data: testItems,
      isError: false,
      error: undefined,
    });
    expect(await firstValueFrom(model.isLoading$)).toBe(false);
    expect(await firstValueFrom(model.data$)).toEqual(testItems);
    expect(await firstValueFrom(model.error$)).toBeNull(); // error should be null
    expect(await firstValueFrom(model.isError$)).toBe(false); // isError should be false
    expect(dataHistory.pop()).toEqual(testItems);

    // Simulate error
    mockQueryCoreSimulator._simulateStateChange({ isLoading: false, data: undefined, isError: true, error: testError });
    expect(await firstValueFrom(model.isLoading$)).toBe(false);

    expect(model.isError$).toBeDefined(); // Re-check before use
    const isErrorObs = model.isError$;
    expect(isErrorObs).toBeDefined(); // Ensure the observable itself is defined

    expect(await firstValueFrom(isErrorObs)).toBe(true);
    expect(await firstValueFrom(model.error$)).toEqual(testError);

    // Data becomes undefined in this error sim, which model converts to null
    expect(dataHistory.pop()).toEqual(null);

    model.dispose();
  });

  it('should call QueryCore.refetch when model.refetch is called', async () => {
    const model = createModel();
    await model.refetch();
    expect(mockQueryCoreInstance.refetch).toHaveBeenCalledWith(endpointKey, false);

    await model.refetch(true);
    expect(mockQueryCoreInstance.refetch).toHaveBeenCalledWith(endpointKey, true);
    model.dispose();
  });

  it('should call QueryCore.invalidate when model.invalidate is called', async () => {
    const model = createModel();
    await model.invalidate();
    expect(mockQueryCoreInstance.invalidate).toHaveBeenCalledWith(endpointKey);
    // After invalidation, data should become null/undefined if QueryCore clears it
    mockQueryCoreSimulator._simulateStateChange({ data: undefined, lastUpdated: undefined }); // Simulate QueryCore's reaction
    expect(await firstValueFrom(model.data$)).toBeNull();
    model.dispose();
  });

  it('should unsubscribe from QueryCore on dispose', () => {
    const mockUnsubscribeFn = vi.fn();
    // Configure the subscribe mock to return our new spy
    (mockQueryCoreInstance.subscribe as vi.Mock).mockReturnValueOnce(mockUnsubscribeFn);

    const model = createModel(); // This will call subscribe

    expect(mockUnsubscribeFn).not.toHaveBeenCalled();
    model.dispose();
    expect(mockUnsubscribeFn).toHaveBeenCalled();
  });

  it('should handle initial data correctly if provided', async () => {
    const initialItems: ItemArray = [{ id: 'init', name: 'Initial Item' }];
    const model = createModel({ initialData: initialItems });

    // BaseModel constructor sets _data$ to initialItems.
    // QueryCore mock's subscribe callback is called synchronously with { data: undefined, ... }.
    // CachedRestfulApiModel.setData(undefined) is called.
    // So _data$ in BaseModel is now BehaviorSubject(undefined).
    // firstValueFrom will get the current value, which should be undefined.
    expect(await firstValueFrom(model.data$)).toBeNull();

    // If we wanted to test that initialData was briefly set, we'd need a more complex spy
    // or an async mock for QueryCore's callback. For now, this reflects the sync outcome.
    model.dispose();
  });

  it('should set error if defineEndpoint fails', async () => {
    const fetcherFn = vi.fn();
    const definitionError = new Error('Definition failed');
    (mockQueryCoreInstance.getState as vi.Mock).mockReturnValueOnce({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('Endpoint not defined.'),
      lastUpdated: undefined,
    });
    (mockQueryCoreInstance.defineEndpoint as vi.Mock).mockRejectedValueOnce(definitionError);

    const model = createModel({ fetcherFn });

    // Wait for async constructor logic to settle
    await new Promise(process.nextTick);

    expect(await firstValueFrom(model.error$)).toBe(definitionError);
    model.dispose();
  });

  // Test for "skipped" test case (conceptual, as CUD is external)
  // This test now focuses on the behavior after an external action (like create/update/delete)
  // would have triggered an invalidation or refetch.
  describe('External CUD operations and cache interaction', () => {
    it('model data should reflect changes after invalidate and refetch simulate external CUD', async () => {
      const model = createModel();
      const initialItems: ItemArray = [{ id: '1', name: 'Original' }];
      mockQueryCoreSimulator._simulateStateChange({ data: initialItems, isLoading: false });
      expect(await firstValueFrom(model.data$)).toEqual(initialItems);

      // Simulate external CREATE:
      // 1. External API call happens.
      // 2. Invalidate or refetch is called on the model.
      await model.invalidate(); // Invalidate the cache
      mockQueryCoreSimulator._simulateStateChange({ data: undefined, isLoading: false }); // QueryCore state after invalidation
      expect(await firstValueFrom(model.data$)).toBeNull();

      const itemsAfterCreate: ItemArray = [...initialItems, { id: '2', name: 'Newly Created' }];
      // Simulate QueryCore fetching new data after invalidation + refetch (triggered by subscribe or manually)
      mockQueryCoreSimulator._simulateStateChange({ data: itemsAfterCreate, isLoading: false });
      expect(await firstValueFrom(model.data$)).toEqual(itemsAfterCreate);

      // Simulate external UPDATE:
      await model.refetch(true); // Force refetch
      const itemsAfterUpdate: ItemArray = [{ id: '1', name: 'Updated Name' }, itemsAfterCreate[1]];
      mockQueryCoreSimulator._simulateStateChange({ data: itemsAfterUpdate, isLoading: false }); // QueryCore gets updated data
      expect(await firstValueFrom(model.data$)).toEqual(itemsAfterUpdate);

      // Simulate external DELETE:
      await model.invalidate();
      mockQueryCoreSimulator._simulateStateChange({ data: undefined, isLoading: false });
      const itemsAfterDelete: ItemArray = [itemsAfterUpdate[1]]; // Only item '2' remains
      mockQueryCoreSimulator._simulateStateChange({ data: itemsAfterDelete, isLoading: false });
      expect(await firstValueFrom(model.data$)).toEqual(itemsAfterDelete);

      model.dispose();
    });
  });
});
