import type { HTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

export interface MenuDividerProps extends HTMLAttributes<HTMLLIElement> {}

/**
 * MenuDivider component for visual separation between menu items.
 */
export function MenuDivider({ className, ...rest }: MenuDividerProps) {
  return <li className={cn('loom-menu-divider', className)} role="separator" {...rest} />;
}
