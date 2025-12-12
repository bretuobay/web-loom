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
export declare class BaseModel<TData, TSchema extends ZodSchema<TData>> implements IBaseModel<TData, TSchema> {
    protected _data$: BehaviorSubject<TData | null>;
    readonly data$: Observable<TData | null>;
    protected _isLoading$: BehaviorSubject<boolean>;
    readonly isLoading$: Observable<boolean>;
    protected _error$: BehaviorSubject<any>;
    readonly error$: Observable<any>;
    readonly schema?: TSchema;
    /**
     * Cleans up resources used by the model.
     * This method completes the observables, preventing further emissions
     * and signaling to subscribers that the observables are closed.
     */
    dispose(): void;
    constructor(input: TConstructorInput<TData, TSchema>);
    /**
     * Updates the model's data.
     * @param newData The new data to set.
     */
    setData(newData: TData | null): void;
    /**
     * Sets the loading status of the model.
     * @param status True if loading, false otherwise.
     */
    setLoading(status: boolean): void;
    /**
     * Sets an error for the model.
     * @param err The error object.
     */
    setError(err: any): void;
    /**
     * Clears any active error in the model.
     */
    clearError(): void;
    /**
     * Validates the given data against the model's Zod schema.
     * @param data The data to validate.
     * @returns The parsed and validated data.
     * @throws ZodError if validation fails.
     */
    validate(data: any): TData;
}
//# sourceMappingURL=BaseModel.d.ts.map