// disable linting for this file
// eslint-disable
// @ts-nocheck
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { observe } from '@web-loom/signals-core';
import { RestfulApiViewModel } from './RestfulApiViewModel';
import { BaseModel } from '../models/BaseModel';
// Import ExtractItemType along with RestfulApiModel and Fetcher
import { RestfulApiModel, Fetcher, ExtractItemType } from '../models/RestfulApiModel';
import { z } from 'zod';

// Define a simple Zod schema for testing
const ItemSchema = z.object({
  id: z.string(),
  name: z.string(),
});
type Item = z.infer<typeof ItemSchema>;
type ItemArray = Item[];

// Mock Fetcher for RestfulApiModel constructor
const mockFetcher: Fetcher = async (url, options) => {
  return new Response(JSON.stringify({}), { status: 200 });
};

// The mock drives the inherited signal-based state via the public setters.
// TData can be Item or ItemArray. TSchema is for a single Item.
class MockRestfulApiModel<TData> extends RestfulApiModel<TData, typeof ItemSchema> {
  constructor(initialData: TData | null = null) {
    super({
      baseUrl: 'http://mockapi.com',
      endpoint: 'items',
      fetcher: mockFetcher,
      schema: ItemSchema, // Schema for single item
      initialData: initialData,
    });
  }

  public fetch = vi.fn(async (id?: string | string[]) => {
    this.setLoading(true);
    this.clearError();
    try {
      if (id) {
        // Simulate fetching single item or specific items
        const item = {
          id: Array.isArray(id) ? id[0] : id,
          name: `Fetched ${Array.isArray(id) ? id[0] : id}`,
        } as unknown as TData;
        this.setData(item);
      } else {
        // Simulate fetching collection
        const items: ItemArray = [
          { id: '1', name: 'Item 1' },
          { id: '2', name: 'Item 2' },
        ];
        this.setData(items as unknown as TData);
      }
    } catch (e) {
      this.setError(e);
      throw e;
    } finally {
      this.setLoading(false);
    }
  });

  public create = vi.fn(async (payload: Partial<ExtractItemType<TData>> | Partial<ExtractItemType<TData>>[]) => {
    this.setLoading(true);
    this.clearError();
    try {
      const currentData = this.getCurrentData();
      let result: ExtractItemType<TData> | ExtractItemType<TData>[] | undefined;

      if (Array.isArray(payload)) {
        // Batch create
        const newItems = payload.map((p, i) => ({
          id: `new-batch-${Date.now()}-${i}`,
          ...(p as object),
        })) as ExtractItemType<TData>[];
        if (Array.isArray(currentData)) {
          this.setData([...currentData, ...newItems] as unknown as TData);
        } else {
          // Assuming currentData becomes an array
          this.setData(newItems as unknown as TData);
        }
        result = newItems;
      } else {
        // Single create
        const newItem = { id: `new-${Date.now()}`, ...(payload as object) } as ExtractItemType<TData>;
        if (Array.isArray(currentData)) {
          this.setData([...currentData, newItem] as unknown as TData);
        } else {
          // currentData is single item or null
          this.setData(newItem as unknown as TData);
        }
        result = newItem;
      }
      return result;
    } catch (e) {
      this.setError(e);
      throw e;
    } finally {
      this.setLoading(false);
    }
  });

  public update = vi.fn(async (id: string, payload: Partial<ExtractItemType<TData>>) => {
    this.setLoading(true);
    this.clearError();
    try {
      const updatedItem = { id, ...(payload as object) } as ExtractItemType<TData>;
      const currentData = this.getCurrentData();
      if (Array.isArray(currentData)) {
        this.setData(currentData.map((item: any) => (item.id === id ? updatedItem : item)) as unknown as TData);
      } else if (currentData && (currentData as any).id === id) {
        this.setData(updatedItem as unknown as TData);
      }
      return updatedItem;
    } catch (e) {
      this.setError(e);
      throw e;
    } finally {
      this.setLoading(false);
    }
  });

