import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createFloatingActionButton } from '../floating-action-button';

describe('createFloatingActionButton', () => {
  describe('initialization', () => {
    it('should initialize with default state', () => {
      const fab = createFloatingActionButton();
      const state = fab.getState();

      expect(state.isVisible).toBe(false);
      expect(state.scrollPosition).toBe(0);
      expect(state.scrollDirection).toBe(null);
      expect(state.scrollThreshold).toBe(100);
      expect(state.hideOnScrollDown).toBe(false);

      fab.destroy();
    });

    it('should initialize with custom options', () => {
      const fab = createFloatingActionButton({
        scrollThreshold: 200,
        hideOnScrollDown: true,
      });
      const state = fab.getState();

      expect(state.scrollThreshold).toBe(200);
      expect(state.hideOnScrollDown).toBe(true);

      fab.destroy();
    });
  });

  describe('show/hide actions', () => {
    it('should show the FAB', () => {
      const fab = createFloatingActionButton();

      fab.actions.show();

      expect(fab.getState().isVisible).toBe(true);

      fab.destroy();
    });

    it('should hide the FAB', () => {
      const fab = createFloatingActionButton();

      fab.actions.show();
      fab.actions.hide();

      expect(fab.getState().isVisible).toBe(false);

      fab.destroy();
    });

    it('should not emit events when showing already visible FAB', () => {
      const fab = createFloatingActionButton();
      const listener = vi.fn();

      fab.eventBus.on('fab:shown', listener);

      fab.actions.show();
      fab.actions.show(); // Second call should not emit

      expect(listener).toHaveBeenCalledTimes(1);

      fab.destroy();
    });

    it('should not emit events when hiding already hidden FAB', () => {
      const fab = createFloatingActionButton();
      const listener = vi.fn();

      fab.eventBus.on('fab:hidden', listener);

      fab.actions.hide();
      fab.actions.hide(); // Second call should not emit

      expect(listener).toHaveBeenCalledTimes(0);

      fab.destroy();
    });

    it('should toggle visibility', () => {
      const fab = createFloatingActionButton();

      fab.actions.toggle();
      expect(fab.getState().isVisible).toBe(true);

      fab.actions.toggle();
      expect(fab.getState().isVisible).toBe(false);

      fab.destroy();
    });
  });

  describe('threshold configuration', () => {
    it('should update scroll threshold', () => {
      const fab = createFloatingActionButton({ scrollThreshold: 100 });

      fab.actions.setScrollThreshold(300);

      expect(fab.getState().scrollThreshold).toBe(300);

      fab.destroy();
    });

    it('should warn when setting negative threshold', () => {
      const fab = createFloatingActionButton();
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      fab.actions.setScrollThreshold(-50);

      expect(consoleSpy).toHaveBeenCalledWith('Scroll threshold must be non-negative');
      expect(fab.getState().scrollThreshold).toBe(100); // Should remain unchanged

      consoleSpy.mockRestore();
      fab.destroy();
    });

    it('should re-evaluate visibility when threshold changes', () => {
      const fab = createFloatingActionButton({ scrollThreshold: 100 });

      // Scroll past initial threshold
      fab.actions.setScrollPosition(150);
      expect(fab.getState().isVisible).toBe(true);

      // Increase threshold above current position
      fab.actions.setScrollThreshold(200);
      expect(fab.getState().isVisible).toBe(false);

      fab.destroy();
    });

    it('should accept zero as valid threshold', () => {
      const fab = createFloatingActionButton();

      fab.actions.setScrollThreshold(0);

      expect(fab.getState().scrollThreshold).toBe(0);

      fab.destroy();
    });
  });

  describe('visibility callback invocation', () => {
    it('should invoke callback when visibility changes to true', () => {
      const onVisibilityChange = vi.fn();
      const fab = createFloatingActionButton({
        scrollThreshold: 100,
        onVisibilityChange,
      });

      fab.actions.setScrollPosition(150);

      expect(onVisibilityChange).toHaveBeenCalledWith(true);
      expect(onVisibilityChange).toHaveBeenCalledTimes(1);

      fab.destroy();
    });

    it('should invoke callback when visibility changes to false', () => {
      const onVisibilityChange = vi.fn();
      const fab = createFloatingActionButton({
        scrollThreshold: 100,
        onVisibilityChange,
      });

      fab.actions.setScrollPosition(150);
      onVisibilityChange.mockClear();

      fab.actions.setScrollPosition(50);

      expect(onVisibilityChange).toHaveBeenCalledWith(false);
      expect(onVisibilityChange).toHaveBeenCalledTimes(1);

      fab.destroy();
    });

    it('should invoke callback on manual show/hide', () => {
      const onVisibilityChange = vi.fn();
      const fab = createFloatingActionButton({ onVisibilityChange });

      fab.actions.show();
      expect(onVisibilityChange).toHaveBeenCalledWith(true);

      fab.actions.hide();
      expect(onVisibilityChange).toHaveBeenCalledWith(false);

      expect(onVisibilityChange).toHaveBeenCalledTimes(2);

      fab.destroy();
    });

    it('should not invoke callback when visibility does not change', () => {
      const onVisibilityChange = vi.fn();
      const fab = createFloatingActionButton({
        scrollThreshold: 100,
        onVisibilityChange,
      });

      fab.actions.setScrollPosition(50);
      fab.actions.setScrollPosition(60);

      // Callback should not be called since visibility remained false
      expect(onVisibilityChange).toHaveBeenCalledTimes(0);

      fab.destroy();
    });
  });

  describe('event emission', () => {
    it('should emit fab:shown event', () => {
      const fab = createFloatingActionButton();
      const listener = vi.fn();

      fab.eventBus.on('fab:shown', listener);
      fab.actions.show();

      expect(listener).toHaveBeenCalledTimes(1);

      fab.destroy();
    });

    it('should emit fab:hidden event', () => {
      const fab = createFloatingActionButton();
      const listener = vi.fn();

      fab.eventBus.on('fab:hidden', listener);
      fab.actions.show();
      fab.actions.hide();

      expect(listener).toHaveBeenCalledTimes(1);

      fab.destroy();
    });

    it('should emit fab:visibility-changed event', () => {
      const fab = createFloatingActionButton();
      const listener = vi.fn();

      fab.eventBus.on('fab:visibility-changed', listener);

      fab.actions.show();
      expect(listener).toHaveBeenCalledWith(true);

      fab.actions.hide();
      expect(listener).toHaveBeenCalledWith(false);

      expect(listener).toHaveBeenCalledTimes(2);

      fab.destroy();
    });

    it('should emit fab:scroll-direction-changed event', () => {
      const fab = createFloatingActionButton();
      const listener = vi.fn();

      fab.eventBus.on('fab:scroll-direction-changed', listener);

      fab.actions.setScrollPosition(100);
      expect(listener).toHaveBeenCalledWith('down');

      fab.actions.setScrollPosition(50);
      expect(listener).toHaveBeenCalledWith('up');

      expect(listener).toHaveBeenCalledTimes(2);

      fab.destroy();
    });

    it('should not emit scroll direction event when direction is null', () => {
      const fab = createFloatingActionButton();
      const listener = vi.fn();

      fab.eventBus.on('fab:scroll-direction-changed', listener);

      fab.actions.setScrollPosition(100);
      fab.actions.setScrollPosition(100); // Same position

      // Should only emit once (for the first change)
      expect(listener).toHaveBeenCalledTimes(1);

      fab.destroy();
    });
  });

  describe('scroll position tracking', () => {
    it('should track scroll position', () => {
      const fab = createFloatingActionButton();

      fab.actions.setScrollPosition(250);

      expect(fab.getState().scrollPosition).toBe(250);

      fab.destroy();
    });

    it('should detect scroll direction down', () => {
      const fab = createFloatingActionButton();

      fab.actions.setScrollPosition(100);
      fab.actions.setScrollPosition(200);

      expect(fab.getState().scrollDirection).toBe('down');

      fab.destroy();
    });

    it('should detect scroll direction up', () => {
      const fab = createFloatingActionButton();

      fab.actions.setScrollPosition(200);
      fab.actions.setScrollPosition(100);

      expect(fab.getState().scrollDirection).toBe('up');

      fab.destroy();
    });

    it('should set direction to null when position is same', () => {
      const fab = createFloatingActionButton();

      fab.actions.setScrollPosition(100);
      fab.actions.setScrollPosition(100);

      expect(fab.getState().scrollDirection).toBe(null);

      fab.destroy();
    });
  });

  describe('hideOnScrollDown behavior', () => {
    it('should hide FAB when scrolling down with hideOnScrollDown enabled', () => {
      const fab = createFloatingActionButton({
        scrollThreshold: 50,
        hideOnScrollDown: true,
      });

      // Scroll past threshold (scrolling down from 0)
      fab.actions.setScrollPosition(100);
      // Should be hidden because we scrolled down
      expect(fab.getState().isVisible).toBe(false);

      // Scroll up to show it
      fab.actions.setScrollPosition(80);
      expect(fab.getState().isVisible).toBe(true);

      // Scroll down further - should hide again
      fab.actions.setScrollPosition(150);
      expect(fab.getState().isVisible).toBe(false);

      fab.destroy();
    });

    it('should show FAB when scrolling up with hideOnScrollDown enabled', () => {
      const fab = createFloatingActionButton({
        scrollThreshold: 50,
        hideOnScrollDown: true,
      });

      // Scroll down past threshold
      fab.actions.setScrollPosition(100);
      fab.actions.setScrollPosition(150);
      expect(fab.getState().isVisible).toBe(false);

      // Scroll up
      fab.actions.setScrollPosition(100);
      expect(fab.getState().isVisible).toBe(true);

      fab.destroy();
    });

    it('should not hide on scroll down when hideOnScrollDown is disabled', () => {
      const fab = createFloatingActionButton({
        scrollThreshold: 50,
        hideOnScrollDown: false,
      });

      fab.actions.setScrollPosition(100);
      expect(fab.getState().isVisible).toBe(true);

      fab.actions.setScrollPosition(150);
      expect(fab.getState().isVisible).toBe(true); // Should remain visible

      fab.destroy();
    });

    it('should update hideOnScrollDown setting', () => {
      const fab = createFloatingActionButton({
        scrollThreshold: 50,
        hideOnScrollDown: false,
      });

      fab.actions.setHideOnScrollDown(true);

      expect(fab.getState().hideOnScrollDown).toBe(true);

      fab.destroy();
    });

    it('should re-evaluate visibility when hideOnScrollDown changes', () => {
      const fab = createFloatingActionButton({
        scrollThreshold: 50,
        hideOnScrollDown: false,
      });

      // Scroll down past threshold
      fab.actions.setScrollPosition(100);
      fab.actions.setScrollPosition(150);
      expect(fab.getState().isVisible).toBe(true);

      // Enable hideOnScrollDown and scroll down again
      fab.actions.setHideOnScrollDown(true);
      fab.actions.setScrollPosition(200);
      expect(fab.getState().isVisible).toBe(false);

      fab.destroy();
    });
  });

  describe('threshold-based visibility', () => {
    it('should show FAB when scrolling past threshold', () => {
      const fab = createFloatingActionButton({ scrollThreshold: 100 });

      fab.actions.setScrollPosition(150);

      expect(fab.getState().isVisible).toBe(true);

      fab.destroy();
    });

    it('should hide FAB when scrolling below threshold', () => {
      const fab = createFloatingActionButton({ scrollThreshold: 100 });

      fab.actions.setScrollPosition(150);
      fab.actions.setScrollPosition(50);

      expect(fab.getState().isVisible).toBe(false);

      fab.destroy();
    });

    it('should show FAB when exactly at threshold', () => {
      const fab = createFloatingActionButton({ scrollThreshold: 100 });

      fab.actions.setScrollPosition(100);

      expect(fab.getState().isVisible).toBe(true);

      fab.destroy();
    });

    it('should hide FAB when one pixel below threshold', () => {
      const fab = createFloatingActionButton({ scrollThreshold: 100 });

      fab.actions.setScrollPosition(99);

      expect(fab.getState().isVisible).toBe(false);

      fab.destroy();
    });
  });

  describe('subscription', () => {
    it('should notify subscribers of state changes', () => {
      const fab = createFloatingActionButton();
      const listener = vi.fn();

      fab.subscribe(listener);
      fab.actions.show();

      expect(listener).toHaveBeenCalled();
      expect(listener.mock.calls[0][0].isVisible).toBe(true);

      fab.destroy();
    });

    it('should allow unsubscribing', () => {
      const fab = createFloatingActionButton();
      const listener = vi.fn();

      const unsubscribe = fab.subscribe(listener);
      unsubscribe();

      fab.actions.show();

      expect(listener).toHaveBeenCalledTimes(0);

      fab.destroy();
    });
  });

  describe('destroy', () => {
    it('should clean up resources', () => {
      const fab = createFloatingActionButton();
      const listener = vi.fn();

      fab.subscribe(listener);
      fab.destroy();

      // After destroy, actions should not trigger subscriptions
      fab.actions.show();

      expect(listener).toHaveBeenCalledTimes(0);
    });
  });

  describe('edge cases', () => {
    it('should handle rapid scroll position changes', () => {
      const fab = createFloatingActionButton({ scrollThreshold: 100 });

      for (let i = 0; i < 100; i++) {
        fab.actions.setScrollPosition(i * 10);
      }

      const state = fab.getState();
      expect(state.scrollPosition).toBe(990);
      expect(state.isVisible).toBe(true);

      fab.destroy();
    });

    it('should handle very large scroll positions', () => {
      const fab = createFloatingActionButton({ scrollThreshold: 100 });

      fab.actions.setScrollPosition(999999);

      expect(fab.getState().scrollPosition).toBe(999999);
      expect(fab.getState().isVisible).toBe(true);

      fab.destroy();
    });

    it('should handle scroll position of zero', () => {
      const fab = createFloatingActionButton({ scrollThreshold: 0 });

      fab.actions.setScrollPosition(0);

      expect(fab.getState().isVisible).toBe(true);

      fab.destroy();
    });
  });
});
