/// <reference types="vitest/globals" />
import { RestfulTodoViewModel } from './RestfulTodoViewModel';
import { RestfulTodoListModel } from '../models/RestfulTodoModel';
import { RestfulTodoData } from '../models/RestfulTodoSchema';
import { vi, describe, it, expect, beforeEach, Mock, afterEach } from 'vitest'; // Using vitest/jest like syntax
import { BehaviorSubject } from 'rxjs';
import { firstValueFrom } from 'rxjs';

// Type-only import for RestfulTodoData to be used in the mock factory.
// This helps ensure that only type information is pulled in here, reducing hoisting issues.
import type { RestfulTodoData as ImportedRestfulTodoData } from '../models/RestfulTodoSchema';

vi.mock('../models/RestfulTodoModel', () => {
  // This factory function is hoisted.
  // It should be self-contained or rely on imports that are also hoisted correctly (like top-level imports).

  const mockModelInstance = {
    // Use the top-level imported BehaviorSubject and RestfulTodoData type
    data$: new BehaviorSubject<ImportedRestfulTodoData[] | null>(null),
    isLoading$: new BehaviorSubject<boolean>(false),
    error$: new BehaviorSubject<any>(null),
    fetch: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    dispose: vi.fn(),
  };

  return {
    // Provide the RestfulTodoListModel constructor mock.
    // This is what the ViewModel will call: new RestfulTodoListModel(...).
    RestfulTodoListModel: vi.fn(() => mockModelInstance),
    // We are not including other exports from '../models/RestfulTodoModel' here
    // to keep the mock focused and avoid potential issues with those other exports
    // if they were causing the hoisting problem (e.g. if 'RestfulTodoModel' class itself had issues).
    // The test file primarily uses RestfulTodoListModel.
  };
});

// The rest of the file (imports for the test itself, describe blocks, etc.) remains the same.
// For example, the test file will still have its own:
// import { RestfulTodoListModel } from '../models/RestfulTodoModel';
// but this import will now resolve to the mocked constructor provided above.