  public delete = vi.fn(async (id: string) => {
    this.setLoading(true);
    this.clearError();
    try {
      const currentData = this.getCurrentData();
      if (Array.isArray(currentData)) {
        this.setData(currentData.filter((item: any) => item.id !== id) as unknown as TData);
      } else if (currentData && (currentData as any).id === id) {
        this.setData(null as unknown as TData);
      }
    } catch (e) {
      this.setError(e);
      throw e;
    } finally {
      this.setLoading(false);
    }
  });

  // Ensure dispose is callable on the mock
  public dispose = vi.fn(() => {
    super.dispose();
  });
}

describe('RestfulApiViewModel', () => {
  // Test with TData = ItemArray (collection)
  describe('ViewModel with TData = ItemArray', () => {
    let mockModelArray: MockRestfulApiModel<ItemArray>;
    let viewModelArray: RestfulApiViewModel<ItemArray, typeof ItemSchema>;

    beforeEach(() => {
      mockModelArray = new MockRestfulApiModel<ItemArray>([]); // Initial data is an empty array
      viewModelArray = new RestfulApiViewModel(mockModelArray);
    });

    afterEach(() => {
      vi.clearAllMocks();
      viewModelArray.dispose(); // Ensure ViewModel and its model are disposed
    });

    it('createCommand should call model.create with a single item payload', async () => {
      const payload: Partial<Item> = { name: 'New Single Item' };
      mockModelArray.setData([]); // Start with an empty array for collection
      await viewModelArray.createCommand.execute(payload);
      expect(mockModelArray.create).toHaveBeenCalledWith(payload);
      const data = viewModelArray.data$.get();
      expect(Array.isArray(data) && data.length).toBe(1);
      expect(Array.isArray(data) && data[0].name).toBe(payload.name);
    });

    it('createCommand should call model.create with an array of item payloads', async () => {
      const payloadArray: Partial<Item>[] = [{ name: 'Batch Item 1' }, { name: 'Batch Item 2' }];
      mockModelArray.setData([]);
      await viewModelArray.createCommand.execute(payloadArray);
      expect(mockModelArray.create).toHaveBeenCalledWith(payloadArray);
      const data = viewModelArray.data$.get();
      expect(Array.isArray(data) && data.length).toBe(2);
      expect(Array.isArray(data) && data[1].name).toBe(payloadArray[1].name);
    });

    it('updateCommand should call model.update with item ID and payload', async () => {
      const existingItem: Item = { id: '1', name: 'Original Name' };
      const updatePayload: Partial<Item> = { name: 'Updated Name' };
      mockModelArray.setData([existingItem]);
      await viewModelArray.updateCommand.execute({ id: existingItem.id, payload: updatePayload });
      expect(mockModelArray.update).toHaveBeenCalledWith(existingItem.id, updatePayload);
      const data = viewModelArray.data$.get();
      expect(Array.isArray(data) && data[0].name).toBe(updatePayload.name);
    });
  });

  // Test with TData = Item (single item)
  describe('ViewModel with TData = Item', () => {
    let mockModelSingle: MockRestfulApiModel<Item | null>; // TData is Item | null
    let viewModelSingle: RestfulApiViewModel<Item | null, typeof ItemSchema>;

    beforeEach(() => {
      mockModelSingle = new MockRestfulApiModel<Item | null>(null); // Initial data is null
      viewModelSingle = new RestfulApiViewModel(mockModelSingle);
    });

    afterEach(() => {
      vi.clearAllMocks();
      viewModelSingle.dispose();
    });

    it('createCommand should call model.create with a single item payload (for single item model)', async () => {
      const payload: Partial<Item> = { name: 'New Single Item Only' };
      // For a model that holds a single item (or null), create replaces current or sets it.
      await viewModelSingle.createCommand.execute(payload);
      expect(mockModelSingle.create).toHaveBeenCalledWith(payload);
      const data = viewModelSingle.data$.get();
      expect(data).not.toBeNull();
      expect((data as Item).name).toBe(payload.name);
    });

    it('createCommand with array payload on single item model (should be handled by model)', async () => {
      const payloadArray: Partial<Item>[] = [{ name: 'Batch Item 1' }];
      // Mocking the model's create to throw, as per RestfulApiModel's logic
      mockModelSingle.create.mockImplementation(async () => {
        throw new Error('Cannot create multiple items when model data is a single item.');
      });

      await expect(viewModelSingle.createCommand.execute(payloadArray)).rejects.toThrow(
        'Cannot create multiple items when model data is a single item.',
      );
      expect(mockModelSingle.create).toHaveBeenCalledWith(payloadArray);
    });

    it('updateCommand should call model.update (for single item model)', async () => {
      const existingItem: Item = { id: 'item-single', name: 'Original Single Name' };
      const updatePayload: Partial<Item> = { name: 'Updated Single Name' };
      mockModelSingle.setData(existingItem);
      await viewModelSingle.updateCommand.execute({ id: existingItem.id, payload: updatePayload });
      expect(mockModelSingle.update).toHaveBeenCalledWith(existingItem.id, updatePayload);
      const data = viewModelSingle.data$.get();
      expect((data as Item).name).toBe(updatePayload.name);
    });
  });

  // General tests (can use either view model, typically array based for fetch all)
  let commonMockModel: MockRestfulApiModel<ItemArray>;
  let commonViewModel: RestfulApiViewModel<ItemArray, typeof ItemSchema>;

  beforeEach(() => {
    commonMockModel = new MockRestfulApiModel<ItemArray>([]); // Example: defaults to ItemArray model
    commonViewModel = new RestfulApiViewModel(commonMockModel);
  });

  afterEach(() => {
    vi.clearAllMocks();
    if (commonViewModel) {
      commonViewModel.dispose();
    }
  });

  // This test now verifies the explicit error condition for non-RestfulApiModel types.
  it('should throw an error if model is not an instance of RestfulApiModel', () => {
    // We use a completely different class (BaseModel) to trigger the error.
    expect(
      () =>
        new RestfulApiViewModel(
          new BaseModel({
            initialData: null,
            schema: ItemSchema,
          }),
        ),
    ).toThrow('RestfulApiViewModel requires an instance of RestfulApiModel.');
  });

  it('should expose data$, isLoading$, and error$ from the model', () => {
    const testData: ItemArray = [{ id: 'test1', name: 'Test Item 1' }];
    commonMockModel.setData(testData);
    commonMockModel.setLoading(true);
    commonMockModel.setError(new Error('Test Error'));

    expect(commonViewModel.data$.get()).toEqual(testData);
    expect(commonViewModel.isLoading$.get()).toBe(true);
    expect(commonViewModel.error$.get()).toEqual(new Error('Test Error'));
  });

  describe('fetchCommand', () => {
    it('should call model.fetch without ID when executed without parameter', async () => {
      const loadingStates: boolean[] = [];
      observe(commonViewModel.isLoading$, (val) => loadingStates.push(val));

      const dataStates: (ItemArray | null)[] = [];
      observe(commonViewModel.data$, (val) => dataStates.push(val));

      await commonViewModel.fetchCommand.execute();

      expect(commonMockModel.fetch).toHaveBeenCalledWith(undefined);
      expect(commonViewModel.fetchCommand.isExecuting$.get()).toBe(false);
      expect(loadingStates).toEqual([false, true, false]);
      expect(dataStates[dataStates.length - 1]).toEqual([
        { id: '1', name: 'Item 1' },
        { id: '2', name: 'Item 2' },
      ]);
      expect(commonViewModel.error$.get()).toBeNull();
    });

    it('should call model.fetch with ID when executed with a string parameter', async () => {
      await commonViewModel.fetchCommand.execute('item-id-3');
      expect(commonMockModel.fetch).toHaveBeenCalledWith(['item-id-3']);
      expect(commonViewModel.data$.get()).toEqual({
        id: 'item-id-3',
        name: 'Fetched item-id-3',
      });
    });

    it('should call model.fetch with array of IDs when executed with an array parameter', async () => {
      await commonViewModel.fetchCommand.execute(['item-id-4', 'item-id-5']);
      expect(commonMockModel.fetch).toHaveBeenCalledWith(['item-id-4', 'item-id-5']);
      expect(commonViewModel.data$.get()).toEqual({
        id: 'item-id-4',
        name: 'Fetched item-id-4',
      });
    });

    it('should set error$ if fetch fails', async () => {
      const fetchError = new Error('Fetch failed');
      commonMockModel.fetch.mockImplementation(async () => {
        commonMockModel.setLoading(true);
        commonMockModel.setError(fetchError);
        commonMockModel.setLoading(false);
        throw fetchError;
      });

      await expect(commonViewModel.fetchCommand.execute()).rejects.toThrow(fetchError);

      expect(commonViewModel.error$.get()).toBe(fetchError);
      expect(commonViewModel.isLoading$.get()).toBe(false);
      expect(commonViewModel.fetchCommand.isExecuting$.get()).toBe(false);
    });
  });

  describe('createCommand', () => {
    const payload: Partial<Item> = { name: 'New Test Item' };

    it('should call model.create and update data$', async () => {
      commonMockModel.setData([]);
      await commonViewModel.createCommand.execute(payload);

      expect(commonMockModel.create).toHaveBeenCalledWith(payload);
      expect(commonViewModel.createCommand.isExecuting$.get()).toBe(false);
      const data = commonViewModel.data$.get();
      expect(Array.isArray(data) && data.length).toBe(1);
      expect(Array.isArray(data) && data[0].name).toBe('New Test Item');
      expect(Array.isArray(data) && data[0].id).toMatch(/^new-/);
    });

    it('should set error$ if create fails', async () => {
      const createError = new Error('Create failed');
      commonMockModel.create.mockImplementation(async () => {
        commonMockModel.setLoading(true);
        commonMockModel.setError(createError);
        commonMockModel.setLoading(false);
        throw createError;
      });

      await expect(commonViewModel.createCommand.execute(payload)).rejects.toThrow(createError);

      expect(commonViewModel.error$.get()).toBe(createError);
      expect(commonViewModel.isLoading$.get()).toBe(false);
      expect(commonViewModel.createCommand.isExecuting$.get()).toBe(false);
    });
  });

  describe('updateCommand', () => {
    const existingItem: Item = { id: '1', name: 'Original Name' };
    const payload: Partial<Item> = { name: 'Updated Name' };

    beforeEach(() => {
      // This beforeEach is scoped to 'updateCommand'
      commonMockModel.setData([existingItem]);
    });

    it('should call model.update and update data$', async () => {
      await commonViewModel.updateCommand.execute({ id: existingItem.id, payload });

      expect(commonMockModel.update).toHaveBeenCalledWith(existingItem.id, payload);
      expect(commonViewModel.updateCommand.isExecuting$.get()).toBe(false);
      const data = commonViewModel.data$.get();
      expect(Array.isArray(data) && data[0].name).toBe('Updated Name');
      expect(Array.isArray(data) && data[0].id).toBe(existingItem.id);
    });

    it('should set error$ if update fails', async () => {
      const updateError = new Error('Update failed');
      commonMockModel.update.mockImplementation(async () => {
        commonMockModel.setLoading(true);
        commonMockModel.setError(updateError);
        commonMockModel.setLoading(false);
        throw updateError;
      });

      await expect(commonViewModel.updateCommand.execute({ id: existingItem.id, payload })).rejects.toThrow(
        updateError,
      );

      expect(commonViewModel.error$.get()).toBe(updateError);
      expect(commonViewModel.isLoading$.get()).toBe(false);
      expect(commonViewModel.updateCommand.isExecuting$.get()).toBe(false);
    });
  });

  describe('deleteCommand', () => {
    const itemToDelete: Item = { id: '1', name: 'To Be Deleted' };

    beforeEach(() => {
      // Scoped to 'deleteCommand'
      commonMockModel.setData([itemToDelete, { id: '2', name: 'Keep Me' }]);
    });

    it('should call model.delete and update data$', async () => {
      await commonViewModel.deleteCommand.execute(itemToDelete.id);

      expect(commonMockModel.delete).toHaveBeenCalledWith(itemToDelete.id);
      expect(commonViewModel.deleteCommand.isExecuting$.get()).toBe(false);
      const data = commonViewModel.data$.get();
      expect(Array.isArray(data) && data.length).toBe(1);
      expect(Array.isArray(data) && data[0].id).toBe('2');
    });

    it('should set error$ if delete fails', async () => {
      const deleteError = new Error('Delete failed');
      commonMockModel.delete.mockImplementation(async () => {
        commonMockModel.setLoading(true);
        commonMockModel.setError(deleteError);
        commonMockModel.setLoading(false);
        throw deleteError;
      });

      await expect(commonViewModel.deleteCommand.execute(itemToDelete.id)).rejects.toThrow(deleteError);

      expect(commonViewModel.error$.get()).toBe(deleteError);
      expect(commonViewModel.isLoading$.get()).toBe(false);
      expect(commonViewModel.deleteCommand.isExecuting$.get()).toBe(false);
    });
  });

  describe('selectedItem$ and selectItem method', () => {
    const items: ItemArray = [
      { id: 'a', name: 'Alice' },
      { id: 'b', name: 'Bob' },
      { id: 'c', name: 'Charlie' },
    ];

    beforeEach(() => {
      // Scoped to 'selectedItem$'
      commonMockModel.setData(items);
    });

    it('should emit null initially for selectedItem$', () => {
      expect(commonViewModel.selectedItem$.get()).toBeNull();
    });

    it('should update selectedItem$ when selectItem is called with a valid ID', () => {
      commonViewModel.selectItem('b');
      expect(commonViewModel.selectedItem$.get()).toEqual(items[1]);
    });

    it('should return null for selectedItem$ if ID is not found in the array', () => {
      commonViewModel.selectItem('non-existent-id');
      expect(commonViewModel.selectedItem$.get()).toBeNull();
    });

    it('should return null for selectedItem$ if data$ is an empty array', () => {
      commonMockModel.setData([]);
      commonViewModel.selectItem('a');
      expect(commonViewModel.selectedItem$.get()).toBeNull();
    });

    it('should return null for selectedItem$ if data$ is not an array', () => {
      (commonMockModel as MockRestfulApiModel<Item | null>).setData({ id: 'single', name: 'Single Item' } as Item);
      commonViewModel.selectItem('single');
      expect(commonViewModel.selectedItem$.get()).toBeNull();
      // Reset commonMockModel if needed for other tests in this describe block
      commonMockModel.setData(items);
    });

    it('should react to changes in data$ and update selectedItem$', () => {
      commonViewModel.selectItem('a');
      expect(commonViewModel.selectedItem$.get()).toEqual(items[0]);

      const newItems: ItemArray = [
        { id: 'b', name: 'Bob' },
        { id: 'c', name: 'Charlie' },
      ];
      commonMockModel.setData(newItems);

      expect(commonViewModel.selectedItem$.get()).toBeNull();

      commonViewModel.selectItem('b');
      expect(commonViewModel.selectedItem$.get()).toEqual(newItems[0]);
    });

    it('should handle selectItem(null) to clear selection', () => {
      commonViewModel.selectItem('a');
      expect(commonViewModel.selectedItem$.get()).toEqual(items[0]);

      commonViewModel.selectItem(null);
      expect(commonViewModel.selectedItem$.get()).toBeNull();
    });
  });

  describe('dispose method', () => {
    it('should call dispose on the underlying model', () => {
      const modelDisposeSpy = vi.spyOn(commonMockModel, 'dispose');
      commonViewModel.dispose();
      expect(modelDisposeSpy).toHaveBeenCalledTimes(1);
    });

    it('should call dispose on all command instances', () => {
      const fetchDisposeSpy = vi.spyOn(commonViewModel.fetchCommand, 'dispose');
      const createDisposeSpy = vi.spyOn(commonViewModel.createCommand, 'dispose');
      const updateDisposeSpy = vi.spyOn(commonViewModel.updateCommand, 'dispose');
      const deleteDisposeSpy = vi.spyOn(commonViewModel.deleteCommand, 'dispose');

      commonViewModel.dispose();

      expect(fetchDisposeSpy).toHaveBeenCalledTimes(1);
      expect(createDisposeSpy).toHaveBeenCalledTimes(1);
      expect(updateDisposeSpy).toHaveBeenCalledTimes(1);
      expect(deleteDisposeSpy).toHaveBeenCalledTimes(1);
    });

    it('should prevent new selections after disposal', () => {
      commonViewModel.dispose();
      commonViewModel.selectItem('a');
      expect(commonViewModel.selectedItem$.get()).toBeNull();
      commonViewModel.selectItem('b');
      expect(commonViewModel.selectedItem$.get()).toBeNull();
    });
  });
});

