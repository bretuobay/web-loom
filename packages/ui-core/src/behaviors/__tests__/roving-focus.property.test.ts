import { describe, it, expect, vi } from 'vitest';
import fc from 'fast-check';
import { createRovingFocus } from '../roving-focus';

/**
 * Property-Based Tests for Roving Focus Enhancement
 * Feature: ui-core-gaps, Property 31: Focus change callback invocation
 * Validates: Requirements 8.2, 8.3
 */

describe('Roving Focus Property-Based Tests', () => {
  /**
   * Feature: ui-core-gaps, Property 31: Focus change callback invocation
   * Validates: Requirements 8.2, 8.3
   *
   * Property: For any focus change, the onFocusChange callback should be invoked
   * with the correct index, itemId, and previousIndex.
   */
  it('Property 31: Focus change callback invocation', () => {
    fc.assert(
      fc.property(
        // Generate a non-empty array of item IDs
        fc.array(fc.string({ minLength: 1 }), { minLength: 2, maxLength: 10 }).map(
          (items, idx) => items.map((item, i) => `${item}-${idx}-${i}`), // Ensure unique IDs
        ),
        // Generate an initial index
        fc.nat(),
        // Generate a target index for navigation
        fc.nat(),
        (items, initialIndexRaw, targetIndexRaw) => {
          // Clamp indices to valid range
          const initialIndex = initialIndexRaw % items.length;
          const targetIndex = targetIndexRaw % items.length;

          // Skip if indices are the same (no focus change)
          if (initialIndex === targetIndex) {
            return true;
          }

          const onFocusChange = vi.fn();
          const rovingFocus = createRovingFocus({
            items,
            initialIndex,
            onFocusChange,
          });

          // Move to target index
          rovingFocus.actions.moveTo(targetIndex);

          // Verify callback was invoked exactly once
          expect(onFocusChange).toHaveBeenCalledTimes(1);

          // Verify callback was called with correct parameters
          expect(onFocusChange).toHaveBeenCalledWith(targetIndex, items[targetIndex], initialIndex);

          // Verify state was updated correctly
          const state = rovingFocus.getState();
          expect(state.currentIndex).toBe(targetIndex);
          expect(state.previousIndex).toBe(initialIndex);

          rovingFocus.destroy();
          return true;
        },
      ),
      { numRuns: 100 },
    );
  });

  it('Property 31a: Callback invocation on moveNext', () => {
    fc.assert(
      fc.property(
        fc
          .array(fc.string({ minLength: 1 }), { minLength: 2, maxLength: 10 })
          .map((items, idx) => items.map((item, i) => `${item}-${idx}-${i}`)),
        fc.nat(),
        (items, initialIndexRaw) => {
          const initialIndex = initialIndexRaw % items.length;

          const onFocusChange = vi.fn();
          const rovingFocus = createRovingFocus({
            items,
            initialIndex,
            wrap: true,
            onFocusChange,
          });

          // Move to next
          rovingFocus.actions.moveNext();

          const expectedIndex = (initialIndex + 1) % items.length;

          // Verify callback was invoked
          expect(onFocusChange).toHaveBeenCalledTimes(1);
          expect(onFocusChange).toHaveBeenCalledWith(expectedIndex, items[expectedIndex], initialIndex);

          rovingFocus.destroy();
          return true;
        },
      ),
      { numRuns: 100 },
    );
  });

  it('Property 31b: Callback invocation on movePrevious', () => {
    fc.assert(
      fc.property(
        fc
          .array(fc.string({ minLength: 1 }), { minLength: 2, maxLength: 10 })
          .map((items, idx) => items.map((item, i) => `${item}-${idx}-${i}`)),
        fc.nat(),
        (items, initialIndexRaw) => {
          const initialIndex = initialIndexRaw % items.length;

          const onFocusChange = vi.fn();
          const rovingFocus = createRovingFocus({
            items,
            initialIndex,
            wrap: true,
            onFocusChange,
          });

          // Move to previous
          rovingFocus.actions.movePrevious();

          const expectedIndex = (initialIndex - 1 + items.length) % items.length;

          // Verify callback was invoked
          expect(onFocusChange).toHaveBeenCalledTimes(1);
          expect(onFocusChange).toHaveBeenCalledWith(expectedIndex, items[expectedIndex], initialIndex);

          rovingFocus.destroy();
          return true;
        },
      ),
      { numRuns: 100 },
    );
  });

  it('Property 31c: Callback NOT invoked when focus does not change', () => {
    fc.assert(
      fc.property(
        fc
          .array(fc.string({ minLength: 1 }), { minLength: 2, maxLength: 10 })
          .map((items, idx) => items.map((item, i) => `${item}-${idx}-${i}`)),
        (items) => {
          const onFocusChange = vi.fn();
          const rovingFocus = createRovingFocus({
            items,
            initialIndex: 0,
            wrap: false,
            onFocusChange,
          });

          // Try to move previous at the beginning (should not change focus)
          rovingFocus.actions.movePrevious();

          // Verify callback was NOT invoked
          expect(onFocusChange).not.toHaveBeenCalled();

          rovingFocus.destroy();
          return true;
        },
      ),
      { numRuns: 100 },
    );
  });

  it('Property 31d: Callback invoked with correct previousIndex after multiple moves', () => {
    fc.assert(
      fc.property(
        fc
          .array(fc.string({ minLength: 1 }), { minLength: 3, maxLength: 10 })
          .map((items, idx) => items.map((item, i) => `${item}-${idx}-${i}`)),
        (items) => {
          const onFocusChange = vi.fn();
          const rovingFocus = createRovingFocus({
            items,
            initialIndex: 0,
            onFocusChange,
          });

          // First move
          rovingFocus.actions.moveNext();
          expect(onFocusChange).toHaveBeenLastCalledWith(1, items[1], 0);

          // Second move
          rovingFocus.actions.moveNext();
          expect(onFocusChange).toHaveBeenLastCalledWith(2, items[2], 1);

          // Verify previousIndex is tracked correctly in state
          const state = rovingFocus.getState();
          expect(state.previousIndex).toBe(1);
          expect(state.currentIndex).toBe(2);

          rovingFocus.destroy();
          return true;
        },
      ),
      { numRuns: 100 },
    );
  });

  it('Property 31e: Callback invoked when setItems causes index adjustment', () => {
    fc.assert(
      fc.property(
        fc
          .array(fc.string({ minLength: 1 }), { minLength: 5, maxLength: 10 })
          .map((items, idx) => items.map((item, i) => `${item}-${idx}-${i}`)),
        fc
          .array(fc.string({ minLength: 1 }), { minLength: 1, maxLength: 3 })
          .map((items, idx) => items.map((item, i) => `new-${item}-${idx}-${i}`)),
        (initialItems, newItems) => {
          const onFocusChange = vi.fn();
          const rovingFocus = createRovingFocus({
            items: initialItems,
            initialIndex: initialItems.length - 1, // Start at last item
            onFocusChange,
          });

          // Clear any initial calls
          onFocusChange.mockClear();

          // Set shorter array, forcing index adjustment
          rovingFocus.actions.setItems(newItems);

          const expectedNewIndex = newItems.length - 1;
          const previousIndex = initialItems.length - 1;

          // If index changed, callback should be invoked
          if (expectedNewIndex !== previousIndex) {
            expect(onFocusChange).toHaveBeenCalledWith(expectedNewIndex, newItems[expectedNewIndex], previousIndex);
          }

          rovingFocus.destroy();
          return true;
        },
      ),
      { numRuns: 100 },
    );
  });
});