describe('RestfulTodoViewModel', () => {
  let viewModel: RestfulTodoViewModel;
  let mockModelInstance: ReturnType<Mock<any>>; // Instance of the mocked model

  const todo1: RestfulTodoData = {
    id: '1',
    text: 'Todo 1',
    isCompleted: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const todo2: RestfulTodoData = {
    id: '2',
    text: 'Todo 2',
    isCompleted: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    // Get the mocked instance that will be used by the ViewModel constructor
    // This relies on the mock setup where RestfulTodoListModel constructor returns a shared mock instance
    // For more robust mocking, you might adjust the mock factory or use a DI approach.
    // For now, let's assume the mock factory provides the instance.
    // We need to access the *instance* that the ViewModel will use.
    const MockedModel = RestfulTodoListModel as Mock;
    MockedModel.mockClear(); // Clear any previous instantiation history

    // Create a fresh instance of the ViewModel, which will in turn create a new mock model instance via the vi.mock factory
    viewModel = new RestfulTodoViewModel(new RestfulTodoListModel({} as any));

    // Access the *latest* mocked instance that was created by the ViewModel's constructor
    mockModelInstance = MockedModel.mock.results[MockedModel.mock.results.length - 1].value;

    // Reset states of observables in the mock model instance for each test
    mockModelInstance.data$.next(null);
    mockModelInstance.isLoading$.next(false);
    mockModelInstance.error$.next(null);
    mockModelInstance.fetch.mockReset();
    mockModelInstance.create.mockReset();
    mockModelInstance.update.mockReset();
    mockModelInstance.delete.mockReset();
    mockModelInstance.dispose.mockReset();
  });

  afterEach(() => {
    viewModel.dispose();
  });

  it('should initialize and proxy observables from model', async () => {
    mockModelInstance.data$.next([todo1]);
    mockModelInstance.isLoading$.next(true);
    mockModelInstance.error$.next({ message: 'Test Error' });

    expect(await firstValueFrom(viewModel.todos$)).toEqual([todo1]);
    expect(await firstValueFrom(viewModel.isLoading$)).toBe(true);
    expect(await firstValueFrom(viewModel.error$)).toEqual({
      message: 'Test Error',
    });
  });

  it('fetchCommand should call model.fetch', async () => {
    mockModelInstance.fetch.mockResolvedValueOnce(undefined);
    await viewModel.fetchCommand.execute();
    expect(mockModelInstance.fetch).toHaveBeenCalledTimes(1);
  });

  it('addTodoCommand should call model.create', async () => {
    const newTodoPayload = { text: 'New Todo', isCompleted: false };
    const createdTodo = {
      ...newTodoPayload,
      id: '3',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockModelInstance.create.mockResolvedValueOnce(createdTodo);

    const result = await viewModel.addTodoCommand.execute(newTodoPayload);
    expect(mockModelInstance.create).toHaveBeenCalledWith(newTodoPayload);
    expect(result).toEqual(createdTodo);
  });

  it('updateTodoCommand should call model.update', async () => {
    const updatePayload = { text: 'Updated' };
    const updatedTodo = { ...todo1, ...updatePayload };
    mockModelInstance.update.mockResolvedValueOnce(updatedTodo);

    const result = await viewModel.updateTodoCommand.execute({
      id: todo1.id,
      payload: updatePayload,
    });
    expect(mockModelInstance.update).toHaveBeenCalledWith(todo1.id, updatePayload);
    expect(result).toEqual(updatedTodo);
  });

  it('deleteCommand should call model.delete', async () => {
    mockModelInstance.delete.mockResolvedValueOnce(undefined);
    await viewModel.deleteCommand.execute(todo1.id);
    expect(mockModelInstance.delete).toHaveBeenCalledWith(todo1.id);
  });

  it('toggleTodoCompletion should call updateTodoCommand', async () => {
    mockModelInstance.data$.next([todo1]); // Ensure todo1 is in the data$
    // Mock the behavior of update (which is called by updateTodoCommand)
    mockModelInstance.update.mockImplementation(async (id: string, payload: any) => {
      if (id === todo1.id && typeof payload.isCompleted === 'boolean') {
        return { ...todo1, isCompleted: payload.isCompleted };
      }
      return undefined;
    });

    // Spy on the ViewModel's own command execute method
    const updateSpy = vi.spyOn(viewModel.updateTodoCommand, 'execute');

    await viewModel.toggleTodoCompletion(todo1.id);

    expect(updateSpy).toHaveBeenCalledWith({
      id: todo1.id,
      payload: { isCompleted: !todo1.isCompleted },
    });
    updateSpy.mockRestore();
  });

  it('selectItem should update selectedItem$ observable', async () => {
    mockModelInstance.data$.next([todo1, todo2]); // Model has data

    viewModel.selectItem(todo1.id);
    expect(await firstValueFrom(viewModel.selectedItem$)).toEqual(todo1);

    viewModel.selectItem(todo2.id);
    expect(await firstValueFrom(viewModel.selectedItem$)).toEqual(todo2);

    viewModel.selectItem(null);
    expect(await firstValueFrom(viewModel.selectedItem$)).toBeNull();
  });

  it('dispose should call model.dispose and dispose commands', () => {
    const addTodoDisposeSpy = vi.spyOn(viewModel.addTodoCommand, 'dispose');
    const updateTodoDisposeSpy = vi.spyOn(viewModel.updateTodoCommand, 'dispose');
    // Base commands (fetch, create, update, delete) are also disposed, can spy if needed

    viewModel.dispose();

    expect(mockModelInstance.dispose).toHaveBeenCalledTimes(1);
    expect(addTodoDisposeSpy).toHaveBeenCalledTimes(1);
    expect(updateTodoDisposeSpy).toHaveBeenCalledTimes(1);
  });
});
