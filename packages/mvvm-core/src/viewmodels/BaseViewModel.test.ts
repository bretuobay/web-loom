import { describe, it, beforeEach, expect, afterEach, vi } from 'vitest';

import { BaseViewModel } from './BaseViewModel';
import { BaseModel } from '../models/BaseModel';
import { Command } from '../commands/Command';
import { z, ZodError } from 'zod';
import { first, skip, takeUntil } from 'rxjs/operators';
import { Observable } from 'rxjs';

// Define a test model and schema
const TestSchema = z.object({
  id: z.string(),
  name: z.string(),
});
type TestDataType = z.infer<typeof TestSchema>;

class MockBaseModel extends BaseModel<TestDataType, typeof TestSchema> {
  constructor(initialData: TestDataType | null = null) {
    super({
      initialData,
      schema: TestSchema,
    });
  }
}

describe('BaseViewModel', () => {
  let mockModel: MockBaseModel;
  let viewModel: BaseViewModel<MockBaseModel>;

  beforeEach(() => {
    mockModel = new MockBaseModel();
    viewModel = new BaseViewModel(mockModel);
  });

  afterEach(() => {
    viewModel.dispose(); // Ensure dispose is called after each test
  });

  it('should initialize with null data, not loading, and no error from model', async () => {
    expect(await viewModel.data$.pipe(first()).toPromise()).toBeNull();
    expect(await viewModel.isLoading$.pipe(first()).toPromise()).toBe(false);
    expect(await viewModel.error$.pipe(first()).toPromise()).toBeNull();
    expect(await viewModel.validationErrors$.pipe(first()).toPromise()).toBeNull();
  });

  it('should expose data$ from the model', async () => {
    const testData = { id: '1', name: 'Test' };
    mockModel.setData(testData);
    expect(await viewModel.data$.pipe(first()).toPromise()).toEqual(testData);
  });

  it('should expose isLoading$ from the model', async () => {
    mockModel.setLoading(true);
    expect(await viewModel.isLoading$.pipe(first()).toPromise()).toBe(true);

    mockModel.setLoading(false);
    expect(await viewModel.isLoading$.pipe(first()).toPromise()).toBe(false);
  });

  it('should expose error$ from the model', async () => {
    const testError = new Error('ViewModel error');
    mockModel.setError(testError);
    expect(await viewModel.error$.pipe(first()).toPromise()).toEqual(testError);

    mockModel.clearError();
    expect(await viewModel.error$.pipe(first()).toPromise()).toBeNull();
  });

  it('should derive validationErrors$ from model error$ if it is a ZodError', async () => {
    const nonZodError = new Error('Generic error');
    const zodError = new ZodError([]); // Create a simple ZodError instance

    // Initially null
    expect(await viewModel.validationErrors$.pipe(first()).toPromise()).toBeNull();

    // Set generic error, validationErrors$ should remain null
    mockModel.setError(nonZodError);
    expect(await viewModel.validationErrors$.pipe(first()).toPromise()).toBeNull();

    // Set ZodError, validationErrors$ should update
    mockModel.setError(zodError);
    expect(await viewModel.validationErrors$.pipe(skip(1), first()).toPromise()).toBe(zodError);

    // Clear error, validationErrors$ should become null again
    mockModel.clearError();
    expect(await viewModel.validationErrors$.pipe(first()).toPromise()).toBeNull();
  });

  it('should call dispose and unsubscribe from all subscriptions', async () => {
    const mockObservable = new Observable<string>((subscriber) => {
      subscriber.next('value1');
      subscriber.next('value2');
      setTimeout(() => subscriber.next('value3'), 100);
    });

    const emittedValues: string[] = [];
    const subscription = mockObservable
      .pipe(takeUntil(viewModel['_destroy$']))
      .subscribe((val) => emittedValues.push(val));

    // Add subscription to ViewModel for disposal
    viewModel['addSubscription'](subscription);

    expect(emittedValues).toEqual(['value1', 'value2']);

    viewModel.dispose();

    await new Promise((resolve) => setTimeout(resolve, 150));

    expect(emittedValues).toEqual(['value1', 'value2']);
    expect(subscription.closed).toBe(true);
  });

  it('should throw an error if model is not provided to constructor', () => {
    // @ts-ignore - Intentionally test invalid constructor argument
    expect(() => new BaseViewModel(null)).toThrow(
      'BaseViewModel requires an instance of BaseModel in its constructor.',
    );
  });
});

