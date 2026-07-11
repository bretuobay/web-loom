import { useSyncExternalStore } from 'react';

export function useSignal(source) {
  return useSyncExternalStore(source.subscribe, source.get, source.get);
}
