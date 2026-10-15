import { useCallback, useSyncExternalStore } from 'react';
import type { ReadonlySignal } from '@web-loom/signals-core';

export function useSignal<T>(source: ReadonlySignal<T>): T {
  // Wrap the methods so `this` stays bound — signal() and computed() are class instances.
  const subscribe = useCallback((onStoreChange: () => void) => source.subscribe(onStoreChange), [source]);
  const getSnapshot = useCallback(() => source.get(), [source]);
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
