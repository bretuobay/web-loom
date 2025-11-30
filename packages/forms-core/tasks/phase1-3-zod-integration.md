# Phase 1.3: Zod Integration and Type Inference

**Duration**: 2-3 days  
**Priority**: Critical  
**Dependencies**: Phase 1.2 (Form Factory)

## Overview

Implement deep integration with Zod for schema validation, type inference, and error handling. This creates the foundation for type-safe forms with full TypeScript inference.

## Tasks

### 1. Zod Schema Integration

**Time Estimate**: 1 day

#### Subtasks:

- [ ] Create Zod adapter interface
- [ ] Implement schema parsing utilities
- [ ] Add type inference helpers
- [ ] Create schema validation pipeline
- [ ] Handle schema error formatting

#### Implementation:

```typescript
// src/validation/zod-adapter.ts
import { z, ZodSchema, ZodError, ZodIssue } from 'zod';
import { FormErrors, ValidationResult } from '../types';

export class ZodAdapter<T> {
  constructor(private schema: ZodSchema<T>) {}

  // Validate entire form
  validate(values: unknown): ValidationResult<T> {
    const result = this.schema.safeParse(values);

    if (result.success) {
      return {
        success: true,
        data: result.data,
        errors: { fieldErrors: {}, formErrors: [] },
      };
    }

    return {
      success: false,
      data: null,
      errors: this.formatZodErrors(result.error),
    };
  }

  // Validate single field
  validateField(path: string, value: unknown, context?: unknown): ValidationResult<unknown> {
    try {
      // Extract field schema from path
      const fieldSchema = this.getFieldSchema(path);
      const result = fieldSchema.safeParse(value);

      if (result.success) {
        return {
          success: true,
          data: result.data,
          errors: { fieldErrors: {}, formErrors: [] },
        };
      }

      return {
        success: false,
        data: null,
        errors: {
          fieldErrors: { [path]: this.formatFieldError(result.error) },
          formErrors: [],
        },
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        errors: {
          fieldErrors: { [path]: 'Validation failed' },
          formErrors: [],
        },
      };
    }
  }

  private formatZodErrors(error: ZodError): FormErrors {
    const fieldErrors: Record<string, string> = {};
    const formErrors: string[] = [];

    error.issues.forEach((issue: ZodIssue) => {
      const path = issue.path.join('.');

      if (path) {
        fieldErrors[path] = issue.message;
      } else {
        formErrors.push(issue.message);
      }
    });

    return { fieldErrors, formErrors };
  }
}
```

### 2. Type Inference System

**Time Estimate**: 1 day

#### Subtasks:

- [ ] Create type inference utilities
- [ ] Implement schema type extraction
- [ ] Add form value type generation
- [ ] Create field path type safety
- [ ] Test complex schema inference

#### Type Utilities:

```typescript
// src/types/inference.ts
import { z, ZodSchema, ZodTypeAny } from 'zod';

// Extract input type from Zod schema
export type InferFormValues<T extends ZodSchema> = z.input<T>;

// Extract output type (with transforms) from Zod schema
export type InferFormOutput<T extends ZodSchema> = z.output<T>;

// Generate type-safe paths for nested objects
export type FormPaths<T> =
  T extends Record<string, any>
    ? {
        [K in keyof T]: T[K] extends Record<string, any>
          ? K extends string
            ? `${K}` | `${K}.${FormPaths<T[K]>}`
            : never
          : K extends string
            ? K
            : never;
      }[keyof T]
    : never;

// Field value type from path
export type FieldValue<T, P extends string> = P extends keyof T
  ? T[P]
  : P extends `${infer K}.${infer Rest}`
    ? K extends keyof T
      ? FieldValue<T[K], Rest>
      : never
    : never;

// Usage example:
type UserSchema = z.ZodObject<{
  name: z.ZodString;
  age: z.ZodNumber;
  address: z.ZodObject<{
    street: z.ZodString;
    city: z.ZodString;
  }>;
}>;

type UserFormValues = InferFormValues<UserSchema>;
// { name: string; age: number; address: { street: string; city: string } }

type UserPaths = FormPaths<UserFormValues>;
// 'name' | 'age' | 'address' | 'address.street' | 'address.city'

type NameValue = FieldValue<UserFormValues, 'name'>; // string
type StreetValue = FieldValue<UserFormValues, 'address.street'>; // string
```

### 3. Schema Analysis Utilities

