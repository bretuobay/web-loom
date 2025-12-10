import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../utils/cn';
import { useMenuContext } from './MenuContext';

export interface MenuItemProps extends HTMLAttributes<HTMLLIElement> {
  /** Unique key for the menu item */
  itemKey: string;
  /** Whether the item is disabled */
  disabled?: boolean;
  /** Icon to display before the label */
  icon?: ReactNode;
  /** Item label */
  children?: ReactNode;
}

/**
 * MenuItem component for individual menu items.
 */
export function MenuItem({
  className,
  itemKey,
  disabled = false,
  icon,
  children,
  onClick,
  ...rest
}: MenuItemProps) {
  const { selectedKeys, onSelect, theme, inlineCollapsed } = useMenuContext();

  const isSelected = selectedKeys.includes(itemKey);

  const handleClick = (event: React.MouseEvent<HTMLLIElement>) => {
    if (disabled) {
      event.preventDefault();
      return;
    }

    onSelect?.(itemKey);
    onClick?.(event);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLLIElement>) => {
    if (disabled) return;

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect?.(itemKey);
    }
  };

  const itemClasses = cn(
    'loom-menu-item',
    {
      'loom-menu-item-selected': isSelected,
      'loom-menu-item-disabled': disabled,
      [`loom-menu-item-${theme}`]: theme,
    },
    className
  );

  return (
    <li
      className={itemClasses}
      role="menuitem"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      aria-selected={isSelected}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      {...rest}
    >
      {icon && <span className="loom-menu-item-icon">{icon}</span>}
      {!inlineCollapsed && <span className="loom-menu-item-label">{children}</span>}
    </li>
  );
}
