import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useUndoRedoStack } from '../useUndoRedoStack';

interface TestState {
  value: number;
  text: string;
}

describe('useUndoRedoStack', () => {
  describe('initial state', () => {
    it('should initialize with provided initial state', () => {
      const initialState: TestState = { value: 0, text: 'initial' };
      const { result } = renderHook(() => useUndoRedoStack({ initialState }));

      expect(result.current.present).toEqual(initialState);
      expect(result.current.past).toEqual([]);
      expect(result.current.future).toEqual([]);
      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(false);
    });

    it('should initialize with provided maxLength', () => {
      const initialState: TestState = { value: 0, text: 'initial' };
      const { result } = renderHook(() => useUndoRedoStack({ initialState, maxLength: 10 }));

      expect(result.current.maxLength).toBe(10);
    });

    it('should use default maxLength of 50', () => {
      const initialState: TestState = { value: 0, text: 'initial' };
      const { result } = renderHook(() => useUndoRedoStack({ initialState }));

      expect(result.current.maxLength).toBe(50);
    });
  });

  describe('state updates trigger re-renders', () => {
    it('should update component when pushing state', () => {
      const initialState: TestState = { value: 0, text: 'initial' };
      const { result } = renderHook(() => useUndoRedoStack({ initialState }));

      const newState: TestState = { value: 1, text: 'updated' };

      act(() => {
        result.current.actions.pushState(newState);
      });

      expect(result.current.present).toEqual(newState);
      expect(result.current.past).toHaveLength(1);
      expect(result.current.past[0]).toEqual(initialState);
      expect(result.current.future).toEqual([]);
      expect(result.current.canUndo).toBe(true);
      expect(result.current.canRedo).toBe(false);
    });

    it('should update component when undoing', () => {
      const initialState: TestState = { value: 0, text: 'initial' };
      const { result } = renderHook(() => useUndoRedoStack({ initialState }));

      const newState: TestState = { value: 1, text: 'updated' };

      act(() => {
        result.current.actions.pushState(newState);
      });

      expect(result.current.present).toEqual(newState);

      act(() => {
        result.current.actions.undo();
      });

      expect(result.current.present).toEqual(initialState);
      expect(result.current.past).toEqual([]);
      expect(result.current.future).toHaveLength(1);
      expect(result.current.future[0]).toEqual(newState);
      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(true);
    });

    it('should update component when redoing', () => {
      const initialState: TestState = { value: 0, text: 'initial' };
      const { result } = renderHook(() => useUndoRedoStack({ initialState }));

      const newState: TestState = { value: 1, text: 'updated' };

      act(() => {
        result.current.actions.pushState(newState);
        result.current.actions.undo();
      });

      expect(result.current.present).toEqual(initialState);

      act(() => {
        result.current.actions.redo();
      });

      expect(result.current.present).toEqual(newState);
      expect(result.current.past).toHaveLength(1);
      expect(result.current.future).toEqual([]);
      expect(result.current.canUndo).toBe(true);
      expect(result.current.canRedo).toBe(false);
    });

    it('should update component when clearing history', () => {
      const initialState: TestState = { value: 0, text: 'initial' };
      const { result } = renderHook(() => useUndoRedoStack({ initialState }));

      act(() => {
        result.current.actions.pushState({ value: 1, text: 'state1' });
        result.current.actions.pushState({ value: 2, text: 'state2' });
      });

      expect(result.current.past).toHaveLength(2);

      act(() => {
        result.current.actions.clearHistory();
      });

      expect(result.current.past).toEqual([]);
      expect(result.current.future).toEqual([]);
      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(false);
    });

    it('should update component when jumping to state', () => {
      const initialState: TestState = { value: 0, text: 'initial' };
      const { result } = renderHook(() => useUndoRedoStack({ initialState }));

      const state1: TestState = { value: 1, text: 'state1' };
      const state2: TestState = { value: 2, text: 'state2' };

      act(() => {
        result.current.actions.pushState(state1);
        result.current.actions.pushState(state2);
      });

      // Jump to index 1 (state1)
      act(() => {
        result.current.actions.jumpToState(1);
      });

      expect(result.current.present).toEqual(state1);
      expect(result.current.past).toHaveLength(1);
      expect(result.current.past[0]).toEqual(initialState);
      expect(result.current.future).toHaveLength(1);
      expect(result.current.future[0]).toEqual(state2);
    });

    it('should update component when setting maxLength', () => {
      const initialState: TestState = { value: 0, text: 'initial' };
      const { result } = renderHook(() => useUndoRedoStack({ initialState, maxLength: 10 }));

      expect(result.current.maxLength).toBe(10);

      act(() => {
        result.current.actions.setMaxLength(5);
      });

      expect(result.current.maxLength).toBe(5);
    });

    it('should handle multiple state updates', () => {
      const initialState: TestState = { value: 0, text: 'initial' };
      const { result } = renderHook(() => useUndoRedoStack({ initialState }));

      act(() => {
        result.current.actions.pushState({ value: 1, text: 'state1' });
        result.current.actions.pushState({ value: 2, text: 'state2' });
        result.current.actions.pushState({ value: 3, text: 'state3' });
      });

      expect(result.current.present).toEqual({ value: 3, text: 'state3' });
      expect(result.current.past).toHaveLength(3);

      act(() => {
        result.current.actions.undo();
        result.current.actions.undo();
      });

      expect(result.current.present).toEqual({ value: 1, text: 'state1' });
      expect(result.current.past).toHaveLength(1);
      expect(result.current.future).toHaveLength(2);
    });
  });

  describe('callbacks', () => {
    it('should invoke onStateChange callback on push', () => {
      const onStateChange = vi.fn();
      const initialState: TestState = { value: 0, text: 'initial' };
      const { result } = renderHook(() => useUndoRedoStack({ initialState, onStateChange }));

      const newState: TestState = { value: 1, text: 'updated' };

      act(() => {
        result.current.actions.pushState(newState);
      });

      expect(onStateChange).toHaveBeenCalledTimes(1);
      expect(onStateChange).toHaveBeenCalledWith(newState);
    });

    it('should invoke onStateChange callback on undo', () => {
      const onStateChange = vi.fn();
      const initialState: TestState = { value: 0, text: 'initial' };
      const { result } = renderHook(() => useUndoRedoStack({ initialState, onStateChange }));

      act(() => {
        result.current.actions.pushState({ value: 1, text: 'updated' });
      });

      onStateChange.mockClear();

      act(() => {
        result.current.actions.undo();
      });

      expect(onStateChange).toHaveBeenCalledTimes(1);
      expect(onStateChange).toHaveBeenCalledWith(initialState);
    });

    it('should invoke onStateChange callback on redo', () => {
      const onStateChange = vi.fn();
      const initialState: TestState = { value: 0, text: 'initial' };
      const { result } = renderHook(() => useUndoRedoStack({ initialState, onStateChange }));

      const newState: TestState = { value: 1, text: 'updated' };

      act(() => {
        result.current.actions.pushState(newState);
        result.current.actions.undo();
      });

      onStateChange.mockClear();

      act(() => {
        result.current.actions.redo();
      });

      expect(onStateChange).toHaveBeenCalledTimes(1);
      expect(onStateChange).toHaveBeenCalledWith(newState);
    });
  });

  describe('cleanup on unmount', () => {
    it('should clean up behavior when component unmounts', () => {
      const initialState: TestState = { value: 0, text: 'initial' };
      const { result, unmount } = renderHook(() => useUndoRedoStack({ initialState }));

      act(() => {
        result.current.actions.pushState({ value: 1, text: 'updated' });
      });

      expect(result.current.past).toHaveLength(1);

      // Unmount should trigger cleanup
      unmount();

      // No errors should occur
      expect(() => unmount()).not.toThrow();
    });

    it('should not update state after unmount', () => {
      const initialState: TestState = { value: 0, text: 'initial' };
      const { result, unmount } = renderHook(() => useUndoRedoStack({ initialState }));

      const actions = result.current.actions;
      unmount();

      // Actions should not cause errors after unmount
      expect(() => {
        actions.pushState({ value: 1, text: 'updated' });
      }).not.toThrow();
    });
  });

  describe('behavior instance stability', () => {
    it('should maintain same behavior instance across re-renders', () => {
      const initialState: TestState = { value: 0, text: 'initial' };
      const { result, rerender } = renderHook(() => useUndoRedoStack({ initialState }));

      const firstActions = result.current.actions;

      act(() => {
        result.current.actions.pushState({ value: 1, text: 'updated' });
      });

      rerender();

      // Actions should be the same reference
      expect(result.current.actions).toBe(firstActions);
    });
  });
});
