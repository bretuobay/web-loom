# Task: Property-Level Validation Errors Container

**Target Package**: `packages/forms-core`
**Priority**: P1 (High Impact, Medium Effort)
**Status**: Not Started
**Estimated Files**: 3 new files
**Breaking Changes**: None (additive feature)

---

## Overview

Implement `ErrorsContainer<T>` class that tracks validation errors per property, enabling field-level error display in forms. This provides granular error observables for each form field with Zod integration.

## Target Location

```
packages/forms-core/src/
├── validation/
│   ├── ErrorsContainer.ts        (NEW)
│   ├── AsyncErrorsContainer.ts   (NEW)
│   ├── zodHelpers.ts             (NEW)
│   └── index.ts                  (NEW)
└── index.ts                      (update exports)
```

**Note**: Check existing `packages/forms-core` structure and adapt paths accordingly.

## Web Use Cases

- Form fields showing inline validation errors
- Real-time validation feedback as users type
- Error highlighting on specific fields
- Form submission blocking based on field-level errors
- Async validation (email uniqueness, username availability)

## Implementation Steps

### Step 1: Create ErrorsContainer Class

Create `src/validation/ErrorsContainer.ts`:

```typescript
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
  getFirstError$(propertyName: keyof T): Observable<string | null> {
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
```

### Step 2: Create AsyncErrorsContainer

Create `src/validation/AsyncErrorsContainer.ts`:

```typescript
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
```

### Step 3: Create Zod Integration Helpers

Create `src/validation/zodHelpers.ts`:

```typescript
import { ZodError, ZodSchema } from 'zod';
import { ErrorsContainer } from './ErrorsContainer';

/**
 * Populate ErrorsContainer from a ZodError
 */
export function populateFromZodError<T extends Record<string, any>>(
  container: ErrorsContainer<T>,
  zodError: ZodError,
): void {
  // Clear previous errors
  container.clearErrors();

  // Group errors by field path
  const errorsByField = new Map<keyof T, string[]>();

  zodError.errors.forEach((err) => {
    const propertyName = err.path[0] as keyof T;
    if (propertyName) {
      const existing = errorsByField.get(propertyName) || [];
      existing.push(err.message);
      errorsByField.set(propertyName, existing);
    }
  });

  // Set errors for each field
  errorsByField.forEach((errors, propertyName) => {
    container.setErrors(propertyName, errors);
  });
}

/**
 * Validate data against Zod schema and populate ErrorsContainer.
 *
 * @returns true if valid, false if errors
 */
export function validateWithZod<T extends Record<string, any>>(
  container: ErrorsContainer<T>,
  schema: ZodSchema<T>,
  data: Partial<T>,
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
 * Validate a single field against Zod schema.
 * Only sets errors for the specified field.
 *
 * @returns true if field is valid, false if has errors
 */
export function validateFieldWithZod<T extends Record<string, any>>(
  container: ErrorsContainer<T>,
  schema: ZodSchema<T>,
  propertyName: keyof T,
  value: T[keyof T],
  currentData: Partial<T>,
): boolean {
  const dataToValidate = { ...currentData, [propertyName]: value } as T;
  const result = schema.safeParse(dataToValidate);

  if (result.success) {
    container.setErrors(propertyName, []);
    return true;
  } else {
    const fieldErrors = result.error.errors.filter((err) => err.path[0] === propertyName).map((err) => err.message);

    container.setErrors(propertyName, fieldErrors);
    return fieldErrors.length === 0;
  }
}
```

### Step 4: Create Validation Index

Create `src/validation/index.ts`:

```typescript
export { ErrorsContainer } from './ErrorsContainer';
export { AsyncErrorsContainer } from './AsyncErrorsContainer';
export { populateFromZodError, validateWithZod, validateFieldWithZod } from './zodHelpers';
```

### Step 5: Add Tests

