# Phase 1.4: Advanced Field State Management

**Duration**: 2-3 days  
**Priority**: High  
**Dependencies**: Phase 1.3 (Zod Integration)

## Overview

Implement comprehensive field state management including metadata tracking, field lifecycle management, and advanced field operations that form the foundation for framework adapters.

## Tasks

### 1. Field Metadata System

**Time Estimate**: 1 day

#### Subtasks:

- [ ] Implement comprehensive field metadata tracking
- [ ] Add field lifecycle management
- [ ] Create field state transitions
- [ ] Implement field dependency tracking
- [ ] Add field visibility management

#### Field Metadata Implementation:

```typescript
// src/field.ts
import { FieldMeta, FieldConfig, FieldState } from './types';

export interface FieldMeta {
  // Basic state
  touched: boolean;
  dirty: boolean;
  validating: boolean;
  disabled: boolean;
  visible: boolean;

  // Lifecycle
  registered: boolean;
  focused: boolean;
  blurred: boolean;

  // Validation
  hasError: boolean;
  lastValidated: number | null;
  validationCount: number;

  // Dependencies
  dependsOn: string[];
  dependents: string[];

  // Configuration
  config?: FieldConfig;
}

export interface FieldConfig {
  validateOn?: 'change' | 'blur' | 'submit';
  debounceValidation?: number;
  required?: boolean;
  disabled?: boolean;
  hidden?: boolean;
  transform?: (value: unknown) => unknown;
}

export class FieldManager {
  private fields = new Map<string, FieldMeta>();
  private values = new Map<string, unknown>();
  private errors = new Map<string, string | null>();

  registerField(path: string, config?: FieldConfig): void {
    if (this.fields.has(path)) {
      // Update existing field config
      const existing = this.fields.get(path)!;
      existing.config = { ...existing.config, ...config };
      return;
    }

    const meta: FieldMeta = {
      touched: false,
      dirty: false,
      validating: false,
      disabled: config?.disabled ?? false,
      visible: !config?.hidden ?? true,
      registered: true,
      focused: false,
      blurred: false,
      hasError: false,
      lastValidated: null,
      validationCount: 0,
      dependsOn: [],
      dependents: [],
      config,
    };

    this.fields.set(path, meta);
  }

  unregisterField(path: string): void {
    const meta = this.fields.get(path);
    if (meta) {
      // Clean up dependencies
      this.removeDependencies(path);

      this.fields.delete(path);
      this.values.delete(path);
      this.errors.delete(path);
    }
  }

  getFieldState(path: string): FieldState | null {
    const meta = this.fields.get(path);
    if (!meta) return null;

    return {
      value: this.values.get(path),
      error: this.errors.get(path) ?? null,
      ...meta,
    };
  }

  setFieldValue(path: string, value: unknown): boolean {
    if (!this.fields.has(path)) {
      return false; // Field not registered
    }

    const meta = this.fields.get(path)!;
    const currentValue = this.values.get(path);

    // Apply transform if configured
    const transformedValue = meta.config?.transform ? meta.config.transform(value) : value;

    this.values.set(path, transformedValue);

    // Update metadata
    meta.dirty = true;

    // Check if validation needed
    if (meta.config?.validateOn === 'change') {
      this.triggerValidation(path);
    }

    return true;
  }
}
```

### 2. Field Lifecycle Management

**Time Estimate**: 1 day

#### Subtasks:

- [ ] Implement field focus/blur tracking
- [ ] Add field interaction state
- [ ] Create field validation triggers
- [ ] Implement field reset functionality
- [ ] Add field value comparison utilities

#### Lifecycle Management:

