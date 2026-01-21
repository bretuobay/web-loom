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

/**
 * Extends DirtyTracker with per-field dirty tracking.
 * Useful for highlighting which specific fields have changed.
 *
 * @template T Object type with fields to track
 */
export class FieldDirtyTracker<T extends Record<string, any>>
  extends DirtyTracker<T> {

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
    const allKeys = new Set([
      ...Object.keys(initial),
      ...Object.keys(current)
    ]) as Set<keyof T>;

    allKeys.forEach(key => {
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
    return this.isDirty$.pipe(
      map(() => this.getDirtyFields())
    );
  }

  /**
   * Get changes as a partial object (only changed fields)
   */
  getChanges(): Partial<T> {
    const dirtyFields = this.getDirtyFields();
    const current = this.getCurrentValue();

    if (!current) return {};

    const changes: Partial<T> = {};
    dirtyFields.forEach(field => {
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
