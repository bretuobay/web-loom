import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { z } from 'zod';
import { BehaviorSubject } from 'rxjs';
import { CachedRestfulApiModel } from '../models/CachedRestfulApiModel';
import { CachedRestfulApiViewModel } from './CachedRestfulApiViewModel';

// Define a simple schema and type for testing
const TestItemSchema = z.object({
  id: z.string(),
  value: z.string(),
});
type TestItem = z.infer<typeof TestItemSchema>;

const TestItemArraySchema = z.array(TestItemSchema);
type TestItemArray = z.infer<typeof TestItemArraySchema>;

// Mock CachedRestfulApiModel
vi.mock('../models/CachedRestfulApiModel', () => {
  return {
    CachedRestfulApiModel: vi.fn().mockImplementation(() => ({
      data$: new BehaviorSubject<any>(null),
      isLoading$: new BehaviorSubject<boolean>(false),
      error$: new BehaviorSubject<any>(null),
      query: vi.fn(() => Promise.resolve()),
      create: vi.fn(() => Promise.resolve()),
      update: vi.fn(() => Promise.resolve()),
      delete: vi.fn(() => Promise.resolve()),
      dispose: vi.fn(),
    })),
    // Ensure ExtractItemType is available if needed by the ViewModel file itself,
    // though for testing it's usually not directly an issue.
    ExtractItemType: (type: any) => type, // Simplistic mock if needed
  };
});

