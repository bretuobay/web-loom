# Task: Dirty Tracking

**Target Package**: `packages/forms-core`
**Priority**: P3 (Medium Impact, Low Effort)
**Status**: Not Started
**Estimated Files**: 2 new files
**Breaking Changes**: None (additive feature)

---

## Overview

Implement `DirtyTracker<T>` class that tracks whether form data has been modified from its initial state. Enables unsaved changes detection, navigation guards, and conditional save button enablement.

## Target Location

```
packages/forms-core/src/
├── state/
│   ├── DirtyTracker.ts       (NEW)
│   ├── DirtyTracker.test.ts  (NEW)
│   └── index.ts              (NEW)
└── index.ts                  (update exports)
```

## Web Use Cases

- "You have unsaved changes" warnings
- Browser beforeunload prompts
- Save button that enables only when dirty
- Reset/discard changes functionality
- Navigation guards with IConfirmNavigationRequest

## Implementation Steps

### Step 1: Create IDirtyTrackable Interface

Create `src/state/DirtyTracker.ts`:

```typescript
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';

/**
 * Interface for objects that track dirty (modified) state
 */
export interface IDirtyTrackable {
  readonly isDirty$: Observable<boolean>;
  markClean(): void;
  markDirty(): void;
}

/**
 * Tracks dirty state by comparing current value to initial value.
 * Supports automatic tracking from observables.
 *
 * @template T The type of data being tracked
 */
export class DirtyTracker<T = any> implements IDirtyTrackable {
  private readonly _isDirty$ = new BehaviorSubject<boolean>(false);
  private initialValue: T | undefined;
  private currentValue: T | undefined;
  private subscription: Subscription | null = null;

  /**
   * Observable indicating if data has been modified from initial state
   */
  public readonly isDirty$: Observable<boolean> = this._isDirty$.pipe(distinctUntilChanged());

  /**
   * Current dirty state (synchronous)
   */
  get isDirty(): boolean {
    return this._isDirty$.value;
  }

  /**
   * Set the initial value to compare against.
   * Also resets current value and marks as clean.
   */
  setInitialValue(value: T): void {
    this.initialValue = this.clone(value);
    this.currentValue = this.clone(value);
    this._isDirty$.next(false);
  }

  /**
   * Update current value and recalculate dirty state
   */
  setCurrentValue(value: T): void {
    this.currentValue = value;
    this.recalculateDirty();
  }

  /**
   * Track changes from an observable automatically.
   *
   * @param source$ Observable to track
   * @param treatFirstAsInitial If true, first emission sets initial value (default: true)
   */
  trackObservable(source$: Observable<T>, treatFirstAsInitial: boolean = true): void {
    this.subscription?.unsubscribe();

    let isFirst = true;
    this.subscription = source$.subscribe((value) => {
      if (isFirst && treatFirstAsInitial) {
        this.setInitialValue(value);
        isFirst = false;
      } else {
        this.setCurrentValue(value);
      }
    });
  }

  /**
   * Mark as clean (call after successful save).
   * Updates initial value to current value.
   */
  markClean(): void {
    this.initialValue = this.clone(this.currentValue);
    this._isDirty$.next(false);
  }

  /**
   * Mark as dirty (manual override)
   */
  markDirty(): void {
    this._isDirty$.next(true);
  }

  /**
   * Reset current value to initial value
   */
  reset(): T | undefined {
    this.currentValue = this.clone(this.initialValue);
    this._isDirty$.next(false);
    return this.clone(this.initialValue);
  }

  /**
   * Get the initial value (for reset functionality)
   */
  getInitialValue(): T | undefined {
    return this.clone(this.initialValue);
  }

  /**
   * Get the current value
   */
  getCurrentValue(): T | undefined {
    return this.currentValue;
  }

  /**
   * Check if a specific value differs from initial
   */
  hasChanged(value: T): boolean {
    return !this.isEqual(this.initialValue, value);
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.subscription?.unsubscribe();
    this._isDirty$.complete();
  }

  private recalculateDirty(): void {
    const dirty = !this.isEqual(this.initialValue, this.currentValue);
    this._isDirty$.next(dirty);
  }

  /**
   * Deep equality check. Override for custom comparison logic.
   */
  protected isEqual(a: T | undefined, b: T | undefined): boolean {
    if (a === b) return true;
    if (a === undefined || b === undefined) return false;

    // JSON comparison for objects (handles nested structures)
    try {
      return JSON.stringify(a) === JSON.stringify(b);
    } catch {
      return false;
    }
  }

  /**
   * Clone a value. Override for custom cloning logic.
   */
  protected clone(value: T | undefined): T | undefined {
    if (value === undefined) return undefined;
    if (value === null) return null as T;

    // Primitive types
    if (typeof value !== 'object') return value;

    // JSON clone for objects
    try {
      return JSON.parse(JSON.stringify(value));
    } catch {
      return value;
    }
  }
}
```

