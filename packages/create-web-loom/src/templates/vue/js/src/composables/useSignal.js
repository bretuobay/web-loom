import { onUnmounted, shallowRef } from 'vue';
import { observe } from '@web-loom/signals-core';

export function useSignal(source) {
  const value = shallowRef(source.peek());
  const stop = observe(source, (next) => {
    value.value = next;
  });
  onUnmounted(stop);

  return value;
}
