# Menu Component

A versatile navigation menu component with support for horizontal/vertical/inline modes, nested submenus, keyboard navigation, and accessibility features.

## Features

- 📐 Multiple modes: vertical, horizontal, inline
- 🎨 Light and dark themes
- ⌨️ Full keyboard navigation support
- 🔽 Nested submenus with expand/collapse
- 📱 Responsive design
- ♿ WCAG 2.1 AA compliant
- 🎯 Controlled and uncontrolled modes
- 💾 Selection state management
- 📦 Compound component pattern
- 🌙 Dark theme support

## Installation

```bash
npm install @web-loom/ui-react
```

## Basic Usage

```tsx
import { Menu } from '@web-loom/ui-react';

function App() {
  return (
    <Menu>
      <Menu.Item itemKey="home" icon="🏠">
        Home
      </Menu.Item>
      <Menu.Item itemKey="dashboard" icon="📊">
        Dashboard
      </Menu.Item>
      <Menu.Item itemKey="settings" icon="⚙️">
        Settings
      </Menu.Item>
    </Menu>
  );
}
```

## API Reference

### Menu

Main menu container component.

| Prop                  | Type                                     | Default      | Description                          |
| --------------------- | ---------------------------------------- | ------------ | ------------------------------------ |
| `mode`                | `'vertical' \| 'horizontal' \| 'inline'` | `'vertical'` | Menu orientation                     |
| `theme`               | `'light' \| 'dark'`                      | `'light'`    | Color theme                          |
| `selectedKeys`        | `string[]`                               | -            | Selected menu keys (controlled)      |
| `defaultSelectedKeys` | `string[]`                               | `[]`         | Default selected keys (uncontrolled) |
| `inlineCollapsed`     | `boolean`                                | `false`      | Collapse inline menu to icons only   |
| `onSelect`            | `(key: string) => void`                  | -            | Selection change callback            |

### Menu.Item

Individual menu item.

| Prop       | Type        | Default      | Description                    |
| ---------- | ----------- | ------------ | ------------------------------ |
| `itemKey`  | `string`    | **required** | Unique identifier for the item |
| `icon`     | `ReactNode` | -            | Icon to display before label   |
| `disabled` | `boolean`   | `false`      | Whether item is disabled       |

### Menu.SubMenu

Submenu with nested items.

| Prop       | Type        | Default      | Description                   |
| ---------- | ----------- | ------------ | ----------------------------- |
| `itemKey`  | `string`    | **required** | Unique identifier for submenu |
| `title`    | `ReactNode` | **required** | Submenu title/label           |
| `icon`     | `ReactNode` | -            | Icon to display before title  |
| `disabled` | `boolean`   | `false`      | Whether submenu is disabled   |

### Menu.Divider

Visual separator between menu items.

### Menu.ItemGroup

Group of related menu items with optional title.

| Prop    | Type        | Default | Description       |
| ------- | ----------- | ------- | ----------------- |
| `title` | `ReactNode` | -       | Group title/label |

## Examples

### Vertical Menu (Default)

```tsx
<Menu style={{ width: 256 }}>
  <Menu.Item itemKey="home" icon="🏠">
    Home
  </Menu.Item>
  <Menu.Item itemKey="dashboard" icon="📊">
    Dashboard
  </Menu.Item>
  <Menu.Item itemKey="settings" icon="⚙️">
    Settings
  </Menu.Item>
</Menu>
```

### Horizontal Menu

```tsx
<Menu mode="horizontal">
  <Menu.Item itemKey="home">Home</Menu.Item>
  <Menu.Item itemKey="products">Products</Menu.Item>
  <Menu.Item itemKey="about">About</Menu.Item>
  <Menu.Item itemKey="contact">Contact</Menu.Item>
</Menu>
```

### With Controlled Selection

```tsx
function ControlledMenu() {
  const [selectedKeys, setSelectedKeys] = useState(['home']);

  return (
    <Menu selectedKeys={selectedKeys} onSelect={(key) => setSelectedKeys([key])}>
      <Menu.Item itemKey="home">Home</Menu.Item>
      <Menu.Item itemKey="dashboard">Dashboard</Menu.Item>
    </Menu>
  );
}
```

### With Submenus

```tsx
<Menu style={{ width: 256 }}>
  <Menu.Item itemKey="home" icon="🏠">
    Home
  </Menu.Item>
  <Menu.SubMenu itemKey="products" title="Products" icon="📦">
    <Menu.Item itemKey="electronics">Electronics</Menu.Item>
    <Menu.Item itemKey="clothing">Clothing</Menu.Item>
    <Menu.Item itemKey="books">Books</Menu.Item>
  </Menu.SubMenu>
  <Menu.Item itemKey="contact" icon="📧">
    Contact
  </Menu.Item>
</Menu>
```

### Nested Submenus

```tsx
<Menu style={{ width: 256 }}>
  <Menu.SubMenu itemKey="services" title="Services">
    <Menu.Item itemKey="consulting">Consulting</Menu.Item>
    <Menu.SubMenu itemKey="support" title="Support">
      <Menu.Item itemKey="technical">Technical</Menu.Item>
      <Menu.Item itemKey="customer">Customer</Menu.Item>
    </Menu.SubMenu>
  </Menu.SubMenu>
</Menu>
```

### With Dividers

