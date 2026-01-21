import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { map, filter, startWith, distinctUntilChanged } from 'rxjs/operators';

/**
 * Tracks validation errors for multiple properties of type T.
 * Provides per-field error observables for reactive UI binding.
 *
 * @template T The shape of the object being validated
 */
export class ErrorsContainer<T extends Record<string, any>> {
  private readonly errors = new Map<keyof T, string[]>();
  private readonly _errorsChanged$ = new Subject<keyof T | null>();

  /**
   * Emits the property name when errors change, or null for overall state changes
   */
  public readonly errorsChanged$: Observable<keyof T | null> = this._errorsChanged$.asObservable();

  /**
   * Observable that emits true when any property has errors
   */
  public readonly hasErrors$: Observable<boolean> = this._errorsChanged$.pipe(
    startWith(null),
    map(() => this.hasErrors),
    distinctUntilChanged(),
  );

  /**
   * Set errors for a specific property
   * @param propertyName The property name (type-safe)
   * @param errors Array of error messages (empty array clears errors)
   */
  setErrors(propertyName: keyof T, errors: string[]): void {
    const hadErrors = this.hasErrors;

    if (errors.length === 0) {
      this.errors.delete(propertyName);
    } else {
      this.errors.set(propertyName, [...errors]);
    }

    this._errorsChanged$.next(propertyName);

    // Emit null if overall hasErrors state changed
    if (hadErrors !== this.hasErrors) {
      this._errorsChanged$.next(null);
    }
  }

  /**
   * Get errors for a specific property (synchronous)
   */
  getErrors(propertyName: keyof T): string[] {
    return this.errors.get(propertyName) || [];
  }

  /**
   * Get errors as an observable stream for a specific property.
   * Emits current errors immediately, then on any change.
   */
  getErrors$(propertyName: keyof T): Observable<string[]> {
    return this._errorsChanged$.pipe(
      filter((prop) => prop === null || prop === propertyName),
      map(() => this.getErrors(propertyName)),
      startWith(this.getErrors(propertyName)),
      distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
    );
  }

  /**
   * Get first error for a property (convenience for single-error display)
   */
  getFirstError$(propertyName: keyof T): Observable<string | null | undefined> {
    return this.getErrors$(propertyName).pipe(map((errors) => (errors.length > 0 ? errors[0] : null)));
  }

  /**
   * Check if a property has errors (synchronous)
   */
  hasPropertyErrors(propertyName: keyof T): boolean {
    return this.errors.has(propertyName);
  }

  /**
   * Observable for checking if a specific property has errors
   */
  hasPropertyErrors$(propertyName: keyof T): Observable<boolean> {
    return this.getErrors$(propertyName).pipe(
      map((errors) => errors.length > 0),
      distinctUntilChanged(),
    );
  }

  /**
   * Check if any property has errors (synchronous)
   */
  get hasErrors(): boolean {
    return this.errors.size > 0;
  }

  /**
   * Get all errors as a flat array
   */
  getAllErrors(): string[] {
    return Array.from(this.errors.values()).flat();
  }

  /**
   * Get all errors as a record (for bulk display)
   */
  getAllErrorsAsRecord(): Partial<Record<keyof T, string[]>> {
    const result: Partial<Record<keyof T, string[]>> = {};
    this.errors.forEach((errors, key) => {
      result[key] = errors;
    });
    return result;
  }

  /**
   * Get all properties that have errors
   */
  getPropertiesWithErrors(): Array<keyof T> {
    return Array.from(this.errors.keys());
  }

  /**
   * Clear errors for a specific property or all properties
   */
  clearErrors(propertyName?: keyof T): void {
    if (propertyName) {
      this.errors.delete(propertyName);
      this._errorsChanged$.next(propertyName);
    } else {
      this.errors.clear();
      this._errorsChanged$.next(null);
    }
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this._errorsChanged$.complete();
    this.errors.clear();
  }
}
