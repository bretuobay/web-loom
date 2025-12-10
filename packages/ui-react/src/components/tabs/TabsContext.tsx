import { createContext, useContext } from 'react';

export interface TabsContextValue {
  activeKey: string;
  type: 'line' | 'card' | 'editable-card';
  size: 'large' | 'middle' | 'small';
  tabPosition: 'top' | 'right' | 'bottom' | 'left';
  onTabClick: (key: string) => void;
  onEdit?: (targetKey: string, action: 'add' | 'remove') => void;
}

export const TabsContext = createContext<TabsContextValue | null>(null);

export function useTabsContext() {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('Tab components must be used within Tabs');
  }
  return context;
}
