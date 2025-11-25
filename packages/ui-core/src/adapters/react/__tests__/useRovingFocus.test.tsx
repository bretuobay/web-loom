import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRovingFocus } from '../index';

describe('useRovingFocus', () => {
  describe('initial state', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useRovingFocus());

      expect(result.current.currentIndex).toBe(0);
      expect(result.current.items).toEqual([]);
      expect(result.current.orientation).toBe('vertical');
      expect(result.current.wrap).toBe(true);
    });

    it('should initialize with provided items', () => {
      const items = ['item-1', 'item-2', 'item-3'];
      const { result } = renderHook(() => useRovingFocus({ items }));

      expect(result.current.items).toEqual(items);
      expect(result.current.currentIndex).toBe(0);
    });

    it('should initialize with vertical orientation', () => {
      const { result } = renderHook(() => useRovingFocus({ orientation: 'vertical' }));

      expect(result.current.orientation).toBe('vertical');
    });
  });

  describe('state updates trigger re-renders', () => {
    it('should update component when moving to next item', () => {
      const items = ['item-1', 'item-2', 'item-3'];
      const { result } = renderHook(() => useRovingFocus({ items }));

      expect(result.current.currentIndex).toBe(0);

      act(() => {
        result.current.actions.moveNext();
      });

      expect(result.current.currentIndex).toBe(1);
    });

    it('should update component when moving to previous item', () => {
      const items = ['item-1', 'item-2', 'item-3'];
      const { result } = renderHook(() => useRovingFocus({ items, initialIndex: 2 }));

      expect(result.current.currentIndex).toBe(2);

      act(() => {
        result.current.actions.movePrevious();
      });

      expect(result.current.currentIndex).toBe(1);
    });

    it('should update component when moving to first item', () => {
      const items = ['item-1', 'item-2', 'item-3'];
      const { result } = renderHook(() => useRovingFocus({ items, initialIndex: 2 }));

      act(() => {
        result.current.actions.moveFirst();
      });

      expect(result.current.currentIndex).toBe(0);
    });

    it('should update component when moving to last item', () => {
      const items = ['item-1', 'item-2', 'item-3'];
      const { result } = renderHook(() => useRovingFocus({ items }));

      act(() => {
        result.current.actions.moveLast();
      });

      expect(result.current.currentIndex).toBe(2);
    });

    it('should update component when moving to specific index', () => {
      const items = ['item-1', 'item-2', 'item-3'];
      const { result } = renderHook(() => useRovingFocus({ items }));

      act(() => {
        result.current.actions.moveTo(1);
      });

      expect(result.current.currentIndex).toBe(1);
    });

    it('should update component when setting new items', () => {
      const { result } = renderHook(() => useRovingFocus());

      const newItems = ['new-1', 'new-2'];

      act(() => {
        result.current.actions.setItems(newItems);
      });

      expect(result.current.items).toEqual(newItems);
    });
  });

  describe('wrapping behavior', () => {
    it('should wrap from last to first when moving next', () => {
      const items = ['item-1', 'item-2', 'item-3'];
      const { result } = renderHook(() => useRovingFocus({ items, initialIndex: 2, wrap: true }));

      act(() => {
        result.current.actions.moveNext();
      });

      expect(result.current.currentIndex).toBe(0);
    });

    it('should wrap from first to last when moving previous', () => {
      const items = ['item-1', 'item-2', 'item-3'];
      const { result } = renderHook(() => useRovingFocus({ items, wrap: true }));

      act(() => {
        result.current.actions.movePrevious();
      });

      expect(result.current.currentIndex).toBe(2);
    });
  });

  describe('cleanup on unmount', () => {
    it('should clean up behavior when component unmounts', () => {
      const { result, unmount } = renderHook(() => useRovingFocus({ items: ['item-1', 'item-2'] }));

      act(() => {
        result.current.actions.moveNext();
      });

      expect(result.current.currentIndex).toBe(1);

      unmount();

      expect(() => unmount()).not.toThrow();
    });
  });

  describe('behavior instance stability', () => {
    it('should maintain same behavior instance across re-renders', () => {
      const { result, rerender } = renderHook(() => useRovingFocus({ items: ['item-1', 'item-2'] }));

      const firstActions = result.current.actions;

      act(() => {
        result.current.actions.moveNext();
      });

      rerender();

      expect(result.current.actions).toBe(firstActions);
    });
  });
});
