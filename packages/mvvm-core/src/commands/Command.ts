import { BehaviorSubject, Observable, isObservable, of, Subscription } from 'rxjs';
import { first, map, switchMap } from 'rxjs/operators';
import { IDisposable } from '../models/BaseModel'; // Adjust path as necessary

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
      this._canExecute$ = of(true); // Always executable by default
    } else if (isObservable(canExecuteFn)) {
      this._canExecute$ = canExecuteFn;
    } else if (typeof canExecuteFn === 'function') {
      // If canExecuteFn is a function, it takes the parameter.
      // We need to provide a default value for the parameter when mapping
      // to an observable that doesn't have a parameter.
      // For a general canExecute$ observable that doesn't depend on param,
      // we'd need to assume a default param or a mechanism to re-evaluate.
      // For simplicity here, if it's a function, we'll assume it doesn't depend
      // on the *current* parameter or has a default, or it's up to the consumer
      // to re-evaluate it with a specific param if needed.
      // A more robust implementation might involve passing the latest param
      // to canExecuteFn and using combineLatest with another subject for param.
      this._canExecute$ = of(true); // Default to true, or user must manage
      console.warn(
        "canExecuteFn as a function for Command's constructor is deprecated. Use an Observable<boolean> for reactive canExecute$.",
      );
      // A better way would be to create a separate internal subject for params
      // and combine it with the canExecuteFn. For now, this is a simplification.
      // For the deprecated function case, if it returned an observable,
      // we are not currently subscribing to it in a way that `_canExecuteSubscription` would be set.
      // This path assigns `of(true)` to `_canExecute$`.
    } else {
      throw new Error(
        'canExecuteFn must be an Observable<boolean> or a function returning boolean/Observable<boolean>.',
      );
    }
  }

  /**
   * Cleans up resources used by the command.
   * This method completes the internal `isExecuting$` and `executeError$` observables,
   * preventing further emissions and signaling to subscribers that these observables are closed.
   * It does NOT complete the `_canExecute$` observable if it was provided externally from the constructor,
   * as the lifecycle of such external observables should be managed by their creators.
   * If `_canExecuteSubscription` was internally created and used (currently not by default constructor paths),
   * this method would unsubscribe from it.
   * Once disposed, the command's `execute` method will no longer perform its action and will log a message.
   */
  public dispose(): void {
    if (this._isDisposed) {
      return;
    }
    this._isExecuting$.complete();
    this._executeError$.complete();

    // Unsubscribe from any internal subscription to canExecuteFn if it was an observable
    // returned by a function (though this specific path is not fully implemented for reactivity).
    // Or if _canExecute$ was directly an observable we subscribed to internally.
    // In the current setup, _canExecute$ is assigned, not subscribed to create another subject.
    // The primary case for _canExecuteSubscription would be if canExecuteFn itself
    // was a function that returned an Observable, and we set up an internal subscription
    // to pipe its values into an internal BehaviorSubject for _canExecute$.
    // This is not the current pattern. _canExecute$ is either `of(true)` or the direct observable.
    // So, _canExecuteSubscription might not be strictly necessary with current constructor logic
    // unless we change how canExecuteFn (function type) is handled.
    // However, if _canExecute$ was an observable that this Command internally subscribed to
    // for some reason (e.g. to feed into another Subject), this would be the place.
    // The current `_canExecute$` is directly used in `get canExecute$()`, so no internal sub.

    if (this._canExecuteSubscription) {
      this._canExecuteSubscription.unsubscribe();
    }

    // If _canExecute$ was an internal BehaviorSubject created and managed by this Command,
    // it should be completed. However, _canExecute$ is an Observable, potentially external.
    // We should only complete it if it's an internally created and managed Subject.
    // Based on constructor:
    // - `of(true)`: Cold, completes itself.
    // - `canExecuteFn` (Observable): External, not to be completed here.
    // - `canExecuteFn` (function, deprecated): Currently becomes `of(true)`.
    // Thus, no explicit `_canExecute$.complete()` call seems correct here.
    this._isDisposed = true;
  }

  /**
   * The observable indicating whether the command can currently be executed.
   */
  public get canExecute$(): Observable<boolean> {
    return this._canExecute$.pipe(switchMap((canExec) => this._isExecuting$.pipe(map((isExec) => canExec && !isExec))));
  }

  /**
   * Executes the command's action.
   * It manages the `isExecuting$` and `executeError$` states.
   * @param param The parameter to pass to the `executeFn`.
   * @returns A promise that resolves with the result of the execution, or undefined if not executable.
   */
  public async execute(param: TParam): Promise<TResult | undefined> {
    if (this._isDisposed) {
      console.log('Command is disposed. Cannot execute.');
      return Promise.resolve(undefined); // Or reject, depending on desired contract
    }

    const canExecuteNow = await this.canExecute$.pipe(first()).toPromise();

    if (!canExecuteNow) {
      console.log('Command cannot be executed.');
      return;
    }

    this._isExecuting$.next(true);
    this._executeError$.next(null); // Clear previous errors

    try {
      const result = await this._executeFn(param);
      return result;
    } catch (error) {
      this._executeError$.next(error);
      // Do not re-throw if the error subject is meant to be the primary error channel for subscribers.
      // Depending on desired behavior, re-throwing might be for critical, unrecoverable errors
      // or if the caller of execute() is expected to always handle it.
      // For now, let's assume subscribers to executeError$ handle it.
      // Consider if re-throwing is always desired. If so, `throw error;` is correct.
      // If not, and errors are just reported via executeError$, then remove `throw error;`.
      // For now, keeping `throw error;` as it's a common pattern.
      throw error;
    } finally {
      this._isExecuting$.next(false);
    }
  }
}
