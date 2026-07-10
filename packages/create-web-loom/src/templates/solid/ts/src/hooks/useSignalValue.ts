import { createSignal, onCleanup } from 'solid-js';
import { observe, type ReadonlySignal } from '@web-loom/signals-core';

export function useSignalValue<T>(source: ReadonlySignal<T>) {
  const [value, setValue] = createSignal(source.peek());
  const stop = observe(source, (next) => {
    setValue(() => next);
  });
  onCleanup(stop);

  return value;
}
