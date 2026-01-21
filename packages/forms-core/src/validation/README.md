# ErrorsContainer - Property-Level Validation Errors

The ErrorsContainer module provides reactive, type-safe validation error tracking for form fields. It enables per-field error observables for real-time UI feedback and integrates seamlessly with Zod schemas.

## Features

- **ErrorsContainer**: Tracks validation errors per property with reactive observables
- **AsyncErrorsContainer**: Extends with async validation support and debouncing
- **Zod Integration**: Helper functions for populating errors from Zod validation
- **Type-Safe**: Full TypeScript support with generic property keys
- **Observable-Based**: RxJS observables for reactive UI binding
- **Async Validation**: Built-in support for async validators with cancellation

## Basic Usage

### ErrorsContainer

```typescript
import { ErrorsContainer } from '@web-loom/forms-core';

interface LoginForm {
  email: string;
  password: string;
}

// Create container
const errors = new ErrorsContainer<LoginForm>();

// Set errors for a field
errors.setErrors('email', ['Invalid email format']);

// Get errors synchronously
console.log(errors.getErrors('email')); // ['Invalid email format']

// Subscribe to errors for a field
errors.getErrors$('email').subscribe(fieldErrors => {
  console.log('Email errors:', fieldErrors);
});

// Check if any errors exist
console.log(errors.hasErrors); // true

// Clear errors
errors.clearErrors('email');
```

### With Zod Validation

```typescript
import { z } from 'zod';
import { ErrorsContainer, validateWithZodContainer } from '@web-loom/forms-core';

const schema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type FormData = z.infer<typeof schema>;

const errors = new ErrorsContainer<FormData>();

// Validate entire form
const isValid = validateWithZodContainer(errors, schema, {
  email: 'invalid',
  password: '123',
});

console.log(isValid); // false
console.log(errors.getErrors('email')); // ['Invalid email format']
console.log(errors.getErrors('password')); // ['Password must be at least 8 characters']
```

### Field-Level Validation

```typescript
import { validateFieldWithZodContainer } from '@web-loom/forms-core';

// Validate single field
const isEmailValid = validateFieldWithZodContainer(
  errors,
  schema,
  'email',
  'test@example.com',
  { email: '', password: 'password123' }
);

console.log(isEmailValid); // true
console.log(errors.getErrors('email')); // []
```

## Async Validation

### AsyncErrorsContainer

```typescript
import { AsyncErrorsContainer } from '@web-loom/forms-core';

const errors = new AsyncErrorsContainer<FormData>();

// Async validation (e.g., check email uniqueness)
await errors.validateAsync(
  'email',
  'test@example.com',
  async (email) => {
    const exists = await checkEmailExists(email);
    return exists ? ['Email already registered'] : [];
  }
);

// Check if validation is in progress
console.log(errors.isPropertyValidating('email')); // false

// Subscribe to validation state
errors.isValidating$.subscribe(isValidating => {
  console.log('Validating:', isValidating);
});
```

### Debounced Validation

```typescript
// Debounce validation (useful for real-time input)
const cancel = errors.validateAsyncDebounced(
  'email',
  'test@example.com',
  async (email) => {
    const exists = await checkEmailExists(email);
    return exists ? ['Email already registered'] : [];
  },
  300 // debounce delay in ms
);

// Cancel if needed
cancel();
```

## Integration Examples

### React Form Component

```typescript
import { useEffect, useState } from 'react';
import { ErrorsContainer } from '@web-loom/forms-core';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

type FormData = z.infer<typeof schema>;

function LoginForm() {
  const [errors] = useState(() => new ErrorsContainer<FormData>());
  const [emailErrors, setEmailErrors] = useState<string[]>([]);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);

  useEffect(() => {
    const emailSub = errors.getErrors$('email').subscribe(setEmailErrors);
    const passwordSub = errors.getErrors$('password').subscribe(setPasswordErrors);

    return () => {
      emailSub.unsubscribe();
      passwordSub.unsubscribe();
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
    <form>
      <input
        type="email"
        onChange={(e) => handleEmailChange(e.target.value)}
      />
      {emailErrors.map((error, i) => (
        <div key={i} className="error">{error}</div>
      ))}

      <input type="password" />
      {passwordErrors.map((error, i) => (
        <div key={i} className="error">{error}</div>
      ))}
    </form>
  );
}
```

### ViewModel Integration

