import { signal, type ReadonlySignal } from '@web-loom/signals-core';
import { ZodSchema } from 'zod';

/**
 * @interface IDisposable
 * Defines a contract for objects that need to release resources.
 */
export interface IDisposable {
  dispose(): void;
}

/**
 * @interface IBaseModel
 * Defines the core reactive properties and methods for a BaseModel.
 * The `$` suffix marks a reactive property (a ReadonlySignal).
 * @template TData The type of data managed by the model.
 * @template TSchema The Zod schema type for validating the data.
 */
export interface IBaseModel<TData, TSchema extends ZodSchema<TData>> extends IDisposable {
  readonly data$: ReadonlySignal<TData | null>;
  readonly isLoading$: ReadonlySignal<boolean>;
  readonly error$: ReadonlySignal<any>;
  readonly schema?: TSchema;

  setData(newData: TData | null): void;
  setLoading(status: boolean): void;
  setError(err: any): void;
  clearError(): void;
  validate(data: any): TData;
  getCurrentData(): TData | null;
  getCurrentLoadingStatus(): boolean;
  getCurrentError(): any;
}

export type TConstructorInput<TData, TSchema extends ZodSchema<TData>> = {
  initialData?: TData | null;
  schema?: TSchema;
};

/**
 * @class BaseModel
 * A base class for models in an MVVM architecture, providing core functionalities
 * for data management, loading states, error handling, and Zod validation.
 * Reactive state is exposed as signals (see @web-loom/signals-core); subscribe
 * via `data$.subscribe(fn)` or read synchronously via `data$.get()`.
 * Implements {@link IDisposable}: after dispose(), setters become no-ops so no
 * further notifications are delivered.
 * @template TData The type of data managed by the model.
 * @template TSchema The Zod schema type for validating the data.
 */
export class BaseModel<TData, TSchema extends ZodSchema<TData>> implements IBaseModel<TData, TSchema> {
  protected _data = signal<TData | null>(null);
  public readonly data$: ReadonlySignal<TData | null> = this._data.asReadonly();

  protected _isLoading = signal<boolean>(false);
  public readonly isLoading$: ReadonlySignal<boolean> = this._isLoading.asReadonly();

  protected _error = signal<any>(null);
  public readonly error$: ReadonlySignal<any> = this._error.asReadonly();

  public readonly schema?: TSchema;

  private _isDisposed = false;

  /**
   * Cleans up resources used by the model. After disposal, setters no-op,
   * preventing further notifications to subscribers.
   */
  public dispose(): void {
    this._isDisposed = true;
  }

  constructor(input: TConstructorInput<TData, TSchema>) {
    const { initialData = null, schema } = input;
    if (initialData !== null) {
      this._data.set(initialData);
    }
    this.schema = schema;
  }

  /**
   * Updates the model's data.
   * @param newData The new data to set.
   */
  public setData(newData: TData | null): void {
    if (this._isDisposed) return;
    this._data.set(newData);
  }

  /**
   * Sets the loading status of the model.
   * @param status True if loading, false otherwise.
   */
  public setLoading(status: boolean): void {
    if (this._isDisposed) return;
    this._isLoading.set(status);
  }

  /**
   * Sets an error for the model.
   * @param err The error object.
   */
  public setError(err: any): void {
    if (this._isDisposed) return;
    this._error.set(err);
  }

  /**
   * Clears any active error in the model.
   */
  public clearError(): void {
    if (this._isDisposed) return;
    this._error.set(null);
  }

  /**
   * Validates the given data against the model's Zod schema.
   * @param data The data to validate.
   * @returns The parsed and validated data.
   * @throws ZodError if validation fails.
   */
  public validate(data: any): TData {
    if (!this.schema) {
      console.warn('No Zod schema provided for this BaseModel instance. Validation will not occur.');
      return data as TData; // Return data as is if no schema provided
    }
    return this.schema.parse(data);
  }

  /**
   * Gets the current value of the data signal.
   * @returns The current data value.
   */
  public getCurrentData(): TData | null {
    return this._data.peek();
  }

  /**
   * Gets the current loading status.
   * @returns The current loading status.
   */
  public getCurrentLoadingStatus(): boolean {
    return this._isLoading.peek();
  }

  /**
   * Gets the current error.
   * @returns The current error value.
   */
  public getCurrentError(): any {
    return this._error.peek();
  }
}
