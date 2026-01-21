# Task: Active Awareness Pattern

**Target Package**: `packages/mvvm-patterns`
**Priority**: P2 (Medium Impact, Low Effort)
**Status**: Not Started
**Estimated Files**: 3 new files
**Breaking Changes**: None (new package feature)

---

## Overview

Implement `IActiveAware` interface and `ActiveAwareViewModel` base class that tracks whether a ViewModel is currently "active" (e.g., visible tab, selected region). Enables pausing/resuming updates based on visibility and conditional command execution.

## Target Location

```
packages/mvvm-patterns/src/
├── lifecycle/
│   ├── IActiveAware.ts           (NEW)
│   └── index.ts                  (NEW)
├── viewmodels/
│   ├── ActiveAwareViewModel.ts   (NEW)
│   └── index.ts                  (NEW)
└── index.ts                      (update exports)
```

**Prerequisite**: Complete `mvvm-patterns-package-setup.md` first.

## Web Use Cases

- Tab-based interfaces where inactive tabs pause polling
- Dashboard panels that pause real-time updates when minimized
- Multi-view layouts where only active view processes events
- Performance optimization by suspending inactive ViewModels
- Browser tab visibility integration (Page Visibility API)

## Implementation Steps

### Step 1: Create IActiveAware Interface

Create `src/lifecycle/IActiveAware.ts`:

```typescript
import { Observable } from 'rxjs';

/**
 * Interface for objects that need to know if they are currently active.
 * "Active" typically means visible and receiving user interaction.
 *
 * Use cases:
 * - Pause polling when tab is inactive
 * - Stop animations when view is hidden
 * - Filter CompositeCommand execution to active views only
 */
export interface IActiveAware {
  /**
   * Gets or sets whether the object is currently active.
   * Setting this value triggers onIsActiveChanged if implemented.
   */
  isActive: boolean;

  /**
   * Observable that emits when active state changes.
   * Emits current value to new subscribers.
   */
  readonly isActive$: Observable<boolean>;
}

/**
 * Type guard to check if an object implements IActiveAware
 */
export function isActiveAware(obj: any): obj is IActiveAware {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    typeof obj.isActive === 'boolean' &&
    obj.isActive$ !== undefined &&
    typeof obj.isActive$.subscribe === 'function'
  );
}
```

### Step 2: Create ActiveAwareViewModel Base Class

Create `src/viewmodels/ActiveAwareViewModel.ts`:

```typescript
import { BehaviorSubject, Observable } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';
import { BaseViewModel, BaseModel } from '@anthropic/mvvm-core';
import { IActiveAware } from '../lifecycle/IActiveAware';

/**
 * Base ViewModel that implements IActiveAware.
 * Extend this class for ViewModels that need to respond to active state changes.
 *
 * @example
 * class TabViewModel extends ActiveAwareViewModel<TabModel> {
 *   private pollingSubscription?: Subscription;
 *
 *   protected onIsActiveChanged(isActive: boolean): void {
 *     if (isActive) {
 *       this.startPolling();
 *     } else {
 *       this.stopPolling();
 *     }
 *   }
 * }
 */
export abstract class ActiveAwareViewModel<TModel extends BaseModel<any, any>>
  extends BaseViewModel<TModel>
  implements IActiveAware {

  private readonly _isActive$ = new BehaviorSubject<boolean>(false);

  /**
   * Observable that emits when active state changes.
   * New subscribers receive the current value immediately.
   */
  public readonly isActive$: Observable<boolean> = this._isActive$.pipe(
    distinctUntilChanged()
  );

  /**
   * Gets the current active state
   */
  get isActive(): boolean {
    return this._isActive$.value;
  }

  /**
   * Sets the active state.
   * Triggers onIsActiveChanged() when value changes.
   */
  set isActive(value: boolean) {
    if (this._isActive$.value !== value) {
      const previousValue = this._isActive$.value;
      this._isActive$.next(value);
      this.onIsActiveChanged(value, previousValue);
    }
  }

  /**
   * Override this method to react to active state changes.
   * Called when isActive changes from true to false or vice versa.
   *
   * @param isActive The new active state
   * @param wasActive The previous active state
   *
   * @example
   * protected onIsActiveChanged(isActive: boolean, wasActive: boolean): void {
   *   if (isActive) {
   *     console.log('View became active');
   *     this.refreshData();
   *   } else {
   *     console.log('View became inactive');
   *     this.pauseUpdates();
   *   }
   * }
   */
  protected onIsActiveChanged(isActive: boolean, wasActive: boolean): void {
    // Default: no-op. Override in derived classes.
  }

  /**
   * Convenience method to activate the ViewModel
   */
  activate(): void {
    this.isActive = true;
  }

  /**
   * Convenience method to deactivate the ViewModel
   */
  deactivate(): void {
    this.isActive = false;
  }

  public override dispose(): void {
    this._isActive$.complete();
    super.dispose();
  }
}
```

### Step 3: Create Lifecycle Index

Create `src/lifecycle/index.ts`:

```typescript
export { IActiveAware, isActiveAware } from './IActiveAware';
```

### Step 4: Create ViewModels Index

Create `src/viewmodels/index.ts`:

```typescript
export { ActiveAwareViewModel } from './ActiveAwareViewModel';
```

### Step 5: Add Tests

