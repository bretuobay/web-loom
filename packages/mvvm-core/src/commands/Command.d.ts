import { BehaviorSubject, Observable } from 'rxjs';
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
 * @class Command
 * Implements the Command pattern, encapsulating an action that can be executed,
 * along with its execution status, whether it can be executed, and any errors.
 * Suitable for binding to UI elements like buttons.
 * Implements {@link IDisposable} for resource cleanup.
 * @template TParam The type of the parameter passed to the command's execute function.
 * @template TResult The type of the result returned by the command's execute function.
 */
export declare class Command<TParam = void, TResult = void> implements ICommand<TParam, TResult>, IDisposable {
  private _isDisposed;
  protected readonly _isExecuting$: BehaviorSubject<boolean>;
  readonly isExecuting$: Observable<boolean>;
  protected readonly _canExecute$: Observable<boolean>;
  protected readonly _executeError$: BehaviorSubject<any>;
  readonly executeError$: Observable<any>;
  private readonly _executeFn;
  private _canExecuteSubscription;
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
  );
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
  dispose(): void;
  /**
   * The observable indicating whether the command can currently be executed.
   */
  get canExecute$(): Observable<boolean>;
  /**
   * Executes the command's action.
   * It manages the `isExecuting$` and `executeError$` states.
   * @param param The parameter to pass to the `executeFn`.
   * @returns A promise that resolves with the result of the execution, or undefined if not executable.
   */
  execute(param: TParam): Promise<TResult | undefined>;
}
//# sourceMappingURL=Command.d.ts.map
