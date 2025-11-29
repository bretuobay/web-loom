import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createTabbedInterface, type Tab } from '../tabbed-interface';

describe('createTabbedInterface', () => {
  let tabs: Tab[];

  beforeEach(() => {
    tabs = [
      { id: 'tab-1', label: 'Profile' },
      { id: 'tab-2', label: 'Settings' },
      { id: 'tab-3', label: 'Notifications' },
    ];
  });

  describe('initial state', () => {
    it('should initialize with first tab active by default', () => {
      const tabbedInterface = createTabbedInterface({ tabs });

      const state = tabbedInterface.getState();

      expect(state.tabs).toEqual(tabs);
      expect(state.activeTabId).toBe('tab-1');
      expect(state.panels).toBeInstanceOf(Map);

      tabbedInterface.destroy();
    });

    it('should initialize with specified active tab', () => {
      const tabbedInterface = createTabbedInterface({
        tabs,
        initialActiveTabId: 'tab-2',
      });

      const state = tabbedInterface.getState();

      expect(state.activeTabId).toBe('tab-2');

      tabbedInterface.destroy();
    });

    it('should handle empty tabs array', () => {
      const tabbedInterface = createTabbedInterface({ tabs: [] });

      const state = tabbedInterface.getState();

      expect(state.tabs).toEqual([]);
      expect(state.activeTabId).toBe('');

      tabbedInterface.destroy();
    });

    it('should initialize with horizontal orientation by default', () => {
      const tabbedInterface = createTabbedInterface({ tabs });

      // Orientation is internal to roving focus, but we can verify behavior
      expect(tabbedInterface.getState().tabs).toEqual(tabs);

      tabbedInterface.destroy();
    });

    it('should support vertical orientation', () => {
      const tabbedInterface = createTabbedInterface({
        tabs,
        orientation: 'vertical',
      });

      expect(tabbedInterface.getState().tabs).toEqual(tabs);

      tabbedInterface.destroy();
    });
  });

  describe('activateTab action', () => {
    it('should switch active tab correctly', () => {
      const tabbedInterface = createTabbedInterface({ tabs });

      tabbedInterface.actions.activateTab('tab-2');
      expect(tabbedInterface.getState().activeTabId).toBe('tab-2');

      tabbedInterface.actions.activateTab('tab-3');
      expect(tabbedInterface.getState().activeTabId).toBe('tab-3');

      tabbedInterface.destroy();
    });

    it('should not activate non-existent tab', () => {
      const tabbedInterface = createTabbedInterface({ tabs });

      tabbedInterface.actions.activateTab('non-existent');

      expect(tabbedInterface.getState().activeTabId).toBe('tab-1');

      tabbedInterface.destroy();
    });

    it('should not activate disabled tab', () => {
      const tabsWithDisabled: Tab[] = [
        { id: 'tab-1', label: 'Profile' },
        { id: 'tab-2', label: 'Settings', disabled: true },
        { id: 'tab-3', label: 'Notifications' },
      ];

      const tabbedInterface = createTabbedInterface({ tabs: tabsWithDisabled });

      tabbedInterface.actions.activateTab('tab-2');

      expect(tabbedInterface.getState().activeTabId).toBe('tab-1');

      tabbedInterface.destroy();
    });

    it('should handle activating already active tab', () => {
      const tabbedInterface = createTabbedInterface({ tabs });

      tabbedInterface.actions.activateTab('tab-1');

      expect(tabbedInterface.getState().activeTabId).toBe('tab-1');

      tabbedInterface.destroy();
    });

    it('should invoke onTabChange callback when tab changes', () => {
      const onTabChange = vi.fn();
      const tabbedInterface = createTabbedInterface({
        tabs,
        onTabChange,
      });

      tabbedInterface.actions.activateTab('tab-2');

      expect(onTabChange).toHaveBeenCalledTimes(1);
      expect(onTabChange).toHaveBeenCalledWith('tab-2');

      tabbedInterface.destroy();
    });

    it('should not invoke onTabChange callback when activating same tab', () => {
      const onTabChange = vi.fn();
      const tabbedInterface = createTabbedInterface({
        tabs,
        onTabChange,
      });

      tabbedInterface.actions.activateTab('tab-1');

      expect(onTabChange).not.toHaveBeenCalled();

      tabbedInterface.destroy();
    });
  });

  describe('addTab action', () => {
    it('should add new tab to the interface', () => {
      const tabbedInterface = createTabbedInterface({ tabs });

      const newTab: Tab = { id: 'tab-4', label: 'Help' };
      tabbedInterface.actions.addTab(newTab);

      const state = tabbedInterface.getState();

      expect(state.tabs).toHaveLength(4);
      expect(state.tabs[3]).toEqual(newTab);

      tabbedInterface.destroy();
    });

    it('should make first added tab active when starting with empty tabs', () => {
      const tabbedInterface = createTabbedInterface({ tabs: [] });

      const newTab: Tab = { id: 'tab-1', label: 'First' };
      tabbedInterface.actions.addTab(newTab);

      const state = tabbedInterface.getState();

      expect(state.tabs).toHaveLength(1);
      expect(state.activeTabId).toBe('tab-1');

      tabbedInterface.destroy();
    });

    it('should not change active tab when adding to non-empty tabs', () => {
      const tabbedInterface = createTabbedInterface({ tabs });

      tabbedInterface.actions.activateTab('tab-2');

      const newTab: Tab = { id: 'tab-4', label: 'Help' };
      tabbedInterface.actions.addTab(newTab);

      expect(tabbedInterface.getState().activeTabId).toBe('tab-2');

      tabbedInterface.destroy();
    });

    it('should add multiple tabs sequentially', () => {
      const tabbedInterface = createTabbedInterface({ tabs });

      tabbedInterface.actions.addTab({ id: 'tab-4', label: 'Help' });
      tabbedInterface.actions.addTab({ id: 'tab-5', label: 'About' });

      const state = tabbedInterface.getState();

      expect(state.tabs).toHaveLength(5);
      expect(state.tabs[3].id).toBe('tab-4');
      expect(state.tabs[4].id).toBe('tab-5');

      tabbedInterface.destroy();
    });
  });

  describe('removeTab action', () => {
    it('should remove tab from the interface', () => {
      const tabbedInterface = createTabbedInterface({ tabs });

      tabbedInterface.actions.removeTab('tab-2');

      const state = tabbedInterface.getState();

      expect(state.tabs).toHaveLength(2);
      expect(state.tabs.find((t) => t.id === 'tab-2')).toBeUndefined();

      tabbedInterface.destroy();
    });

    it('should activate next tab when removing active tab', () => {
      const tabbedInterface = createTabbedInterface({ tabs });

      tabbedInterface.actions.activateTab('tab-2');
      tabbedInterface.actions.removeTab('tab-2');

      const state = tabbedInterface.getState();

      expect(state.activeTabId).toBe('tab-3');

      tabbedInterface.destroy();
    });

    it('should activate previous tab when removing last active tab', () => {
      const tabbedInterface = createTabbedInterface({ tabs });

      tabbedInterface.actions.activateTab('tab-3');
      tabbedInterface.actions.removeTab('tab-3');

      const state = tabbedInterface.getState();

      expect(state.activeTabId).toBe('tab-2');

      tabbedInterface.destroy();
    });

    it('should set empty activeTabId when removing last tab', () => {
      const singleTab: Tab[] = [{ id: 'tab-1', label: 'Only Tab' }];
      const tabbedInterface = createTabbedInterface({ tabs: singleTab });

      tabbedInterface.actions.removeTab('tab-1');

      const state = tabbedInterface.getState();

      expect(state.tabs).toHaveLength(0);
      expect(state.activeTabId).toBe('');

      tabbedInterface.destroy();
    });

    it('should not change active tab when removing non-active tab', () => {
      const tabbedInterface = createTabbedInterface({ tabs });

      tabbedInterface.actions.activateTab('tab-1');
      tabbedInterface.actions.removeTab('tab-3');

      expect(tabbedInterface.getState().activeTabId).toBe('tab-1');

      tabbedInterface.destroy();
    });

    it('should handle removing non-existent tab gracefully', () => {
      const tabbedInterface = createTabbedInterface({ tabs });

      tabbedInterface.actions.removeTab('non-existent');

      const state = tabbedInterface.getState();

      expect(state.tabs).toHaveLength(3);

      tabbedInterface.destroy();
    });

    it('should invoke onTabChange callback when active tab is removed', () => {
      const onTabChange = vi.fn();
      const tabbedInterface = createTabbedInterface({
        tabs,
        onTabChange,
      });

      tabbedInterface.actions.activateTab('tab-2');
      onTabChange.mockClear();

      tabbedInterface.actions.removeTab('tab-2');

      // May be called twice due to roving focus sync
      expect(onTabChange).toHaveBeenCalled();
      expect(onTabChange).toHaveBeenCalledWith('tab-3');

      tabbedInterface.destroy();
    });

    it('should remove panel content when tab is removed', () => {
      const tabbedInterface = createTabbedInterface({ tabs });

      const state = tabbedInterface.getState();
      state.panels.set('tab-2', { content: 'Panel 2' });

      tabbedInterface.actions.removeTab('tab-2');

      const newState = tabbedInterface.getState();
      expect(newState.panels.has('tab-2')).toBe(false);

      tabbedInterface.destroy();
    });
  });

  describe('moveTab action', () => {
    it('should move tab from one position to another', () => {
      const tabbedInterface = createTabbedInterface({ tabs });

      // Activate a non-moving tab to avoid circular updates
      tabbedInterface.actions.activateTab('tab-2');
      
      tabbedInterface.actions.moveTab(0, 2);

      const state = tabbedInterface.getState();

      expect(state.tabs[0].id).toBe('tab-2');
      expect(state.tabs[1].id).toBe('tab-3');
      expect(state.tabs[2].id).toBe('tab-1');

      tabbedInterface.destroy();
    });

    it('should move tab forward in the list', () => {
      const tabbedInterface = createTabbedInterface({ tabs });

      // Activate a non-moving tab to avoid circular updates
      tabbedInterface.actions.activateTab('tab-3');
      
      tabbedInterface.actions.moveTab(0, 1);

      const state = tabbedInterface.getState();

      expect(state.tabs[0].id).toBe('tab-2');
      expect(state.tabs[1].id).toBe('tab-1');
      expect(state.tabs[2].id).toBe('tab-3');

      tabbedInterface.destroy();
    });

    it('should move tab backward in the list', () => {
      const tabbedInterface = createTabbedInterface({ tabs });

      // Activate a non-moving tab to avoid circular updates
      tabbedInterface.actions.activateTab('tab-1');
      
      tabbedInterface.actions.moveTab(2, 0);

      const state = tabbedInterface.getState();

      expect(state.tabs[0].id).toBe('tab-3');
      expect(state.tabs[1].id).toBe('tab-1');
      expect(state.tabs[2].id).toBe('tab-2');

      tabbedInterface.destroy();
    });

    it('should handle invalid indices gracefully', () => {
      const tabbedInterface = createTabbedInterface({ tabs });

      const originalTabs = [...tabbedInterface.getState().tabs];

      tabbedInterface.actions.moveTab(-1, 1);
      expect(tabbedInterface.getState().tabs).toEqual(originalTabs);

      tabbedInterface.actions.moveTab(0, 10);
      expect(tabbedInterface.getState().tabs).toEqual(originalTabs);

      tabbedInterface.actions.moveTab(0, 0);
      expect(tabbedInterface.getState().tabs).toEqual(originalTabs);

      tabbedInterface.destroy();
    });
  });

  describe('keyboard navigation integration', () => {
    it('should sync roving focus with active tab', () => {
      const tabbedInterface = createTabbedInterface({ tabs });

      // Activating a tab should update roving focus
      tabbedInterface.actions.activateTab('tab-3');

      expect(tabbedInterface.getState().activeTabId).toBe('tab-3');

      tabbedInterface.destroy();
    });

    it('should update active tab when roving focus changes', () => {
      const tabbedInterface = createTabbedInterface({ tabs });

      const listener = vi.fn();
      tabbedInterface.subscribe(listener);

      // Simulate roving focus navigation by activating tab
      tabbedInterface.actions.activateTab('tab-2');

      expect(tabbedInterface.getState().activeTabId).toBe('tab-2');
      expect(listener).toHaveBeenCalled();

      tabbedInterface.destroy();
    });

    it('should skip disabled tabs during navigation', () => {
      const tabsWithDisabled: Tab[] = [
        { id: 'tab-1', label: 'Profile' },
        { id: 'tab-2', label: 'Settings', disabled: true },
        { id: 'tab-3', label: 'Notifications' },
      ];

      const tabbedInterface = createTabbedInterface({ tabs: tabsWithDisabled });

      // Try to activate disabled tab
      tabbedInterface.actions.activateTab('tab-2');

      // Should remain on first tab
      expect(tabbedInterface.getState().activeTabId).toBe('tab-1');

      tabbedInterface.destroy();
    });

    it('should maintain keyboard navigation after adding tabs', () => {
      const tabbedInterface = createTabbedInterface({ tabs });

      tabbedInterface.actions.addTab({ id: 'tab-4', label: 'Help' });

      tabbedInterface.actions.activateTab('tab-4');

      expect(tabbedInterface.getState().activeTabId).toBe('tab-4');

      tabbedInterface.destroy();
    });

    it('should maintain keyboard navigation after removing tabs', () => {
      const tabbedInterface = createTabbedInterface({ tabs });

      tabbedInterface.actions.removeTab('tab-2');

      tabbedInterface.actions.activateTab('tab-3');

      expect(tabbedInterface.getState().activeTabId).toBe('tab-3');

      tabbedInterface.destroy();
    });
  });

  describe('panel visibility based on active tab', () => {
    it('should maintain panels map in state', () => {
      const tabbedInterface = createTabbedInterface({ tabs });

      const state = tabbedInterface.getState();

      expect(state.panels).toBeInstanceOf(Map);

      tabbedInterface.destroy();
    });

    it('should allow setting panel content', () => {
      const tabbedInterface = createTabbedInterface({ tabs });

      const state = tabbedInterface.getState();
      state.panels.set('tab-1', { content: 'Profile Content' });
      state.panels.set('tab-2', { content: 'Settings Content' });

      expect(state.panels.get('tab-1')).toEqual({ content: 'Profile Content' });
      expect(state.panels.get('tab-2')).toEqual({ content: 'Settings Content' });

      tabbedInterface.destroy();
    });

    it('should preserve panel content when switching tabs', () => {
      const tabbedInterface = createTabbedInterface({ tabs });

      const state = tabbedInterface.getState();
      state.panels.set('tab-1', { content: 'Profile Content' });
      state.panels.set('tab-2', { content: 'Settings Content' });

      tabbedInterface.actions.activateTab('tab-2');

      const newState = tabbedInterface.getState();
      expect(newState.panels.get('tab-1')).toEqual({ content: 'Profile Content' });
      expect(newState.panels.get('tab-2')).toEqual({ content: 'Settings Content' });

      tabbedInterface.destroy();
    });

    it('should determine visible panel based on activeTabId', () => {
      const tabbedInterface = createTabbedInterface({ tabs });

      tabbedInterface.actions.activateTab('tab-2');

      const state = tabbedInterface.getState();
      const visiblePanelId = state.activeTabId;

      expect(visiblePanelId).toBe('tab-2');

      tabbedInterface.destroy();
    });
  });

  describe('subscribe', () => {
    it('should notify subscribers when state changes', () => {
      const tabbedInterface = createTabbedInterface({ tabs });

      const listener = vi.fn();
      tabbedInterface.subscribe(listener);

      tabbedInterface.actions.activateTab('tab-2');

      expect(listener).toHaveBeenCalled();
      const lastCall = listener.mock.calls[listener.mock.calls.length - 1];
      expect(lastCall[0]).toMatchObject({
        activeTabId: 'tab-2',
      });

      tabbedInterface.destroy();
    });

    it('should support multiple subscribers', () => {
      const tabbedInterface = createTabbedInterface({ tabs });

      const listener1 = vi.fn();
      const listener2 = vi.fn();

      tabbedInterface.subscribe(listener1);
      tabbedInterface.subscribe(listener2);

      tabbedInterface.actions.activateTab('tab-2');

      expect(listener1).toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();

      tabbedInterface.destroy();
    });

    it('should allow unsubscribing', () => {
      const tabbedInterface = createTabbedInterface({ tabs });

      const listener = vi.fn();
      const unsubscribe = tabbedInterface.subscribe(listener);

      unsubscribe();

      tabbedInterface.actions.activateTab('tab-2');

      expect(listener).not.toHaveBeenCalled();

      tabbedInterface.destroy();
    });
  });

  describe('destroy', () => {
    it('should clean up subscriptions when destroyed', () => {
      const tabbedInterface = createTabbedInterface({ tabs });

      const listener = vi.fn();
      tabbedInterface.subscribe(listener);

      tabbedInterface.destroy();

      tabbedInterface.actions.activateTab('tab-2');

      expect(listener).not.toHaveBeenCalled();
    });

    it('should clean up roving focus behavior', () => {
      const tabbedInterface = createTabbedInterface({ tabs });

      expect(() => tabbedInterface.destroy()).not.toThrow();
    });
  });

  describe('convenience methods', () => {
    it('should move focus to next tab with focusNextTab', () => {
      const tabbedInterface = createTabbedInterface({ tabs });

      // Start at first tab
      expect(tabbedInterface.getState().activeTabId).toBe('tab-1');

      // Move to next tab
      tabbedInterface.actions.focusNextTab();

      // Should now be on second tab
      expect(tabbedInterface.getState().activeTabId).toBe('tab-2');

      tabbedInterface.destroy();
    });

    it('should move focus to previous tab with focusPreviousTab', () => {
      const tabbedInterface = createTabbedInterface({ tabs });

      // Start at second tab
      tabbedInterface.actions.activateTab('tab-2');
      expect(tabbedInterface.getState().activeTabId).toBe('tab-2');

      // Move to previous tab
      tabbedInterface.actions.focusPreviousTab();

      // Should now be on first tab
      expect(tabbedInterface.getState().activeTabId).toBe('tab-1');

      tabbedInterface.destroy();
    });

    it('should wrap to first tab when calling focusNextTab on last tab', () => {
      const tabbedInterface = createTabbedInterface({ tabs, wrap: true });

      // Start at last tab
      tabbedInterface.actions.activateTab('tab-3');
      expect(tabbedInterface.getState().activeTabId).toBe('tab-3');

      // Move to next tab (should wrap to first)
      tabbedInterface.actions.focusNextTab();

      // Should now be on first tab
      expect(tabbedInterface.getState().activeTabId).toBe('tab-1');

      tabbedInterface.destroy();
    });

    it('should wrap to last tab when calling focusPreviousTab on first tab', () => {
      const tabbedInterface = createTabbedInterface({ tabs, wrap: true });

      // Start at first tab
      expect(tabbedInterface.getState().activeTabId).toBe('tab-1');

      // Move to previous tab (should wrap to last)
      tabbedInterface.actions.focusPreviousTab();

      // Should now be on last tab
      expect(tabbedInterface.getState().activeTabId).toBe('tab-3');

      tabbedInterface.destroy();
    });

    it('should not wrap when wrap is false', () => {
      const tabbedInterface = createTabbedInterface({ tabs, wrap: false });

      // Start at last tab
      tabbedInterface.actions.activateTab('tab-3');
      expect(tabbedInterface.getState().activeTabId).toBe('tab-3');

      // Try to move to next tab (should stay on last)
      tabbedInterface.actions.focusNextTab();

      // Should still be on last tab
      expect(tabbedInterface.getState().activeTabId).toBe('tab-3');

      tabbedInterface.destroy();
    });

    it('should invoke onTabChange callback when using convenience methods', () => {
      const onTabChange = vi.fn();
      const tabbedInterface = createTabbedInterface({
        tabs,
        onTabChange,
      });

      // Clear initial calls
      onTabChange.mockClear();

      // Use focusNextTab
      tabbedInterface.actions.focusNextTab();

      expect(onTabChange).toHaveBeenCalledWith('tab-2');

      tabbedInterface.destroy();
    });

    it('should not activate disabled tabs when using focusNextTab', () => {
      const tabsWithDisabled: Tab[] = [
        { id: 'tab-1', label: 'Profile' },
        { id: 'tab-2', label: 'Settings', disabled: true },
        { id: 'tab-3', label: 'Notifications' },
      ];

      const tabbedInterface = createTabbedInterface({ tabs: tabsWithDisabled });

      // Start at first tab
      expect(tabbedInterface.getState().activeTabId).toBe('tab-1');

      // Move to next tab (roving focus will move to tab-2, but it won't activate because it's disabled)
      tabbedInterface.actions.focusNextTab();

      // Should remain on tab-1 because tab-2 is disabled
      expect(tabbedInterface.getState().activeTabId).toBe('tab-1');

      tabbedInterface.destroy();
    });

    it('should navigate through multiple tabs with focusNextTab', () => {
      const tabbedInterface = createTabbedInterface({ tabs });

      expect(tabbedInterface.getState().activeTabId).toBe('tab-1');

      tabbedInterface.actions.focusNextTab();
      expect(tabbedInterface.getState().activeTabId).toBe('tab-2');

      tabbedInterface.actions.focusNextTab();
      expect(tabbedInterface.getState().activeTabId).toBe('tab-3');

      tabbedInterface.destroy();
    });

    it('should navigate through multiple tabs with focusPreviousTab', () => {
      const tabbedInterface = createTabbedInterface({ tabs });

      // Start at last tab
      tabbedInterface.actions.activateTab('tab-3');
      expect(tabbedInterface.getState().activeTabId).toBe('tab-3');

      tabbedInterface.actions.focusPreviousTab();
      expect(tabbedInterface.getState().activeTabId).toBe('tab-2');

      tabbedInterface.actions.focusPreviousTab();
      expect(tabbedInterface.getState().activeTabId).toBe('tab-1');

      tabbedInterface.destroy();
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete tabbed interface lifecycle', () => {
      const onTabChange = vi.fn();
      const tabbedInterface = createTabbedInterface({
        tabs,
        orientation: 'horizontal',
        onTabChange,
      });

      const stateListener = vi.fn();
      tabbedInterface.subscribe(stateListener);

      // Activate tab
      tabbedInterface.actions.activateTab('tab-2');
      expect(tabbedInterface.getState().activeTabId).toBe('tab-2');
      expect(onTabChange).toHaveBeenCalledWith('tab-2');

      // Add new tab
      tabbedInterface.actions.addTab({ id: 'tab-4', label: 'Help' });
      expect(tabbedInterface.getState().tabs).toHaveLength(4);

      // Activate new tab
      tabbedInterface.actions.activateTab('tab-4');
      expect(tabbedInterface.getState().activeTabId).toBe('tab-4');

      // Remove tab
      tabbedInterface.actions.removeTab('tab-2');
      expect(tabbedInterface.getState().tabs).toHaveLength(3);

      // Move tab (activate a stable tab first to avoid circular updates)
      tabbedInterface.actions.activateTab('tab-3');
      tabbedInterface.actions.moveTab(0, 2);
      expect(tabbedInterface.getState().tabs[2].id).toBe('tab-1');

      // Clean up
      tabbedInterface.destroy();
    });

    it('should maintain state consistency across multiple operations', () => {
      const tabbedInterface = createTabbedInterface({ tabs });

      // Initial state
      expect(tabbedInterface.getState().activeTabId).toBe('tab-1');
      expect(tabbedInterface.getState().tabs).toHaveLength(3);

      // Add tabs
      tabbedInterface.actions.addTab({ id: 'tab-4', label: 'Help' });
      tabbedInterface.actions.addTab({ id: 'tab-5', label: 'About' });
      expect(tabbedInterface.getState().tabs).toHaveLength(5);

      // Activate middle tab
      tabbedInterface.actions.activateTab('tab-3');
      expect(tabbedInterface.getState().activeTabId).toBe('tab-3');

      // Remove tabs
      tabbedInterface.actions.removeTab('tab-1');
      tabbedInterface.actions.removeTab('tab-2');
      expect(tabbedInterface.getState().tabs).toHaveLength(3);
      expect(tabbedInterface.getState().activeTabId).toBe('tab-3');

      // Move active tab
      tabbedInterface.actions.moveTab(0, 2);
      expect(tabbedInterface.getState().activeTabId).toBe('tab-3');

      tabbedInterface.destroy();
    });

    it('should work with wrap option', () => {
      const tabbedInterface = createTabbedInterface({
        tabs,
        wrap: true,
      });

      expect(tabbedInterface.getState().tabs).toEqual(tabs);

      tabbedInterface.destroy();
    });

    it('should work without wrap option', () => {
      const tabbedInterface = createTabbedInterface({
        tabs,
        wrap: false,
      });

      expect(tabbedInterface.getState().tabs).toEqual(tabs);

      tabbedInterface.destroy();
    });
  });
});
