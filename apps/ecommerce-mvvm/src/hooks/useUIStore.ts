import { useSyncExternalStore } from 'react';
import { uiStore, type UIState } from '../infrastructure/store/ui-store';

export function useUIStore<T>(selector: (state: UIState) => T): T {
  return useSyncExternalStore(
    (onStoreChange) => {
      return uiStore.subscribe(() => {
        onStoreChange();
      });
    },
    () => selector(uiStore.getState()),
    () => selector(uiStore.getState()),
  );
}
