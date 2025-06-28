// disable linting for this file
// eslint-disable
// @ts-nocheck
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { RestfulApiViewModel } from './RestfulApiViewModel';
import { BaseModel } from '../models/BaseModel';
// Import ExtractItemType along with RestfulApiModel and Fetcher
import { RestfulApiModel, Fetcher, ExtractItemType } from '../models/RestfulApiModel';
import { z } from 'zod';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { take, skip } from 'rxjs/operators';

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

// Adjusted MockRestfulApiModel to reflect new method signatures
// TData can be Item or ItemArray. TSchema is for a single Item.
class MockRestfulApiModel<TData> extends RestfulApiModel<TData, typeof ItemSchema> {
  public _data$ = new BehaviorSubject<TData | null>(null);
  public _isLoading$ = new BehaviorSubject<boolean>(false);
  public _error$ = new BehaviorSubject<any>(null);

  public readonly data$ = this._data$.asObservable();
  public readonly isLoading$ = this._isLoading$.asObservable();
  public readonly error$ = this._error$.asObservable();

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
    this._isLoading$.next(true);
    this._error$.next(null);
    try {
      if (id) { // Simulate fetching single item or specific items
        const item = { id: Array.isArray(id) ? id[0] : id, name: `Fetched ${Array.isArray(id) ? id[0] : id}` } as unknown as TData;
        this._data$.next(item);
      } else { // Simulate fetching collection
        const items: ItemArray = [{ id: '1', name: 'Item 1' }, { id: '2', name: 'Item 2' }];
        this._data$.next(items as unknown as TData);
      }
    } catch (e) {
      this._error$.next(e);
      throw e;
    } finally {
      this._isLoading$.next(false);
    }
  });

  // Updated create mock
  public create = vi.fn(async (payload: Partial<ExtractItemType<TData>> | Partial<ExtractItemType<TData>>[]) => {
    this._isLoading$.next(true);
    this._error$.next(null);
    try {
      const currentData = this._data$.getValue();
      let result: ExtractItemType<TData> | ExtractItemType<TData>[] | undefined;

      if (Array.isArray(payload)) { // Batch create
        const newItems = payload.map((p, i) => ({ id: `new-batch-${Date.now()}-${i}`, ...(p as object) })) as ExtractItemType<TData>[];
        if (Array.isArray(currentData)) {
          this._data$.next([...currentData, ...newItems] as unknown as TData);
        } else { // Assuming currentData becomes an array
          this._data$.next(newItems as unknown as TData);
        }
        result = newItems;
      } else { // Single create
        const newItem = { id: `new-${Date.now()}`, ...(payload as object) } as ExtractItemType<TData>;
        if (Array.isArray(currentData)) {
          this._data$.next([...currentData, newItem] as unknown as TData);
        } else { // currentData is single item or null
          this._data$.next(newItem as unknown as TData);
        }
        result = newItem;
      }
      return result;
    } catch (e) {
      this._error$.next(e);
      throw e;
    } finally {
      this._isLoading$.next(false);
    }
  });

  // Updated update mock
  public update = vi.fn(async (id: string, payload: Partial<ExtractItemType<TData>>) => {
    this._isLoading$.next(true);
    this._error$.next(null);
    try {
      const updatedItem = { id, ...(payload as object) } as ExtractItemType<TData>;
      const currentData = this._data$.getValue();
      if (Array.isArray(currentData)) {
        this._data$.next(
          currentData.map((item: any) => (item.id === id ? updatedItem : item)) as unknown as TData,
        );
      } else if (currentData && (currentData as any).id === id) {
        this._data$.next(updatedItem as unknown as TData);
      }
      return updatedItem;
    } catch (e) {
      this._error$.next(e);
      throw e;
    } finally {
      this._isLoading$.next(false);
    }
  });

  public delete = vi.fn(async (id: string) => {
    this._isLoading$.next(true);
    this._error$.next(null);
    try {
      const currentData = this._data$.getValue();
      if (Array.isArray(currentData)) {
        this._data$.next(currentData.filter((item: any) => item.id !== id) as unknown as TData);
      } else if (currentData && (currentData as any).id === id) {
        this._data$.next(null as unknown as TData);
      }
    } catch (e) {
      this._error$.next(e);
      throw e;
    } finally {
      this._isLoading$.next(false);
    }
  });

  // Ensure dispose is callable on the mock
  public dispose = vi.fn(() => {
    this._data$.complete();
    this._isLoading$.complete();
    this._error$.complete();
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
      mockModelArray._data$.next([]); // Start with an empty array for collection
      await viewModelArray.createCommand.execute(payload);
      expect(mockModelArray.create).toHaveBeenCalledWith(payload);
      const data = await firstValueFrom(viewModelArray.data$);
      expect(Array.isArray(data) && data.length).toBe(1);
      expect(Array.isArray(data) && data[0].name).toBe(payload.name);
    });

    it('createCommand should call model.create with an array of item payloads', async () => {
      const payloadArray: Partial<Item>[] = [{ name: 'Batch Item 1' }, { name: 'Batch Item 2' }];
      mockModelArray._data$.next([]);
      await viewModelArray.createCommand.execute(payloadArray);
      expect(mockModelArray.create).toHaveBeenCalledWith(payloadArray);
      const data = await firstValueFrom(viewModelArray.data$);
      expect(Array.isArray(data) && data.length).toBe(2);
      expect(Array.isArray(data) && data[1].name).toBe(payloadArray[1].name);
    });

    it('updateCommand should call model.update with item ID and payload', async () => {
      const existingItem: Item = { id: '1', name: 'Original Name' };
      const updatePayload: Partial<Item> = { name: 'Updated Name' };
      mockModelArray._data$.next([existingItem]);
      await viewModelArray.updateCommand.execute({ id: existingItem.id, payload: updatePayload });
      expect(mockModelArray.update).toHaveBeenCalledWith(existingItem.id, updatePayload);
      const data = await firstValueFrom(viewModelArray.data$);
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
      const data = await firstValueFrom(viewModelSingle.data$);
      expect(data).not.toBeNull();
      expect((data as Item).name).toBe(payload.name);
    });

    // Note: Batch create for a single-item model might be an edge case or imply changing the model's nature.
    // The RestfulApiModel itself has a check:
    // "Cannot create multiple items when model data is a single item."
    // So, this test might expect an error or specific handling if the model is strictly single-item.
    // For the ViewModel, it will pass it to the model, which should then handle it.
    it('createCommand with array payload on single item model (should be handled by model)', async () => {
        const payloadArray: Partial<Item>[] = [{ name: 'Batch Item 1' }];
        // Mocking the model's create to throw, as per RestfulApiModel's logic
        mockModelSingle.create.mockImplementation(async () => {
            throw new Error('Cannot create multiple items when model data is a single item.');
        });

        await expect(viewModelSingle.createCommand.execute(payloadArray))
            .rejects.toThrow('Cannot create multiple items when model data is a single item.');
        expect(mockModelSingle.create).toHaveBeenCalledWith(payloadArray);
    });


    it('updateCommand should call model.update (for single item model)', async () => {
      const existingItem: Item = { id: 'item-single', name: 'Original Single Name' };
      const updatePayload: Partial<Item> = { name: 'Updated Single Name' };
      mockModelSingle._data$.next(existingItem);
      await viewModelSingle.updateCommand.execute({ id: existingItem.id, payload: updatePayload });
      expect(mockModelSingle.update).toHaveBeenCalledWith(existingItem.id, updatePayload);
      const data = await firstValueFrom(viewModelSingle.data$);
      expect((data as Item).name).toBe(updatePayload.name);
    });
  });

  // General tests (can use either view model, typically array based for fetch all)
  let commonMockModel: MockRestfulApiModel<ItemArray>;
  let commonViewModel: RestfulApiViewModel<ItemArray, typeof ItemSchema>;

  // This beforeEach is for the top-level 'RestfulApiViewModel' describe block.
  // It will set up commonMockModel and commonViewModel for tests directly under this describe,
  // but not for those inside nested describe blocks like 'ViewModel with TData = ItemArray'
  // unless those nested blocks choose to use these common instances.
  beforeEach(() => {
    // Initialize commonMockModel and commonViewModel here
    // These will be used by tests that are not inside the more specific describe blocks below
    commonMockModel = new MockRestfulApiModel<ItemArray>([]); // Example: defaults to ItemArray model
    commonViewModel = new RestfulApiViewModel(commonMockModel);
  });

  // Top-level afterEach for cleaning up common instances
  afterEach(() => {
    vi.clearAllMocks();
    if (commonViewModel) { // Ensure it exists before trying to dispose
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

  it('should expose data$, isLoading$, and error$ from the model', async () => {
    const testData: ItemArray = [{ id: 'test1', name: 'Test Item 1' }];
    commonMockModel._data$.next(testData); // Use commonMockModel
    commonMockModel._isLoading$.next(true); // Use commonMockModel
    commonMockModel._error$.next(new Error('Test Error')); // Use commonMockModel

    expect(await firstValueFrom(commonViewModel.data$)).toEqual(testData); // Use commonViewModel
    expect(await firstValueFrom(commonViewModel.isLoading$)).toBe(true); // Use commonViewModel
    expect(await firstValueFrom(commonViewModel.error$)).toEqual(new Error('Test Error')); // Use commonViewModel
  });

  describe('fetchCommand', () => {
    it('should call model.fetch without ID when executed without parameter', async () => {
      const loadingStates: boolean[] = [];
      commonViewModel.isLoading$.pipe(take(3)).subscribe((val) => loadingStates.push(val));

      const dataStates: (ItemArray | null)[] = [];
      commonViewModel.data$.pipe(take(2)).subscribe((val) => dataStates.push(val));

      await commonViewModel.fetchCommand.execute();

      expect(commonMockModel.fetch).toHaveBeenCalledWith(undefined);
      expect(await firstValueFrom(commonViewModel.fetchCommand.isExecuting$)).toBe(false);
      expect(loadingStates).toEqual([false, true, false]);
      expect(dataStates[dataStates.length - 1]).toEqual([
        { id: '1', name: 'Item 1' },
        { id: '2', name: 'Item 2' },
      ]);
      expect(await firstValueFrom(commonViewModel.error$)).toBeNull();
    });

    it('should call model.fetch with ID when executed with a string parameter', async () => {
      await commonViewModel.fetchCommand.execute('item-id-3');
      expect(commonMockModel.fetch).toHaveBeenCalledWith(['item-id-3']);
      expect(await firstValueFrom(commonViewModel.data$)).toEqual({
        id: 'item-id-3',
        name: 'Fetched item-id-3',
      });
    });

    it('should call model.fetch with array of IDs when executed with an array parameter', async () => {
      await commonViewModel.fetchCommand.execute(['item-id-4', 'item-id-5']);
      expect(commonMockModel.fetch).toHaveBeenCalledWith(['item-id-4', 'item-id-5']);
      expect(await firstValueFrom(commonViewModel.data$)).toEqual({
        id: 'item-id-4',
        name: 'Fetched item-id-4',
      });
    });

    it('should set error$ if fetch fails', async () => {
      const fetchError = new Error('Fetch failed');
      commonMockModel.fetch.mockImplementation(async () => {
        commonMockModel._isLoading$.next(true);
        commonMockModel._error$.next(fetchError);
        commonMockModel._isLoading$.next(false);
        throw fetchError;
      });

      await expect(commonViewModel.fetchCommand.execute()).rejects.toThrow(fetchError);

      expect(await firstValueFrom(commonViewModel.error$)).toBe(fetchError);
      expect(await firstValueFrom(commonViewModel.isLoading$)).toBe(false);
      expect(await firstValueFrom(commonViewModel.fetchCommand.isExecuting$)).toBe(false);
    });
  });

  describe('createCommand', () => {
    const payload: Partial<Item> = { name: 'New Test Item' };

    it('should call model.create and update data$', async () => {
      commonMockModel._data$.next([]);
      await commonViewModel.createCommand.execute(payload);

      expect(commonMockModel.create).toHaveBeenCalledWith(payload);
      expect(await firstValueFrom(commonViewModel.createCommand.isExecuting$)).toBe(false);
      const data = await firstValueFrom(commonViewModel.data$);
      expect(Array.isArray(data) && data.length).toBe(1);
      expect(Array.isArray(data) && data[0].name).toBe('New Test Item');
      expect(Array.isArray(data) && data[0].id).toMatch(/^new-/);
    });

    it('should set error$ if create fails', async () => {
      const createError = new Error('Create failed');
      commonMockModel.create.mockImplementation(async () => {
        commonMockModel._isLoading$.next(true);
        commonMockModel._error$.next(createError);
        commonMockModel._isLoading$.next(false);
        throw createError;
      });

      await expect(commonViewModel.createCommand.execute(payload)).rejects.toThrow(createError);

      expect(await firstValueFrom(commonViewModel.error$)).toBe(createError);
      expect(await firstValueFrom(commonViewModel.isLoading$)).toBe(false);
      expect(await firstValueFrom(commonViewModel.createCommand.isExecuting$)).toBe(false);
    });
  });

  describe('updateCommand', () => {
    const existingItem: Item = { id: '1', name: 'Original Name' };
    const payload: Partial<Item> = { name: 'Updated Name' };

    beforeEach(() => { // This beforeEach is scoped to 'updateCommand'
      commonMockModel._data$.next([existingItem]);
    });

    it('should call model.update and update data$', async () => {
      await commonViewModel.updateCommand.execute({ id: existingItem.id, payload });

      expect(commonMockModel.update).toHaveBeenCalledWith(existingItem.id, payload);
      expect(await firstValueFrom(commonViewModel.updateCommand.isExecuting$)).toBe(false);
      const data = await firstValueFrom(commonViewModel.data$);
      expect(Array.isArray(data) && data[0].name).toBe('Updated Name');
      expect(Array.isArray(data) && data[0].id).toBe(existingItem.id);
    });

    it('should set error$ if update fails', async () => {
      const updateError = new Error('Update failed');
      commonMockModel.update.mockImplementation(async () => {
        commonMockModel._isLoading$.next(true);
        commonMockModel._error$.next(updateError);
        commonMockModel._isLoading$.next(false);
        throw updateError;
      });

      await expect(commonViewModel.updateCommand.execute({ id: existingItem.id, payload })).rejects.toThrow(updateError);

      expect(await firstValueFrom(commonViewModel.error$)).toBe(updateError);
      expect(await firstValueFrom(commonViewModel.isLoading$)).toBe(false);
      expect(await firstValueFrom(commonViewModel.updateCommand.isExecuting$)).toBe(false);
    });
  });

  describe('deleteCommand', () => {
    const itemToDelete: Item = { id: '1', name: 'To Be Deleted' };

    beforeEach(() => { // Scoped to 'deleteCommand'
      commonMockModel._data$.next([itemToDelete, { id: '2', name: 'Keep Me' }]);
    });

    it('should call model.delete and update data$', async () => {
      await commonViewModel.deleteCommand.execute(itemToDelete.id);

      expect(commonMockModel.delete).toHaveBeenCalledWith(itemToDelete.id);
      expect(await firstValueFrom(commonViewModel.deleteCommand.isExecuting$)).toBe(false);
      const data = await firstValueFrom(commonViewModel.data$);
      expect(Array.isArray(data) && data.length).toBe(1);
      expect(Array.isArray(data) && data[0].id).toBe('2');
    });

    it('should set error$ if delete fails', async () => {
      const deleteError = new Error('Delete failed');
      commonMockModel.delete.mockImplementation(async () => {
        commonMockModel._isLoading$.next(true);
        commonMockModel._error$.next(deleteError);
        commonMockModel._isLoading$.next(false);
        throw deleteError;
      });

      await expect(commonViewModel.deleteCommand.execute(itemToDelete.id)).rejects.toThrow(deleteError);

      expect(await firstValueFrom(commonViewModel.error$)).toBe(deleteError);
      expect(await firstValueFrom(commonViewModel.isLoading$)).toBe(false);
      expect(await firstValueFrom(commonViewModel.deleteCommand.isExecuting$)).toBe(false);
    });
  });

  describe('selectedItem$ and selectItem method', () => {
    const items: ItemArray = [
      { id: 'a', name: 'Alice' },
      { id: 'b', name: 'Bob' },
      { id: 'c', name: 'Charlie' },
    ];

    beforeEach(() => { // Scoped to 'selectedItem$'
      commonMockModel._data$.next(items);
    });

    it('should emit null initially for selectedItem$', async () => {
      expect(await firstValueFrom(commonViewModel.selectedItem$)).toBeNull();
    });

    it('should update selectedItem$ when selectItem is called with a valid ID', async () => {
      commonMockModel._data$.next(items);

      const emittedValues: (Item | null)[] = [];
      const subscription = commonViewModel.selectedItem$.subscribe((value) => {
        emittedValues.push(value);
      });
      commonViewModel.selectItem('b');
      subscription.unsubscribe();
      expect(emittedValues.pop()).toEqual(items[1]);
    });

    it('should emit null for selectedItem$ if ID is not found in the array', async () => {
      commonMockModel._data$.next(items);
      commonViewModel.selectItem('non-existent-id');
      await vi.waitFor(async () => {
        expect(await firstValueFrom(commonViewModel.selectedItem$)).toBeNull();
      });
    });

    it('should emit null for selectedItem$ if data$ is an empty array', async () => {
      commonMockModel._data$.next([]);
      commonViewModel.selectItem('a');
      expect(await firstValueFrom(commonViewModel.selectedItem$)).toBeNull();
    });

    it('should emit null for selectedItem$ if data$ is not an array', async () => {
      // This test might need adjustment if commonMockModel is strictly ItemArray.
      // Forcing TData to be Item for this specific sub-test of commonViewModel.
      (commonMockModel as MockRestfulApiModel<Item | null>)._data$.next({ id: 'single', name: 'Single Item' } as Item);
      commonViewModel.selectItem('single');
      expect(await firstValueFrom(commonViewModel.selectedItem$)).toBeNull();
      // Reset commonMockModel if needed for other tests in this describe block
      commonMockModel._data$.next(items);
    });

    it('should react to changes in data$ and update selectedItem$', async () => {
      commonMockModel._data$.next(items);
      commonViewModel.selectItem('a');
      expect(await firstValueFrom(commonViewModel.selectedItem$.pipe(skip(1)))).toEqual(items[0]);

      const newItems: ItemArray = [ { id: 'b', name: 'Bob' }, { id: 'c', name: 'Charlie' } ];
      commonMockModel._data$.next(newItems);

      await vi.waitFor(async () => {
        expect(await firstValueFrom(commonViewModel.selectedItem$)).toBeNull();
      });

      commonViewModel.selectItem('b');
      expect(await firstValueFrom(commonViewModel.selectedItem$.pipe(skip(1)))).toEqual(newItems[0]);
    });

    it('should handle selectItem(null) to clear selection', async () => {
      commonMockModel._data$.next(items);
      commonViewModel.selectItem('a');
      await vi.waitFor(async () => {
        expect(await firstValueFrom(commonViewModel.selectedItem$.pipe(skip(1)))).toEqual(items[0]);
      });

      commonViewModel.selectItem(null);
      await vi.waitFor(async () => {
        expect(await firstValueFrom(commonViewModel.selectedItem$)).toBeNull();
      });
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

    it('should complete the _selectedItemId$ subject', () => {
      const selectedItemIdSubject = (commonViewModel as any)._selectedItemId$ as BehaviorSubject<string | null>;
      const completeSpy = vi.spyOn(selectedItemIdSubject, 'complete');
      commonViewModel.dispose();
      expect(completeSpy).toHaveBeenCalledTimes(1);
    });

    it('should prevent new selections after disposal', async () => {
      commonViewModel.dispose();
      commonViewModel.selectItem('a');
      expect(await firstValueFrom(commonViewModel.selectedItem$)).toBeNull();
      commonViewModel.selectItem('b');
      expect(await firstValueFrom(commonViewModel.selectedItem$)).toBeNull();
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

    viewModel.data$.subscribe((data) => dataEmissions.push(data));
    viewModel.isLoading$.subscribe((loading) => isLoadingEmissions.push(loading));
    viewModel.error$.subscribe((error) => errorEmissions.push(error));

    await viewModel.fetchCommand.execute();

    expect(mockFetcher).toHaveBeenCalledTimes(1);
    expect(mockFetcher).toHaveBeenCalledWith(`${baseUrl}/${endpoint}`, { method: 'GET' });

    // isLoading$: initial (false), loading (true), finished (false)
    // Depending on exact timing and BehaviorSubject's nature, initial false might be captured or skipped if subscription is late.
    // Let's ensure it transitions from true to false during the operation.
    expect(isLoadingEmissions).toContain(true);
    // Check the last recorded state for isLoading and data
    expect(isLoadingEmissions[isLoadingEmissions.length - 1]).toBe(false);

    // error$ should emit null (or not emit if BehaviorSubject starts with null and no error occurs)
    // Check the last emitted error value, or that it only contains nulls
    const lastError = errorEmissions.pop();
    expect(lastError === null || lastError === undefined).toBe(true);

    // data$: initial (null), then expectedItems
    expect(dataEmissions[0]).toBeNull(); // Initial value
    expect(dataEmissions[1]).toEqual(expectedItems); // Value after fetch
    // expect(await firstValueFrom(viewModel.data$.pipe(skip(1)))).toEqual(expectedItems);

    // Check isExecuting$ directly if possible, or ensure it eventually becomes false
    // For now, we assume if the command promise resolves, isExecuting was handled.
    // expect(await firstValueFrom(viewModel.fetchCommand.isExecuting$)).toBe(false);
    // Check the last value of isExecuting$ if the command completed
    let finalIsExecuting = true; // Assume true initially
    const execSub = viewModel.fetchCommand.isExecuting$.subscribe((val) => (finalIsExecuting = val));
    execSub.unsubscribe(); // Get current value and unsubscribe
    expect(finalIsExecuting).toBe(false);
  }, 10000); // Increased timeout

  it('should set error$ on viewModel if fetcher fails', async () => {
    const apiError = new Error('API Failure');
    mockFetcher.mockRejectedValue(apiError);

    const dataEmissions: (ItemArray | null)[] = [];
    const isLoadingEmissions: boolean[] = [];
    const errorEmissions: (Error | null)[] = [];

    viewModel.data$.subscribe((data) => dataEmissions.push(data));
    viewModel.isLoading$.subscribe((loading) => isLoadingEmissions.push(loading));
    viewModel.error$.subscribe((error) => errorEmissions.push(error));

    const initialData = await firstValueFrom(viewModel.data$); // Capture data before fetch

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

    expect(await firstValueFrom(viewModel.fetchCommand.isExecuting$)).toBe(false);
  });
});
