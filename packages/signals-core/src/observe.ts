import type { ReadonlySignal } from './signal.js';

/**
 * Subscribe to a signal with an immediate initial call.
 *
 * Bridges the gap with emit-on-subscribe reactive sources (e.g. RxJS
 * BehaviorSubject): `fn` is invoked synchronously with the current value
 * (via peek(), so no dependency is tracked), then on every subsequent change.
 *
 * @returns An unsubscribe function.
 */
export function observe<T>(sig: ReadonlySignal<T>, fn: (value: T) => void): () => void {
  fn(sig.peek());
  return sig.subscribe(fn);
}
