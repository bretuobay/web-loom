# Task: Busy State Management

**Target Package**: `packages/mvvm-core`
**Priority**: P2 (Medium Impact, Low Effort)
**Status**: Not Started
**Estimated Files**: 2 new files
**Breaking Changes**: None (additive feature)

---

## Overview

Implement centralized busy state management for ViewModels that tracks multiple concurrent operations. This provides:
- Stacked busy states (multiple operations can be in progress)
- Busy reasons for debugging/UI feedback
- Convenient `executeBusy()` helper for async operations

## Target Location

```
packages/mvvm-core/src/
├── state/
│   ├── BusyState.ts        (NEW)
│   └── BusyState.test.ts   (NEW)
├── viewmodels/
│   └── BaseViewModel.ts    (OPTIONAL: add convenience methods)
└── index.ts                (update exports)
```

## Web Use Cases

- Loading spinners during multiple concurrent API calls
- Disabling UI during operations
- Progress indicators with operation descriptions
- Preventing duplicate form submissions

## Implementation Steps

### Step 1: Create BusyState Class

Create `src/state/BusyState.ts`:

```typescript
import { Observable, BehaviorSubject } from 'rxjs';
import { map, distinctUntilChanged } from 'rxjs/operators';
import { IDisposable } from '../models/BaseModel';

/**
 * Information about a single busy operation
 */
export interface BusyOperation {
  readonly id: string;
  readonly reason: string;
  readonly startTime: Date;
}

/**
 * Manages stacked busy states for multiple concurrent operations.
 * Useful for tracking loading states across multiple async operations.
 */
export class BusyState implements IDisposable {
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
    map(ops => ops.length > 0),
    distinctUntilChanged()
  );

  /**
   * Observable of current busy reasons (for UI display)
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
   *
   * @param reason Description of the operation (for debugging/UI)
   * @returns Cleanup function - call when operation completes
   *
   * @example
   * const clearBusy = busyState.setBusy('Saving data...');
   * try {
   *   await saveData();
   * } finally {
   *   clearBusy();
   * }
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
    let cleared = false;
    return () => {
      if (cleared) return; // Prevent double-clear
      cleared = true;
      this.operations.delete(id);
      this.emitOperations();
    };
  }

  /**
   * Execute an async operation with automatic busy state management.
   *
   * @param operation The async operation to execute
   * @param reason Description of the operation
   * @returns The result of the operation
   *
   * @example
   * const data = await busyState.executeBusy(
   *   () => fetchData(),
   *   'Loading data...'
   * );
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
   * Clear all busy states (use with caution)
   */
  clearAll(): void {
    this.operations.clear();
    this.emitOperations();
  }

  /**
   * Clean up resources
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

### Step 2: Add Tests

Create `src/state/BusyState.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { firstValueFrom } from 'rxjs';
import { take, toArray } from 'rxjs/operators';
import { BusyState } from './BusyState';

describe('BusyState', () => {
  let busyState: BusyState;

  beforeEach(() => {
    busyState = new BusyState();
  });

  describe('setBusy', () => {
    it('should return a cleanup function', () => {
      const clearBusy = busyState.setBusy('Test');
      expect(typeof clearBusy).toBe('function');
      clearBusy();
    });

    it('should set isBusy to true', async () => {
      busyState.setBusy('Test');
      const isBusy = await firstValueFrom(busyState.isBusy$);
      expect(isBusy).toBe(true);
    });

    it('should clear busy state when cleanup is called', async () => {
      const clearBusy = busyState.setBusy('Test');
      clearBusy();
      const isBusy = await firstValueFrom(busyState.isBusy$);
      expect(isBusy).toBe(false);
    });

    it('should handle multiple concurrent operations', async () => {
      const clear1 = busyState.setBusy('Op 1');
      const clear2 = busyState.setBusy('Op 2');

      expect(busyState.operationCount).toBe(2);

      clear1();
      expect(busyState.operationCount).toBe(1);
      expect(busyState.isBusy).toBe(true);

      clear2();
      expect(busyState.operationCount).toBe(0);
      expect(busyState.isBusy).toBe(false);
    });

    it('should not double-clear', () => {
      const clearBusy = busyState.setBusy('Test');
      clearBusy();
      clearBusy(); // Second call should be no-op
      expect(busyState.operationCount).toBe(0);
    });
  });

  describe('executeBusy', () => {
    it('should set busy during operation', async () => {
      let wasBusy = false;

      await busyState.executeBusy(async () => {
        wasBusy = busyState.isBusy;
      }, 'Test');

      expect(wasBusy).toBe(true);
      expect(busyState.isBusy).toBe(false);
    });

    it('should return operation result', async () => {
      const result = await busyState.executeBusy(
        async () => 'result',
        'Test'
      );
      expect(result).toBe('result');
    });

    it('should clear busy even on error', async () => {
      await expect(
        busyState.executeBusy(async () => {
          throw new Error('Test error');
        }, 'Test')
      ).rejects.toThrow('Test error');

      expect(busyState.isBusy).toBe(false);
    });
  });

  describe('isBusy$', () => {
    it('should emit false initially', async () => {
      const isBusy = await firstValueFrom(busyState.isBusy$);
      expect(isBusy).toBe(false);
    });

    it('should emit true when busy', async () => {
      busyState.setBusy('Test');
      const isBusy = await firstValueFrom(busyState.isBusy$);
      expect(isBusy).toBe(true);
    });
  });

  describe('operations$', () => {
    it('should emit operation details', async () => {
      busyState.setBusy('Loading users');
      const operations = await firstValueFrom(busyState.operations$);

      expect(operations).toHaveLength(1);
      expect(operations[0].reason).toBe('Loading users');
      expect(operations[0].startTime).toBeInstanceOf(Date);
    });
  });

  describe('busyReasons$', () => {
    it('should emit array of reasons', async () => {
      busyState.setBusy('Op 1');
      busyState.setBusy('Op 2');

      const reasons = await firstValueFrom(busyState.busyReasons$);
      expect(reasons).toEqual(['Op 1', 'Op 2']);
    });
  });

  describe('currentReason$', () => {
    it('should emit most recent reason', async () => {
      busyState.setBusy('First');
      busyState.setBusy('Second');

      const reason = await firstValueFrom(busyState.currentReason$);
      expect(reason).toBe('Second');
    });

    it('should emit null when not busy', async () => {
      const reason = await firstValueFrom(busyState.currentReason$);
      expect(reason).toBeNull();
    });
  });

  describe('clearAll', () => {
    it('should clear all operations', () => {
      busyState.setBusy('Op 1');
      busyState.setBusy('Op 2');

      busyState.clearAll();

      expect(busyState.isBusy).toBe(false);
      expect(busyState.operationCount).toBe(0);
    });
  });

  describe('dispose', () => {
    it('should complete observables', async () => {
      const completeSpy = vi.fn();
      busyState.isBusy$.subscribe({ complete: completeSpy });

      busyState.dispose();

      expect(completeSpy).toHaveBeenCalled();
    });
  });
});
```

### Step 3: Export from Index

Update `src/index.ts`:

```typescript
// ... existing exports ...

