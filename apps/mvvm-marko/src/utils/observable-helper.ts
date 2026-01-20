import type { Observable, Subscription } from 'rxjs';

/**
 * Subscribes to an observable while automatically logging errors for easier debugging.
 * Returns the underlying subscription so callers can clean it up.
 */
export function safeSubscribe<T>(observable: Observable<T>, next: (value: T) => void): Subscription {
  return observable.subscribe({
    next,
    error: (error) => {
      console.error('[observable-helper] subscription error', error);
    },
  });
}
