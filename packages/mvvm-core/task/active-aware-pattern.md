# Task: Active Awareness Pattern

**Priority**: P2 (Medium Impact, Low Effort)
**Status**: Not Started
**Estimated Files**: 2-3 new files
**Breaking Changes**: None (additive feature)

---

## Overview

Implement `IActiveAware` interface and `ActiveAwareViewModel` base class that tracks whether a ViewModel/Command is currently "active" (e.g., visible tab, selected region). This enables:
- Pausing/resuming updates based on visibility
- Conditional command execution in CompositeCommand
- Resource optimization for inactive views

## Web Relevance Assessment

**Relevant for web development:**
- Tab-based interfaces where inactive tabs don't need real-time updates
- Dashboard panels that pause polling when minimized
- Multi-view layouts where only active view processes events
- Performance optimization by suspending inactive ViewModels
- CompositeCommand executing only on active views

**Common use cases:**
- Browser tab visibility (Page Visibility API integration)
- Application tabs/panels
- Collapsible sections
- Modal overlay (background becomes inactive)

## Implementation Steps

### Step 1: Create IActiveAware Interface

Create `src/lifecycle/IActiveAware.ts`:

```typescript
import { Observable } from 'rxjs';

/**
 * Interface for objects that need to know if they are currently active.
 * "Active" typically means visible and receiving user interaction.
 */
export interface IActiveAware {
  /**
   * Gets or sets whether the object is currently active
   */
  isActive: boolean;

  /**
   * Observable that emits when active state changes
   */
  readonly isActive$: Observable<boolean>;
}

/**
 * Type guard to check if an object implements IActiveAware
 */
export function isActiveAware(obj: any): obj is IActiveAware {
  return (
    obj &&
    typeof obj.isActive === 'boolean' &&
    obj.isActive$ &&
    typeof obj.isActive$.subscribe === 'function'
  );
}
```

### Step 2: Create ActiveAwareViewModel Base Class

Create `src/viewmodels/ActiveAwareViewModel.ts`:

```typescript
import { BehaviorSubject, Observable } from 'rxjs';
import { BaseViewModel } from './BaseViewModel';
import { BaseModel } from '../models/BaseModel';
import { IActiveAware } from '../lifecycle/IActiveAware';

/**
 * Base ViewModel that implements IActiveAware.
 * Extend this class for ViewModels that need to respond to active state changes.
 */
export abstract class ActiveAwareViewModel<TModel extends BaseModel<any, any>>
  extends BaseViewModel<TModel>
  implements IActiveAware {

  private readonly _isActive$ = new BehaviorSubject<boolean>(false);

  /**
   * Observable that emits when active state changes
   */
  public readonly isActive$: Observable<boolean> = this._isActive$.asObservable();

  /**
   * Gets the current active state
   */
  get isActive(): boolean {
    return this._isActive$.value;
  }

  /**
   * Sets the active state. Override onIsActiveChanged() to react to changes.
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
   */
  protected onIsActiveChanged(isActive: boolean, wasActive: boolean): void {
    // Default: no-op. Override in derived classes.
  }

  /**
   * Activates the ViewModel
   */
  activate(): void {
    this.isActive = true;
  }

  /**
   * Deactivates the ViewModel
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

### Step 3: Create Active Aware Mixin (Alternative to Inheritance)

Create `src/mixins/withActiveAware.ts`:

```typescript
import { BehaviorSubject, Observable } from 'rxjs';
import { IActiveAware } from '../lifecycle/IActiveAware';

type Constructor<T = {}> = new (...args: any[]) => T;

/**
 * Mixin that adds IActiveAware functionality to any class.
 * Use when you can't extend ActiveAwareViewModel.
 */
