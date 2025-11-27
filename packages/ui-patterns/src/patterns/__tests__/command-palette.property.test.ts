import { describe, it, expect, vi } from 'vitest';
import fc from 'fast-check';
import { createCommandPalette, type Command } from '../command-palette';

describe('Command Palette Property-Based Tests', () => {
  // Helper to generate commands with unique IDs and fresh spies
  const commandsArbitrary = (minLength: number, maxLength: number) =>
    fc
      .array(
        fc.record({
          id: fc.string({ minLength: 1 }),
          label: fc.string({ minLength: 1 }),
        }),
        { minLength, maxLength }
      )
      .map((commands) => {
        // Ensure unique IDs by appending index and create fresh spy for each command
        return commands.map((cmd, idx) => ({
          ...cmd,
          id: `${cmd.id}-${idx}`,
          action: vi.fn(), // Create a fresh spy for each command
        }));
      });

  /**
   * Feature: ui-core-gaps, Property 37: Command navigation delegation
   * Validates: Requirements 13.4, 13.5
   */
  describe('Property 37: Command navigation delegation', () => {
    it('selectNext should delegate to roving focus moveNext for any command list', () => {
      fc.assert(
        fc.property(
          commandsArbitrary(1, 20),
          fc.integer({ min: 0, max: 10 }),
          (commands, iterations) => {
            const palette = createCommandPalette({ commands });

            // Track initial index
            const initialIndex = palette.getState().selectedIndex;

            // Call selectNext multiple times
            for (let i = 0; i < iterations; i++) {
              palette.actions.selectNext();
            }

            const finalIndex = palette.getState().selectedIndex;

            // Verify that the index changed correctly (with wrapping)
            const expectedIndex = (initialIndex + iterations) % commands.length;
            expect(finalIndex).toBe(expectedIndex);

            // Verify that roving focus state matches
            const rovingState = palette.rovingFocus.getState();
            expect(rovingState.currentIndex).toBe(finalIndex);

            palette.destroy();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('selectPrevious should delegate to roving focus movePrevious for any command list', () => {
      fc.assert(
        fc.property(
          commandsArbitrary(1, 20),
          fc.integer({ min: 0, max: 10 }),
          (commands, iterations) => {
            const palette = createCommandPalette({ commands });

            // Track initial index
            const initialIndex = palette.getState().selectedIndex;

            // Call selectPrevious multiple times
            for (let i = 0; i < iterations; i++) {
              palette.actions.selectPrevious();
            }

            const finalIndex = palette.getState().selectedIndex;

            // Verify that the index changed correctly (with wrapping)
            // Moving backwards with wrapping
            let expectedIndex = initialIndex - iterations;
            while (expectedIndex < 0) {
              expectedIndex += commands.length;
            }
            expectedIndex = expectedIndex % commands.length;

            expect(finalIndex).toBe(expectedIndex);

            // Verify that roving focus state matches
            const rovingState = palette.rovingFocus.getState();
            expect(rovingState.currentIndex).toBe(finalIndex);

            palette.destroy();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('selectNext and selectPrevious should be inverse operations', () => {
      fc.assert(
        fc.property(
          commandsArbitrary(2, 20),
          fc.integer({ min: 0, max: 10 }),
          (commands, steps) => {
            const palette = createCommandPalette({ commands });

            const initialIndex = palette.getState().selectedIndex;

            // Move forward
            for (let i = 0; i < steps; i++) {
              palette.actions.selectNext();
            }

            // Move backward the same number of steps
            for (let i = 0; i < steps; i++) {
              palette.actions.selectPrevious();
            }

            const finalIndex = palette.getState().selectedIndex;

            // Should return to initial index
            expect(finalIndex).toBe(initialIndex);

            palette.destroy();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('navigation should work correctly with filtered commands', () => {
      fc.assert(
        fc.property(
          commandsArbitrary(3, 20),
          fc.string({ minLength: 1, maxLength: 5 }),
          (commands, query) => {
            const palette = createCommandPalette({ commands });

            // Set a query to filter commands
            palette.actions.setQuery(query);

            const filteredCount = palette.getState().filteredCommands.length;

            // Skip if no filtered commands
            if (filteredCount === 0) {
              palette.destroy();
              return true;
            }

            // Navigate through all filtered commands
            for (let i = 0; i < filteredCount; i++) {
              palette.actions.selectNext();
            }

            // Should wrap back to first
            const finalIndex = palette.getState().selectedIndex;
            expect(finalIndex).toBe(0);

            palette.destroy();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: ui-core-gaps, Property 38: Execute selected command
   * Validates: Requirements 13.6
   */
  describe('Property 38: Execute selected command', () => {
    it('executeSelected should execute the command at the current selected index for any command list', async () => {
      await fc.assert(
        fc.asyncProperty(
          commandsArbitrary(1, 20),
          fc.integer({ min: 0, max: 19 }),
          async (commands, targetIndex) => {
            // Ensure targetIndex is within bounds
            const actualIndex = targetIndex % commands.length;

            const palette = createCommandPalette({ commands });

            // Navigate to target index
            palette.rovingFocus.actions.moveTo(actualIndex);

            // Execute selected
            await palette.actions.executeSelected();

            // Verify the correct command was executed
            expect(commands[actualIndex].action).toHaveBeenCalledTimes(1);

            // Verify other commands were not executed
            commands.forEach((cmd, idx) => {
              if (idx !== actualIndex) {
                expect(cmd.action).not.toHaveBeenCalled();
              }
            });

            palette.destroy();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('executeSelected should close the palette after execution for any command', async () => {
      await fc.assert(
        fc.asyncProperty(
          commandsArbitrary(1, 20),
          fc.integer({ min: 0, max: 19 }),
          async (commands, targetIndex) => {
            const actualIndex = targetIndex % commands.length;

            const palette = createCommandPalette({ commands });

            // Open the palette
            palette.actions.open();
            expect(palette.getState().isOpen).toBe(true);

            // Navigate to target index
            palette.rovingFocus.actions.moveTo(actualIndex);

            // Execute selected
            await palette.actions.executeSelected();

            // Palette should be closed
            expect(palette.getState().isOpen).toBe(false);

            palette.destroy();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('executeSelected should work correctly with filtered commands', async () => {
      await fc.assert(
        fc.asyncProperty(
          commandsArbitrary(3, 20),
          fc.string({ minLength: 1, maxLength: 5 }),
          async (commands, query) => {
            const palette = createCommandPalette({ commands });

            // Set a query to filter commands
            palette.actions.setQuery(query);

            const state = palette.getState();
            const filteredCount = state.filteredCommands.length;

            // Skip if no filtered commands
            if (filteredCount === 0) {
              palette.destroy();
              return true;
            }

            // Get the first filtered command
            const firstFilteredCommand = state.filteredCommands[0];

            // Execute selected (should execute first filtered command)
            await palette.actions.executeSelected();

            // Find the original command and verify it was executed
            const originalCommand = commands.find(cmd => cmd.id === firstFilteredCommand.id);
            expect(originalCommand?.action).toHaveBeenCalledTimes(1);

            palette.destroy();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('executeSelected should handle navigation before execution', async () => {
      await fc.assert(
        fc.asyncProperty(
          commandsArbitrary(2, 20),
          fc.integer({ min: 1, max: 10 }),
          async (commands, navigationSteps) => {
            const palette = createCommandPalette({ commands });

            // Navigate using selectNext
            for (let i = 0; i < navigationSteps; i++) {
              palette.actions.selectNext();
            }

            const expectedIndex = navigationSteps % commands.length;
            const state = palette.getState();
            expect(state.selectedIndex).toBe(expectedIndex);

            // Execute selected
            await palette.actions.executeSelected();

            // Verify the correct command was executed
            expect(commands[expectedIndex].action).toHaveBeenCalledTimes(1);

            palette.destroy();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('executeSelected should invoke onCommandExecute callback for any command', async () => {
      await fc.assert(
        fc.asyncProperty(
          commandsArbitrary(1, 20),
          fc.integer({ min: 0, max: 19 }),
          async (commands, targetIndex) => {
            const actualIndex = targetIndex % commands.length;
            const onCommandExecute = vi.fn();

            const palette = createCommandPalette({ commands, onCommandExecute });

            // Navigate to target index
            palette.rovingFocus.actions.moveTo(actualIndex);

            // Execute selected
            await palette.actions.executeSelected();

            // Verify callback was invoked with correct command
            expect(onCommandExecute).toHaveBeenCalledTimes(1);
            expect(onCommandExecute).toHaveBeenCalledWith(commands[actualIndex]);

            palette.destroy();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Combined navigation and execution properties', () => {
    it('navigation and execution should maintain consistency', async () => {
      await fc.assert(
        fc.asyncProperty(
          commandsArbitrary(2, 20),
          fc.array(fc.constantFrom('next', 'previous'), { minLength: 1, maxLength: 10 }),
          async (commands, navigationSequence) => {
            const palette = createCommandPalette({ commands });

            // Perform navigation sequence
            for (const direction of navigationSequence) {
              if (direction === 'next') {
                palette.actions.selectNext();
              } else {
                palette.actions.selectPrevious();
              }
            }

            const selectedIndex = palette.getState().selectedIndex;

            // Execute selected
            await palette.actions.executeSelected();

            // Verify the command at the selected index was executed
            expect(commands[selectedIndex].action).toHaveBeenCalledTimes(1);

            palette.destroy();
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
