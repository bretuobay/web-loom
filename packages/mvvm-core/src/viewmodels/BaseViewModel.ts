import { computed, type ReadonlySignal } from '@web-loom/signals-core';
import { ZodError } from 'zod';
import type { BaseModel, IDisposable } from '../models/BaseModel';
import type { ICommand } from '../commands/Command';

/** A teardown function returned by signal subscriptions. */
export type Teardown = () => void;

/**
 * @class BaseViewModel
 * A base class for ViewModels in an MVVM architecture.
 * It connects to a BaseModel and exposes its reactive properties as signals.
 * It also handles validation errors and provides a mechanism for teardown management.
 * @template TModel The type of the BaseModel instance this ViewModel is connected to.
 */
export class BaseViewModel<TModel extends BaseModel<any, any>> {
  private readonly _teardowns: Teardown[] = [];
  private readonly _registeredCommands: ICommand<any, any>[] = [];

  // Expose reactive properties directly from the injected model
  public readonly data$: ReadonlySignal<any>;
  public readonly isLoading$: ReadonlySignal<boolean>;
  public readonly error$: ReadonlySignal<any>;

  // Reactive property for detailed Zod validation errors
  public readonly validationErrors$: ReadonlySignal<ZodError | null>;
  protected readonly model: TModel;

  constructor(model: TModel) {
    this.model = model;
    if (!model) {
      throw new Error('BaseViewModel requires an instance of BaseModel in its constructor.');
    }

    this.data$ = this.model.data$;
    this.isLoading$ = this.model.isLoading$;
    this.error$ = this.model.error$;

    // Derive validationErrors$ from the model's error$: only ZodError instances
    // surface here; anything else maps to null.
    this.validationErrors$ = computed(() => {
      const err = this.model.error$.get();
      return err instanceof ZodError ? err : null;
    });
  }

  /**
   * Adds a teardown (e.g. a signal unsubscribe function) to the ViewModel's
   * internal lifecycle management. It runs automatically when `dispose()` is called.
   * @param teardown The teardown function to register.
   */
  protected addSubscription(teardown: Teardown): void {
    this._teardowns.push(teardown);
  }

  /**
   * Register a command for automatic disposal when ViewModel is disposed.
   * Returns the command for convenient assignment.
   *
   * @param command The command to register
   * @returns The same command (for assignment chaining)
   *
   * @example
   * ```typescript
   * class MyViewModel extends BaseViewModel<MyModel> {
   *   public readonly saveCommand = this.registerCommand(
   *     new Command(() => this.save())
   *   );
   *
   *   public readonly deleteCommand = this.registerCommand(
   *     new Command(() => this.delete(), this.canDelete$)
   *   );
   * }
   * ```
   */
  protected registerCommand<TParam, TResult>(command: ICommand<TParam, TResult>): ICommand<TParam, TResult> {
    this._registeredCommands.push(command);
    return command;
  }

  /**
   * Check if an object has a dispose method
   */
  private isDisposable(obj: any): obj is IDisposable {
    return obj && typeof obj.dispose === 'function';
  }

  /**
   * Disposes of all teardowns and registered commands managed by this ViewModel.
   * This method should be called when the ViewModel is no longer needed
   * to prevent memory leaks.
   */
  public dispose(): void {
    // Dispose all registered commands
    this._registeredCommands.forEach((cmd) => {
      if (this.isDisposable(cmd)) {
        cmd.dispose();
      }
    });
    this._registeredCommands.length = 0; // Clear array

    this._teardowns.forEach((teardown) => teardown());
    this._teardowns.length = 0;
  }
}
