import { createStore, LocalStorageAdapter } from '@web-loom/store-core/persist';

export type ThemeMode = 'light' | 'dark';

export interface UIState {
  theme: ThemeMode;
}

export const uiStore = createStore(
  {
    theme: 'light' as ThemeMode,
  },
  (set) => ({
    setTheme: (theme: ThemeMode) =>
      set((state) => ({
        ...state,
        theme,
      })),
    toggleTheme: () =>
      set((state) => ({
        ...state,
        theme: state.theme === 'light' ? 'dark' : 'light',
      })),
  }),
  {
    key: 'ecommerce-template-core:preferences',
    adapter: new LocalStorageAdapter<UIState>(),
    merge: true,
  },
);
