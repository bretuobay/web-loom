import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Tabs } from './index';

describe('Tabs', () => {
  it('renders tabs with tab panes', () => {
    render(
      <Tabs defaultActiveKey="1">
        <Tabs.TabPane tabKey="1" tab="Tab 1">
          Content 1
        </Tabs.TabPane>
        <Tabs.TabPane tabKey="2" tab="Tab 2">
          Content 2
        </Tabs.TabPane>
      </Tabs>
    );

    expect(screen.getByText('Tab 1')).toBeInTheDocument();
    expect(screen.getByText('Tab 2')).toBeInTheDocument();
    expect(screen.getByText('Content 1')).toBeInTheDocument();
  });

  it('renders with line type by default', () => {
    const { container } = render(
      <Tabs defaultActiveKey="1">
        <Tabs.TabPane tabKey="1" tab="Tab 1">
          Content 1
        </Tabs.TabPane>
      </Tabs>
    );

    const tabs = container.querySelector('.loom-tabs');
    expect(tabs).toHaveClass('loom-tabs-line');
  });

  it('renders with card type', () => {
    const { container } = render(
      <Tabs type="card" defaultActiveKey="1">
        <Tabs.TabPane tabKey="1" tab="Tab 1">
          Content 1
        </Tabs.TabPane>
      </Tabs>
    );

    const tabs = container.querySelector('.loom-tabs');
    expect(tabs).toHaveClass('loom-tabs-card');
  });

  it('renders with editable-card type', () => {
    const { container } = render(
      <Tabs type="editable-card" defaultActiveKey="1">
        <Tabs.TabPane tabKey="1" tab="Tab 1">
          Content 1
        </Tabs.TabPane>
      </Tabs>
    );

    const tabs = container.querySelector('.loom-tabs');
    expect(tabs).toHaveClass('loom-tabs-editable-card');
  });

  it('renders with different positions', () => {
    const { container, rerender } = render(
      <Tabs tabPosition="top" defaultActiveKey="1">
        <Tabs.TabPane tabKey="1" tab="Tab 1">
          Content 1
        </Tabs.TabPane>
      </Tabs>
    );

    let tabs = container.querySelector('.loom-tabs');
    expect(tabs).toHaveClass('loom-tabs-top');

    rerender(
      <Tabs tabPosition="bottom" defaultActiveKey="1">
        <Tabs.TabPane tabKey="1" tab="Tab 1">
          Content 1
        </Tabs.TabPane>
      </Tabs>
    );
    tabs = container.querySelector('.loom-tabs');
    expect(tabs).toHaveClass('loom-tabs-bottom');

    rerender(
      <Tabs tabPosition="left" defaultActiveKey="1">
        <Tabs.TabPane tabKey="1" tab="Tab 1">
          Content 1
        </Tabs.TabPane>
      </Tabs>
    );
    tabs = container.querySelector('.loom-tabs');
    expect(tabs).toHaveClass('loom-tabs-left');

    rerender(
      <Tabs tabPosition="right" defaultActiveKey="1">
        <Tabs.TabPane tabKey="1" tab="Tab 1">
          Content 1
        </Tabs.TabPane>
      </Tabs>
    );
    tabs = container.querySelector('.loom-tabs');
    expect(tabs).toHaveClass('loom-tabs-right');
  });

  it('renders with different sizes', () => {
    const { container, rerender } = render(
      <Tabs size="small" defaultActiveKey="1">
        <Tabs.TabPane tabKey="1" tab="Tab 1">
          Content 1
        </Tabs.TabPane>
      </Tabs>
    );

    let tabs = container.querySelector('.loom-tabs');
    expect(tabs).toHaveClass('loom-tabs-small');

    rerender(
      <Tabs size="middle" defaultActiveKey="1">
        <Tabs.TabPane tabKey="1" tab="Tab 1">
          Content 1
        </Tabs.TabPane>
      </Tabs>
    );
    tabs = container.querySelector('.loom-tabs');
    expect(tabs).toHaveClass('loom-tabs-middle');

    rerender(
      <Tabs size="large" defaultActiveKey="1">
        <Tabs.TabPane tabKey="1" tab="Tab 1">
          Content 1
        </Tabs.TabPane>
      </Tabs>
    );
    tabs = container.querySelector('.loom-tabs');
    expect(tabs).toHaveClass('loom-tabs-large');
  });

  it('handles uncontrolled mode with defaultActiveKey', () => {
    render(
      <Tabs defaultActiveKey="2">
        <Tabs.TabPane tabKey="1" tab="Tab 1">
          Content 1
        </Tabs.TabPane>
        <Tabs.TabPane tabKey="2" tab="Tab 2">
          Content 2
        </Tabs.TabPane>
      </Tabs>
    );

    // Content 2 should be visible
    expect(screen.getByText('Content 2')).toBeVisible();
    // Content 1 should exist but not be visible
    const content1Container = screen.getByText('Content 1').closest('.loom-tabs-tabpane');
    expect(content1Container).toHaveClass('loom-tabs-tabpane-inactive');
  });

  it('handles controlled mode with activeKey', () => {
    const { rerender } = render(
      <Tabs activeKey="1">
        <Tabs.TabPane tabKey="1" tab="Tab 1">
          Content 1
        </Tabs.TabPane>
        <Tabs.TabPane tabKey="2" tab="Tab 2">
          Content 2
        </Tabs.TabPane>
      </Tabs>
    );

    expect(screen.getByText('Content 1')).toBeVisible();

    rerender(
      <Tabs activeKey="2">
        <Tabs.TabPane tabKey="1" tab="Tab 1">
          Content 1
        </Tabs.TabPane>
        <Tabs.TabPane tabKey="2" tab="Tab 2">
          Content 2
        </Tabs.TabPane>
      </Tabs>
    );

    expect(screen.getByText('Content 2')).toBeVisible();
  });

  it('calls onChange when tab is clicked in uncontrolled mode', () => {
    const handleChange = vi.fn();

    render(
      <Tabs defaultActiveKey="1" onChange={handleChange}>
        <Tabs.TabPane tabKey="1" tab="Tab 1">
          Content 1
        </Tabs.TabPane>
        <Tabs.TabPane tabKey="2" tab="Tab 2">
          Content 2
        </Tabs.TabPane>
      </Tabs>
    );

    fireEvent.click(screen.getByText('Tab 2'));
    expect(handleChange).toHaveBeenCalledWith('2');
  });

  it('applies active class to selected tab', () => {
    const { container } = render(
      <Tabs defaultActiveKey="1">
        <Tabs.TabPane tabKey="1" tab="Tab 1">
          Content 1
        </Tabs.TabPane>
        <Tabs.TabPane tabKey="2" tab="Tab 2">
          Content 2
        </Tabs.TabPane>
      </Tabs>
    );

    const tabs = container.querySelectorAll('[role="tab"]');
    expect(tabs[0]).toHaveClass('loom-tabs-tab-active');
    expect(tabs[1]).not.toHaveClass('loom-tabs-tab-active');
  });

  it('renders disabled tabs', () => {
    const handleChange = vi.fn();

    render(
      <Tabs defaultActiveKey="1" onChange={handleChange}>
        <Tabs.TabPane tabKey="1" tab="Tab 1">
          Content 1
        </Tabs.TabPane>
        <Tabs.TabPane tabKey="2" tab="Tab 2" disabled>
          Content 2
        </Tabs.TabPane>
      </Tabs>
    );

    const disabledTab = screen.getByText('Tab 2').parentElement;
    expect(disabledTab).toHaveClass('loom-tabs-tab-disabled');
    expect(disabledTab).toHaveAttribute('aria-disabled', 'true');

    // Should not trigger onChange when clicking disabled tab
    fireEvent.click(screen.getByText('Tab 2'));
    expect(handleChange).not.toHaveBeenCalled();
  });

  it('shows add button in editable-card type', () => {
    render(
      <Tabs type="editable-card" defaultActiveKey="1">
        <Tabs.TabPane tabKey="1" tab="Tab 1">
          Content 1
        </Tabs.TabPane>
      </Tabs>
    );

    expect(screen.getByLabelText('Add tab')).toBeInTheDocument();
  });

  it('shows remove buttons on closable tabs in editable-card type', () => {
    render(
      <Tabs type="editable-card" defaultActiveKey="1">
        <Tabs.TabPane tabKey="1" tab="Tab 1">
          Content 1
        </Tabs.TabPane>
        <Tabs.TabPane tabKey="2" tab="Tab 2">
          Content 2
        </Tabs.TabPane>
      </Tabs>
    );

    const removeButtons = screen.getAllByLabelText('Remove tab');
    expect(removeButtons).toHaveLength(2);
  });

  it('does not show remove button on non-closable tabs', () => {
    const { container } = render(
      <Tabs type="editable-card" defaultActiveKey="1">
        <Tabs.TabPane tabKey="1" tab="Tab 1" closable={false}>
          Content 1
        </Tabs.TabPane>
        <Tabs.TabPane tabKey="2" tab="Tab 2">
          Content 2
        </Tabs.TabPane>
      </Tabs>
    );

    const removeButtons = screen.getAllByLabelText('Remove tab');
    expect(removeButtons).toHaveLength(1); // Only tab 2 has remove button
  });

  it('does not show remove button on disabled tabs', () => {
    render(
      <Tabs type="editable-card" defaultActiveKey="1">
        <Tabs.TabPane tabKey="1" tab="Tab 1">
          Content 1
        </Tabs.TabPane>
        <Tabs.TabPane tabKey="2" tab="Tab 2" disabled>
          Content 2
        </Tabs.TabPane>
      </Tabs>
    );

    const removeButtons = screen.getAllByLabelText('Remove tab');
    expect(removeButtons).toHaveLength(1); // Only tab 1 has remove button
  });

  it('calls onEdit with add action when add button is clicked', () => {
    const handleEdit = vi.fn();

    render(
      <Tabs type="editable-card" defaultActiveKey="1" onEdit={handleEdit}>
        <Tabs.TabPane tabKey="1" tab="Tab 1">
          Content 1
        </Tabs.TabPane>
      </Tabs>
    );

    fireEvent.click(screen.getByLabelText('Add tab'));
    expect(handleEdit).toHaveBeenCalledWith('', 'add');
  });

  it('calls onEdit with remove action when remove button is clicked', () => {
    const handleEdit = vi.fn();

    render(
      <Tabs type="editable-card" defaultActiveKey="1" onEdit={handleEdit}>
        <Tabs.TabPane tabKey="1" tab="Tab 1">
          Content 1
        </Tabs.TabPane>
        <Tabs.TabPane tabKey="2" tab="Tab 2">
          Content 2
        </Tabs.TabPane>
      </Tabs>
    );

    const removeButtons = screen.getAllByLabelText('Remove tab');
    const secondRemoveButton = removeButtons[1];
    if (secondRemoveButton) {
      fireEvent.click(secondRemoveButton); // Click remove on second tab
    }
    expect(handleEdit).toHaveBeenCalledWith('2', 'remove');
  });

  it('does not switch tabs when clicking remove button', () => {
    const handleChange = vi.fn();
    const handleEdit = vi.fn();

    render(
      <Tabs
        type="editable-card"
        defaultActiveKey="1"
        onChange={handleChange}
        onEdit={handleEdit}
      >
        <Tabs.TabPane tabKey="1" tab="Tab 1">
          Content 1
        </Tabs.TabPane>
        <Tabs.TabPane tabKey="2" tab="Tab 2">
          Content 2
        </Tabs.TabPane>
      </Tabs>
    );

    const removeButtons = screen.getAllByLabelText('Remove tab');
    const secondRemoveButton = removeButtons[1];
    if (secondRemoveButton) {
      fireEvent.click(secondRemoveButton);
    }

    expect(handleEdit).toHaveBeenCalledWith('2', 'remove');
    expect(handleChange).not.toHaveBeenCalled(); // Should not trigger tab change
  });

  it('handles keyboard navigation with arrow keys', () => {
    const handleChange = vi.fn();

    const { container } = render(
      <Tabs defaultActiveKey="1" onChange={handleChange}>
        <Tabs.TabPane tabKey="1" tab="Tab 1">
          Content 1
        </Tabs.TabPane>
        <Tabs.TabPane tabKey="2" tab="Tab 2">
          Content 2
        </Tabs.TabPane>
        <Tabs.TabPane tabKey="3" tab="Tab 3">
          Content 3
        </Tabs.TabPane>
      </Tabs>
    );

    const tablist = container.querySelector('[role="tablist"]');

    // ArrowRight should move to next tab
    fireEvent.keyDown(tablist!, { key: 'ArrowRight' });
    expect(handleChange).toHaveBeenCalledWith('2');

    // ArrowLeft should move to previous tab
    fireEvent.keyDown(tablist!, { key: 'ArrowLeft' });
    expect(handleChange).toHaveBeenCalledWith('1');
  });

  it('handles keyboard navigation with Home and End keys', () => {
    const handleChange = vi.fn();

    const { container } = render(
      <Tabs defaultActiveKey="2" onChange={handleChange}>
        <Tabs.TabPane tabKey="1" tab="Tab 1">
          Content 1
        </Tabs.TabPane>
        <Tabs.TabPane tabKey="2" tab="Tab 2">
          Content 2
        </Tabs.TabPane>
        <Tabs.TabPane tabKey="3" tab="Tab 3">
          Content 3
        </Tabs.TabPane>
      </Tabs>
    );

    const tablist = container.querySelector('[role="tablist"]');

    // Home should move to first tab
    fireEvent.keyDown(tablist!, { key: 'Home' });
    expect(handleChange).toHaveBeenCalledWith('1');

    // End should move to last tab
    fireEvent.keyDown(tablist!, { key: 'End' });
    expect(handleChange).toHaveBeenCalledWith('3');
  });

  it('wraps around when using arrow keys', () => {
    const handleChange = vi.fn();

    const { container } = render(
      <Tabs defaultActiveKey="1" onChange={handleChange}>
        <Tabs.TabPane tabKey="1" tab="Tab 1">
          Content 1
        </Tabs.TabPane>
        <Tabs.TabPane tabKey="2" tab="Tab 2">
          Content 2
        </Tabs.TabPane>
      </Tabs>
    );

    const tablist = container.querySelector('[role="tablist"]');

    // ArrowLeft from first tab should wrap to last tab
    fireEvent.keyDown(tablist!, { key: 'ArrowLeft' });
    expect(handleChange).toHaveBeenCalledWith('2');

    // ArrowRight from last tab should wrap to first tab
    handleChange.mockClear();
    fireEvent.keyDown(tablist!, { key: 'ArrowRight' });
    expect(handleChange).toHaveBeenCalledWith('1');
  });

  it('handles Enter key to select tab', () => {
    const handleChange = vi.fn();

    render(
      <Tabs defaultActiveKey="1" onChange={handleChange}>
        <Tabs.TabPane tabKey="1" tab="Tab 1">
          Content 1
        </Tabs.TabPane>
        <Tabs.TabPane tabKey="2" tab="Tab 2">
          Content 2
        </Tabs.TabPane>
      </Tabs>
    );

    const tab2 = screen.getByText('Tab 2').parentElement;
    fireEvent.keyDown(tab2!, { key: 'Enter' });
    expect(handleChange).toHaveBeenCalledWith('2');
  });

  it('handles Space key to select tab', () => {
    const handleChange = vi.fn();

    render(
      <Tabs defaultActiveKey="1" onChange={handleChange}>
        <Tabs.TabPane tabKey="1" tab="Tab 1">
          Content 1
        </Tabs.TabPane>
        <Tabs.TabPane tabKey="2" tab="Tab 2">
          Content 2
        </Tabs.TabPane>
      </Tabs>
    );

    const tab2 = screen.getByText('Tab 2').parentElement;
    fireEvent.keyDown(tab2!, { key: ' ' });
    expect(handleChange).toHaveBeenCalledWith('2');
  });

  it('sets correct ARIA attributes', () => {
    const { container } = render(
      <Tabs defaultActiveKey="1">
        <Tabs.TabPane tabKey="1" tab="Tab 1">
          Content 1
        </Tabs.TabPane>
        <Tabs.TabPane tabKey="2" tab="Tab 2">
          Content 2
        </Tabs.TabPane>
      </Tabs>
    );

    const tablist = container.querySelector('[role="tablist"]');
    expect(tablist).toHaveAttribute('aria-orientation', 'horizontal');

    const tabs = container.querySelectorAll('[role="tab"]');
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
    expect(tabs[1]).toHaveAttribute('aria-selected', 'false');

    const tabpanels = container.querySelectorAll('[role="tabpanel"]');
    expect(tabpanels[0]).toHaveAttribute('aria-hidden', 'false');
    expect(tabpanels[1]).toHaveAttribute('aria-hidden', 'true');
  });

  it('sets vertical orientation for left and right positions', () => {
    const { container, rerender } = render(
      <Tabs tabPosition="left" defaultActiveKey="1">
        <Tabs.TabPane tabKey="1" tab="Tab 1">
          Content 1
        </Tabs.TabPane>
      </Tabs>
    );

    let tablist = container.querySelector('[role="tablist"]');
    expect(tablist).toHaveAttribute('aria-orientation', 'vertical');

    rerender(
      <Tabs tabPosition="right" defaultActiveKey="1">
        <Tabs.TabPane tabKey="1" tab="Tab 1">
          Content 1
        </Tabs.TabPane>
      </Tabs>
    );

    tablist = container.querySelector('[role="tablist"]');
    expect(tablist).toHaveAttribute('aria-orientation', 'vertical');
  });

  it('sets correct tabIndex for keyboard navigation', () => {
    const { container } = render(
      <Tabs defaultActiveKey="1">
        <Tabs.TabPane tabKey="1" tab="Tab 1">
          Content 1
        </Tabs.TabPane>
        <Tabs.TabPane tabKey="2" tab="Tab 2">
          Content 2
        </Tabs.TabPane>
      </Tabs>
    );

    const tabs = container.querySelectorAll('[role="tab"]');
    expect(tabs[0]).toHaveAttribute('tabIndex', '0'); // Active tab
    expect(tabs[1]).toHaveAttribute('tabIndex', '-1'); // Inactive tab
  });

  it('applies custom className', () => {
    const { container } = render(
      <Tabs className="custom-tabs" defaultActiveKey="1">
        <Tabs.TabPane tabKey="1" tab="Tab 1">
          Content 1
        </Tabs.TabPane>
      </Tabs>
    );

    const tabs = container.querySelector('.loom-tabs');
    expect(tabs).toHaveClass('custom-tabs');
  });
});