```typescript
// src/field-lifecycle.ts
export class FieldLifecycleManager {
  private fieldManager: FieldManager;
  private eventEmitter: EventEmitter;

  constructor(fieldManager: FieldManager, eventEmitter: EventEmitter) {
    this.fieldManager = fieldManager;
    this.eventEmitter = eventEmitter;
  }

  // Focus management
  focusField(path: string): void {
    const meta = this.fieldManager.getFieldMeta(path);
    if (meta && !meta.focused) {
      meta.focused = true;
      meta.blurred = false;

      this.eventEmitter.emit('fieldFocus', {
        path,
        fieldState: this.fieldManager.getFieldState(path),
      });
    }
  }

  blurField(path: string): void {
    const meta = this.fieldManager.getFieldMeta(path);
    if (meta && meta.focused) {
      meta.focused = false;
      meta.blurred = true;
      meta.touched = true;

      // Trigger validation on blur if configured
      if (meta.config?.validateOn === 'blur') {
        this.triggerValidation(path);
      }

      this.eventEmitter.emit('fieldBlur', {
        path,
        fieldState: this.fieldManager.getFieldState(path),
      });
    }
  }

  // Field interaction
  touchField(path: string): void {
    const meta = this.fieldManager.getFieldMeta(path);
    if (meta && !meta.touched) {
      meta.touched = true;

      this.eventEmitter.emit('fieldTouch', {
        path,
        fieldState: this.fieldManager.getFieldState(path),
      });
    }
  }

  // Field reset
  resetField(path: string, value?: unknown): void {
    const meta = this.fieldManager.getFieldMeta(path);
    if (meta) {
      // Reset metadata
      meta.touched = false;
      meta.dirty = false;
      meta.focused = false;
      meta.blurred = false;
      meta.hasError = false;
      meta.validationCount = 0;

      // Reset value
      if (value !== undefined) {
        this.fieldManager.setFieldValue(path, value, { skipValidation: true });
      }

      // Clear error
      this.fieldManager.setFieldError(path, null);

      this.eventEmitter.emit('fieldReset', {
        path,
        fieldState: this.fieldManager.getFieldState(path),
      });
    }
  }
}
```

### 3. Field Dependencies and Relationships

**Time Estimate**: 0.5 days

#### Subtasks:

- [ ] Implement field dependency tracking
- [ ] Add cross-field validation support
- [ ] Create field value propagation
- [ ] Implement dependent field updates

#### Dependency System:

```typescript
// src/field-dependencies.ts
export class FieldDependencyManager {
  private dependencyGraph = new Map<string, Set<string>>();
  private reverseDependencies = new Map<string, Set<string>>();

  addDependency(dependent: string, dependency: string): void {
    // Add forward dependency
    if (!this.dependencyGraph.has(dependent)) {
      this.dependencyGraph.set(dependent, new Set());
    }
    this.dependencyGraph.get(dependent)!.add(dependency);

    // Add reverse dependency
    if (!this.reverseDependencies.has(dependency)) {
      this.reverseDependencies.set(dependency, new Set());
    }
    this.reverseDependencies.get(dependency)!.add(dependent);
  }

  removeDependency(dependent: string, dependency: string): void {
    this.dependencyGraph.get(dependent)?.delete(dependency);
    this.reverseDependencies.get(dependency)?.delete(dependent);
  }

  getDependencies(field: string): string[] {
    return Array.from(this.dependencyGraph.get(field) || []);
  }

  getDependents(field: string): string[] {
    return Array.from(this.reverseDependencies.get(field) || []);
  }

  // Check for circular dependencies
  hasCycle(): boolean {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    for (const field of this.dependencyGraph.keys()) {
      if (this.hasCycleUtil(field, visited, recursionStack)) {
        return true;
      }
    }

    return false;
  }

  private hasCycleUtil(field: string, visited: Set<string>, recursionStack: Set<string>): boolean {
    visited.add(field);
    recursionStack.add(field);

    const dependencies = this.dependencyGraph.get(field) || [];
    for (const dep of dependencies) {
      if (!visited.has(dep)) {
        if (this.hasCycleUtil(dep, visited, recursionStack)) {
          return true;
        }
      } else if (recursionStack.has(dep)) {
        return true;
      }
    }

    recursionStack.delete(field);
    return false;
  }

  // Get validation order (topological sort)
  getValidationOrder(fields: string[]): string[] {
    const visited = new Set<string>();
    const result: string[] = [];

    const visit = (field: string) => {
      if (visited.has(field)) return;
      visited.add(field);

      // Visit dependencies first
      const deps = this.getDependencies(field);
      deps.forEach((dep) => {
        if (fields.includes(dep)) {
          visit(dep);
        }
      });

      result.push(field);
    };

    fields.forEach((field) => visit(field));
    return result;
  }
}
```

