import { describe, it, expect, vi } from 'vitest';
import fc from 'fast-check';
import { createFloatingActionButton } from '../floating-action-button';

/**
 * Property-Based Tests for Floating Action Button Pattern
 *
 * These tests validate the correctness properties defined in the design document
 * using property-based testing with fast-check.
 */

describe('Floating Action Button - Property-Based Tests', () => {
  /**
   * Arbitrary generator for scroll positions (non-negative integers)
   */
  const scrollPositionArbitrary = fc.nat({ max: 10000 });

  /**
   * Arbitrary generator for scroll thresholds (non-negative integers)
   */
  const scrollThresholdArbitrary = fc.nat({ max: 1000 });

  /**
   * Feature: ui-core-gaps, Property 26: Scroll direction detection
   * Validates: Requirements 6.4
   *
   * For any two consecutive scroll positions, the scroll direction should be
   * correctly calculated as 'up' or 'down'.
   */
  it('Property 26: Scroll direction detection', () => {
    fc.assert(
      fc.property(scrollPositionArbitrary, scrollPositionArbitrary, (position1, position2) => {
        const fab = createFloatingActionButton();

        // Set first position
        fab.actions.setScrollPosition(position1);

        // Set second position
        fab.actions.setScrollPosition(position2);

        const state = fab.getState();

        // Verify scroll direction
        if (position2 > position1) {
          expect(state.scrollDirection).toBe('down');
        } else if (position2 < position1) {
          expect(state.scrollDirection).toBe('up');
        } else {
          // Same position, direction should be null
          expect(state.scrollDirection).toBe(null);
        }

        fab.destroy();
      }),
      { numRuns: 100 },
    );
  });

  /**
   * Feature: ui-core-gaps, Property 27: Threshold-based visibility
   * Validates: Requirements 6.5, 6.6
   *
   * For any scroll position above the threshold, the FAB should be visible;
   * for any position below, it should be hidden.
   */
  it('Property 27: Threshold-based visibility', () => {
    fc.assert(
      fc.property(scrollThresholdArbitrary, scrollPositionArbitrary, (threshold, position) => {
        const fab = createFloatingActionButton({
          scrollThreshold: threshold,
          hideOnScrollDown: false, // Disable to test pure threshold logic
        });

        // Set scroll position
        fab.actions.setScrollPosition(position);

        const state = fab.getState();

        // Verify visibility based on threshold
        if (position >= threshold) {
          expect(state.isVisible).toBe(true);
        } else {
          expect(state.isVisible).toBe(false);
        }

        fab.destroy();
      }),
      { numRuns: 100 },
    );
  });

  /**
   * Feature: ui-core-gaps, Property 28: Hide on scroll down behavior
   * Validates: Requirements 6.7, 6.8
   *
   * For any scroll down event when hideOnScrollDown is enabled, the FAB should
   * be hidden; for scroll up, it should be shown.
   */
  it('Property 28: Hide on scroll down behavior', () => {
    fc.assert(
      fc.property(
        scrollThresholdArbitrary,
        fc.array(scrollPositionArbitrary, { minLength: 2, maxLength: 10 }),
        (threshold, positions) => {
          // Filter positions to ensure they're all above threshold
          const validPositions = positions.filter((p) => p >= threshold);
          if (validPositions.length < 2) return; // Skip if not enough valid positions

          const fab = createFloatingActionButton({
            scrollThreshold: threshold,
            hideOnScrollDown: true,
          });

          // Process scroll positions
          for (let i = 0; i < validPositions.length; i++) {
            const currentPosition = validPositions[i];
            const previousPosition = i > 0 ? validPositions[i - 1] : 0;

            fab.actions.setScrollPosition(currentPosition);

            const state = fab.getState();

            // Verify visibility based on scroll direction
            if (currentPosition > previousPosition && i > 0) {
              // Scrolling down - should be hidden
              expect(state.isVisible).toBe(false);
            } else if (currentPosition < previousPosition && i > 0) {
              // Scrolling up - should be visible (if above threshold)
              if (currentPosition >= threshold) {
                expect(state.isVisible).toBe(true);
              }
            }
          }

          fab.destroy();
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Additional property: Scroll position should always be tracked correctly
   */
  it('Property: Scroll position tracking', () => {
    fc.assert(
      fc.property(scrollPositionArbitrary, (position) => {
        const fab = createFloatingActionButton();

        fab.actions.setScrollPosition(position);

        const state = fab.getState();

        // Verify scroll position is stored correctly
        expect(state.scrollPosition).toBe(position);

        fab.destroy();
      }),
      { numRuns: 100 },
    );
  });

  /**
   * Additional property: Threshold changes should re-evaluate visibility
   */
  it('Property: Threshold changes re-evaluate visibility', () => {
    fc.assert(
      fc.property(
        scrollPositionArbitrary,
        scrollThresholdArbitrary,
        scrollThresholdArbitrary,
        (position, threshold1, threshold2) => {
          const fab = createFloatingActionButton({
            scrollThreshold: threshold1,
            hideOnScrollDown: false,
          });

          // Set scroll position
          fab.actions.setScrollPosition(position);

          // Change threshold
          fab.actions.setScrollThreshold(threshold2);

          const state = fab.getState();

          // Verify visibility based on new threshold
          if (position >= threshold2) {
            expect(state.isVisible).toBe(true);
          } else {
            expect(state.isVisible).toBe(false);
          }

          fab.destroy();
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Additional property: Manual show/hide should override automatic behavior
   */
  it('Property: Manual show/hide overrides automatic behavior', () => {
    fc.assert(
      fc.property(scrollPositionArbitrary, (position) => {
        const fab = createFloatingActionButton({
          scrollThreshold: 100,
        });

        // Manually show
        fab.actions.show();
        expect(fab.getState().isVisible).toBe(true);

        // Manually hide
        fab.actions.hide();
        expect(fab.getState().isVisible).toBe(false);

        fab.destroy();
      }),
      { numRuns: 100 },
    );
  });

  /**
   * Additional property: Toggle should flip visibility state
   */
  it('Property: Toggle flips visibility state', () => {
    fc.assert(
      fc.property(fc.boolean(), (initiallyVisible) => {
        const fab = createFloatingActionButton();

        // Set initial state
        if (initiallyVisible) {
          fab.actions.show();
        } else {
          fab.actions.hide();
        }

        const stateBefore = fab.getState().isVisible;

        // Toggle
        fab.actions.toggle();

        const stateAfter = fab.getState().isVisible;

        // Verify toggle flipped the state
        expect(stateAfter).toBe(!stateBefore);

        fab.destroy();
      }),
      { numRuns: 100 },
    );
  });

  /**
   * Additional property: Visibility callback should be invoked on changes
   */
  it('Property: Visibility callback invocation', () => {
    fc.assert(
      fc.property(scrollPositionArbitrary, scrollThresholdArbitrary, (position, threshold) => {
        const onVisibilityChange = vi.fn();
        const fab = createFloatingActionButton({
          scrollThreshold: threshold,
          hideOnScrollDown: false,
          onVisibilityChange,
        });

        // Set scroll position that triggers visibility change
        fab.actions.setScrollPosition(position);

        const state = fab.getState();

        // If visibility changed from initial false state, callback should be called
        if (state.isVisible) {
          expect(onVisibilityChange).toHaveBeenCalledWith(true);
        }

        fab.destroy();
      }),
      { numRuns: 100 },
    );
  });

  /**
   * Additional property: Event emission on visibility changes
   */
  it('Property: Event emission on visibility changes', () => {
    fc.assert(
      fc.property(scrollThresholdArbitrary, (threshold) => {
        const fab = createFloatingActionButton({
          scrollThreshold: threshold,
          hideOnScrollDown: false,
        });

        const shownListener = vi.fn();
        const hiddenListener = vi.fn();

        fab.eventBus.on('fab:shown', shownListener);
        fab.eventBus.on('fab:hidden', hiddenListener);

        // Trigger show by scrolling past threshold
        fab.actions.setScrollPosition(threshold + 100);

        if (fab.getState().isVisible) {
          expect(shownListener).toHaveBeenCalled();
        }

        // Trigger hide by scrolling below threshold
        fab.actions.setScrollPosition(threshold - 10);

        if (!fab.getState().isVisible) {
          expect(hiddenListener).toHaveBeenCalled();
        }

        fab.destroy();
      }),
      { numRuns: 100 },
    );
  });

  /**
   * Additional property: Scroll direction should emit events when changed
   */
  it('Property: Scroll direction change events', () => {
    fc.assert(
      fc.property(scrollPositionArbitrary, scrollPositionArbitrary, (position1, position2) => {
        if (position1 === position2) return; // Skip same positions

        const fab = createFloatingActionButton();
        const directionListener = vi.fn();

        fab.eventBus.on('fab:scroll-direction-changed', directionListener);

        // Set first position
        fab.actions.setScrollPosition(position1);

        // Set second position (should trigger direction change)
        fab.actions.setScrollPosition(position2);

        // Verify event was emitted with correct direction
        if (position2 > position1) {
          expect(directionListener).toHaveBeenCalledWith('down');
        } else if (position2 < position1) {
          expect(directionListener).toHaveBeenCalledWith('up');
        }

        fab.destroy();
      }),
      { numRuns: 100 },
    );
  });

  /**
   * Additional property: setHideOnScrollDown should re-evaluate visibility
   */
  it('Property: setHideOnScrollDown re-evaluates visibility', () => {
    fc.assert(
      fc.property(scrollThresholdArbitrary, scrollPositionArbitrary, (threshold, position) => {
        if (position < threshold) return; // Skip positions below threshold

        const fab = createFloatingActionButton({
          scrollThreshold: threshold,
          hideOnScrollDown: false,
        });

        // Scroll to position (scrolling down from 0)
        fab.actions.setScrollPosition(position);

        // Should be visible since hideOnScrollDown is false
        expect(fab.getState().isVisible).toBe(true);

        // Enable hideOnScrollDown
        fab.actions.setHideOnScrollDown(true);

        // Re-trigger scroll position to re-evaluate
        fab.actions.setScrollPosition(position);

        // State should be re-evaluated based on new setting
        // Since we're at the same position, direction is null, so it should still be visible
        // Let's scroll down to trigger the hide
        fab.actions.setScrollPosition(position + 10);

        // Now it should be hidden because we scrolled down
        expect(fab.getState().isVisible).toBe(false);

        fab.destroy();
      }),
      { numRuns: 100 },
    );
  });
});
