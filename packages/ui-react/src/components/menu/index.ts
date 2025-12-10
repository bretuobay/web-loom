import { Menu as MenuComponent } from './Menu';
import { MenuItem } from './MenuItem';
import { SubMenu } from './SubMenu';
import { MenuDivider } from './MenuDivider';
import { MenuItemGroup } from './MenuItemGroup';

// Compound component pattern
export const Menu = Object.assign(MenuComponent, {
  Item: MenuItem,
  SubMenu: SubMenu,
  Divider: MenuDivider,
  ItemGroup: MenuItemGroup,
});

// Export types
export type { MenuProps } from './Menu';
export type { MenuItemProps } from './MenuItem';
export type { SubMenuProps } from './SubMenu';
export type { MenuDividerProps } from './MenuDivider';
export type { MenuItemGroupProps } from './MenuItemGroup';
