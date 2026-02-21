import { trackDep } from './effect-context.js';
import { isBatching, scheduleBatchedCall } from './batch.js';

export type SignalSubscriber<T> = (value: T) => void;
// Internal subscriber signature – callers may ignore the value argument
type Sub = (value: unknown) => void;

export class Signal<T> {
  private _value: T;
  private _subscribers = new Set<Sub>();

  constructor(initialValue: T) {
    this._value = initialValue;
  }

  get value(): T {
    trackDep(this);
    return this._value;
  }

  set value(next: T) {
    if (Object.is(this._value, next)) return;
    this._value = next;
    this._notify();
  }

  peek(): T {
    return this._value;
  }

  subscribe(subscriber: SignalSubscriber<T>): () => void {
    const sub = subscriber as Sub;
    this._subscribers.add(sub);
    return () => this._subscribers.delete(sub);
  }

  /** @internal */
  _addSub(sub: Sub): void {
    this._subscribers.add(sub);
  }

  /** @internal */
  _removeSub(sub: Sub): void {
    this._subscribers.delete(sub);
  }

  private _notify(): void {
    // Snapshot before iterating – avoids infinite loops when subscribers
    // remove and re-add themselves (e.g. Computed._boundInvalidate).
    const snapshot = [...this._subscribers];
    for (const sub of snapshot) {
      if (isBatching()) {
        scheduleBatchedCall(sub, this._value);
      } else {
        sub(this._value);
      }
    }
  }
}

export function signal<T>(initialValue: T): Signal<T> {
  return new Signal(initialValue);
}