describe('BaseViewModel Command Registration', () => {
  let model: MockBaseModel;
  let viewModel: TestViewModel;

  class TestViewModel extends BaseViewModel<MockBaseModel> {
    public readonly cmd1: Command<void, string>;
    public readonly cmd2: Command<void, string>;

    constructor(model: MockBaseModel) {
      super(model);

      this.cmd1 = this.registerCommand(new Command(async () => 'result1'));

      this.cmd2 = this.registerCommand(new Command(async () => 'result2'));
    }

    // Expose for testing
    public getRegisteredCommandCount(): number {
      return (this as any)._registeredCommands.length;
    }
  }

  beforeEach(() => {
    model = new MockBaseModel();
    viewModel = new TestViewModel(model);
  });

  afterEach(() => {
    viewModel.dispose();
  });

  describe('registerCommand', () => {
    it('should return the same command for chaining', () => {
      const cmd = new Command(async () => {});
      const registered = (viewModel as any).registerCommand(cmd);
      expect(registered).toBe(cmd);
    });

    it('should track registered commands', () => {
      expect(viewModel.getRegisteredCommandCount()).toBe(2);
    });

    it('should allow command execution after registration', async () => {
      const result = await viewModel.cmd1.execute();
      expect(result).toBe('result1');
    });

    it('should register multiple commands independently', async () => {
      const result1 = await viewModel.cmd1.execute();
      const result2 = await viewModel.cmd2.execute();

      expect(result1).toBe('result1');
      expect(result2).toBe('result2');
    });
  });

  describe('dispose with commands', () => {
    it('should dispose all registered commands', () => {
      const disposeSpy1 = vi.spyOn(viewModel.cmd1 as any, 'dispose');
      const disposeSpy2 = vi.spyOn(viewModel.cmd2 as any, 'dispose');

      viewModel.dispose();

      expect(disposeSpy1).toHaveBeenCalled();
      expect(disposeSpy2).toHaveBeenCalled();
    });

    it('should clear command array after disposal', () => {
      viewModel.dispose();
      expect(viewModel.getRegisteredCommandCount()).toBe(0);
    });

    it('should handle commands without dispose gracefully', () => {
      // Create a mock command without dispose
      const cmdWithoutDispose = {
        canExecute$: {} as any,
        isExecuting$: {} as any,
        executeError$: {} as any,
        execute: async () => {},
      };

      (viewModel as any)._registeredCommands.push(cmdWithoutDispose);

      // Should not throw
      expect(() => viewModel.dispose()).not.toThrow();
    });

    it('should prevent command execution after disposal', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      viewModel.dispose();

      const result = await viewModel.cmd1.execute();

      expect(result).toBeUndefined();
      expect(consoleSpy).toHaveBeenCalledWith('Command is disposed. Cannot execute.');

      consoleSpy.mockRestore();
    });

    it('should dispose commands before completing observables', () => {
      const disposeOrder: string[] = [];

      const disposeSpy = vi.spyOn(viewModel.cmd1 as any, 'dispose').mockImplementation(() => {
        disposeOrder.push('command');
      });

      const destroySpy = vi.spyOn(viewModel['_destroy$'], 'next').mockImplementation(() => {
        disposeOrder.push('destroy');
      });

      viewModel.dispose();

      expect(disposeOrder).toEqual(['command', 'destroy']);

      disposeSpy.mockRestore();
      destroySpy.mockRestore();
    });
  });

  describe('integration with existing disposal', () => {
    it('should dispose both subscriptions and commands', () => {
      const mockObservable = new Observable<string>((subscriber) => {
        subscriber.next('value');
      });

      const subscription = mockObservable.subscribe();
      (viewModel as any).addSubscription(subscription);

      const cmdDisposeSpy = vi.spyOn(viewModel.cmd1 as any, 'dispose');

      viewModel.dispose();

      expect(subscription.closed).toBe(true);
      expect(cmdDisposeSpy).toHaveBeenCalled();
    });
  });
});
