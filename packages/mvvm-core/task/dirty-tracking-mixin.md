# Task: Dirty Tracking Mixin

**Priority**: P3 (Medium Impact, Low Effort)
**Status**: Not Started
**Estimated Files**: 1-2 new files
**Breaking Changes**: None (additive feature)

---

## Overview

Implement `IDirtyTrackable` interface and `DirtyTracker` utility that tracks whether data has been modified from its initial state. This enables:
- Unsaved changes detection
- Navigation guards (prevent leaving with unsaved data)
- Conditional save button enablement
- Change highlighting in UI

## Web Relevance Assessment

**Relevant for web development:**
- Form editors with "unsaved changes" warnings
- Document editors tracking modifications
- Settings pages that highlight changed values
- "Save" button that enables only when dirty
- Browser beforeunload warnings

**Integration with other patterns:**
- Works with `IConfirmNavigationRequest` for navigation guards
- Works with Commands for save button enablement
- Works with ErrorsContainer for form state

## Implementation Steps

### Step 1: Create IDirtyTrackable Interface

Create `src/state/IDirtyTrackable.ts`:

```typescript
import { Observable } from 'rxjs';

/**
 * Interface for objects that track dirty (modified) state
 */
export interface IDirtyTrackable {
  /**
   * Observable indicating if data has been modified
   */
  readonly isDirty$: Observable<boolean>;

  /**
   * Mark as clean (typically after save)
   */
  markClean(): void;

  /**
   * Mark as dirty (typically when data changes)
   */
  markDirty(): void;
}

/**
 * Type guard
 */
export function isDirtyTrackable(obj: any): obj is IDirtyTrackable {
  return (
    obj &&
    obj.isDirty$ &&
    typeof obj.isDirty$.subscribe === 'function' &&
    typeof obj.markClean === 'function' &&
    typeof obj.markDirty === 'function'
  );
}
```

### Step 2: Create DirtyTracker Class

Create `src/state/DirtyTracker.ts`:

```typescript
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { distinctUntilChanged, skip } from 'rxjs/operators';
import { IDirtyTrackable } from './IDirtyTrackable';

/**
 * Tracks dirty state for data changes
 */
export class DirtyTracker<T = any> implements IDirtyTrackable {
  private readonly _isDirty$ = new BehaviorSubject<boolean>(false);
  private initialValue: T | undefined;
  private currentValue: T | undefined;
  private subscription: Subscription | null = null;

  /**
   * Observable indicating if data has been modified from initial state
   */
  public readonly isDirty$: Observable<boolean> = this._isDirty$.pipe(
    distinctUntilChanged()
  );

  /**
   * Current dirty state (synchronous)
   */
  get isDirty(): boolean {
    return this._isDirty$.value;
  }

  /**
   * Set the initial value to compare against
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
   * Track changes from an observable automatically
   * @param source$ Observable to track
   * @param treatFirstAsInitial If true, first emission sets initial value
   */
  trackObservable(source$: Observable<T>, treatFirstAsInitial: boolean = true): void {
    this.subscription?.unsubscribe();

    let isFirst = true;
    this.subscription = source$.subscribe(value => {
      if (isFirst && treatFirstAsInitial) {
        this.setInitialValue(value);
        isFirst = false;
      } else {
        this.setCurrentValue(value);
      }
    });
  }

  /**
   * Mark as clean (call after successful save)
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
   * Reset to initial value
   */
  reset(): void {
    this.currentValue = this.clone(this.initialValue);
    this._isDirty$.next(false);
  }

  /**
   * Get the initial value (for reset functionality)
   */
  getInitialValue(): T | undefined {
    return this.clone(this.initialValue);
  }

  /**
   * Check if a specific value differs from initial
   */
  hasChanged(currentValue: T): boolean {
    return !this.isEqual(this.initialValue, currentValue);
  }

  /**
   * Clean up
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
   * Deep equality check. Override for custom comparison.
   */
  protected isEqual(a: T | undefined, b: T | undefined): boolean {
    if (a === b) return true;
    if (a === undefined || b === undefined) return false;

    // Simple JSON comparison for objects
    // Override this method for more sophisticated comparison
    return JSON.stringify(a) === JSON.stringify(b);
  }

  /**
   * Clone a value. Override for custom cloning.
   */
  protected clone(value: T | undefined): T | undefined {
    if (value === undefined) return undefined;
    // Simple JSON clone for objects
    // Override for more sophisticated cloning (e.g., handle Date, Map, Set)
    return JSON.parse(JSON.stringify(value));
  }
}
```

### Step 3: Create TrackableViewModel Base Class

Create `src/viewmodels/TrackableViewModel.ts`:

```typescript
import { Observable } from 'rxjs';
import { tap, takeUntil } from 'rxjs/operators';
import { BaseViewModel } from './BaseViewModel';
import { BaseModel } from '../models/BaseModel';
import { DirtyTracker } from '../state/DirtyTracker';
import { IDirtyTrackable } from '../state/IDirtyTrackable';

/**
 * ViewModel that tracks dirty state for its data
 */
export abstract class TrackableViewModel<TModel extends BaseModel<any, any>>
  extends BaseViewModel<TModel>
  implements IDirtyTrackable {

  protected readonly dirtyTracker = new DirtyTracker<TModel['data']>();

  /**
   * Observable indicating if data has been modified
   */
  public readonly isDirty$: Observable<boolean> = this.dirtyTracker.isDirty$;

  constructor(model: TModel) {
    super(model);

    // Track model data changes
    this.dirtyTracker.trackObservable(this.data$, true);
  }

  /**
   * Mark as clean (typically after save)
   */
  markClean(): void {
    this.dirtyTracker.markClean();
  }

  /**
   * Mark as dirty
   */
  markDirty(): void {
    this.dirtyTracker.markDirty();
  }

  /**
   * Reset to initial value
   */
  resetToInitial(): void {
    const initialValue = this.dirtyTracker.getInitialValue();
    if (initialValue !== undefined) {
      this.model.setData(initialValue);
    }
    this.dirtyTracker.reset();
  }

  /**
   * Observable that can prevent navigation when dirty
   */
  get canNavigateAway$(): Observable<boolean> {
    return this.isDirty$.pipe(
      map(isDirty => !isDirty)
    );
  }

  public override dispose(): void {
    this.dirtyTracker.dispose();
    super.dispose();
  }
}

import { map } from 'rxjs/operators';
```