export { BusyState } from './state/BusyState';
export type { BusyOperation } from './state/BusyState';
```

### Step 4: Create State Directory

```bash
mkdir -p packages/mvvm-core/src/state
```

### Step 5: Add Example

Create `src/examples/busy-state-example.ts`:

```typescript
import { BusyState, BaseViewModel, BaseModel, Command } from '../index';

class DataDashboardViewModel extends BaseViewModel<BaseModel<any, any>> {
  // Centralized busy state for this ViewModel
  public readonly busyState = new BusyState();

  // Expose isBusy$ for view binding
  public readonly isBusy$ = this.busyState.isBusy$;
  public readonly loadingReason$ = this.busyState.currentReason$;

  // Commands that use busy state
  public readonly loadAllCommand = new Command(async () => {
    // Multiple concurrent operations
    await Promise.all([
      this.busyState.executeBusy(
        () => this.loadUsers(),
        'Loading users...'
      ),
      this.busyState.executeBusy(
        () => this.loadOrders(),
        'Loading orders...'
      ),
      this.busyState.executeBusy(
        () => this.loadAnalytics(),
        'Loading analytics...'
      ),
    ]);
  });

  public readonly saveCommand = new Command(async () => {
    // Manual busy state management
    const clearBusy = this.busyState.setBusy('Saving changes...');
    try {
      await this.saveChanges();
    } finally {
      clearBusy();
    }
  });

  private async loadUsers(): Promise<void> {
    await new Promise(r => setTimeout(r, 1000));
  }

  private async loadOrders(): Promise<void> {
    await new Promise(r => setTimeout(r, 1500));
  }

  private async loadAnalytics(): Promise<void> {
    await new Promise(r => setTimeout(r, 800));
  }

  private async saveChanges(): Promise<void> {
    await new Promise(r => setTimeout(r, 500));
  }

  public override dispose(): void {
    this.busyState.dispose();
    super.dispose();
  }
}

// View usage:
// <LoadingOverlay visible$={vm.isBusy$} message$={vm.loadingReason$} />
// <button disabled$={vm.isBusy$} onClick={() => vm.loadAllCommand.execute()}>
//   Refresh All
// </button>
```

---

## Acceptance Criteria

- [ ] `BusyState` class created with stacked operations support
- [ ] `setBusy()` returns cleanup function
- [ ] `executeBusy()` wraps async operations
- [ ] `isBusy$` observable emits correct state
- [ ] `operations$` tracks all active operations with details
- [ ] `busyReasons$` and `currentReason$` observables work
- [ ] Multiple concurrent operations handled correctly
- [ ] `clearAll()` method works
- [ ] `dispose()` cleans up
- [ ] Unit tests pass
- [ ] Example demonstrating usage
- [ ] Exported from package index

---

## Optional Enhancement

Add convenience methods to BaseViewModel (non-breaking):

```typescript
// In BaseViewModel - OPTIONAL
protected readonly busyState = new BusyState();
public readonly isBusy$ = this.busyState.isBusy$;

protected executeBusy<T>(op: () => Promise<T>, reason?: string): Promise<T> {
  return this.busyState.executeBusy(op, reason);
}
```

---

## Dependencies

- RxJS: `Observable`, `BehaviorSubject`, `map`, `distinctUntilChanged`
- `IDisposable` interface from BaseModel
