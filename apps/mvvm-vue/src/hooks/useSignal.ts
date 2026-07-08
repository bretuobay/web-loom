import { shallowRef, onUnmounted, type ShallowRef } from 'vue';
import { observe, type ReadonlySignal } from '@web-loom/signals-core';

/**
 * Bind a Web Loom signal to Vue reactivity. Seeds the ref with the current
 * value (observe delivers immediately) and mirrors every change; the
 * subscription is torn down on component unmount.
 */
export function useSignal<T>(sig: ReadonlySignal<T>): ShallowRef<T> {
  const value = shallowRef<T>(sig.peek());
  const unsubscribe = observe(sig, (next) => {
    value.value = next;
  });
  onUnmounted(unsubscribe);
  return value;
}
