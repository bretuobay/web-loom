import { vi, describe, beforeEach, afterEach, it, expect } from 'vitest';
import { signal, observe } from '@web-loom/signals-core';
import { Command } from './Command';

describe('Command', () => {
  // @ts-ignore
  let mockExecuteFn: vi.Mock;
  let command: Command<string, string>;

  beforeEach(() => {
    mockExecuteFn = vi.fn(async (param: string) => `Executed: ${param}`);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with canExecute$ true, isExecuting$ false, and no error', () => {
    command = new Command(mockExecuteFn);
    expect(command.canExecute$.get()).toBe(true);
    expect(command.isExecuting$.get()).toBe(false);
    expect(command.executeError$.get()).toBeNull();
  });

  it('should throw error if executeFn is not a function', () => {
    // @ts-ignore
    expect(() => new Command(null)).toThrow('Command requires an executeFn that is a function.');
  });

  it('should execute the function and update states correctly', async () => {
    command = new Command(mockExecuteFn);
    const param = 'test_param';

    const isExecutingStates: boolean[] = [];
    observe(command.isExecuting$, (val) => isExecutingStates.push(val));

    const canExecuteStates: boolean[] = [];
    observe(command.canExecute$, (val) => canExecuteStates.push(val));

    const executionPromise = command.execute(param);

    // State flips synchronously at the start of execute()
    expect(isExecutingStates).toEqual([false, true]); // Initial false, then true
    // CanExecute should be false while executing
    expect(canExecuteStates).toEqual([true, false]); // Initial true, then false

    const result = await executionPromise;

    // Expect states after execution
    expect(result).toBe('Executed: test_param');
    expect(mockExecuteFn).toHaveBeenCalledWith(param);
    expect(command.isExecuting$.get()).toBe(false); // Back to false
    expect(command.canExecute$.get()).toBe(true); // Back to true
    expect(command.executeError$.get()).toBeNull(); // No error
  });

  it('should set executeError$ if execution fails', async () => {
    const error = new Error('Execution failed');
    mockExecuteFn.mockRejectedValue(error);
    command = new Command(mockExecuteFn);

    await expect(command.execute('param')).rejects.toThrow(error);

    expect(command.isExecuting$.get()).toBe(false);
    expect(command.canExecute$.get()).toBe(true);
    expect(command.executeError$.get()).toBe(error);
  });

  describe('canExecute$ with signal condition', () => {
    let canExecuteSignal: ReturnType<typeof signal<boolean>>;

    beforeEach(() => {
      canExecuteSignal = signal(true);
      command = new Command(mockExecuteFn, canExecuteSignal.asReadonly());
    });

    it('should respect the canExecute signal', () => {
      expect(command.canExecute$.get()).toBe(true);

      canExecuteSignal.set(false);
      expect(command.canExecute$.get()).toBe(false);

      canExecuteSignal.set(true);
      expect(command.canExecute$.get()).toBe(true);
    });

    it('should not execute if canExecute is false', async () => {
      canExecuteSignal.set(false);
      const result = await command.execute('param');

      expect(mockExecuteFn).not.toHaveBeenCalled();
      expect(result).toBeUndefined(); // Command returns undefined if not executable
      expect(command.isExecuting$.get()).toBe(false);
      expect(command.executeError$.get()).toBeNull();
    });

    it('should return false for canExecute$ while executing', async () => {
      canExecuteSignal.set(true); // Can execute
      const canExecuteStates: boolean[] = [];
      observe(command.canExecute$, (val) => canExecuteStates.push(val));

      const promise = command.execute('param');

      expect(canExecuteStates).toEqual([true, false]); // True initially, then false during execution
      await promise;
      expect(canExecuteStates).toEqual([true, false, true]); // Back to true after execution
    });

    it('should still be false for canExecute$ if the signal is false even if not executing', () => {
      canExecuteSignal.set(false);
      expect(command.canExecute$.get()).toBe(false);
    });
  });

  it('should support a plain function as the canExecute condition (auto-tracked signal reads)', () => {
    const gate = signal(false);
    command = new Command(mockExecuteFn, () => gate.get());

    expect(command.canExecute$.get()).toBe(false);
    gate.set(true);
    expect(command.canExecute$.get()).toBe(true);
  });

  it('should reject with a specific error if canExecute is not a signal or function', () => {
    // @ts-ignore
    expect(() => new Command(mockExecuteFn, 123)).toThrow(
      'canExecute must be a ReadonlySignal<boolean> or a function returning boolean.',
    );
  });

  describe('dispose', () => {
    let commandWithDefaultCanExecute: Command<string, string>;
    let commandWithExternalCanExecute: Command<string, string>;
    let externalCanExecute: ReturnType<typeof signal<boolean>>;
    // @ts-ignore
    let mockExecuteFnDispose: vi.Mock;

    beforeEach(() => {
      mockExecuteFnDispose = vi.fn(async (param: string) => `Executed: ${param}`);
      externalCanExecute = signal(true);

      commandWithDefaultCanExecute = new Command(mockExecuteFnDispose);
      commandWithExternalCanExecute = new Command(mockExecuteFnDispose, externalCanExecute.asReadonly());
    });

    it('should not allow execution and return undefined if execute is called after disposal', async () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      commandWithDefaultCanExecute.dispose(); // Dispose first

      const result = await commandWithDefaultCanExecute.execute('test');

      expect(result).toBeUndefined(); // Should return undefined as per dispose logic
      expect(mockExecuteFnDispose).not.toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith('Command is disposed. Cannot execute.');
      consoleLogSpy.mockRestore();
    });

    it('should not emit further values on isExecuting$, executeError$ after disposal', async () => {
      const isExecutingSpy = vi.fn();
      const executeErrorSpy = vi.fn();

      commandWithDefaultCanExecute.isExecuting$.subscribe(isExecutingSpy);
      commandWithDefaultCanExecute.executeError$.subscribe(executeErrorSpy);

      commandWithDefaultCanExecute.dispose();

      // execute() is a no-op after disposal, so no state transitions occur
      await commandWithDefaultCanExecute.execute('test');

      expect(isExecutingSpy).not.toHaveBeenCalled();
      expect(executeErrorSpy).not.toHaveBeenCalled();
    });

    it('external canExecute source stays usable after the command is disposed', () => {
      commandWithExternalCanExecute.dispose();

      // The external signal is owned by the caller and is not disposed with the command
      externalCanExecute.set(false);
      expect(externalCanExecute.get()).toBe(false);
      externalCanExecute.set(true);
      expect(externalCanExecute.get()).toBe(true);
    });
  });
});