### 4. Enhanced Field Operations

**Time Estimate**: 0.5 days

#### Subtasks:

- [ ] Add batch field operations
- [ ] Implement field value transformations
- [ ] Create field validation queuing
- [ ] Add field state serialization

#### Advanced Operations:

```typescript
// src/field-operations.ts
export class FieldOperations {
  private fieldManager: FieldManager;
  private eventEmitter: EventEmitter;

  constructor(fieldManager: FieldManager, eventEmitter: EventEmitter) {
    this.fieldManager = fieldManager;
    this.eventEmitter = eventEmitter;
  }

  // Batch operations
  setFieldValues(values: Record<string, unknown>): void {
    const updates: Array<{ path: string; value: unknown }> = [];

    Object.entries(values).forEach(([path, value]) => {
      if (this.fieldManager.hasField(path)) {
        updates.push({ path, value });
      }
    });

    // Apply all updates
    updates.forEach(({ path, value }) => {
      this.fieldManager.setFieldValue(path, value, { skipNotification: true });
    });

    // Emit batch update event
    this.eventEmitter.emit('batchFieldUpdate', { updates });
  }

  resetFields(paths: string[], values?: Record<string, unknown>): void {
    paths.forEach((path) => {
      const value = values?.[path];
      this.fieldManager.resetField(path, value);
    });

    this.eventEmitter.emit('batchFieldReset', { paths, values });
  }

  // Field transformations
  transformFieldValue(path: string, transformer: (value: unknown) => unknown): boolean {
    const currentValue = this.fieldManager.getFieldValue(path);
    if (currentValue === undefined) return false;

    const transformedValue = transformer(currentValue);
    return this.fieldManager.setFieldValue(path, transformedValue);
  }

  // Field validation queue
  private validationQueue = new Set<string>();
  private validationTimeout: NodeJS.Timeout | null = null;

  queueValidation(path: string, debounceMs = 300): void {
    this.validationQueue.add(path);

    if (this.validationTimeout) {
      clearTimeout(this.validationTimeout);
    }

    this.validationTimeout = setTimeout(() => {
      this.processValidationQueue();
    }, debounceMs);
  }

  private async processValidationQueue(): Promise<void> {
    const fieldsToValidate = Array.from(this.validationQueue);
    this.validationQueue.clear();

    // Process in dependency order
    const orderedFields = this.dependencyManager.getValidationOrder(fieldsToValidate);

    for (const field of orderedFields) {
      await this.validateField(field);
    }

    this.eventEmitter.emit('validationQueueProcessed', { fields: fieldsToValidate });
  }
}
```

## Testing Strategy

### Unit Tests

```typescript
// tests/field-state.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { FieldManager, FieldLifecycleManager } from '../src/field';

describe('Field State Management', () => {
  let fieldManager: FieldManager;
  let lifecycleManager: FieldLifecycleManager;

  beforeEach(() => {
    fieldManager = new FieldManager();
    lifecycleManager = new FieldLifecycleManager(fieldManager, eventEmitter);
  });

  describe('Field Registration', () => {
    it('should register field with default metadata', () => {
      fieldManager.registerField('email');

      const state = fieldManager.getFieldState('email');
      expect(state).toEqual({
        value: undefined,
        error: null,
        touched: false,
        dirty: false,
        validating: false,
        disabled: false,
        visible: true,
        registered: true,
        focused: false,
        blurred: false,
        hasError: false,
        lastValidated: null,
        validationCount: 0,
        dependsOn: [],
        dependents: [],
        config: undefined,
      });
    });

    it('should register field with custom config', () => {
      fieldManager.registerField('password', {
        validateOn: 'blur',
        required: true,
        debounceValidation: 500,
      });

      const state = fieldManager.getFieldState('password');
      expect(state?.config?.validateOn).toBe('blur');
      expect(state?.config?.required).toBe(true);
    });
  });

  describe('Field Lifecycle', () => {
    beforeEach(() => {
      fieldManager.registerField('email');
    });

    it('should handle focus/blur cycle', () => {
      // Focus field
      lifecycleManager.focusField('email');
      let state = fieldManager.getFieldState('email');
      expect(state?.focused).toBe(true);
      expect(state?.blurred).toBe(false);

      // Blur field
      lifecycleManager.blurField('email');
      state = fieldManager.getFieldState('email');
      expect(state?.focused).toBe(false);
      expect(state?.blurred).toBe(true);
      expect(state?.touched).toBe(true);
    });

    it('should reset field state', () => {
      // Modify field state
      fieldManager.setFieldValue('email', 'test@example.com');
      lifecycleManager.touchField('email');
      fieldManager.setFieldError('email', 'Invalid email');

      // Reset field
      lifecycleManager.resetField('email', '');

      const state = fieldManager.getFieldState('email');
      expect(state?.value).toBe('');
      expect(state?.touched).toBe(false);
      expect(state?.dirty).toBe(false);
      expect(state?.error).toBe(null);
    });
  });
});
```

