import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useListSelection } from '../index';

describe('useListSelection', () => {
  describe('initial state', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useListSelection());

      expect(result.current.selectedIds).toEqual([]);
      expect(result.current.lastSelectedId).toBeNull();
      expect(result.current.mode).toBe('single');
      expect(result.current.items).toEqual([]);
    });

    it('should initialize with provided items', () => {
      const items = ['item-1', 'item-2', 'item-3'];
      const { result } = renderHook(() => useListSelection({ items }));

      expect(result.current.items).toEqual(items);
    });

    it('should initialize with multi selection mode', () => {
      const { result } = renderHook(() => useListSelection({ mode: 'multi' }));

      expect(result.current.mode).toBe('multi');
    });
  });

  describe('state updates trigger re-renders', () => {
    it('should update component when selecting an item', () => {
      const items = ['item-1', 'item-2', 'item-3'];
      const { result } = renderHook(() => useListSelection({ items }));

      act(() => {
        result.current.actions.select('item-1');
      });

      expect(result.current.selectedIds).toContain('item-1');
      expect(result.current.lastSelectedId).toBe('item-1');
    });

    it('should update component when deselecting an item', () => {
      const items = ['item-1', 'item-2', 'item-3'];
      const { result } = renderHook(() => useListSelection({ items, mode: 'multi' }));

      act(() => {
        result.current.actions.select('item-1');
        result.current.actions.deselect('item-1');
      });

      expect(result.current.selectedIds).not.toContain('item-1');
    });

    it('should update component when toggling selection', () => {
      const items = ['item-1', 'item-2', 'item-3'];
      const { result } = renderHook(() => useListSelection({ items, mode: 'multi' }));

      act(() => {
        result.current.actions.toggleSelection('item-1');
      });

      expect(result.current.selectedIds).toContain('item-1');

      act(() => {
        result.current.actions.toggleSelection('item-1');
      });

      expect(result.current.selectedIds).not.toContain('item-1');
    });

    it('should update component when clearing selection', () => {
      const items = ['item-1', 'item-2', 'item-3'];
      const { result } = renderHook(() => useListSelection({ items, mode: 'multi' }));

      act(() => {
        result.current.actions.select('item-1');
        result.current.actions.select('item-2');
        result.current.actions.clearSelection();
      });

      expect(result.current.selectedIds).toEqual([]);
      expect(result.current.lastSelectedId).toBeNull();
    });

    it('should update component when selecting all items', () => {
      const items = ['item-1', 'item-2', 'item-3'];
      const { result } = renderHook(() => useListSelection({ items, mode: 'multi' }));

      act(() => {
        result.current.actions.selectAll();
      });

      expect(result.current.selectedIds).toEqual(items);
    });
  });

  describe('single selection mode', () => {
    it('should only allow one item to be selected', () => {
      const items = ['item-1', 'item-2', 'item-3'];
      const { result } = renderHook(() => useListSelection({ items, mode: 'single' }));

      act(() => {
        result.current.actions.select('item-1');
      });

      expect(result.current.selectedIds).toEqual(['item-1']);

      act(() => {
        result.current.actions.select('item-2');
      });

      expect(result.current.selectedIds).toEqual(['item-2']);
      expect(result.current.selectedIds).not.toContain('item-1');
    });
  });

  describe('multi selection mode', () => {
    it('should allow multiple items to be selected', () => {
      const items = ['item-1', 'item-2', 'item-3'];
      const { result } = renderHook(() => useListSelection({ items, mode: 'multi' }));

      act(() => {
        result.current.actions.select('item-1');
        result.current.actions.select('item-2');
      });

      expect(result.current.selectedIds).toContain('item-1');
      expect(result.current.selectedIds).toContain('item-2');
    });
  });

  describe('range selection mode', () => {
    it('should select range of items', () => {
      const items = ['item-1', 'item-2', 'item-3', 'item-4'];
      const { result } = renderHook(() => useListSelection({ items, mode: 'range' }));

      act(() => {
        result.current.actions.selectRange('item-1', 'item-3');
      });

      expect(result.current.selectedIds).toContain('item-1');
      expect(result.current.selectedIds).toContain('item-2');
      expect(result.current.selectedIds).toContain('item-3');
      expect(result.current.selectedIds).not.toContain('item-4');
    });
  });

  describe('cleanup on unmount', () => {
    it('should clean up behavior when component unmounts', () => {
      const { result, unmount } = renderHook(() => useListSelection({ items: ['item-1', 'item-2'] }));

      act(() => {
        result.current.actions.select('item-1');
      });

      expect(result.current.selectedIds).toContain('item-1');

      unmount();

      expect(() => unmount()).not.toThrow();
    });
  });

  describe('behavior instance stability', () => {
    it('should maintain same behavior instance across re-renders', () => {
      const { result, rerender } = renderHook(() => useListSelection({ items: ['item-1', 'item-2'] }));

      const firstActions = result.current.actions;

      act(() => {
        result.current.actions.select('item-1');
      });

      rerender();

      expect(result.current.actions).toBe(firstActions);
    });
  });
});
