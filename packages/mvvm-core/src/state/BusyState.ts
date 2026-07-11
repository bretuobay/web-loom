import { signal, computed, type ReadonlySignal } from '@web-loom/signals-core';
import type { IDisposable } from '../models/BaseModel';

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
 *
 * @example
 * ```typescript
 * const busyState = new BusyState();
 *
 * // Manual busy state management
 * const clearBusy = busyState.setBusy('Loading data...');
 * try {
 *   await fetchData();
 * } finally {
 *   clearBusy();
 * }
 *
 * // Automatic busy state management
 * const data = await busyState.executeBusy(
 *   () => fetchData(),
 *   'Loading data...'
 * );
 * ```
 */
export class BusyState implements IDisposable {
  private readonly operations: Map<string, BusyOperation> = new Map();
  private readonly _operations = signal<BusyOperation[]>([]);
  private operationCounter = 0;
  private _isDisposed = false;

  /**
   * Reactive list of all currently active operations
   */
  public readonly operations$: ReadonlySignal<BusyOperation[]> = this._operations.asReadonly();

  /**
   * Reactive flag indicating if any operation is in progress
   */
  public readonly isBusy$: ReadonlySignal<boolean> = computed(() => this._operations.get().length > 0);

  /**
   * Reactive list of current busy reasons (for UI display)
   */
  public readonly busyReasons$: ReadonlySignal<string[]> = computed(() =>
    this._operations.get().map((op) => op.reason),
  );

  /**
   * Reactive most recent busy reason (for single indicator UI)
   */
  public readonly currentReason$: ReadonlySignal<string | null> = computed(() => {
    const ops = this._operations.get();
    return ops.length > 0 ? ops[ops.length - 1].reason : null;
  });

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
   * ```typescript
   * const clearBusy = busyState.setBusy('Saving data...');
   * try {
   *   await saveData();
   * } finally {
   *   clearBusy();
   * }
   * ```
   */
  setBusy(reason: string = 'Loading'): () => void {
    const id = `op_${++this.operationCounter}_${Date.now()}`;
    const operation: BusyOperation = {
      id,
      reason,
      startTime: new Date(),
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
   * ```typescript
   * const data = await busyState.executeBusy(
   *   () => fetchData(),
   *   'Loading data...'
   * );
   * ```
   */
  async executeBusy<T>(operation: () => Promise<T>, reason: string = 'Loading'): Promise<T> {
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
    this._isDisposed = true;
    this.operations.clear();
  }

  private emitOperations(): void {
    if (this._isDisposed) return;
    this._operations.set(Array.from(this.operations.values()));
  }
}
