# Task: Property-Level Validation Errors Container

**Priority**: P1 (High Impact, Medium Effort)
**Status**: Not Started
**Estimated Files**: 2-3 new files
**Breaking Changes**: None (additive feature)

---

## Overview

Implement `ErrorsContainer<T>` class that tracks validation errors per property, enabling field-level error display in forms. This enhances the existing Zod validation by providing granular error observables for each form field.

## Web Relevance Assessment

**Highly relevant for web development:**
- Form fields showing inline validation errors
- Real-time validation feedback as users type
- Error highlighting on specific fields
- Form submission blocking based on field-level errors
- Accessible error announcements per field

**Current gap**: BaseModel has `error$` for overall errors, but no property-level error tracking. The existing `form-view-model.ts` has `fieldErrors$` but ErrorsContainer provides a more robust, reusable pattern.

## Implementation Steps

### Step 1: Create ErrorsContainer Class

Create `src/validation/ErrorsContainer.ts`:

```typescript
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { map, filter, startWith } from 'rxjs/operators';

/**
 * Tracks validation errors for multiple properties
 * @template T The shape of the object being validated
 */
export class ErrorsContainer<T extends Record<string, any>> {
  private readonly errors = new Map<keyof T, string[]>();
  private readonly _errorsChanged$ = new Subject<keyof T | null>();

  /**
   * Emits the property name when errors change, or null for overall state changes
   */
  public readonly errorsChanged$: Observable<keyof T | null> =
    this._errorsChanged$.asObservable();

  /**
   * Observable that emits true when any property has errors
   */
  public readonly hasErrors$: Observable<boolean> = this._errorsChanged$.pipe(
    startWith(null),
    map(() => this.hasErrors)
  );

  /**
   * Set errors for a specific property
   * @param propertyName The property name
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
   * Get errors for a specific property
   */
  getErrors(propertyName: keyof T): string[] {
    return this.errors.get(propertyName) || [];
  }

  /**
   * Get errors as an observable stream for a specific property
   */
  getErrors$(propertyName: keyof T): Observable<string[]> {
    return this._errorsChanged$.pipe(
      filter(prop => prop === null || prop === propertyName),
      map(() => this.getErrors(propertyName)),
      startWith(this.getErrors(propertyName))
    );
  }

  /**
   * Check if a property has errors
   */
  hasPropertyErrors(propertyName: keyof T): boolean {
    return this.errors.has(propertyName);
  }

  /**
   * Check if any property has errors
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
   * Get all errors as a record
   */
  getAllErrorsAsRecord(): Partial<Record<keyof T, string[]>> {
    const result: Partial<Record<keyof T, string[]>> = {};
    this.errors.forEach((errors, key) => {
      result[key] = errors;
    });
    return result;
  }

  /**
   * Clear errors for a specific property or all properties
   */
  clearErrors(propertyName?: keyof T): void {
    if (propertyName) {
      this.errors.delete(propertyName);
      this._errorsChanged$.next(propertyName);
    } else {
      const hadErrors = this.hasErrors;
      this.errors.clear();
      this._errorsChanged$.next(null);
    }
  }

  /**
   * Clean up
   */
  dispose(): void {
    this._errorsChanged$.complete();
    this.errors.clear();
  }
}
```

### Step 2: Create AsyncErrorsContainer for Async Validation

Create `src/validation/AsyncErrorsContainer.ts`:

```typescript
import { BehaviorSubject, Observable } from 'rxjs';
import { ErrorsContainer } from './ErrorsContainer';

/**
 * Extends ErrorsContainer with async validation support
 */
export class AsyncErrorsContainer<T extends Record<string, any>>
  extends ErrorsContainer<T> {

  private readonly validatingProperties = new Set<keyof T>();
  private readonly _isValidating$ = new BehaviorSubject<boolean>(false);

  /**
   * Observable indicating if any async validation is in progress
   */
  public readonly isValidating$: Observable<boolean> =
    this._isValidating$.asObservable();

  /**
   * Check if a specific property is currently being validated
   */
  isPropertyValidating(propertyName: keyof T): boolean {
    return this.validatingProperties.has(propertyName);
  }

  /**
   * Perform async validation for a property
   * @param propertyName The property to validate
   * @param value The value to validate
   * @param validator Async function that returns error messages
   */
  async validateAsync(
    propertyName: keyof T,
    value: T[keyof T],
    validator: (value: T[keyof T]) => Promise<string[]>
  ): Promise<void> {
    this.validatingProperties.add(propertyName);
    this._isValidating$.next(true);

    try {
      const errors = await validator(value);
      this.setErrors(propertyName, errors);
    } finally {
      this.validatingProperties.delete(propertyName);
      this._isValidating$.next(this.validatingProperties.size > 0);
    }
  }

  /**
   * Perform async validation with debouncing built-in
   * Returns an abort function to cancel pending validation
   */
  validateAsyncDebounced(
    propertyName: keyof T,
    value: T[keyof T],
    validator: (value: T[keyof T]) => Promise<string[]>,
    debounceMs: number = 300
  ): () => void {
    let cancelled = false;

    const timeoutId = setTimeout(async () => {
      if (!cancelled) {
        await this.validateAsync(propertyName, value, validator);
      }
    }, debounceMs);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }

  override dispose(): void {
    super.dispose();
    this._isValidating$.complete();
    this.validatingProperties.clear();
  }
}
```

