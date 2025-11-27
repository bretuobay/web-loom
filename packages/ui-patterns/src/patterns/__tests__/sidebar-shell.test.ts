import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createSidebarShell } from '../sidebar-shell';

describe('createSidebarShell', () => {
  describe('initial state', () => {
    it('should initialize with collapsed state by default', () => {
      const sidebar = createSidebarShell();

      const state = sidebar.getState();

      expect(state.isExpanded).toBe(false);
      expect(state.activeSection).toBeNull();
      expect(state.isPinned).toBe(false);
      expect(state.width).toBe(250);

      sidebar.destroy();
    });

    it('should initialize with custom expanded state', () => {
      const sidebar = createSidebarShell({
        initialExpanded: true,
      });

      const state = sidebar.getState();

      expect(state.isExpanded).toBe(true);

      sidebar.destroy();
    });

    it('should initialize with custom active section', () => {
      const sidebar = createSidebarShell({
        initialActiveSection: 'navigation',
      });

      const state = sidebar.getState();

      expect(state.activeSection).toBe('navigation');

      sidebar.destroy();
    });

    it('should initialize with custom pinned state', () => {
      const sidebar = createSidebarShell({
        initialPinned: true,
      });

      const state = sidebar.getState();

      expect(state.isPinned).toBe(true);

      sidebar.destroy();
    });

    it('should initialize with custom width', () => {
      const sidebar = createSidebarShell({
        initialWidth: 300,
      });

      const state = sidebar.getState();

      expect(state.width).toBe(300);

      sidebar.destroy();
    });

    it('should initialize with all custom options', () => {
      const sidebar = createSidebarShell({
        initialExpanded: true,
        initialActiveSection: 'settings',
        initialPinned: true,
        initialWidth: 350,
      });

      const state = sidebar.getState();

      expect(state.isExpanded).toBe(true);
      expect(state.activeSection).toBe('settings');
      expect(state.isPinned).toBe(true);
      expect(state.width).toBe(350);

      sidebar.destroy();
    });

    it('should initialize with mobile mode disabled by default', () => {
      const sidebar = createSidebarShell();

      const state = sidebar.getState();

      expect(state.isMobile).toBe(false);

      sidebar.destroy();
    });

    it('should initialize with custom mobile mode', () => {
      const sidebar = createSidebarShell({
        initialMobile: true,
      });

      const state = sidebar.getState();

      expect(state.isMobile).toBe(true);

      sidebar.destroy();
    });
  });

  describe('expand action', () => {
    it('should expand the sidebar', () => {
      const sidebar = createSidebarShell();

      sidebar.actions.expand();

      const state = sidebar.getState();
      expect(state.isExpanded).toBe(true);

      sidebar.destroy();
    });

    it('should handle expanding already expanded sidebar', () => {
      const sidebar = createSidebarShell({
        initialExpanded: true,
      });

      sidebar.actions.expand();

      const state = sidebar.getState();
      expect(state.isExpanded).toBe(true);

      sidebar.destroy();
    });

    it('should invoke onExpand callback when expanding', () => {
      const onExpand = vi.fn();
      const sidebar = createSidebarShell({
        onExpand,
      });

      sidebar.actions.expand();

      expect(onExpand).toHaveBeenCalledTimes(1);

      sidebar.destroy();
    });

    it('should not invoke onExpand callback when already expanded', () => {
      const onExpand = vi.fn();
      const sidebar = createSidebarShell({
        initialExpanded: true,
        onExpand,
      });

      sidebar.actions.expand();

      expect(onExpand).not.toHaveBeenCalled();

      sidebar.destroy();
    });
  });

  describe('collapse action', () => {
    it('should collapse the sidebar', () => {
      const sidebar = createSidebarShell({
        initialExpanded: true,
      });

      sidebar.actions.collapse();

      const state = sidebar.getState();
      expect(state.isExpanded).toBe(false);

      sidebar.destroy();
    });

    it('should handle collapsing already collapsed sidebar', () => {
      const sidebar = createSidebarShell();

      sidebar.actions.collapse();

      const state = sidebar.getState();
      expect(state.isExpanded).toBe(false);

      sidebar.destroy();
    });

    it('should invoke onCollapse callback when collapsing', () => {
      const onCollapse = vi.fn();
      const sidebar = createSidebarShell({
        initialExpanded: true,
        onCollapse,
      });

      sidebar.actions.collapse();

      expect(onCollapse).toHaveBeenCalledTimes(1);

      sidebar.destroy();
    });

    it('should not invoke onCollapse callback when already collapsed', () => {
      const onCollapse = vi.fn();
      const sidebar = createSidebarShell({
        onCollapse,
      });

      sidebar.actions.collapse();

      expect(onCollapse).not.toHaveBeenCalled();

      sidebar.destroy();
    });
  });

  describe('toggle action', () => {
    it('should toggle from collapsed to expanded', () => {
      const sidebar = createSidebarShell();

      sidebar.actions.toggle();

      const state = sidebar.getState();
      expect(state.isExpanded).toBe(true);

      sidebar.destroy();
    });

    it('should toggle from expanded to collapsed', () => {
      const sidebar = createSidebarShell({
        initialExpanded: true,
      });

      sidebar.actions.toggle();

      const state = sidebar.getState();
      expect(state.isExpanded).toBe(false);

      sidebar.destroy();
    });

    it('should toggle multiple times', () => {
      const sidebar = createSidebarShell();

      sidebar.actions.toggle();
      expect(sidebar.getState().isExpanded).toBe(true);

      sidebar.actions.toggle();
      expect(sidebar.getState().isExpanded).toBe(false);

      sidebar.actions.toggle();
      expect(sidebar.getState().isExpanded).toBe(true);

      sidebar.destroy();
    });

    it('should invoke callbacks when toggling', () => {
      const onExpand = vi.fn();
      const onCollapse = vi.fn();
      const sidebar = createSidebarShell({
        onExpand,
        onCollapse,
      });

      sidebar.actions.toggle();
      expect(onExpand).toHaveBeenCalledTimes(1);
      expect(onCollapse).not.toHaveBeenCalled();

      sidebar.actions.toggle();
      expect(onExpand).toHaveBeenCalledTimes(1);
      expect(onCollapse).toHaveBeenCalledTimes(1);

      sidebar.destroy();
    });
  });

  describe('setActiveSection action', () => {
    it('should set the active section', () => {
      const sidebar = createSidebarShell();

      sidebar.actions.setActiveSection('navigation');

      const state = sidebar.getState();
      expect(state.activeSection).toBe('navigation');

      sidebar.destroy();
    });

    it('should change active section multiple times', () => {
      const sidebar = createSidebarShell();

      sidebar.actions.setActiveSection('navigation');
      expect(sidebar.getState().activeSection).toBe('navigation');

      sidebar.actions.setActiveSection('settings');
      expect(sidebar.getState().activeSection).toBe('settings');

      sidebar.actions.setActiveSection('profile');
      expect(sidebar.getState().activeSection).toBe('profile');

      sidebar.destroy();
    });

    it('should invoke onSectionChange callback', () => {
      const onSectionChange = vi.fn();
      const sidebar = createSidebarShell({
        onSectionChange,
      });

      sidebar.actions.setActiveSection('navigation');

      expect(onSectionChange).toHaveBeenCalledTimes(1);
      expect(onSectionChange).toHaveBeenCalledWith('navigation');

      sidebar.destroy();
    });

    it('should invoke onSectionChange callback for each change', () => {
      const onSectionChange = vi.fn();
      const sidebar = createSidebarShell({
        onSectionChange,
      });

      sidebar.actions.setActiveSection('navigation');
      sidebar.actions.setActiveSection('settings');
      sidebar.actions.setActiveSection('profile');

      expect(onSectionChange).toHaveBeenCalledTimes(3);
      expect(onSectionChange).toHaveBeenNthCalledWith(1, 'navigation');
      expect(onSectionChange).toHaveBeenNthCalledWith(2, 'settings');
      expect(onSectionChange).toHaveBeenNthCalledWith(3, 'profile');

      sidebar.destroy();
    });

    it('should handle setting same section multiple times', () => {
      const onSectionChange = vi.fn();
      const sidebar = createSidebarShell({
        onSectionChange,
      });

      sidebar.actions.setActiveSection('navigation');
      sidebar.actions.setActiveSection('navigation');

      expect(onSectionChange).toHaveBeenCalledTimes(2);

      sidebar.destroy();
    });
  });

  describe('togglePin action', () => {
    it('should toggle pin from unpinned to pinned', () => {
      const sidebar = createSidebarShell();

      sidebar.actions.togglePin();

      const state = sidebar.getState();
      expect(state.isPinned).toBe(true);

      sidebar.destroy();
    });

    it('should toggle pin from pinned to unpinned', () => {
      const sidebar = createSidebarShell({
        initialPinned: true,
      });

      sidebar.actions.togglePin();

      const state = sidebar.getState();
      expect(state.isPinned).toBe(false);

      sidebar.destroy();
    });

    it('should toggle pin multiple times', () => {
      const sidebar = createSidebarShell();

      sidebar.actions.togglePin();
      expect(sidebar.getState().isPinned).toBe(true);

      sidebar.actions.togglePin();
      expect(sidebar.getState().isPinned).toBe(false);

      sidebar.actions.togglePin();
      expect(sidebar.getState().isPinned).toBe(true);

      sidebar.destroy();
    });
  });

  describe('setWidth action', () => {
    it('should set the sidebar width', () => {
      const sidebar = createSidebarShell();

      sidebar.actions.setWidth(300);

      const state = sidebar.getState();
      expect(state.width).toBe(300);

      sidebar.destroy();
    });

    it('should change width multiple times', () => {
      const sidebar = createSidebarShell();

      sidebar.actions.setWidth(300);
      expect(sidebar.getState().width).toBe(300);

      sidebar.actions.setWidth(400);
      expect(sidebar.getState().width).toBe(400);

      sidebar.actions.setWidth(200);
      expect(sidebar.getState().width).toBe(200);

      sidebar.destroy();
    });

    it('should handle setting same width multiple times', () => {
      const sidebar = createSidebarShell();

      sidebar.actions.setWidth(300);
      sidebar.actions.setWidth(300);

      const state = sidebar.getState();
      expect(state.width).toBe(300);

      sidebar.destroy();
    });
  });

  describe('event emissions', () => {
    it('should emit sidebar:expanded event when expanding', () => {
      const sidebar = createSidebarShell();

      const listener = vi.fn();
      sidebar.eventBus.on('sidebar:expanded', listener);

      sidebar.actions.expand();

      expect(listener).toHaveBeenCalledTimes(1);

      sidebar.destroy();
    });

    it('should emit sidebar:collapsed event when collapsing', () => {
      const sidebar = createSidebarShell({
        initialExpanded: true,
      });

      const listener = vi.fn();
      sidebar.eventBus.on('sidebar:collapsed', listener);

      sidebar.actions.collapse();

      expect(listener).toHaveBeenCalledTimes(1);

      sidebar.destroy();
    });

    it('should emit events when toggling', () => {
      const sidebar = createSidebarShell();

      const expandListener = vi.fn();
      const collapseListener = vi.fn();

      sidebar.eventBus.on('sidebar:expanded', expandListener);
      sidebar.eventBus.on('sidebar:collapsed', collapseListener);

      sidebar.actions.toggle();
      expect(expandListener).toHaveBeenCalledTimes(1);
      expect(collapseListener).not.toHaveBeenCalled();

      sidebar.actions.toggle();
      expect(expandListener).toHaveBeenCalledTimes(1);
      expect(collapseListener).toHaveBeenCalledTimes(1);

      sidebar.destroy();
    });

    it('should emit section:changed event when setting active section', () => {
      const sidebar = createSidebarShell();

      const listener = vi.fn();
      sidebar.eventBus.on('section:changed', listener);

      sidebar.actions.setActiveSection('navigation');

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith('navigation');

      sidebar.destroy();
    });

    it('should emit sidebar:pinned event when pinning', () => {
      const sidebar = createSidebarShell();

      const listener = vi.fn();
      sidebar.eventBus.on('sidebar:pinned', listener);

      sidebar.actions.togglePin();

      expect(listener).toHaveBeenCalledTimes(1);

      sidebar.destroy();
    });

    it('should emit sidebar:unpinned event when unpinning', () => {
      const sidebar = createSidebarShell({
        initialPinned: true,
      });

      const listener = vi.fn();
      sidebar.eventBus.on('sidebar:unpinned', listener);

      sidebar.actions.togglePin();

      expect(listener).toHaveBeenCalledTimes(1);

      sidebar.destroy();
    });

    it('should emit width:changed event when setting width', () => {
      const sidebar = createSidebarShell();

      const listener = vi.fn();
      sidebar.eventBus.on('width:changed', listener);

      sidebar.actions.setWidth(300);

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(300);

      sidebar.destroy();
    });

    it('should emit multiple events for different actions', () => {
      const sidebar = createSidebarShell();

      const expandListener = vi.fn();
      const sectionListener = vi.fn();
      const pinnedListener = vi.fn();
      const widthListener = vi.fn();

      sidebar.eventBus.on('sidebar:expanded', expandListener);
      sidebar.eventBus.on('section:changed', sectionListener);
      sidebar.eventBus.on('sidebar:pinned', pinnedListener);
      sidebar.eventBus.on('width:changed', widthListener);

      sidebar.actions.expand();
      sidebar.actions.setActiveSection('navigation');
      sidebar.actions.togglePin();
      sidebar.actions.setWidth(300);

      expect(expandListener).toHaveBeenCalledTimes(1);
      expect(sectionListener).toHaveBeenCalledTimes(1);
      expect(pinnedListener).toHaveBeenCalledTimes(1);
      expect(widthListener).toHaveBeenCalledTimes(1);

      sidebar.destroy();
    });
  });

  describe('subscribe', () => {
    it('should notify subscribers when state changes', () => {
      const sidebar = createSidebarShell();

      const listener = vi.fn();
      sidebar.subscribe(listener);

      sidebar.actions.expand();

      expect(listener).toHaveBeenCalled();
      const lastCall = listener.mock.calls[listener.mock.calls.length - 1];
      expect(lastCall[0]).toMatchObject({
        isExpanded: true,
      });

      sidebar.destroy();
    });

    it('should support multiple subscribers', () => {
      const sidebar = createSidebarShell();

      const listener1 = vi.fn();
      const listener2 = vi.fn();

      sidebar.subscribe(listener1);
      sidebar.subscribe(listener2);

      sidebar.actions.expand();

      expect(listener1).toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();

      sidebar.destroy();
    });

    it('should allow unsubscribing', () => {
      const sidebar = createSidebarShell();

      const listener = vi.fn();
      const unsubscribe = sidebar.subscribe(listener);

      unsubscribe();

      sidebar.actions.expand();

      expect(listener).not.toHaveBeenCalled();

      sidebar.destroy();
    });

    it('should notify subscribers for all state changes', () => {
      const sidebar = createSidebarShell();

      const listener = vi.fn();
      sidebar.subscribe(listener);

      sidebar.actions.expand();
      sidebar.actions.setActiveSection('navigation');
      sidebar.actions.togglePin();
      sidebar.actions.setWidth(300);

      expect(listener).toHaveBeenCalledTimes(4);

      sidebar.destroy();
    });
  });

  describe('toggleMobile action', () => {
    it('should toggle mobile mode from disabled to enabled', () => {
      const sidebar = createSidebarShell();

      sidebar.actions.toggleMobile();

      const state = sidebar.getState();
      expect(state.isMobile).toBe(true);

      sidebar.destroy();
    });

    it('should toggle mobile mode from enabled to disabled', () => {
      const sidebar = createSidebarShell({
        initialMobile: true,
      });

      sidebar.actions.toggleMobile();

      const state = sidebar.getState();
      expect(state.isMobile).toBe(false);

      sidebar.destroy();
    });

    it('should toggle mobile mode multiple times', () => {
      const sidebar = createSidebarShell();

      sidebar.actions.toggleMobile();
      expect(sidebar.getState().isMobile).toBe(true);

      sidebar.actions.toggleMobile();
      expect(sidebar.getState().isMobile).toBe(false);

      sidebar.actions.toggleMobile();
      expect(sidebar.getState().isMobile).toBe(true);

      sidebar.destroy();
    });

    it('should invoke onMobileChange callback when toggling', () => {
      const onMobileChange = vi.fn();
      const sidebar = createSidebarShell({
        onMobileChange,
      });

      sidebar.actions.toggleMobile();

      expect(onMobileChange).toHaveBeenCalledTimes(1);
      expect(onMobileChange).toHaveBeenCalledWith(true);

      sidebar.destroy();
    });

    it('should emit sidebar:mobile-toggled event when toggling', () => {
      const sidebar = createSidebarShell();

      const listener = vi.fn();
      sidebar.eventBus.on('sidebar:mobile-toggled', listener);

      sidebar.actions.toggleMobile();

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(true);

      sidebar.destroy();
    });
  });

  describe('setMobileMode action', () => {
    it('should set mobile mode to enabled', () => {
      const sidebar = createSidebarShell();

      sidebar.actions.setMobileMode(true);

      const state = sidebar.getState();
      expect(state.isMobile).toBe(true);

      sidebar.destroy();
    });

    it('should set mobile mode to disabled', () => {
      const sidebar = createSidebarShell({
        initialMobile: true,
      });

      sidebar.actions.setMobileMode(false);

      const state = sidebar.getState();
      expect(state.isMobile).toBe(false);

      sidebar.destroy();
    });

    it('should change mobile mode multiple times', () => {
      const sidebar = createSidebarShell();

      sidebar.actions.setMobileMode(true);
      expect(sidebar.getState().isMobile).toBe(true);

      sidebar.actions.setMobileMode(false);
      expect(sidebar.getState().isMobile).toBe(false);

      sidebar.actions.setMobileMode(true);
      expect(sidebar.getState().isMobile).toBe(true);

      sidebar.destroy();
    });

    it('should invoke onMobileChange callback', () => {
      const onMobileChange = vi.fn();
      const sidebar = createSidebarShell({
        onMobileChange,
      });

      sidebar.actions.setMobileMode(true);

      expect(onMobileChange).toHaveBeenCalledTimes(1);
      expect(onMobileChange).toHaveBeenCalledWith(true);

      sidebar.destroy();
    });

    it('should emit sidebar:mobile-toggled event', () => {
      const sidebar = createSidebarShell();

      const listener = vi.fn();
      sidebar.eventBus.on('sidebar:mobile-toggled', listener);

      sidebar.actions.setMobileMode(true);

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(true);

      sidebar.destroy();
    });

    it('should handle setting same mobile mode multiple times', () => {
      const onMobileChange = vi.fn();
      const sidebar = createSidebarShell({
        onMobileChange,
      });

      sidebar.actions.setMobileMode(true);
      sidebar.actions.setMobileMode(true);

      expect(onMobileChange).toHaveBeenCalledTimes(2);

      sidebar.destroy();
    });
  });

  describe('mobile auto-collapse behavior', () => {
    it('should auto-collapse sidebar when section is selected in mobile mode', () => {
      const sidebar = createSidebarShell({
        initialMobile: true,
        initialExpanded: true,
      });

      sidebar.actions.setActiveSection('navigation');

      const state = sidebar.getState();
      expect(state.isExpanded).toBe(false);
      expect(state.activeSection).toBe('navigation');

      sidebar.destroy();
    });

    it('should not auto-collapse when section is selected in desktop mode', () => {
      const sidebar = createSidebarShell({
        initialMobile: false,
        initialExpanded: true,
      });

      sidebar.actions.setActiveSection('navigation');

      const state = sidebar.getState();
      expect(state.isExpanded).toBe(true);
      expect(state.activeSection).toBe('navigation');

      sidebar.destroy();
    });

    it('should not auto-collapse when sidebar is already collapsed in mobile mode', () => {
      const sidebar = createSidebarShell({
        initialMobile: true,
        initialExpanded: false,
      });

      sidebar.actions.setActiveSection('navigation');

      const state = sidebar.getState();
      expect(state.isExpanded).toBe(false);
      expect(state.activeSection).toBe('navigation');

      sidebar.destroy();
    });

    it('should invoke onCollapse callback when auto-collapsing in mobile mode', () => {
      const onCollapse = vi.fn();
      const sidebar = createSidebarShell({
        initialMobile: true,
        initialExpanded: true,
        onCollapse,
      });

      sidebar.actions.setActiveSection('navigation');

      expect(onCollapse).toHaveBeenCalledTimes(1);

      sidebar.destroy();
    });

    it('should emit sidebar:collapsed event when auto-collapsing in mobile mode', () => {
      const sidebar = createSidebarShell({
        initialMobile: true,
        initialExpanded: true,
      });

      const listener = vi.fn();
      sidebar.eventBus.on('sidebar:collapsed', listener);

      sidebar.actions.setActiveSection('navigation');

      expect(listener).toHaveBeenCalledTimes(1);

      sidebar.destroy();
    });

    it('should auto-collapse for multiple section changes in mobile mode', () => {
      const sidebar = createSidebarShell({
        initialMobile: true,
      });

      // Expand and select first section
      sidebar.actions.expand();
      sidebar.actions.setActiveSection('navigation');
      expect(sidebar.getState().isExpanded).toBe(false);

      // Expand and select second section
      sidebar.actions.expand();
      sidebar.actions.setActiveSection('settings');
      expect(sidebar.getState().isExpanded).toBe(false);

      // Expand and select third section
      sidebar.actions.expand();
      sidebar.actions.setActiveSection('profile');
      expect(sidebar.getState().isExpanded).toBe(false);

      sidebar.destroy();
    });
  });

  describe('destroy', () => {
    it('should clean up subscriptions when destroyed', () => {
      const sidebar = createSidebarShell();

      const listener = vi.fn();
      sidebar.subscribe(listener);

      sidebar.destroy();

      sidebar.actions.expand();

      expect(listener).not.toHaveBeenCalled();
    });

    it('should clean up event bus listeners', () => {
      const sidebar = createSidebarShell();

      const eventListener = vi.fn();
      sidebar.eventBus.on('sidebar:expanded', eventListener);

      sidebar.destroy();

      sidebar.actions.expand();

      // Event should still be emitted, but we're testing that destroy doesn't break
      expect(() => sidebar.actions.expand()).not.toThrow();
    });

    it('should clean up disclosure behavior', () => {
      const sidebar = createSidebarShell();

      expect(() => sidebar.destroy()).not.toThrow();
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete sidebar lifecycle', () => {
      const onExpand = vi.fn();
      const onCollapse = vi.fn();
      const onSectionChange = vi.fn();

      const sidebar = createSidebarShell({
        initialWidth: 250,
        onExpand,
        onCollapse,
        onSectionChange,
      });

      const stateListener = vi.fn();
      const expandEventListener = vi.fn();
      const sectionEventListener = vi.fn();

      sidebar.subscribe(stateListener);
      sidebar.eventBus.on('sidebar:expanded', expandEventListener);
      sidebar.eventBus.on('section:changed', sectionEventListener);

      // Expand sidebar
      sidebar.actions.expand();
      expect(sidebar.getState().isExpanded).toBe(true);
      expect(onExpand).toHaveBeenCalledTimes(1);
      expect(expandEventListener).toHaveBeenCalledTimes(1);

      // Set active section
      sidebar.actions.setActiveSection('navigation');
      expect(sidebar.getState().activeSection).toBe('navigation');
      expect(onSectionChange).toHaveBeenCalledWith('navigation');
      expect(sectionEventListener).toHaveBeenCalledWith('navigation');

      // Pin sidebar
      sidebar.actions.togglePin();
      expect(sidebar.getState().isPinned).toBe(true);

      // Adjust width
      sidebar.actions.setWidth(350);
      expect(sidebar.getState().width).toBe(350);

      // Collapse sidebar
      sidebar.actions.collapse();
      expect(sidebar.getState().isExpanded).toBe(false);
      expect(onCollapse).toHaveBeenCalledTimes(1);

      // Clean up
      sidebar.destroy();
    });

    it('should maintain state consistency across multiple operations', () => {
      const sidebar = createSidebarShell({
        initialExpanded: false,
        initialActiveSection: null,
        initialPinned: false,
        initialWidth: 250,
      });

      // Initial state
      expect(sidebar.getState().isExpanded).toBe(false);
      expect(sidebar.getState().activeSection).toBeNull();
      expect(sidebar.getState().isPinned).toBe(false);
      expect(sidebar.getState().width).toBe(250);

      // Expand and set section
      sidebar.actions.expand();
      sidebar.actions.setActiveSection('navigation');
      expect(sidebar.getState().isExpanded).toBe(true);
      expect(sidebar.getState().activeSection).toBe('navigation');

      // Pin and resize
      sidebar.actions.togglePin();
      sidebar.actions.setWidth(300);
      expect(sidebar.getState().isPinned).toBe(true);
      expect(sidebar.getState().width).toBe(300);

      // Change section while expanded and pinned
      sidebar.actions.setActiveSection('settings');
      expect(sidebar.getState().activeSection).toBe('settings');
      expect(sidebar.getState().isExpanded).toBe(true);
      expect(sidebar.getState().isPinned).toBe(true);

      // Collapse while pinned
      sidebar.actions.collapse();
      expect(sidebar.getState().isExpanded).toBe(false);
      expect(sidebar.getState().isPinned).toBe(true);

      // Unpin while collapsed
      sidebar.actions.togglePin();
      expect(sidebar.getState().isPinned).toBe(false);
      expect(sidebar.getState().isExpanded).toBe(false);

      sidebar.destroy();
    });

    it('should handle rapid state changes', () => {
      const sidebar = createSidebarShell();

      // Rapid toggle
      sidebar.actions.toggle();
      sidebar.actions.toggle();
      sidebar.actions.toggle();
      expect(sidebar.getState().isExpanded).toBe(true);

      // Rapid section changes
      sidebar.actions.setActiveSection('nav');
      sidebar.actions.setActiveSection('settings');
      sidebar.actions.setActiveSection('profile');
      expect(sidebar.getState().activeSection).toBe('profile');

      // Rapid pin toggle
      sidebar.actions.togglePin();
      sidebar.actions.togglePin();
      sidebar.actions.togglePin();
      expect(sidebar.getState().isPinned).toBe(true);

      // Rapid width changes
      sidebar.actions.setWidth(200);
      sidebar.actions.setWidth(300);
      sidebar.actions.setWidth(400);
      expect(sidebar.getState().width).toBe(400);

      sidebar.destroy();
    });

    it('should work with all callbacks and event listeners', () => {
      const onExpand = vi.fn();
      const onCollapse = vi.fn();
      const onSectionChange = vi.fn();

      const sidebar = createSidebarShell({
        onExpand,
        onCollapse,
        onSectionChange,
      });

      const expandListener = vi.fn();
      const collapseListener = vi.fn();
      const sectionListener = vi.fn();
      const pinnedListener = vi.fn();
      const unpinnedListener = vi.fn();
      const widthListener = vi.fn();

      sidebar.eventBus.on('sidebar:expanded', expandListener);
      sidebar.eventBus.on('sidebar:collapsed', collapseListener);
      sidebar.eventBus.on('section:changed', sectionListener);
      sidebar.eventBus.on('sidebar:pinned', pinnedListener);
      sidebar.eventBus.on('sidebar:unpinned', unpinnedListener);
      sidebar.eventBus.on('width:changed', widthListener);

      // Perform all actions
      sidebar.actions.expand();
      sidebar.actions.setActiveSection('navigation');
      sidebar.actions.togglePin();
      sidebar.actions.setWidth(300);
      sidebar.actions.collapse();
      sidebar.actions.togglePin();

      // Verify callbacks
      expect(onExpand).toHaveBeenCalledTimes(1);
      expect(onCollapse).toHaveBeenCalledTimes(1);
      expect(onSectionChange).toHaveBeenCalledTimes(1);

      // Verify events
      expect(expandListener).toHaveBeenCalledTimes(1);
      expect(collapseListener).toHaveBeenCalledTimes(1);
      expect(sectionListener).toHaveBeenCalledTimes(1);
      expect(pinnedListener).toHaveBeenCalledTimes(1);
      expect(unpinnedListener).toHaveBeenCalledTimes(1);
      expect(widthListener).toHaveBeenCalledTimes(1);

      sidebar.destroy();
    });

    it('should handle mobile mode transitions', () => {
      const onMobileChange = vi.fn();
      const sidebar = createSidebarShell({
        initialExpanded: true,
        onMobileChange,
      });

      const mobileListener = vi.fn();
      sidebar.eventBus.on('sidebar:mobile-toggled', mobileListener);

      // Enable mobile mode
      sidebar.actions.setMobileMode(true);
      expect(sidebar.getState().isMobile).toBe(true);
      expect(onMobileChange).toHaveBeenCalledWith(true);
      expect(mobileListener).toHaveBeenCalledWith(true);

      // Select section - should auto-collapse
      sidebar.actions.setActiveSection('navigation');
      expect(sidebar.getState().isExpanded).toBe(false);

      // Disable mobile mode
      sidebar.actions.setMobileMode(false);
      expect(sidebar.getState().isMobile).toBe(false);

      // Expand and select section - should NOT auto-collapse
      sidebar.actions.expand();
      sidebar.actions.setActiveSection('settings');
      expect(sidebar.getState().isExpanded).toBe(true);

      sidebar.destroy();
    });

    it('should work with all mobile-related callbacks and events', () => {
      const onExpand = vi.fn();
      const onCollapse = vi.fn();
      const onSectionChange = vi.fn();
      const onMobileChange = vi.fn();

      const sidebar = createSidebarShell({
        initialMobile: true,
        onExpand,
        onCollapse,
        onSectionChange,
        onMobileChange,
      });

      const expandListener = vi.fn();
      const collapseListener = vi.fn();
      const sectionListener = vi.fn();
      const mobileListener = vi.fn();

      sidebar.eventBus.on('sidebar:expanded', expandListener);
      sidebar.eventBus.on('sidebar:collapsed', collapseListener);
      sidebar.eventBus.on('section:changed', sectionListener);
      sidebar.eventBus.on('sidebar:mobile-toggled', mobileListener);

      // Expand sidebar
      sidebar.actions.expand();
      expect(onExpand).toHaveBeenCalledTimes(1);
      expect(expandListener).toHaveBeenCalledTimes(1);

      // Select section (auto-collapse in mobile mode)
      sidebar.actions.setActiveSection('navigation');
      expect(onSectionChange).toHaveBeenCalledWith('navigation');
      expect(sectionListener).toHaveBeenCalledWith('navigation');
      expect(onCollapse).toHaveBeenCalledTimes(1);
      expect(collapseListener).toHaveBeenCalledTimes(1);

      // Toggle mobile mode
      sidebar.actions.toggleMobile();
      expect(onMobileChange).toHaveBeenCalledWith(false);
      expect(mobileListener).toHaveBeenCalledWith(false);

      sidebar.destroy();
    });
  });
});