export function withActiveAware<TBase extends Constructor>(Base: TBase) {
  return class extends Base implements IActiveAware {
    private readonly _isActiveMixin$ = new BehaviorSubject<boolean>(false);

    get isActive$(): Observable<boolean> {
      return this._isActiveMixin$.asObservable();
    }

    get isActive(): boolean {
      return this._isActiveMixin$.value;
    }

    set isActive(value: boolean) {
      if (this._isActiveMixin$.value !== value) {
        this._isActiveMixin$.next(value);
      }
    }
  };
}
```

### Step 4: Create useActiveAware Helper for React

Document integration pattern (not in mvvm-core, but as documentation):

```typescript
// Example: React hook for active awareness
function useActiveAware(viewModel: IActiveAware) {
  useEffect(() => {
    // Set active when component mounts
    viewModel.isActive = true;

    // Handle page visibility changes
    const handleVisibilityChange = () => {
      viewModel.isActive = document.visibilityState === 'visible';
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      viewModel.isActive = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [viewModel]);
}
```

### Step 5: Add Tests

Create `src/viewmodels/ActiveAwareViewModel.test.ts`:

1. **isActive state tests:**
   - Initial state is false
   - Setting isActive to true updates state
   - Setting isActive to same value doesn't trigger change

2. **isActive$ observable tests:**
   - Emits on state changes
   - New subscribers get current value

3. **onIsActiveChanged callback tests:**
   - Called when isActive changes
   - Receives correct old and new values
   - Not called when value doesn't change

4. **activate()/deactivate() tests:**
   - activate() sets isActive to true
   - deactivate() sets isActive to false

5. **Disposal tests:**
   - dispose() completes isActive$
   - Calls parent dispose()

6. **Type guard tests:**
   - isActiveAware returns true for implementing objects
   - isActiveAware returns false for non-implementing objects

### Step 6: Integration with CompositeCommand

Document how CompositeCommand uses IActiveAware:

```typescript
// When monitorCommandActivity is true, CompositeCommand only executes
// commands from active ViewModels

class CompositeCommand {
  async execute(param: TParam): Promise<TResult> {
    const commandsToExecute = this.monitorCommandActivity
      ? Array.from(this.commands).filter(cmd => {
          // If command's owner implements IActiveAware, check isActive
          // This requires commands to have reference to their ViewModel
          // or implement IActiveAware themselves
          return !isActiveAware(cmd) || cmd.isActive;
        })
      : Array.from(this.commands);

    // Execute filtered commands
    return Promise.all(commandsToExecute.map(cmd => cmd.execute(param)));
  }
}
```

### Step 7: Add Example

Create `src/examples/active-aware-example.ts`:

```typescript
class TabPanelViewModel
  extends ActiveAwareViewModel<TabModel>
  implements IActiveAware {

  private pollingSubscription?: Subscription;

  protected override onIsActiveChanged(isActive: boolean): void {
    if (isActive) {
      // Tab became active: start polling for updates
      this.startPolling();
    } else {
      // Tab became inactive: stop polling to save resources
      this.stopPolling();
    }
  }

  private startPolling(): void {
    this.pollingSubscription = interval(5000)
      .pipe(takeUntil(this._destroy$))
      .subscribe(() => this.refreshData());
  }

  private stopPolling(): void {
    this.pollingSubscription?.unsubscribe();
  }
}
```

### Step 8: Export from Index

Update `src/lifecycle/index.ts`:

```typescript
export * from './IActiveAware';
```

Update `src/viewmodels/index.ts` (if exists) or `src/index.ts`:

```typescript
export { ActiveAwareViewModel } from './viewmodels/ActiveAwareViewModel';
```

---

## Acceptance Criteria

- [ ] `IActiveAware` interface defined
- [ ] `isActiveAware()` type guard implemented
- [ ] `ActiveAwareViewModel` base class implemented
- [ ] `isActive` getter/setter working
- [ ] `isActive$` observable working
- [ ] `onIsActiveChanged()` hook working
- [ ] `activate()`/`deactivate()` convenience methods
- [ ] `withActiveAware` mixin (optional)
- [ ] Unit tests for all functionality
- [ ] Example demonstrating usage
- [ ] Documentation for framework integration
- [ ] Exported from package index

---

## Dependencies

- Existing `BaseViewModel`
- RxJS `BehaviorSubject`

---

## Breaking Changes

**None** - Additive feature:
- New interface
- New optional base class
- Existing ViewModels unchanged
