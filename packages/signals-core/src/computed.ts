import { Signal } from './signal.js';
import { getCurrentEffect, setCurrentEffect, trackDep } from './effect-context.js';

type Sub<T> = (value: T) => void;

export class Computed<T> {
  private _value!: T;
  private _dirty = true;
  private _deps = new Set<Signal<unknown>>();
  private _subscribers = new Set<Sub<T>>();
  // Stored as a property so Signal can hold a reference to it without capturing `this`
  private readonly _boundInvalidate: () => void;

  constructor(private readonly _compute: () => T) {
    this._boundInvalidate = () => this._invalidate();
  }

  get value(): T {
    // Register this computed as a dependency of the outer consumer (effect / computed)
    trackDep(this);
    if (this._dirty) {
      this._recompute();
    }
    return this._value;
  }

  peek(): T {
    if (this._dirty) {
      this._recompute();
    }
    return this._value;
  }

  subscribe(subscriber: Sub<T>): () => void {
    // Eagerly compute so we subscribe to our signal deps before any change arrives
    if (this._dirty) {
      this._recompute();
    }
    this._subscribers.add(subscriber);
    return () => this._subscribers.delete(subscriber);
  }

  /** @internal – used by Effect when it tracks this computed as a dependency */
  _addSub(sub: (value: unknown) => void): void {
    if (this._dirty) {
      this._recompute();
    }
    this._subscribers.add(sub as Sub<T>);
  }

  /** @internal */
  _removeSub(sub: (value: unknown) => void): void {
    this._subscribers.delete(sub as Sub<T>);
  }

  private _recompute(): void {
    // Unsubscribe from stale deps
    for (const dep of this._deps) {
      dep._removeSub(this._boundInvalidate as (value: unknown) => void);
    }
    this._deps.clear();

    // Save and replace active effect so nested computeds / effects are not confused
    const savedEffect = getCurrentEffect();

    setCurrentEffect({
      addDependency: (dep: unknown) => {
        const sig = dep as Signal<unknown>;
        this._deps.add(sig);
        sig._addSub(this._boundInvalidate as (value: unknown) => void);
      },
      invalidate: () => this._invalidate(),
    });

    try {
      this._value = this._compute();
    } finally {
      setCurrentEffect(savedEffect);
    }

    this._dirty = false;
  }

  private _invalidate(): void {
    if (this._dirty) return;
    this._dirty = true;
    // Eagerly recompute so subscribers receive the new value immediately
    const next = this.peek();
    // Snapshot to avoid issues if a subscriber mutates the subscriber set
    for (const sub of [...this._subscribers]) {
      sub(next);
    }
  }
}

export function computed<T>(fn: () => T): Computed<T> {
  return new Computed(fn);
}
