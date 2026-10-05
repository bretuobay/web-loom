import { type Trackable, trackDep, getCurrentEffect, setCurrentEffect } from './effect-context.js';
import { type Equals, type ReadonlySignal } from './signal.js';
import { propagate, type Invalidatable } from './batch.js';

export interface ComputedOptions<T> {
  /** Custom equality check for the derived value. Defaults to Object.is. */
  equals?: Equals<T>;
  debugName?: string;
}

/** Type alias for a derived, read-only signal returned by computed(). */
export type Computed<T> = ReadonlySignal<T>;

class ComputedImpl<T> implements ReadonlySignal<T>, Trackable, Invalidatable {
  private _value!: T;
  private _dirty = true;
  private _initialized = false;
  private _deps = new Set<Trackable>();
  private _subs = new Set<() => void>();
  private _dependents = new Set<Invalidatable>();
  private readonly _equals: Equals<T>;

  constructor(
    private readonly _compute: () => T,
    options?: ComputedOptions<T>,
  ) {
    this._equals = options?.equals ?? Object.is;
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

  subscribe(fn: (value: T) => void): () => void {
    // Eagerly compute so we're subscribed to deps before any change arrives.
    if (this._dirty) this._recompute();
    // peek() at call time recomputes if dirty, so value-listeners receive
    // the fresh derived value. Per-subscriber dedupe: only deliver when the
    // derived value actually changed (source changes that recompute to an
    // equal value stay silent, mirroring signal notification semantics).
    let last = this._value;
    const wrapped = () => {
      const next = this.peek();
      if (this._equals(last, next)) return;
      last = next;
      fn(next);
    };
    this._subs.add(wrapped);
    return () => this._subs.delete(wrapped);
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

  /** @internal */
  _addDependent(dependent: Invalidatable): void {
    this._dependents.add(dependent);
  }

  /** @internal */
  _removeDependent(dependent: Invalidatable): void {
    this._dependents.delete(dependent);
  }

  private _recompute(): void {
    // Unsubscribe from all stale deps — will re-collect dynamically.
    for (const dep of this._deps) dep._removeDependent(this);
    this._deps.clear();

    const saved = getCurrentEffect();
    setCurrentEffect({
      addDependency: (dep: Trackable) => {
        this._deps.add(dep);
        dep._addDependent(this);
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

  /** @internal */
  _invalidate(): void {
    if (this._dirty) return;
    this._dirty = true;
    // Stay lazy: don't recompute here. Invalidate dependents and schedule
    // effects/listeners; they'll pull the fresh value on their next get().
    propagate(this._dependents, this._subs);
  }
}

export function computed<T>(derive: () => T, options?: ComputedOptions<T>): Computed<T> {
  return new ComputedImpl(derive, options);
}
