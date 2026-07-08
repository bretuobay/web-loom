import { trackDep, type Trackable } from './effect-context.js';
import { isBatching, scheduleBatchedCall } from './batch.js';

export type Equals<T> = (a: T, b: T) => boolean;

export interface SignalOptions<T> {
  /** Custom equality check. Defaults to Object.is. */
  equals?: Equals<T>;
  debugName?: string;
}

export interface ReadonlySignal<T> {
  /** Read the current value. Tracked inside computed/effect contexts. */
  get(): T;
  /** Read without tracking — never establishes a dependency. */
  peek(): T;
  /**
   * Subscribe to change notifications. The listener receives the current
   * value at notification time (zero-argument callbacks remain valid).
   * Returns an unsubscribe function.
   */
  subscribe(fn: (value: T) => void): () => void;
}

export interface WritableSignal<T> extends ReadonlySignal<T> {
  /** Set a new value. No-op if equals(prev, next) returns true. */
  set(next: T): void;
  /** Update the value using the previous value. */
  update(fn: (prev: T) => T): void;
  /** Returns a read-only view — hides set/update from consumers. */
  asReadonly(): ReadonlySignal<T>;
}

class SignalImpl<T> implements WritableSignal<T>, Trackable {
  private _value: T;
  private readonly _equals: Equals<T>;
  private _subs = new Set<() => void>();

  constructor(initialValue: T, options?: SignalOptions<T>) {
    this._value = initialValue;
    this._equals = options?.equals ?? Object.is;
  }

  get(): T {
    trackDep(this);
    return this._value;
  }

  peek(): T {
    return this._value;
  }

  set(next: T): void {
    if (this._equals(this._value, next)) return;
    this._value = next;
    this._notify();
  }

  update(fn: (prev: T) => T): void {
    this.set(fn(this._value));
  }

  asReadonly(): ReadonlySignal<T> {
    return {
      get: () => this.get(),
      peek: () => this.peek(),
      subscribe: (fn) => this.subscribe(fn),
    };
  }

  subscribe(fn: (value: T) => void): () => void {
    // Stable wrapper: reads the value at call time (correct under batching,
    // where notification is deferred to flush) and keeps Set-based dedupe
    // working since the same wrapper is scheduled for repeated notifies.
    const wrapped = () => fn(this._value);
    this._subs.add(wrapped);
    return () => this._subs.delete(wrapped);
  }

  /** @internal */
  _addSub(fn: () => void): void {
    this._subs.add(fn);
  }

  /** @internal */
  _removeSub(fn: () => void): void {
    this._subs.delete(fn);
  }

  private _notify(): void {
    for (const sub of [...this._subs]) {
      if (isBatching()) {
        scheduleBatchedCall(sub);
      } else {
        sub();
      }
    }
  }
}

export function signal<T>(initial: T, options?: SignalOptions<T>): WritableSignal<T> {
  return new SignalImpl(initial, options);
}
