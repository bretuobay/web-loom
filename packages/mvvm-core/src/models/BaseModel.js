import { BehaviorSubject } from 'rxjs';
/**
 * @class BaseModel
 * A base class for models in an MVVM architecture, providing core functionalities
 * for data management, loading states, error handling, and Zod validation.
 * Implements {@link IDisposable} to manage resource cleanup by completing its observables.
 * @template TData The type of data managed by the model.
 * @template TSchema The Zod schema type for validating the data.
 */
export class BaseModel {
    _data$ = new BehaviorSubject(null);
    data$ = this._data$.asObservable();
    _isLoading$ = new BehaviorSubject(false);
    isLoading$ = this._isLoading$.asObservable();
    _error$ = new BehaviorSubject(null);
    error$ = this._error$.asObservable();
    schema;
    /**
     * Cleans up resources used by the model.
     * This method completes the observables, preventing further emissions
     * and signaling to subscribers that the observables are closed.
     */
    dispose() {
        this._data$.complete();
        this._isLoading$.complete();
        this._error$.complete();
    }
    constructor(input) {
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
    setData(newData) {
        this._data$.next(newData);
    }
    /**
     * Sets the loading status of the model.
     * @param status True if loading, false otherwise.
     */
    setLoading(status) {
        this._isLoading$.next(status);
    }
    /**
     * Sets an error for the model.
     * @param err The error object.
     */
    setError(err) {
        this._error$.next(err);
    }
    /**
     * Clears any active error in the model.
     */
    clearError() {
        this._error$.next(null);
    }
    /**
     * Validates the given data against the model's Zod schema.
     * @param data The data to validate.
     * @returns The parsed and validated data.
     * @throws ZodError if validation fails.
     */
    validate(data) {
        if (!this.schema) {
            console.warn('No Zod schema provided for this BaseModel instance. Validation will not occur.');
            return data; // Return data as is if no schema provided
        }
        return this.schema.parse(data);
    }
}
