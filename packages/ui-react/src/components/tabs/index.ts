import { Tabs as TabsBase } from './Tabs';
import { TabPane } from './TabPane';

/**
 * Tabs component with compound pattern exports
 *
 * @example
 * ```tsx
 * <Tabs defaultActiveKey="1">
 *   <Tabs.TabPane tabKey="1" tab="Tab 1">
 *     Content 1
 *   </Tabs.TabPane>
 *   <Tabs.TabPane tabKey="2" tab="Tab 2">
 *     Content 2
 *   </Tabs.TabPane>
 * </Tabs>
 * ```
 */
export const Tabs = Object.assign(TabsBase, {
  TabPane,
});

export { TabPane };
export type { TabsProps } from './Tabs';
export type { TabPaneProps } from './TabPane';
