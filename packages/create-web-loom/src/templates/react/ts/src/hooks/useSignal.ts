import { useSyncExternalStore } from 'react';
import type { ReadonlySignal } from '@web-loom/signals-core';

export function useSignal<T>(source: ReadonlySignal<T>): T {
  return useSyncExternalStore(source.subscribe, source.get, source.get);
}