```tsx
<Menu style={{ width: 256 }}>
  <Menu.Item itemKey="home">Home</Menu.Item>
  <Menu.Item itemKey="dashboard">Dashboard</Menu.Item>
  <Menu.Divider />
  <Menu.Item itemKey="settings">Settings</Menu.Item>
  <Menu.Item itemKey="profile">Profile</Menu.Item>
  <Menu.Divider />
  <Menu.Item itemKey="logout">Logout</Menu.Item>
</Menu>
```

### With Item Groups

```tsx
<Menu style={{ width: 256 }}>
  <Menu.ItemGroup title="Navigation">
    <Menu.Item itemKey="home">Home</Menu.Item>
    <Menu.Item itemKey="dashboard">Dashboard</Menu.Item>
  </Menu.ItemGroup>
  <Menu.ItemGroup title="Account">
    <Menu.Item itemKey="profile">Profile</Menu.Item>
    <Menu.Item itemKey="settings">Settings</Menu.Item>
  </Menu.ItemGroup>
</Menu>
```

### Dark Theme

```tsx
<Menu theme="dark" style={{ width: 256 }}>
  <Menu.Item itemKey="home" icon="🏠">
    Home
  </Menu.Item>
  <Menu.Item itemKey="dashboard" icon="📊">
    Dashboard
  </Menu.Item>
  <Menu.Item itemKey="settings" icon="⚙️">
    Settings
  </Menu.Item>
</Menu>
```

### Collapsible Inline Menu

```tsx
function CollapsibleMenu() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      <button onClick={() => setCollapsed(!collapsed)}>{collapsed ? 'Expand' : 'Collapse'}</button>
      <Menu mode="inline" inlineCollapsed={collapsed}>
        <Menu.Item itemKey="home" icon="🏠">
          Home
        </Menu.Item>
        <Menu.Item itemKey="dashboard" icon="📊">
          Dashboard
        </Menu.Item>
        <Menu.Item itemKey="settings" icon="⚙️">
          Settings
        </Menu.Item>
      </Menu>
    </>
  );
}
```

### Disabled Items

```tsx
<Menu style={{ width: 256 }}>
  <Menu.Item itemKey="home">Home</Menu.Item>
  <Menu.Item itemKey="dashboard" disabled>
    Dashboard (Disabled)
  </Menu.Item>
  <Menu.SubMenu itemKey="products" title="Products" disabled>
    <Menu.Item itemKey="item1">Item 1</Menu.Item>
  </Menu.SubMenu>
</Menu>
```

## Keyboard Navigation

The Menu component supports full keyboard navigation:

- **Enter / Space**: Select menu item or toggle submenu
- **Arrow Right**: Open submenu (in submenus)
- **Arrow Left**: Close submenu (in submenus)
- **Tab**: Move focus between menu items
- **Escape**: Close submenu (planned feature)

## Accessibility

The Menu component follows WAI-ARIA Menu pattern:

- Proper `role="menu"` and `role="menuitem"` attributes
- `aria-selected` for selected items
- `aria-disabled` for disabled items
- `aria-expanded` for submenus
- Keyboard navigation support
- Focus management
- Screen reader announcements

## Styling

The Menu uses CSS custom properties from the design system:

```css
/* Example customization */
.my-menu {
  --color-base-primary: #3b82f6;
  --spacing-2: 8px;
}
```

## TypeScript

Full TypeScript support with exported types:

```tsx
import { Menu, type MenuProps, type MenuItemProps } from '@web-loom/ui-react';

const menuProps: MenuProps = {
  mode: 'vertical',
  theme: 'light',
  onSelect: (key) => console.log(key),
};
```

## Patterns

### Sidebar Navigation

```tsx
<div style={{ display: 'flex' }}>
  <Menu mode="inline" theme="dark" style={{ width: 256 }}>
    <Menu.ItemGroup title="Main">
      <Menu.Item itemKey="overview">Overview</Menu.Item>
      <Menu.Item itemKey="analytics">Analytics</Menu.Item>
    </Menu.ItemGroup>
    <Menu.ItemGroup title="Management">
      <Menu.SubMenu itemKey="users" title="Users">
        <Menu.Item itemKey="all-users">All Users</Menu.Item>
        <Menu.Item itemKey="roles">Roles</Menu.Item>
      </Menu.SubMenu>
    </Menu.ItemGroup>
  </Menu>
  <div>Content Area</div>
</div>
```

### Top Navigation

```tsx
<Menu mode="horizontal">
  <Menu.Item itemKey="home">Home</Menu.Item>
  <Menu.SubMenu itemKey="products" title="Products">
    <Menu.Item itemKey="electronics">Electronics</Menu.Item>
    <Menu.Item itemKey="clothing">Clothing</Menu.Item>
  </Menu.SubMenu>
  <Menu.Item itemKey="about">About</Menu.Item>
</Menu>
```

## Best Practices

1. **Use unique itemKey values**: Each menu item must have a unique key
2. **Provide icons for collapsed menus**: Icons are essential when menu is collapsed
3. **Keep nesting shallow**: Avoid more than 2-3 levels of nesting
4. **Use item groups wisely**: Group related items for better organization
5. **Consider mobile**: Horizontal menus may need special handling on mobile
6. **Controlled vs Uncontrolled**: Use controlled mode when you need external state management

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Related Components

- **Layout** - For page-level structure
- **Divider** - For visual separation
- **Breadcrumb** - For hierarchical navigation

## License

MIT License - Part of the Web Loom UI library.
