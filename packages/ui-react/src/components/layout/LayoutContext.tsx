/**
 * Layout Context
 *
 * Provides layout state across all layout subcomponents
 */

import { createContext, useContext } from 'react';

export interface LayoutContextValue {
  /** Whether the sider is collapsed */
  siderCollapsed: boolean;
  /** Set sider collapsed state */
  setSiderCollapsed: (collapsed: boolean) => void;
  /** Sider width when expanded */
  siderWidth: number;
  /** Sider width when collapsed */
  siderCollapsedWidth: number;
  /** Whether sider is present */
  hasSider: boolean;
}

export const LayoutContext = createContext<LayoutContextValue>({
  siderCollapsed: false,
  setSiderCollapsed: () => {},
  siderWidth: 200,
  siderCollapsedWidth: 80,
  hasSider: false,
});

export function useLayoutContext() {
  return useContext(LayoutContext);
}
