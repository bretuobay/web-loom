import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../utils/cn';
import { useMenuContext } from './MenuContext';

export interface MenuItemGroupProps extends Omit<HTMLAttributes<HTMLLIElement>, 'title'> {
  /** Group title/label */
  title?: ReactNode;
  /** Group items */
  children?: ReactNode;
}

/**
 * MenuItemGroup component for grouping related menu items.
 */
export function MenuItemGroup({ className, title, children, ...rest }: MenuItemGroupProps) {
  const { inlineCollapsed } = useMenuContext();

  return (
    <li className={cn('loom-menu-item-group', className)} role="group" {...rest}>
      {title && !inlineCollapsed && <div className="loom-menu-item-group-title">{title}</div>}
      <ul className="loom-menu-item-group-list" role="none">
        {children}
      </ul>
    </li>
  );
}
