import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { createGridLayout, type Breakpoint } from '../grid-layout';

/**
 * Property-Based Tests for Grid/Card Layout Pattern
 *
 * These tests validate the correctness properties defined in the design document
 * using property-based testing with fast-check.
 */

describe('Grid Layout - Property-Based Tests', () => {
  interface TestItem {
    id: string;
    name: string;
  }

  /**
   * Arbitrary generator for test items
   */
  const testItemArbitrary = fc.record({
    id: fc.string({ minLength: 1, maxLength: 20 }),
    name: fc.string({ minLength: 1, maxLength: 50 }),
  });

  /**
   * Arbitrary generator for arrays of unique test items
   */
  const itemsArrayArbitrary = fc.array(testItemArbitrary, { minLength: 1, maxLength: 20 }).map((items) => {
    // Ensure unique IDs
    const uniqueItems: TestItem[] = [];
    const seenIds = new Set<string>();
    for (const item of items) {
      if (!seenIds.has(item.id)) {
        uniqueItems.push(item);
        seenIds.add(item.id);
      }
    }
    return uniqueItems.length > 0 ? uniqueItems : [{ id: 'default', name: 'Default' }];
  });

  /**
   * Arbitrary generator for valid breakpoints
   */
  const breakpointArbitrary: fc.Arbitrary<Breakpoint> = fc.record({
    minWidth: fc.nat({ max: 2000 }),
    columns: fc.integer({ min: 1, max: 6 }),
  });

  /**
   * Arbitrary generator for arrays of breakpoints (sorted by minWidth)
   */
  const breakpointsArrayArbitrary = fc.array(breakpointArbitrary, { minLength: 1, maxLength: 5 }).map((breakpoints) => {
    // Sort by minWidth and ensure uniqueness
    const sorted = [...breakpoints].sort((a, b) => a.minWidth - b.minWidth);
    const unique: Breakpoint[] = [];
    const seenWidths = new Set<number>();
    for (const bp of sorted) {
      if (!seenWidths.has(bp.minWidth)) {
        unique.push(bp);
        seenWidths.add(bp.minWidth);
      }
    }
    return unique.length > 0 ? unique : [{ minWidth: 0, columns: 1 }];
  });

  /**
   * Feature: ui-core-gaps, Property 20: Breakpoint column calculation
   * Validates: Requirements 5.4, 5.5
   *
   * For any viewport width and set of breakpoints, the number of columns should
   * match the breakpoint with the largest minWidth that is less than or equal
   * to the viewport width.
   */
  it('Property 20: Breakpoint column calculation', () => {
    fc.assert(
      fc.property(
        itemsArrayArbitrary,
        breakpointsArrayArbitrary,
        fc.nat({ max: 2000 }),
        (items, breakpoints, viewportWidth) => {
          const grid = createGridLayout({
            items,
            getId: (item) => item.id,
            breakpoints,
            initialViewportWidth: viewportWidth,
          });

          const state = grid.getState();

          // Find the expected breakpoint manually
          let expectedBreakpoint = breakpoints[0];
          for (const bp of breakpoints) {
            if (viewportWidth >= bp.minWidth) {
              expectedBreakpoint = bp;
            } else {
              break;
            }
          }

          // Verify the columns match the expected breakpoint
          expect(state.columns).toBe(expectedBreakpoint.columns);
          expect(state.breakpoint).toEqual(expectedBreakpoint);

          grid.destroy();
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Feature: ui-core-gaps, Property 21: Up navigation correctness
   * Validates: Requirements 5.7
   *
   * For any focused item not in the first row, navigating up should move focus
   * to the item in the same column in the row above (index - columns).
   */
  it('Property 21: Up navigation correctness', () => {
    fc.assert(
      fc.property(itemsArrayArbitrary, fc.integer({ min: 1, max: 4 }), (items, columns) => {
        // Only test if we have enough items for at least 2 rows
        if (items.length <= columns) return;

        const grid = createGridLayout({
          items,
          getId: (item) => item.id,
          breakpoints: [{ minWidth: 0, columns }],
          wrap: false,
        });

        // Focus on an item in the second row or later
        const initialIndex = columns; // First item of second row
        grid.actions.setFocusedIndex(initialIndex);

        // Navigate up
        grid.actions.navigateUp();

        const state = grid.getState();
        const expectedIndex = initialIndex - columns;

        // Verify focus moved up by exactly 'columns' positions
        expect(state.focusedIndex).toBe(expectedIndex);

        grid.destroy();
      }),
      { numRuns: 100 },
    );
  });

  /**
   * Feature: ui-core-gaps, Property 22: Down navigation correctness
   * Validates: Requirements 5.8
   *
   * For any focused item not in the last row, navigating down should move focus
   * to the item in the same column in the row below (index + columns).
   */
  it('Property 22: Down navigation correctness', () => {
    fc.assert(
      fc.property(itemsArrayArbitrary, fc.integer({ min: 1, max: 4 }), (items, columns) => {
        // Only test if we have enough items for at least 2 rows
        if (items.length <= columns) return;

        const grid = createGridLayout({
          items,
          getId: (item) => item.id,
          breakpoints: [{ minWidth: 0, columns }],
          wrap: false,
        });

        // Focus on an item in the first row
        const initialIndex = 0;
        grid.actions.setFocusedIndex(initialIndex);

        // Navigate down
        grid.actions.navigateDown();

        const state = grid.getState();
        const expectedIndex = initialIndex + columns;

        // Verify focus moved down by exactly 'columns' positions
        // Only if the expected index is within bounds
        if (expectedIndex < items.length) {
          expect(state.focusedIndex).toBe(expectedIndex);
        } else {
          // If out of bounds and wrap is false, should stay at current position
          expect(state.focusedIndex).toBe(initialIndex);
        }

        grid.destroy();
      }),
      { numRuns: 100 },
    );
  });

  /**
   * Feature: ui-core-gaps, Property 23: Left navigation with wrapping
   * Validates: Requirements 5.9
   *
   * For any focused item, navigating left should move to the previous item,
   * wrapping to the last item if at the first position.
   */
  it('Property 23: Left navigation with wrapping', () => {
    fc.assert(
      fc.property(itemsArrayArbitrary, fc.integer({ min: 1, max: 4 }), fc.nat(), (items, columns, indexSeed) => {
        if (items.length === 0) return;

        const grid = createGridLayout({
          items,
          getId: (item) => item.id,
          breakpoints: [{ minWidth: 0, columns }],
          wrap: true,
        });

        // Pick a random starting index
        const initialIndex = indexSeed % items.length;
        grid.actions.setFocusedIndex(initialIndex);

        // Navigate left
        grid.actions.navigateLeft();

        const state = grid.getState();

        // Calculate expected index
        let expectedIndex: number;
        if (initialIndex === 0) {
          // Should wrap to last item
          expectedIndex = items.length - 1;
        } else {
          // Should move to previous item
          expectedIndex = initialIndex - 1;
        }

        expect(state.focusedIndex).toBe(expectedIndex);

        grid.destroy();
      }),
      { numRuns: 100 },
    );
  });

  /**
   * Feature: ui-core-gaps, Property 24: Right navigation with wrapping
   * Validates: Requirements 5.10
   *
   * For any focused item, navigating right should move to the next item,
   * wrapping to the first item if at the last position.
   */
  it('Property 24: Right navigation with wrapping', () => {
    fc.assert(
      fc.property(itemsArrayArbitrary, fc.integer({ min: 1, max: 4 }), fc.nat(), (items, columns, indexSeed) => {
        if (items.length === 0) return;

        const grid = createGridLayout({
          items,
          getId: (item) => item.id,
          breakpoints: [{ minWidth: 0, columns }],
          wrap: true,
        });

        // Pick a random starting index
        const initialIndex = indexSeed % items.length;
        grid.actions.setFocusedIndex(initialIndex);

        // Navigate right
        grid.actions.navigateRight();

        const state = grid.getState();

        // Calculate expected index
        let expectedIndex: number;
        if (initialIndex === items.length - 1) {
          // Should wrap to first item
          expectedIndex = 0;
        } else {
          // Should move to next item
          expectedIndex = initialIndex + 1;
        }

        expect(state.focusedIndex).toBe(expectedIndex);

        grid.destroy();
      }),
      { numRuns: 100 },
    );
  });

  /**
   * Feature: ui-core-gaps, Property 25: Selection mode consistency
   * Validates: Requirements 5.11
   *
   * For any selection mode (single or multi), the selection behavior should
   * match the mode (single allows one selection, multi allows multiple).
   */
  it('Property 25: Selection mode consistency', () => {
    fc.assert(
      fc.property(
        itemsArrayArbitrary,
        fc.constantFrom('single' as const, 'multi' as const),
        fc.array(fc.nat(), { minLength: 2, maxLength: 5 }),
        (items, selectionMode, selectionIndices) => {
          if (items.length === 0) return;

          const grid = createGridLayout({
            items,
            getId: (item) => item.id,
            breakpoints: [{ minWidth: 0, columns: 3 }],
            selectionMode,
          });

          // Select multiple items
          const itemsToSelect: string[] = [];
          for (const index of selectionIndices) {
            const itemIndex = index % items.length;
            const itemId = items[itemIndex].id;
            itemsToSelect.push(itemId);
            grid.actions.selectItem(itemId);
          }

          const state = grid.getState();

          if (selectionMode === 'single') {
            // In single mode, only the last selected item should be selected
            expect(state.selectedItems.length).toBe(1);
            expect(state.selectedItems[0]).toBe(itemsToSelect[itemsToSelect.length - 1]);
          } else {
            // In multi mode, all unique selected items should be selected
            const uniqueSelections = [...new Set(itemsToSelect)];
            expect(state.selectedItems.length).toBe(uniqueSelections.length);
            for (const itemId of uniqueSelections) {
              expect(state.selectedItems).toContain(itemId);
            }
          }

          grid.destroy();
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Additional property: Viewport width changes should update columns correctly
   */
  it('Property: Viewport width changes update columns', () => {
    fc.assert(
      fc.property(
        itemsArrayArbitrary,
        breakpointsArrayArbitrary,
        fc.nat({ max: 2000 }),
        fc.nat({ max: 2000 }),
        (items, breakpoints, initialWidth, newWidth) => {
          const grid = createGridLayout({
            items,
            getId: (item) => item.id,
            breakpoints,
            initialViewportWidth: initialWidth,
          });

          // Update viewport width
          grid.actions.updateViewportWidth(newWidth);

          const state = grid.getState();

          // Find the expected breakpoint for new width
          let expectedBreakpoint = breakpoints[0];
          for (const bp of breakpoints) {
            if (newWidth >= bp.minWidth) {
              expectedBreakpoint = bp;
            } else {
              break;
            }
          }

          // Verify columns match the new breakpoint
          expect(state.columns).toBe(expectedBreakpoint.columns);
          expect(state.viewportWidth).toBe(newWidth);

          grid.destroy();
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Additional property: Navigation without wrapping should stay at boundaries
   */
  it('Property: Navigation without wrapping stays at boundaries', () => {
    fc.assert(
      fc.property(itemsArrayArbitrary, fc.integer({ min: 1, max: 4 }), (items, columns) => {
        if (items.length === 0) return;

        const grid = createGridLayout({
          items,
          getId: (item) => item.id,
          breakpoints: [{ minWidth: 0, columns }],
          wrap: false,
        });

        // Test left navigation at first item
        grid.actions.setFocusedIndex(0);
        grid.actions.navigateLeft();
        expect(grid.getState().focusedIndex).toBe(0);

        // Test right navigation at last item
        grid.actions.setFocusedIndex(items.length - 1);
        grid.actions.navigateRight();
        expect(grid.getState().focusedIndex).toBe(items.length - 1);

        grid.destroy();
      }),
      { numRuns: 100 },
    );
  });

  /**
   * Additional property: Focus index should always be within valid range
   */
  it('Property: Focus index always within valid range', () => {
    fc.assert(
      fc.property(
        itemsArrayArbitrary,
        fc.integer({ min: 1, max: 4 }),
        fc.array(fc.constantFrom('up', 'down', 'left', 'right'), { minLength: 1, maxLength: 10 }),
        (items, columns, navigationSequence) => {
          if (items.length === 0) return;

          const grid = createGridLayout({
            items,
            getId: (item) => item.id,
            breakpoints: [{ minWidth: 0, columns }],
            wrap: true,
          });

          // Perform random navigation sequence
          for (const direction of navigationSequence) {
            switch (direction) {
              case 'up':
                grid.actions.navigateUp();
                break;
              case 'down':
                grid.actions.navigateDown();
                break;
              case 'left':
                grid.actions.navigateLeft();
                break;
              case 'right':
                grid.actions.navigateRight();
                break;
            }

            const state = grid.getState();

            // Focus index should always be within valid range
            expect(state.focusedIndex).toBeGreaterThanOrEqual(0);
            expect(state.focusedIndex).toBeLessThan(items.length);
          }

          grid.destroy();
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Additional property: Up then down navigation should return to original position (when possible)
   */
  it('Property: Up then down navigation round trip', () => {
    fc.assert(
      fc.property(itemsArrayArbitrary, fc.integer({ min: 2, max: 4 }), (items, columns) => {
        // Need at least 2 full rows for this test
        if (items.length < columns * 2) return;

        const grid = createGridLayout({
          items,
          getId: (item) => item.id,
          breakpoints: [{ minWidth: 0, columns }],
          wrap: false,
        });

        // Start at an item in the second row
        const initialIndex = columns;
        grid.actions.setFocusedIndex(initialIndex);

        // Navigate up then down
        grid.actions.navigateUp();
        grid.actions.navigateDown();

        const state = grid.getState();

        // Should return to original position
        expect(state.focusedIndex).toBe(initialIndex);

        grid.destroy();
      }),
      { numRuns: 100 },
    );
  });

  /**
   * Additional property: Left then right navigation should return to original position
   */
  it('Property: Left then right navigation round trip', () => {
    fc.assert(
      fc.property(itemsArrayArbitrary, fc.integer({ min: 1, max: 4 }), fc.nat(), (items, columns, indexSeed) => {
        // Need at least 3 items to have a middle item
        if (items.length < 3) return;

        const grid = createGridLayout({
          items,
          getId: (item) => item.id,
          breakpoints: [{ minWidth: 0, columns }],
          wrap: false,
        });

        // Start at a middle item (not first or last)
        const initialIndex = 1 + (indexSeed % (items.length - 2));
        grid.actions.setFocusedIndex(initialIndex);

        // Navigate left then right
        grid.actions.navigateLeft();
        grid.actions.navigateRight();

        const state = grid.getState();

        // Should return to original position
        expect(state.focusedIndex).toBe(initialIndex);

        grid.destroy();
      }),
      { numRuns: 100 },
    );
  });
});
