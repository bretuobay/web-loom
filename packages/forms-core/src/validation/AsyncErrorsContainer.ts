import { BehaviorSubject, Observable } from 'rxjs';
import { ErrorsContainer } from './ErrorsContainer';

/**
 * Extends ErrorsContainer with async validation support.
 * Tracks which properties are currently being validated.
 */
export class AsyncErrorsContainer<T extends Record<string, any>> extends ErrorsContainer<T> {
  private readonly validatingProperties = new Set<keyof T>();
  private readonly _isValidating$ = new BehaviorSubject<boolean>(false);
  private readonly _validatingProperties$ = new BehaviorSubject<Array<keyof T>>([]);
  private pendingValidations = new Map<keyof T, AbortController>();

  /**
   * Observable indicating if any async validation is in progress
   */
  public readonly isValidating$: Observable<boolean> = this._isValidating$.asObservable();

  /**
   * Observable of properties currently being validated
   */
  public readonly validatingProperties$: Observable<Array<keyof T>> = this._validatingProperties$.asObservable();

  /**
   * Check if a specific property is currently being validated
   */
  isPropertyValidating(propertyName: keyof T): boolean {
    return this.validatingProperties.has(propertyName);
  }

  /**
   * Perform async validation for a property.
   * Automatically handles loading state and error setting.
   *
   * @param propertyName The property to validate
   * @param value The value to validate
   * @param validator Async function that returns error messages
   */
  async validateAsync(
    propertyName: keyof T,
    value: T[keyof T],
    validator: (value: T[keyof T]) => Promise<string[]>,
  ): Promise<void> {
    // Cancel any pending validation for this property
    this.cancelPendingValidation(propertyName);

    this.validatingProperties.add(propertyName);
    this.updateValidatingState();

    try {
      const errors = await validator(value);
      this.setErrors(propertyName, errors);
    } finally {
      this.validatingProperties.delete(propertyName);
      this.updateValidatingState();
    }
  }

  /**
   * Perform async validation with debouncing.
   * Returns a cancel function for cleanup.
   *
   * @param propertyName The property to validate
   * @param value The value to validate
   * @param validator Async function that returns error messages
   * @param debounceMs Debounce delay in milliseconds (default: 300)
   * @returns Cancel function
   */
  validateAsyncDebounced(
    propertyName: keyof T,
    value: T[keyof T],
    validator: (value: T[keyof T]) => Promise<string[]>,
    debounceMs: number = 300,
  ): () => void {
    // Cancel any pending validation for this property
    this.cancelPendingValidation(propertyName);

    const controller = new AbortController();
    this.pendingValidations.set(propertyName, controller);

    const timeoutId = setTimeout(async () => {
      if (!controller.signal.aborted) {
        await this.validateAsync(propertyName, value, validator);
      }
      this.pendingValidations.delete(propertyName);
    }, debounceMs);

    return () => {
      controller.abort();
      clearTimeout(timeoutId);
      this.pendingValidations.delete(propertyName);
    };
  }

  /**
   * Cancel pending validation for a property
   */
  cancelPendingValidation(propertyName: keyof T): void {
    const controller = this.pendingValidations.get(propertyName);
    if (controller) {
      controller.abort();
      this.pendingValidations.delete(propertyName);
    }
  }

  /**
   * Cancel all pending validations
   */
  cancelAllPendingValidations(): void {
    this.pendingValidations.forEach((controller) => controller.abort());
    this.pendingValidations.clear();
  }

  private updateValidatingState(): void {
    this._isValidating$.next(this.validatingProperties.size > 0);
    this._validatingProperties$.next(Array.from(this.validatingProperties));
  }

  override dispose(): void {
    super.dispose();
    this.cancelAllPendingValidations();
    this._isValidating$.complete();
    this._validatingProperties$.complete();
  }
}
