import { createSignal, onCleanup, type Accessor } from 'solid-js';
import { observe, type ReadonlySignal } from '@web-loom/signals-core';

/**
 * Mirror a Web Loom signal into a Solid accessor.
 *
 * `@web-loom/signals-core` and Solid each have their own reactive graph.
 * Calling `sig.get()` inside `createMemo` / JSX does *not* subscribe Solid
 * to loom updates — tracking only works inside loom `computed`/`effect`
 * contexts. This hook is the boundary: `observe()` copies the current value
 * (subscribe-only would skip it) and every later change into a Solid signal,
 * so `<Show>`, `<For>`, and `createMemo` can track the view as usual.
 *
 * The setter wraps `next` in a thunk so array/object values are stored as
 * values, not mistaken for Solid updater functions.
 */
export function useSignal<T>(source: ReadonlySignal<T>): Accessor<T> {
  const [value, setValue] = createSignal(source.peek());
  const stop = observe(source, (next) => {
    setValue(() => next);
  });
  onCleanup(stop);
  return value;
}
