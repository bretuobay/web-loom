# Dirty Tracking Implementation

## Overview

This document describes the implementation of dirty tracking functionality for the `forms-core` package. Dirty tracking enables detection of unsaved changes in forms, which is essential for features like navigation guards, conditional save buttons, and user warnings.

## Implementation Summary

### Files Created

1. **`src/state/DirtyTracker.ts`** - Core implementation
   - `IDirtyTrackable` interface
   - `DirtyTracker<T>` class - Tracks overall dirty state
   - `FieldDirtyTracker<T>` class - Tracks per-field dirty state

2. **`src/state/DirtyTracker.test.ts`** - Comprehensive test suite
   - 31 test cases covering all functionality
   - Tests for both `DirtyTracker` and `FieldDirtyTracker`
   - Edge case handling (undefined, null, primitives, nested objects)

3. **`src/state/index.ts`** - Module exports

4. **`src/state/README.md`** - Complete documentation
   - API reference
   - Usage examples
   - Integration patterns
   - Best practices

5. **`src/state/examples.ts`** - Practical examples
   - 8 different usage scenarios
   - ViewModel integration examples
   - Navigation guard examples
   - Partial update (PATCH) examples

### Files Modified

1. **`src/index.ts`** - Added export for state module

## Features Implemented

### DirtyTracker<T>

Core functionality for tracking dirty state:

- ✅ `setInitialValue()` - Set baseline value
- ✅ `setCurrentValue()` - Update current value and recalculate dirty state
- ✅ `trackObservable()` - Automatically track changes from RxJS observables
- ✅ `markClean()` - Mark as clean after save
- ✅ `markDirty()` - Manually mark as dirty
- ✅ `reset()` - Reset to initial value
- ✅ `isDirty` - Synchronous dirty state getter
- ✅ `isDirty$` - Observable dirty state stream
- ✅ `getInitialValue()` - Get initial value
- ✅ `getCurrentValue()` - Get current value
- ✅ `hasChanged()` - Check if value differs from initial
- ✅ `dispose()` - Clean up resources

### FieldDirtyTracker<T>

Extended functionality for per-field tracking:

- ✅ `isFieldDirty()` - Check if specific field is dirty
- ✅ `getDirtyFields()` - Get array of dirty field names
- ✅ `getChanges()` - Get partial object with only changed fields
- ✅ `dirtyFields$` - Observable stream of dirty field names

### Key Design Decisions

1. **RxJS Integration**: Uses `BehaviorSubject` and `Observable` for reactive state
2. **JSON Comparison**: Default equality checking uses JSON serialization
3. **Cloning Strategy**: Deep cloning via JSON parse/stringify
4. **Extensibility**: Protected methods allow custom equality/cloning logic
5. **Memory Safety**: Proper cleanup with `dispose()` method
6. **Type Safety**: Full TypeScript generics support

## Test Coverage

All 31 tests pass successfully:

### DirtyTracker Tests (19 tests)
- Initial state
- Setting initial/current values
- Observable tracking
- Mark clean/dirty
- Reset functionality
- Value getters
- Observable emissions
- Disposal
- Edge cases (undefined, null, primitives, nested objects)

### FieldDirtyTracker Tests (12 tests)
- Field-level dirty detection
- Getting dirty fields
- Getting changes
- Observable dirty fields stream
- Field equality with various types

## Integration Examples

### 1. Navigation Guards

```typescript
class EditFormViewModel {
  private dirtyTracker = new DirtyTracker<FormData>();

  async confirmNavigationRequest(context, callback) {
    if (!this.dirtyTracker.isDirty) {
      callback(true);
      return;
    }
    const confirmed = await this.dialogService.confirm(
      'You have unsaved changes. Are you sure you want to leave?'
    );
    callback(confirmed);
  }
}
```

### 2. Browser beforeunload

```typescript
useEffect(() => {
  const handler = (e: BeforeUnloadEvent) => {
    if (viewModel.dirtyTracker.isDirty) {
      e.preventDefault();
      e.returnValue = '';
    }
  };
  window.addEventListener('beforeunload', handler);
  return () => window.removeEventListener('beforeunload', handler);
}, [viewModel]);
```

### 3. Conditional Save Button

