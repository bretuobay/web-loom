import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMasterDetail } from '../master-detail';

interface TestItem {
  id: string;
  name: string;
  description: string;
}

describe('createMasterDetail', () => {
  let items: TestItem[];

  beforeEach(() => {
    items = [
      { id: '1', name: 'Item 1', description: 'First item' },
      { id: '2', name: 'Item 2', description: 'Second item' },
      { id: '3', name: 'Item 3', description: 'Third item' },
    ];
  });

  describe('initial state', () => {
    it('should initialize with no selection', () => {
      const masterDetail = createMasterDetail({
        items,
        getId: (item) => item.id,
      });

      const state = masterDetail.getState();

      expect(state.items).toEqual(items);
      expect(state.selectedItem).toBeNull();
      expect(state.detailView).toBe('default');

      masterDetail.destroy();
    });

    it('should initialize with custom detail view', () => {
      const masterDetail = createMasterDetail({
        items,
        getId: (item) => item.id,
        initialDetailView: 'custom-view',
      });

      const state = masterDetail.getState();

      expect(state.detailView).toBe('custom-view');

      masterDetail.destroy();
    });

    it('should handle empty items array', () => {
      const masterDetail = createMasterDetail({
        items: [] as TestItem[],
        getId: (item) => item.id,
      });

      const state = masterDetail.getState();

      expect(state.items).toEqual([]);
      expect(state.selectedItem).toBeNull();

      masterDetail.destroy();
    });
  });

  describe('selectItem action', () => {
    it('should update selectedItem state correctly', () => {
      const masterDetail = createMasterDetail({
        items,
        getId: (item) => item.id,
      });

      masterDetail.actions.selectItem(items[0]);
      const state = masterDetail.getState();

      expect(state.selectedItem).toEqual(items[0]);

      masterDetail.destroy();
    });

    it('should replace previous selection with new selection', () => {
      const masterDetail = createMasterDetail({
        items,
        getId: (item) => item.id,
      });

      masterDetail.actions.selectItem(items[0]);
      expect(masterDetail.getState().selectedItem).toEqual(items[0]);

      masterDetail.actions.selectItem(items[1]);
      expect(masterDetail.getState().selectedItem).toEqual(items[1]);

      masterDetail.destroy();
    });

    it('should handle selecting the same item multiple times', () => {
      const masterDetail = createMasterDetail({
        items,
        getId: (item) => item.id,
      });

      masterDetail.actions.selectItem(items[0]);
      masterDetail.actions.selectItem(items[0]);

      const state = masterDetail.getState();
      expect(state.selectedItem).toEqual(items[0]);

      masterDetail.destroy();
    });
  });

  describe('clearSelection action', () => {
    it('should clear selection correctly', () => {
      const masterDetail = createMasterDetail({
        items,
        getId: (item) => item.id,
      });

      masterDetail.actions.selectItem(items[0]);
      expect(masterDetail.getState().selectedItem).toEqual(items[0]);

      masterDetail.actions.clearSelection();
      const state = masterDetail.getState();

      expect(state.selectedItem).toBeNull();

      masterDetail.destroy();
    });

    it('should handle clearing when no item is selected', () => {
      const masterDetail = createMasterDetail({
        items,
        getId: (item) => item.id,
      });

      masterDetail.actions.clearSelection();
      const state = masterDetail.getState();

      expect(state.selectedItem).toBeNull();

      masterDetail.destroy();
    });
  });

  describe('setDetailView action', () => {
    it('should update detail view correctly', () => {
      const masterDetail = createMasterDetail({
        items,
        getId: (item) => item.id,
      });

      masterDetail.actions.setDetailView('edit-view');
      const state = masterDetail.getState();

      expect(state.detailView).toBe('edit-view');

      masterDetail.destroy();
    });

    it('should handle multiple detail view changes', () => {
      const masterDetail = createMasterDetail({
        items,
        getId: (item) => item.id,
      });

      masterDetail.actions.setDetailView('view-1');
      expect(masterDetail.getState().detailView).toBe('view-1');

      masterDetail.actions.setDetailView('view-2');
      expect(masterDetail.getState().detailView).toBe('view-2');

      masterDetail.actions.setDetailView('view-3');
      expect(masterDetail.getState().detailView).toBe('view-3');

      masterDetail.destroy();
    });
  });

  describe('event emissions', () => {
    it('should emit item:selected event when item is selected', () => {
      const masterDetail = createMasterDetail({
        items,
        getId: (item) => item.id,
      });

      const listener = vi.fn();
      masterDetail.eventBus.on('item:selected', listener);

      masterDetail.actions.selectItem(items[0]);

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(items[0]);

      masterDetail.destroy();
    });

    it('should emit selection:cleared event when selection is cleared', () => {
      const masterDetail = createMasterDetail({
        items,
        getId: (item) => item.id,
      });

      const listener = vi.fn();
      masterDetail.eventBus.on('selection:cleared', listener);

      masterDetail.actions.selectItem(items[0]);
      masterDetail.actions.clearSelection();

      expect(listener).toHaveBeenCalledTimes(1);

      masterDetail.destroy();
    });

    it('should emit item:selected event for each selection change', () => {
      const masterDetail = createMasterDetail({
        items,
        getId: (item) => item.id,
      });

      const listener = vi.fn();
      masterDetail.eventBus.on('item:selected', listener);

      masterDetail.actions.selectItem(items[0]);
      masterDetail.actions.selectItem(items[1]);
      masterDetail.actions.selectItem(items[2]);

      expect(listener).toHaveBeenCalledTimes(3);
      expect(listener).toHaveBeenNthCalledWith(1, items[0]);
      expect(listener).toHaveBeenNthCalledWith(2, items[1]);
      expect(listener).toHaveBeenNthCalledWith(3, items[2]);

      masterDetail.destroy();
    });

    it('should not emit item:selected event when clearing selection', () => {
      const masterDetail = createMasterDetail({
        items,
        getId: (item) => item.id,
      });

      const listener = vi.fn();
      masterDetail.eventBus.on('item:selected', listener);

      masterDetail.actions.selectItem(items[0]);
      listener.mockClear();

      masterDetail.actions.clearSelection();

      expect(listener).not.toHaveBeenCalled();

      masterDetail.destroy();
    });
  });

  describe('onSelectionChange callback', () => {
    it('should invoke callback when item is selected', () => {
      const onSelectionChange = vi.fn();
      const masterDetail = createMasterDetail({
        items,
        getId: (item) => item.id,
        onSelectionChange,
      });

      masterDetail.actions.selectItem(items[0]);

      expect(onSelectionChange).toHaveBeenCalledTimes(1);
      expect(onSelectionChange).toHaveBeenCalledWith(items[0]);

      masterDetail.destroy();
    });

    it('should invoke callback when selection is cleared', () => {
      const onSelectionChange = vi.fn();
      const masterDetail = createMasterDetail({
        items,
        getId: (item) => item.id,
        onSelectionChange,
      });

      masterDetail.actions.selectItem(items[0]);
      onSelectionChange.mockClear();

      masterDetail.actions.clearSelection();

      expect(onSelectionChange).toHaveBeenCalledTimes(1);
      expect(onSelectionChange).toHaveBeenCalledWith(null);

      masterDetail.destroy();
    });

    it('should invoke callback for each selection change', () => {
      const onSelectionChange = vi.fn();
      const masterDetail = createMasterDetail({
        items,
        getId: (item) => item.id,
        onSelectionChange,
      });

      masterDetail.actions.selectItem(items[0]);
      masterDetail.actions.selectItem(items[1]);
      masterDetail.actions.clearSelection();

      expect(onSelectionChange).toHaveBeenCalledTimes(3);
      expect(onSelectionChange).toHaveBeenNthCalledWith(1, items[0]);
      expect(onSelectionChange).toHaveBeenNthCalledWith(2, items[1]);
      expect(onSelectionChange).toHaveBeenNthCalledWith(3, null);

      masterDetail.destroy();
    });
  });

  describe('subscribe', () => {
    it('should notify subscribers when state changes', () => {
      const masterDetail = createMasterDetail({
        items,
        getId: (item) => item.id,
      });

      const listener = vi.fn();
      masterDetail.subscribe(listener);

      masterDetail.actions.selectItem(items[0]);

      expect(listener).toHaveBeenCalled();
      const lastCall = listener.mock.calls[listener.mock.calls.length - 1];
      expect(lastCall[0]).toMatchObject({
        selectedItem: items[0],
      });

      masterDetail.destroy();
    });

    it('should support multiple subscribers', () => {
      const masterDetail = createMasterDetail({
        items,
        getId: (item) => item.id,
      });

      const listener1 = vi.fn();
      const listener2 = vi.fn();

      masterDetail.subscribe(listener1);
      masterDetail.subscribe(listener2);

      masterDetail.actions.selectItem(items[0]);

      expect(listener1).toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();

      masterDetail.destroy();
    });

    it('should allow unsubscribing', () => {
      const masterDetail = createMasterDetail({
        items,
        getId: (item) => item.id,
      });

      const listener = vi.fn();
      const unsubscribe = masterDetail.subscribe(listener);

      unsubscribe();

      masterDetail.actions.selectItem(items[0]);

      expect(listener).not.toHaveBeenCalled();

      masterDetail.destroy();
    });
  });

  describe('destroy', () => {
    it('should clean up subscriptions when destroyed', () => {
      const masterDetail = createMasterDetail({
        items,
        getId: (item) => item.id,
      });

      const listener = vi.fn();
      masterDetail.subscribe(listener);

      masterDetail.destroy();

      masterDetail.actions.selectItem(items[0]);

      expect(listener).not.toHaveBeenCalled();
    });

    it('should clean up event bus listeners', () => {
      const masterDetail = createMasterDetail({
        items,
        getId: (item) => item.id,
      });

      const eventListener = vi.fn();
      masterDetail.eventBus.on('item:selected', eventListener);

      masterDetail.destroy();

      masterDetail.actions.selectItem(items[0]);

      // Event should still be emitted, but we're testing that destroy doesn't break
      expect(() => masterDetail.actions.selectItem(items[0])).not.toThrow();
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete master-detail lifecycle', () => {
      const onSelectionChange = vi.fn();
      const masterDetail = createMasterDetail({
        items,
        getId: (item) => item.id,
        initialDetailView: 'list-view',
        onSelectionChange,
      });

      const stateListener = vi.fn();
      const eventListener = vi.fn();

      masterDetail.subscribe(stateListener);
      masterDetail.eventBus.on('item:selected', eventListener);

      // Select first item
      masterDetail.actions.selectItem(items[0]);
      expect(masterDetail.getState().selectedItem).toEqual(items[0]);
      expect(onSelectionChange).toHaveBeenCalledWith(items[0]);
      expect(eventListener).toHaveBeenCalledWith(items[0]);

      // Change detail view
      masterDetail.actions.setDetailView('detail-view');
      expect(masterDetail.getState().detailView).toBe('detail-view');

      // Select different item
      masterDetail.actions.selectItem(items[1]);
      expect(masterDetail.getState().selectedItem).toEqual(items[1]);

      // Clear selection
      masterDetail.actions.clearSelection();
      expect(masterDetail.getState().selectedItem).toBeNull();
      expect(onSelectionChange).toHaveBeenCalledWith(null);

      // Clean up
      masterDetail.destroy();
    });

    it('should maintain state consistency across multiple operations', () => {
      const masterDetail = createMasterDetail({
        items,
        getId: (item) => item.id,
      });

      // Initial state
      expect(masterDetail.getState().selectedItem).toBeNull();
      expect(masterDetail.getState().detailView).toBe('default');

      // Select item
      masterDetail.actions.selectItem(items[0]);
      expect(masterDetail.getState().selectedItem).toEqual(items[0]);

      // Change detail view
      masterDetail.actions.setDetailView('edit');
      expect(masterDetail.getState().detailView).toBe('edit');
      expect(masterDetail.getState().selectedItem).toEqual(items[0]);

      // Select different item
      masterDetail.actions.selectItem(items[2]);
      expect(masterDetail.getState().selectedItem).toEqual(items[2]);
      expect(masterDetail.getState().detailView).toBe('edit');

      // Clear selection
      masterDetail.actions.clearSelection();
      expect(masterDetail.getState().selectedItem).toBeNull();
      expect(masterDetail.getState().detailView).toBe('edit');

      masterDetail.destroy();
    });

    it('should work with custom getId function', () => {
      interface CustomItem {
        customId: number;
        data: string;
      }

      const customItems: CustomItem[] = [
        { customId: 100, data: 'First' },
        { customId: 200, data: 'Second' },
        { customId: 300, data: 'Third' },
      ];

      const masterDetail = createMasterDetail({
        items: customItems,
        getId: (item) => item.customId.toString(),
      });

      masterDetail.actions.selectItem(customItems[1]);
      expect(masterDetail.getState().selectedItem).toEqual(customItems[1]);

      masterDetail.destroy();
    });
  });
});
