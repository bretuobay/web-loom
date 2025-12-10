import { createContext, useContext } from 'react';

export interface MenuContextValue {
  mode: 'vertical' | 'horizontal' | 'inline';
  theme: 'light' | 'dark';
  selectedKeys: string[];
  inlineCollapsed: boolean;
  onSelect?: (key: string) => void;
  level: number;
}

export const MenuContext = createContext<MenuContextValue | null>(null);

export function useMenuContext() {
  const context = useContext(MenuContext);
  if (!context) {
    throw new Error('Menu components must be used within a Menu');
  }
  return context;
}
