import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DragDropBehaviorService } from '../drag-drop-behavior.service';
import { firstValueFrom, skip } from 'rxjs';

describe('DragDropBehaviorService', () => {
  let service: DragDropBehaviorService;

  beforeEach(() => {
    service = new DragDropBehaviorService();
  });

  describe('initialization', () => {
    it('should initialize with default state', () => {
      service.initialize();

      const state = service.getState();
      expect(state.draggedItem).toBeNull();
      expect(state.dropTarget).toBeNull();
      expect(state.isDragging).toBe(false);
      expect(state.dragData).toBeNull();
      expect(state.dropZones).toEqual([]);
      expect(state.dragOverZone).toBeNull();
    });

    it('should initialize with callbacks', () => {
      const onDragStart = vi.fn();
      const onDragEnd = vi.fn();
      const onDrop = vi.fn();
      
      service.initialize({
        onDragStart,
        onDragEnd,
        onDrop,
      });

      expect(service.getState()).toBeDefined();
    });

    it('should initialize with validateDrop callback', () => {
      const validateDrop = vi.fn(() => true);
      
      service.initialize({ validateDrop });

      expect(service.getState()).toBeDefined();
    });
  });

  describe('Observable emissions', () => {
    it('should emit initial state through Observable', async () => {
      service.initialize();

      const state = await firstValueFrom(service.getState$());
      expect(state.isDragging).toBe(false);
      expect(state.draggedItem).toBeNull();
    });

    it('should emit state updates when starting drag', async () => {
      service.initialize();

      const statePromise = firstValueFrom(service.getState$().pipe(skip(1)));
      
      service.actions.startDrag('item-1', { title: 'Item 1' });

      const state = await statePromise;
      expect(state.isDragging).toBe(true);
      expect(state.draggedItem).toBe('item-1');
    });
  });

  describe('drag operations', () => {
    it('should start drag', () => {
      service.initialize();

      const dragData = { title: 'Item 1' };
      service.actions.startDrag('item-1', dragData);

      const state = service.getState();
      expect(state.isDragging).toBe(true);
      expect(state.draggedItem).toBe('item-1');
      expect(state.dragData).toEqual(dragData);
    });

    it('should end drag', () => {
      service.initialize();

      service.actions.startDrag('item-1');
      service.actions.endDrag();

      const state = service.getState();
      expect(state.isDragging).toBe(false);
      expect(state.draggedItem).toBeNull();
      expect(state.dragData).toBeNull();
    });

    it('should call onDragStart callback', () => {
      const onDragStart = vi.fn();
      service.initialize({ onDragStart });

      const dragData = { title: 'Item 1' };
      service.actions.startDrag('item-1', dragData);

      expect(onDragStart).toHaveBeenCalledWith('item-1', dragData);
    });

    it('should call onDragEnd callback', () => {
      const onDragEnd = vi.fn();
      service.initialize({ onDragEnd });

      service.actions.startDrag('item-1');
      service.actions.endDrag();

      expect(onDragEnd).toHaveBeenCalledWith('item-1');
    });
  });

  describe('drop zone management', () => {
    it('should register drop zone', () => {
      service.initialize();

      service.actions.registerDropZone('zone-1');

      const state = service.getState();
      expect(state.dropZones).toContain('zone-1');
    });

    it('should unregister drop zone', () => {
      service.initialize();

      service.actions.registerDropZone('zone-1');
      service.actions.unregisterDropZone('zone-1');

      const state = service.getState();
      expect(state.dropZones).not.toContain('zone-1');
    });

    it('should set drag over zone', () => {
      service.initialize();

      service.actions.registerDropZone('zone-1');
      service.actions.setDragOver('zone-1');

      const state = service.getState();
      expect(state.dragOverZone).toBe('zone-1');
    });

    it('should clear drag over zone', () => {
      service.initialize();

      service.actions.registerDropZone('zone-1');
      service.actions.setDragOver('zone-1');
      service.actions.setDragOver(null);

      const state = service.getState();
      expect(state.dragOverZone).toBeNull();
    });
  });

  describe('drop operations', () => {
    it('should drop on valid zone', () => {
      const onDrop = vi.fn();
      service.initialize({ onDrop });

      service.actions.registerDropZone('zone-1');
      const dragData = { title: 'Item 1' };
      service.actions.startDrag('item-1', dragData);
      service.actions.drop('zone-1');

      expect(onDrop).toHaveBeenCalledWith('item-1', 'zone-1', dragData);
    });

    it('should not drop on invalid zone', () => {
      const onDrop = vi.fn();
      service.initialize({ onDrop });

      service.actions.startDrag('item-1');
      service.actions.drop('invalid-zone');

      expect(onDrop).not.toHaveBeenCalled();
    });

    it('should validate drop with custom validator', () => {
      const validateDrop = vi.fn(() => false);
      const onDrop = vi.fn();
      service.initialize({ validateDrop, onDrop });

      service.actions.registerDropZone('zone-1');
      service.actions.startDrag('item-1');
      service.actions.drop('zone-1');

      expect(validateDrop).toHaveBeenCalledWith('item-1', 'zone-1');
      expect(onDrop).not.toHaveBeenCalled();
    });

    it('should set drop target', () => {
      service.initialize();

      service.actions.setDropTarget('target-1');

      const state = service.getState();
      expect(state.dropTarget).toBe('target-1');
    });

    it('should clear drop target', () => {
      service.initialize();

      service.actions.setDropTarget('target-1');
      service.actions.setDropTarget(null);

      const state = service.getState();
      expect(state.dropTarget).toBeNull();
    });
  });

  describe('cleanup on destroy', () => {
    it('should clean up behavior when service is destroyed', () => {
      service.initialize();

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

  describe('error handling', () => {
    it('should throw error when accessing actions before initialization', () => {
      expect(() => service.actions).toThrow(
        'DragDropBehaviorService not initialized. Call initialize() first.'
      );
    });
  });
});
