import { signal, computed, type ReadonlySignal } from '@web-loom/signals-core';
import type { IDisposable } from '../models/BaseModel';

/**
 * A can-execute source: either a reactive signal or a plain function.
 * Functions that read signals via .get() are auto-tracked by the
 * canExecute$ computed; reads of non-signal state require a manual
 * raiseCanExecuteChanged() call to re-evaluate.
 */
export type CanExecuteSource = ReadonlySignal<boolean> | (() => boolean);

/**
 * @interface ICommand
 * Defines the public interface for a Command.
 * The `$` suffix marks a reactive property (a ReadonlySignal).
 * @template TParam The type of the parameter passed to the command's execute function.
 * @template TResult The type of the result returned by the command's execute function.
 */
export interface ICommand<TParam = void, TResult = void> extends IDisposable {
  readonly canExecute$: ReadonlySignal<boolean>;
  readonly isExecuting$: ReadonlySignal<boolean>;
  readonly executeError$: ReadonlySignal<any>;

  execute(param: TParam): Promise<TResult | undefined>;
}

/**
 * @interface ICommandBuilder
 * Defines the fluent API for building a Command.
 * @template TParam The type of the parameter for the command's execute function.
 * @template TResult The type of the result from the command's execute function.
 */
export interface ICommandBuilder<TParam, TResult> {
  /**
   * Sets the execution function for the command.
   * @param executeFn The asynchronous function to execute.
   * @returns The builder instance for chaining.
   */
  withExecute(executeFn: (param: TParam) => Promise<TResult>): ICommandBuilder<TParam, TResult>;

  /**
   * Sets the condition under which the command can execute.
   * @param canExecute A boolean signal (or function reading signals) indicating if the command can execute.
   * @returns The builder instance for chaining.
   */
  canExecuteWhen(canExecute: CanExecuteSource): ICommandBuilder<TParam, TResult>;

  /**
   * Builds and returns the configured Command instance.
   * @returns A new ICommand instance.
   */
  build(): ICommand<TParam, TResult>;
}

function readCanExecute(source: CanExecuteSource): boolean {
  return typeof source === 'function' ? source() : source.get();
}

/**
 * @class Command
 * Implements the Command pattern, encapsulating an action that can be executed,
 * along with its execution status, whether it can be executed, and any errors.
 * Suitable for binding to UI elements like buttons.
 *
 * canExecute$ is a computed signal: conditions registered via the constructor,
 * observesProperty(), or observesCanExecute() are auto-tracked, and the command
 * is never executable while it is already executing.
 *
 * Implements {@link IDisposable} for resource cleanup.
 * @template TParam The type of the parameter passed to the command's execute function.
 * @template TResult The type of the result returned by the command's execute function.
 */
export class Command<TParam = void, TResult = void> implements ICommand<TParam, TResult>, IDisposable {
  private _isDisposed = false;

  protected readonly _isExecuting = signal(false);
  public readonly isExecuting$: ReadonlySignal<boolean> = this._isExecuting.asReadonly();

  protected readonly _executeError = signal<any>(null);
  public readonly executeError$: ReadonlySignal<any> = this._executeError.asReadonly();

  public readonly canExecute$: ReadonlySignal<boolean>;

  private readonly _executeFn: (param: TParam) => Promise<TResult>;
  private readonly _baseCanExecute: CanExecuteSource;

  // Fluent API support: extra conditions registered after construction.
  // _canExecuteVersion is bumped to force re-evaluation of the computed —
  // both when the condition list changes and via raiseCanExecuteChanged().
  private readonly _conditions: Array<() => boolean> = [];
  private readonly _canExecuteVersion = signal(0);

  /**
   * Creates a new CommandBuilder instance to fluently construct a Command.
   * @returns A new instance of CommandBuilder.
   */
  public static create<TParam, TResult>(): ICommandBuilder<TParam, TResult> {
    return new CommandBuilder<TParam, TResult>();
  }

  /**
   * @param executeFn The function to execute when the command is triggered.
   * It should return a Promise.
   * @param canExecute Optional can-execute source: a ReadonlySignal<boolean>
   * or a function returning boolean (signal reads inside it are auto-tracked).
   * Defaults to always true.
   */
  constructor(executeFn: (param: TParam) => Promise<TResult>, canExecute?: CanExecuteSource) {
    if (typeof executeFn !== 'function') {
      throw new Error('Command requires an executeFn that is a function.');
    }
    this._executeFn = executeFn;

    if (canExecute === undefined) {
      this._baseCanExecute = () => true;
    } else if (typeof canExecute === 'function' || typeof canExecute?.get === 'function') {
      this._baseCanExecute = canExecute;
    } else {
      throw new Error('canExecute must be a ReadonlySignal<boolean> or a function returning boolean.');
    }

    this.canExecute$ = computed(() => {
      this._canExecuteVersion.get(); // manual re-evaluation hook
      return (
        readCanExecute(this._baseCanExecute) &&
        this._conditions.every((condition) => condition()) &&
        !this._isExecuting.get()
      );
    });
  }

