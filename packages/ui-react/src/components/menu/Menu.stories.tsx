import type { Meta, StoryObj } from '@storybook/react';
import { Menu, type MenuProps } from './index';
import { useState } from 'react';

const meta: Meta<MenuProps> = {
  title: 'Components/Menu',
  component: Menu,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    mode: {
      control: 'select',
      options: ['vertical', 'horizontal', 'inline'],
      description: 'Menu mode/orientation',
    },
    theme: {
      control: 'select',
      options: ['light', 'dark'],
      description: 'Menu theme',
    },
    inlineCollapsed: {
      control: 'boolean',
      description: 'Collapse inline menu',
    },
  },
};

export default meta;
type Story = StoryObj<MenuProps>;

/**
 * Default vertical menu
 */
export const Default: Story = {
  render: () => (
    <Menu style={{ width: 256 }}>
      <Menu.Item itemKey="1" icon="🏠">
        Home
      </Menu.Item>
      <Menu.Item itemKey="2" icon="📊">
        Dashboard
      </Menu.Item>
      <Menu.Item itemKey="3" icon="⚙️">
        Settings
      </Menu.Item>
      <Menu.Item itemKey="4" icon="👤">
        Profile
      </Menu.Item>
    </Menu>
  ),
};

/**
 * Horizontal menu (e.g., top navigation)
 */
export const Horizontal: Story = {
  render: () => (
    <Menu mode="horizontal">
      <Menu.Item itemKey="home" icon="🏠">
        Home
      </Menu.Item>
      <Menu.Item itemKey="products" icon="📦">
        Products
      </Menu.Item>
      <Menu.Item itemKey="about" icon="ℹ️">
        About
      </Menu.Item>
      <Menu.Item itemKey="contact" icon="📧">
        Contact
      </Menu.Item>
    </Menu>
  ),
};

/**
 * Menu with controlled selection
 */
export const WithSelection: Story = {
  render: () => {
    const [selectedKeys, setSelectedKeys] = useState(['dashboard']);

    return (
      <div>
        <p style={{ marginBottom: '16px' }}>Selected: {selectedKeys[0]}</p>
        <Menu style={{ width: 256 }} selectedKeys={selectedKeys} onSelect={(key) => setSelectedKeys([key])}>
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
      </div>
    );
  },
};

/**
 * Menu with submenus
 */
export const WithSubMenus: Story = {
  render: () => (
    <Menu style={{ width: 256 }} defaultSelectedKeys={['1']}>
      <Menu.Item itemKey="1" icon="🏠">
        Home
      </Menu.Item>
      <Menu.SubMenu itemKey="sub1" title="Products" icon="📦">
        <Menu.Item itemKey="2">Electronics</Menu.Item>
        <Menu.Item itemKey="3">Clothing</Menu.Item>
        <Menu.Item itemKey="4">Books</Menu.Item>
      </Menu.SubMenu>
      <Menu.SubMenu itemKey="sub2" title="Services" icon="🛠️">
        <Menu.Item itemKey="5">Consulting</Menu.Item>
        <Menu.Item itemKey="6">Development</Menu.Item>
        <Menu.SubMenu itemKey="sub2-1" title="Support">
          <Menu.Item itemKey="7">Technical</Menu.Item>
          <Menu.Item itemKey="8">Customer</Menu.Item>
        </Menu.SubMenu>
      </Menu.SubMenu>
      <Menu.Item itemKey="9" icon="📧">
        Contact
      </Menu.Item>
    </Menu>
  ),
};

/**
 * Horizontal menu with submenus
 */
export const HorizontalWithSubMenus: Story = {
  render: () => (
    <Menu mode="horizontal">
      <Menu.Item itemKey="home" icon="🏠">
        Home
      </Menu.Item>
      <Menu.SubMenu itemKey="products" title="Products" icon="📦">
        <Menu.Item itemKey="electronics">Electronics</Menu.Item>
        <Menu.Item itemKey="clothing">Clothing</Menu.Item>
        <Menu.Item itemKey="books">Books</Menu.Item>
      </Menu.SubMenu>
      <Menu.SubMenu itemKey="services" title="Services" icon="🛠️">
        <Menu.Item itemKey="consulting">Consulting</Menu.Item>
        <Menu.Item itemKey="development">Development</Menu.Item>
      </Menu.SubMenu>
      <Menu.Item itemKey="about" icon="ℹ️">
        About
      </Menu.Item>
    </Menu>
  ),
};

