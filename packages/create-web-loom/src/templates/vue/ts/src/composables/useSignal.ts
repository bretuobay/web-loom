import { onUnmounted, shallowRef, type ShallowRef } from 'vue';
import { observe, type ReadonlySignal } from '@web-loom/signals-core';

export function useSignal<T>(source: ReadonlySignal<T>): ShallowRef<T> {
  const value = shallowRef<T>(source.peek());
  const stop = observe(source, (next) => {
    value.value = next;
  });
  onUnmounted(stop);

  return value;
}