### Step 2: Create FieldDirtyTracker

Continue in `src/state/DirtyTracker.ts`:

```typescript
/**
 * Extends DirtyTracker with per-field dirty tracking.
 * Useful for highlighting which specific fields have changed.
 *
 * @template T Object type with fields to track
 */
export class FieldDirtyTracker<T extends Record<string, any>> extends DirtyTracker<T> {
  /**
   * Check if a specific field is dirty
   */
  isFieldDirty(field: keyof T): boolean {
    const initial = this.getInitialValue();
    const current = this.getCurrentValue();

    if (initial === undefined || current === undefined) return false;

    return !this.isFieldEqual(initial[field], current[field]);
  }

  /**
   * Get all dirty field names
   */
  getDirtyFields(): Array<keyof T> {
    const initial = this.getInitialValue();
    const current = this.getCurrentValue();

    if (initial === undefined || current === undefined) return [];

    const dirtyFields: Array<keyof T> = [];
    const allKeys = new Set([...Object.keys(initial), ...Object.keys(current)]) as Set<keyof T>;

    allKeys.forEach((key) => {
      if (!this.isFieldEqual(initial[key], current[key])) {
        dirtyFields.push(key);
      }
    });

    return dirtyFields;
  }

  /**
   * Observable of dirty field names
   */
  get dirtyFields$(): Observable<Array<keyof T>> {
    return this.isDirty$.pipe(map(() => this.getDirtyFields()));
  }

  /**
   * Get changes as a partial object (only changed fields)
   */
  getChanges(): Partial<T> {
    const dirtyFields = this.getDirtyFields();
    const current = this.getCurrentValue();

    if (!current) return {};

    const changes: Partial<T> = {};
    dirtyFields.forEach((field) => {
      changes[field] = current[field];
    });

    return changes;
  }

  private isFieldEqual(a: any, b: any): boolean {
    if (a === b) return true;
    if (a === undefined || b === undefined) return a === b;
    if (a === null || b === null) return a === b;

    if (typeof a !== 'object' || typeof b !== 'object') {
      return a === b;
    }

    try {
      return JSON.stringify(a) === JSON.stringify(b);
    } catch {
      return false;
    }
  }
}
```

### Step 3: Add Tests

Create `src/state/DirtyTracker.test.ts`:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { firstValueFrom, BehaviorSubject } from 'rxjs';
import { DirtyTracker, FieldDirtyTracker } from './DirtyTracker';

describe('DirtyTracker', () => {
  let tracker: DirtyTracker<{ name: string; age: number }>;

  beforeEach(() => {
    tracker = new DirtyTracker();
  });

  describe('initial state', () => {
    it('should not be dirty initially', () => {
      expect(tracker.isDirty).toBe(false);
    });
  });

  describe('setInitialValue', () => {
    it('should set initial value and mark clean', async () => {
      tracker.setInitialValue({ name: 'John', age: 30 });

      expect(tracker.isDirty).toBe(false);
      expect(tracker.getInitialValue()).toEqual({ name: 'John', age: 30 });
    });
  });

  describe('setCurrentValue', () => {
    it('should mark dirty when value differs from initial', async () => {
      tracker.setInitialValue({ name: 'John', age: 30 });
      tracker.setCurrentValue({ name: 'Jane', age: 30 });

      expect(tracker.isDirty).toBe(true);
    });

    it('should mark clean when value equals initial', async () => {
      tracker.setInitialValue({ name: 'John', age: 30 });
      tracker.setCurrentValue({ name: 'Jane', age: 30 });
      tracker.setCurrentValue({ name: 'John', age: 30 });

      expect(tracker.isDirty).toBe(false);
    });
  });

  describe('trackObservable', () => {
    it('should treat first emission as initial value', async () => {
      const source$ = new BehaviorSubject({ name: 'John', age: 30 });
      tracker.trackObservable(source$);

      expect(tracker.isDirty).toBe(false);
      expect(tracker.getInitialValue()).toEqual({ name: 'John', age: 30 });
    });

    it('should track subsequent emissions as current value', async () => {
      const source$ = new BehaviorSubject({ name: 'John', age: 30 });
      tracker.trackObservable(source$);

      source$.next({ name: 'Jane', age: 30 });

      expect(tracker.isDirty).toBe(true);
    });
  });

  describe('markClean', () => {
    it('should mark clean and update initial value', async () => {
      tracker.setInitialValue({ name: 'John', age: 30 });
      tracker.setCurrentValue({ name: 'Jane', age: 30 });

      tracker.markClean();

      expect(tracker.isDirty).toBe(false);
      expect(tracker.getInitialValue()).toEqual({ name: 'Jane', age: 30 });
    });
  });

  describe('markDirty', () => {
    it('should force dirty state', () => {
      tracker.setInitialValue({ name: 'John', age: 30 });
      tracker.markDirty();

      expect(tracker.isDirty).toBe(true);
    });
  });

  describe('reset', () => {
    it('should reset to initial value', () => {
      tracker.setInitialValue({ name: 'John', age: 30 });
      tracker.setCurrentValue({ name: 'Jane', age: 25 });

      const resetValue = tracker.reset();

      expect(resetValue).toEqual({ name: 'John', age: 30 });
      expect(tracker.isDirty).toBe(false);
    });
  });

  describe('isDirty$', () => {
    it('should emit on dirty state changes', async () => {
      const emissions: boolean[] = [];
      tracker.isDirty$.subscribe((v) => emissions.push(v));

      tracker.setInitialValue({ name: 'John', age: 30 });
      tracker.setCurrentValue({ name: 'Jane', age: 30 });
      tracker.markClean();

      expect(emissions).toContain(true);
      expect(emissions[emissions.length - 1]).toBe(false);
    });
  });
});

