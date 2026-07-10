import { createSignal, onCleanup } from 'solid-js';
import { observe } from '@web-loom/signals-core';

export function useSignalValue(source) {
  const [value, setValue] = createSignal(source.peek());
  const stop = observe(source, (next) => {
    setValue(() => next);
  });
  onCleanup(stop);

  return value;
}
