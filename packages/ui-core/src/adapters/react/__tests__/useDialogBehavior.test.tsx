import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDialogBehavior } from '../index';

describe('useDialogBehavior', () => {
  describe('initial state', () => {
    it('should initialize with closed state', () => {
      const { result } = renderHook(() => useDialogBehavior());

      expect(result.current.isOpen).toBe(false);
      expect(result.current.content).toBeNull();
      expect(result.current.id).toBeNull();
    });

    it('should initialize with provided id', () => {
      const { result } = renderHook(() => useDialogBehavior({ id: 'test-dialog' }));

      expect(result.current.id).toBe('test-dialog');
      expect(result.current.isOpen).toBe(false);
    });
  });

  describe('state updates trigger re-renders', () => {
    it('should update component when opening dialog', () => {
      const { result } = renderHook(() => useDialogBehavior());

      expect(result.current.isOpen).toBe(false);

      act(() => {
        result.current.actions.open({ title: 'Test Dialog' });
      });

      expect(result.current.isOpen).toBe(true);
      expect(result.current.content).toEqual({ title: 'Test Dialog' });
    });

    it('should update component when closing dialog', () => {
      const { result } = renderHook(() => useDialogBehavior());

      act(() => {
        result.current.actions.open({ title: 'Test' });
      });

      expect(result.current.isOpen).toBe(true);

      act(() => {
        result.current.actions.close();
      });

      expect(result.current.isOpen).toBe(false);
      expect(result.current.content).toBeNull();
    });

    it('should update component when toggling dialog', () => {
      const { result } = renderHook(() => useDialogBehavior());

      act(() => {
        result.current.actions.toggle({ title: 'Toggle Test' });
      });

      expect(result.current.isOpen).toBe(true);

      act(() => {
        result.current.actions.toggle();
      });

      expect(result.current.isOpen).toBe(false);
    });

    it('should handle multiple state updates', () => {
      const { result } = renderHook(() => useDialogBehavior());

      act(() => {
        result.current.actions.open({ step: 1 });
      });
      expect(result.current.content).toEqual({ step: 1 });

      act(() => {
        result.current.actions.open({ step: 2 });
      });
      expect(result.current.content).toEqual({ step: 2 });

      act(() => {
        result.current.actions.close();
      });
      expect(result.current.isOpen).toBe(false);
    });
  });

  describe('callbacks', () => {
    it('should invoke onOpen callback', () => {
      const onOpen = vi.fn();
      const { result } = renderHook(() => useDialogBehavior({ onOpen }));

      act(() => {
        result.current.actions.open({ title: 'Test' });
      });

      expect(onOpen).toHaveBeenCalledTimes(1);
      expect(onOpen).toHaveBeenCalledWith({ title: 'Test' });
    });

    it('should invoke onClose callback', () => {
      const onClose = vi.fn();
      const { result } = renderHook(() => useDialogBehavior({ onClose }));

      act(() => {
        result.current.actions.open({ title: 'Test' });
        result.current.actions.close();
      });

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('cleanup on unmount', () => {
    it('should clean up behavior when component unmounts', () => {
      const { result, unmount } = renderHook(() => useDialogBehavior());

      act(() => {
        result.current.actions.open({ title: 'Test' });
      });

      expect(result.current.isOpen).toBe(true);

      // Unmount should trigger cleanup
      unmount();

      // No errors should occur
      expect(() => unmount()).not.toThrow();
    });

    it('should not update state after unmount', () => {
      const { result, unmount } = renderHook(() => useDialogBehavior());

      const actions = result.current.actions;
      unmount();

      // Actions should not cause errors after unmount
      expect(() => {
        actions.open({ title: 'Test' });
      }).not.toThrow();
    });
  });

  describe('behavior instance stability', () => {
    it('should maintain same behavior instance across re-renders', () => {
      const { result, rerender } = renderHook(() => useDialogBehavior());

      const firstActions = result.current.actions;

      act(() => {
        result.current.actions.open({ title: 'Test' });
      });

      rerender();

      // Actions should be the same reference
      expect(result.current.actions).toBe(firstActions);
    });
  });
});
