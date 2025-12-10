/**
 * Layout Sider Component
 */

import { type CSSProperties, type ReactNode, useState, useEffect } from 'react';
import { cn } from '../../utils/cn';
import { useLayoutContext } from './LayoutContext';
import styles from './Layout.module.css';

export interface SiderProps {
  /**
   * Sider content
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
   * Width when expanded
   * @default 200
   */
  width?: number;

  /**
   * Width when collapsed
   * @default 80
   */
  collapsedWidth?: number;

  /**
   * Whether sider is collapsible
   * @default true
   */
  collapsible?: boolean;

  /**
   * Controlled collapsed state
   */
  collapsed?: boolean;

  /**
   * Callback when collapsed state changes
   */
  onCollapse?: (collapsed: boolean) => void;

  /**
   * Collapse trigger element
   */
  trigger?: ReactNode | null;
}

/**
 * Layout Sider
 *
 * Collapsible sidebar component with smooth transitions
 */
export function Sider({
  children,
  className,
  style,
  width = 200,
  collapsedWidth = 80,
  collapsible = true,
  collapsed: controlledCollapsed,
  onCollapse,
  trigger,
}: SiderProps) {
  const { siderCollapsed, setSiderCollapsed } = useLayoutContext();

  // Use controlled or internal state
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const isCollapsed = controlledCollapsed !== undefined ? controlledCollapsed : (collapsible ? siderCollapsed : false);

  // Sync with layout context
  useEffect(() => {
    if (controlledCollapsed !== undefined) {
      setSiderCollapsed(controlledCollapsed);
    }
  }, [controlledCollapsed, setSiderCollapsed]);

  const handleToggle = () => {
    const newCollapsed = !isCollapsed;

    if (controlledCollapsed === undefined) {
      setInternalCollapsed(newCollapsed);
      setSiderCollapsed(newCollapsed);
    }

    onCollapse?.(newCollapsed);
  };

  const siderClasses = cn(
    styles.sider,
    {
      [styles.collapsed]: isCollapsed,
      [styles.collapsible]: collapsible,
    },
    className
  );

  const siderStyle: CSSProperties = {
    flex: `0 0 ${isCollapsed ? collapsedWidth : width}px`,
    maxWidth: `${isCollapsed ? collapsedWidth : width}px`,
    minWidth: `${isCollapsed ? collapsedWidth : width}px`,
    width: `${isCollapsed ? collapsedWidth : width}px`,
    ...style,
  };

  const defaultTrigger = trigger === undefined && collapsible ? (
    <button
      type="button"
      className={styles.trigger}
      onClick={handleToggle}
      aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      aria-expanded={!isCollapsed}
    >
      <span className={styles.triggerIcon}>{isCollapsed ? '→' : '←'}</span>
    </button>
  ) : trigger;

  return (
    <aside className={siderClasses} style={siderStyle} role="navigation" aria-label="Sidebar navigation">
      <div className={styles.siderContent}>{children}</div>
      {defaultTrigger && <div className={styles.triggerWrapper}>{defaultTrigger}</div>}
    </aside>
  );
}

Sider.displayName = 'Layout.Sider';
