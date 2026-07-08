import { describe, it, beforeEach, expect, afterEach, vi } from 'vitest';

import { BaseViewModel } from './BaseViewModel';
import { BaseModel } from '../models/BaseModel';
import { Command } from '../commands/Command';
import { z, ZodError } from 'zod';
import { signal } from '@web-loom/signals-core';

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

  it('should initialize with null data, not loading, and no error from model', () => {
    expect(viewModel.data$.get()).toBeNull();
    expect(viewModel.isLoading$.get()).toBe(false);
    expect(viewModel.error$.get()).toBeNull();
    expect(viewModel.validationErrors$.get()).toBeNull();
  });

  it('should expose data$ from the model', () => {
    const testData = { id: '1', name: 'Test' };
    mockModel.setData(testData);
    expect(viewModel.data$.get()).toEqual(testData);
  });

  it('should expose isLoading$ from the model', () => {
    mockModel.setLoading(true);
    expect(viewModel.isLoading$.get()).toBe(true);

    mockModel.setLoading(false);
    expect(viewModel.isLoading$.get()).toBe(false);
  });

  it('should expose error$ from the model', () => {
    const testError = new Error('ViewModel error');
    mockModel.setError(testError);
    expect(viewModel.error$.get()).toEqual(testError);

    mockModel.clearError();
    expect(viewModel.error$.get()).toBeNull();
  });

  it('should derive validationErrors$ from model error$ if it is a ZodError', () => {
    const nonZodError = new Error('Generic error');
    const zodError = new ZodError([]); // Create a simple ZodError instance

    // Initially null
    expect(viewModel.validationErrors$.get()).toBeNull();

    // Set generic error, validationErrors$ should remain null
    mockModel.setError(nonZodError);
    expect(viewModel.validationErrors$.get()).toBeNull();

    // Set ZodError, validationErrors$ should update
    mockModel.setError(zodError);
    expect(viewModel.validationErrors$.get()).toBe(zodError);

    // Clear error, validationErrors$ should become null again
    mockModel.clearError();
    expect(viewModel.validationErrors$.get()).toBeNull();
  });

  it('should run registered teardowns on dispose', () => {
    const source = signal('value1');
    const emittedValues: string[] = [];
    const unsubscribe = source.subscribe((val) => emittedValues.push(val));

    // Register the teardown with the ViewModel for disposal
    viewModel['addSubscription'](unsubscribe);

    source.set('value2');
    expect(emittedValues).toEqual(['value2']);

    viewModel.dispose();

    // After dispose the subscription is torn down — no more deliveries
    source.set('value3');
    expect(emittedValues).toEqual(['value2']);
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

      this.cmd1 = this.registerCommand(new Command(async () => 'result1')) as Command<void, string>;

      this.cmd2 = this.registerCommand(new Command(async () => 'result2')) as Command<void, string>;
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

    it('should dispose commands before running teardowns', () => {
      const disposeOrder: string[] = [];

      const disposeSpy = vi.spyOn(viewModel.cmd1 as any, 'dispose').mockImplementation(() => {
        disposeOrder.push('command');
      });

      (viewModel as any).addSubscription(() => disposeOrder.push('teardown'));

      viewModel.dispose();

      expect(disposeOrder).toEqual(['command', 'teardown']);

      disposeSpy.mockRestore();
    });
  });

  describe('integration with existing disposal', () => {
    it('should dispose both teardowns and commands', () => {
      const source = signal(0);
      const teardownSpy = vi.fn();
      const unsubscribe = source.subscribe(() => {});
      (viewModel as any).addSubscription(() => {
        unsubscribe();
        teardownSpy();
      });

      const cmdDisposeSpy = vi.spyOn(viewModel.cmd1 as any, 'dispose');

      viewModel.dispose();

      expect(teardownSpy).toHaveBeenCalled();
      expect(cmdDisposeSpy).toHaveBeenCalled();
    });
  });
});