**Time Estimate**: 0.5 days

#### Subtasks:

- [ ] Implement schema introspection
- [ ] Create field schema extraction
- [ ] Add default value inference
- [ ] Build schema composition helpers

#### Schema Analysis:

```typescript
// src/validation/schema-analyzer.ts
import { ZodSchema, ZodObject, ZodArray, ZodOptional, ZodDefault } from 'zod';

export class SchemaAnalyzer<T> {
  constructor(private schema: ZodSchema<T>) {}

  // Extract default values from schema
  getDefaultValues(): Partial<T> {
    const defaults: Record<string, unknown> = {};

    if (this.schema instanceof ZodObject) {
      const shape = this.schema.shape;

      Object.keys(shape).forEach((key) => {
        const fieldSchema = shape[key];
        defaults[key] = this.getFieldDefault(fieldSchema);
      });
    }

    return defaults as Partial<T>;
  }

  // Get schema for specific field path
  getFieldSchema(path: string): ZodSchema {
    const keys = path.split('.');
    let currentSchema: ZodSchema = this.schema;

    for (const key of keys) {
      if (currentSchema instanceof ZodObject) {
        currentSchema = currentSchema.shape[key];
      } else if (currentSchema instanceof ZodArray) {
        if (!isNaN(Number(key))) {
          currentSchema = currentSchema.element;
        } else {
          throw new Error(`Invalid array index: ${key}`);
        }
      } else {
        throw new Error(`Cannot access property ${key} on schema`);
      }
    }

    return currentSchema;
  }

  // Check if field is optional
  isFieldOptional(path: string): boolean {
    try {
      const fieldSchema = this.getFieldSchema(path);
      return fieldSchema instanceof ZodOptional || fieldSchema instanceof ZodDefault;
    } catch {
      return false;
    }
  }

  // Get field type information
  getFieldInfo(path: string): FieldInfo {
    const fieldSchema = this.getFieldSchema(path);

    return {
      type: this.getSchemaType(fieldSchema),
      optional: this.isFieldOptional(path),
      defaultValue: this.getFieldDefault(fieldSchema),
    };
  }
}
```

### 4. Enhanced Form Factory Integration

**Time Estimate**: 0.5 days

#### Subtasks:

- [ ] Update createForm with Zod integration
- [ ] Add type inference to form instance
- [ ] Integrate validation pipeline
- [ ] Add schema-aware field operations

#### Updated Form Factory:

```typescript
// src/form.ts (updated)
import { ZodSchema } from 'zod';
import { ZodAdapter } from './validation/zod-adapter';
import { SchemaAnalyzer } from './validation/schema-analyzer';
import { InferFormValues, FormPaths } from './types/inference';

export function createForm<TSchema extends ZodSchema, TValues = InferFormValues<TSchema>>(
  config: FormConfig<TSchema, TValues>,
): FormInstance<TValues> {
  const zodAdapter = new ZodAdapter(config.schema);
  const schemaAnalyzer = new SchemaAnalyzer(config.schema);

  // Initialize with schema defaults if not provided
  const defaultValues = config.defaultValues ?? schemaAnalyzer.getDefaultValues();

  let state: FormState<TValues> = initializeState({
    ...config,
    defaultValues,
  });

  // Type-safe field operations
  const setFieldValue = <P extends FormPaths<TValues>>(path: P, value: FieldValue<TValues, P>) => {
    updateState((draft) => {
      setPath(draft.values, path, value);

      // Mark field as dirty
      if (!draft.fields[path]) {
        draft.fields[path] = createFieldMeta();
      }
      draft.fields[path].dirty = true;
      draft.isDirty = true;
    });
  };

  // Schema-aware validation
  const validateField = async (path: string): Promise<boolean> => {
    const value = getPath(state.values, path);
    const result = zodAdapter.validateField(path, value, state.values);

    updateState((draft) => {
      if (result.success) {
        draft.fieldErrors[path] = null;
      } else {
        draft.fieldErrors[path] = result.errors.fieldErrors[path] || null;
      }
    });

    return result.success;
  };

  const validate = async (): Promise<boolean> => {
    const result = zodAdapter.validate(state.values);

    updateState((draft) => {
      draft.fieldErrors = result.errors.fieldErrors;
      draft.formErrors = result.errors.formErrors;
      draft.isValid = result.success;
    });

    return result.success;
  };

  return {
    // Type-safe methods
    setFieldValue,
    getFieldValue: (path) => getPath(state.values, path),
    validateField,
    validate,

    // Schema utilities
    getFieldInfo: (path) => schemaAnalyzer.getFieldInfo(path),
    isFieldOptional: (path) => schemaAnalyzer.isFieldOptional(path),

    // ... other methods
  };
}
```

