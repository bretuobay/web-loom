import { useCallback, useSyncExternalStore } from 'react';

export function useSignal(source) {
  // Wrap the methods so `this` stays bound — signal() and computed() are class instances.
  const subscribe = useCallback((onStoreChange) => source.subscribe(onStoreChange), [source]);
  const getSnapshot = useCallback(() => source.get(), [source]);
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