describe('Command Fluent API', () => {
  describe('observesProperty', () => {
    it('should return this for chaining', () => {
      const cmd = new Command(async () => {});
      const property = signal('value');

      const result = cmd.observesProperty(property);

      expect(result).toBe(cmd);
    });

    it('should update canExecute$ when property changes to truthy', () => {
      const property = signal('');
      const cmd = new Command(async () => {}).observesProperty(property);

      // Initially falsy
      expect(cmd.canExecute$.get()).toBe(false);

      // Change to truthy
      property.set('value');
      expect(cmd.canExecute$.get()).toBe(true);
    });

    it('should update canExecute$ when property changes to falsy', () => {
      const property = signal('value');
      const cmd = new Command(async () => {}).observesProperty(property);

      // Initially truthy
      expect(cmd.canExecute$.get()).toBe(true);

      // Change to falsy
      property.set('');
      expect(cmd.canExecute$.get()).toBe(false);
    });

    it('should support multiple observed properties', () => {
      const prop1 = signal('value1');
      const prop2 = signal('');
      const cmd = new Command(async () => {}).observesProperty(prop1).observesProperty(prop2);

      // One falsy = cannot execute
      expect(cmd.canExecute$.get()).toBe(false);

      // Both truthy = can execute
      prop2.set('value2');
      expect(cmd.canExecute$.get()).toBe(true);

      // One becomes falsy again
      prop1.set('');
      expect(cmd.canExecute$.get()).toBe(false);
    });

    it('should handle numeric properties with truthy check', () => {
      const number = signal(0);
      const cmd = new Command(async () => {}).observesProperty(number);

      // 0 is falsy
      expect(cmd.canExecute$.get()).toBe(false);

      // Non-zero is truthy
      number.set(5);
      expect(cmd.canExecute$.get()).toBe(true);
    });

    it('should not observe property on disposed command', () => {
      const cmd = new Command(async () => {});
      const property = signal('value');
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      cmd.dispose();
      cmd.observesProperty(property);

      expect(consoleSpy).toHaveBeenCalledWith('Cannot observe property on disposed Command');
      consoleSpy.mockRestore();
    });
  });

  describe('observesCanExecute', () => {
    it('should return this for chaining', () => {
      const cmd = new Command(async () => {});
      const condition = signal(true);

      const result = cmd.observesCanExecute(condition);

      expect(result).toBe(cmd);
    });

    it('should combine with existing canExecute', () => {
      const baseCanExecute = signal(true);
      const additionalCondition = signal(false);

      const cmd = new Command(async () => {}, baseCanExecute.asReadonly()).observesCanExecute(additionalCondition);

      // Additional is false
      expect(cmd.canExecute$.get()).toBe(false);

      // Both true
      additionalCondition.set(true);
      expect(cmd.canExecute$.get()).toBe(true);

      // Base becomes false
      baseCanExecute.set(false);
      expect(cmd.canExecute$.get()).toBe(false);
    });

    it('should support chaining multiple conditions', () => {
      const cond1 = signal(true);
      const cond2 = signal(true);
      const cond3 = signal(false);

      const cmd = new Command(async () => {})
        .observesCanExecute(cond1)
        .observesCanExecute(cond2)
        .observesCanExecute(cond3);

      expect(cmd.canExecute$.get()).toBe(false);

      cond3.set(true);
      expect(cmd.canExecute$.get()).toBe(true);

      // Any one false = cannot execute
      cond2.set(false);
      expect(cmd.canExecute$.get()).toBe(false);
    });

    it('should not add condition on disposed command', () => {
      const cmd = new Command(async () => {});
      const condition = signal(true);
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      cmd.dispose();
      cmd.observesCanExecute(condition);

      expect(consoleSpy).toHaveBeenCalledWith('Cannot add canExecute condition on disposed Command');
      consoleSpy.mockRestore();
    });
  });

  describe('raiseCanExecuteChanged', () => {
    it('should trigger re-evaluation of untracked external state', () => {
      let externalFlag = true;
      const cmd = new Command(
        async () => {},
        () => externalFlag,
      );

      expect(cmd.canExecute$.get()).toBe(true);

      // Change untracked external state — the computed cannot see this change
      externalFlag = false;
      cmd.raiseCanExecuteChanged();

      expect(cmd.canExecute$.get()).toBe(false);
    });

    it('should not throw on disposed command', () => {
      const cmd = new Command(async () => {});
      cmd.dispose();

      expect(() => cmd.raiseCanExecuteChanged()).not.toThrow();
    });

    it('should work with observed properties', () => {
      const property = signal('value');
      const cmd = new Command(async () => {}).observesProperty(property);

      const values: boolean[] = [];
      observe(cmd.canExecute$, (v) => values.push(v));

      cmd.raiseCanExecuteChanged();

      // Value is unchanged (still true) — but reading stays consistent
      expect(cmd.canExecute$.get()).toBe(true);
      expect(values.length).toBeGreaterThan(0);
    });
  });

  describe('combined fluent API', () => {
    it('should work with constructor canExecute + observes methods', () => {
      const constructorCondition = signal(true);
      const property = signal('value');
      const additionalCondition = signal(true);

      const cmd = new Command(async () => {}, constructorCondition.asReadonly())
        .observesProperty(property)
        .observesCanExecute(additionalCondition);

      expect(cmd.canExecute$.get()).toBe(true);

      // Any false = cannot execute
      constructorCondition.set(false);
      expect(cmd.canExecute$.get()).toBe(false);

      // Restore constructor condition
      constructorCondition.set(true);
      expect(cmd.canExecute$.get()).toBe(true);

      // Property becomes falsy
      property.set('');
      expect(cmd.canExecute$.get()).toBe(false);
    });

    it('should prevent execution when any condition is false', async () => {
      const cond1 = signal(true);
      const cond2 = signal(false);
      const executeFn = vi.fn(async () => 'result');

      const cmd = new Command(executeFn).observesCanExecute(cond1).observesCanExecute(cond2);

      const result = await cmd.execute();

      expect(result).toBeUndefined();
      expect(executeFn).not.toHaveBeenCalled();
    });

    it('should allow execution when all conditions are true', async () => {
      const cond1 = signal(true);
      const cond2 = signal(true);
      const property = signal('value');
      const executeFn = vi.fn(async () => 'result');

      const cmd = new Command(executeFn).observesCanExecute(cond1).observesCanExecute(cond2).observesProperty(property);

      const result = await cmd.execute();

      expect(result).toBe('result');
      expect(executeFn).toHaveBeenCalled();
    });

    it('should handle complex scenarios with multiple property types', () => {
      const stringProp = signal('');
      const numberProp = signal(0);
      const boolCondition = signal(false);

      const cmd = new Command(async () => {})
        .observesProperty(stringProp)
        .observesProperty(numberProp)
        .observesCanExecute(boolCondition);

      // All falsy
      expect(cmd.canExecute$.get()).toBe(false);

      // Make all truthy
      stringProp.set('text');
      numberProp.set(5);
      boolCondition.set(true);

      expect(cmd.canExecute$.get()).toBe(true);
    });
  });

  describe('dispose with fluent API', () => {
    it('should handle disposal with observed properties', () => {
      const property = signal('value');
      const cmd = new Command(async () => {}).observesProperty(property);

      expect(() => cmd.dispose()).not.toThrow();
    });

    it('should handle disposal with observed conditions', () => {
      const condition = signal(true);
      const cmd = new Command(async () => {}).observesCanExecute(condition);

      expect(() => cmd.dispose()).not.toThrow();
    });
  });
});
