import { Observable, BehaviorSubject, combineLatest, Subscription } from 'rxjs';
import { map, distinctUntilChanged } from 'rxjs/operators';
import type { ICommand } from './Command';
import type { IDisposable } from '../models/BaseModel';

/**
 * Options for CompositeCommand construction
 */
export interface CompositeCommandOptions {
  /**
   * When true, only executes commands where isActive is true (if they implement IActiveAware)
   * Default: false
   */
  monitorCommandActivity?: boolean;

  /**
   * Execution mode for child commands
   * - 'parallel': Execute all commands simultaneously (default)
   * - 'sequential': Execute commands one after another
   */
  executionMode?: 'parallel' | 'sequential';
}

/**
 * Interface for CompositeCommand
 */
export interface ICompositeCommand<TParam = void, TResult = any[]> extends ICommand<TParam, TResult> {
  register(command: ICommand<TParam, any>): void;
  unregister(command: ICommand<TParam, any>): void;
  readonly registeredCommands: ReadonlyArray<ICommand<TParam, any>>;
}

/**
 * Aggregates multiple child commands and executes them collectively.
 *
 * Key behaviors:
 * - canExecute$ is false if ANY child cannot execute
 * - isExecuting$ is true if ANY child is executing
 * - execute() runs all child commands and returns aggregated results
 *
 * @example
 * ```typescript
 * // Create composite command for "Refresh All"
 * const refreshAllCommand = new CompositeCommand();
 * refreshAllCommand.register(refreshUsersCommand);
 * refreshAllCommand.register(refreshOrdersCommand);
 * refreshAllCommand.register(refreshStatsCommand);
 *
 * // Execute all at once
 * await refreshAllCommand.execute();
 * ```
 */
export class CompositeCommand<TParam = void, TResult = any[]>
  implements ICompositeCommand<TParam, TResult>, IDisposable
{
  private readonly commands = new Set<ICommand<TParam, any>>();
  private readonly _commands$ = new BehaviorSubject<ICommand<TParam, any>[]>([]);
  private readonly _isExecuting$ = new BehaviorSubject<boolean>(false);
  private readonly _executeError$ = new BehaviorSubject<any>(null);
  private readonly options: Required<CompositeCommandOptions>;

  private canExecuteSubscription: Subscription | null = null;
  private isExecutingSubscription: Subscription | null = null;
  private _canExecute$: Observable<boolean>;
  private _isDisposed = false;

  public readonly isExecuting$: Observable<boolean> = this._isExecuting$.asObservable();
  public readonly executeError$: Observable<any> = this._executeError$.asObservable();

  constructor(options: CompositeCommandOptions = {}) {
    this.options = {
      monitorCommandActivity: options.monitorCommandActivity ?? false,
      executionMode: options.executionMode ?? 'parallel',
    };

    // Initialize canExecute$ - will be rebuilt when commands change
    this._canExecute$ = new BehaviorSubject(true).asObservable();

    this.rebuildObservables();
  }

  get canExecute$(): Observable<boolean> {
    return this._canExecute$;
  }

  get registeredCommands(): ReadonlyArray<ICommand<TParam, any>> {
    return Array.from(this.commands);
  }

  /**
   * Register a command to be executed as part of this composite
   *
   * @param command The command to register
   *
   * @example
   * ```typescript
   * const composite = new CompositeCommand();
   * composite.register(saveCommand);
   * composite.register(validateCommand);
   * ```
   */
  register(command: ICommand<TParam, any>): void {
    if (this._isDisposed) {
      console.warn('Cannot register command to disposed CompositeCommand');
      return;
    }

    this.commands.add(command);
    this._commands$.next(Array.from(this.commands));
    this.rebuildObservables();
  }

  /**
   * Unregister a command from this composite
   *
   * @param command The command to unregister
   */
  unregister(command: ICommand<TParam, any>): void {
    this.commands.delete(command);
    this._commands$.next(Array.from(this.commands));
    this.rebuildObservables();
  }

  /**
   * Execute all registered commands
   *
   * @param param Parameter to pass to all commands
   * @returns Array of results from all commands
   */
  async execute(param: TParam): Promise<TResult> {
    if (this._isDisposed) {
      console.warn('Cannot execute disposed CompositeCommand');
      return [] as unknown as TResult;
    }

    const commandsArray = Array.from(this.commands);

    if (commandsArray.length === 0) {
      return [] as unknown as TResult;
    }

    // Filter by active state if monitoring
    const commandsToExecute = this.options.monitorCommandActivity
      ? commandsArray.filter((cmd) => this.shouldExecuteCommand(cmd))
      : commandsArray;

    this._isExecuting$.next(true);
    this._executeError$.next(null);

    try {
      let results: any[];

      if (this.options.executionMode === 'sequential') {
        results = [];
        for (const cmd of commandsToExecute) {
          const result = await cmd.execute(param);
          results.push(result);
        }
      } else {
        // Parallel execution
        results = await Promise.all(commandsToExecute.map((cmd) => cmd.execute(param)));
      }

      return results as TResult;
    } catch (error) {
      this._executeError$.next(error);
      throw error;
    } finally {
      this._isExecuting$.next(false);
    }
  }

  /**
   * Check if a command should be executed (for active awareness)
   * @private
   */
  private shouldExecuteCommand(command: ICommand<TParam, any>): boolean {
    // Check if command implements IActiveAware
    if ('isActive' in command && typeof (command as any).isActive === 'boolean') {
      return (command as any).isActive;
    }
    return true;
  }

  /**
   * Rebuild the canExecute$ and isExecuting$ observables when commands change
   * @private
   */
  private rebuildObservables(): void {
    // Clean up previous subscriptions
    this.canExecuteSubscription?.unsubscribe();
    this.isExecutingSubscription?.unsubscribe();

    const commandsArray = Array.from(this.commands);

    if (commandsArray.length === 0) {
      this._canExecute$ = new BehaviorSubject(true).asObservable();
      return;
    }

    // Combine all canExecute$ - ALL must be true
    this._canExecute$ = combineLatest(commandsArray.map((cmd) => cmd.canExecute$)).pipe(
      map((canExecuteStates) => canExecuteStates.every((can) => can)),
      distinctUntilChanged(),
    );

    // Combine all isExecuting$ - ANY true means executing
    this.isExecutingSubscription = combineLatest(commandsArray.map((cmd) => cmd.isExecuting$))
      .pipe(map((isExecutingStates) => isExecutingStates.some((is) => is)))
      .subscribe((isExecuting) => {
        this._isExecuting$.next(isExecuting);
      });
  }

  /**
   * Dispose of the composite command and clean up resources
   */
  dispose(): void {
    if (this._isDisposed) return;

    this.canExecuteSubscription?.unsubscribe();
    this.isExecutingSubscription?.unsubscribe();
    this._commands$.complete();
    this._isExecuting$.complete();
    this._executeError$.complete();
    this.commands.clear();
    this._isDisposed = true;
  }
}