describe.skip('CachedRestfulApiViewModel', () => {
  let mockModelInstance: CachedRestfulApiModel<TestItemArray, typeof TestItemArraySchema>;
  let viewModel: CachedRestfulApiViewModel<TestItemArray, typeof TestItemArraySchema>;

  beforeEach(() => {
    // Create a new mock model instance for each test
    mockModelInstance = new CachedRestfulApiModel<TestItemArray, typeof TestItemArraySchema>({
      // Dummy constructor args for the mock, actual values don't matter due to mocking
      queryCore: {} as any,
      endpointKey: 'test',
      schema: TestItemArraySchema,
    });
    viewModel = new CachedRestfulApiViewModel(mockModelInstance);
  });

  afterEach(() => {
    viewModel.dispose(); // Ensure dispose is called, which should call model's dispose
    vi.clearAllMocks(); // Clear all mocks
  });

  it('should be instantiated with a CachedRestfulApiModel', () => {
    expect(viewModel).toBeInstanceOf(CachedRestfulApiViewModel);
    expect(viewModel.data$).toBe(mockModelInstance.data$);
    expect(viewModel.isLoading$).toBe(mockModelInstance.isLoading$);
    expect(viewModel.error$).toBe(mockModelInstance.error$);
  });

  it('queryCommand should call model.query', async () => {
    await viewModel.queryCommand.execute();
    expect(mockModelInstance.query).toHaveBeenCalledWith(false); // Default forceRefetch
  });

  it('queryCommand should call model.query with forceRefetch true', async () => {
    await viewModel.queryCommand.execute(true);
    expect(mockModelInstance.query).toHaveBeenCalledWith(true);
  });

  it('createCommand should call model.create', async () => {
    const payload: Partial<TestItem> = { value: 'new item' };
    await viewModel.createCommand.execute(payload);
    expect(mockModelInstance.create).toHaveBeenCalledWith(payload);
  });

  it('updateCommand should call model.update', async () => {
    const id = 'item1';
    const payload: Partial<TestItem> = { value: 'updated item' };
    await viewModel.updateCommand.execute({ id, payload });
    expect(mockModelInstance.update).toHaveBeenCalledWith(id, payload);
  });

  it('deleteCommand should call model.delete', async () => {
    const id = 'item1';
    await viewModel.deleteCommand.execute(id);
    expect(mockModelInstance.delete).toHaveBeenCalledWith(id);
  });

  it('dispose should call model.dispose and command disposals', () => {
    const queryDisposeSpy = vi.spyOn(viewModel.queryCommand, 'dispose');
    const createDisposeSpy = vi.spyOn(viewModel.createCommand, 'dispose');
    const updateDisposeSpy = vi.spyOn(viewModel.updateCommand, 'dispose');
    const deleteDisposeSpy = vi.spyOn(viewModel.deleteCommand, 'dispose');

    viewModel.dispose();

    expect(mockModelInstance.dispose).toHaveBeenCalled();
    expect(queryDisposeSpy).toHaveBeenCalled();
    expect(createDisposeSpy).toHaveBeenCalled();
    expect(updateDisposeSpy).toHaveBeenCalled();
    expect(deleteDisposeSpy).toHaveBeenCalled();
  });

  describe('selectedItem$', () => {
    const item1: TestItem = { id: '1', value: 'Item 1' };
    const item2: TestItem = { id: '2', value: 'Item 2' };
    const initialData: TestItemArray = [item1, item2];

    beforeEach(() => {
      // Resetup with a model that can emit data
      (mockModelInstance.data$ as BehaviorSubject<TestItemArray | null>).next(initialData);
    });

    it('should initially be null', (done) => {
      viewModel.selectedItem$.subscribe((selected) => {
        expect(selected).toBeNull();
        done();
      });
    });

    it('should update when selectItem is called and item exists in data$', (done) => {
      let emissionCount = 0;
      viewModel.selectedItem$.subscribe((selected) => {
        emissionCount++;
        if (emissionCount === 1) {
          expect(selected).toBeNull(); // Initial emission
        } else if (emissionCount === 2) {
          expect(selected).toEqual(item1); // After selection
          done();
        }
      });
      viewModel.selectItem('1');
    });

    it('should be null if selectedId does not match any item in data$', (done) => {
      let emissionCount = 0;
      viewModel.selectedItem$.subscribe((selected) => {
        emissionCount++;
        if (emissionCount === 1) {
          expect(selected).toBeNull();
        } else if (emissionCount === 2) {
          expect(selected).toBeNull(); // Item '3' does not exist
          done();
        }
      });
      viewModel.selectItem('3');
    });

    it('should update if data$ changes and selectedId matches a new item', (done) => {
      viewModel.selectItem('3'); // Select an ID that's not initially present

      const newItem: TestItem = { id: '3', value: 'Item 3' };
      const newData: TestItemArray = [...initialData, newItem];

      let emissionCount = 0;
      viewModel.selectedItem$.subscribe((selected) => {
        emissionCount++;
        if (emissionCount === 1) {
          // Initial from combineLatest with current _selectedItemId$
          expect(selected).toBeNull(); // '3' not in initialData
        } else if (emissionCount === 2) {
          // After data$ emits newData
          expect(selected).toEqual(newItem);
          done();
        }
      });
      // Simulate data$ update from the model
      (mockModelInstance.data$ as BehaviorSubject<TestItemArray | null>).next(newData);
    });

    it('should become null if selected item is removed from data$', (done) => {
      viewModel.selectItem('1'); // Select item1

      let emissionCount = 0;
      viewModel.selectedItem$.subscribe((selected) => {
        emissionCount++;
        if (emissionCount === 1) {
          expect(selected).toEqual(item1); // Initially selected
        } else if (emissionCount === 2) {
          expect(selected).toBeNull(); // After item1 is removed
          done();
        }
      });

      // Simulate item1 being removed from data$
      (mockModelInstance.data$ as BehaviorSubject<TestItemArray | null>).next([item2]);
    });

    it('should be null if data$ is null', (done) => {
      viewModel.selectItem('1'); // Try to select something

      let emissionCount = 0;
      viewModel.selectedItem$.subscribe((selected) => {
        emissionCount++;
        if (emissionCount === 1) {
          // initialData was set
          expect(selected).toEqual(item1);
        } else if (emissionCount === 2) {
          // data becomes null
          expect(selected).toBeNull();
          done();
        }
      });
      (mockModelInstance.data$ as BehaviorSubject<TestItemArray | null>).next(null);
    });
  });
});
