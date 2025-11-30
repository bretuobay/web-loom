import { describe, it, expect, vi } from 'vitest';
import { createListSelection } from '../list-selection';

describe('createListSelection', () => {
  describe('initial state', () => {
    it('should initialize with default state', () => {
      const selection = createListSelection();
      const state = selection.getState();

      expect(state.selectedIds).toEqual([]);
      expect(state.lastSelectedId).toBeNull();
      expect(state.mode).toBe('single');
      expect(state.items).toEqual([]);
    });

    it('should initialize with provided items', () => {
      const items = ['item-1', 'item-2', 'item-3'];
      const selection = createListSelection({ items });
      const state = selection.getState();

      expect(state.items).toEqual(items);
      expect(state.selectedIds).toEqual([]);
    });

    it('should initialize with initial selected ids', () => {
      const items = ['item-1', 'item-2', 'item-3'];
      const initialSelectedIds = ['item-1', 'item-2'];
      const selection = createListSelection({ items, initialSelectedIds });
      const state = selection.getState();

      expect(state.selectedIds).toEqual(initialSelectedIds);
      expect(state.lastSelectedId).toBe('item-2');
    });

    it('should initialize with specified mode', () => {
      const selection = createListSelection({ mode: 'multi' });
      expect(selection.getState().mode).toBe('multi');
    });
  });

  describe('single selection mode', () => {
    it('should select only one item at a time', () => {
      const items = ['item-1', 'item-2', 'item-3'];
      const selection = createListSelection({ items, mode: 'single' });

      selection.actions.select('item-1');
      expect(selection.getState().selectedIds).toEqual(['item-1']);

      selection.actions.select('item-2');
      expect(selection.getState().selectedIds).toEqual(['item-2']);
      expect(selection.getState().lastSelectedId).toBe('item-2');
    });

    it('should replace selection when selecting different item', () => {
      const items = ['item-1', 'item-2', 'item-3'];
      const selection = createListSelection({ items, mode: 'single', initialSelectedIds: ['item-1'] });

      selection.actions.select('item-3');
      expect(selection.getState().selectedIds).toEqual(['item-3']);
    });

    it('should not add duplicate when selecting already selected item', () => {
      const items = ['item-1', 'item-2', 'item-3'];
      const selection = createListSelection({ items, mode: 'single' });

      selection.actions.select('item-1');
      selection.actions.select('item-1');
      expect(selection.getState().selectedIds).toEqual(['item-1']);
    });

    it('should only select first item when selectAll is called', () => {
      const items = ['item-1', 'item-2', 'item-3'];
      const selection = createListSelection({ items, mode: 'single' });

      selection.actions.selectAll();
      expect(selection.getState().selectedIds).toEqual(['item-1']);
      expect(selection.getState().lastSelectedId).toBe('item-1');
    });

    it('should handle selectAll with empty items', () => {
      const selection = createListSelection({ items: [], mode: 'single' });

      selection.actions.selectAll();
      expect(selection.getState().selectedIds).toEqual([]);
      expect(selection.getState().lastSelectedId).toBeNull();
    });

    it('should only select end item when selectRange is called', () => {
      const items = ['item-1', 'item-2', 'item-3', 'item-4'];
      const selection = createListSelection({ items, mode: 'single' });

      selection.actions.selectRange('item-1', 'item-3');
      expect(selection.getState().selectedIds).toEqual(['item-3']);
      expect(selection.getState().lastSelectedId).toBe('item-3');
    });
  });

  describe('multi selection mode', () => {
    it('should allow multiple items to be selected independently', () => {
      const items = ['item-1', 'item-2', 'item-3'];
      const selection = createListSelection({ items, mode: 'multi' });

      selection.actions.select('item-1');
      expect(selection.getState().selectedIds).toEqual(['item-1']);

      selection.actions.select('item-2');
      expect(selection.getState().selectedIds).toEqual(['item-1', 'item-2']);

      selection.actions.select('item-3');
      expect(selection.getState().selectedIds).toEqual(['item-1', 'item-2', 'item-3']);
    });

    it('should not add duplicate when selecting already selected item', () => {
      const items = ['item-1', 'item-2', 'item-3'];
      const selection = createListSelection({ items, mode: 'multi' });

      selection.actions.select('item-1');
      selection.actions.select('item-2');
      selection.actions.select('item-1');
      expect(selection.getState().selectedIds).toEqual(['item-1', 'item-2']);
    });

    it('should update lastSelectedId to most recently selected item', () => {
      const items = ['item-1', 'item-2', 'item-3'];
      const selection = createListSelection({ items, mode: 'multi' });

      selection.actions.select('item-1');
      expect(selection.getState().lastSelectedId).toBe('item-1');

      selection.actions.select('item-3');
      expect(selection.getState().lastSelectedId).toBe('item-3');
    });

    it('should select all items when selectAll is called', () => {
      const items = ['item-1', 'item-2', 'item-3', 'item-4'];
      const selection = createListSelection({ items, mode: 'multi' });

      selection.actions.selectAll();
      expect(selection.getState().selectedIds).toEqual(items);
      expect(selection.getState().lastSelectedId).toBe('item-4');
    });

    it('should add range to existing selection when selectRange is called', () => {
      const items = ['item-1', 'item-2', 'item-3', 'item-4', 'item-5'];
      const selection = createListSelection({ items, mode: 'multi' });

      selection.actions.select('item-1');
      selection.actions.selectRange('item-3', 'item-5');

      const selectedIds = selection.getState().selectedIds;
      expect(selectedIds).toContain('item-1');
      expect(selectedIds).toContain('item-3');
      expect(selectedIds).toContain('item-4');
      expect(selectedIds).toContain('item-5');
    });
  });

  describe('range selection mode', () => {
    it('should allow multiple items to be selected', () => {
      const items = ['item-1', 'item-2', 'item-3'];
      const selection = createListSelection({ items, mode: 'range' });

      selection.actions.select('item-1');
      selection.actions.select('item-2');
      expect(selection.getState().selectedIds).toEqual(['item-1', 'item-2']);
    });

    it('should not add duplicate when selecting already selected item', () => {
      const items = ['item-1', 'item-2', 'item-3'];
      const selection = createListSelection({ items, mode: 'range' });

      selection.actions.select('item-1');
      selection.actions.select('item-2');
      selection.actions.select('item-1');
      expect(selection.getState().selectedIds).toEqual(['item-1', 'item-2']);
    });

    it('should select all items when selectAll is called', () => {
      const items = ['item-1', 'item-2', 'item-3', 'item-4'];
      const selection = createListSelection({ items, mode: 'range' });

      selection.actions.selectAll();
      expect(selection.getState().selectedIds).toEqual(items);
    });

    it('should add range to existing selection when selectRange is called', () => {
      const items = ['item-1', 'item-2', 'item-3', 'item-4', 'item-5'];
      const selection = createListSelection({ items, mode: 'range' });

      selection.actions.select('item-1');
      selection.actions.selectRange('item-3', 'item-5');

      const selectedIds = selection.getState().selectedIds;
      expect(selectedIds).toContain('item-1');
      expect(selectedIds).toContain('item-3');
      expect(selectedIds).toContain('item-4');
      expect(selectedIds).toContain('item-5');
    });
  });

  describe('selectRange action', () => {
    it('should select all items in range from start to end', () => {
      const items = ['item-1', 'item-2', 'item-3', 'item-4', 'item-5'];
      const selection = createListSelection({ items, mode: 'range' });

      selection.actions.selectRange('item-2', 'item-4');
      expect(selection.getState().selectedIds).toEqual(['item-2', 'item-3', 'item-4']);
      expect(selection.getState().lastSelectedId).toBe('item-4');
    });

    it('should handle reverse range selection', () => {
      const items = ['item-1', 'item-2', 'item-3', 'item-4', 'item-5'];
      const selection = createListSelection({ items, mode: 'range' });

      selection.actions.selectRange('item-4', 'item-2');
      expect(selection.getState().selectedIds).toEqual(['item-2', 'item-3', 'item-4']);
      expect(selection.getState().lastSelectedId).toBe('item-2');
    });

    it('should select single item when start and end are the same', () => {
      const items = ['item-1', 'item-2', 'item-3'];
      const selection = createListSelection({ items, mode: 'range' });

      selection.actions.selectRange('item-2', 'item-2');
      expect(selection.getState().selectedIds).toEqual(['item-2']);
    });

    it('should do nothing when start item is not in list', () => {
      const items = ['item-1', 'item-2', 'item-3'];
      const selection = createListSelection({ items, mode: 'range' });

      selection.actions.selectRange('item-99', 'item-2');
      expect(selection.getState().selectedIds).toEqual([]);
    });

    it('should do nothing when end item is not in list', () => {
      const items = ['item-1', 'item-2', 'item-3'];
      const selection = createListSelection({ items, mode: 'range' });

      selection.actions.selectRange('item-1', 'item-99');
      expect(selection.getState().selectedIds).toEqual([]);
    });

    it('should add range to existing selection in multi mode', () => {
      const items = ['item-1', 'item-2', 'item-3', 'item-4', 'item-5'];
      const selection = createListSelection({ items, mode: 'multi' });

      selection.actions.select('item-1');
      selection.actions.select('item-5');
      selection.actions.selectRange('item-2', 'item-3');

      const selectedIds = selection.getState().selectedIds;
      expect(selectedIds).toContain('item-1');
      expect(selectedIds).toContain('item-2');
      expect(selectedIds).toContain('item-3');
      expect(selectedIds).toContain('item-5');
      expect(selectedIds.length).toBe(4);
    });

    it('should handle range selection with first and last items', () => {
      const items = ['item-1', 'item-2', 'item-3', 'item-4'];
      const selection = createListSelection({ items, mode: 'range' });

      selection.actions.selectRange('item-1', 'item-4');
      expect(selection.getState().selectedIds).toEqual(items);
    });
  });

  describe('toggleSelection action', () => {
    it('should select item when not selected', () => {
      const items = ['item-1', 'item-2', 'item-3'];
      const selection = createListSelection({ items, mode: 'multi' });

      selection.actions.toggleSelection('item-1');
      expect(selection.getState().selectedIds).toEqual(['item-1']);
    });

    it('should deselect item when already selected', () => {
      const items = ['item-1', 'item-2', 'item-3'];
      const selection = createListSelection({ items, mode: 'multi', initialSelectedIds: ['item-1', 'item-2'] });

      selection.actions.toggleSelection('item-1');
      expect(selection.getState().selectedIds).toEqual(['item-2']);
    });

    it('should toggle multiple times correctly', () => {
      const items = ['item-1', 'item-2', 'item-3'];
      const selection = createListSelection({ items, mode: 'multi' });

      selection.actions.toggleSelection('item-1');
      expect(selection.getState().selectedIds).toEqual(['item-1']);

      selection.actions.toggleSelection('item-1');
      expect(selection.getState().selectedIds).toEqual([]);

      selection.actions.toggleSelection('item-1');
      expect(selection.getState().selectedIds).toEqual(['item-1']);
    });

    it('should replace selection in single mode when toggling unselected item', () => {
      const items = ['item-1', 'item-2', 'item-3'];
      const selection = createListSelection({ items, mode: 'single', initialSelectedIds: ['item-1'] });

      selection.actions.toggleSelection('item-2');
      expect(selection.getState().selectedIds).toEqual(['item-2']);
    });

    it('should deselect in single mode when toggling selected item', () => {
      const items = ['item-1', 'item-2', 'item-3'];
      const selection = createListSelection({ items, mode: 'single', initialSelectedIds: ['item-1'] });

      selection.actions.toggleSelection('item-1');
      expect(selection.getState().selectedIds).toEqual([]);
      expect(selection.getState().lastSelectedId).toBeNull();
    });

    it('should update lastSelectedId when toggling to select', () => {
      const items = ['item-1', 'item-2', 'item-3'];
      const selection = createListSelection({ items, mode: 'multi' });

      selection.actions.toggleSelection('item-2');
      expect(selection.getState().lastSelectedId).toBe('item-2');
    });

    it('should update lastSelectedId when toggling to deselect', () => {
      const items = ['item-1', 'item-2', 'item-3'];
      const selection = createListSelection({ items, mode: 'multi', initialSelectedIds: ['item-1', 'item-2'] });

      selection.actions.toggleSelection('item-1');
      expect(selection.getState().lastSelectedId).toBe('item-2');
    });

    it('should do nothing when toggling item not in list', () => {
      const items = ['item-1', 'item-2', 'item-3'];
      const selection = createListSelection({ items, mode: 'multi' });

      selection.actions.toggleSelection('item-99');
      expect(selection.getState().selectedIds).toEqual([]);
    });
  });

  describe('clearSelection action', () => {
    it('should clear all selected items', () => {
      const items = ['item-1', 'item-2', 'item-3'];
      const selection = createListSelection({ items, mode: 'multi', initialSelectedIds: ['item-1', 'item-2'] });

      selection.actions.clearSelection();
      expect(selection.getState().selectedIds).toEqual([]);
      expect(selection.getState().lastSelectedId).toBeNull();
    });

    it('should handle clearing when no items are selected', () => {
      const items = ['item-1', 'item-2', 'item-3'];
      const selection = createListSelection({ items, mode: 'multi' });

      selection.actions.clearSelection();
      expect(selection.getState().selectedIds).toEqual([]);
      expect(selection.getState().lastSelectedId).toBeNull();
    });

    it('should work in single selection mode', () => {
      const items = ['item-1', 'item-2', 'item-3'];
      const selection = createListSelection({ items, mode: 'single', initialSelectedIds: ['item-1'] });

      selection.actions.clearSelection();
      expect(selection.getState().selectedIds).toEqual([]);
      expect(selection.getState().lastSelectedId).toBeNull();
    });
  });

  describe('selectAll action', () => {
    it('should select all items in multi mode', () => {
      const items = ['item-1', 'item-2', 'item-3', 'item-4'];
      const selection = createListSelection({ items, mode: 'multi' });

      selection.actions.selectAll();
      expect(selection.getState().selectedIds).toEqual(items);
      expect(selection.getState().lastSelectedId).toBe('item-4');
    });

    it('should select all items in range mode', () => {
      const items = ['item-1', 'item-2', 'item-3', 'item-4'];
      const selection = createListSelection({ items, mode: 'range' });

      selection.actions.selectAll();
      expect(selection.getState().selectedIds).toEqual(items);
    });

    it('should handle selectAll with empty items array', () => {
      const selection = createListSelection({ items: [], mode: 'multi' });

      selection.actions.selectAll();
      expect(selection.getState().selectedIds).toEqual([]);
      expect(selection.getState().lastSelectedId).toBeNull();
    });

    it('should replace existing selection with all items', () => {
      const items = ['item-1', 'item-2', 'item-3', 'item-4'];
      const selection = createListSelection({ items, mode: 'multi', initialSelectedIds: ['item-1'] });

      selection.actions.selectAll();
      expect(selection.getState().selectedIds).toEqual(items);
    });
  });

  describe('deselect action', () => {
    it('should remove item from selection', () => {
      const items = ['item-1', 'item-2', 'item-3'];
      const selection = createListSelection({
        items,
        mode: 'multi',
        initialSelectedIds: ['item-1', 'item-2', 'item-3'],
      });

      selection.actions.deselect('item-2');
      expect(selection.getState().selectedIds).toEqual(['item-1', 'item-3']);
    });

    it('should update lastSelectedId when deselecting', () => {
      const items = ['item-1', 'item-2', 'item-3'];
      const selection = createListSelection({ items, mode: 'multi', initialSelectedIds: ['item-1', 'item-2'] });

      selection.actions.deselect('item-2');
      expect(selection.getState().lastSelectedId).toBe('item-1');
    });

    it('should set lastSelectedId to null when deselecting last item', () => {
      const items = ['item-1', 'item-2', 'item-3'];
      const selection = createListSelection({ items, mode: 'multi', initialSelectedIds: ['item-1'] });

      selection.actions.deselect('item-1');
      expect(selection.getState().selectedIds).toEqual([]);
      expect(selection.getState().lastSelectedId).toBeNull();
    });

    it('should handle deselecting item that is not selected', () => {
      const items = ['item-1', 'item-2', 'item-3'];
      const selection = createListSelection({ items, mode: 'multi', initialSelectedIds: ['item-1'] });

      selection.actions.deselect('item-2');
      expect(selection.getState().selectedIds).toEqual(['item-1']);
    });

    it('should work in single selection mode', () => {
      const items = ['item-1', 'item-2', 'item-3'];
      const selection = createListSelection({ items, mode: 'single', initialSelectedIds: ['item-1'] });

      selection.actions.deselect('item-1');
      expect(selection.getState().selectedIds).toEqual([]);
    });
  });

  describe('mode switching behavior', () => {
    it('should maintain selection when mode is consistent', () => {
      const items = ['item-1', 'item-2', 'item-3'];
      const selection = createListSelection({ items, mode: 'multi', initialSelectedIds: ['item-1', 'item-2'] });

      expect(selection.getState().selectedIds).toEqual(['item-1', 'item-2']);
      expect(selection.getState().mode).toBe('multi');
    });

    it('should respect single mode constraints from initialization', () => {
      const items = ['item-1', 'item-2', 'item-3'];
      const selection = createListSelection({ items, mode: 'single' });

      selection.actions.select('item-1');
      selection.actions.select('item-2');
      expect(selection.getState().selectedIds).toEqual(['item-2']);
    });

    it('should respect multi mode constraints from initialization', () => {
      const items = ['item-1', 'item-2', 'item-3'];
      const selection = createListSelection({ items, mode: 'multi' });

      selection.actions.select('item-1');
      selection.actions.select('item-2');
      selection.actions.select('item-3');
      expect(selection.getState().selectedIds).toEqual(['item-1', 'item-2', 'item-3']);
    });

    it('should respect range mode constraints from initialization', () => {
      const items = ['item-1', 'item-2', 'item-3', 'item-4'];
      const selection = createListSelection({ items, mode: 'range' });

      selection.actions.selectRange('item-1', 'item-3');
      expect(selection.getState().selectedIds).toEqual(['item-1', 'item-2', 'item-3']);
    });
  });

  describe('onSelectionChange callback', () => {
    it('should invoke callback when selection changes', () => {
      const items = ['item-1', 'item-2', 'item-3'];
      const onSelectionChange = vi.fn();
      const selection = createListSelection({ items, mode: 'multi', onSelectionChange });

      selection.actions.select('item-1');
      expect(onSelectionChange).toHaveBeenCalledWith(['item-1']);

      selection.actions.select('item-2');
      expect(onSelectionChange).toHaveBeenCalledWith(['item-1', 'item-2']);
    });

    it('should invoke callback when deselecting', () => {
      const items = ['item-1', 'item-2', 'item-3'];
      const onSelectionChange = vi.fn();
      const selection = createListSelection({
        items,
        mode: 'multi',
        initialSelectedIds: ['item-1', 'item-2'],
        onSelectionChange,
      });

      selection.actions.deselect('item-1');
      expect(onSelectionChange).toHaveBeenCalledWith(['item-2']);
    });

    it('should invoke callback when toggling selection', () => {
      const items = ['item-1', 'item-2', 'item-3'];
      const onSelectionChange = vi.fn();
      const selection = createListSelection({ items, mode: 'multi', onSelectionChange });

      selection.actions.toggleSelection('item-1');
      expect(onSelectionChange).toHaveBeenCalledWith(['item-1']);

      selection.actions.toggleSelection('item-1');
      expect(onSelectionChange).toHaveBeenCalledWith([]);
    });

    it('should invoke callback when clearing selection', () => {
      const items = ['item-1', 'item-2', 'item-3'];
      const onSelectionChange = vi.fn();
      const selection = createListSelection({
        items,
        mode: 'multi',
        initialSelectedIds: ['item-1'],
        onSelectionChange,
      });

      selection.actions.clearSelection();
      expect(onSelectionChange).toHaveBeenCalledWith([]);
    });

    it('should invoke callback when selecting all', () => {
      const items = ['item-1', 'item-2', 'item-3'];
      const onSelectionChange = vi.fn();
      const selection = createListSelection({ items, mode: 'multi', onSelectionChange });

      selection.actions.selectAll();
      expect(onSelectionChange).toHaveBeenCalledWith(items);
    });

    it('should invoke callback when selecting range', () => {
      const items = ['item-1', 'item-2', 'item-3', 'item-4'];
      const onSelectionChange = vi.fn();
      const selection = createListSelection({ items, mode: 'range', onSelectionChange });

      selection.actions.selectRange('item-2', 'item-4');
      expect(onSelectionChange).toHaveBeenCalled();
      const callArg = onSelectionChange.mock.calls[0][0];
      expect(callArg).toContain('item-2');
      expect(callArg).toContain('item-3');
      expect(callArg).toContain('item-4');
    });
  });

  describe('subscribe', () => {
    it('should notify subscribers when state changes', () => {
      const items = ['item-1', 'item-2', 'item-3'];
      const selection = createListSelection({ items, mode: 'multi' });
      const listener = vi.fn();

      selection.subscribe(listener);
      selection.actions.select('item-1');

      expect(listener).toHaveBeenCalled();
      const lastCall = listener.mock.calls[listener.mock.calls.length - 1];
      expect(lastCall[0]).toMatchObject({
        selectedIds: ['item-1'],
        lastSelectedId: 'item-1',
      });
    });

    it('should support multiple subscribers', () => {
      const items = ['item-1', 'item-2', 'item-3'];
      const selection = createListSelection({ items, mode: 'multi' });
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      selection.subscribe(listener1);
      selection.subscribe(listener2);

      selection.actions.select('item-1');

      expect(listener1).toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();
    });

    it('should allow unsubscribing', () => {
      const items = ['item-1', 'item-2', 'item-3'];
      const selection = createListSelection({ items, mode: 'multi' });
      const listener = vi.fn();

      const unsubscribe = selection.subscribe(listener);
      unsubscribe();

      selection.actions.select('item-1');

      expect(listener).not.toHaveBeenCalled();
    });

    it('should notify subscribers on deselect', () => {
      const items = ['item-1', 'item-2', 'item-3'];
      const selection = createListSelection({ items, mode: 'multi', initialSelectedIds: ['item-1', 'item-2'] });
      const listener = vi.fn();

      selection.subscribe(listener);
      selection.actions.deselect('item-1');

      expect(listener).toHaveBeenCalled();
      const lastCall = listener.mock.calls[listener.mock.calls.length - 1];
      expect(lastCall[0]).toMatchObject({
        selectedIds: ['item-2'],
      });
    });
  });

  describe('destroy', () => {
    it('should clean up subscriptions when destroyed', () => {
      const items = ['item-1', 'item-2', 'item-3'];
      const selection = createListSelection({ items, mode: 'multi' });
      const listener = vi.fn();

      selection.subscribe(listener);
      selection.destroy();

      selection.actions.select('item-1');

      expect(listener).not.toHaveBeenCalled();
    });

    it('should handle multiple destroy calls gracefully', () => {
      const selection = createListSelection();

      expect(() => {
        selection.destroy();
        selection.destroy();
      }).not.toThrow();
    });

    it('should clean up all subscribers', () => {
      const items = ['item-1', 'item-2', 'item-3'];
      const selection = createListSelection({ items, mode: 'multi' });
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      const listener3 = vi.fn();

      selection.subscribe(listener1);
      selection.subscribe(listener2);
      selection.subscribe(listener3);

      selection.destroy();
      selection.actions.select('item-1');

      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).not.toHaveBeenCalled();
      expect(listener3).not.toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should handle selecting item not in items list', () => {
      const items = ['item-1', 'item-2', 'item-3'];
      const selection = createListSelection({ items, mode: 'multi' });

      selection.actions.select('item-99');
      expect(selection.getState().selectedIds).toEqual([]);
    });

    it('should handle empty items array by allowing any selection', () => {
      const selection = createListSelection({ items: [], mode: 'multi' });

      // With empty items array, selection is allowed (for dynamic/async items)
      selection.actions.select('item-1');
      expect(selection.getState().selectedIds).toEqual(['item-1']);

      selection.actions.select('item-2');
      expect(selection.getState().selectedIds).toEqual(['item-1', 'item-2']);
    });

    it('should maintain selection order in multi mode', () => {
      const items = ['item-1', 'item-2', 'item-3', 'item-4'];
      const selection = createListSelection({ items, mode: 'multi' });

      selection.actions.select('item-3');
      selection.actions.select('item-1');
      selection.actions.select('item-4');
      expect(selection.getState().selectedIds).toEqual(['item-3', 'item-1', 'item-4']);
    });

    it('should handle large item lists efficiently', () => {
      const items = Array.from({ length: 1000 }, (_, i) => `item-${i}`);
      const selection = createListSelection({ items, mode: 'range' });

      selection.actions.selectRange('item-0', 'item-999');
      expect(selection.getState().selectedIds.length).toBe(1000);
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete selection lifecycle', () => {
      const items = ['item-1', 'item-2', 'item-3', 'item-4', 'item-5'];
      const onSelectionChange = vi.fn();
      const listener = vi.fn();

      const selection = createListSelection({
        items,
        mode: 'multi',
        onSelectionChange,
      });

      selection.subscribe(listener);

      // Select items
      selection.actions.select('item-1');
      expect(selection.getState().selectedIds).toEqual(['item-1']);
      expect(onSelectionChange).toHaveBeenCalledWith(['item-1']);

      selection.actions.select('item-3');
      expect(selection.getState().selectedIds).toEqual(['item-1', 'item-3']);

      // Toggle
      selection.actions.toggleSelection('item-2');
      expect(selection.getState().selectedIds).toEqual(['item-1', 'item-3', 'item-2']);

      // Deselect
      selection.actions.deselect('item-1');
      expect(selection.getState().selectedIds).toEqual(['item-3', 'item-2']);

      // Select range
      selection.actions.selectRange('item-4', 'item-5');
      const selectedIds = selection.getState().selectedIds;
      expect(selectedIds).toContain('item-3');
      expect(selectedIds).toContain('item-2');
      expect(selectedIds).toContain('item-4');
      expect(selectedIds).toContain('item-5');

      // Clear
      selection.actions.clearSelection();
      expect(selection.getState().selectedIds).toEqual([]);

      expect(listener).toHaveBeenCalled();

      selection.destroy();
    });

    it('should maintain state consistency across different modes', () => {
      const items = ['item-1', 'item-2', 'item-3', 'item-4'];

      // Single mode
      const singleSelection = createListSelection({ items, mode: 'single' });
      singleSelection.actions.select('item-1');
      singleSelection.actions.select('item-2');
      expect(singleSelection.getState().selectedIds).toEqual(['item-2']);
      singleSelection.destroy();

      // Multi mode
      const multiSelection = createListSelection({ items, mode: 'multi' });
      multiSelection.actions.select('item-1');
      multiSelection.actions.select('item-2');
      expect(multiSelection.getState().selectedIds).toEqual(['item-1', 'item-2']);
      multiSelection.destroy();

      // Range mode
      const rangeSelection = createListSelection({ items, mode: 'range' });
      rangeSelection.actions.selectRange('item-1', 'item-3');
      expect(rangeSelection.getState().selectedIds).toEqual(['item-1', 'item-2', 'item-3']);
      rangeSelection.destroy();
    });
  });
});
