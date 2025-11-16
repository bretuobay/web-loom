import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDisclosureBehavior } from '../index';

describe('useDisclosureBehavior', () => {
  describe('initial state', () => {
    it('should initialize with collapsed state', () => {
      const { result } = renderHook(() => useDisclosureBehavior());

      expect(result.current.isExpanded).toBe(false);
      expect(result.current.id).toBeNull();
    });

    it('should initialize with provided id', () => {
      const { result } = renderHook(() => 
        useDisclosureBehavior({ id: 'section-1' })
      );

      expect(result.current.id).toBe('section-1');
    });

    it('should initialize with expanded state when specified', () => {
      const { result } = renderHook(() => 
        useDisclosureBehavior({ initialExpanded: true })
      );

      expect(result.current.isExpanded).toBe(true);
    });
  });

  describe('state updates trigger re-renders', () => {
    it('should update component when expanding', () => {
      const { result } = renderHook(() => useDisclosureBehavior());

      expect(result.current.isExpanded).toBe(false);

      act(() => {
        result.current.actions.expand();
      });

      expect(result.current.isExpanded).toBe(true);
    });

    it('should update component when collapsing', () => {
      const { result } = renderHook(() => 
        useDisclosureBehavior({ initialExpanded: true })
      );

      expect(result.current.isExpanded).toBe(true);

      act(() => {
        result.current.actions.collapse();
      });

      expect(result.current.isExpanded).toBe(false);
    });

    it('should update component when toggling', () => {
      const { result } = renderHook(() => useDisclosureBehavior());

      act(() => {
        result.current.actions.toggle();
      });

      expect(result.current.isExpanded).toBe(true);

      act(() => {
        result.current.actions.toggle();
      });

      expect(result.current.isExpanded).toBe(false);
    });

    it('should handle multiple state updates', () => {
      const { result } = renderHook(() => useDisclosureBehavior());

      act(() => {
        result.current.actions.expand();
      });
      expect(result.current.isExpanded).toBe(true);

      act(() => {
        result.current.actions.collapse();
      });
      expect(result.current.isExpanded).toBe(false);

      act(() => {
        result.current.actions.toggle();
      });
      expect(result.current.isExpanded).toBe(true);
    });
  });

  describe('cleanup on unmount', () => {
    it('should clean up behavior when component unmounts', () => {
      const { result, unmount } = renderHook(() => useDisclosureBehavior());

      act(() => {
        result.current.actions.expand();
      });

      expect(result.current.isExpanded).toBe(true);

      unmount();

      expect(() => unmount()).not.toThrow();
    });

    it('should not update state after unmount', () => {
      const { result, unmount } = renderHook(() => useDisclosureBehavior());

      const actions = result.current.actions;
      unmount();

      expect(() => {
        actions.expand();
      }).not.toThrow();
    });
  });

  describe('behavior instance stability', () => {
    it('should maintain same behavior instance across re-renders', () => {
      const { result, rerender } = renderHook(() => useDisclosureBehavior());

      const firstActions = result.current.actions;

      act(() => {
        result.current.actions.expand();
      });

      rerender();

      expect(result.current.actions).toBe(firstActions);
    });
  });
});