Create `src/viewmodels/ActiveAwareViewModel.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { firstValueFrom } from 'rxjs';
import { take, toArray } from 'rxjs/operators';
import { BaseModel } from '@anthropic/mvvm-core';
import { ActiveAwareViewModel } from './ActiveAwareViewModel';
import { isActiveAware } from '../lifecycle/IActiveAware';

class TestModel extends BaseModel<{ value: string }, any> {
  constructor() {
    super({ initialData: { value: 'test' } });
  }
}

class TestActiveViewModel extends ActiveAwareViewModel<TestModel> {
  public activeChangeCalls: Array<{ isActive: boolean; wasActive: boolean }> = [];

  protected override onIsActiveChanged(isActive: boolean, wasActive: boolean): void {
    this.activeChangeCalls.push({ isActive, wasActive });
  }
}

describe('ActiveAwareViewModel', () => {
  let model: TestModel;
  let vm: TestActiveViewModel;

  beforeEach(() => {
    model = new TestModel();
    vm = new TestActiveViewModel(model);
  });

  describe('initial state', () => {
    it('should start as inactive', () => {
      expect(vm.isActive).toBe(false);
    });

    it('should emit false initially on isActive$', async () => {
      const value = await firstValueFrom(vm.isActive$);
      expect(value).toBe(false);
    });
  });

  describe('isActive setter', () => {
    it('should update isActive value', () => {
      vm.isActive = true;
      expect(vm.isActive).toBe(true);
    });

    it('should emit on isActive$', async () => {
      const valuesPromise = vm.isActive$.pipe(take(2), toArray()).toPromise();

      vm.isActive = true;

      const values = await valuesPromise;
      expect(values).toEqual([false, true]);
    });

    it('should not emit duplicate values', async () => {
      const emissions: boolean[] = [];
      vm.isActive$.subscribe(v => emissions.push(v));

      vm.isActive = true;
      vm.isActive = true; // Same value

      expect(emissions).toEqual([false, true]);
    });

    it('should call onIsActiveChanged', () => {
      vm.isActive = true;

      expect(vm.activeChangeCalls).toEqual([
        { isActive: true, wasActive: false }
      ]);
    });

    it('should not call onIsActiveChanged for same value', () => {
      vm.isActive = false; // Same as initial

      expect(vm.activeChangeCalls).toEqual([]);
    });
  });

  describe('activate/deactivate', () => {
    it('activate() should set isActive to true', () => {
      vm.activate();
      expect(vm.isActive).toBe(true);
    });

    it('deactivate() should set isActive to false', () => {
      vm.activate();
      vm.deactivate();
      expect(vm.isActive).toBe(false);
    });
  });

  describe('dispose', () => {
    it('should complete isActive$', async () => {
      const completeSpy = vi.fn();
      vm.isActive$.subscribe({ complete: completeSpy });

      vm.dispose();

      expect(completeSpy).toHaveBeenCalled();
    });
  });

  describe('isActiveAware type guard', () => {
    it('should return true for ActiveAwareViewModel', () => {
      expect(isActiveAware(vm)).toBe(true);
    });

    it('should return false for plain object', () => {
      expect(isActiveAware({})).toBe(false);
    });
  });
});
```

### Step 6: Update Package Index

Update `packages/mvvm-patterns/src/index.ts`:

```typescript
export * from './interactions';
export * from './lifecycle';
export * from './viewmodels';
```

---

## Acceptance Criteria

- [ ] `IActiveAware` interface defined
- [ ] `isActiveAware()` type guard implemented
- [ ] `ActiveAwareViewModel` base class implemented
- [ ] `isActive` getter/setter working
- [ ] `isActive$` observable emitting correctly
- [ ] `onIsActiveChanged()` hook called on changes
- [ ] `activate()`/`deactivate()` convenience methods
- [ ] Unit tests pass
- [ ] Exported from package index

---

## Framework Integration Examples

### React Hook

```typescript
import { useEffect } from 'react';
import { IActiveAware } from '@anthropic/mvvm-patterns';

/**
 * Hook that manages active state based on component mount
 * and browser visibility.
 */
export function useActiveAware(viewModel: IActiveAware) {
  useEffect(() => {
    // Activate when mounted
    viewModel.isActive = true;

    // Handle browser tab visibility
    const handleVisibility = () => {
      viewModel.isActive = document.visibilityState === 'visible';
    };

    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      viewModel.isActive = false;
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [viewModel]);
}

// Usage
function MyComponent() {
  const vm = useViewModel(() => new MyActiveViewModel(model));
  useActiveAware(vm);

  return <div>...</div>;
}
```

### Tab Component Integration

```typescript
function TabPanel({ vm, isSelected }: { vm: IActiveAware; isSelected: boolean }) {
  useEffect(() => {
    vm.isActive = isSelected;
  }, [vm, isSelected]);

  return <div>...</div>;
}
```

---

## Integration with CompositeCommand

When `monitorCommandActivity` is true, CompositeCommand can filter by active state:

```typescript
class CompositeCommand {
  async execute(param: TParam): Promise<TResult> {
    const commandsToExecute = this.monitorCommandActivity
      ? Array.from(this.commands).filter(cmd => {
          // Only execute if command's owner is active
          return !isActiveAware(cmd) || cmd.isActive;
        })
      : Array.from(this.commands);

    return Promise.all(commandsToExecute.map(cmd => cmd.execute(param)));
  }
}
```

---

## Dependencies

- `@anthropic/mvvm-core`: `BaseViewModel`, `BaseModel`
- RxJS: `Observable`, `BehaviorSubject`
