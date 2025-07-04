import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { z } from 'zod';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { skip, filter, take } from 'rxjs/operators';
import { QueryStateModel, IQueryStateModel, ExtractItemType } from '../models/QueryStateModel';
import { QueryStateModelView } from './QueryStateModelView';
import { Command } from '../commands/Command'; // For spy checks if needed

// Define a simple Zod schema for testing
const ItemSchema = z.object({
  id: z.string(),
  name: z.string(),
});
type Item = z.infer<typeof ItemSchema>;
const ItemArraySchema = z.array(ItemSchema);
type ItemArray = z.infer<typeof ItemArraySchema>;

// Mock QueryStateModel
class MockQueryStateModel<TData, TModelSchema extends ZodSchema<TData>> implements IQueryStateModel<TData, TModelSchema> {
  public _data$ = new BehaviorSubject<TData | null>(null);
  public _isLoading$ = new BehaviorSubject<boolean>(false);
  public _error$ = new BehaviorSubject<any>(null);
  public _isError$ = new BehaviorSubject<boolean>(false); // from BaseModel

  public readonly data$ = this._data$.asObservable();
  public readonly isLoading$ = this._isLoading$.asObservable();
  public readonly error$ = this._error$.asObservable();
  public readonly isError$ = this._isError$.asObservable(); // from BaseModel

  // Explicitly define schema property
  public schema: TModelSchema;


  constructor(initialData: TData | null, schema: TModelSchema) { // Schema is now required and typed
    this._data$.next(initialData);
    this.schema = schema;
  }

  refetch = vi.fn(async (force?: boolean) => {
    this._isLoading$.next(true);
    // Simulate some data fetching
    this._data$.next(this._data$.value); // Or new data
    this._isLoading$.next(false);
  });

  invalidate = vi.fn(async () => {
    this._isLoading$.next(true);
    this._data$.next(null); // Simulate data being cleared
    this._isLoading$.next(false);
  });

  dispose = vi.fn(() => {
    this._data$.complete();
    this._isLoading$.complete();
    this._error$.complete();
    this._isError$.complete();
  });

  // Mocked BaseModel methods if necessary for type compatibility
  setData = vi.fn((data: TData | null) => this._data$.next(data));
  setLoading = vi.fn((loading: boolean) => this._isLoading$.next(loading));
  setError = vi.fn((error: any) => {
    this._error$.next(error);
    this._isError$.next(!!error);
  });
  clearError = vi.fn(() => {
    this._error$.next(null);
    this._isError$.next(false);
  });
  validate = vi.fn((data: TData) => { // Schema should directly handle array or single item
    return this.schema.parse(data) as unknown as TData;
  });
}

