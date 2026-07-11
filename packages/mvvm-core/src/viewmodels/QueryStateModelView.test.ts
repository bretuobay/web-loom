import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { z } from 'zod';
import { signal, observe } from '@web-loom/signals-core';
import { IQueryStateModel } from '../models/QueryStateModel';
import { QueryStateModelView } from './QueryStateModelView';

// Define a simple Zod schema for testing
const ItemSchema = z.object({
  id: z.string(),
  name: z.string(),
});
type Item = z.infer<typeof ItemSchema>;
const ItemArraySchema = z.array(ItemSchema);
type ItemArray = z.infer<typeof ItemArraySchema>;

// Mock QueryStateModel
class MockQueryStateModel<TData, TModelSchema extends ZodSchema<TData>> implements IQueryStateModel<
  TData,
  TModelSchema
> {
  public _data$ = signal<TData | null>(null);
  public _isLoading$ = signal<boolean>(false);
  public _error$ = signal<any>(null);
  public _isError$ = signal<boolean>(false); // from BaseModel

  public readonly data$ = this._data$.asReadonly();
  public readonly isLoading$ = this._isLoading$.asReadonly();
  public readonly error$ = this._error$.asReadonly();
  public readonly isError$ = this._isError$.asReadonly(); // from BaseModel

  // Explicitly define schema property
  public schema: TModelSchema;

  constructor(initialData: TData | null, schema: TModelSchema) {
    // Schema is now required and typed
    this._data$.set(initialData);
    this.schema = schema;
  }

  refetch = vi.fn(async (force?: boolean) => {
    this._isLoading$.set(true);
    // Simulate some data fetching
    this._data$.set(this._data$.peek()); // Or new data
    this._isLoading$.set(false);
  });

  invalidate = vi.fn(async () => {
    this._isLoading$.set(true);
    this._data$.set(null); // Simulate data being cleared
    this._isLoading$.set(false);
  });

  dispose = vi.fn();

  // Mocked BaseModel methods if necessary for type compatibility
  setData = vi.fn((data: TData | null) => this._data$.set(data));
  setLoading = vi.fn((loading: boolean) => this._isLoading$.set(loading));
  setError = vi.fn((error: any) => {
    this._error$.set(error);
    this._isError$.set(!!error);
  });
  clearError = vi.fn(() => {
    this._error$.set(null);
    this._isError$.set(false);
  });
  validate = vi.fn((data: TData) => {
    // Schema should directly handle array or single item
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
    expect(() => new QueryStateModelView(null as any)).toThrow(
      'QueryStateModelView requires a valid model instance that implements IQueryStateModel.',
    );
    expect(() => new QueryStateModelView({} as any)).toThrow(
      'QueryStateModelView requires a valid model instance that implements IQueryStateModel.',
    );
  });

  it('should expose data$, isLoading$, and error$ from the model', async () => {
    const testData: ItemArray = [{ id: 'test1', name: 'Test Item 1' }];
    mockModel._data$.set(testData);
    mockModel._isLoading$.set(true);
    mockModel._error$.set(new Error('Test Error'));

    expect(viewModel.data$.get()).toEqual(testData);
    expect(viewModel.isLoading$.get()).toBe(true);
    expect(viewModel.error$.get()).toEqual(new Error('Test Error'));
  });

  describe('refetchCommand', () => {
    it('should call model.refetch with force=undefined when executed without parameter', async () => {
      await viewModel.refetchCommand.execute(undefined); // Explicitly pass undefined
      expect(mockModel.refetch).toHaveBeenCalledWith(undefined);
      expect(viewModel.refetchCommand.isExecuting$.get()).toBe(false);
    });

    it('should call model.refetch with force=false when executed with force=false parameter', async () => {
      await viewModel.refetchCommand.execute(false);
      expect(mockModel.refetch).toHaveBeenCalledWith(false);
      expect(viewModel.refetchCommand.isExecuting$.get()).toBe(false);
    });

    it('should call model.refetch with force=true when executed with force=true parameter', async () => {
      await viewModel.refetchCommand.execute(true);
      expect(mockModel.refetch).toHaveBeenCalledWith(true);
      expect(viewModel.refetchCommand.isExecuting$.get()).toBe(false);
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
      expect(viewModel.refetchCommand.isExecuting$.get()).toBe(false);
      errorSubscription();
    });
  });

  describe('invalidateCommand', () => {
    it('should call model.invalidate when executed', async () => {
      await viewModel.invalidateCommand.execute();
      expect(mockModel.invalidate).toHaveBeenCalledTimes(1);
      expect(viewModel.invalidateCommand.isExecuting$.get()).toBe(false);
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
      expect(viewModel.invalidateCommand.isExecuting$.get()).toBe(false);
      errorSubscription();
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
      expect(viewModel.selectedItem$.get()).toBeNull();
    });

    it('should update selectedItem$ when selectItem is called with a valid ID', async () => {
      viewModel.selectItem('b');
      expect(viewModel.selectedItem$.get()).toEqual(items[1]);
    });

    it('should clear selection when selectItem is called with null', async () => {
      // Initial state of selectedItem$ is null (due to startWith(null)).
      // Select 'a'
      viewModel.selectItem('a');
      expect(viewModel.selectedItem$.get()).toEqual(items[0]);

      // Select null (clear selection)
      viewModel.selectItem(null);
      expect(viewModel.selectedItem$.get()).toBeNull();
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
      expect(singleItemViewModel.selectedItem$.get()).toBeNull();
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

    it('should clear selection and ignore new selections after dispose', () => {
      viewModel.dispose();
      viewModel.selectItem('a');
      expect(viewModel.selectedItem$.get()).toBeNull();
    });
  });

  // Addressing "skipped tests" - these tests will verify command functionality
  // as they pertain to a cached context (refetch/invalidate)
  describe('Verification of command functionality (simulating "skipped tests" context)', () => {
    it('refetchCommand should be executable and update loading state (simulates a test for fetch-like ops)', async () => {
      mockModel._isLoading$.set(false); // Start not loading

      let resolveRefetch: () => void;
      const refetchPromise = new Promise<void>((r) => {
        resolveRefetch = () => r();
      });
      mockModel.refetch.mockImplementationOnce(() => {
        mockModel._isLoading$.set(true); // Simulate model starting to load
        return refetchPromise;
      });

      const executionStates: boolean[] = [];
      const sub = observe(viewModel.refetchCommand.isExecuting$, (state) => executionStates.push(state));

      const execPromise = viewModel.refetchCommand.execute();

      await vi.waitFor(() => {
        expect(executionStates).toContain(true);
      });
      expect(executionStates[executionStates.length - 1]).toBe(true);
      expect(mockModel._isLoading$.peek()).toBe(true); // Access underlying BehaviorSubject

      resolveRefetch!();
      await execPromise;
      mockModel._isLoading$.set(false); // Simulate model finishing loading

      expect(executionStates[executionStates.length - 1]).toBe(false);
      expect(mockModel._isLoading$.peek()).toBe(false);
      expect(mockModel.refetch).toHaveBeenCalled();
      sub();
    });

    it('invalidateCommand should be executable and potentially clear data (simulates a test for CUD-related cache ops)', async () => {
      const initialData: ItemArray = [{ id: '1', name: 'Cache Me' }];
      mockModel._data$.set(initialData);
      expect(viewModel.data$.get()).toEqual(initialData);

      let resolveInvalidate: () => void;
      const invalidatePromise = new Promise<void>((r) => {
        resolveInvalidate = () => r();
      });
      mockModel.invalidate.mockImplementationOnce(() => {
        mockModel._isLoading$.set(true); // Simulate model starting to load
        mockModel._data$.set(null); // Simulate data clearing as per original mock's intent
        return invalidatePromise;
      });

      const executionStates: boolean[] = [];
      const sub = observe(viewModel.invalidateCommand.isExecuting$, (state) => executionStates.push(state));

      const execPromise = viewModel.invalidateCommand.execute();

      await vi.waitFor(() => {
        expect(executionStates).toContain(true);
      });
      expect(executionStates[executionStates.length - 1]).toBe(true);
      expect(mockModel._isLoading$.peek()).toBe(true); // Access underlying BehaviorSubject

      resolveInvalidate!();
      await execPromise;
      mockModel._isLoading$.set(false); // Simulate model finishing loading

      expect(executionStates[executionStates.length - 1]).toBe(false);
      expect(mockModel._isLoading$.peek()).toBe(false);
      expect(mockModel.invalidate).toHaveBeenCalled();
      expect(viewModel.data$.get()).toBeNull(); // Mock invalidate sets data to null
      sub();
    });
  });
});