/**
 * Menu with dividers
 */
export const WithDividers: Story = {
  render: () => (
    <Menu style={{ width: 256 }}>
      <Menu.Item itemKey="1" icon="🏠">
        Home
      </Menu.Item>
      <Menu.Item itemKey="2" icon="📊">
        Dashboard
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item itemKey="3" icon="⚙️">
        Settings
      </Menu.Item>
      <Menu.Item itemKey="4" icon="👤">
        Profile
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item itemKey="5" icon="🚪">
        Logout
      </Menu.Item>
    </Menu>
  ),
};

/**
 * Menu with item groups
 */
export const WithItemGroups: Story = {
  render: () => (
    <Menu style={{ width: 256 }}>
      <Menu.ItemGroup title="Navigation">
        <Menu.Item itemKey="home" icon="🏠">
          Home
        </Menu.Item>
        <Menu.Item itemKey="dashboard" icon="📊">
          Dashboard
        </Menu.Item>
      </Menu.ItemGroup>
      <Menu.ItemGroup title="Account">
        <Menu.Item itemKey="profile" icon="👤">
          Profile
        </Menu.Item>
        <Menu.Item itemKey="settings" icon="⚙️">
          Settings
        </Menu.Item>
      </Menu.ItemGroup>
      <Menu.ItemGroup title="Actions">
        <Menu.Item itemKey="logout" icon="🚪">
          Logout
        </Menu.Item>
      </Menu.ItemGroup>
    </Menu>
  ),
};

/**
 * Menu with disabled items
 */
export const WithDisabledItems: Story = {
  render: () => (
    <Menu style={{ width: 256 }}>
      <Menu.Item itemKey="1" icon="🏠">
        Home
      </Menu.Item>
      <Menu.Item itemKey="2" icon="📊" disabled>
        Dashboard (Disabled)
      </Menu.Item>
      <Menu.Item itemKey="3" icon="⚙️">
        Settings
      </Menu.Item>
      <Menu.SubMenu itemKey="sub1" title="Products" disabled icon="📦">
        <Menu.Item itemKey="4">Item 1</Menu.Item>
      </Menu.SubMenu>
    </Menu>
  ),
};

/**
 * Dark theme menu
 */
export const DarkTheme: Story = {
  render: () => (
    <div style={{ padding: '24px', background: '#1f2937' }}>
      <Menu style={{ width: 256 }} theme="dark" defaultSelectedKeys={['dashboard']}>
        <Menu.Item itemKey="home" icon="🏠">
          Home
        </Menu.Item>
        <Menu.Item itemKey="dashboard" icon="📊">
          Dashboard
        </Menu.Item>
        <Menu.SubMenu itemKey="sub1" title="Products" icon="📦">
          <Menu.Item itemKey="electronics">Electronics</Menu.Item>
          <Menu.Item itemKey="clothing">Clothing</Menu.Item>
        </Menu.SubMenu>
        <Menu.Divider />
        <Menu.Item itemKey="settings" icon="⚙️">
          Settings
        </Menu.Item>
      </Menu>
    </div>
  ),
};

/**
 * Inline mode menu
 */
export const InlineMode: Story = {
  render: () => (
    <Menu mode="inline" style={{ width: 256 }} defaultSelectedKeys={['1']}>
      <Menu.Item itemKey="1" icon="🏠">
        Home
      </Menu.Item>
      <Menu.SubMenu itemKey="sub1" title="Products" icon="📦">
        <Menu.Item itemKey="2">Electronics</Menu.Item>
        <Menu.Item itemKey="3">Clothing</Menu.Item>
      </Menu.SubMenu>
      <Menu.Item itemKey="4" icon="⚙️">
        Settings
      </Menu.Item>
    </Menu>
  ),
};