describe('QueryStateModelView', () => {
  // Typedef for the schema instances
  type ItemArraySchemaType = typeof ItemArraySchema;
  type ItemSchemaType = typeof ItemSchema;

  let mockModel: MockQueryStateModel<ItemArray | null, ItemArraySchemaType>;
  let viewModel: QueryStateModelView<ItemArray | null, ItemArraySchemaType>;

  beforeEach(() => {
    // Default to ItemArray model for most tests
    mockModel = new MockQueryStateModel<ItemArray | null, ItemArraySchemaType>([], ItemArraySchema);
    viewModel = new QueryStateModelView<ItemArray | null, ItemArraySchemaType>(mockModel);
  });

  afterEach(() => {
    vi.clearAllMocks();
    viewModel.dispose();
  });

  it('should throw an error if model is invalid', () => {
    expect(() => new QueryStateModelView(null as any)).toThrow('QueryStateModelView requires a valid model instance that implements IQueryStateModel.');
    expect(() => new QueryStateModelView({} as any)).toThrow('QueryStateModelView requires a valid model instance that implements IQueryStateModel.');
  });

  it('should expose data$, isLoading$, and error$ from the model', async () => {
    const testData: ItemArray = [{ id: 'test1', name: 'Test Item 1' }];
    mockModel._data$.next(testData);
    mockModel._isLoading$.next(true);
    mockModel._error$.next(new Error('Test Error'));

    expect(await firstValueFrom(viewModel.data$)).toEqual(testData);
    expect(await firstValueFrom(viewModel.isLoading$)).toBe(true);
    expect(await firstValueFrom(viewModel.error$)).toEqual(new Error('Test Error'));
  });

  describe('refetchCommand', () => {
    it('should call model.refetch with force=undefined when executed without parameter', async () => {
      await viewModel.refetchCommand.execute(undefined); // Explicitly pass undefined
      expect(mockModel.refetch).toHaveBeenCalledWith(undefined);
      expect(await firstValueFrom(viewModel.refetchCommand.isExecuting$)).toBe(false);
    });

    it('should call model.refetch with force=false when executed with force=false parameter', async () => {
      await viewModel.refetchCommand.execute(false);
      expect(mockModel.refetch).toHaveBeenCalledWith(false);
      expect(await firstValueFrom(viewModel.refetchCommand.isExecuting$)).toBe(false);
    });

    it('should call model.refetch with force=true when executed with force=true parameter', async () => {
      await viewModel.refetchCommand.execute(true);
      expect(mockModel.refetch).toHaveBeenCalledWith(true);
      expect(await firstValueFrom(viewModel.refetchCommand.isExecuting$)).toBe(false);
    });

    it('should set error$ on command if model.refetch fails', async () => {
      const refetchError = new Error('Refetch failed');
      mockModel.refetch.mockRejectedValueOnce(refetchError);

      mockModel.refetch.mockRejectedValueOnce(refetchError);

      // console.log('Debug refetchCommand:', viewModel.refetchCommand);
      // console.log('Debug refetchCommand.executeError$:', viewModel.refetchCommand?.executeError$);
      expect(viewModel.refetchCommand).toBeDefined();
      expect(viewModel.refetchCommand.executeError$).toBeDefined();

      const errorSpy = vi.fn();
      const errorSubscription = viewModel.refetchCommand.executeError$.subscribe(errorSpy);

      await expect(viewModel.refetchCommand.execute()).rejects.toThrow(refetchError);

      expect(errorSpy).toHaveBeenCalledWith(refetchError);
      expect(await firstValueFrom(viewModel.refetchCommand.isExecuting$)).toBe(false);
      errorSubscription.unsubscribe();
    });
  });

  describe('invalidateCommand', () => {
    it('should call model.invalidate when executed', async () => {
      await viewModel.invalidateCommand.execute();
      expect(mockModel.invalidate).toHaveBeenCalledTimes(1);
      expect(await firstValueFrom(viewModel.invalidateCommand.isExecuting$)).toBe(false);
    });

    it('should set error$ on command if model.invalidate fails', async () => {
      const invalidateError = new Error('Invalidate failed');
      mockModel.invalidate.mockRejectedValueOnce(invalidateError);

      // console.log('Debug invalidateCommand:', viewModel.invalidateCommand);
      // console.log('Debug invalidateCommand.executeError$:', viewModel.invalidateCommand?.executeError$);
      expect(viewModel.invalidateCommand).toBeDefined();
      expect(viewModel.invalidateCommand.executeError$).toBeDefined();

      const errorSpy = vi.fn();
      const errorSubscription = viewModel.invalidateCommand.executeError$.subscribe(errorSpy);

      await expect(viewModel.invalidateCommand.execute()).rejects.toThrow(invalidateError);

      expect(errorSpy).toHaveBeenCalledWith(invalidateError);
      expect(await firstValueFrom(viewModel.invalidateCommand.isExecuting$)).toBe(false);
      errorSubscription.unsubscribe();
    });
  });

  describe('selectedItem$ and selectItem method (for TData = ItemArray)', () => {
    const items: ItemArray = [
      { id: 'a', name: 'Alice' },
      { id: 'b', name: 'Bob' },
    ];

    beforeEach(() => {
      // Ensure the model is set up for ItemArray for these tests
      mockModel = new MockQueryStateModel<ItemArray | null>(items, ItemArraySchema);
      viewModel = new QueryStateModelView(mockModel);
    });

    it('should emit null initially for selectedItem$', async () => {
      expect(await firstValueFrom(viewModel.selectedItem$)).toBeNull();
    });

    it('should update selectedItem$ when selectItem is called with a valid ID', async () => {
      viewModel.selectItem('b');
      // Skip the initial `null` from startWith(null)
      expect(await firstValueFrom(viewModel.selectedItem$.pipe(skip(1)))).toEqual(items[1]);
    });

    it('should clear selection when selectItem is called with null', async () => {
      // Initial state of selectedItem$ is null (due to startWith(null)).
      // Select 'a'
      viewModel.selectItem('a');
      // Wait for selectedItem$ to become items[0] and then check it
      const selectedA = await firstValueFrom(viewModel.selectedItem$.pipe(filter(item => !!item && item.id === items[0].id), take(1)));
      expect(selectedA).toEqual(items[0]);

      // Select null (clear selection)
      viewModel.selectItem(null);
      // Wait for selectedItem$ to become null again.
      // The previous value was items[0], so this new null is a distinct emission.
      const selectedNull = await firstValueFrom(viewModel.selectedItem$.pipe(filter(item => item === null), take(1)));
      expect(selectedNull).toBeNull();
    });
  });

  describe('ViewModel with TData = Item (single item model)', () => {
    let singleItemModel: MockQueryStateModel<Item | null, ItemSchemaType>;
    let singleItemViewModel: QueryStateModelView<Item | null, ItemSchemaType>;
    const singleItem: Item = { id: 'single', name: 'Single Item Only' };

    beforeEach(() => {
      singleItemModel = new MockQueryStateModel<Item | null, ItemSchemaType>(singleItem, ItemSchema);
      singleItemViewModel = new QueryStateModelView<Item | null, ItemSchemaType>(singleItemModel);
    });

    afterEach(() => {
        singleItemViewModel.dispose();
    });

    it('refetchCommand should call model.refetch (for single item model)', async () => {
      await singleItemViewModel.refetchCommand.execute(true);
      expect(singleItemModel.refetch).toHaveBeenCalledWith(true);
    });

    it('invalidateCommand should call model.invalidate (for single item model)', async () => {
      await singleItemViewModel.invalidateCommand.execute();
      expect(singleItemModel.invalidate).toHaveBeenCalledTimes(1);
    });

    it('selectedItem$ should be null if data is not an array', async () => {
        singleItemViewModel.selectItem('single'); // Attempt to select
        expect(await firstValueFrom(singleItemViewModel.selectedItem$)).toBeNull();
    });
  });


  describe('dispose method', () => {
    it('should call dispose on the underlying model', () => {
      viewModel.dispose();
      expect(mockModel.dispose).toHaveBeenCalledTimes(1);
    });

    it('should call dispose on command instances', () => {
      const refetchDisposeSpy = vi.spyOn(viewModel.refetchCommand, 'dispose');
      const invalidateDisposeSpy = vi.spyOn(viewModel.invalidateCommand, 'dispose');

      viewModel.dispose();

      expect(refetchDisposeSpy).toHaveBeenCalledTimes(1);
      expect(invalidateDisposeSpy).toHaveBeenCalledTimes(1);
    });

    it('should complete the _selectedItemId$ subject', () => {
      const selectedItemIdSubject = (viewModel as any)._selectedItemId$ as BehaviorSubject<string | null>;
      const completeSpy = vi.spyOn(selectedItemIdSubject, 'complete');
      viewModel.dispose();
      expect(completeSpy).toHaveBeenCalledTimes(1);
    });
  });

  // Addressing "skipped tests" - these tests will verify command functionality
  // as they pertain to a cached context (refetch/invalidate)
  describe('Verification of command functionality (simulating "skipped tests" context)', () => {
    it('refetchCommand should be executable and update loading state (simulates a test for fetch-like ops)', async () => {
        mockModel._isLoading$.next(false); // Start not loading

        let resolveRefetch: () => void;
        const refetchPromise = new Promise<void>(r => { resolveRefetch = () => r(); });
        mockModel.refetch.mockImplementationOnce(() => {
          mockModel._isLoading$.next(true); // Simulate model starting to load
          return refetchPromise;
        });

        const executionStates: boolean[] = [];
        const sub = viewModel.refetchCommand.isExecuting$.subscribe(state => executionStates.push(state));

        const execPromise = viewModel.refetchCommand.execute();

        await vi.waitFor(() => {
            expect(executionStates).toContain(true);
        });
        expect(executionStates[executionStates.length - 1]).toBe(true);
        expect(mockModel._isLoading$.getValue()).toBe(true); // Access underlying BehaviorSubject

        resolveRefetch!();
        await execPromise;
        mockModel._isLoading$.next(false); // Simulate model finishing loading

        expect(executionStates[executionStates.length - 1]).toBe(false);
        expect(mockModel._isLoading$.getValue()).toBe(false);
        expect(mockModel.refetch).toHaveBeenCalled();
        sub.unsubscribe();
    });

    it('invalidateCommand should be executable and potentially clear data (simulates a test for CUD-related cache ops)', async () => {
        const initialData: ItemArray = [{ id: '1', name: 'Cache Me' }];
        mockModel._data$.next(initialData);
        expect(await firstValueFrom(viewModel.data$)).toEqual(initialData);

        let resolveInvalidate: () => void;
        const invalidatePromise = new Promise<void>(r => { resolveInvalidate = () => r(); });
        mockModel.invalidate.mockImplementationOnce(() => {
          mockModel._isLoading$.next(true); // Simulate model starting to load
          mockModel._data$.next(null); // Simulate data clearing as per original mock's intent
          return invalidatePromise;
        });

        const executionStates: boolean[] = [];
        const sub = viewModel.invalidateCommand.isExecuting$.subscribe(state => executionStates.push(state));

        const execPromise = viewModel.invalidateCommand.execute();

        await vi.waitFor(() => {
            expect(executionStates).toContain(true);
        });
        expect(executionStates[executionStates.length - 1]).toBe(true);
        expect(mockModel._isLoading$.getValue()).toBe(true); // Access underlying BehaviorSubject

        resolveInvalidate!();
        await execPromise;
        mockModel._isLoading$.next(false); // Simulate model finishing loading

        expect(executionStates[executionStates.length - 1]).toBe(false);
        expect(mockModel._isLoading$.getValue()).toBe(false);
        expect(mockModel.invalidate).toHaveBeenCalled();
        expect(await firstValueFrom(viewModel.data$)).toBeNull(); // Mock invalidate sets data to null
        sub.unsubscribe();
    });
  });
});