  /**
   * Observes a property signal and re-evaluates canExecute$ when it changes.
   * The property value must be truthy for canExecute to be true.
   *
   * @param property The signal to observe
   * @returns this (for fluent chaining)
   *
   * @example
   * ```typescript
   * this.submitCommand = new Command(() => this.submit())
   *   .observesProperty(this.username$)
   *   .observesProperty(this.email$);
   * ```
   */
  observesProperty<T>(property: ReadonlySignal<T>): this {
    if (this._isDisposed) {
      console.warn('Cannot observe property on disposed Command');
      return this;
    }

    this._conditions.push(() => !!property.get());
    this._canExecuteVersion.update((v) => v + 1);
    return this;
  }

  /**
   * Adds an additional canExecute condition.
   * All conditions must be true for canExecute$ to be true.
   *
   * @param canExecute A boolean signal (or function reading signals)
   * @returns this (for fluent chaining)
   *
   * @example
   * ```typescript
   * this.submitCommand = new Command(() => this.submit())
   *   .observesCanExecute(this.isFormValid$)
   *   .observesCanExecute(this.isNotBusy$);
   * ```
   */
  observesCanExecute(canExecute: CanExecuteSource): this {
    if (this._isDisposed) {
      console.warn('Cannot add canExecute condition on disposed Command');
      return this;
    }

    this._conditions.push(() => readCanExecute(canExecute));
    this._canExecuteVersion.update((v) => v + 1);
    return this;
  }

  /**
   * Manually triggers re-evaluation of canExecute$ and notifies subscribers.
   * Needed only when canExecute reads external state that is not held in
   * signals (signal reads are auto-tracked).
   *
   * @example
   * ```typescript
   * updateSelection(items: Item[]): void {
   *   this.selectedItems = items;
   *   this.deleteCommand.raiseCanExecuteChanged();
   * }
   * ```
   */
  raiseCanExecuteChanged(): void {
    if (this._isDisposed) return;
    this._canExecuteVersion.update((v) => v + 1);
  }

  public dispose(): void {
    if (this._isDisposed) {
      return;
    }
    this._isDisposed = true;
  }

  public async execute(param: TParam): Promise<TResult | undefined> {
    if (this._isDisposed) {
      console.log('Command is disposed. Cannot execute.');
      return Promise.resolve(undefined);
    }

    // Synchronous guard — signals make the awaited-stream read unnecessary.
    if (!this.canExecute$.peek()) {
      console.log('Command cannot be executed.');
      return;
    }

    this._isExecuting.set(true);
    this._executeError.set(null);

    try {
      const result = await this._executeFn(param);
      return result;
    } catch (error) {
      this._executeError.set(error);
      throw error;
    } finally {
      this._isExecuting.set(false);
    }
  }
}

/**
 * @class CommandBuilder
 * A fluent API for constructing Command objects.
 * @template TParam The type of the parameter for the command's execute function.
 * @template TResult The type of the result from the command's execute function.
 */
export class CommandBuilder<TParam, TResult> implements ICommandBuilder<TParam, TResult> {
  private _executeFn?: (param: TParam) => Promise<TResult>;
  private _canExecute?: CanExecuteSource;

  /**
   * Sets the execution function for the command.
   * @param executeFn The asynchronous function to execute.
   * @returns The builder instance for chaining.
   */
  public withExecute(executeFn: (param: TParam) => Promise<TResult>): this {
    this._executeFn = executeFn;
    return this;
  }

  /**
   * Sets the condition under which the command can execute.
   * @param canExecute A boolean signal (or function reading signals).
   * @returns The builder instance for chaining.
   */
  public canExecuteWhen(canExecute: CanExecuteSource): this {
    this._canExecute = canExecute;
    return this;
  }

  /**
   * Builds and returns the configured Command instance.
   * Throws an error if the execute function is not set.
   * @returns A new Command instance.
   */
  public build(): Command<TParam, TResult> {
    if (!this._executeFn) {
      throw new Error('Command cannot be built without an execute function.');
    }

    return new Command(this._executeFn, this._canExecute ?? (() => true));
  }
}
