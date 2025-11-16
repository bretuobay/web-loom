import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ListSelectionBehaviorService } from '../index';
import { firstValueFrom, skip } from 'rxjs';

describe('ListSelectionBehaviorService', () => {
  let service: ListSelectionBehaviorService;

  beforeEach(() => {
    service = new ListSelectionBehaviorService();
  });

  describe('initialization', () => {
    it('should initialize with default state', () => {
      service.initialize();

      const state = service.getState();
      expect(state.selectedIds).toEqual([]);
      expect(state.lastSelectedId).toBeNull();
      expect(state.mode).toBe('single');
      expect(state.items).toEqual([]);
    });

    it('should initialize with provided items and mode', () => {
      service.initialize({
        items: ['item-1', 'item-2', 'item-3'],
        mode: 'multi',
      });

      const state = service.getState();
      expect(state.items).toEqual(['item-1', 'item-2', 'item-3']);
      expect(state.mode).toBe('multi');
    });
  });

  describe('Observable emissions', () => {
    it('should emit initial state through Observable', async () => {
      service.initialize({ items: ['item-1', 'item-2'] });

      const state = await firstValueFrom(service.getState$());
      expect(state.selectedIds).toEqual([]);
      expect(state.items).toEqual(['item-1', 'item-2']);
    });

    it('should emit state updates when selecting items', async () => {
      service.initialize({ items: ['item-1', 'item-2'] });

      const statePromise = firstValueFrom(service.getState$().pipe(skip(1)));
      service.actions.select('item-1');

      const state = await statePromise;
      expect(state.selectedIds).toEqual(['item-1']);
    });
  });

  describe('single selection mode', () => {
    it('should select only one item at a time', () => {
      service.initialize({
        items: ['item-1', 'item-2', 'item-3'],
        mode: 'single',
      });

      service.actions.select('item-1');
      expect(service.getState().selectedIds).toEqual(['item-1']);

      service.actions.select('item-2');
      expect(service.getState().selectedIds).toEqual(['item-2']);
    });

    it('should toggle selection in single mode', () => {
      service.initialize({
        items: ['item-1', 'item-2'],
        mode: 'single',
      });

      service.actions.toggleSelection('item-1');
      expect(service.getState().selectedIds).toEqual(['item-1']);

      service.actions.toggleSelection('item-1');
      expect(service.getState().selectedIds).toEqual([]);

      service.actions.toggleSelection('item-2');
      expect(service.getState().selectedIds).toEqual(['item-2']);
    });
  });

  describe('multi selection mode', () => {
    it('should select multiple items independently', () => {
      service.initialize({
        items: ['item-1', 'item-2', 'item-3'],
        mode: 'multi',
      });

      service.actions.select('item-1');
      expect(service.getState().selectedIds).toEqual(['item-1']);

      service.actions.select('item-2');
      expect(service.getState().selectedIds).toEqual(['item-1', 'item-2']);

      service.actions.select('item-3');
      expect(service.getState().selectedIds).toEqual(['item-1', 'item-2', 'item-3']);
    });

    it('should toggle selection in multi mode', () => {
      service.initialize({
        items: ['item-1', 'item-2', 'item-3'],
        mode: 'multi',
      });

      service.actions.toggleSelection('item-1');
      service.actions.toggleSelection('item-2');
      expect(service.getState().selectedIds).toEqual(['item-1', 'item-2']);

      service.actions.toggleSelection('item-1');
      expect(service.getState().selectedIds).toEqual(['item-2']);
    });
  });

  describe('range selection mode', () => {
    it('should select range of items', () => {
      service.initialize({
        items: ['item-1', 'item-2', 'item-3', 'item-4'],
        mode: 'range',
      });

      service.actions.selectRange('item-1', 'item-3');
      expect(service.getState().selectedIds).toEqual(['item-1', 'item-2', 'item-3']);
    });

    it('should handle reverse range selection', () => {
      service.initialize({
        items: ['item-1', 'item-2', 'item-3', 'item-4'],
        mode: 'range',
      });

      service.actions.selectRange('item-3', 'item-1');
      expect(service.getState().selectedIds).toEqual(['item-1', 'item-2', 'item-3']);
    });
  });

  describe('selection actions', () => {
    it('should deselect items', () => {
      service.initialize({
        items: ['item-1', 'item-2', 'item-3'],
        mode: 'multi',
        initialSelectedIds: ['item-1', 'item-2'],
      });

      service.actions.deselect('item-1');
      expect(service.getState().selectedIds).toEqual(['item-2']);
    });

    it('should clear all selections', () => {
      service.initialize({
        items: ['item-1', 'item-2', 'item-3'],
        mode: 'multi',
        initialSelectedIds: ['item-1', 'item-2'],
      });

      service.actions.clearSelection();
      expect(service.getState().selectedIds).toEqual([]);
    });

    it('should select all items in multi mode', () => {
      service.initialize({
        items: ['item-1', 'item-2', 'item-3'],
        mode: 'multi',
      });

      service.actions.selectAll();
      expect(service.getState().selectedIds).toEqual(['item-1', 'item-2', 'item-3']);
    });
  });

  describe('callbacks', () => {
    it('should invoke onSelectionChange callback', () => {
      const onSelectionChange = vi.fn();
      service.initialize({
        items: ['item-1', 'item-2'],
        onSelectionChange,
      });

      service.actions.select('item-1');

      expect(onSelectionChange).toHaveBeenCalledTimes(1);
      expect(onSelectionChange).toHaveBeenCalledWith(['item-1']);
    });
  });

  describe('cleanup on destroy', () => {
    it('should clean up behavior when service is destroyed', () => {
      service.initialize({ items: ['item-1', 'item-2'] });

      service.ngOnDestroy();

      expect(() => service.ngOnDestroy()).not.toThrow();
    });

    it('should complete Observable on destroy', async () => {
      service.initialize();

      const completePromise = new Promise<void>((resolve) => {
        service.getState$().subscribe({
          next: () => {},
          complete: () => {
            resolve();
          },
        });
      });

      service.ngOnDestroy();
      await completePromise;
    });
  });
});
