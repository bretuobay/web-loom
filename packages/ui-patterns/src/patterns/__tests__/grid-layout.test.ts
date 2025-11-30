import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createGridLayout } from '../grid-layout';

interface TestItem {
  id: string;
  name: string;
}

describe('createGridLayout', () => {
  let items: TestItem[];

  beforeEach(() => {
    items = [
      { id: '1', name: 'Item 1' },
      { id: '2', name: 'Item 2' },
      { id: '3', name: 'Item 3' },
      { id: '4', name: 'Item 4' },
      { id: '5', name: 'Item 5' },
      { id: '6', name: 'Item 6' },
    ];
  });

  describe('initial state', () => {
    it('should initialize with correct default state', () => {
      const grid = createGridLayout({
        items,
        getId: (item) => item.id,
        breakpoints: [
          { minWidth: 0, columns: 1 },
          { minWidth: 640, columns: 2 },
          { minWidth: 1024, columns: 3 },
        ],
      });

      const state = grid.getState();

      expect(state.items).toEqual(items);
      expect(state.columns).toBe(3); // Default viewport is 1024
      expect(state.selectedItems).toEqual([]);
      expect(state.focusedIndex).toBe(0);
      expect(state.selectionMode).toBe('single');
      expect(state.wrap).toBe(true);
      expect(state.viewportWidth).toBe(1024);

      grid.destroy();
    });

    it('should initialize with custom viewport width', () => {
      const grid = createGridLayout({
        items,
        getId: (item) => item.id,
        breakpoints: [
          { minWidth: 0, columns: 1 },
          { minWidth: 640, columns: 2 },
          { minWidth: 1024, columns: 3 },
        ],
        initialViewportWidth: 500,
      });

      const state = grid.getState();
      expect(state.columns).toBe(1); // 500 < 640, so 1 column
      expect(state.viewportWidth).toBe(500);

      grid.destroy();
    });

    it('should throw error if no breakpoints provided', () => {
      expect(() => {
        createGridLayout({
          items,
          getId: (item) => item.id,
          breakpoints: [],
        });
      }).toThrow('At least one breakpoint must be provided');
    });

    it('should throw error if breakpoints have invalid values', () => {
      expect(() => {
        createGridLayout({
          items,
          getId: (item) => item.id,
          breakpoints: [{ minWidth: -1, columns: 2 }],
        });
      }).toThrow('Breakpoints must have non-negative minWidth and positive columns');
    });
  });

  describe('responsive breakpoints', () => {
    it('should calculate correct columns based on viewport width', () => {
      const grid = createGridLayout({
        items,
        getId: (item) => item.id,
        breakpoints: [
          { minWidth: 0, columns: 1 },
          { minWidth: 640, columns: 2 },
          { minWidth: 1024, columns: 3 },
          { minWidth: 1280, columns: 4 },
        ],
        initialViewportWidth: 800,
      });

      expect(grid.getState().columns).toBe(2); // 640 <= 800 < 1024

      grid.actions.updateViewportWidth(1200);
      expect(grid.getState().columns).toBe(3); // 1024 <= 1200 < 1280

      grid.actions.updateViewportWidth(1500);
      expect(grid.getState().columns).toBe(4); // 1500 >= 1280

      grid.destroy();
    });

    it('should emit breakpoint:changed event when breakpoint changes', () => {
      const grid = createGridLayout({
        items,
        getId: (item) => item.id,
        breakpoints: [
          { minWidth: 0, columns: 1 },
          { minWidth: 640, columns: 2 },
        ],
        initialViewportWidth: 500,
      });

      const listener = vi.fn();
      grid.eventBus.on('breakpoint:changed', listener);

      grid.actions.updateViewportWidth(700);

      expect(listener).toHaveBeenCalledWith({ minWidth: 640, columns: 2 }, 2);

      grid.destroy();
    });

    it('should not emit breakpoint:changed if breakpoint stays the same', () => {
      const grid = createGridLayout({
        items,
        getId: (item) => item.id,
        breakpoints: [
          { minWidth: 0, columns: 1 },
          { minWidth: 640, columns: 2 },
        ],
        initialViewportWidth: 700,
      });

      const listener = vi.fn();
      grid.eventBus.on('breakpoint:changed', listener);

      grid.actions.updateViewportWidth(800); // Still in same breakpoint

      expect(listener).not.toHaveBeenCalled();

      grid.destroy();
    });
  });

  describe('navigation', () => {
    it('should navigate right correctly', () => {
      const grid = createGridLayout({
        items,
        getId: (item) => item.id,
        breakpoints: [{ minWidth: 0, columns: 3 }],
      });

      expect(grid.getState().focusedIndex).toBe(0);

      grid.actions.navigateRight();
      expect(grid.getState().focusedIndex).toBe(1);

      grid.actions.navigateRight();
      expect(grid.getState().focusedIndex).toBe(2);

      grid.destroy();
    });

    it('should navigate left correctly', () => {
      const grid = createGridLayout({
        items,
        getId: (item) => item.id,
        breakpoints: [{ minWidth: 0, columns: 3 }],
        initialFocusedIndex: 2,
      });

      expect(grid.getState().focusedIndex).toBe(2);

      grid.actions.navigateLeft();
      expect(grid.getState().focusedIndex).toBe(1);

      grid.actions.navigateLeft();
      expect(grid.getState().focusedIndex).toBe(0);

      grid.destroy();
    });

    it('should navigate down correctly', () => {
      const grid = createGridLayout({
        items,
        getId: (item) => item.id,
        breakpoints: [{ minWidth: 0, columns: 3 }],
      });

      expect(grid.getState().focusedIndex).toBe(0);

      grid.actions.navigateDown();
      expect(grid.getState().focusedIndex).toBe(3); // 0 + 3 columns

      grid.destroy();
    });

    it('should navigate up correctly', () => {
      const grid = createGridLayout({
        items,
        getId: (item) => item.id,
        breakpoints: [{ minWidth: 0, columns: 3 }],
        initialFocusedIndex: 3,
      });

      expect(grid.getState().focusedIndex).toBe(3);

      grid.actions.navigateUp();
      expect(grid.getState().focusedIndex).toBe(0); // 3 - 3 columns

      grid.destroy();
    });

    it('should wrap right navigation at end', () => {
      const grid = createGridLayout({
        items,
        getId: (item) => item.id,
        breakpoints: [{ minWidth: 0, columns: 3 }],
        initialFocusedIndex: 5, // Last item
        wrap: true,
      });

      grid.actions.navigateRight();
      expect(grid.getState().focusedIndex).toBe(0); // Wrapped to first

      grid.destroy();
    });

    it('should wrap left navigation at start', () => {
      const grid = createGridLayout({
        items,
        getId: (item) => item.id,
        breakpoints: [{ minWidth: 0, columns: 3 }],
        initialFocusedIndex: 0,
        wrap: true,
      });

      grid.actions.navigateLeft();
      expect(grid.getState().focusedIndex).toBe(5); // Wrapped to last

      grid.destroy();
    });

    it('should not wrap when wrap is disabled', () => {
      const grid = createGridLayout({
        items,
        getId: (item) => item.id,
        breakpoints: [{ minWidth: 0, columns: 3 }],
        initialFocusedIndex: 5,
        wrap: false,
      });

      grid.actions.navigateRight();
      expect(grid.getState().focusedIndex).toBe(5); // Stayed at last

      grid.destroy();
    });

    it('should emit item:focused event on navigation', () => {
      const grid = createGridLayout({
        items,
        getId: (item) => item.id,
        breakpoints: [{ minWidth: 0, columns: 3 }],
      });

      const listener = vi.fn();
      grid.eventBus.on('item:focused', listener);

      grid.actions.navigateRight();

      expect(listener).toHaveBeenCalledWith(1, '2');

      grid.destroy();
    });

    it('should handle empty grid gracefully', () => {
      const grid = createGridLayout({
        items: [],
        getId: (item) => item.id,
        breakpoints: [{ minWidth: 0, columns: 3 }],
      });

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      grid.actions.navigateRight();
      expect(consoleSpy).toHaveBeenCalledWith('Cannot navigate: grid is empty');

      consoleSpy.mockRestore();
      grid.destroy();
    });
  });

  describe('selection', () => {
    it('should select items in single mode', () => {
      const grid = createGridLayout({
        items,
        getId: (item) => item.id,
        breakpoints: [{ minWidth: 0, columns: 3 }],
        selectionMode: 'single',
      });

      grid.actions.selectItem('1');
      expect(grid.getState().selectedItems).toEqual(['1']);

      grid.actions.selectItem('2');
      expect(grid.getState().selectedItems).toEqual(['2']); // Replaced

      grid.destroy();
    });

    it('should select items in multi mode', () => {
      const grid = createGridLayout({
        items,
        getId: (item) => item.id,
        breakpoints: [{ minWidth: 0, columns: 3 }],
        selectionMode: 'multi',
      });

      grid.actions.selectItem('1');
      expect(grid.getState().selectedItems).toEqual(['1']);

      grid.actions.selectItem('2');
      expect(grid.getState().selectedItems).toEqual(['1', '2']); // Added

      grid.destroy();
    });

    it('should emit item:selected event', () => {
      const grid = createGridLayout({
        items,
        getId: (item) => item.id,
        breakpoints: [{ minWidth: 0, columns: 3 }],
      });

      const listener = vi.fn();
      grid.eventBus.on('item:selected', listener);

      grid.actions.selectItem('1');

      expect(listener).toHaveBeenCalledWith('1', ['1']);

      grid.destroy();
    });

    it('should invoke onSelectionChange callback', () => {
      const onSelectionChange = vi.fn();
      const grid = createGridLayout({
        items,
        getId: (item) => item.id,
        breakpoints: [{ minWidth: 0, columns: 3 }],
        onSelectionChange,
      });

      grid.actions.selectItem('1');

      expect(onSelectionChange).toHaveBeenCalledWith([{ id: '1', name: 'Item 1' }]);

      grid.destroy();
    });
  });

  describe('setItems', () => {
    it('should update items and clear selection', () => {
      const grid = createGridLayout({
        items,
        getId: (item) => item.id,
        breakpoints: [{ minWidth: 0, columns: 3 }],
      });

      grid.actions.selectItem('1');
      expect(grid.getState().selectedItems).toEqual(['1']);

      const newItems = [
        { id: '7', name: 'Item 7' },
        { id: '8', name: 'Item 8' },
      ];

      grid.actions.setItems(newItems);

      expect(grid.getState().items).toEqual(newItems);
      expect(grid.getState().selectedItems).toEqual([]);

      grid.destroy();
    });

    it('should adjust focusedIndex if out of bounds', () => {
      const grid = createGridLayout({
        items,
        getId: (item) => item.id,
        breakpoints: [{ minWidth: 0, columns: 3 }],
        initialFocusedIndex: 5,
      });

      const newItems = [
        { id: '7', name: 'Item 7' },
        { id: '8', name: 'Item 8' },
      ];

      grid.actions.setItems(newItems);

      expect(grid.getState().focusedIndex).toBe(1); // Adjusted to last valid index

      grid.destroy();
    });
  });

  describe('setFocusedIndex', () => {
    it('should set focused index directly', () => {
      const grid = createGridLayout({
        items,
        getId: (item) => item.id,
        breakpoints: [{ minWidth: 0, columns: 3 }],
      });

      grid.actions.setFocusedIndex(3);
      expect(grid.getState().focusedIndex).toBe(3);

      grid.destroy();
    });

    it('should warn on invalid index', () => {
      const grid = createGridLayout({
        items,
        getId: (item) => item.id,
        breakpoints: [{ minWidth: 0, columns: 3 }],
      });

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      grid.actions.setFocusedIndex(10);
      expect(consoleSpy).toHaveBeenCalledWith('Invalid focused index: 10');

      consoleSpy.mockRestore();
      grid.destroy();
    });
  });

  describe('subscription', () => {
    it('should notify subscribers on state changes', () => {
      const grid = createGridLayout({
        items,
        getId: (item) => item.id,
        breakpoints: [{ minWidth: 0, columns: 3 }],
      });

      const listener = vi.fn();
      const unsubscribe = grid.subscribe(listener);

      grid.actions.navigateRight();

      expect(listener).toHaveBeenCalled();

      unsubscribe();
      grid.destroy();
    });
  });

  describe('destroy', () => {
    it('should clean up resources', () => {
      const grid = createGridLayout({
        items,
        getId: (item) => item.id,
        breakpoints: [{ minWidth: 0, columns: 3 }],
      });

      expect(() => grid.destroy()).not.toThrow();
    });
  });

  describe('edge cases - empty grid', () => {
    it('should handle empty grid navigation without errors', () => {
      const grid = createGridLayout({
        items: [],
        getId: (item) => item.id,
        breakpoints: [{ minWidth: 0, columns: 3 }],
      });

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // All navigation should warn but not throw
      grid.actions.navigateUp();
      grid.actions.navigateDown();
      grid.actions.navigateLeft();
      grid.actions.navigateRight();

      expect(consoleSpy).toHaveBeenCalledTimes(4);
      expect(consoleSpy).toHaveBeenCalledWith('Cannot navigate: grid is empty');

      consoleSpy.mockRestore();
      grid.destroy();
    });

    it('should handle empty grid selection gracefully', () => {
      const grid = createGridLayout({
        items: [],
        getId: (item) => item.id,
        breakpoints: [{ minWidth: 0, columns: 3 }],
      });

      expect(grid.getState().items).toEqual([]);
      expect(grid.getState().selectedItems).toEqual([]);
      expect(grid.getState().focusedIndex).toBe(-1); // No items to focus

      grid.destroy();
    });

    it('should not emit events on empty grid navigation', () => {
      const grid = createGridLayout({
        items: [],
        getId: (item) => item.id,
        breakpoints: [{ minWidth: 0, columns: 3 }],
      });

      const focusListener = vi.fn();
      grid.eventBus.on('item:focused', focusListener);

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      grid.actions.navigateRight();

      expect(focusListener).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
      grid.destroy();
    });
  });

  describe('edge cases - single column grid', () => {
    it('should handle single column navigation correctly', () => {
      const grid = createGridLayout({
        items,
        getId: (item) => item.id,
        breakpoints: [{ minWidth: 0, columns: 1 }],
      });

      expect(grid.getState().columns).toBe(1);

      // In single column, left/right should behave like up/down
      grid.actions.navigateRight();
      expect(grid.getState().focusedIndex).toBe(1);

      grid.actions.navigateRight();
      expect(grid.getState().focusedIndex).toBe(2);

      grid.actions.navigateLeft();
      expect(grid.getState().focusedIndex).toBe(1);

      grid.destroy();
    });

    it('should handle single column up/down navigation', () => {
      const grid = createGridLayout({
        items,
        getId: (item) => item.id,
        breakpoints: [{ minWidth: 0, columns: 1 }],
      });

      // Down should move to next item (same as right in single column)
      grid.actions.navigateDown();
      expect(grid.getState().focusedIndex).toBe(1);

      grid.actions.navigateDown();
      expect(grid.getState().focusedIndex).toBe(2);

      // Up should move to previous item
      grid.actions.navigateUp();
      expect(grid.getState().focusedIndex).toBe(1);

      grid.destroy();
    });

    it('should wrap correctly in single column grid', () => {
      const grid = createGridLayout({
        items,
        getId: (item) => item.id,
        breakpoints: [{ minWidth: 0, columns: 1 }],
        initialFocusedIndex: 5, // Last item
        wrap: true,
      });

      // Navigate down from last item should wrap to first
      grid.actions.navigateDown();
      expect(grid.getState().focusedIndex).toBe(0);

      // Navigate up from first item should wrap to last
      grid.actions.navigateUp();
      expect(grid.getState().focusedIndex).toBe(5);

      grid.destroy();
    });
  });

  describe('breakpoint validation', () => {
    it('should reject breakpoints with negative minWidth', () => {
      expect(() => {
        createGridLayout({
          items,
          getId: (item) => item.id,
          breakpoints: [
            { minWidth: -100, columns: 2 },
            { minWidth: 640, columns: 3 },
          ],
        });
      }).toThrow('Breakpoints must have non-negative minWidth and positive columns');
    });

    it('should reject breakpoints with zero or negative columns', () => {
      expect(() => {
        createGridLayout({
          items,
          getId: (item) => item.id,
          breakpoints: [{ minWidth: 0, columns: 0 }],
        });
      }).toThrow('Breakpoints must have non-negative minWidth and positive columns');

      expect(() => {
        createGridLayout({
          items,
          getId: (item) => item.id,
          breakpoints: [{ minWidth: 0, columns: -1 }],
        });
      }).toThrow('Breakpoints must have non-negative minWidth and positive columns');
    });

    it('should sort breakpoints by minWidth automatically', () => {
      const grid = createGridLayout({
        items,
        getId: (item) => item.id,
        breakpoints: [
          { minWidth: 1024, columns: 3 },
          { minWidth: 0, columns: 1 },
          { minWidth: 640, columns: 2 },
        ],
        initialViewportWidth: 700,
      });

      // Should use the 640 breakpoint (2 columns) for width 700
      expect(grid.getState().columns).toBe(2);

      grid.destroy();
    });

    it('should handle setBreakpoints with invalid values', () => {
      const grid = createGridLayout({
        items,
        getId: (item) => item.id,
        breakpoints: [{ minWidth: 0, columns: 3 }],
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Try to set empty breakpoints
      grid.actions.setBreakpoints([]);
      expect(consoleSpy).toHaveBeenCalledWith('At least one breakpoint must be provided');

      // Try to set invalid breakpoints
      grid.actions.setBreakpoints([{ minWidth: -1, columns: 2 }]);
      expect(consoleSpy).toHaveBeenCalledWith('Breakpoints must have non-negative minWidth and positive columns');

      consoleSpy.mockRestore();
      grid.destroy();
    });
  });

  describe('event emission', () => {
    it('should emit item:focused on all navigation actions', () => {
      const grid = createGridLayout({
        items,
        getId: (item) => item.id,
        breakpoints: [{ minWidth: 0, columns: 3 }],
        initialFocusedIndex: 1,
      });

      const listener = vi.fn();
      grid.eventBus.on('item:focused', listener);

      // Test all navigation directions
      grid.actions.navigateRight();
      expect(listener).toHaveBeenCalledWith(2, '3');

      grid.actions.navigateLeft();
      expect(listener).toHaveBeenCalledWith(1, '2');

      grid.actions.navigateDown();
      expect(listener).toHaveBeenCalledWith(4, '5');

      grid.actions.navigateUp();
      expect(listener).toHaveBeenCalledWith(1, '2');

      expect(listener).toHaveBeenCalledTimes(4);

      grid.destroy();
    });

    it('should emit item:selected with correct parameters', () => {
      const grid = createGridLayout({
        items,
        getId: (item) => item.id,
        breakpoints: [{ minWidth: 0, columns: 3 }],
        selectionMode: 'multi',
      });

      const listener = vi.fn();
      grid.eventBus.on('item:selected', listener);

      grid.actions.selectItem('1');
      expect(listener).toHaveBeenCalledWith('1', ['1']);

      grid.actions.selectItem('2');
      expect(listener).toHaveBeenCalledWith('2', ['1', '2']);

      grid.destroy();
    });

    it('should emit breakpoint:changed only when breakpoint actually changes', () => {
      const grid = createGridLayout({
        items,
        getId: (item) => item.id,
        breakpoints: [
          { minWidth: 0, columns: 1 },
          { minWidth: 640, columns: 2 },
          { minWidth: 1024, columns: 3 },
        ],
        initialViewportWidth: 500,
      });

      const listener = vi.fn();
      grid.eventBus.on('breakpoint:changed', listener);

      // Change to same breakpoint - should not emit
      grid.actions.updateViewportWidth(600);
      expect(listener).not.toHaveBeenCalled();

      // Change to different breakpoint - should emit
      grid.actions.updateViewportWidth(700);
      expect(listener).toHaveBeenCalledWith({ minWidth: 640, columns: 2 }, 2);

      // Change to another breakpoint - should emit again
      grid.actions.updateViewportWidth(1100);
      expect(listener).toHaveBeenCalledWith({ minWidth: 1024, columns: 3 }, 3);

      expect(listener).toHaveBeenCalledTimes(2);

      grid.destroy();
    });

    it('should emit item:focused when setFocusedIndex is called', () => {
      const grid = createGridLayout({
        items,
        getId: (item) => item.id,
        breakpoints: [{ minWidth: 0, columns: 3 }],
      });

      const listener = vi.fn();
      grid.eventBus.on('item:focused', listener);

      grid.actions.setFocusedIndex(3);
      expect(listener).toHaveBeenCalledWith(3, '4');

      grid.destroy();
    });

    it('should not emit events when navigation is blocked', () => {
      const grid = createGridLayout({
        items,
        getId: (item) => item.id,
        breakpoints: [{ minWidth: 0, columns: 3 }],
        initialFocusedIndex: 0,
        wrap: false,
      });

      const listener = vi.fn();
      grid.eventBus.on('item:focused', listener);

      // Try to navigate left from first item with wrap disabled
      grid.actions.navigateLeft();
      expect(listener).not.toHaveBeenCalled();

      // Try to navigate up from first row with wrap disabled
      grid.actions.navigateUp();
      expect(listener).not.toHaveBeenCalled();

      grid.destroy();
    });
  });
});
