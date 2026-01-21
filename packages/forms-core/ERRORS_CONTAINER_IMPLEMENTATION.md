# ErrorsContainer Implementation

## Overview

This document describes the implementation of property-level validation error tracking for the `forms-core` package. The ErrorsContainer provides reactive, type-safe error management for form fields with seamless Zod integration.

## Implementation Summary

### Files Created

1. **`src/validation/ErrorsContainer.ts`** - Core implementation
   - `ErrorsContainer<T>` class - Tracks validation errors per property
   - Per-field error observables
   - Type-safe property keys

2. **`src/validation/AsyncErrorsContainer.ts`** - Async validation support
   - `AsyncErrorsContainer<T>` class - Extends ErrorsContainer
   - Async validation with loading states
   - Debounced validation with cancellation
   - Tracks validating properties

3. **`src/validation/zodHelpers.ts`** - Zod integration
   - `populateFromZodError()` - Populate container from ZodError
   - `validateWithZodContainer()` - Validate entire form
   - `validateFieldWithZodContainer()` - Validate single field

4. **`src/validation/ErrorsContainer.test.ts`** - Comprehensive test suite
   - 41 test cases covering all functionality
   - Tests for ErrorsContainer and AsyncErrorsContainer
   - Zod integration tests
   - Async validation and debouncing tests

5. **`src/validation/README.md`** - Complete documentation
   - API reference
   - Usage examples
   - Integration patterns
   - Best practices

6. **`src/validation/examples.ts`** - Practical examples
   - 10 different usage scenarios
   - ViewModel integration examples
   - Async validation examples
   - Real-time validation patterns

### Files Modified

1. **`src/validation/index.ts`** - Added exports for new classes

## Features Implemented

### ErrorsContainer<T>

Core functionality for tracking validation errors:

- ✅ `setErrors()` - Set errors for a property
- ✅ `getErrors()` - Get errors synchronously
- ✅ `getErrors$()` - Get errors as observable stream
- ✅ `getFirstError$()` - Get first error as observable
- ✅ `hasPropertyErrors()` - Check if property has errors
- ✅ `hasPropertyErrors$()` - Observable property error state
- ✅ `hasErrors` - Synchronous check for any errors
- ✅ `hasErrors$` - Observable overall error state
- ✅ `getAllErrors()` - Get all errors as flat array
- ✅ `getAllErrorsAsRecord()` - Get errors grouped by property
- ✅ `getPropertiesWithErrors()` - Get properties with errors
- ✅ `clearErrors()` - Clear errors for property or all
- ✅ `dispose()` - Clean up resources

### AsyncErrorsContainer<T>

Extended functionality for async validation:

- ✅ `validateAsync()` - Perform async validation
- ✅ `validateAsyncDebounced()` - Debounced async validation
- ✅ `isPropertyValidating()` - Check if property is validating
- ✅ `isValidating$` - Observable validation state
- ✅ `validatingProperties$` - Observable of validating properties
- ✅ `cancelPendingValidation()` - Cancel validation for property
- ✅ `cancelAllPendingValidations()` - Cancel all validations

### Zod Integration

- ✅ `populateFromZodError()` - Populate from ZodError
- ✅ `validateWithZodContainer()` - Validate entire form
- ✅ `validateFieldWithZodContainer()` - Validate single field

### Key Design Decisions

1. **RxJS Integration**: Uses `Subject` and `BehaviorSubject` for reactive state
2. **Type Safety**: Generic type parameter ensures type-safe property keys
3. **Observable Streams**: All error states available as observables for reactive UI
4. **Debouncing**: Built-in debounced validation for real-time input
5. **Cancellation**: Async validations can be cancelled to prevent race conditions
6. **Memory Safety**: Proper cleanup with `dispose()` method
7. **Zod Integration**: Helper functions for seamless Zod schema validation

## Test Coverage

All 41 tests pass successfully:

### ErrorsContainer Tests (27 tests)

- Setting and getting errors
- Checking error state
- Observable error streams
- First error observable
- Property error checks
- Getting all errors
- Clearing errors
- Disposal

### AsyncErrorsContainer Tests (10 tests)

- Async validation
- Validation state tracking
- Debounced validation
- Cancellation
- Validating properties observable
- Disposal with cleanup

### Zod Integration Tests (4 tests)

- Populating errors from Zod validation
- Validating entire form
- Validating single field
- Clearing errors on valid data

## Integration Examples

### 1. React Form Component

```typescript
function LoginForm() {
  const [errors] = useState(() => new ErrorsContainer<LoginFormData>());
  const [emailErrors, setEmailErrors] = useState<string[]>([]);

  useEffect(() => {
    const sub = errors.getErrors$('email').subscribe(setEmailErrors);
    return () => {
      sub.unsubscribe();
      errors.dispose();
    };
  }, [errors]);

  const handleEmailChange = (email: string) => {
    validateFieldWithZodContainer(
      errors,
      schema,
      'email',
      email,
      { email, password: '' }
    );
  };

  return (
    <div>
      <input onChange={(e) => handleEmailChange(e.target.value)} />
      {emailErrors.map((error, i) => (
        <div key={i} className="error">{error}</div>
      ))}
    </div>
  );
}
```

### 2. ViewModel Integration

```typescript
class RegistrationViewModel {
  private errors = new ErrorsContainer<FormData>();

  public readonly usernameErrors$ = this.errors.getErrors$('username');
  public readonly emailErrors$ = this.errors.getErrors$('email');
  public readonly hasErrors$ = this.errors.hasErrors$;

  updateField<K extends keyof FormData>(field: K, value: FormData[K]): void {
    validateFieldWithZodContainer(this.errors, schema, field, value, this.formData);
  }

  submit(): boolean {
    return validateWithZodContainer(this.errors, schema, this.formData);
  }

  dispose(): void {
    this.errors.dispose();
  }
}
```

