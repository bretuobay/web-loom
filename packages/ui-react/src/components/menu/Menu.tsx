import type { HTMLAttributes, ReactNode } from 'react';
import { useState, useCallback, Children, isValidElement, cloneElement } from 'react';
import { cn } from '../../utils/cn';
import { MenuContext, type MenuContextValue } from './MenuContext';
import '../../styles/design-system.css';
import './Menu.css';

export interface MenuProps extends Omit<HTMLAttributes<HTMLUListElement>, 'onSelect'> {
  /** Menu mode */
  mode?: 'vertical' | 'horizontal' | 'inline';
  /** Theme variant */
  theme?: 'light' | 'dark';
  /** Currently selected keys (controlled) */
  selectedKeys?: string[];
  /** Default selected keys (uncontrolled) */
  defaultSelectedKeys?: string[];
  /** Whether inline menu is collapsed */
  inlineCollapsed?: boolean;
  /** Callback when menu item is selected */
  onSelect?: (key: string) => void;
  /** Menu items */
  children?: ReactNode;
}

/**
 * Menu component for navigation and actions.
 * Supports horizontal, vertical, and inline modes with keyboard navigation.
 */
export function Menu({
  className,
  mode = 'vertical',
  theme = 'light',
  selectedKeys: controlledSelectedKeys,
  defaultSelectedKeys = [],
  inlineCollapsed = false,
  onSelect,
  children,
  ...rest
}: MenuProps) {
  const [uncontrolledSelectedKeys, setUncontrolledSelectedKeys] = useState<string[]>(defaultSelectedKeys);

  const isControlled = controlledSelectedKeys !== undefined;
  const selectedKeys = isControlled ? controlledSelectedKeys : uncontrolledSelectedKeys;

  const handleSelect = useCallback(
    (key: string) => {
      if (!isControlled) {
        setUncontrolledSelectedKeys([key]);
      }
      onSelect?.(key);
    },
    [isControlled, onSelect]
  );

  const contextValue: MenuContextValue = {
    mode,
    theme,
    selectedKeys,
    inlineCollapsed,
    onSelect: handleSelect,
    level: 0,
  };

  const menuClasses = cn(
    'loom-menu',
    `loom-menu-${mode}`,
    `loom-menu-${theme}`,
    {
      'loom-menu-inline-collapsed': mode === 'inline' && inlineCollapsed,
    },
    className
  );

  return (
    <MenuContext.Provider value={contextValue}>
      <ul className={menuClasses} role="menu" {...rest}>
        {children}
      </ul>
    </MenuContext.Provider>
  );
}
