import { signal, type ReadonlySignal } from './signal.js';

export interface DebouncedSignal<T> extends ReadonlySignal<T> {
  /** Cancel any pending update and stop tracking the source. */
  dispose(): void;
}

/**
 * Derive a signal that follows `source`, but only settles after `ms`
 * milliseconds of quiet — rapid updates coalesce and the trailing value wins.
 *
 * Starts at the source's current value. Call dispose() to clear any pending
 * timer and detach from the source.
 */
export function debouncedSignal<T>(source: ReadonlySignal<T>, ms: number): DebouncedSignal<T> {
  const out = signal(source.peek());
  let timer: ReturnType<typeof setTimeout> | undefined;

  const unsubscribe = source.subscribe((value) => {
    if (timer !== undefined) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = undefined;
      out.set(value);
    }, ms);
  });

  return {
    get: () => out.get(),
    peek: () => out.peek(),
    subscribe: (fn) => out.subscribe(fn),
    dispose: () => {
      if (timer !== undefined) clearTimeout(timer);
      timer = undefined;
      unsubscribe();
    },
  };
}
