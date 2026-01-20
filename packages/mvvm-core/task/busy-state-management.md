# Task: Busy State Management

**Priority**: P2 (Medium Impact, Low Effort)
**Status**: Not Started
**Estimated Files**: 1-2 new files
**Breaking Changes**: None (additive feature)

---

## Overview

Implement centralized busy state management for ViewModels that tracks multiple concurrent operations. This provides:
- Stacked busy states (multiple operations can be in progress)
- Busy reasons for debugging/UI feedback
- Convenient `executeBusy()` helper for async operations
- Integration with loading indicators

## Web Relevance Assessment

**Highly relevant for web development:**
- Loading spinners that show during any async operation
- Disabling UI during multiple concurrent operations
- Progress indicators with operation descriptions
- Preventing duplicate submissions
- Coordinating loading states across components

**Current gap**: Commands have `isExecuting$` but no centralized busy state. Multiple operations running simultaneously need coordinated tracking.

## Implementation Steps

### Step 1: Create BusyState Interface

Create `src/state/BusyState.ts`:

```typescript
import { Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Information about a single busy operation
 */
export interface BusyOperation {
  readonly id: string;
  readonly reason: string;
  readonly startTime: Date;
}

/**
 * Manages stacked busy states for multiple concurrent operations
 */
export class BusyState {
  private readonly operations: Map<string, BusyOperation> = new Map();
  private readonly _operations$ = new BehaviorSubject<BusyOperation[]>([]);
  private operationCounter = 0;

  /**
   * Observable of all currently active operations
   */
  public readonly operations$: Observable<BusyOperation[]> =
    this._operations$.asObservable();

  /**
   * Observable indicating if any operation is in progress
   */
  public readonly isBusy$: Observable<boolean> = this._operations$.pipe(
    map(ops => ops.length > 0)
  );

  /**
   * Observable of current busy reasons
   */
  public readonly busyReasons$: Observable<string[]> = this._operations$.pipe(
    map(ops => ops.map(op => op.reason))
  );

  /**
   * Observable of the most recent busy reason (for single indicator UI)
   */
  public readonly currentReason$: Observable<string | null> = this._operations$.pipe(
    map(ops => ops.length > 0 ? ops[ops.length - 1].reason : null)
  );

  /**
   * Check if currently busy (synchronous)
   */
  get isBusy(): boolean {
    return this.operations.size > 0;
  }

  /**
   * Get current operation count
   */
  get operationCount(): number {
    return this.operations.size;
  }

  /**
   * Mark as busy with a reason. Returns a function to clear this busy state.
   * @param reason Description of the operation
   * @returns Function to call when operation completes
   */
  setBusy(reason: string = 'Loading'): () => void {
    const id = `op_${++this.operationCounter}_${Date.now()}`;
    const operation: BusyOperation = {
      id,
      reason,
      startTime: new Date()
    };

    this.operations.set(id, operation);
    this.emitOperations();

    // Return cleanup function
    return () => {
      this.operations.delete(id);
      this.emitOperations();
    };
  }

  /**
   * Execute an async operation with automatic busy state management
   * @param operation The async operation to execute
   * @param reason Description of the operation
   * @returns The result of the operation
   */
  async executeBusy<T>(
    operation: () => Promise<T>,
    reason: string = 'Loading'
  ): Promise<T> {
    const clearBusy = this.setBusy(reason);

    try {
      return await operation();
    } finally {
      clearBusy();
    }
  }

  /**
   * Clear all busy states
   */
  clearAll(): void {
    this.operations.clear();
    this.emitOperations();
  }

  /**
   * Clean up
   */
  dispose(): void {
    this._operations$.complete();
    this.operations.clear();
  }

  private emitOperations(): void {
    this._operations$.next(Array.from(this.operations.values()));
  }
}
```

### Step 2: Add BusyState to BaseViewModel

Modify `src/viewmodels/BaseViewModel.ts` to include optional BusyState:

```typescript
export class BaseViewModel<TModel extends BaseModel<any, any>> {
  // ... existing code ...

  protected readonly busyState = new BusyState();

  /**
   * Observable indicating if the ViewModel is busy
   */
  public readonly isBusy$: Observable<boolean> = this.busyState.isBusy$;

  /**
   * Execute an async operation with automatic busy state management
   */
  protected async executeBusy<T>(
    operation: () => Promise<T>,
    reason: string = 'Loading'
  ): Promise<T> {
    return this.busyState.executeBusy(operation, reason);
  }

  /**
   * Mark as busy. Returns function to clear busy state.
   */
  protected setBusy(reason: string = 'Loading'): () => void {
    return this.busyState.setBusy(reason);
  }

  public dispose(): void {
    this.busyState.dispose();
    // ... existing disposal ...
  }
}
```

