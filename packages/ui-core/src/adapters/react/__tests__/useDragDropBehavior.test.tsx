import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDragDropBehavior } from '../useDragDropBehavior';

describe('useDragDropBehavior', () => {
  describe('initial state', () => {
    it('should initialize with no drag operation', () => {
      const { result } = renderHook(() => useDragDropBehavior());

      expect(result.current.draggedItem).toBeNull();
      expect(result.current.dropTarget).toBeNull();
      expect(result.current.isDragging).toBe(false);
      expect(result.current.dragData).toBeNull();
      expect(result.current.dropZones).toEqual([]);
      expect(result.current.dragOverZone).toBeNull();
    });
  });

  describe('state updates trigger re-renders', () => {
    it('should update component when starting drag', () => {
      const { result } = renderHook(() => useDragDropBehavior());

      expect(result.current.isDragging).toBe(false);

      act(() => {
        result.current.actions.startDrag('item-1', { type: 'card' });
      });

      expect(result.current.isDragging).toBe(true);
      expect(result.current.draggedItem).toBe('item-1');
      expect(result.current.dragData).toEqual({ type: 'card' });
    });

    it('should update component when ending drag', () => {
      const { result } = renderHook(() => useDragDropBehavior());

      act(() => {
        result.current.actions.startDrag('item-1');
      });

      expect(result.current.isDragging).toBe(true);

      act(() => {
        result.current.actions.endDrag();
      });

      expect(result.current.isDragging).toBe(false);
      expect(result.current.draggedItem).toBeNull();
      expect(result.current.dragData).toBeNull();
    });

    it('should update component when setting drop target', () => {
      const { result } = renderHook(() => useDragDropBehavior());

      act(() => {
        result.current.actions.setDropTarget('zone-1');
      });

      expect(result.current.dropTarget).toBe('zone-1');

      act(() => {
        result.current.actions.setDropTarget(null);
      });

      expect(result.current.dropTarget).toBeNull();
    });

    it('should update component when registering drop zone', () => {
      const { result } = renderHook(() => useDragDropBehavior());

      expect(result.current.dropZones).toEqual([]);

      act(() => {
        result.current.actions.registerDropZone('zone-1');
      });

      expect(result.current.dropZones).toContain('zone-1');

      act(() => {
        result.current.actions.registerDropZone('zone-2');
      });

      expect(result.current.dropZones).toHaveLength(2);
      expect(result.current.dropZones).toContain('zone-1');
      expect(result.current.dropZones).toContain('zone-2');
    });

    it('should update component when unregistering drop zone', () => {
      const { result } = renderHook(() => useDragDropBehavior());

      act(() => {
        result.current.actions.registerDropZone('zone-1');
        result.current.actions.registerDropZone('zone-2');
      });

      expect(result.current.dropZones).toHaveLength(2);

      act(() => {
        result.current.actions.unregisterDropZone('zone-1');
      });

      expect(result.current.dropZones).toHaveLength(1);
      expect(result.current.dropZones).toContain('zone-2');
      expect(result.current.dropZones).not.toContain('zone-1');
    });

    it('should update component when setting drag over zone', () => {
      const { result } = renderHook(() => useDragDropBehavior());

      act(() => {
        result.current.actions.setDragOver('zone-1');
      });

      expect(result.current.dragOverZone).toBe('zone-1');

      act(() => {
        result.current.actions.setDragOver(null);
      });

      expect(result.current.dragOverZone).toBeNull();
    });

    it('should update component when dropping', () => {
      const { result } = renderHook(() => useDragDropBehavior());

      act(() => {
        result.current.actions.registerDropZone('zone-1');
        result.current.actions.startDrag('item-1', { type: 'card' });
      });

      expect(result.current.isDragging).toBe(true);

      act(() => {
        result.current.actions.drop('zone-1');
      });

      expect(result.current.isDragging).toBe(false);
      expect(result.current.draggedItem).toBeNull();
      expect(result.current.dragData).toBeNull();
    });

    it('should handle multiple state updates', () => {
      const { result } = renderHook(() => useDragDropBehavior());

      act(() => {
        result.current.actions.registerDropZone('zone-1');
        result.current.actions.registerDropZone('zone-2');
        result.current.actions.startDrag('item-1');
        result.current.actions.setDropTarget('zone-1');
      });

      expect(result.current.isDragging).toBe(true);
      expect(result.current.dropTarget).toBe('zone-1');
      expect(result.current.dropZones).toHaveLength(2);

      act(() => {
        result.current.actions.drop('zone-1');
      });

      expect(result.current.isDragging).toBe(false);
      expect(result.current.dropTarget).toBeNull();
    });
  });

  describe('callbacks', () => {
    it('should invoke onDragStart callback', () => {
      const onDragStart = vi.fn();
      const { result } = renderHook(() => useDragDropBehavior({ onDragStart }));

      const dragData = { type: 'card', priority: 'high' };

      act(() => {
        result.current.actions.startDrag('item-1', dragData);
      });

      expect(onDragStart).toHaveBeenCalledTimes(1);
      expect(onDragStart).toHaveBeenCalledWith('item-1', dragData);
    });

    it('should invoke onDragEnd callback', () => {
      const onDragEnd = vi.fn();
      const { result } = renderHook(() => useDragDropBehavior({ onDragEnd }));

      act(() => {
        result.current.actions.startDrag('item-1');
        result.current.actions.endDrag();
      });

      expect(onDragEnd).toHaveBeenCalledTimes(1);
      expect(onDragEnd).toHaveBeenCalledWith('item-1');
    });

    it('should invoke onDrop callback', () => {
      const onDrop = vi.fn();
      const { result } = renderHook(() => useDragDropBehavior({ onDrop }));

      const dragData = { type: 'card' };

      act(() => {
        result.current.actions.registerDropZone('zone-1');
        result.current.actions.startDrag('item-1', dragData);
        result.current.actions.drop('zone-1');
      });

      expect(onDrop).toHaveBeenCalledTimes(1);
      expect(onDrop).toHaveBeenCalledWith('item-1', 'zone-1', dragData);
    });

    it('should invoke validateDrop callback', () => {
      const validateDrop = vi.fn().mockReturnValue(true);
      const onDrop = vi.fn();

      const { result } = renderHook(() => useDragDropBehavior({ validateDrop, onDrop }));

      act(() => {
        result.current.actions.registerDropZone('zone-1');
        result.current.actions.startDrag('item-1');
        result.current.actions.drop('zone-1');
      });

      expect(validateDrop).toHaveBeenCalledTimes(1);
      expect(validateDrop).toHaveBeenCalledWith('item-1', 'zone-1');
      expect(onDrop).toHaveBeenCalledTimes(1);
    });

    it('should not drop if validateDrop returns false', () => {
      const validateDrop = vi.fn().mockReturnValue(false);
      const onDrop = vi.fn();

      const { result } = renderHook(() => useDragDropBehavior({ validateDrop, onDrop }));

      act(() => {
        result.current.actions.registerDropZone('zone-1');
        result.current.actions.startDrag('item-1');
        result.current.actions.drop('zone-1');
      });

      expect(validateDrop).toHaveBeenCalledTimes(1);
      expect(onDrop).not.toHaveBeenCalled();
      // Drag should still be active since drop was rejected
      expect(result.current.isDragging).toBe(true);
    });
  });

  describe('cleanup on unmount', () => {
    it('should clean up behavior when component unmounts', () => {
      const { result, unmount } = renderHook(() => useDragDropBehavior());

      act(() => {
        result.current.actions.registerDropZone('zone-1');
        result.current.actions.startDrag('item-1');
      });

      expect(result.current.isDragging).toBe(true);

      // Unmount should trigger cleanup
      unmount();

      // No errors should occur
      expect(() => unmount()).not.toThrow();
    });

    it('should not update state after unmount', () => {
      const { result, unmount } = renderHook(() => useDragDropBehavior());

      const actions = result.current.actions;
      unmount();

      // Actions should not cause errors after unmount
      expect(() => {
        actions.startDrag('item-1');
      }).not.toThrow();
    });
  });

  describe('behavior instance stability', () => {
    it('should maintain same behavior instance across re-renders', () => {
      const { result, rerender } = renderHook(() => useDragDropBehavior());

      const firstActions = result.current.actions;

      act(() => {
        result.current.actions.registerDropZone('zone-1');
        result.current.actions.startDrag('item-1');
      });

      rerender();

      // Actions should be the same reference
      expect(result.current.actions).toBe(firstActions);
    });
  });
});