### Step 3: Add Zod Integration Helper

Create `src/validation/zodHelpers.ts`:

```typescript
import { ZodError, ZodSchema } from 'zod';
import { ErrorsContainer } from './ErrorsContainer';

/**
 * Populate ErrorsContainer from ZodError
 */
export function populateFromZodError<T extends Record<string, any>>(
  container: ErrorsContainer<T>,
  zodError: ZodError
): void {
  // Clear previous errors
  container.clearErrors();

  // Group errors by field
  zodError.errors.forEach(err => {
    const propertyName = err.path[0] as keyof T;
    if (propertyName) {
      const existingErrors = container.getErrors(propertyName);
      container.setErrors(propertyName, [...existingErrors, err.message]);
    }
  });
}

/**
 * Validate data against Zod schema and populate ErrorsContainer
 * @returns true if valid, false if errors
 */
export function validateWithZod<T extends Record<string, any>>(
  container: ErrorsContainer<T>,
  schema: ZodSchema<T>,
  data: Partial<T>
): boolean {
  const result = schema.safeParse(data);

  if (result.success) {
    container.clearErrors();
    return true;
  } else {
    populateFromZodError(container, result.error);
    return false;
  }
}

/**
 * Validate a single field against Zod schema
 */
export function validateFieldWithZod<T extends Record<string, any>>(
  container: ErrorsContainer<T>,
  schema: ZodSchema<T>,
  propertyName: keyof T,
  value: T[keyof T],
  currentData: Partial<T>
): boolean {
  const dataToValidate = { ...currentData, [propertyName]: value };
  const result = schema.safeParse(dataToValidate);

  if (result.success) {
    container.setErrors(propertyName, []);
    return true;
  } else {
    const fieldErrors = result.error.errors
      .filter(err => err.path[0] === propertyName)
      .map(err => err.message);

    container.setErrors(propertyName, fieldErrors);
    return fieldErrors.length === 0;
  }
}
```

### Step 4: Add Tests

Create `src/validation/ErrorsContainer.test.ts`:

1. **Basic error management:**
   - setErrors() stores errors
   - getErrors() retrieves errors
   - clearErrors() clears single property
   - clearErrors() clears all

2. **Observables:**
   - errorsChanged$ emits on setErrors
   - getErrors$() returns stream for property
   - hasErrors$ updates correctly

3. **Error aggregation:**
   - getAllErrors() flattens all errors
   - getAllErrorsAsRecord() returns record
   - hasErrors reflects state correctly

4. **AsyncErrorsContainer tests:**
   - validateAsync() works
   - isValidating$ updates during validation
   - validateAsyncDebounced() debounces calls

5. **Zod integration tests:**
   - populateFromZodError() maps errors correctly
   - validateWithZod() validates and populates
   - validateFieldWithZod() validates single field

### Step 5: Integration with FormViewModel

Document how to use with existing `form-view-model.ts`:

```typescript
class EnhancedFormViewModel<TData, TSchema> extends FormViewModel<TData, TSchema> {
  protected readonly errorsContainer = new ErrorsContainer<TData>();

  // Per-field error observables
  public getFieldErrors$(field: keyof TData): Observable<string[]> {
    return this.errorsContainer.getErrors$(field);
  }

  // Validate on field change
  protected onFieldChange(field: keyof TData, value: TData[keyof TData]): void {
    validateFieldWithZod(this.errorsContainer, this.schema, field, value, this.formData);
  }
}
```

### Step 6: Export from Index

Update `src/index.ts`:

```typescript
export { ErrorsContainer } from './validation/ErrorsContainer';
export { AsyncErrorsContainer } from './validation/AsyncErrorsContainer';
export { populateFromZodError, validateWithZod, validateFieldWithZod } from './validation/zodHelpers';
```

---

## Acceptance Criteria

- [ ] `ErrorsContainer<T>` class implemented with type-safe property keys
- [ ] `setErrors()`, `getErrors()`, `clearErrors()` methods work correctly
- [ ] `getErrors$()` returns observable for specific property
- [ ] `hasErrors$` observable for overall validation state
- [ ] `AsyncErrorsContainer` extends with async validation support
- [ ] `isValidating$` observable during async validation
- [ ] Zod integration helpers: `populateFromZodError`, `validateWithZod`, `validateFieldWithZod`
- [ ] Unit tests for all functionality
- [ ] dispose() cleans up subscriptions
- [ ] Exported from package index
- [ ] Documentation for FormViewModel integration

---

## Dependencies

- RxJS operators
- Zod (existing dependency)
- Existing FormViewModel (optional integration)

---

## Breaking Changes

**None** - This is additive:
- New files only
- Optional integration with existing FormViewModel
- Does not modify existing validation behavior