**Note**: This is additive - existing code continues to work.

### Step 3: Create BusyAware Mixin (Alternative)

For ViewModels that can't extend BaseViewModel, provide a mixin:

```typescript
import { BusyState } from '../state/BusyState';

type Constructor<T = {}> = new (...args: any[]) => T;

export function withBusyState<TBase extends Constructor>(Base: TBase) {
  return class extends Base {
    protected readonly busyState = new BusyState();

    get isBusy$() {
      return this.busyState.isBusy$;
    }

    protected async executeBusy<T>(
      operation: () => Promise<T>,
      reason: string = 'Loading'
    ): Promise<T> {
      return this.busyState.executeBusy(operation, reason);
    }

    protected setBusy(reason: string = 'Loading'): () => void {
      return this.busyState.setBusy(reason);
    }
  };
}
```

### Step 4: Add Tests

Create `src/state/BusyState.test.ts`:

1. **setBusy tests:**
   - Returns cleanup function
   - isBusy becomes true
   - Calling cleanup function clears busy
   - Multiple setBusy calls stack correctly

2. **isBusy$ tests:**
   - Initial value is false
   - Emits true when setBusy called
   - Emits false when all operations complete

3. **operations$ tests:**
   - Emits array of operations
   - Operations have correct reason and startTime

4. **busyReasons$ tests:**
   - Returns array of reasons
   - Updates when operations change

5. **executeBusy tests:**
   - Sets busy before operation
   - Clears busy after success
   - Clears busy after error
   - Returns operation result

6. **Stacked operations tests:**
   - Multiple concurrent operations tracked
   - isBusy remains true until all complete
   - Operations complete in any order

7. **clearAll tests:**
   - Clears all operations
   - isBusy becomes false

### Step 5: Add Example

Create or update `src/examples/busy-state-example.ts`:

```typescript
class DataDashboardViewModel extends BaseViewModel<DashboardModel> {
  public readonly loadAllCommand = new Command(async () => {
    // Multiple concurrent operations
    await Promise.all([
      this.executeBusy(() => this.loadUsers(), 'Loading users...'),
      this.executeBusy(() => this.loadOrders(), 'Loading orders...'),
      this.executeBusy(() => this.loadAnalytics(), 'Loading analytics...')
    ]);
  });

  public readonly saveCommand = new Command(async () => {
    const clearBusy = this.setBusy('Saving changes...');

    try {
      await this.model.save();
    } finally {
      clearBusy();
    }
  });

  // In View:
  // <LoadingOverlay visible$={vm.isBusy$} reason$={vm.busyState.currentReason$} />
}
```

### Step 6: Export from Index

Update `src/index.ts`:

```typescript
export { BusyState } from './state/BusyState';
export type { BusyOperation } from './state/BusyState';
```

---

## Acceptance Criteria

- [ ] `BusyState` class implemented with stacked operations
- [ ] `setBusy()` returns cleanup function
- [ ] `executeBusy()` wraps async operations
- [ ] `isBusy$` observable works correctly
- [ ] `operations$` tracks all active operations
- [ ] `busyReasons$` and `currentReason$` observables
- [ ] Multiple concurrent operations handled correctly
- [ ] `clearAll()` method works
- [ ] `dispose()` cleans up
- [ ] Unit tests for all functionality
- [ ] Example demonstrating usage
- [ ] BaseViewModel integration (optional/additive)
- [ ] Exported from package index

---

## Integration Considerations

### With Commands

Commands already have `isExecuting$`. BusyState provides ViewModel-level aggregation:

```typescript
// Command-level: single operation
this.loadCommand.isExecuting$.subscribe(...)

// ViewModel-level: all operations
this.isBusy$.subscribe(...)
```

### With isLoading$ from Model

BaseViewModel exposes `isLoading$` from model. BusyState tracks ViewModel operations:

```typescript
// Model loading state (data fetching)
this.isLoading$

// ViewModel busy state (all operations including UI-only work)
this.isBusy$
```

Consider creating a combined observable if needed:
```typescript
this.showSpinner$ = combineLatest([this.isLoading$, this.isBusy$]).pipe(
  map(([loading, busy]) => loading || busy)
);
```

---

## Dependencies

- RxJS `BehaviorSubject`, `Observable`, `map`
- Optional: BaseViewModel for integration

---

## Breaking Changes

**None** - Purely additive:
- New standalone class
- Optional BaseViewModel enhancement
- No changes to existing APIs
