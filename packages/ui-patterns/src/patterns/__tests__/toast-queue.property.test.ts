import { describe, it, expect, vi } from 'vitest';
import fc from 'fast-check';
import { createToastQueue, type ToastPosition } from '../toast-queue';

/**
 * Property-Based Tests for Toast Queue Pattern Enhancements
 *
 * These tests validate the correctness properties defined in the design document
 * using property-based testing with fast-check.
 */

describe('Toast Queue - Property-Based Tests', () => {
  /**
   * Arbitrary generator for toast positions
   */
  const toastPositionArbitrary = fc.constantFrom<ToastPosition>(
    'top-left',
    'top-center',
    'top-right',
    'bottom-left',
    'bottom-center',
    'bottom-right',
  );

  /**
   * Feature: ui-core-gaps, Property 35: Position configuration
   * Validates: Requirements 11.2, 11.5
   *
   * For any valid position value, setting the position should update the state
   * and emit a position change event.
   */
  it('Property 35: Position configuration', () => {
    fc.assert(
      fc.property(toastPositionArbitrary, toastPositionArbitrary, (initialPosition, newPosition) => {
        const onPositionChanged = vi.fn();
        const toastQueue = createToastQueue({
          position: initialPosition,
          onPositionChanged,
        });

        // Verify initial position
        expect(toastQueue.getState().position).toBe(initialPosition);

        // Set up event listener
        const eventListener = vi.fn();
        toastQueue.eventBus.on('toast:position-changed', eventListener);

        // Change position
        toastQueue.actions.setPosition(newPosition);

        // Verify position was updated in state
        expect(toastQueue.getState().position).toBe(newPosition);

        // Verify callback was invoked
        expect(onPositionChanged).toHaveBeenCalledWith(newPosition);

        // Verify event was emitted
        expect(eventListener).toHaveBeenCalledWith({ position: newPosition });

        toastQueue.destroy();
      }),
      { numRuns: 100 },
    );
  });

  /**
   * Additional property: Position should persist across state changes
   */
  it('Property: Position persists across toast operations', () => {
    fc.assert(
      fc.property(
        toastPositionArbitrary,
        fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 1, maxLength: 5 }),
        (position, messages) => {
          const toastQueue = createToastQueue({ position });

          // Add multiple toasts
          messages.forEach((message) => {
            toastQueue.actions.addToast({
              message,
              type: 'info',
              duration: 5000,
            });
          });

          // Position should remain unchanged
          expect(toastQueue.getState().position).toBe(position);

          // Remove a toast
          const state = toastQueue.getState();
          if (state.toasts.length > 0) {
            toastQueue.actions.removeToast(state.toasts[0].id);
          }

          // Position should still be unchanged
          expect(toastQueue.getState().position).toBe(position);

          toastQueue.destroy();
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Additional property: Multiple position changes should all be tracked
   */
  it('Property: Multiple position changes are tracked correctly', () => {
    fc.assert(
      fc.property(fc.array(toastPositionArbitrary, { minLength: 2, maxLength: 10 }), (positions) => {
        const toastQueue = createToastQueue();
        const stateChanges: ToastPosition[] = [];

        // Subscribe to position changes
        toastQueue.subscribe((state) => {
          stateChanges.push(state.position);
        });

        // Apply all position changes
        positions.forEach((position) => {
          toastQueue.actions.setPosition(position);
        });

        // Final position should match last position in array
        expect(toastQueue.getState().position).toBe(positions[positions.length - 1]);

        // Count unique position changes (filtering out duplicates)
        const uniquePositions = positions.filter((pos, idx) => {
          if (idx === 0) {
            // First position is unique if different from default
            return pos !== 'top-right';
          }
          // Subsequent positions are unique if different from previous
          return pos !== positions[idx - 1];
        });

        // State changes should only happen for actual changes in position
        // If all positions are the same as default or duplicates, no state changes occur
        if (uniquePositions.length > 0) {
          expect(stateChanges.length).toBeGreaterThanOrEqual(1);
          expect(stateChanges[stateChanges.length - 1]).toBe(positions[positions.length - 1]);
        } else {
          // If no unique positions, no state changes should occur
          expect(stateChanges.length).toBe(0);
        }

        toastQueue.destroy();
      }),
      { numRuns: 100 },
    );
  });

  /**
   * Additional property: Position change should not affect toast queue
   */
  it('Property: Position change does not affect toast queue', () => {
    fc.assert(
      fc.property(
        toastPositionArbitrary,
        toastPositionArbitrary,
        fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 1, maxLength: 5 }),
        (position1, position2, messages) => {
          const toastQueue = createToastQueue({ position: position1 });

          // Add toasts
          const toastIds = messages.map((message) =>
            toastQueue.actions.addToast({
              message,
              type: 'info',
              duration: 5000,
            }),
          );

          const toastCountBefore = toastQueue.getState().toasts.length;

          // Change position
          toastQueue.actions.setPosition(position2);

          const toastCountAfter = toastQueue.getState().toasts.length;

          // Toast count should remain the same
          expect(toastCountAfter).toBe(toastCountBefore);

          // All toast IDs should still be present
          const currentToastIds = toastQueue.getState().toasts.map((t) => t.id);
          toastIds.forEach((id) => {
            expect(currentToastIds).toContain(id);
          });

          toastQueue.destroy();
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Additional property: Event emission should be consistent
   */
  it('Property: Event emission is consistent with state changes', () => {
    fc.assert(
      fc.property(fc.array(toastPositionArbitrary, { minLength: 1, maxLength: 10 }), (positions) => {
        const toastQueue = createToastQueue();
        const eventListener = vi.fn();

        toastQueue.eventBus.on('toast:position-changed', eventListener);

        // Apply all position changes
        positions.forEach((position) => {
          toastQueue.actions.setPosition(position);
        });

        // Event should have been emitted for each position change
        expect(eventListener).toHaveBeenCalledTimes(positions.length);

        // Verify each event had the correct position
        positions.forEach((position, index) => {
          expect(eventListener).toHaveBeenNthCalledWith(index + 1, { position });
        });

        toastQueue.destroy();
      }),
      { numRuns: 100 },
    );
  });

  /**
   * Additional property: Position should be independent of other configuration
   */
  it('Property: Position is independent of other configuration', () => {
    fc.assert(
      fc.property(
        toastPositionArbitrary,
        fc.integer({ min: 1, max: 10 }),
        fc.integer({ min: 1000, max: 10000 }),
        (position, maxVisible, defaultDuration) => {
          const toastQueue = createToastQueue({
            position,
            maxVisible,
            defaultDuration,
          });

          // Verify all configuration is set correctly
          const state = toastQueue.getState();
          expect(state.position).toBe(position);
          expect(state.maxVisible).toBe(maxVisible);
          expect(state.defaultDuration).toBe(defaultDuration);

          // Change position
          const newPosition: ToastPosition = position === 'top-left' ? 'bottom-right' : 'top-left';
          toastQueue.actions.setPosition(newPosition);

          // Verify position changed but other config remained the same
          const newState = toastQueue.getState();
          expect(newState.position).toBe(newPosition);
          expect(newState.maxVisible).toBe(maxVisible);
          expect(newState.defaultDuration).toBe(defaultDuration);

          toastQueue.destroy();
        },
      ),
      { numRuns: 100 },
    );
  });
});
