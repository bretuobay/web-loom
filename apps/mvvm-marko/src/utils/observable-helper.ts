import { observe, type ReadonlySignal } from '@web-loom/signals-core';

/**
 * Observes a signal while automatically logging errors thrown by the handler
 * for easier debugging. Delivers the current value immediately, then every
 * change. Returns an unsubscribe function so callers can clean it up.
 */
export function safeSubscribe<T>(sig: ReadonlySignal<T>, next: (value: T) => void): () => void {
  return observe(sig, (value) => {
    try {
      next(value);
    } catch (error) {
      console.error('[observable-helper] subscription error', error);
    }
  });
}
