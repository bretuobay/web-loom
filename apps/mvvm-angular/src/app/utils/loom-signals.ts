import { signal, type Signal, DestroyRef, inject } from '@angular/core';
import type { ReadonlySignal } from '@web-loom/signals-core';

/**
 * Bridge a Web Loom signal (from @web-loom/signals-core) to a native Angular
 * signal. Reads the current value synchronously and mirrors every change;
 * the subscription is torn down with the injector's DestroyRef.
 *
 * Must be called in an injection context (constructor / field initializer)
 * unless a DestroyRef is passed explicitly.
 */
export function fromLoomSignal<T>(source: ReadonlySignal<T>, destroyRef?: DestroyRef): Signal<T> {
  const mirror = signal<T>(source.peek());
  const unsubscribe = source.subscribe((value) => mirror.set(value));
  (destroyRef ?? inject(DestroyRef)).onDestroy(unsubscribe);
  return mirror.asReadonly();
}
