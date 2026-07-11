/**
 * RxJS interop for @web-loom/signals-core.
 *
 * Import from '@web-loom/signals-core/rxjs'. Requires the optional `rxjs`
 * peer dependency — the main entry point stays zero-dependency. Intended for
 * Model-edge orchestration (debounce pipelines, retry/backoff, websockets)
 * where streams are genuinely the better tool.
 */
import { Observable, type Subscription } from 'rxjs';
import { signal, type ReadonlySignal } from './signal.js';
import { observe } from './observe.js';

/**
 * Expose a signal as an RxJS Observable. Mirrors BehaviorSubject semantics:
 * each subscriber immediately receives the current value, then every change.
 */
export function toObservable<T>(sig: ReadonlySignal<T>): Observable<T> {
  return new Observable<T>((subscriber) => observe(sig, (value) => subscriber.next(value)));
}

export interface ObservableBackedSignal<T> extends ReadonlySignal<T> {
  /** Unsubscribe from the source observable. */
  dispose(): void;
}

/**
 * Mirror an RxJS Observable into a signal. Subscribes immediately; the signal
 * holds `initial` until the observable's first emission. Errors are surfaced
 * to the optional onError callback (signals have no error channel).
 */
export function fromObservable<T>(
  source: Observable<T>,
  initial: T,
  onError?: (err: unknown) => void,
): ObservableBackedSignal<T> {
  const out = signal(initial);
  const subscription: Subscription = source.subscribe({
    next: (value) => out.set(value),
    error: (err) => onError?.(err),
  });

  return {
    get: () => out.get(),
    peek: () => out.peek(),
    subscribe: (fn) => out.subscribe(fn),
    dispose: () => subscription.unsubscribe(),
  };
}