describe('RestfulApiViewModel with Real RestfulApiModel Integration', () => {
  let mockFetcher: ReturnType<typeof vi.fn>;
  let realModel: RestfulApiModel<ItemArray, z.ZodArray<typeof ItemSchema>>;
  let viewModel: RestfulApiViewModel<ItemArray, z.ZodArray<typeof ItemSchema>>;
  const baseUrl = 'http://real-api.com';
  const endpoint = 'items';

  beforeEach(() => {
    mockFetcher = vi.fn();
    realModel = new RestfulApiModel<ItemArray, z.ZodArray<typeof ItemSchema>>({
      baseUrl,
      endpoint,
      fetcher: mockFetcher,
      schema: z.array(ItemSchema),
      initialData: null,
    });
    viewModel = new RestfulApiViewModel(realModel);
  });

  afterEach(() => {
    vi.clearAllMocks();
    viewModel.dispose();
  });

  it('should fetch data and update viewModel.data$', async () => {
    const expectedItems: ItemArray = [
      { id: '1', name: 'Item 1 from Real Model' },
      { id: '2', name: 'Item 2 from Real Model' },
    ];
    // Simplify mockFetcher to return data directly, bypassing Response object processing
    mockFetcher.mockResolvedValue(expectedItems);

    const dataEmissions: (ItemArray | null)[] = [];
    const isLoadingEmissions: boolean[] = [];
    const errorEmissions: (Error | null)[] = [];

    observe(viewModel.data$, (data) => dataEmissions.push(data));
    observe(viewModel.isLoading$, (loading) => isLoadingEmissions.push(loading));
    observe(viewModel.error$, (error) => errorEmissions.push(error));

    await viewModel.fetchCommand.execute();

    expect(mockFetcher).toHaveBeenCalledTimes(1);
    expect(mockFetcher).toHaveBeenCalledWith(`${baseUrl}/${endpoint}`, { method: 'GET' });

    // isLoading$: initial (false), loading (true), finished (false)
    expect(isLoadingEmissions).toContain(true);
    expect(isLoadingEmissions[isLoadingEmissions.length - 1]).toBe(false);

    // error$ should stay null throughout a successful fetch
    const lastError = errorEmissions.pop();
    expect(lastError === null || lastError === undefined).toBe(true);

    // data$: initial (null), then expectedItems
    expect(dataEmissions[0]).toBeNull(); // Initial value
    expect(dataEmissions[1]).toEqual(expectedItems); // Value after fetch

    expect(viewModel.fetchCommand.isExecuting$.get()).toBe(false);
  }, 10000);

  it('should set error$ on viewModel if fetcher fails', async () => {
    const apiError = new Error('API Failure');
    mockFetcher.mockRejectedValue(apiError);

    const dataEmissions: (ItemArray | null)[] = [];
    const isLoadingEmissions: boolean[] = [];
    const errorEmissions: (Error | null)[] = [];

    observe(viewModel.data$, (data) => dataEmissions.push(data));
    observe(viewModel.isLoading$, (loading) => isLoadingEmissions.push(loading));
    observe(viewModel.error$, (error) => errorEmissions.push(error));

    const initialData = viewModel.data$.get(); // Capture data before fetch

    await expect(viewModel.fetchCommand.execute()).rejects.toThrow(apiError);

    expect(mockFetcher).toHaveBeenCalledTimes(1);
    expect(mockFetcher).toHaveBeenCalledWith(`${baseUrl}/${endpoint}`, { method: 'GET' });

    // isLoading$: initial (false), loading (true), finished (false)
    expect(isLoadingEmissions).toContain(true);
    expect(isLoadingEmissions[isLoadingEmissions.length - 1]).toBe(false);

    // error$ should have emitted the apiError
    expect(errorEmissions.pop()).toBe(apiError);

    // data$ should not have received new data; its last emission should be the initial data (null)
    expect(dataEmissions[dataEmissions.length - 1]).toEqual(initialData);

    expect(viewModel.fetchCommand.isExecuting$.get()).toBe(false);
  });
});
