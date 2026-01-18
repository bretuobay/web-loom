import type { HTMLAttributes, ReactNode } from 'react';
import { useState } from 'react';
import { cn } from '../../utils/cn';
import { useMenuContext, MenuContext, type MenuContextValue } from './MenuContext';

export interface SubMenuProps extends Omit<HTMLAttributes<HTMLLIElement>, 'title'> {
  /** Unique key for the submenu */
  itemKey: string;
  /** Title/label for the submenu */
  title: ReactNode;
  /** Icon to display before the title */
  icon?: ReactNode;
  /** Whether the submenu is disabled */
  disabled?: boolean;
  /** Submenu items */
  children?: ReactNode;
}

/**
 * SubMenu component for nested menu items.
 */
export function SubMenu({ className, itemKey, title, icon, disabled = false, children, ...rest }: SubMenuProps) {
  const parentContext = useMenuContext();
  const [isOpen, setIsOpen] = useState(false);

  const handleTitleClick = () => {
    if (disabled) return;
    setIsOpen(!isOpen);
  };

  const handleTitleKeyDown = (event: React.KeyboardEvent) => {
    if (disabled) return;

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setIsOpen(!isOpen);
    } else if (event.key === 'ArrowRight' && !isOpen) {
      event.preventDefault();
      setIsOpen(true);
    } else if (event.key === 'ArrowLeft' && isOpen) {
      event.preventDefault();
      setIsOpen(false);
    }
  };

  const submenuClasses = cn(
    'loom-menu-submenu',
    {
      'loom-menu-submenu-open': isOpen,
      'loom-menu-submenu-disabled': disabled,
    },
    className,
  );

  const childContext: MenuContextValue = {
    ...parentContext,
    level: parentContext.level + 1,
  };

  return (
    <li className={submenuClasses} {...rest}>
      <div
        className="loom-menu-submenu-title"
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        aria-expanded={isOpen}
        onClick={handleTitleClick}
        onKeyDown={handleTitleKeyDown}
      >
        {icon && <span className="loom-menu-item-icon">{icon}</span>}
        {!parentContext.inlineCollapsed && (
          <>
            <span className="loom-menu-submenu-title-text">{title}</span>
            <span className={cn('loom-menu-submenu-arrow', { 'loom-menu-submenu-arrow-open': isOpen })}>
              {parentContext.mode === 'horizontal' ? '▼' : '▸'}
            </span>
          </>
        )}
      </div>
      {isOpen && (
        <MenuContext.Provider value={childContext}>
          <ul className="loom-menu-submenu-popup" role="menu">
            {children}
          </ul>
        </MenuContext.Provider>
      )}
    </li>
  );
}
