import { observe, type ReadonlySignal } from '@web-loom/signals-core';

/**
 * Read a signal's current value as a Promise for initial SSR rendering.
 * This allows us to use Marko's <await> tag for progressive rendering.
 */
export function observableToPromise<T>(sig: ReadonlySignal<T>): Promise<T> {
  return Promise.resolve(sig.peek());
}

/**
 * Subscribe to a signal and update a Marko state variable.
 * Returns cleanup function for effect.
 *
 * With skipFirst = false (default) the current value is delivered
 * immediately, mirroring the previous BehaviorSubject behavior.
 */
export function subscribeToObservable<T>(sig: ReadonlySignal<T>, updateFn: (value: T) => void, skipFirst = false) {
  if (skipFirst) {
    return sig.subscribe(updateFn);
  }
  return observe(sig, updateFn);
}
