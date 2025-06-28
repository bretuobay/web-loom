import { vi, describe, beforeEach, afterEach, it, expect } from 'vitest';
import { Command } from './Command';
import { BehaviorSubject } from 'rxjs';
import { first } from 'rxjs/operators';

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

  it('should initialize with canExecute$ true, isExecuting$ false, and no error', async () => {
    command = new Command(mockExecuteFn);
    expect(await command.canExecute$.pipe(first()).toPromise()).toBe(true);
    expect(await command.isExecuting$.pipe(first()).toPromise()).toBe(false);
    expect(await command.executeError$.pipe(first()).toPromise()).toBeNull();
  });

  it('should throw error if executeFn is not a function', () => {
    // @ts-ignore
    expect(() => new Command(null)).toThrow('Command requires an executeFn that is a function.');
  });

  it('should execute the function and update states correctly', async () => {
    command = new Command(mockExecuteFn);
    const param = 'test_param';

    const isExecutingStates: boolean[] = [];
    command.isExecuting$.subscribe((val) => isExecutingStates.push(val));

    const canExecuteStates: boolean[] = [];
    command.canExecute$.subscribe((val) => canExecuteStates.push(val));

    const executionPromise = command.execute(param);

    /**
     * 1. Subscriptions are synchronous, but state changes are async
        When you subscribe to isExecuting$ and canExecute$, you immediately get the current value (false and true respectively).
        When you call command.execute(param), the state changes (isExecuting$ becomes true, canExecute$ becomes false) happen asynchronously (after awaiting canExecute$ and before/after the async function runs).
        The state change to true for isExecuting$ and to false for canExecute$ may not be captured in the arrays before the expect assertions run, because the execution hasn't yielded to the event loop yet.

        2. The expectations are run immediately after calling command.execute(param) (which returns a Promise), but before the async state changes have a chance to emit and be pushed into your arrays.
     */

    // Wait for the next tick so BehaviorSubjects emit their new values
    await Promise.resolve();
    // or
    // const result = await executionPromise;

    // Expect states during execution
    expect(isExecutingStates).toEqual([false, true]); // Initial false, then true
    // CanExecute should be false while executing
    expect(canExecuteStates).toEqual([true, false]); // Initial true, then false

    const result = await executionPromise;

    // Expect states after execution
    expect(result).toBe('Executed: test_param');
    expect(mockExecuteFn).toHaveBeenCalledWith(param);
    expect(await command.isExecuting$.pipe(first()).toPromise()).toBe(false); // Back to false
    expect(await command.canExecute$.pipe(first()).toPromise()).toBe(true); // Back to true
    expect(await command.executeError$.pipe(first()).toPromise()).toBeNull(); // No error
  });

  it('should set executeError$ if execution fails', async () => {
    const error = new Error('Execution failed');
    mockExecuteFn.mockRejectedValue(error);
    command = new Command(mockExecuteFn);

    await expect(command.execute('param')).rejects.toThrow(error);

    expect(await command.isExecuting$.pipe(first()).toPromise()).toBe(false);
    expect(await command.canExecute$.pipe(first()).toPromise()).toBe(true);
    expect(await command.executeError$.pipe(first()).toPromise()).toBe(error);
  });

  describe('canExecute$ with Observable condition', () => {
    let canExecuteSubject: BehaviorSubject<boolean>;

    beforeEach(() => {
      canExecuteSubject = new BehaviorSubject(true);
      command = new Command(mockExecuteFn, canExecuteSubject.asObservable());
    });

    it('should respect the canExecute$ observable', async () => {
      expect(await command.canExecute$.pipe(first()).toPromise()).toBe(true);

      canExecuteSubject.next(false);
      expect(await command.canExecute$.pipe(first()).toPromise()).toBe(false);

      canExecuteSubject.next(true);
      expect(await command.canExecute$.pipe(first()).toPromise()).toBe(true);
    });

    it('should not execute if canExecute$ is false', async () => {
      canExecuteSubject.next(false);
      const result = await command.execute('param');

      expect(mockExecuteFn).not.toHaveBeenCalled();
      expect(result).toBeUndefined(); // Command returns undefined if not executable
      expect(await command.isExecuting$.pipe(first()).toPromise()).toBe(false);
      expect(await command.executeError$.pipe(first()).toPromise()).toBeNull();
    });

    it('should return false for canExecute$ while executing', async () => {
      canExecuteSubject.next(true); // Can execute
      const canExecuteStates: boolean[] = [];
      command.canExecute$.subscribe((val) => canExecuteStates.push(val));

      const promise = command.execute('param');

      await Promise.resolve(); // Wait for state updates
      expect(canExecuteStates).toEqual([true, false]); // True initially, then false during execution
      await promise;
      expect(canExecuteStates).toEqual([true, false, true]); // Back to true after execution
    });

    it('should still be false for canExecute$ if canExecuteSubject is false even if not executing', async () => {
      canExecuteSubject.next(false);
      expect(await command.canExecute$.pipe(first()).toPromise()).toBe(false);
    });
  });

  // Test for canExecuteFn as a simple boolean function (deprecated warning test)
  it('should warn and default canExecute$ to true if canExecuteFn is a function (deprecated usage)', async () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    command = new Command(mockExecuteFn, (param: string) => param === 'valid'); // Deprecated usage
    expect(await command.canExecute$.pipe(first()).toPromise()).toBe(true);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining("canExecuteFn as a function for Command's constructor is deprecated."),
    );
    consoleWarnSpy.mockRestore();
  });

  it('should reject with a specific error if canExecuteFn is not an Observable or function', () => {
    // @ts-ignore
    expect(() => new Command(mockExecuteFn, 123)).toThrow(
      'canExecuteFn must be an Observable<boolean> or a function returning boolean/Observable<boolean>.',
    );
  });

  describe('dispose', () => {
    let commandWithDefaultCanExecute: Command<string, string>;
    let commandWithExternalCanExecute: Command<string, string>;
    let externalCanExecute$: BehaviorSubject<boolean>;
    // @ts-ignore
    let mockExecuteFnDispose: vi.Mock;

    beforeEach(() => {
      mockExecuteFnDispose = vi.fn(async (param: string) => `Executed: ${param}`);
      externalCanExecute$ = new BehaviorSubject<boolean>(true);

      commandWithDefaultCanExecute = new Command(mockExecuteFnDispose);
      commandWithExternalCanExecute = new Command(mockExecuteFnDispose, externalCanExecute$.asObservable());
    });

    it('should complete internal observables when disposed (default canExecute)', () => {
      const isExecutingCompleteSpy = vi.fn();
      const executeErrorCompleteSpy = vi.fn();
      const canExecuteCompleteSpy = vi.fn();

      commandWithDefaultCanExecute.isExecuting$.subscribe({ complete: isExecutingCompleteSpy });
      commandWithDefaultCanExecute.executeError$.subscribe({ complete: executeErrorCompleteSpy });
      commandWithDefaultCanExecute.canExecute$.subscribe({ complete: canExecuteCompleteSpy });

      commandWithDefaultCanExecute.dispose();

      expect(isExecutingCompleteSpy).toHaveBeenCalledTimes(1);
      expect(executeErrorCompleteSpy).toHaveBeenCalledTimes(1);
      expect(canExecuteCompleteSpy).toHaveBeenCalledTimes(1); // Derived observable should complete
    });

    it('should complete internal observables and not external canExecute$ when disposed', () => {
      const isExecutingCompleteSpy = vi.fn();
      const executeErrorCompleteSpy = vi.fn();
      const canExecuteCompleteSpy = vi.fn();
      const externalCanExecuteCompleteSpy = vi.fn();

      commandWithExternalCanExecute.isExecuting$.subscribe({ complete: isExecutingCompleteSpy });
      commandWithExternalCanExecute.executeError$.subscribe({ complete: executeErrorCompleteSpy });
      commandWithExternalCanExecute.canExecute$.subscribe({ complete: canExecuteCompleteSpy });
      externalCanExecute$.subscribe({ complete: externalCanExecuteCompleteSpy });

      commandWithExternalCanExecute.dispose();

      expect(isExecutingCompleteSpy).toHaveBeenCalledTimes(1);
      expect(executeErrorCompleteSpy).toHaveBeenCalledTimes(1);
      // If _canExecute$ (external) is not completed, and only _isExecuting$ is completed,
      // the stream derived by switchMap might not complete. It will just stop reacting to _isExecuting$.
      // If externalCanExecute$ then emits, switchMap will try to use the completed _isExecuting$,
      // which should result in an immediate completion of that inner part.
      // The overall canExecute$ (derived) should not complete if its external source doesn't.
      expect(canExecuteCompleteSpy).not.toHaveBeenCalled();
      expect(externalCanExecuteCompleteSpy).not.toHaveBeenCalled(); // External should not complete
    });

    it('should not allow execution and return undefined if execute is called after disposal', async () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      commandWithDefaultCanExecute.dispose(); // Dispose first

      const result = await commandWithDefaultCanExecute.execute('test');

      expect(result).toBeUndefined(); // Should return undefined as per new dispose logic
      expect(mockExecuteFnDispose).not.toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith('Command is disposed. Cannot execute.');
      consoleLogSpy.mockRestore();
    });

    it('should not emit further values on isExecuting$, executeError$ after disposal', () => {
      const isExecutingNextSpy = vi.fn();
      const executeErrorNextSpy = vi.fn();

      commandWithDefaultCanExecute.isExecuting$.subscribe({ next: isExecutingNextSpy });
      commandWithDefaultCanExecute.executeError$.subscribe({ next: executeErrorNextSpy });

      // Dispose after subscription but before clearing, to capture any immediate post-subscription emissions
      commandWithDefaultCanExecute.dispose();

      // Clear spies to only check for emissions *after* dispose that might be wrongfully triggered
      isExecutingNextSpy.mockClear();
      executeErrorNextSpy.mockClear();

      // Attempt to manually trigger next on underlying subjects (testing RxJS completed subject behavior)
      // These calls should be no-ops on completed subjects.
      if (!(commandWithDefaultCanExecute as any)._isExecuting$.closed) {
        (commandWithDefaultCanExecute as any)._isExecuting$.next(true);
      }
      if (!(commandWithDefaultCanExecute as any)._executeError$.closed) {
        (commandWithDefaultCanExecute as any)._executeError$.next(new Error('test error'));
      }

      expect(isExecutingNextSpy).not.toHaveBeenCalled();
      expect(executeErrorNextSpy).not.toHaveBeenCalled();
    });

    it('canExecute$ from disposed command with external source should not emit if external source changes', () => {
      const canExecuteNextSpy = vi.fn();
      commandWithExternalCanExecute.canExecute$.subscribe({ next: canExecuteNextSpy });

      commandWithExternalCanExecute.dispose();
      canExecuteNextSpy.mockClear(); // Clear emissions up to and including completion emission

      externalCanExecute$.next(false); // Change external source

      expect(canExecuteNextSpy).not.toHaveBeenCalled(); // No new emissions from the disposed command's canExecute$
    });
  });
});
