import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Menu } from './index';

describe('Menu', () => {
  it('renders vertical menu by default', () => {
    const { container } = render(
      <Menu>
        <Menu.Item itemKey="1">Item 1</Menu.Item>
        <Menu.Item itemKey="2">Item 2</Menu.Item>
      </Menu>
    );

    const menu = container.querySelector('.loom-menu');
    expect(menu).toHaveClass('loom-menu-vertical');
    expect(menu).toHaveAttribute('role', 'menu');
  });

  it('renders horizontal menu', () => {
    const { container } = render(
      <Menu mode="horizontal">
        <Menu.Item itemKey="1">Item 1</Menu.Item>
      </Menu>
    );

    const menu = container.querySelector('.loom-menu');
    expect(menu).toHaveClass('loom-menu-horizontal');
  });

  it('renders inline menu', () => {
    const { container } = render(
      <Menu mode="inline">
        <Menu.Item itemKey="1">Item 1</Menu.Item>
      </Menu>
    );

    const menu = container.querySelector('.loom-menu');
    expect(menu).toHaveClass('loom-menu-inline');
  });

  it('applies dark theme', () => {
    const { container } = render(
      <Menu theme="dark">
        <Menu.Item itemKey="1">Item 1</Menu.Item>
      </Menu>
    );

    const menu = container.querySelector('.loom-menu');
    expect(menu).toHaveClass('loom-menu-dark');
  });

  it('renders menu items', () => {
    render(
      <Menu>
        <Menu.Item itemKey="1">Item 1</Menu.Item>
        <Menu.Item itemKey="2">Item 2</Menu.Item>
        <Menu.Item itemKey="3">Item 3</Menu.Item>
      </Menu>
    );

    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
    expect(screen.getByText('Item 3')).toBeInTheDocument();
  });

  it('handles menu item selection', () => {
    const handleSelect = vi.fn();

    render(
      <Menu onSelect={handleSelect}>
        <Menu.Item itemKey="1">Item 1</Menu.Item>
        <Menu.Item itemKey="2">Item 2</Menu.Item>
      </Menu>
    );

    const item1 = screen.getByText('Item 1');
    fireEvent.click(item1);

    expect(handleSelect).toHaveBeenCalledWith('1');
  });

  it('shows selected state on item', () => {
    render(
      <Menu selectedKeys={['2']}>
        <Menu.Item itemKey="1">Item 1</Menu.Item>
        <Menu.Item itemKey="2">Item 2</Menu.Item>
      </Menu>
    );

    const item2 = screen.getByText('Item 2').parentElement;
    expect(item2).toHaveClass('loom-menu-item-selected');
    expect(item2).toHaveAttribute('aria-selected', 'true');
  });

  it('handles keyboard navigation on menu items', () => {
    const handleSelect = vi.fn();

    render(
      <Menu onSelect={handleSelect}>
        <Menu.Item itemKey="1">Item 1</Menu.Item>
      </Menu>
    );

    const item = screen.getByText('Item 1').parentElement!;

    fireEvent.keyDown(item, { key: 'Enter' });
    expect(handleSelect).toHaveBeenCalledWith('1');

    handleSelect.mockClear();

    fireEvent.keyDown(item, { key: ' ' });
    expect(handleSelect).toHaveBeenCalledWith('1');
  });

  it('disables menu items', () => {
    const handleSelect = vi.fn();

    render(
      <Menu onSelect={handleSelect}>
        <Menu.Item itemKey="1" disabled>
          Disabled Item
        </Menu.Item>
      </Menu>
    );

    const item = screen.getByText('Disabled Item').parentElement!;
    expect(item).toHaveClass('loom-menu-item-disabled');
    expect(item).toHaveAttribute('aria-disabled', 'true');

    fireEvent.click(item);
    expect(handleSelect).not.toHaveBeenCalled();
  });

  it('renders menu item with icon', () => {
    render(
      <Menu>
        <Menu.Item itemKey="1" icon={<span data-testid="icon">🏠</span>}>
          Home
        </Menu.Item>
      </Menu>
    );

    expect(screen.getByTestId('icon')).toBeInTheDocument();
    expect(screen.getByText('Home')).toBeInTheDocument();
  });

  it('renders submenu', () => {
    render(
      <Menu>
        <Menu.SubMenu itemKey="sub1" title="Submenu">
          <Menu.Item itemKey="1">Subitem 1</Menu.Item>
          <Menu.Item itemKey="2">Subitem 2</Menu.Item>
        </Menu.SubMenu>
      </Menu>
    );

    expect(screen.getByText('Submenu')).toBeInTheDocument();
  });

  it('expands and collapses submenu on click', () => {
    render(
      <Menu>
        <Menu.SubMenu itemKey="sub1" title="Submenu">
          <Menu.Item itemKey="1">Subitem 1</Menu.Item>
        </Menu.SubMenu>
      </Menu>
    );

    const submenuTitle = screen.getByText('Submenu');

    // Initially closed
    expect(screen.queryByText('Subitem 1')).not.toBeInTheDocument();

    // Click to open
    fireEvent.click(submenuTitle);
    expect(screen.getByText('Subitem 1')).toBeInTheDocument();

    // Click to close
    fireEvent.click(submenuTitle);
    expect(screen.queryByText('Subitem 1')).not.toBeInTheDocument();
  });

  it('handles submenu keyboard navigation', () => {
    render(
      <Menu>
        <Menu.SubMenu itemKey="sub1" title="Submenu">
          <Menu.Item itemKey="1">Subitem 1</Menu.Item>
        </Menu.SubMenu>
      </Menu>
    );

    const submenuTitle = screen.getByText('Submenu');

    // Open with Enter
    fireEvent.keyDown(submenuTitle, { key: 'Enter' });
    expect(screen.getByText('Subitem 1')).toBeInTheDocument();

    // Close with Enter
    fireEvent.keyDown(submenuTitle, { key: 'Enter' });
    expect(screen.queryByText('Subitem 1')).not.toBeInTheDocument();
  });

  it('renders menu divider', () => {
    const { container } = render(
      <Menu>
        <Menu.Item itemKey="1">Item 1</Menu.Item>
        <Menu.Divider />
        <Menu.Item itemKey="2">Item 2</Menu.Item>
      </Menu>
    );

    const divider = container.querySelector('.loom-menu-divider');
    expect(divider).toBeInTheDocument();
    expect(divider).toHaveAttribute('role', 'separator');
  });

  it('renders menu item group', () => {
    render(
      <Menu>
        <Menu.ItemGroup title="Group 1">
          <Menu.Item itemKey="1">Item 1</Menu.Item>
          <Menu.Item itemKey="2">Item 2</Menu.Item>
        </Menu.ItemGroup>
      </Menu>
    );

    expect(screen.getByText('Group 1')).toBeInTheDocument();
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
  });

  it('applies collapsed state to inline menu', () => {
    const { container } = render(
      <Menu mode="inline" inlineCollapsed>
        <Menu.Item itemKey="1" icon={<span>🏠</span>}>
          Home
        </Menu.Item>
      </Menu>
    );

    const menu = container.querySelector('.loom-menu');
    expect(menu).toHaveClass('loom-menu-inline-collapsed');
  });

  it('works in controlled mode', () => {
    const { rerender } = render(
      <Menu selectedKeys={['1']}>
        <Menu.Item itemKey="1">Item 1</Menu.Item>
        <Menu.Item itemKey="2">Item 2</Menu.Item>
      </Menu>
    );

    let item1 = screen.getByText('Item 1').parentElement;
    expect(item1).toHaveClass('loom-menu-item-selected');

    rerender(
      <Menu selectedKeys={['2']}>
        <Menu.Item itemKey="1">Item 1</Menu.Item>
        <Menu.Item itemKey="2">Item 2</Menu.Item>
      </Menu>
    );

    const item2 = screen.getByText('Item 2').parentElement;
    expect(item2).toHaveClass('loom-menu-item-selected');
    expect(item1).not.toHaveClass('loom-menu-item-selected');
  });

  it('works in uncontrolled mode', () => {
    render(
      <Menu defaultSelectedKeys={['1']}>
        <Menu.Item itemKey="1">Item 1</Menu.Item>
        <Menu.Item itemKey="2">Item 2</Menu.Item>
      </Menu>
    );

    const item1 = screen.getByText('Item 1').parentElement;
    expect(item1).toHaveClass('loom-menu-item-selected');

    const item2 = screen.getByText('Item 2');
    fireEvent.click(item2);

    expect(item2.parentElement).toHaveClass('loom-menu-item-selected');
    expect(item1).not.toHaveClass('loom-menu-item-selected');
  });

  it('applies custom className', () => {
    const { container } = render(
      <Menu className="custom-menu">
        <Menu.Item itemKey="1">Item 1</Menu.Item>
      </Menu>
    );

    const menu = container.querySelector('.loom-menu');
    expect(menu).toHaveClass('custom-menu');
  });
});
