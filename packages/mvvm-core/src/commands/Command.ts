import { BehaviorSubject, Observable, isObservable, of, Subscription } from 'rxjs';
import { first, map, switchMap } from 'rxjs/operators';
import type { IDisposable } from '../models/BaseModel';

/**
 * @interface ICommand
 * Defines the public interface for a Command.
 * @template TParam The type of the parameter passed to the command's execute function.
 * @template TResult The type of the result returned by the command's execute function.
 */
export interface ICommand<TParam = void, TResult = void> {
  readonly canExecute$: Observable<boolean>;
  readonly isExecuting$: Observable<boolean>;
  readonly executeError$: Observable<any>;

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
   * @param canExecuteObservable An observable that emits a boolean indicating if the command can execute.
   * @returns The builder instance for chaining.
   */
  canExecuteWhen(canExecuteObservable: Observable<boolean>): ICommandBuilder<TParam, TResult>;

  /**
   * Builds and returns the configured Command instance.
   * @returns A new ICommand instance.
   */
  build(): ICommand<TParam, TResult>;
}

/**
 * @class Command
 * Implements the Command pattern, encapsulating an action that can be executed,
 * along with its execution status, whether it can be executed, and any errors.
 * Suitable for binding to UI elements like buttons.
 * Implements {@link IDisposable} for resource cleanup.
 * @template TParam The type of the parameter passed to the command's execute function.
 * @template TResult The type of the result returned by the command's execute function.
 */
export class Command<TParam = void, TResult = void> implements ICommand<TParam, TResult>, IDisposable {
  private _isDisposed = false;
  protected readonly _isExecuting$ = new BehaviorSubject<boolean>(false);
  public readonly isExecuting$: Observable<boolean> = this._isExecuting$.asObservable();

  protected readonly _canExecute$: Observable<boolean>; // Derived from constructor arg
  protected readonly _executeError$ = new BehaviorSubject<any>(null);
  public readonly executeError$: Observable<any> = this._executeError$.asObservable();

  private readonly _executeFn: (param: TParam) => Promise<TResult>;
  private _canExecuteSubscription: Subscription | undefined;

  /**
   * Creates a new CommandBuilder instance to fluently construct a Command.
   * @returns A new instance of CommandBuilder.
   */
  public static create<TParam, TResult>(): ICommandBuilder<TParam, TResult> {
    return new CommandBuilder<TParam, TResult>();
  }

  /**
   * @internal Use `Command.create()` to build a command.
   * @param executeFn The function to execute when the command is triggered.
   * It should return a Promise.
   * @param canExecuteFn An optional function or Observable determining if the command can be executed.
   * If a function, it's called with the parameter. If an Observable, it emits boolean.
   * Defaults to always true if not provided.
   */
  constructor(
    executeFn: (param: TParam) => Promise<TResult>,
    canExecuteFn?: ((param: TParam) => Observable<boolean> | boolean) | Observable<boolean>,
  ) {
    if (typeof executeFn !== 'function') {
      throw new Error('Command requires an executeFn that is a function.');
    }
    this._executeFn = executeFn;

    if (canExecuteFn === undefined) {
      this._canExecute$ = of(true);
    } else if (isObservable(canExecuteFn)) {
      this._canExecute$ = canExecuteFn;
    } else if (typeof canExecuteFn === 'function') {
      this._canExecute$ = of(true);
      console.warn(
        "canExecuteFn as a function for Command's constructor is deprecated. Use an Observable<boolean> for reactive canExecute$.",
      );
    } else {
      throw new Error(
        'canExecuteFn must be an Observable<boolean> or a function returning boolean/Observable<boolean>.',
      );
    }
  }

  public dispose(): void {
    if (this._isDisposed) {
      return;
    }
    this._isExecuting$.complete();
    this._executeError$.complete();

    if (this._canExecuteSubscription) {
      this._canExecuteSubscription.unsubscribe();
    }
    this._isDisposed = true;
  }

  public get canExecute$(): Observable<boolean> {
    return this._canExecute$.pipe(switchMap((canExec) => this._isExecuting$.pipe(map((isExec) => canExec && !isExec))));
  }

  public async execute(param: TParam): Promise<TResult | undefined> {
    if (this._isDisposed) {
      console.log('Command is disposed. Cannot execute.');
      return Promise.resolve(undefined);
    }

    const canExecuteNow = await this.canExecute$.pipe(first()).toPromise();

    if (!canExecuteNow) {
      console.log('Command cannot be executed.');
      return;
    }

    this._isExecuting$.next(true);
    this._executeError$.next(null);

    try {
      const result = await this._executeFn(param);
      return result;
    } catch (error) {
      this._executeError$.next(error);
      throw error;
    } finally {
      this._isExecuting$.next(false);
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
  private _canExecute$?: Observable<boolean>;

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
   * @param canExecuteObservable An observable that emits a boolean indicating if the command can execute.
   * @returns The builder instance for chaining.
   */
  public canExecuteWhen(canExecuteObservable: Observable<boolean>): this {
    this._canExecute$ = canExecuteObservable;
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

    return new Command(this._executeFn, this._canExecute$ ?? of(true));
  }
}
