# Phase 1.2: Form Factory Implementation

**Duration**: 3-4 days  
**Priority**: Critical  
**Dependencies**: Phase 1.1 (Project Setup)

## Overview

Implement the core `createForm()` factory function that initializes form state, manages subscriptions, and provides the primary API for form operations.

## Tasks

### 1. Core Form State Management

**Time Estimate**: 1.5 days

#### Subtasks:

- [ ] Implement form state initialization
- [ ] Create immutable state update utilities
- [ ] Implement subscription system
- [ ] Add state change notifications
- [ ] Create form instance methods

#### Implementation Details:

```typescript
// src/form.ts
import { ZodSchema } from 'zod';
import { FormState, FormConfig, FieldMeta, FormEventMap } from './types';
import { EventEmitter } from '@web-loom/event-emitter-core';
import { cloneDeep, setPath, getPath } from './utils/clone';

export function createForm<T extends Record<string, unknown>>(config: FormConfig<T>): FormInstance<T> {
  let state: FormState<T> = {
    values: cloneDeep(config.defaultValues),
    defaultValues: cloneDeep(config.defaultValues),
    fields: {},
    fieldErrors: {},
    formErrors: [],
    isSubmitting: false,
    isValidating: false,
    isValid: true,
    isDirty: false,
    submitCount: 0,
  };

  const eventEmitter = new EventEmitter<FormEventMap<T>>();
  const registeredFields = new Set<string>();

  // Core methods implementation...
}
```

### 2. Field Registration System

**Time Estimate**: 1 day

#### Subtasks:

- [ ] Implement field registration/unregistration
- [ ] Create field metadata tracking
- [ ] Add field state getters/setters
- [ ] Implement dot notation path support
- [ ] Add field cleanup on unregister

#### Key Methods:

```typescript
interface FormInstance<T> {
  // Field registration
  registerField(path: string, config?: FieldConfig): () => void;
  unregisterField(path: string): void;

  // Field state
  getFieldState(path: string): FieldState;
  setFieldValue(path: string, value: unknown): void;
  getFieldValue(path: string): unknown;

  // Field metadata
  setFieldTouched(path: string, touched?: boolean): void;
  setFieldError(path: string, error: string | null): void;
  clearFieldError(path: string): void;
}
```

### 3. Subscription System

**Time Estimate**: 1 day

#### Subtasks:

- [ ] Implement event emitter utility
- [ ] Create typed subscription methods
- [ ] Add field-specific subscriptions
- [ ] Implement form-wide subscriptions
- [ ] Add subscription cleanup

#### Subscription API:

```typescript
interface FormInstance<T> {
  // Global subscriptions
  subscribe(callback: (state: FormState<T>) => void): () => void;

  // Field-specific subscriptions
  subscribeToField(path: string, callback: (fieldState: FieldState) => void): () => void;

  // Error subscriptions
  subscribeToErrors(callback: (errors: FormErrors) => void): () => void;
}
```

### 4. Form Operations

**Time Estimate**: 0.5 days

#### Subtasks:

- [ ] Implement form reset functionality
- [ ] Add form state getters
- [ ] Create form validation triggers
- [ ] Add dirty state tracking
- [ ] Implement form submission preparation

#### Core Operations:

```typescript
interface FormInstance<T> {
  // Form state
  getState(): FormState<T>;
  getValues(): T;
  isDirty(): boolean;
  isValid(): boolean;

  // Form operations
  reset(values?: Partial<T>): void;
  clear(): void;
  setValues(values: Partial<T>): void;

  // Validation
  validate(): Promise<boolean>;
  validateField(path: string): Promise<boolean>;
}
```

## Implementation Files

### Core Form (`src/form.ts`)

```typescript
import { ZodSchema, ZodError } from 'zod';
import { FormConfig, FormState, FormInstance, FormEventMap } from './types';
import { EventEmitter } from '@web-loom/event-emitter-core';
import { getPath, setPath, cloneDeep } from './utils/clone';

export function createForm<T extends Record<string, unknown>>(config: FormConfig<T>): FormInstance<T> {
  // State initialization
  let state: FormState<T> = initializeState(config);

  // Event system
  const events = new EventEmitter();
  const registeredFields = new Set<string>();

  // Field registration
  const registerField = (path: string, config?: FieldConfig) => {
    if (!registeredFields.has(path)) {
      registeredFields.add(path);

      // Initialize field metadata
      state.fields[path] = {
        touched: false,
        dirty: false,
        validating: false,
        disabled: false,
        visible: true,
      };

      notifyStateChange();
    }

    return () => unregisterField(path);
  };

  // State updates
  const updateState = (updater: (draft: FormState<T>) => void) => {
    const newState = cloneDeep(state);
    updater(newState);
    state = newState;
    notifyStateChange();
  };

  // Notifications
  const notifyStateChange = () => {
    events.emit('stateChange', state);
  };

  return {
    registerField,
    unregisterField,
    getState: () => state,
    getValues: () => state.values,
    setFieldValue,
    getFieldValue,
    subscribe: events.on,
    // ... other methods
  };
}
```