```typescript
class FormViewModel {
  private dirtyTracker = new DirtyTracker<FormData>();
  public readonly canSave$ = this.dirtyTracker.isDirty$;

  async save() {
    if (!this.dirtyTracker.isDirty) return;
    await this.api.save(this.dirtyTracker.getCurrentValue());
    this.dirtyTracker.markClean();
  }
}
```

### 4. Partial Updates (PATCH)

```typescript
class FormViewModel {
  private tracker = new FieldDirtyTracker<FormData>();

  async saveChanges() {
    const changes = this.tracker.getChanges();
    if (Object.keys(changes).length === 0) return;
    await this.api.patch(`/users/${this.userId}`, changes);
    this.tracker.markClean();
  }
}
```

## API Surface

### Exports

```typescript
export { DirtyTracker, FieldDirtyTracker } from './state';
export type { IDirtyTrackable } from './state';
```

### Type Definitions

```typescript
interface IDirtyTrackable {
  readonly isDirty$: Observable<boolean>;
  markClean(): void;
  markDirty(): void;
}

class DirtyTracker<T = any> implements IDirtyTrackable {
  readonly isDirty$: Observable<boolean>;
  get isDirty(): boolean;
  setInitialValue(value: T): void;
  setCurrentValue(value: T): void;
  trackObservable(source$: Observable<T>, treatFirstAsInitial?: boolean): void;
  markClean(): void;
  markDirty(): void;
  reset(): T | undefined;
  getInitialValue(): T | undefined;
  getCurrentValue(): T | undefined;
  hasChanged(value: T): boolean;
  dispose(): void;
}

class FieldDirtyTracker<T extends Record<string, any>> extends DirtyTracker<T> {
  readonly dirtyFields$: Observable<Array<keyof T>>;
  isFieldDirty(field: keyof T): boolean;
  getDirtyFields(): Array<keyof T>;
  getChanges(): Partial<T>;
}
```

## Dependencies

- **RxJS**: `Observable`, `BehaviorSubject`, `Subscription`, `distinctUntilChanged`, `map`
- No additional dependencies required

## Performance Considerations

1. **JSON Serialization**: Default equality checking uses JSON serialization, which may be slow for very large objects. Can be overridden by extending the class.

2. **Observable Subscriptions**: Properly managed with `takeUntil` pattern and cleanup in `dispose()`.

3. **Memory**: Deep cloning creates copies of data. For large datasets, consider custom cloning logic.

## Future Enhancements

Potential improvements for future iterations:

1. **Custom Comparators**: Built-in support for custom equality functions without extending
2. **Shallow Tracking**: Option for shallow comparison instead of deep
3. **Change History**: Track history of changes for undo/redo
4. **Debounced Tracking**: Built-in debouncing for high-frequency updates
5. **Validation Integration**: Combine dirty tracking with validation state

## Acceptance Criteria

All acceptance criteria from the task have been met:

- ✅ `IDirtyTrackable` interface defined
- ✅ `DirtyTracker<T>` class with setInitialValue, setCurrentValue
- ✅ `trackObservable()` for automatic tracking
- ✅ `markClean()` and `markDirty()` methods
- ✅ `reset()` to restore initial value
- ✅ `FieldDirtyTracker<T>` for per-field tracking
- ✅ `isFieldDirty()`, `getDirtyFields()`, `getChanges()`
- ✅ `isDirty$` observable
- ✅ Unit tests pass (31 tests, 100% pass rate)
- ✅ `dispose()` cleans up resources
- ✅ Exported from package index

## Related Documentation

- [MVVM Core Prism Enhancements](../../docs/MVVM-CORE-PRISM-ENHANCEMENTS.md) - Section 8.2 Dirty Tracking
- [Task Specification](../../tasks/mvvm-enhancements/forms-core-dirty-tracking.md)
- [State Module README](./src/state/README.md)
- [Usage Examples](./src/state/examples.ts)

## Conclusion

The dirty tracking implementation provides a robust, type-safe, and framework-agnostic solution for tracking form changes. It integrates seamlessly with RxJS observables and follows MVVM patterns established in the Web Loom project. The comprehensive test suite and documentation ensure maintainability and ease of use.