### Integration Tests

```typescript
// tests/field-dependencies.test.ts
import { describe, it, expect } from 'vitest';
import { FieldDependencyManager } from '../src/field-dependencies';

describe('Field Dependencies', () => {
  let dependencyManager: FieldDependencyManager;

  beforeEach(() => {
    dependencyManager = new FieldDependencyManager();
  });

  it('should manage field dependencies', () => {
    dependencyManager.addDependency('confirmPassword', 'password');
    dependencyManager.addDependency('billing.city', 'billing.country');

    expect(dependencyManager.getDependencies('confirmPassword')).toEqual(['password']);
    expect(dependencyManager.getDependents('password')).toEqual(['confirmPassword']);
  });

  it('should detect circular dependencies', () => {
    dependencyManager.addDependency('fieldA', 'fieldB');
    dependencyManager.addDependency('fieldB', 'fieldC');
    dependencyManager.addDependency('fieldC', 'fieldA'); // Creates cycle

    expect(dependencyManager.hasCycle()).toBe(true);
  });

  it('should provide correct validation order', () => {
    dependencyManager.addDependency('field3', 'field1');
    dependencyManager.addDependency('field3', 'field2');
    dependencyManager.addDependency('field2', 'field1');

    const order = dependencyManager.getValidationOrder(['field1', 'field2', 'field3']);
    expect(order).toEqual(['field1', 'field2', 'field3']);
  });
});
```

## Performance Considerations

### Optimization Strategies

- Use Map for O(1) field lookups
- Implement efficient dependency tracking
- Batch field operations to reduce notifications
- Use WeakMap for field references to prevent memory leaks
- Implement lazy evaluation for computed field states

### Benchmarks

- Field registration: < 0.1ms per field
- Field state updates: < 0.05ms per operation
- Dependency resolution: < 1ms for 100 fields
- Batch operations: < 2ms for 50 field updates

## Acceptance Criteria

### Functionality

- [ ] Complete field metadata tracking
- [ ] Field lifecycle management (focus/blur/touch)
- [ ] Dependency tracking with cycle detection
- [ ] Batch field operations
- [ ] Field value transformations
- [ ] Validation queuing and debouncing

### Performance

- [ ] Fast field operations (< 0.1ms each)
- [ ] Efficient memory usage (no leaks)
- [ ] Scalable to 100+ fields
- [ ] Responsive dependency resolution

### Code Quality

- [ ] Comprehensive test coverage (> 90%)
- [ ] TypeScript strict mode compliance
- [ ] No runtime errors in edge cases
- [ ] Clean, documented API

## Definition of Done

- [ ] Field metadata system implemented
- [ ] Lifecycle management complete
- [ ] Dependency tracking working
- [ ] Batch operations functional
- [ ] All tests passing with high coverage
- [ ] Performance benchmarks met
- [ ] Documentation complete
- [ ] Integration with form factory verified

## Notes

- Design for framework adapter compatibility
- Ensure thread safety for async operations
- Plan for future conditional field integration
- Consider accessibility requirements for field state
