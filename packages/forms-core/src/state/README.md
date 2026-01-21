# Dirty Tracking

The dirty tracking module provides utilities for tracking whether form data has been modified from its initial state. This is essential for implementing features like unsaved changes warnings, conditional save buttons, and navigation guards.

## Features

- **DirtyTracker**: Tracks overall dirty state by comparing current value to initial value
- **FieldDirtyTracker**: Extends DirtyTracker with per-field dirty tracking
- **Observable-based**: Reactive dirty state using RxJS observables
- **Automatic tracking**: Can automatically track changes from observables
- **Type-safe**: Full TypeScript support with generics

## Basic Usage

### DirtyTracker

```typescript
import { DirtyTracker } from '@web-loom/forms-core';

interface FormData {
  name: string;
  email: string;
  age: number;
}

// Create a tracker
const tracker = new DirtyTracker<FormData>();

// Set initial value (e.g., loaded from API)
tracker.setInitialValue({ name: 'John', email: 'john@example.com', age: 30 });

// Update current value (e.g., user edits form)
tracker.setCurrentValue({ name: 'Jane', email: 'john@example.com', age: 30 });

// Check if dirty
console.log(tracker.isDirty); // true

// Subscribe to dirty state changes
tracker.isDirty$.subscribe(isDirty => {
  console.log('Form is dirty:', isDirty);
});

// Mark as clean after save
tracker.markClean();

// Reset to initial value
const resetValue = tracker.reset();
```

### Automatic Observable Tracking

```typescript
import { BehaviorSubject } from 'rxjs';
import { DirtyTracker } from '@web-loom/forms-core';

const formData$ = new BehaviorSubject({ name: 'John', age: 30 });
const tracker = new DirtyTracker();

// Automatically track changes from observable
tracker.trackObservable(formData$);

// First emission is treated as initial value
// Subsequent emissions update current value
formData$.next({ name: 'Jane', age: 30 });
console.log(tracker.isDirty); // true
```

### FieldDirtyTracker

Track which specific fields have changed:

```typescript
import { FieldDirtyTracker } from '@web-loom/forms-core';

interface FormData {
  name: string;
  email: string;
  age: number;
}

const tracker = new FieldDirtyTracker<FormData>();

tracker.setInitialValue({ name: 'John', email: 'john@example.com', age: 30 });
tracker.setCurrentValue({ name: 'Jane', email: 'jane@example.com', age: 30 });

// Check specific field
console.log(tracker.isFieldDirty('name')); // true
console.log(tracker.isFieldDirty('age')); // false

// Get all dirty fields
console.log(tracker.getDirtyFields()); // ['name', 'email']

// Get only changed values
console.log(tracker.getChanges()); // { name: 'Jane', email: 'jane@example.com' }

// Subscribe to dirty fields
tracker.dirtyFields$.subscribe(fields => {
  console.log('Dirty fields:', fields);
});
```

## Integration Examples

### With Navigation Guards

Prevent navigation when there are unsaved changes:

```typescript
import { DirtyTracker } from '@web-loom/forms-core';

class EditFormViewModel {
  private dirtyTracker = new DirtyTracker<FormData>();

  async confirmNavigationRequest(context, callback) {
    if (!this.dirtyTracker.isDirty) {
      callback(true);
      return;
    }

    const confirmed = await this.dialogService.confirm(
      'You have unsaved changes. Are you sure you want to leave?',
      'Unsaved Changes'
    );

    callback(confirmed);
  }
}
```

### With Browser beforeunload

Warn users before closing the browser tab:

```typescript
import { useEffect } from 'react';
import { DirtyTracker } from '@web-loom/forms-core';

function FormComponent({ viewModel }) {
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

  return <form>...</form>;
}
```

### Conditional Save Button

Enable save button only when form is dirty:

```typescript
import { DirtyTracker } from '@web-loom/forms-core';

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

### Highlight Changed Fields

Visually indicate which fields have been modified:

```typescript
import { FieldDirtyTracker } from '@web-loom/forms-core';

function FormField({ name, tracker }) {
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    const sub = tracker.isDirty$.subscribe(() => {
      setIsDirty(tracker.isFieldDirty(name));
    });
    return () => sub.unsubscribe();
  }, [name, tracker]);

  return (
    <input
      name={name}
      className={isDirty ? 'field-dirty' : ''}
    />
  );
}
```

### Partial Updates (PATCH)

Send only changed fields to the API:

```typescript
import { FieldDirtyTracker } from '@web-loom/forms-core';

class FormViewModel {
  private tracker = new FieldDirtyTracker<FormData>();

  async saveChanges() {
    const changes = this.tracker.getChanges();

    if (Object.keys(changes).length === 0) {
      return; // Nothing to save
    }

    // Send only changed fields
    await this.api.patch(`/users/${this.userId}`, changes);
    this.tracker.markClean();
  }
}
```

## API Reference

### DirtyTracker<T>

#### Properties

- `isDirty: boolean` - Current dirty state (synchronous)
- `isDirty$: Observable<boolean>` - Observable of dirty state changes

#### Methods

- `setInitialValue(value: T): void` - Set the initial value to compare against
- `setCurrentValue(value: T): void` - Update current value and recalculate dirty state
- `trackObservable(source$: Observable<T>, treatFirstAsInitial?: boolean): void` - Automatically track changes from an observable
- `markClean(): void` - Mark as clean (updates initial value to current value)
- `markDirty(): void` - Manually mark as dirty
- `reset(): T | undefined` - Reset current value to initial value
- `getInitialValue(): T | undefined` - Get the initial value
- `getCurrentValue(): T | undefined` - Get the current value
- `hasChanged(value: T): boolean` - Check if a value differs from initial
- `dispose(): void` - Clean up resources

### FieldDirtyTracker<T>

Extends `DirtyTracker<T>` with additional methods:

#### Properties

- `dirtyFields$: Observable<Array<keyof T>>` - Observable of dirty field names

#### Methods

- `isFieldDirty(field: keyof T): boolean` - Check if a specific field is dirty
- `getDirtyFields(): Array<keyof T>` - Get all dirty field names
- `getChanges(): Partial<T>` - Get changes as a partial object (only changed fields)

## Customization

You can extend `DirtyTracker` to customize equality checking or cloning:

```typescript
class CustomDirtyTracker<T> extends DirtyTracker<T> {
  // Custom equality check (e.g., ignore certain fields)
  protected isEqual(a: T | undefined, b: T | undefined): boolean {
    // Your custom logic
    return super.isEqual(a, b);
  }

  // Custom cloning (e.g., for objects with methods)
  protected clone(value: T | undefined): T | undefined {
    // Your custom logic
    return super.clone(value);
  }
}
```

## Best Practices

1. **Call `dispose()`**: Always dispose of trackers when done to prevent memory leaks
2. **Mark clean after save**: Call `markClean()` after successful save operations
3. **Use FieldDirtyTracker for complex forms**: When you need per-field tracking
4. **Combine with validation**: Check both dirty state and validation before saving
5. **Handle async operations**: Consider dirty state during async save operations

## Notes

- Equality checking uses JSON serialization by default
- Works with nested objects and arrays
- Handles `undefined`, `null`, and primitive values
- Observable subscriptions are automatically cleaned up on `dispose()`