```typescript
import { ErrorsContainer, validateFieldWithZodContainer } from '@web-loom/forms-core';
import { z } from 'zod';

const schema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(8),
});

type FormData = z.infer<typeof schema>;

class RegistrationViewModel {
  private errors = new ErrorsContainer<FormData>();

  // Expose observables for view binding
  public readonly usernameErrors$ = this.errors.getErrors$('username');
  public readonly emailErrors$ = this.errors.getErrors$('email');
  public readonly passwordErrors$ = this.errors.getErrors$('password');
  public readonly hasErrors$ = this.errors.hasErrors$;

  private formData: Partial<FormData> = {};

  updateField<K extends keyof FormData>(field: K, value: FormData[K]): void {
    this.formData[field] = value;

    // Validate field
    validateFieldWithZodContainer(
      this.errors,
      schema,
      field,
      value,
      this.formData
    );
  }

  async submit(): Promise<void> {
    // Validate entire form
    const isValid = validateWithZodContainer(
      this.errors,
      schema,
      this.formData
    );

    if (!isValid) {
      console.log('Form has errors:', this.errors.getAllErrorsAsRecord());
      return;
    }

    // Submit form...
  }

  dispose(): void {
    this.errors.dispose();
  }
}
```

### Async Email Validation

```typescript
import { AsyncErrorsContainer } from '@web-loom/forms-core';

class EmailValidator {
  private errors = new AsyncErrorsContainer<{ email: string }>();

  public readonly emailErrors$ = this.errors.getErrors$('email');
  public readonly isValidating$ = this.errors.isValidating$;

  private cancelValidation: (() => void) | null = null;

  validateEmail(email: string): void {
    // Cancel previous validation
    this.cancelValidation?.();

    // Debounced async validation
    this.cancelValidation = this.errors.validateAsyncDebounced(
      'email',
      email,
      async (value) => {
        // Check email format first
        if (!value.includes('@')) {
          return ['Invalid email format'];
        }

        // Check uniqueness
        const response = await fetch(`/api/check-email?email=${value}`);
        const { exists } = await response.json();

        return exists ? ['Email already registered'] : [];
      },
      500 // 500ms debounce
    );
  }

  dispose(): void {
    this.cancelValidation?.();
    this.errors.dispose();
  }
}
```

## API Reference

### ErrorsContainer<T>

#### Properties

- `errorsChanged$: Observable<keyof T | null>` - Emits when errors change
- `hasErrors$: Observable<boolean>` - Observable of overall error state
- `hasErrors: boolean` - Synchronous check if any errors exist

#### Methods

- `setErrors(propertyName: keyof T, errors: string[]): void` - Set errors for a property
- `getErrors(propertyName: keyof T): string[]` - Get errors synchronously
- `getErrors$(propertyName: keyof T): Observable<string[]>` - Get errors as observable
- `getFirstError$(propertyName: keyof T): Observable<string | null>` - Get first error as observable
- `hasPropertyErrors(propertyName: keyof T): boolean` - Check if property has errors
- `hasPropertyErrors$(propertyName: keyof T): Observable<boolean>` - Observable property error state
- `getAllErrors(): string[]` - Get all errors as flat array
- `getAllErrorsAsRecord(): Partial<Record<keyof T, string[]>>` - Get errors grouped by property
- `getPropertiesWithErrors(): Array<keyof T>` - Get properties that have errors
- `clearErrors(propertyName?: keyof T): void` - Clear errors for property or all
- `dispose(): void` - Clean up resources

### AsyncErrorsContainer<T>

Extends `ErrorsContainer<T>` with additional methods:

#### Properties

- `isValidating$: Observable<boolean>` - Observable of validation state
- `validatingProperties$: Observable<Array<keyof T>>` - Observable of properties being validated

#### Methods

- `isPropertyValidating(propertyName: keyof T): boolean` - Check if property is validating
- `validateAsync(propertyName, value, validator): Promise<void>` - Perform async validation
- `validateAsyncDebounced(propertyName, value, validator, debounceMs): () => void` - Debounced validation
- `cancelPendingValidation(propertyName: keyof T): void` - Cancel validation for property
- `cancelAllPendingValidations(): void` - Cancel all pending validations

### Zod Helpers

- `populateFromZodError<T>(container, zodError): void` - Populate container from ZodError
- `validateWithZodContainer<T>(container, schema, data): boolean` - Validate and populate errors
- `validateFieldWithZodContainer<T>(container, schema, propertyName, value, currentData): boolean` - Validate single field

## Best Practices

1. **Dispose containers**: Always call `dispose()` when done to prevent memory leaks
2. **Use field-level validation**: Validate fields as users type for better UX
3. **Debounce async validation**: Use `validateAsyncDebounced` for real-time validation
4. **Cancel on unmount**: Cancel pending validations when components unmount
5. **Type safety**: Use `z.infer<typeof schema>` for type-safe form data
6. **Observable subscriptions**: Unsubscribe from observables in cleanup

## Notes

- Errors are stored as arrays to support multiple errors per field
- Setting an empty array clears errors for that field
- Observable streams use `distinctUntilChanged` to prevent duplicate emissions
- Async validation automatically tracks loading state
- Debounced validation can be cancelled to prevent unnecessary API calls
