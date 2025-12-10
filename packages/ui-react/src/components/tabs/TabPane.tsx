import type { HTMLAttributes, ReactNode } from 'react';

export interface TabPaneProps extends HTMLAttributes<HTMLDivElement> {
  /** Unique key for the tab pane */
  tabKey: string;
  /** Tab label/title */
  tab: ReactNode;
  /** Whether the tab is disabled */
  disabled?: boolean;
  /** Whether the tab is closable (only for editable-card type) */
  closable?: boolean;
  /** Tab pane content */
  children?: ReactNode;
}

/**
 * TabPane component for individual tab content.
 * Must be used as a child of Tabs component.
 */
export function TabPane({ children, ...rest }: TabPaneProps) {
  return <>{children}</>;
}