### 3. Async Email Validation

```typescript
class EmailValidator {
  private errors = new AsyncErrorsContainer<{ email: string }>();

  public readonly emailErrors$ = this.errors.getErrors$('email');
  public readonly isValidating$ = this.errors.isValidating$;

  validateEmail(email: string): void {
    this.errors.validateAsyncDebounced(
      'email',
      email,
      async (value) => {
        const response = await fetch(`/api/check-email?email=${value}`);
        const { exists } = await response.json();
        return exists ? ['Email already registered'] : [];
      },
      500,
    );
  }
}
```

### 4. Multi-Field Validation

```typescript
class PasswordChangeViewModel {
  private errors = new ErrorsContainer<PasswordChangeData>();

  updateNewPassword(value: string): void {
    this.formData.newPassword = value;
    this.validateField('newPassword', value);

    // Re-validate confirm password
    if (this.formData.confirmNewPassword) {
      this.validateField('confirmNewPassword', this.formData.confirmNewPassword);
    }
  }

  private validateField<K extends keyof PasswordChangeData>(field: K, value: PasswordChangeData[K]): void {
    validateFieldWithZodContainer(this.errors, schema, field, value, this.formData);
  }
}
```

## API Surface

### Exports

```typescript
export { ErrorsContainer } from './validation';
export { AsyncErrorsContainer } from './validation';
export { populateFromZodError, validateWithZodContainer, validateFieldWithZodContainer } from './validation';
```

### Type Definitions

```typescript
class ErrorsContainer<T extends Record<string, any>> {
  readonly errorsChanged$: Observable<keyof T | null>;
  readonly hasErrors$: Observable<boolean>;
  get hasErrors(): boolean;

  setErrors(propertyName: keyof T, errors: string[]): void;
  getErrors(propertyName: keyof T): string[];
  getErrors$(propertyName: keyof T): Observable<string[]>;
  getFirstError$(propertyName: keyof T): Observable<string | null>;
  hasPropertyErrors(propertyName: keyof T): boolean;
  hasPropertyErrors$(propertyName: keyof T): Observable<boolean>;
  getAllErrors(): string[];
  getAllErrorsAsRecord(): Partial<Record<keyof T, string[]>>;
  getPropertiesWithErrors(): Array<keyof T>;
  clearErrors(propertyName?: keyof T): void;
  dispose(): void;
}

class AsyncErrorsContainer<T extends Record<string, any>> extends ErrorsContainer<T> {
  readonly isValidating$: Observable<boolean>;
  readonly validatingProperties$: Observable<Array<keyof T>>;

  isPropertyValidating(propertyName: keyof T): boolean;
  validateAsync(
    propertyName: keyof T,
    value: T[keyof T],
    validator: (value: T[keyof T]) => Promise<string[]>,
  ): Promise<void>;
  validateAsyncDebounced(
    propertyName: keyof T,
    value: T[keyof T],
    validator: (value: T[keyof T]) => Promise<string[]>,
    debounceMs?: number,
  ): () => void;
  cancelPendingValidation(propertyName: keyof T): void;
  cancelAllPendingValidations(): void;
}
```

## Dependencies

- **RxJS**: `Observable`, `Subject`, `BehaviorSubject`, `map`, `filter`, `startWith`, `distinctUntilChanged`
- **Zod**: `ZodSchema`, `ZodError` (existing dependency)

## Performance Considerations

1. **Observable Efficiency**: Uses `distinctUntilChanged` to prevent duplicate emissions
2. **Debouncing**: Built-in debouncing reduces unnecessary async validations
3. **Cancellation**: Pending validations can be cancelled to prevent race conditions
4. **Memory**: Proper cleanup with `dispose()` prevents memory leaks

## Future Enhancements

Potential improvements for future iterations:

1. **Error Severity Levels**: Support for warning vs error distinction
2. **Error Codes**: Structured error objects with codes for i18n
3. **Batch Validation**: Validate multiple fields at once
4. **Validation Groups**: Group related fields for conditional validation
5. **Custom Validators**: Registry of reusable validators
6. **Validation History**: Track validation history for debugging

## Acceptance Criteria

All acceptance criteria from the task have been met:

- ✅ `ErrorsContainer<T>` class with type-safe property keys
- ✅ `setErrors()`, `getErrors()`, `clearErrors()` methods
- ✅ `getErrors$()` returns observable for specific property
- ✅ `hasErrors$` observable for overall validation state
- ✅ `AsyncErrorsContainer` extends with async validation support
- ✅ `isValidating$` observable during async validation
- ✅ Debounced validation support with cancellation
- ✅ Zod helpers: `populateFromZodError`, `validateWithZodContainer`, `validateFieldWithZodContainer`
- ✅ Unit tests pass (41 tests, 100% pass rate)
- ✅ `dispose()` cleans up resources
- ✅ Exported from package index

## Related Documentation

- [MVVM Core Prism Enhancements](../../docs/MVVM-CORE-PRISM-ENHANCEMENTS.md) - Section 6 Enhanced Validation Support
- [Task Specification](../../tasks/mvvm-enhancements/forms-core-errors-container.md)
- [Validation Module README](./src/validation/README.md)
- [Usage Examples](./src/validation/examples.ts)

## Conclusion

The ErrorsContainer implementation provides a robust, type-safe, and reactive solution for tracking form validation errors. It integrates seamlessly with Zod schemas and RxJS observables, following MVVM patterns established in the Web Loom project. The comprehensive test suite and documentation ensure maintainability and ease of use. The async validation support with debouncing and cancellation makes it suitable for real-world applications with complex validation requirements.
