import { BehaviorSubject, Observable } from 'rxjs';
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
 * Defines the core observables and methods for a BaseModel.
 * @template TData The type of data managed by the model.
 * @template TSchema The Zod schema type for validating the data.
 */
export interface IBaseModel<TData, TSchema extends ZodSchema<TData>> extends IDisposable {
  readonly data$: Observable<TData | null>;
  readonly isLoading$: Observable<boolean>;
  readonly error$: Observable<any>;
  readonly schema?: TSchema;

  setData(newData: TData | null): void;
  setLoading(status: boolean): void;
  setError(err: any): void;
  clearError(): void;
  validate(data: any): TData;
}

export type TConstructorInput<TData, TSchema extends ZodSchema<TData>> = {
  initialData?: TData | null;
  schema?: TSchema;
};

/**
 * @class BaseModel
 * A base class for models in an MVVM architecture, providing core functionalities
 * for data management, loading states, error handling, and Zod validation.
 * Implements {@link IDisposable} to manage resource cleanup by completing its observables.
 * @template TData The type of data managed by the model.
 * @template TSchema The Zod schema type for validating the data.
 */
export class BaseModel<TData, TSchema extends ZodSchema<TData>> implements IBaseModel<TData, TSchema> {
  protected _data$ = new BehaviorSubject<TData | null>(null);
  public readonly data$: Observable<TData | null> = this._data$.asObservable();

  protected _isLoading$ = new BehaviorSubject<boolean>(false);
  public readonly isLoading$: Observable<boolean> = this._isLoading$.asObservable();

  protected _error$ = new BehaviorSubject<any>(null);
  public readonly error$: Observable<any> = this._error$.asObservable();

  public readonly schema?: TSchema;

  /**
   * Cleans up resources used by the model.
   * This method completes the observables, preventing further emissions
   * and signaling to subscribers that the observables are closed.
   */
  public dispose(): void {
    this._data$.complete();
    this._isLoading$.complete();
    this._error$.complete();
  }

  constructor(input: TConstructorInput<TData, TSchema>) {
    const { initialData = null, schema } = input;
    // Initialize the data observable with the provided initial data
    if (initialData !== null) {
      this._data$.next(initialData);
    }
    this.schema = schema;
  }

  /**
   * Updates the model's data.
   * @param newData The new data to set.
   */
  public setData(newData: TData | null): void {
    this._data$.next(newData);
  }

  /**
   * Sets the loading status of the model.
   * @param status True if loading, false otherwise.
   */
  public setLoading(status: boolean): void {
    this._isLoading$.next(status);
  }

  /**
   * Sets an error for the model.
   * @param err The error object.
   */
  public setError(err: any): void {
    this._error$.next(err);
  }

  /**
   * Clears any active error in the model.
   */
  public clearError(): void {
    this._error$.next(null);
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
}