describe('FieldDirtyTracker', () => {
  let tracker: FieldDirtyTracker<{ name: string; email: string; age: number }>;

  beforeEach(() => {
    tracker = new FieldDirtyTracker();
    tracker.setInitialValue({ name: 'John', email: 'john@test.com', age: 30 });
  });

  describe('isFieldDirty', () => {
    it('should detect dirty field', () => {
      tracker.setCurrentValue({ name: 'Jane', email: 'john@test.com', age: 30 });

      expect(tracker.isFieldDirty('name')).toBe(true);
      expect(tracker.isFieldDirty('email')).toBe(false);
      expect(tracker.isFieldDirty('age')).toBe(false);
    });
  });

  describe('getDirtyFields', () => {
    it('should return all dirty fields', () => {
      tracker.setCurrentValue({ name: 'Jane', email: 'jane@test.com', age: 30 });

      const dirtyFields = tracker.getDirtyFields();

      expect(dirtyFields).toContain('name');
      expect(dirtyFields).toContain('email');
      expect(dirtyFields).not.toContain('age');
    });
  });

  describe('getChanges', () => {
    it('should return only changed fields', () => {
      tracker.setCurrentValue({ name: 'Jane', email: 'john@test.com', age: 25 });

      const changes = tracker.getChanges();

      expect(changes).toEqual({ name: 'Jane', age: 25 });
      expect(changes).not.toHaveProperty('email');
    });
  });
});
```

### Step 4: Create State Index

Create `src/state/index.ts`:

```typescript
export { DirtyTracker, FieldDirtyTracker } from './DirtyTracker';
export type { IDirtyTrackable } from './DirtyTracker';
```

### Step 5: Update Package Index

Update `packages/forms-core/src/index.ts`:

```typescript
// ... existing exports ...

export * from './state';
```

---

## Acceptance Criteria

- [ ] `IDirtyTrackable` interface defined
- [ ] `DirtyTracker<T>` class with setInitialValue, setCurrentValue
- [ ] `trackObservable()` for automatic tracking
- [ ] `markClean()` and `markDirty()` methods
- [ ] `reset()` to restore initial value
- [ ] `FieldDirtyTracker<T>` for per-field tracking
- [ ] `isFieldDirty()`, `getDirtyFields()`, `getChanges()`
- [ ] `isDirty$` observable
- [ ] Unit tests pass
- [ ] `dispose()` cleans up resources
- [ ] Exported from package index

---

## Integration Examples

### With Navigation Guards

```typescript
class EditFormViewModel implements IConfirmNavigationRequest {
  private dirtyTracker = new DirtyTracker();

  async confirmNavigationRequest(ctx, callback) {
    if (!this.dirtyTracker.isDirty) {
      callback(true);
      return;
    }
    // Show confirmation dialog
    const confirmed = await this.confirmDialog.show('Discard changes?');
    callback(confirmed);
  }
}
```

### With Browser beforeunload

```typescript
// In React component
useEffect(() => {
  const handler = (e: BeforeUnloadEvent) => {
    if (viewModel.dirtyTracker.isDirty) {
      e.preventDefault();
      e.returnValue = '';
    }
  };
  window.addEventListener('beforeunload', handler);
  return () => window.removeEventListener('beforeunload', handler);
}, []);
```

---

## Dependencies

- RxJS: `Observable`, `BehaviorSubject`, `Subscription`
