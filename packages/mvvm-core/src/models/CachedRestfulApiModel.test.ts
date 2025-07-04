import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { z } from 'zod';
import { CachedRestfulApiModel, TCachedConstructorInput } from './CachedRestfulApiModel';
import { QueryCore } from '@web-loom/query-core'; // Actual import

// Mock QueryCore
vi.mock('@web-loom/query-core', () => {
  const actualQueryCore = vi.importActual('@web-loom/query-core');
  return {
    ...actualQueryCore, // Import and retain actual exports like EndpointState if needed directly in tests
    QueryCore: vi.fn().mockImplementation(() => ({
      subscribe: vi.fn(() => vi.fn()), // subscribe returns an unsubscribe function
      refetch: vi.fn(() => Promise.resolve()),
      invalidate: vi.fn(() => Promise.resolve()),
      getState: vi.fn(() => ({
        data: undefined,
        isLoading: false,
        isError: false,
        error: undefined,
        lastUpdated: undefined,
      })),
    })),
  };
});

// Mock fetcher
const mockFetcher = vi.fn();

const TestSchema = z.object({
  id: z.string(),
  name: z.string(),
});
type TestData = z.infer<typeof TestSchema>;

const TestArraySchema = z.array(TestSchema);
type TestArrayData = z.infer<typeof TestArraySchema>;