/**
 * Collapsed inline menu (icon only)
 */
export const CollapsedInline: Story = {
  render: () => {
    const [collapsed, setCollapsed] = useState(false);

    return (
      <div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          style={{
            marginBottom: '16px',
            padding: '8px 16px',
            cursor: 'pointer',
          }}
        >
          {collapsed ? 'Expand' : 'Collapse'}
        </button>
        <Menu mode="inline" inlineCollapsed={collapsed} defaultSelectedKeys={['home']}>
          <Menu.Item itemKey="home" icon="🏠">
            Home
          </Menu.Item>
          <Menu.Item itemKey="dashboard" icon="📊">
            Dashboard
          </Menu.Item>
          <Menu.Item itemKey="settings" icon="⚙️">
            Settings
          </Menu.Item>
          <Menu.Item itemKey="profile" icon="👤">
            Profile
          </Menu.Item>
        </Menu>
      </div>
    );
  },
};

/**
 * Sidebar navigation example
 */
export const SidebarNavigation: Story = {
  render: () => {
    const [selectedKey, setSelectedKey] = useState('overview');

    return (
      <div style={{ display: 'flex', height: '500px' }}>
        <Menu
          mode="inline"
          style={{ width: 256, height: '100%' }}
          theme="dark"
          selectedKeys={[selectedKey]}
          onSelect={setSelectedKey}
        >
          <Menu.ItemGroup title="Main">
            <Menu.Item itemKey="overview" icon="📊">
              Overview
            </Menu.Item>
            <Menu.Item itemKey="analytics" icon="📈">
              Analytics
            </Menu.Item>
          </Menu.ItemGroup>

          <Menu.ItemGroup title="Management">
            <Menu.SubMenu itemKey="users" title="Users" icon="👥">
              <Menu.Item itemKey="all-users">All Users</Menu.Item>
              <Menu.Item itemKey="roles">Roles</Menu.Item>
              <Menu.Item itemKey="permissions">Permissions</Menu.Item>
            </Menu.SubMenu>

            <Menu.SubMenu itemKey="content" title="Content" icon="📝">
              <Menu.Item itemKey="posts">Posts</Menu.Item>
              <Menu.Item itemKey="pages">Pages</Menu.Item>
              <Menu.Item itemKey="media">Media</Menu.Item>
            </Menu.SubMenu>
          </Menu.ItemGroup>

          <Menu.Divider />

          <Menu.ItemGroup title="Settings">
            <Menu.Item itemKey="preferences" icon="⚙️">
              Preferences
            </Menu.Item>
            <Menu.Item itemKey="integrations" icon="🔌">
              Integrations
            </Menu.Item>
          </Menu.ItemGroup>
        </Menu>

        <div style={{ flex: 1, padding: '24px', background: '#f3f4f6' }}>
          <h2>Content Area</h2>
          <p>Selected: {selectedKey}</p>
        </div>
      </div>
    );
  },
};

/**
 * Complete application menu example
 */
export const ApplicationMenu: Story = {
  render: () => (
    <div>
      <Menu mode="horizontal" defaultSelectedKeys={['home']}>
        <Menu.Item itemKey="home" icon="🏠">
          Home
        </Menu.Item>
        <Menu.SubMenu itemKey="products" title="Products" icon="📦">
          <Menu.ItemGroup title="Categories">
            <Menu.Item itemKey="electronics">Electronics</Menu.Item>
            <Menu.Item itemKey="clothing">Clothing</Menu.Item>
            <Menu.Item itemKey="books">Books</Menu.Item>
          </Menu.ItemGroup>
          <Menu.Divider />
          <Menu.Item itemKey="featured">Featured Products</Menu.Item>
          <Menu.Item itemKey="new">New Arrivals</Menu.Item>
        </Menu.SubMenu>
        <Menu.Item itemKey="about" icon="ℹ️">
          About
        </Menu.Item>
        <Menu.Item itemKey="contact" icon="📧">
          Contact
        </Menu.Item>
      </Menu>
    </div>
  ),
};