### Utilities (`src/utils/`)

#### Event Emitter

The bespoke emitter under `src/utils/events.ts` has been replaced by the shared [`@web-loom/event-emitter-core`](../event-emitter-core) package. Reuse it instead of maintaining local copies:

```ts
import { EventEmitter } from '@web-loom/event-emitter-core';

const events = new EventEmitter<FormEventMap<MyForm>>();
const unsubscribe = events.on('stateChange', (state) => console.log(state));
```

#### Path Utilities (`src/utils/path.ts`)

```typescript
// Get nested value using dot notation
export function getPath(obj: unknown, path: string): unknown {
  return path.split('.').reduce((current, key) => {
    return current && typeof current === 'object' ? (current as Record<string, unknown>)[key] : undefined;
  }, obj);
}

// Set nested value using dot notation
export function setPath(obj: Record<string, unknown>, path: string, value: unknown): void {
  const keys = path.split('.');
  const lastKey = keys.pop()!;

  const target = keys.reduce((current, key) => {
    if (!(key in current) || typeof current[key] !== 'object') {
      current[key] = {};
    }
    return current[key] as Record<string, unknown>;
  }, obj);

  target[lastKey] = value;
}
```

## Testing Strategy

### Unit Tests

#### Form Creation Tests (`tests/form.test.ts`)

```typescript
import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { createForm } from '../src/form';

describe('createForm', () => {
  const schema = z.object({
    email: z.string().email(),
    name: z.string().min(2),
  });

  const defaultValues = {
    email: '',
    name: '',
  };

  it('should create form with initial state', () => {
    const form = createForm({ schema, defaultValues });

    expect(form.getState().values).toEqual(defaultValues);
    expect(form.getState().isDirty).toBe(false);
    expect(form.getState().isValid).toBe(true);
  });

  it('should register and unregister fields', () => {
    const form = createForm({ schema, defaultValues });

    const unregister = form.registerField('email');
    expect(form.getState().fields.email).toBeDefined();

    unregister();
    expect(form.getState().fields.email).toBeUndefined();
  });

  it('should handle field value updates', () => {
    const form = createForm({ schema, defaultValues });

    form.registerField('email');
    form.setFieldValue('email', 'test@example.com');

    expect(form.getFieldValue('email')).toBe('test@example.com');
    expect(form.getState().isDirty).toBe(true);
  });
});
```

### Integration Tests

- Complete form lifecycle tests
- Subscription system tests
- State consistency tests
- Memory leak tests

## Performance Considerations

### Optimization Strategies

- Use immutable updates with structural sharing
- Batch state updates to prevent excessive re-renders
- Implement field-level subscriptions to minimize notifications
- Use WeakMap for field metadata to prevent memory leaks

### Benchmarks

- Form creation: < 1ms for 100 fields
- Field registration: < 0.1ms per field
- State updates: < 0.5ms for large forms
- Subscription notifications: < 0.1ms per subscriber

## Acceptance Criteria

### Functionality

- [ ] Form creates with proper initial state
- [ ] Field registration/unregistration works correctly
- [ ] State updates are immutable and consistent
- [ ] Subscription system notifies correctly
- [ ] Dot notation paths work for nested fields

### Performance

- [ ] Form creation takes < 1ms for typical forms
- [ ] State updates are batched and efficient
- [ ] Memory usage is stable (no leaks)
- [ ] Supports 100+ fields without lag

### Code Quality

- [ ] TypeScript compilation with strict mode
- [ ] Test coverage > 90%
- [ ] ESLint passes with zero errors
- [ ] Documentation is complete

## Definition of Done

- [ ] All core form methods implemented
- [ ] Field registration system complete
- [ ] Subscription system working
- [ ] Path utilities handle nested objects
- [ ] Tests pass with high coverage
- [ ] Performance benchmarks met
- [ ] Code review completed
- [ ] Documentation updated

## Notes

- Focus on immutable state updates for predictable behavior
- Optimize subscription system for framework adapters
- Ensure path utilities handle edge cases (arrays, null values)
- Plan for future async validation integration