describe('CachedRestfulApiModel', () => {
  let mockQueryCoreInstance: QueryCore;
  let model: CachedRestfulApiModel<TestData, typeof TestSchema>;
  let arrayModel: CachedRestfulApiModel<TestArrayData, typeof TestArraySchema>;

  const endpointKey = 'testEndpoint';
  const baseUrl = 'https://api.example.com';
  const endpoint = 'tests';

  beforeEach(() => {
    // Create a new mock instance for each test to reset call counts etc.
    mockQueryCoreInstance = new QueryCore();
    mockFetcher.mockClear(); // Clear fetcher mocks

    const modelInput: TCachedConstructorInput<TestData, typeof TestSchema> = {
      queryCore: mockQueryCoreInstance,
      endpointKey,
      schema: TestSchema,
      fetcher: mockFetcher,
      baseUrl,
      endpoint,
    };
    model = new CachedRestfulApiModel(modelInput);

    const arrayModelInput: TCachedConstructorInput<TestArrayData, typeof TestArraySchema> = {
      queryCore: mockQueryCoreInstance,
      endpointKey: `${endpointKey}Array`,
      schema: TestArraySchema,
      fetcher: mockFetcher,
      baseUrl,
      endpoint,
    };
    arrayModel = new CachedRestfulApiModel(arrayModelInput);
  });

  afterEach(() => {
    model.dispose();
    arrayModel.dispose();
    vi.clearAllMocks(); // Clears all mocks including QueryCore constructor and its methods
  });

  it('should be instantiated', () => {
    expect(model).toBeInstanceOf(CachedRestfulApiModel);
    expect(mockQueryCoreInstance.subscribe).toHaveBeenCalledWith(endpointKey, expect.any(Function));
  });

  it('should call QueryCore.refetch on query()', async () => {
    await model.query();
    expect(mockQueryCoreInstance.refetch).toHaveBeenCalledWith(endpointKey, false);
  });

  it('should call QueryCore.refetch with forceRefetch true on query(true)', async () => {
    await model.query(true);
    expect(mockQueryCoreInstance.refetch).toHaveBeenCalledWith(endpointKey, true);
  });

  it('should update data$ when QueryCore subscription callback is invoked with new data', () => {
    const testData: TestData = { id: '1', name: 'Test Item' };
    let callbackFn: (state: any) => void = () => {};
    // Capture the callback
    (mockQueryCoreInstance.subscribe as any).mockImplementationOnce((key: any, cb: any) => {
      callbackFn = cb;
      return vi.fn(); // unsubscribe
    });

    // Re-initialize model to capture the new subscribe mock
    model = new CachedRestfulApiModel({
      queryCore: mockQueryCoreInstance,
      endpointKey,
      schema: TestSchema,
    });

    callbackFn({ data: testData, isLoading: false, isError: false });
    // Access the protected BehaviorSubject to get current value
    expect((model as any)._data$.getValue()).toEqual(testData);
  });

  it('should update data$ when QueryCore subscription callback is invoked with new data', () => {
    const testData: TestData = { id: '1', name: 'Test Item' };
    let callbackFn: (state: any) => void = () => {};
    // Capture the callback
    (mockQueryCoreInstance.subscribe as any).mockImplementationOnce((key: any, cb: any) => {
      callbackFn = cb;
      return vi.fn(); // unsubscribe
    });

    // Re-initialize model to capture the new subscribe mock
    model = new CachedRestfulApiModel({
      queryCore: mockQueryCoreInstance,
      endpointKey,
      schema: TestSchema,
    });

    callbackFn({ data: testData, isLoading: false, isError: false });
    // Access the protected BehaviorSubject to get current value
    expect((model as any)._data$.getValue()).toEqual(testData);
  });

  it('should update isLoading$ when QueryCore subscription callback is invoked', () => {
    let callbackFn: (state: any) => void = () => {};
    (mockQueryCoreInstance.subscribe as any).mockImplementationOnce((key: any, cb: any) => {
      callbackFn = cb;
      return vi.fn();
    });
    model = new CachedRestfulApiModel({ queryCore: mockQueryCoreInstance, endpointKey, schema: TestSchema });

    callbackFn({ data: null, isLoading: true, isError: false });
    expect((model as any)._isLoading$.getValue()).toBe(true);
    callbackFn({ data: null, isLoading: false, isError: false });
    expect((model as any)._isLoading$.getValue()).toBe(false);
  });

  it.skip('should update error$ when QueryCore subscription callback is invoked with an error', () => {
    const testError = new Error('Test error');
    let callbackFn: (state: any) => void = () => {};
    (mockQueryCoreInstance.subscribe as any).mockImplementationOnce((key: any, cb: any) => {
      callbackFn = cb;
      return vi.fn();
    });
    model = new CachedRestfulApiModel({ queryCore: mockQueryCoreInstance, endpointKey, schema: TestSchema });

    callbackFn({ data: null, isLoading: false, isError: true, error: testError });
    expect((model as any)._error$.getValue()).toEqual(testError);
  });

  it('should validate data if schema validation is enabled (default)', () => {
    const invalidData = { id: '1', name: 123 }; // name should be string
    let callbackFn: (state: any) => void = () => {};
    (mockQueryCoreInstance.subscribe as any).mockImplementationOnce((key: any, cb: any) => {
      callbackFn = cb;
      return vi.fn();
    });
    model = new CachedRestfulApiModel({ queryCore: mockQueryCoreInstance, endpointKey, schema: TestSchema });

    callbackFn({ data: invalidData, isLoading: false, isError: false });
    expect((model as any)._error$.getValue()).toBeInstanceOf(z.ZodError);
    expect((model as any)._data$.getValue()).toBeNull(); // Or stale data, depending on exact error handling
  });

  it('should not validate data if schema validation is disabled', () => {
    const invalidData = { id: '1', name: 123 }; // name should be string
    let callbackFn: (state: any) => void = () => {};
    (mockQueryCoreInstance.subscribe as any).mockImplementationOnce((key: any, cb: any) => {
      callbackFn = cb;
      return vi.fn();
    });
    const modelWithoutValidation = new CachedRestfulApiModel({
      queryCore: mockQueryCoreInstance,
      endpointKey,
      schema: TestSchema,
      validateSchema: false, // Disable validation
    });

    callbackFn({ data: invalidData, isLoading: false, isError: false });
    expect((modelWithoutValidation as any)._error$.getValue()).toBeNull();
    expect((modelWithoutValidation as any)._data$.getValue()).toEqual(invalidData);
    modelWithoutValidation.dispose();
  });

  describe('CUD Operations', () => {
    const itemToCreate: Partial<TestData> = { name: 'New Item' };
    const createdItem: TestData = { id: 'genId1', name: 'New Item' };
    const itemToUpdateId = 'existingId1';
    const itemUpdatePayload: Partial<TestData> = { name: 'Updated Item' };
    const updatedItem: TestData = { id: itemToUpdateId, name: 'Updated Item' };

    beforeEach(() => {
      // CUD operations require fetcher, baseUrl, endpoint
      const fullInput: TCachedConstructorInput<TestData, typeof TestSchema> = {
        queryCore: mockQueryCoreInstance,
        endpointKey,
        schema: TestSchema,
        fetcher: mockFetcher,
        baseUrl,
        endpoint,
      };
      model = new CachedRestfulApiModel(fullInput); // Re-init model with fetcher for CUD
    });

    it('create() should call fetcher, invalidate and refetch QueryCore endpoint', async () => {
      mockFetcher.mockResolvedValueOnce(createdItem);
      const result = await model.create(itemToCreate);

      expect(mockFetcher).toHaveBeenCalledWith(
        `${baseUrl}/${endpoint}`,
        expect.objectContaining({ method: 'POST', body: JSON.stringify(itemToCreate) }),
      );
      expect(result).toEqual(createdItem);
      expect(mockQueryCoreInstance.invalidate).toHaveBeenCalledWith(endpointKey);
      expect(mockQueryCoreInstance.refetch).toHaveBeenCalledWith(endpointKey, true);
    });

    it('update() should call fetcher, invalidate and refetch QueryCore endpoint', async () => {
      mockFetcher.mockResolvedValueOnce(updatedItem);
      const result = await model.update(itemToUpdateId, itemUpdatePayload);

      expect(mockFetcher).toHaveBeenCalledWith(
        `${baseUrl}/${endpoint}/${itemToUpdateId}`,
        expect.objectContaining({ method: 'PUT', body: JSON.stringify(itemUpdatePayload) }),
      );
      expect(result).toEqual(updatedItem);
      expect(mockQueryCoreInstance.invalidate).toHaveBeenCalledWith(endpointKey);
      expect(mockQueryCoreInstance.refetch).toHaveBeenCalledWith(endpointKey, true);
    });

    it('delete() should call fetcher, invalidate and refetch QueryCore endpoint', async () => {
      const itemIdToDelete = 'delId1';
      mockFetcher.mockResolvedValueOnce(undefined); // Delete typically returns no content

      await model.delete(itemIdToDelete);

      expect(mockFetcher).toHaveBeenCalledWith(
        `${baseUrl}/${endpoint}/${itemIdToDelete}`,
        expect.objectContaining({ method: 'DELETE' }),
      );
      expect(mockQueryCoreInstance.invalidate).toHaveBeenCalledWith(endpointKey);
      expect(mockQueryCoreInstance.refetch).toHaveBeenCalledWith(endpointKey, true);
    });

    it('create() with array payload for arrayModel', async () => {
      const itemsToCreate: Partial<TestData>[] = [{ name: 'Item A' }, { name: 'Item B' }];
      const createdItems: TestData[] = [
        { id: 'genA', name: 'Item A' },
        { id: 'genB', name: 'Item B' },
      ];
      // Mock fetcher to return individual items for each POST, then arrayModel combines them
      mockFetcher.mockResolvedValueOnce(createdItems[0]); // For first item in payload
      mockFetcher.mockResolvedValueOnce(createdItems[1]); // For second item in payload

      const arrayModelInput: TCachedConstructorInput<TestArrayData, typeof TestArraySchema> = {
        queryCore: mockQueryCoreInstance,
        endpointKey: `${endpointKey}ArrayCreate`,
        schema: TestArraySchema,
        fetcher: mockFetcher,
        baseUrl,
        endpoint,
      };
      arrayModel = new CachedRestfulApiModel(arrayModelInput);

      const result = await arrayModel.create(itemsToCreate);

      expect(mockFetcher).toHaveBeenCalledTimes(itemsToCreate.length);
      expect(mockFetcher).toHaveBeenCalledWith(
        `${baseUrl}/${endpoint}`,
        expect.objectContaining({ method: 'POST', body: JSON.stringify(itemsToCreate[0]) }),
      );
      expect(mockFetcher).toHaveBeenCalledWith(
        `${baseUrl}/${endpoint}`,
        expect.objectContaining({ method: 'POST', body: JSON.stringify(itemsToCreate[1]) }),
      );
      expect(result).toEqual(createdItems); // Expecting the combined array of created items
      expect(mockQueryCoreInstance.invalidate).toHaveBeenCalledWith(`${endpointKey}ArrayCreate`);
      expect(mockQueryCoreInstance.refetch).toHaveBeenCalledWith(`${endpointKey}ArrayCreate`, true);
    });

    it('should throw error if CUD operations are called without fetcher configured', async () => {
      const modelWithoutFetcher = new CachedRestfulApiModel({
        queryCore: mockQueryCoreInstance,
        endpointKey: 'noFetcherEndpoint',
        schema: TestSchema,
        // No fetcher, baseUrl, endpoint
      });

      await expect(modelWithoutFetcher.create(itemToCreate)).rejects.toThrow('Fetcher not configured');
      await expect(modelWithoutFetcher.update(itemToUpdateId, itemUpdatePayload)).rejects.toThrow(
        'Fetcher not configured',
      );
      await expect(modelWithoutFetcher.delete(itemToUpdateId)).rejects.toThrow('Fetcher not configured');
      modelWithoutFetcher.dispose();
    });
  });

  it('dispose() should unsubscribe from QueryCore', () => {
    const unsubscribeMock = vi.fn();
    (mockQueryCoreInstance.subscribe as any).mockReturnValueOnce(unsubscribeMock);

    // Re-initialize model to capture the new subscribe mock that returns our unsubscribeMock
    const freshModel = new CachedRestfulApiModel({
      queryCore: mockQueryCoreInstance,
      endpointKey,
      schema: TestSchema,
    });

    freshModel.dispose();
    expect(unsubscribeMock).toHaveBeenCalled();
  });
});
