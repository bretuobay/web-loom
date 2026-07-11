import { useSyncExternalStore } from 'react';
import type { ReadonlySignal } from '@web-loom/signals-core';

/**
 * Bind a Web Loom signal to React. Reads the current value synchronously
 * (no initial-value parameter, no first-render flash) and re-renders on
 * every change via useSyncExternalStore.
 */
export function useSignal<T>(sig: ReadonlySignal<T>): T {
  return useSyncExternalStore(sig.subscribe, sig.get, sig.get);
}
