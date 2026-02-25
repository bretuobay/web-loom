import { createStore, LocalStorageAdapter } from '@web-loom/store-core';

export type ThemeMode = 'light' | 'dark';

export interface UIState {
  theme: ThemeMode;
  cartOpen: boolean;
  paletteOpen: boolean;
  searchOpen: boolean;
}

export const uiStore = createStore(
  {
    theme: 'light' as ThemeMode,
    cartOpen: false,
    paletteOpen: false,
    searchOpen: true,
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
    openCart: () =>
      set((state) => ({
        ...state,
        cartOpen: true,
      })),
    closeCart: () =>
      set((state) => ({
        ...state,
        cartOpen: false,
      })),
    toggleCart: () =>
      set((state) => ({
        ...state,
        cartOpen: !state.cartOpen,
      })),
    openPalette: () =>
      set((state) => ({
        ...state,
        paletteOpen: true,
      })),
    closePalette: () =>
      set((state) => ({
        ...state,
        paletteOpen: false,
      })),
    setSearchOpen: (searchOpen: boolean) =>
      set((state) => ({
        ...state,
        searchOpen,
      })),
  }),
  {
    key: 'ecommerce-mvvm:ui',
    adapter: new LocalStorageAdapter<UIState>(),
    merge: true,
  },
);