Create `src/validation/ErrorsContainer.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { firstValueFrom, take, toArray } from 'rxjs';
import { z } from 'zod';
import { ErrorsContainer } from './ErrorsContainer';
import { AsyncErrorsContainer } from './AsyncErrorsContainer';
import { validateWithZod, validateFieldWithZod } from './zodHelpers';

interface TestForm {
  username: string;
  email: string;
  password: string;
}

describe('ErrorsContainer', () => {
  let container: ErrorsContainer<TestForm>;

  beforeEach(() => {
    container = new ErrorsContainer<TestForm>();
  });

  describe('setErrors/getErrors', () => {
    it('should set and get errors for a property', () => {
      container.setErrors('username', ['Username is required']);
      expect(container.getErrors('username')).toEqual(['Username is required']);
    });

    it('should clear errors when setting empty array', () => {
      container.setErrors('username', ['Error']);
      container.setErrors('username', []);
      expect(container.getErrors('username')).toEqual([]);
    });

    it('should support multiple errors per property', () => {
      container.setErrors('password', ['Too short', 'Needs number']);
      expect(container.getErrors('password')).toEqual(['Too short', 'Needs number']);
    });
  });

  describe('hasErrors', () => {
    it('should be false initially', () => {
      expect(container.hasErrors).toBe(false);
    });

    it('should be true when errors exist', () => {
      container.setErrors('username', ['Error']);
      expect(container.hasErrors).toBe(true);
    });
  });

  describe('getErrors$', () => {
    it('should emit current errors immediately', async () => {
      container.setErrors('email', ['Invalid email']);
      const errors = await firstValueFrom(container.getErrors$('email'));
      expect(errors).toEqual(['Invalid email']);
    });

    it('should emit when errors change', async () => {
      const errorsPromise = container.getErrors$('email').pipe(take(3), toArray()).toPromise();

      container.setErrors('email', ['Error 1']);
      container.setErrors('email', ['Error 2']);

      const emissions = await errorsPromise;
      expect(emissions).toEqual([[], ['Error 1'], ['Error 2']]);
    });
  });

  describe('clearErrors', () => {
    it('should clear specific property errors', () => {
      container.setErrors('username', ['Error']);
      container.setErrors('email', ['Error']);
      container.clearErrors('username');

      expect(container.getErrors('username')).toEqual([]);
      expect(container.getErrors('email')).toEqual(['Error']);
    });

    it('should clear all errors when no property specified', () => {
      container.setErrors('username', ['Error']);
      container.setErrors('email', ['Error']);
      container.clearErrors();

      expect(container.hasErrors).toBe(false);
    });
  });
});

describe('AsyncErrorsContainer', () => {
  let container: AsyncErrorsContainer<TestForm>;

  beforeEach(() => {
    container = new AsyncErrorsContainer<TestForm>();
  });

  describe('validateAsync', () => {
    it('should set errors from async validator', async () => {
      await container.validateAsync('email', 'test@test.com', async () => ['Email already exists']);

      expect(container.getErrors('email')).toEqual(['Email already exists']);
    });

    it('should track validating state', async () => {
      let wasValidating = false;

      const validationPromise = container.validateAsync('email', 'test@test.com', async () => {
        wasValidating = container.isPropertyValidating('email');
        return [];
      });

      await validationPromise;
      expect(wasValidating).toBe(true);
      expect(container.isPropertyValidating('email')).toBe(false);
    });
  });
});

describe('Zod Integration', () => {
  const schema = z.object({
    username: z.string().min(3, 'Username must be at least 3 characters'),
    email: z.string().email('Invalid email format'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
  });

  it('should populate errors from Zod validation', () => {
    const container = new ErrorsContainer<TestForm>();
    const isValid = validateWithZod(container, schema, {
      username: 'ab',
      email: 'invalid',
      password: '123',
    });

    expect(isValid).toBe(false);
    expect(container.getErrors('username')).toContain('Username must be at least 3 characters');
    expect(container.getErrors('email')).toContain('Invalid email format');
    expect(container.getErrors('password')).toContain('Password must be at least 8 characters');
  });

  it('should validate single field', () => {
    const container = new ErrorsContainer<TestForm>();
    const isValid = validateFieldWithZod(container, schema, 'email', 'invalid', {
      username: 'valid',
      email: '',
      password: '12345678',
    });

    expect(isValid).toBe(false);
    expect(container.getErrors('email')).toContain('Invalid email format');
    expect(container.getErrors('username')).toEqual([]); // Not validated
  });
});
```

### Step 6: Update Package Index

Update `packages/forms-core/src/index.ts`:

```typescript
// ... existing exports ...

export * from './validation';
```

---

## Acceptance Criteria

- [ ] `ErrorsContainer<T>` class with type-safe property keys
- [ ] `setErrors()`, `getErrors()`, `clearErrors()` methods
- [ ] `getErrors$()` returns observable for specific property
- [ ] `hasErrors$` observable for overall validation state
- [ ] `AsyncErrorsContainer` extends with async validation support
- [ ] `isValidating$` observable during async validation
- [ ] Debounced validation support with cancellation
- [ ] Zod helpers: `populateFromZodError`, `validateWithZod`, `validateFieldWithZod`
- [ ] Unit tests pass
- [ ] `dispose()` cleans up resources
- [ ] Exported from package index

---

## Usage Example

```typescript
import { ErrorsContainer, validateFieldWithZod } from '@anthropic/forms-core';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

class LoginFormViewModel {
  private errors = new ErrorsContainer<z.infer<typeof schema>>();

  // Per-field error observables for view binding
  public emailErrors$ = this.errors.getErrors$('email');
  public passwordErrors$ = this.errors.getErrors$('password');
  public hasErrors$ = this.errors.hasErrors$;

  onEmailChange(email: string) {
    validateFieldWithZod(this.errors, schema, 'email', email, this.formData);
  }
}
```

---

## Dependencies

- RxJS: `Observable`, `Subject`, `BehaviorSubject`
- Zod (existing dependency in forms-core)
