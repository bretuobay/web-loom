import { signal, computed, type ReadonlySignal } from '@web-loom/signals-core';
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
 * - isExecuting$ is true if ANY child is executing (or the composite itself)
 * - execute() runs all child commands and returns aggregated results
 *
 * Both aggregate states are computed signals over the children's signals, so
 * they track child changes automatically; registering/unregistering bumps a
 * version signal to re-collect dependencies.
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
  private readonly _registryVersion = signal(0);
  private readonly _selfExecuting = signal(false);
  private readonly _executeError = signal<any>(null);
  private readonly options: Required<CompositeCommandOptions>;
  private _isDisposed = false;

  public readonly isExecuting$: ReadonlySignal<boolean>;
  public readonly executeError$: ReadonlySignal<any> = this._executeError.asReadonly();
  public readonly canExecute$: ReadonlySignal<boolean>;

  constructor(options: CompositeCommandOptions = {}) {
    this.options = {
      monitorCommandActivity: options.monitorCommandActivity ?? false,
      executionMode: options.executionMode ?? 'parallel',
    };

    this.canExecute$ = computed(() => {
      this._registryVersion.get(); // re-collect deps when the registry changes
      const children = Array.from(this.commands);
      if (children.length === 0) return true;
      return children.every((cmd) => cmd.canExecute$.get());
    });

    this.isExecuting$ = computed(() => {
      this._registryVersion.get();
      const children = Array.from(this.commands);
      return this._selfExecuting.get() || children.some((cmd) => cmd.isExecuting$.get());
    });
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
    this._registryVersion.update((v) => v + 1);
  }

  /**
   * Unregister a command from this composite
   *
   * @param command The command to unregister
   */
  unregister(command: ICommand<TParam, any>): void {
    this.commands.delete(command);
    this._registryVersion.update((v) => v + 1);
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

    this._selfExecuting.set(true);
    this._executeError.set(null);

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
      this._executeError.set(error);
      throw error;
    } finally {
      this._selfExecuting.set(false);
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
   * Dispose of the composite command and clean up resources
   */
  dispose(): void {
    if (this._isDisposed) return;
    this.commands.clear();
    this._registryVersion.update((v) => v + 1);
    this._isDisposed = true;
  }
}
