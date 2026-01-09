/**
 * Layout Component
 *
 * Main container component with flex layout
 */

import { type CSSProperties, type ReactNode, useState, useMemo, Children } from 'react';
import { cn } from '../../utils/cn';
import { LayoutContext } from './LayoutContext';
import styles from './Layout.module.css';

export interface LayoutProps {
  /**
   * Layout content
   */
  children?: ReactNode;

  /**
   * Custom class name
   */
  className?: string;

  /**
   * Custom style
   */
  style?: CSSProperties;

  /**
   * Layout direction
   * @default 'vertical'
   */
  direction?: 'vertical' | 'horizontal';
}

/**
 * Layout Component
 *
 * Main container for page layout with flex display
 *
 * @example
 * ```tsx
 * <Layout>
 *   <Layout.Header>Header</Layout.Header>
 *   <Layout.Content>Content</Layout.Content>
 *   <Layout.Footer>Footer</Layout.Footer>
 * </Layout>
 * ```
 */
export function Layout({ children, className, style, direction = 'vertical' }: LayoutProps) {
  const [siderCollapsed, setSiderCollapsed] = useState(false);

  // Check if Layout has a Sider child
  const hasSider = useMemo(() => {
    return Children.toArray(children).some((child: any) => {
      return child?.type?.displayName === 'Layout.Sider';
    });
  }, [children]);

  const contextValue = useMemo(
    () => ({
      siderCollapsed,
      setSiderCollapsed,
      siderWidth: 200,
      siderCollapsedWidth: 80,
      hasSider,
    }),
    [siderCollapsed, hasSider]
  );

  const layoutClasses = cn(
    styles.layout,
    styles[`direction-${direction}`],
    {
      [styles.hasSider]: hasSider,
    },
    className
  );

  return (
    <LayoutContext.Provider value={contextValue}>
      <section className={layoutClasses} style={style}>
        {children}
      </section>
    </LayoutContext.Provider>
  );
}
