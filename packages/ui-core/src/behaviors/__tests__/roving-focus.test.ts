import { describe, it, expect, vi } from 'vitest';
import { createRovingFocus } from '../roving-focus';

describe('createRovingFocus', () => {
  describe('initial state', () => {
    it('should initialize with default state', () => {
      const rovingFocus = createRovingFocus();
      const state = rovingFocus.getState();

      expect(state.currentIndex).toBe(0);
      expect(state.items).toEqual([]);
      expect(state.orientation).toBe('vertical');
      expect(state.wrap).toBe(true);
    });

    it('should initialize with provided items', () => {
      const items = ['item-1', 'item-2', 'item-3'];
      const rovingFocus = createRovingFocus({ items });
      const state = rovingFocus.getState();

      expect(state.items).toEqual(items);
      expect(state.currentIndex).toBe(0);
    });

    it('should initialize with provided initial index', () => {
      const items = ['item-1', 'item-2', 'item-3'];
      const rovingFocus = createRovingFocus({ items, initialIndex: 1 });
      const state = rovingFocus.getState();

      expect(state.currentIndex).toBe(1);
    });

    it('should clamp initial index to valid range', () => {
      const items = ['item-1', 'item-2', 'item-3'];
      const rovingFocus = createRovingFocus({ items, initialIndex: 10 });
      const state = rovingFocus.getState();

      expect(state.currentIndex).toBe(2); // Last valid index
    });

    it('should initialize with horizontal orientation', () => {
      const rovingFocus = createRovingFocus({ orientation: 'horizontal' });
      const state = rovingFocus.getState();

      expect(state.orientation).toBe('horizontal');
    });

    it('should initialize with wrap disabled', () => {
      const rovingFocus = createRovingFocus({ wrap: false });
      const state = rovingFocus.getState();

      expect(state.wrap).toBe(false);
    });
  });

  describe('moveNext action', () => {
    it('should increment index when moving to next item', () => {
      const items = ['item-1', 'item-2', 'item-3'];
      const rovingFocus = createRovingFocus({ items });

      rovingFocus.actions.moveNext();
      expect(rovingFocus.getState().currentIndex).toBe(1);

      rovingFocus.actions.moveNext();
      expect(rovingFocus.getState().currentIndex).toBe(2);
    });

    it('should wrap to first item when at end with wrap enabled', () => {
      const items = ['item-1', 'item-2', 'item-3'];
      const rovingFocus = createRovingFocus({ items, initialIndex: 2, wrap: true });

      rovingFocus.actions.moveNext();
      expect(rovingFocus.getState().currentIndex).toBe(0);
    });

    it('should stay at last item when at end with wrap disabled', () => {
      const items = ['item-1', 'item-2', 'item-3'];
      const rovingFocus = createRovingFocus({ items, initialIndex: 2, wrap: false });

      rovingFocus.actions.moveNext();
      expect(rovingFocus.getState().currentIndex).toBe(2);
    });

    it('should handle empty items array', () => {
      const rovingFocus = createRovingFocus({ items: [] });

      rovingFocus.actions.moveNext();
      expect(rovingFocus.getState().currentIndex).toBe(0);
    });
  });

  describe('movePrevious action', () => {
    it('should decrement index when moving to previous item', () => {
      const items = ['item-1', 'item-2', 'item-3'];
      const rovingFocus = createRovingFocus({ items, initialIndex: 2 });

      rovingFocus.actions.movePrevious();
      expect(rovingFocus.getState().currentIndex).toBe(1);

      rovingFocus.actions.movePrevious();
      expect(rovingFocus.getState().currentIndex).toBe(0);
    });

    it('should wrap to last item when at beginning with wrap enabled', () => {
      const items = ['item-1', 'item-2', 'item-3'];
      const rovingFocus = createRovingFocus({ items, initialIndex: 0, wrap: true });

      rovingFocus.actions.movePrevious();
      expect(rovingFocus.getState().currentIndex).toBe(2);
    });

    it('should stay at first item when at beginning with wrap disabled', () => {
      const items = ['item-1', 'item-2', 'item-3'];
      const rovingFocus = createRovingFocus({ items, initialIndex: 0, wrap: false });

      rovingFocus.actions.movePrevious();
      expect(rovingFocus.getState().currentIndex).toBe(0);
    });

    it('should handle empty items array', () => {
      const rovingFocus = createRovingFocus({ items: [] });

      rovingFocus.actions.movePrevious();
      expect(rovingFocus.getState().currentIndex).toBe(0);
    });
  });

  describe('wrapping behavior at boundaries', () => {
    it('should wrap forward from last to first when wrap is enabled', () => {
      const items = ['item-1', 'item-2', 'item-3'];
      const rovingFocus = createRovingFocus({ items, wrap: true });

      // Move to last item
      rovingFocus.actions.moveLast();
      expect(rovingFocus.getState().currentIndex).toBe(2);

      // Wrap to first
      rovingFocus.actions.moveNext();
      expect(rovingFocus.getState().currentIndex).toBe(0);
    });

    it('should wrap backward from first to last when wrap is enabled', () => {
      const items = ['item-1', 'item-2', 'item-3'];
      const rovingFocus = createRovingFocus({ items, wrap: true });

      // Start at first item
      expect(rovingFocus.getState().currentIndex).toBe(0);

      // Wrap to last
      rovingFocus.actions.movePrevious();
      expect(rovingFocus.getState().currentIndex).toBe(2);
    });

    it('should not wrap forward when wrap is disabled', () => {
      const items = ['item-1', 'item-2', 'item-3'];
      const rovingFocus = createRovingFocus({ items, wrap: false });

      rovingFocus.actions.moveLast();
      expect(rovingFocus.getState().currentIndex).toBe(2);

      // Try to move next - should stay at last
      rovingFocus.actions.moveNext();
      expect(rovingFocus.getState().currentIndex).toBe(2);

      // Multiple attempts should still stay at last
      rovingFocus.actions.moveNext();
      rovingFocus.actions.moveNext();
      expect(rovingFocus.getState().currentIndex).toBe(2);
    });

    it('should not wrap backward when wrap is disabled', () => {
      const items = ['item-1', 'item-2', 'item-3'];
      const rovingFocus = createRovingFocus({ items, wrap: false });

      // Start at first item
      expect(rovingFocus.getState().currentIndex).toBe(0);

      // Try to move previous - should stay at first
      rovingFocus.actions.movePrevious();
      expect(rovingFocus.getState().currentIndex).toBe(0);

      // Multiple attempts should still stay at first
      rovingFocus.actions.movePrevious();
      rovingFocus.actions.movePrevious();
      expect(rovingFocus.getState().currentIndex).toBe(0);
    });
  });

  describe('moveFirst action', () => {
    it('should move to first item', () => {
      const items = ['item-1', 'item-2', 'item-3'];
      const rovingFocus = createRovingFocus({ items, initialIndex: 2 });

      rovingFocus.actions.moveFirst();
      expect(rovingFocus.getState().currentIndex).toBe(0);
    });

    it('should stay at first item when already at first', () => {
      const items = ['item-1', 'item-2', 'item-3'];
      const rovingFocus = createRovingFocus({ items, initialIndex: 0 });

      rovingFocus.actions.moveFirst();
      expect(rovingFocus.getState().currentIndex).toBe(0);
    });

    it('should handle empty items array', () => {
      const rovingFocus = createRovingFocus({ items: [] });

      rovingFocus.actions.moveFirst();
      expect(rovingFocus.getState().currentIndex).toBe(0);
    });
  });

  describe('moveLast action', () => {
    it('should move to last item', () => {
      const items = ['item-1', 'item-2', 'item-3'];
      const rovingFocus = createRovingFocus({ items, initialIndex: 0 });

      rovingFocus.actions.moveLast();
      expect(rovingFocus.getState().currentIndex).toBe(2);
    });

    it('should stay at last item when already at last', () => {
      const items = ['item-1', 'item-2', 'item-3'];
      const rovingFocus = createRovingFocus({ items, initialIndex: 2 });

      rovingFocus.actions.moveLast();
      expect(rovingFocus.getState().currentIndex).toBe(2);
    });

    it('should handle empty items array', () => {
      const rovingFocus = createRovingFocus({ items: [] });

      rovingFocus.actions.moveLast();
      expect(rovingFocus.getState().currentIndex).toBe(0);
    });
  });

  describe('moveTo action', () => {
    it('should move to specific index', () => {
      const items = ['item-1', 'item-2', 'item-3', 'item-4'];
      const rovingFocus = createRovingFocus({ items });

      rovingFocus.actions.moveTo(2);
      expect(rovingFocus.getState().currentIndex).toBe(2);

      rovingFocus.actions.moveTo(0);
      expect(rovingFocus.getState().currentIndex).toBe(0);

      rovingFocus.actions.moveTo(3);
      expect(rovingFocus.getState().currentIndex).toBe(3);
    });

    it('should clamp index to valid range when too high', () => {
      const items = ['item-1', 'item-2', 'item-3'];
      const rovingFocus = createRovingFocus({ items });

      rovingFocus.actions.moveTo(10);
      expect(rovingFocus.getState().currentIndex).toBe(2); // Last valid index
    });

    it('should clamp index to valid range when negative', () => {
      const items = ['item-1', 'item-2', 'item-3'];
      const rovingFocus = createRovingFocus({ items });

      rovingFocus.actions.moveTo(-5);
      expect(rovingFocus.getState().currentIndex).toBe(0); // First valid index
    });

    it('should handle empty items array', () => {
      const rovingFocus = createRovingFocus({ items: [] });

      rovingFocus.actions.moveTo(5);
      expect(rovingFocus.getState().currentIndex).toBe(0);
    });
  });

  describe('horizontal vs vertical orientation', () => {
    it('should maintain vertical orientation', () => {
      const items = ['item-1', 'item-2', 'item-3'];
      const rovingFocus = createRovingFocus({ items, orientation: 'vertical' });

      expect(rovingFocus.getState().orientation).toBe('vertical');

      // Orientation should not change with navigation
      rovingFocus.actions.moveNext();
      expect(rovingFocus.getState().orientation).toBe('vertical');
    });

    it('should maintain horizontal orientation', () => {
      const items = ['item-1', 'item-2', 'item-3'];
      const rovingFocus = createRovingFocus({ items, orientation: 'horizontal' });

      expect(rovingFocus.getState().orientation).toBe('horizontal');

      // Orientation should not change with navigation
      rovingFocus.actions.moveNext();
      expect(rovingFocus.getState().orientation).toBe('horizontal');
    });

    it('should work correctly with horizontal orientation and wrapping', () => {
      const items = ['item-1', 'item-2', 'item-3'];
      const rovingFocus = createRovingFocus({
        items,
        orientation: 'horizontal',
        wrap: true,
      });

      // Move to last item
      rovingFocus.actions.moveLast();
      expect(rovingFocus.getState().currentIndex).toBe(2);

      // Wrap to first
      rovingFocus.actions.moveNext();
      expect(rovingFocus.getState().currentIndex).toBe(0);
      expect(rovingFocus.getState().orientation).toBe('horizontal');
    });

    it('should work correctly with vertical orientation and wrapping', () => {
      const items = ['item-1', 'item-2', 'item-3'];
      const rovingFocus = createRovingFocus({
        items,
        orientation: 'vertical',
        wrap: true,
      });

      // Start at first, wrap backward to last
      rovingFocus.actions.movePrevious();
      expect(rovingFocus.getState().currentIndex).toBe(2);
      expect(rovingFocus.getState().orientation).toBe('vertical');
    });
  });

  describe('setItems action', () => {
    it('should update items array', () => {
      const rovingFocus = createRovingFocus({ items: ['item-1', 'item-2'] });

      const newItems = ['new-1', 'new-2', 'new-3'];
      rovingFocus.actions.setItems(newItems);

      expect(rovingFocus.getState().items).toEqual(newItems);
    });

    it('should adjust currentIndex when new items array is shorter', () => {
      const rovingFocus = createRovingFocus({
        items: ['item-1', 'item-2', 'item-3', 'item-4'],
        initialIndex: 3,
      });

      expect(rovingFocus.getState().currentIndex).toBe(3);

      // Set shorter array
      rovingFocus.actions.setItems(['new-1', 'new-2']);
      expect(rovingFocus.getState().currentIndex).toBe(1); // Adjusted to last valid index
    });

    it('should maintain currentIndex when new items array is longer', () => {
      const rovingFocus = createRovingFocus({
        items: ['item-1', 'item-2'],
        initialIndex: 1,
      });

      expect(rovingFocus.getState().currentIndex).toBe(1);

      // Set longer array
      rovingFocus.actions.setItems(['new-1', 'new-2', 'new-3', 'new-4']);
      expect(rovingFocus.getState().currentIndex).toBe(1); // Maintained
    });

    it('should handle setting empty items array', () => {
      const rovingFocus = createRovingFocus({
        items: ['item-1', 'item-2', 'item-3'],
        initialIndex: 2,
      });

      rovingFocus.actions.setItems([]);
      expect(rovingFocus.getState().items).toEqual([]);
      expect(rovingFocus.getState().currentIndex).toBe(0);
    });
  });

  describe('subscribe', () => {
    it('should notify subscribers when state changes', () => {
      const items = ['item-1', 'item-2', 'item-3'];
      const rovingFocus = createRovingFocus({ items });
      const listener = vi.fn();

      rovingFocus.subscribe(listener);
      rovingFocus.actions.moveNext();

      expect(listener).toHaveBeenCalled();
      const lastCall = listener.mock.calls[listener.mock.calls.length - 1];
      expect(lastCall[0]).toMatchObject({
        currentIndex: 1,
        items,
      });
    });

    it('should support multiple subscribers', () => {
      const items = ['item-1', 'item-2', 'item-3'];
      const rovingFocus = createRovingFocus({ items });
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      rovingFocus.subscribe(listener1);
      rovingFocus.subscribe(listener2);

      rovingFocus.actions.moveNext();

      expect(listener1).toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();
    });

    it('should allow unsubscribing', () => {
      const items = ['item-1', 'item-2', 'item-3'];
      const rovingFocus = createRovingFocus({ items });
      const listener = vi.fn();

      const unsubscribe = rovingFocus.subscribe(listener);
      unsubscribe();

      rovingFocus.actions.moveNext();

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('destroy', () => {
    it('should clean up subscriptions when destroyed', () => {
      const items = ['item-1', 'item-2', 'item-3'];
      const rovingFocus = createRovingFocus({ items });
      const listener = vi.fn();

      rovingFocus.subscribe(listener);
      rovingFocus.destroy();

      rovingFocus.actions.moveNext();

      expect(listener).not.toHaveBeenCalled();
    });

    it('should handle multiple destroy calls gracefully', () => {
      const rovingFocus = createRovingFocus();

      expect(() => {
        rovingFocus.destroy();
        rovingFocus.destroy();
      }).not.toThrow();
    });

    it('should clean up all subscribers', () => {
      const items = ['item-1', 'item-2', 'item-3'];
      const rovingFocus = createRovingFocus({ items });
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      const listener3 = vi.fn();

      rovingFocus.subscribe(listener1);
      rovingFocus.subscribe(listener2);
      rovingFocus.subscribe(listener3);

      rovingFocus.destroy();
      rovingFocus.actions.moveNext();

      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).not.toHaveBeenCalled();
      expect(listener3).not.toHaveBeenCalled();
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete navigation lifecycle', () => {
      const items = ['item-1', 'item-2', 'item-3', 'item-4', 'item-5'];
      const rovingFocus = createRovingFocus({ items, wrap: true });
      const listener = vi.fn();

      rovingFocus.subscribe(listener);

      // Navigate forward
      rovingFocus.actions.moveNext();
      expect(rovingFocus.getState().currentIndex).toBe(1);

      rovingFocus.actions.moveNext();
      expect(rovingFocus.getState().currentIndex).toBe(2);

      // Jump to last
      rovingFocus.actions.moveLast();
      expect(rovingFocus.getState().currentIndex).toBe(4);

      // Wrap to first
      rovingFocus.actions.moveNext();
      expect(rovingFocus.getState().currentIndex).toBe(0);

      // Navigate backward
      rovingFocus.actions.movePrevious();
      expect(rovingFocus.getState().currentIndex).toBe(4);

      // Jump to specific index
      rovingFocus.actions.moveTo(2);
      expect(rovingFocus.getState().currentIndex).toBe(2);

      expect(listener).toHaveBeenCalled();

      rovingFocus.destroy();
    });

    it('should maintain state consistency with dynamic items', () => {
      const rovingFocus = createRovingFocus({
        items: ['item-1', 'item-2', 'item-3'],
        initialIndex: 1,
      });

      expect(rovingFocus.getState().currentIndex).toBe(1);

      // Update items to longer array
      rovingFocus.actions.setItems(['a', 'b', 'c', 'd', 'e']);
      expect(rovingFocus.getState().currentIndex).toBe(1);
      expect(rovingFocus.getState().items).toHaveLength(5);

      // Navigate
      rovingFocus.actions.moveNext();
      expect(rovingFocus.getState().currentIndex).toBe(2);

      // Update items to shorter array
      rovingFocus.actions.setItems(['x', 'y']);
      expect(rovingFocus.getState().currentIndex).toBe(1); // Clamped to last valid
      expect(rovingFocus.getState().items).toHaveLength(2);

      rovingFocus.destroy();
    });
  });
});
