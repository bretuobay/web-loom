import { type Trackable, trackDep, getCurrentEffect, setCurrentEffect } from './effect-context.js';
import { type Equals, type ReadonlySignal } from './signal.js';

export interface ComputedOptions<T> {
  /** Custom equality check for the derived value. Defaults to Object.is. */
  equals?: Equals<T>;
  debugName?: string;
}

/** Type alias for a derived, read-only signal returned by computed(). */
export type Computed<T> = ReadonlySignal<T>;

class ComputedImpl<T> implements ReadonlySignal<T>, Trackable {
  private _value!: T;
  private _dirty = true;
  private _initialized = false;
  private _deps = new Set<Trackable>();
  private _subs = new Set<() => void>();
  private readonly _equals: Equals<T>;
  private readonly _boundInvalidate: () => void;

  constructor(
    private readonly _compute: () => T,
    options?: ComputedOptions<T>,
  ) {
    this._equals = options?.equals ?? Object.is;
    this._boundInvalidate = () => this._invalidate();
  }

  get(): T {
    trackDep(this);
    if (this._dirty) this._recompute();
    return this._value;
  }

  peek(): T {
    if (this._dirty) this._recompute();
    return this._value;
  }

  subscribe(fn: () => void): () => void {
    // Eagerly compute so we're subscribed to deps before any change arrives.
    if (this._dirty) this._recompute();
    this._subs.add(fn);
    return () => this._subs.delete(fn);
  }

  /** @internal */
  _addSub(fn: () => void): void {
    if (this._dirty) this._recompute();
    this._subs.add(fn);
  }

  /** @internal */
  _removeSub(fn: () => void): void {
    this._subs.delete(fn);
  }

  private _recompute(): void {
    // Unsubscribe from all stale deps — will re-collect dynamically.
    for (const dep of this._deps) dep._removeSub(this._boundInvalidate);
    this._deps.clear();

    const saved = getCurrentEffect();
    setCurrentEffect({
      addDependency: (dep: Trackable) => {
        this._deps.add(dep);
        dep._addSub(this._boundInvalidate);
      },
    });

    let newValue: T;
    try {
      newValue = this._compute();
    } finally {
      setCurrentEffect(saved);
    }

    this._dirty = false;

    // On first compute, always store. After that, apply equals check:
    // if the derived value hasn't changed, keep the old reference — this
    // prevents further propagation in chained computed chains.
    if (!this._initialized || !this._equals(this._value, newValue!)) {
      this._value = newValue!;
      this._initialized = true;
    }
  }

  private _invalidate(): void {
    if (this._dirty) return;
    this._dirty = true;
    // Stay lazy: don't recompute here. Notify subscribers that we're dirty
    // so effects can schedule a rerun; they'll pull the value on next get().
    for (const sub of [...this._subs]) sub();
  }
}

export function computed<T>(derive: () => T, options?: ComputedOptions<T>): Computed<T> {
  return new ComputedImpl(derive, options);
}
