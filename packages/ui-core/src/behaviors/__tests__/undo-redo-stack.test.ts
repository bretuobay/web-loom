import { describe, it, expect, vi } from 'vitest';
import fc from 'fast-check';
import { createUndoRedoStack } from '../undo-redo-stack';

interface TestState {
  value: number;
  text: string;
}

describe('createUndoRedoStack', () => {
  describe('initial state', () => {
    it('should initialize with provided initial state', () => {
      const initialState: TestState = { value: 0, text: 'initial' };
      const stack = createUndoRedoStack({ initialState });
      const state = stack.getState();

      expect(state.present).toEqual(initialState);
      expect(state.past).toEqual([]);
      expect(state.future).toEqual([]);
      expect(state.canUndo).toBe(false);
      expect(state.canRedo).toBe(false);
    });

    it('should initialize with default maxLength of 50', () => {
      const stack = createUndoRedoStack({ initialState: { value: 0, text: '' } });
      const state = stack.getState();

      expect(state.maxLength).toBe(50);
    });

    it('should initialize with custom maxLength', () => {
      const stack = createUndoRedoStack({
        initialState: { value: 0, text: '' },
        maxLength: 100,
      });
      const state = stack.getState();

      expect(state.maxLength).toBe(100);
    });
  });

  describe('pushState action', () => {
    it('should push new state and move current to past', () => {
      const stack = createUndoRedoStack({ initialState: { value: 0, text: 'initial' } });

      stack.actions.pushState({ value: 1, text: 'first' });
      const state = stack.getState();

      expect(state.present).toEqual({ value: 1, text: 'first' });
      expect(state.past).toEqual([{ value: 0, text: 'initial' }]);
      expect(state.future).toEqual([]);
      expect(state.canUndo).toBe(true);
      expect(state.canRedo).toBe(false);
    });

    it('should clear future when pushing new state', () => {
      const stack = createUndoRedoStack({ initialState: { value: 0, text: 'initial' } });

      // Push states
      stack.actions.pushState({ value: 1, text: 'first' });
      stack.actions.pushState({ value: 2, text: 'second' });

      // Undo to create future
      stack.actions.undo();
      expect(stack.getState().future.length).toBe(1);

      // Push new state should clear future
      stack.actions.pushState({ value: 3, text: 'third' });
      const state = stack.getState();

      expect(state.present).toEqual({ value: 3, text: 'third' });
      expect(state.future).toEqual([]);
      expect(state.canRedo).toBe(false);
    });

    it('should invoke onStateChange callback when pushing', () => {
      const onStateChange = vi.fn();
      const stack = createUndoRedoStack({
        initialState: { value: 0, text: 'initial' },
        onStateChange,
      });

      const newState = { value: 1, text: 'first' };
      stack.actions.pushState(newState);

      expect(onStateChange).toHaveBeenCalledTimes(1);
      expect(onStateChange).toHaveBeenCalledWith(newState);
    });

    it('should enforce maxLength by removing oldest states', () => {
      const stack = createUndoRedoStack({
        initialState: { value: 0, text: 'initial' },
        maxLength: 3,
      });

      // Push 4 states (initial + 4 = 5 total, but maxLength is 3)
      stack.actions.pushState({ value: 1, text: 'first' });
      stack.actions.pushState({ value: 2, text: 'second' });
      stack.actions.pushState({ value: 3, text: 'third' });
      stack.actions.pushState({ value: 4, text: 'fourth' });

      const state = stack.getState();

      // Past should have at most maxLength items
      expect(state.past.length).toBeLessThanOrEqual(3);
      expect(state.present).toEqual({ value: 4, text: 'fourth' });

      // Oldest state should be removed
      expect(state.past).not.toContainEqual({ value: 0, text: 'initial' });
    });
  });

  describe('undo action', () => {
    it('should move to previous state', () => {
      const stack = createUndoRedoStack({ initialState: { value: 0, text: 'initial' } });

      stack.actions.pushState({ value: 1, text: 'first' });
      stack.actions.undo();

      const state = stack.getState();
      expect(state.present).toEqual({ value: 0, text: 'initial' });
      expect(state.past).toEqual([]);
      expect(state.future).toEqual([{ value: 1, text: 'first' }]);
      expect(state.canUndo).toBe(false);
      expect(state.canRedo).toBe(true);
    });

    it('should handle multiple undos', () => {
      const stack = createUndoRedoStack({ initialState: { value: 0, text: 'initial' } });

      stack.actions.pushState({ value: 1, text: 'first' });
      stack.actions.pushState({ value: 2, text: 'second' });
      stack.actions.pushState({ value: 3, text: 'third' });

      // Undo twice
      stack.actions.undo();
      stack.actions.undo();

      const state = stack.getState();
      expect(state.present).toEqual({ value: 1, text: 'first' });
      expect(state.past).toEqual([{ value: 0, text: 'initial' }]);
      expect(state.future).toEqual([
        { value: 2, text: 'second' },
        { value: 3, text: 'third' },
      ]);
    });

    it('should be no-op when past is empty', () => {
      const stack = createUndoRedoStack({ initialState: { value: 0, text: 'initial' } });

      stack.actions.undo();

      const state = stack.getState();
      expect(state.present).toEqual({ value: 0, text: 'initial' });
      expect(state.past).toEqual([]);
      expect(state.canUndo).toBe(false);
    });

    it('should invoke onStateChange callback when undoing', () => {
      const onStateChange = vi.fn();
      const stack = createUndoRedoStack({
        initialState: { value: 0, text: 'initial' },
        onStateChange,
      });

      stack.actions.pushState({ value: 1, text: 'first' });
      onStateChange.mockClear();

      stack.actions.undo();

      expect(onStateChange).toHaveBeenCalledTimes(1);
      expect(onStateChange).toHaveBeenCalledWith({ value: 0, text: 'initial' });
    });
  });

  describe('redo action', () => {
    it('should move to next state', () => {
      const stack = createUndoRedoStack({ initialState: { value: 0, text: 'initial' } });

      stack.actions.pushState({ value: 1, text: 'first' });
      stack.actions.undo();
      stack.actions.redo();

      const state = stack.getState();
      expect(state.present).toEqual({ value: 1, text: 'first' });
      expect(state.past).toEqual([{ value: 0, text: 'initial' }]);
      expect(state.future).toEqual([]);
      expect(state.canUndo).toBe(true);
      expect(state.canRedo).toBe(false);
    });

    it('should handle multiple redos', () => {
      const stack = createUndoRedoStack({ initialState: { value: 0, text: 'initial' } });

      stack.actions.pushState({ value: 1, text: 'first' });
      stack.actions.pushState({ value: 2, text: 'second' });
      stack.actions.pushState({ value: 3, text: 'third' });

      // Undo three times
      stack.actions.undo();
      stack.actions.undo();
      stack.actions.undo();

      // Redo twice
      stack.actions.redo();
      stack.actions.redo();

      const state = stack.getState();
      expect(state.present).toEqual({ value: 2, text: 'second' });
      expect(state.past).toEqual([
        { value: 0, text: 'initial' },
        { value: 1, text: 'first' },
      ]);
      expect(state.future).toEqual([{ value: 3, text: 'third' }]);
    });

    it('should be no-op when future is empty', () => {
      const stack = createUndoRedoStack({ initialState: { value: 0, text: 'initial' } });

      stack.actions.redo();

      const state = stack.getState();
      expect(state.present).toEqual({ value: 0, text: 'initial' });
      expect(state.future).toEqual([]);
      expect(state.canRedo).toBe(false);
    });

    it('should invoke onStateChange callback when redoing', () => {
      const onStateChange = vi.fn();
      const stack = createUndoRedoStack({
        initialState: { value: 0, text: 'initial' },
        onStateChange,
      });

      stack.actions.pushState({ value: 1, text: 'first' });
      stack.actions.undo();
      onStateChange.mockClear();

      stack.actions.redo();

      expect(onStateChange).toHaveBeenCalledTimes(1);
      expect(onStateChange).toHaveBeenCalledWith({ value: 1, text: 'first' });
    });
  });

  describe('undo-redo round trip', () => {
    it('should return to original state after undo then redo', () => {
      const stack = createUndoRedoStack({ initialState: { value: 0, text: 'initial' } });

      stack.actions.pushState({ value: 1, text: 'first' });
      const beforeUndo = stack.getState().present;

      stack.actions.undo();
      stack.actions.redo();

      expect(stack.getState().present).toEqual(beforeUndo);
    });

    it('should maintain state consistency through multiple round trips', () => {
      const stack = createUndoRedoStack({ initialState: { value: 0, text: 'initial' } });

      stack.actions.pushState({ value: 1, text: 'first' });
      stack.actions.pushState({ value: 2, text: 'second' });

      // Round trip 1
      stack.actions.undo();
      stack.actions.redo();
      expect(stack.getState().present).toEqual({ value: 2, text: 'second' });

      // Round trip 2
      stack.actions.undo();
      stack.actions.undo();
      stack.actions.redo();
      stack.actions.redo();
      expect(stack.getState().present).toEqual({ value: 2, text: 'second' });
    });
  });

  describe('clearHistory action', () => {
    it('should clear past and future but keep present', () => {
      const stack = createUndoRedoStack({ initialState: { value: 0, text: 'initial' } });

      stack.actions.pushState({ value: 1, text: 'first' });
      stack.actions.pushState({ value: 2, text: 'second' });
      stack.actions.undo();

      stack.actions.clearHistory();

      const state = stack.getState();
      expect(state.present).toEqual({ value: 1, text: 'first' });
      expect(state.past).toEqual([]);
      expect(state.future).toEqual([]);
      expect(state.canUndo).toBe(false);
      expect(state.canRedo).toBe(false);
    });
  });

  describe('jumpToState action', () => {
    it('should jump to specific index in history', () => {
      const stack = createUndoRedoStack({ initialState: { value: 0, text: 'initial' } });

      stack.actions.pushState({ value: 1, text: 'first' });
      stack.actions.pushState({ value: 2, text: 'second' });
      stack.actions.pushState({ value: 3, text: 'third' });

      // Jump to index 1 (first state)
      stack.actions.jumpToState(1);

      const state = stack.getState();
      expect(state.present).toEqual({ value: 1, text: 'first' });
      expect(state.past).toEqual([{ value: 0, text: 'initial' }]);
      expect(state.future).toEqual([
        { value: 2, text: 'second' },
        { value: 3, text: 'third' },
      ]);
    });

    it('should handle jumping to first state', () => {
      const stack = createUndoRedoStack({ initialState: { value: 0, text: 'initial' } });

      stack.actions.pushState({ value: 1, text: 'first' });
      stack.actions.pushState({ value: 2, text: 'second' });

      stack.actions.jumpToState(0);

      const state = stack.getState();
      expect(state.present).toEqual({ value: 0, text: 'initial' });
      expect(state.past).toEqual([]);
      expect(state.future).toEqual([
        { value: 1, text: 'first' },
        { value: 2, text: 'second' },
      ]);
    });

    it('should handle jumping to last state', () => {
      const stack = createUndoRedoStack({ initialState: { value: 0, text: 'initial' } });

      stack.actions.pushState({ value: 1, text: 'first' });
      stack.actions.pushState({ value: 2, text: 'second' });
      stack.actions.undo();
      stack.actions.undo();

      stack.actions.jumpToState(2);

      const state = stack.getState();
      expect(state.present).toEqual({ value: 2, text: 'second' });
      expect(state.future).toEqual([]);
    });

    it('should handle out of bounds index gracefully', () => {
      const stack = createUndoRedoStack({ initialState: { value: 0, text: 'initial' } });

      stack.actions.pushState({ value: 1, text: 'first' });

      const beforeState = stack.getState().present;
      stack.actions.jumpToState(10); // Out of bounds

      // State should remain unchanged
      expect(stack.getState().present).toEqual(beforeState);
    });

    it('should invoke onStateChange callback when jumping', () => {
      const onStateChange = vi.fn();
      const stack = createUndoRedoStack({
        initialState: { value: 0, text: 'initial' },
        onStateChange,
      });

      stack.actions.pushState({ value: 1, text: 'first' });
      stack.actions.pushState({ value: 2, text: 'second' });
      onStateChange.mockClear();

      stack.actions.jumpToState(0);

      expect(onStateChange).toHaveBeenCalledTimes(1);
      expect(onStateChange).toHaveBeenCalledWith({ value: 0, text: 'initial' });
    });
  });

  describe('setMaxLength action', () => {
    it('should update maxLength', () => {
      const stack = createUndoRedoStack({
        initialState: { value: 0, text: 'initial' },
        maxLength: 50,
      });

      stack.actions.setMaxLength(100);

      expect(stack.getState().maxLength).toBe(100);
    });

    it('should trim past when reducing maxLength', () => {
      const stack = createUndoRedoStack({
        initialState: { value: 0, text: 'initial' },
        maxLength: 10,
      });

      // Push 5 states
      for (let i = 1; i <= 5; i++) {
        stack.actions.pushState({ value: i, text: `state-${i}` });
      }

      expect(stack.getState().past.length).toBe(5);

      // Reduce maxLength to 3
      stack.actions.setMaxLength(3);

      const state = stack.getState();
      expect(state.past.length).toBe(3);
      expect(state.maxLength).toBe(3);

      // Should keep most recent states
      expect(state.past[state.past.length - 1]).toEqual({ value: 4, text: 'state-4' });
    });

    it('should reject maxLength less than 1', () => {
      const stack = createUndoRedoStack({
        initialState: { value: 0, text: 'initial' },
        maxLength: 50,
      });

      stack.actions.setMaxLength(0);

      // Should remain unchanged
      expect(stack.getState().maxLength).toBe(50);
    });
  });

  describe('subscribe', () => {
    it('should notify subscribers on state changes', () => {
      const stack = createUndoRedoStack({ initialState: { value: 0, text: 'initial' } });
      const listener = vi.fn();

      stack.subscribe(listener);
      stack.actions.pushState({ value: 1, text: 'first' });

      expect(listener).toHaveBeenCalled();
      const lastCall = listener.mock.calls[listener.mock.calls.length - 1];
      expect(lastCall[0].present).toEqual({ value: 1, text: 'first' });
    });

    it('should support multiple subscribers', () => {
      const stack = createUndoRedoStack({ initialState: { value: 0, text: 'initial' } });
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      stack.subscribe(listener1);
      stack.subscribe(listener2);

      stack.actions.pushState({ value: 1, text: 'first' });

      expect(listener1).toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();
    });

    it('should allow unsubscribing', () => {
      const stack = createUndoRedoStack({ initialState: { value: 0, text: 'initial' } });
      const listener = vi.fn();

      const unsubscribe = stack.subscribe(listener);
      unsubscribe();

      stack.actions.pushState({ value: 1, text: 'first' });

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('destroy', () => {
    it('should clean up subscriptions when destroyed', () => {
      const stack = createUndoRedoStack({ initialState: { value: 0, text: 'initial' } });
      const listener = vi.fn();

      stack.subscribe(listener);
      stack.destroy();

      stack.actions.pushState({ value: 1, text: 'first' });

      expect(listener).not.toHaveBeenCalled();
    });

    it('should handle multiple destroy calls gracefully', () => {
      const stack = createUndoRedoStack({ initialState: { value: 0, text: 'initial' } });

      expect(() => {
        stack.destroy();
        stack.destroy();
      }).not.toThrow();
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete lifecycle', () => {
      const onStateChange = vi.fn();
      const listener = vi.fn();

      const stack = createUndoRedoStack({
        initialState: { value: 0, text: 'initial' },
        maxLength: 10,
        onStateChange,
      });

      stack.subscribe(listener);

      // Push states
      stack.actions.pushState({ value: 1, text: 'first' });
      stack.actions.pushState({ value: 2, text: 'second' });
      stack.actions.pushState({ value: 3, text: 'third' });

      expect(stack.getState().present).toEqual({ value: 3, text: 'third' });
      expect(onStateChange).toHaveBeenCalledTimes(3);

      // Undo
      stack.actions.undo();
      expect(stack.getState().present).toEqual({ value: 2, text: 'second' });

      // Redo
      stack.actions.redo();
      expect(stack.getState().present).toEqual({ value: 3, text: 'third' });

      // Jump to state
      stack.actions.jumpToState(1);
      expect(stack.getState().present).toEqual({ value: 1, text: 'first' });

      // Clean up
      stack.destroy();
    });

    it('should work as text editor undo/redo', () => {
      interface EditorState {
        content: string;
        cursor: number;
      }

      const stack = createUndoRedoStack<EditorState>({
        initialState: { content: '', cursor: 0 },
      });

      // Type "Hello"
      stack.actions.pushState({ content: 'H', cursor: 1 });
      stack.actions.pushState({ content: 'He', cursor: 2 });
      stack.actions.pushState({ content: 'Hel', cursor: 3 });
      stack.actions.pushState({ content: 'Hell', cursor: 4 });
      stack.actions.pushState({ content: 'Hello', cursor: 5 });

      expect(stack.getState().present).toEqual({ content: 'Hello', cursor: 5 });

      // Undo 3 times
      stack.actions.undo();
      stack.actions.undo();
      stack.actions.undo();

      expect(stack.getState().present).toEqual({ content: 'He', cursor: 2 });

      // Type "y"
      stack.actions.pushState({ content: 'Hey', cursor: 3 });

      expect(stack.getState().present).toEqual({ content: 'Hey', cursor: 3 });
      expect(stack.getState().future).toEqual([]); // Future cleared

      stack.destroy();
    });
  });
});

// ============================================================================
// Property-Based Tests
// ============================================================================

describe('Undo/Redo Stack - Property-Based Tests', () => {
  /**
   * Feature: ui-core-gaps, Property 6: Push state transition
   * Validates: Requirements 2.4
   *
   * For any state, when pushState is called, the current state should move to past,
   * the new state should become present, and future should be empty.
   */
  it('Property 6: Push state transition', () => {
    fc.assert(
      fc.property(
        fc.record({
          value: fc.integer(),
          text: fc.string(),
        }),
        fc.record({
          value: fc.integer(),
          text: fc.string(),
        }),
        (initialState, newState) => {
          const stack = createUndoRedoStack({ initialState });

          // Get the state before pushing
          const beforePush = stack.getState();
          const previousPresent = beforePush.present;
          const previousPastLength = beforePush.past.length;

          // Push new state
          stack.actions.pushState(newState);

          // Get state after pushing
          const afterPush = stack.getState();

          // Verify: current state moved to past
          expect(afterPush.past[afterPush.past.length - 1]).toEqual(previousPresent);

          // Verify: new state is now present
          expect(afterPush.present).toEqual(newState);

          // Verify: future is empty
          expect(afterPush.future).toEqual([]);

          // Verify: past length increased by 1
          expect(afterPush.past.length).toBe(previousPastLength + 1);

          // Verify: canUndo is true
          expect(afterPush.canUndo).toBe(true);

          // Verify: canRedo is false
          expect(afterPush.canRedo).toBe(false);

          stack.destroy();
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Feature: ui-core-gaps, Property 7: Undo state transition
   * Validates: Requirements 2.5
   *
   * For any non-empty past history, when undo is called, the current state should move to future,
   * and the most recent past state should become present.
   */
  it('Property 7: Undo state transition', () => {
    fc.assert(
      fc.property(
        fc.record({
          value: fc.integer(),
          text: fc.string(),
        }),
        fc.array(
          fc.record({
            value: fc.integer(),
            text: fc.string(),
          }),
          { minLength: 1, maxLength: 10 },
        ),
        (initialState, statesToPush) => {
          const stack = createUndoRedoStack({ initialState });

          // Push states to create history
          statesToPush.forEach((state) => stack.actions.pushState(state));

          // Get state before undo
          const beforeUndo = stack.getState();
          const previousPresent = beforeUndo.present;
          const previousPast = [...beforeUndo.past];
          const expectedNewPresent = previousPast[previousPast.length - 1];

          // Perform undo
          stack.actions.undo();

          // Get state after undo
          const afterUndo = stack.getState();

          // Verify: previous present moved to future
          expect(afterUndo.future[0]).toEqual(previousPresent);

          // Verify: most recent past state is now present
          expect(afterUndo.present).toEqual(expectedNewPresent);

          // Verify: past length decreased by 1
          expect(afterUndo.past.length).toBe(previousPast.length - 1);

          // Verify: canRedo is true
          expect(afterUndo.canRedo).toBe(true);

          stack.destroy();
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Feature: ui-core-gaps, Property 8: Redo state transition
   * Validates: Requirements 2.6
   *
   * For any non-empty future history, when redo is called, the current state should move to past,
   * and the next future state should become present.
   */
  it('Property 8: Redo state transition', () => {
    fc.assert(
      fc.property(
        fc.record({
          value: fc.integer(),
          text: fc.string(),
        }),
        fc.array(
          fc.record({
            value: fc.integer(),
            text: fc.string(),
          }),
          { minLength: 2, maxLength: 10 },
        ),
        fc.integer({ min: 1, max: 5 }),
        (initialState, statesToPush, undoCount) => {
          const stack = createUndoRedoStack({ initialState });

          // Push states to create history
          statesToPush.forEach((state) => stack.actions.pushState(state));

          // Undo to create future (but not more than available)
          const actualUndoCount = Math.min(undoCount, statesToPush.length);
          for (let i = 0; i < actualUndoCount; i++) {
            stack.actions.undo();
          }

          // Get state before redo
          const beforeRedo = stack.getState();

          // Skip if no future available
          if (beforeRedo.future.length === 0) {
            stack.destroy();
            return;
          }

          const previousPresent = beforeRedo.present;
          const previousPastLength = beforeRedo.past.length;
          const expectedNewPresent = beforeRedo.future[0];

          // Perform redo
          stack.actions.redo();

          // Get state after redo
          const afterRedo = stack.getState();

          // Verify: previous present moved to past
          expect(afterRedo.past[afterRedo.past.length - 1]).toEqual(previousPresent);

          // Verify: next future state is now present
          expect(afterRedo.present).toEqual(expectedNewPresent);

          // Verify: past length increased by 1
          expect(afterRedo.past.length).toBe(previousPastLength + 1);

          // Verify: future length decreased by 1
          expect(afterRedo.future.length).toBe(beforeRedo.future.length - 1);

          // Verify: canUndo is true
          expect(afterRedo.canUndo).toBe(true);

          stack.destroy();
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Feature: ui-core-gaps, Property 9: Undo-redo round trip
   * Validates: Requirements 2.5, 2.6
   *
   * For any state, performing undo followed by redo should return to the original state (idempotence).
   */
  it('Property 9: Undo-redo round trip', () => {
    fc.assert(
      fc.property(
        fc.record({
          value: fc.integer(),
          text: fc.string(),
        }),
        fc.array(
          fc.record({
            value: fc.integer(),
            text: fc.string(),
          }),
          { minLength: 1, maxLength: 10 },
        ),
        (initialState, statesToPush) => {
          const stack = createUndoRedoStack({ initialState });

          // Push states to create history
          statesToPush.forEach((state) => stack.actions.pushState(state));

          // Capture state before undo
          const beforeUndo = stack.getState().present;

          // Perform undo then redo
          stack.actions.undo();
          stack.actions.redo();

          // Verify: state is back to what it was before undo
          expect(stack.getState().present).toEqual(beforeUndo);

          stack.destroy();
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Feature: ui-core-gaps, Property 10: History length limit
   * Validates: Requirements 2.7, 2.8
   *
   * For any maxLength value, when the number of past states exceeds maxLength,
   * the oldest state should be removed.
   */
  it('Property 10: History length limit', () => {
    fc.assert(
      fc.property(
        fc.record({
          value: fc.integer(),
          text: fc.string(),
        }),
        fc.integer({ min: 1, max: 10 }),
        fc.array(
          fc.record({
            value: fc.integer(),
            text: fc.string(),
          }),
          { minLength: 1, maxLength: 20 },
        ),
        (initialState, maxLength, statesToPush) => {
          const stack = createUndoRedoStack({ initialState, maxLength });

          // Track all states in order (for verification)
          const allStates = [initialState, ...statesToPush];

          // Push states
          statesToPush.forEach((state) => stack.actions.pushState(state));

          const finalState = stack.getState();

          // Verify: past length never exceeds maxLength
          expect(finalState.past.length).toBeLessThanOrEqual(maxLength);

          // If we pushed more states than maxLength, verify oldest states were removed
          if (statesToPush.length > maxLength) {
            // The past should contain exactly maxLength states
            expect(finalState.past.length).toBe(maxLength);

            // The past should contain the most recent maxLength states before present
            // Present is the last pushed state, so past should have the maxLength states before it
            const expectedPast = allStates.slice(-(maxLength + 1), -1);

            // Verify each state in past matches expected
            for (let i = 0; i < finalState.past.length; i++) {
              expect(finalState.past[i]).toEqual(expectedPast[i]);
            }
          } else {
            // If we didn't exceed maxLength, all states should be preserved
            // Past should contain: initialState + all but the last pushed state
            const expectedPast = allStates.slice(0, -1);
            expect(finalState.past).toEqual(expectedPast);
          }

          // Verify present is the last pushed state
          expect(finalState.present).toEqual(statesToPush[statesToPush.length - 1]);

          stack.destroy();
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Feature: ui-core-gaps, Property 11: State serializability
   * Validates: Requirements 2.9
   *
   * For any state in the history, serializing and deserializing the state
   * should produce an equivalent state.
   */
  it('Property 11: State serializability', () => {
    fc.assert(
      fc.property(
        fc.record({
          value: fc.integer(),
          text: fc.string(),
          nested: fc.record({
            flag: fc.boolean(),
            count: fc.integer(),
          }),
        }),
        fc.array(
          fc.record({
            value: fc.integer(),
            text: fc.string(),
            nested: fc.record({
              flag: fc.boolean(),
              count: fc.integer(),
            }),
          }),
          { minLength: 1, maxLength: 5 },
        ),
        (initialState, statesToPush) => {
          const stack = createUndoRedoStack({ initialState });

          // Push states
          statesToPush.forEach((state) => stack.actions.pushState(state));

          // Optionally undo a few times to create future states
          const undoCount = Math.min(2, statesToPush.length);
          for (let i = 0; i < undoCount; i++) {
            stack.actions.undo();
          }

          // Get the full state
          const fullState = stack.getState();

          // Serialize and deserialize the entire history
          const serialized = JSON.stringify({
            past: fullState.past,
            present: fullState.present,
            future: fullState.future,
          });

          const deserialized = JSON.parse(serialized);

          // Verify: deserialized states match original states (round-trip test)
          expect(deserialized.past).toEqual(fullState.past);
          expect(deserialized.present).toEqual(fullState.present);
          expect(deserialized.future).toEqual(fullState.future);

          // Verify: each individual state in the history is serializable
          // Test past states
          for (const pastState of fullState.past) {
            const serializedState = JSON.stringify(pastState);
            const deserializedState = JSON.parse(serializedState);
            expect(deserializedState).toEqual(pastState);
          }

          // Test present state
          const serializedPresent = JSON.stringify(fullState.present);
          const deserializedPresent = JSON.parse(serializedPresent);
          expect(deserializedPresent).toEqual(fullState.present);

          // Test future states
          for (const futureState of fullState.future) {
            const serializedState = JSON.stringify(futureState);
            const deserializedState = JSON.parse(serializedState);
            expect(deserializedState).toEqual(futureState);
          }

          stack.destroy();
        },
      ),
      { numRuns: 100 },
    );
  });
});
