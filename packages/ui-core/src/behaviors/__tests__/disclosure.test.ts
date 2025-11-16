import { describe, it, expect, vi } from 'vitest';
import { createDisclosureBehavior } from '../disclosure';

describe('createDisclosureBehavior', () => {
  describe('initial state', () => {
    it('should initialize with collapsed state by default', () => {
      const disclosure = createDisclosureBehavior();
      const state = disclosure.getState();

      expect(state.isExpanded).toBe(false);
      expect(state.id).toBeNull();
    });

    it('should initialize with provided id', () => {
      const disclosure = createDisclosureBehavior({ id: 'test-disclosure' });
      const state = disclosure.getState();

      expect(state.id).toBe('test-disclosure');
      expect(state.isExpanded).toBe(false);
    });

    it('should initialize with expanded state when specified', () => {
      const disclosure = createDisclosureBehavior({ initialExpanded: true });
      const state = disclosure.getState();

      expect(state.isExpanded).toBe(true);
    });

    it('should initialize with both id and expanded state', () => {
      const disclosure = createDisclosureBehavior({
        id: 'accordion-panel-1',
        initialExpanded: true,
      });
      const state = disclosure.getState();

      expect(state.id).toBe('accordion-panel-1');
      expect(state.isExpanded).toBe(true);
    });
  });

  describe('expand action', () => {
    it('should expand when collapsed', () => {
      const disclosure = createDisclosureBehavior();

      disclosure.actions.expand();
      const state = disclosure.getState();

      expect(state.isExpanded).toBe(true);
    });

    it('should remain expanded when already expanded', () => {
      const disclosure = createDisclosureBehavior({ initialExpanded: true });

      disclosure.actions.expand();
      const state = disclosure.getState();

      expect(state.isExpanded).toBe(true);
    });

    it('should invoke onExpand callback when expanding', () => {
      const onExpand = vi.fn();
      const disclosure = createDisclosureBehavior({ onExpand });

      disclosure.actions.expand();

      expect(onExpand).toHaveBeenCalledTimes(1);
    });

    it('should not invoke onExpand callback when already expanded', () => {
      const onExpand = vi.fn();
      const disclosure = createDisclosureBehavior({
        initialExpanded: true,
        onExpand,
      });

      disclosure.actions.expand();

      expect(onExpand).not.toHaveBeenCalled();
    });
  });

  describe('collapse action', () => {
    it('should collapse when expanded', () => {
      const disclosure = createDisclosureBehavior({ initialExpanded: true });

      disclosure.actions.collapse();
      const state = disclosure.getState();

      expect(state.isExpanded).toBe(false);
    });

    it('should remain collapsed when already collapsed', () => {
      const disclosure = createDisclosureBehavior();

      disclosure.actions.collapse();
      const state = disclosure.getState();

      expect(state.isExpanded).toBe(false);
    });

    it('should invoke onCollapse callback when collapsing', () => {
      const onCollapse = vi.fn();
      const disclosure = createDisclosureBehavior({
        initialExpanded: true,
        onCollapse,
      });

      disclosure.actions.collapse();

      expect(onCollapse).toHaveBeenCalledTimes(1);
    });

    it('should not invoke onCollapse callback when already collapsed', () => {
      const onCollapse = vi.fn();
      const disclosure = createDisclosureBehavior({ onCollapse });

      disclosure.actions.collapse();

      expect(onCollapse).not.toHaveBeenCalled();
    });
  });

  describe('toggle action', () => {
    it('should expand when currently collapsed', () => {
      const disclosure = createDisclosureBehavior();

      disclosure.actions.toggle();
      const state = disclosure.getState();

      expect(state.isExpanded).toBe(true);
    });

    it('should collapse when currently expanded', () => {
      const disclosure = createDisclosureBehavior({ initialExpanded: true });

      disclosure.actions.toggle();
      const state = disclosure.getState();

      expect(state.isExpanded).toBe(false);
    });

    it('should toggle multiple times correctly', () => {
      const disclosure = createDisclosureBehavior();

      // First toggle - expand
      disclosure.actions.toggle();
      expect(disclosure.getState().isExpanded).toBe(true);

      // Second toggle - collapse
      disclosure.actions.toggle();
      expect(disclosure.getState().isExpanded).toBe(false);

      // Third toggle - expand
      disclosure.actions.toggle();
      expect(disclosure.getState().isExpanded).toBe(true);
    });

    it('should invoke onExpand callback when toggling from collapsed to expanded', () => {
      const onExpand = vi.fn();
      const disclosure = createDisclosureBehavior({ onExpand });

      disclosure.actions.toggle();

      expect(onExpand).toHaveBeenCalledTimes(1);
    });

    it('should invoke onCollapse callback when toggling from expanded to collapsed', () => {
      const onCollapse = vi.fn();
      const disclosure = createDisclosureBehavior({
        initialExpanded: true,
        onCollapse,
      });

      disclosure.actions.toggle();

      expect(onCollapse).toHaveBeenCalledTimes(1);
    });
  });

  describe('single-panel vs multi-panel modes', () => {
    it('should support single-panel mode with coordinated disclosures', () => {
      // Create multiple disclosures for single-panel accordion
      const disclosure1 = createDisclosureBehavior({ id: 'panel-1' });
      const disclosure2 = createDisclosureBehavior({ id: 'panel-2' });
      const disclosure3 = createDisclosureBehavior({ id: 'panel-3' });

      // Expand first panel
      disclosure1.actions.expand();
      expect(disclosure1.getState().isExpanded).toBe(true);
      expect(disclosure2.getState().isExpanded).toBe(false);
      expect(disclosure3.getState().isExpanded).toBe(false);

      // Expand second panel (in single-panel mode, app would collapse others)
      disclosure2.actions.expand();
      // Manually collapse others to simulate single-panel behavior
      disclosure1.actions.collapse();

      expect(disclosure1.getState().isExpanded).toBe(false);
      expect(disclosure2.getState().isExpanded).toBe(true);
      expect(disclosure3.getState().isExpanded).toBe(false);
    });

    it('should support multi-panel mode with independent disclosures', () => {
      // Create multiple disclosures for multi-panel accordion
      const disclosure1 = createDisclosureBehavior({ id: 'panel-1' });
      const disclosure2 = createDisclosureBehavior({ id: 'panel-2' });
      const disclosure3 = createDisclosureBehavior({ id: 'panel-3' });

      // Expand all panels independently
      disclosure1.actions.expand();
      disclosure2.actions.expand();
      disclosure3.actions.expand();

      expect(disclosure1.getState().isExpanded).toBe(true);
      expect(disclosure2.getState().isExpanded).toBe(true);
      expect(disclosure3.getState().isExpanded).toBe(true);
    });

    it('should allow selective expansion in multi-panel mode', () => {
      const disclosure1 = createDisclosureBehavior({ id: 'panel-1' });
      const disclosure2 = createDisclosureBehavior({ id: 'panel-2' });
      const disclosure3 = createDisclosureBehavior({ id: 'panel-3' });

      // Expand first and third panels
      disclosure1.actions.expand();
      disclosure3.actions.expand();

      expect(disclosure1.getState().isExpanded).toBe(true);
      expect(disclosure2.getState().isExpanded).toBe(false);
      expect(disclosure3.getState().isExpanded).toBe(true);

      // Collapse first panel
      disclosure1.actions.collapse();

      expect(disclosure1.getState().isExpanded).toBe(false);
      expect(disclosure2.getState().isExpanded).toBe(false);
      expect(disclosure3.getState().isExpanded).toBe(true);
    });
  });

  describe('subscribe', () => {
    it('should notify subscribers when state changes', () => {
      const disclosure = createDisclosureBehavior();
      const listener = vi.fn();

      disclosure.subscribe(listener);
      disclosure.actions.expand();

      expect(listener).toHaveBeenCalled();
      const lastCall = listener.mock.calls[listener.mock.calls.length - 1];
      expect(lastCall[0]).toMatchObject({
        isExpanded: true,
      });
    });

    it('should support multiple subscribers', () => {
      const disclosure = createDisclosureBehavior();
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      disclosure.subscribe(listener1);
      disclosure.subscribe(listener2);

      disclosure.actions.expand();

      expect(listener1).toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();
    });

    it('should allow unsubscribing', () => {
      const disclosure = createDisclosureBehavior();
      const listener = vi.fn();

      const unsubscribe = disclosure.subscribe(listener);
      unsubscribe();

      disclosure.actions.expand();

      expect(listener).not.toHaveBeenCalled();
    });

    it('should notify subscribers on collapse', () => {
      const disclosure = createDisclosureBehavior({ initialExpanded: true });
      const listener = vi.fn();

      disclosure.subscribe(listener);
      disclosure.actions.collapse();

      expect(listener).toHaveBeenCalled();
      const lastCall = listener.mock.calls[listener.mock.calls.length - 1];
      expect(lastCall[0]).toMatchObject({
        isExpanded: false,
      });
    });

    it('should notify subscribers on toggle', () => {
      const disclosure = createDisclosureBehavior();
      const listener = vi.fn();

      disclosure.subscribe(listener);
      disclosure.actions.toggle();

      expect(listener).toHaveBeenCalled();
      const lastCall = listener.mock.calls[listener.mock.calls.length - 1];
      expect(lastCall[0]).toMatchObject({
        isExpanded: true,
      });
    });
  });

  describe('destroy', () => {
    it('should clean up subscriptions when destroyed', () => {
      const disclosure = createDisclosureBehavior();
      const listener = vi.fn();

      disclosure.subscribe(listener);
      disclosure.destroy();

      disclosure.actions.expand();

      expect(listener).not.toHaveBeenCalled();
    });

    it('should handle multiple destroy calls gracefully', () => {
      const disclosure = createDisclosureBehavior();

      expect(() => {
        disclosure.destroy();
        disclosure.destroy();
      }).not.toThrow();
    });

    it('should clean up all subscribers', () => {
      const disclosure = createDisclosureBehavior();
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      const listener3 = vi.fn();

      disclosure.subscribe(listener1);
      disclosure.subscribe(listener2);
      disclosure.subscribe(listener3);

      disclosure.destroy();
      disclosure.actions.expand();

      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).not.toHaveBeenCalled();
      expect(listener3).not.toHaveBeenCalled();
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete disclosure lifecycle', () => {
      const onExpand = vi.fn();
      const onCollapse = vi.fn();
      const listener = vi.fn();

      const disclosure = createDisclosureBehavior({
        id: 'lifecycle-test',
        onExpand,
        onCollapse,
      });

      disclosure.subscribe(listener);

      // Expand disclosure
      disclosure.actions.expand();
      expect(disclosure.getState().isExpanded).toBe(true);
      expect(onExpand).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalled();

      // Collapse disclosure
      listener.mockClear();
      disclosure.actions.collapse();
      expect(disclosure.getState().isExpanded).toBe(false);
      expect(onCollapse).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalled();

      // Clean up
      disclosure.destroy();
    });

    it('should maintain state consistency across multiple operations', () => {
      const disclosure = createDisclosureBehavior({ id: 'consistency-test' });

      // Initial state
      expect(disclosure.getState().isExpanded).toBe(false);

      // Expand
      disclosure.actions.expand();
      expect(disclosure.getState().isExpanded).toBe(true);

      // Expand again (should remain expanded)
      disclosure.actions.expand();
      expect(disclosure.getState().isExpanded).toBe(true);

      // Toggle to collapse
      disclosure.actions.toggle();
      expect(disclosure.getState().isExpanded).toBe(false);

      // Collapse again (should remain collapsed)
      disclosure.actions.collapse();
      expect(disclosure.getState().isExpanded).toBe(false);

      // Toggle to expand
      disclosure.actions.toggle();
      expect(disclosure.getState().isExpanded).toBe(true);

      disclosure.destroy();
    });

    it('should work correctly in accordion pattern', () => {
      // Simulate an accordion with three panels
      const panels = [
        createDisclosureBehavior({ id: 'faq-1' }),
        createDisclosureBehavior({ id: 'faq-2' }),
        createDisclosureBehavior({ id: 'faq-3' }),
      ];

      // Initially all collapsed
      panels.forEach((panel) => {
        expect(panel.getState().isExpanded).toBe(false);
      });

      // Expand first panel
      panels[0].actions.expand();
      expect(panels[0].getState().isExpanded).toBe(true);

      // Toggle second panel
      panels[1].actions.toggle();
      expect(panels[1].getState().isExpanded).toBe(true);

      // All panels can be expanded in multi-panel mode
      panels[2].actions.expand();
      expect(panels[0].getState().isExpanded).toBe(true);
      expect(panels[1].getState().isExpanded).toBe(true);
      expect(panels[2].getState().isExpanded).toBe(true);

      // Clean up
      panels.forEach((panel) => panel.destroy());
    });
  });
});