### Step 4: Add Field-Level Dirty Tracking

Extend DirtyTracker for field-level tracking:

```typescript
/**
 * Tracks dirty state per field
 */
export class FieldDirtyTracker<T extends Record<string, any>>
  extends DirtyTracker<T> {

  /**
   * Check if a specific field is dirty
   */
  isFieldDirty(field: keyof T): boolean {
    const initial = this.getInitialValue();
    const current = this.currentValue;

    if (initial === undefined || current === undefined) return false;
    return initial[field] !== current[field];
  }

  /**
   * Get all dirty field names
   */
  getDirtyFields(): Array<keyof T> {
    const initial = this.getInitialValue();
    const current = this.currentValue;

    if (initial === undefined || current === undefined) return [];

    const dirtyFields: Array<keyof T> = [];
    for (const key of Object.keys(initial) as Array<keyof T>) {
      if (initial[key] !== current[key]) {
        dirtyFields.push(key);
      }
    }
    return dirtyFields;
  }

  /**
   * Observable of dirty field names
   */
  get dirtyFields$(): Observable<Array<keyof T>> {
    return this.isDirty$.pipe(
      map(() => this.getDirtyFields())
    );
  }
}
```

### Step 5: Add Tests

Create `src/state/DirtyTracker.test.ts`:

1. **Initial state tests:**
   - isDirty starts as false
   - setInitialValue sets initial and marks clean

2. **Dirty detection tests:**
   - setCurrentValue with different value -> isDirty true
   - setCurrentValue with same value -> isDirty false
   - Deep object comparison works

3. **markClean/markDirty tests:**
   - markClean resets dirty state
   - markDirty forces dirty state

4. **trackObservable tests:**
   - First emission sets initial value
   - Subsequent emissions update current value
   - Unsubscribes on dispose

5. **reset tests:**
   - reset() restores initial value
   - isDirty becomes false

6. **FieldDirtyTracker tests:**
   - isFieldDirty detects per-field changes
   - getDirtyFields returns correct fields
   - dirtyFields$ emits correctly

### Step 6: Add Example

Create `src/examples/dirty-tracking-example.ts`:

```typescript
class EditProfileViewModel
  extends TrackableViewModel<ProfileModel>
  implements IConfirmNavigationRequest {

  public readonly saveCommand = new Command(
    () => this.save(),
    this.isDirty$ // Only enable when dirty
  );

  public readonly discardCommand = new Command(
    () => this.resetToInitial()
  );

  private async save(): Promise<void> {
    await this.model.save();
    this.markClean();
  }

  // IConfirmNavigationRequest implementation
  async confirmNavigationRequest(
    context: NavigationContext,
    callback: NavigationCallback
  ): Promise<void> {
    if (!this.dirtyTracker.isDirty) {
      callback(true);
      return;
    }

    const confirmed = await this.confirmDialog.raiseAsync({
      title: 'Unsaved Changes',
      content: 'You have unsaved changes. Discard and leave?'
    });

    callback(confirmed.confirmed || false);
  }
}
```

### Step 7: Export from Index

Update `src/index.ts`:

```typescript
export { DirtyTracker, FieldDirtyTracker } from './state/DirtyTracker';
export { TrackableViewModel } from './viewmodels/TrackableViewModel';
export type { IDirtyTrackable } from './state/IDirtyTrackable';
export { isDirtyTrackable } from './state/IDirtyTrackable';
```

---

## Acceptance Criteria

- [ ] `IDirtyTrackable` interface defined
- [ ] `DirtyTracker` class with setInitialValue, setCurrentValue
- [ ] `trackObservable()` for automatic tracking
- [ ] `markClean()` and `markDirty()` methods
- [ ] `reset()` to restore initial value
- [ ] `FieldDirtyTracker` for per-field tracking
- [ ] `TrackableViewModel` base class
- [ ] `canNavigateAway$` observable
- [ ] Unit tests for all functionality
- [ ] Example demonstrating usage
- [ ] Exported from package index

---

## Integration Notes

### With IConfirmNavigationRequest

```typescript
// TrackableViewModel + IConfirmNavigationRequest = unsaved changes guard
class EditViewModel extends TrackableViewModel implements IConfirmNavigationRequest {
  confirmNavigationRequest(ctx, callback) {
    if (!this.dirtyTracker.isDirty) callback(true);
    else /* show confirmation dialog */
  }
}
```

### With Commands

```typescript
// Enable save button only when dirty
this.saveCommand = new Command(() => this.save(), this.isDirty$);
```

### With Browser beforeunload

```typescript
// Framework integration (e.g., React)
useEffect(() => {
  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    if (vm.dirtyTracker.isDirty) {
      e.preventDefault();
      e.returnValue = '';
    }
  };
  window.addEventListener('beforeunload', handleBeforeUnload);
  return () => window.removeEventListener('beforeunload', handleBeforeUnload);
}, []);
```

---

## Dependencies

- RxJS operators
- Optional: BaseViewModel for TrackableViewModel

---

## Breaking Changes

**None** - Purely additive:
- New standalone classes
- New optional base class
- No changes to existing APIs