## Testing Strategy

### Type Tests

```typescript
// tests/types.test.ts
import { z } from 'zod';
import { createForm, InferFormValues, FormPaths } from '../src';

const userSchema = z.object({
  name: z.string(),
  age: z.number(),
  address: z.object({
    street: z.string(),
    city: z.string(),
  }),
});

type UserValues = InferFormValues<typeof userSchema>;
type UserPaths = FormPaths<UserValues>;

// Type assertions
const _userValues: UserValues = {
  name: 'John',
  age: 30,
  address: {
    street: '123 Main St',
    city: 'New York',
  },
};

const _userPaths: UserPaths[] = ['name', 'age', 'address', 'address.street', 'address.city'];

// Form type safety
const form = createForm({
  schema: userSchema,
  defaultValues: {
    name: '',
    age: 0,
    address: { street: '', city: '' },
  },
});

// These should be type-safe
form.setFieldValue('name', 'John'); // ✓
form.setFieldValue('address.city', 'NYC'); // ✓

// @ts-expect-error - invalid path
form.setFieldValue('invalid', 'value'); // ✗

// @ts-expect-error - wrong type
form.setFieldValue('age', 'not-a-number'); // ✗
```

### Integration Tests

```typescript
// tests/zod-integration.test.ts
import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { createForm } from '../src';

describe('Zod Integration', () => {
  const schema = z
    .object({
      email: z.string().email('Invalid email'),
      password: z.string().min(8, 'Password too short'),
      confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: 'Passwords do not match',
      path: ['confirmPassword'],
    });

  it('should validate with Zod schema', async () => {
    const form = createForm({
      schema,
      defaultValues: {
        email: '',
        password: '',
        confirmPassword: '',
      },
    });

    // Invalid email
    form.setFieldValue('email', 'invalid-email');
    const emailValid = await form.validateField('email');
    expect(emailValid).toBe(false);
    expect(form.getState().fieldErrors.email).toBe('Invalid email');

    // Valid email
    form.setFieldValue('email', 'test@example.com');
    const emailValidNow = await form.validateField('email');
    expect(emailValidNow).toBe(true);
    expect(form.getState().fieldErrors.email).toBeNull();
  });

  it('should handle cross-field validation', async () => {
    const form = createForm({ schema, defaultValues });

    form.setFieldValue('password', 'password123');
    form.setFieldValue('confirmPassword', 'different');

    const isValid = await form.validate();
    expect(isValid).toBe(false);
    expect(form.getState().formErrors).toContain('Passwords do not match');
  });
});
```

## Performance Considerations

### Optimization Strategies

- Cache schema analysis results
- Use lazy field schema extraction
- Minimize Zod parsing overhead
- Batch validation operations

### Benchmarks

- Schema parsing: < 0.1ms for complex schemas
- Field validation: < 0.5ms per field
- Form validation: < 2ms for 50+ field forms
- Type inference compilation: < 1s

## Acceptance Criteria

### Functionality

- [ ] Full Zod schema support (objects, arrays, unions)
- [ ] Accurate error message extraction
- [ ] Type-safe field operations
- [ ] Cross-field validation support
- [ ] Schema default value extraction

### Type Safety

- [ ] Complete TypeScript inference from Zod schemas
- [ ] Type-safe field paths (no string literals)
- [ ] Correct field value types
- [ ] Compile-time error catching

### Performance

- [ ] Fast schema analysis (< 1ms)
- [ ] Efficient validation (< 1ms per field)
- [ ] No memory leaks in schema caching
- [ ] TypeScript compilation speed acceptable

## Definition of Done

- [ ] Zod adapter complete with error handling
- [ ] Type inference system working
- [ ] Schema analysis utilities implemented
- [ ] Form factory integration complete
- [ ] Type tests passing
- [ ] Integration tests comprehensive
- [ ] Performance benchmarks met
- [ ] Documentation complete

## Notes

- Focus on comprehensive Zod feature support
- Ensure type safety doesn't impact runtime performance
- Plan for future async validation integration
- Consider Zod version compatibility
