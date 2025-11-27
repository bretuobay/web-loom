import { describe, it, expect, vi } from 'vitest';
import fc from 'fast-check';
import { createHubAndSpoke, type Spoke } from '../hub-and-spoke';

/**
 * Property-Based Tests for Hub & Spoke Navigation Pattern
 * 
 * These tests validate the correctness properties defined in the design document
 * using property-based testing with fast-check.
 */

describe('Hub & Spoke Navigation - Property-Based Tests', () => {
  /**
   * Arbitrary generator for valid spoke IDs
   */
  const spokeIdArbitrary = fc.string({ minLength: 1, maxLength: 20 }).filter(id => id.trim().length > 0);

  /**
   * Arbitrary generator for Spoke objects
   */
  const spokeArbitrary: fc.Arbitrary<Spoke> = fc.record({
    id: spokeIdArbitrary,
    label: fc.string({ minLength: 1, maxLength: 50 }),
    icon: fc.option(fc.string({ minLength: 1, maxLength: 20 }), { nil: undefined }),
  });

  /**
   * Arbitrary generator for arrays of unique spokes
   */
  const spokesArrayArbitrary = fc
    .array(spokeArbitrary, { minLength: 1, maxLength: 10 })
    .map(spokes => {
      // Ensure unique IDs
      const uniqueSpokes: Spoke[] = [];
      const seenIds = new Set<string>();
      for (const spoke of spokes) {
        if (!seenIds.has(spoke.id)) {
          uniqueSpokes.push(spoke);
          seenIds.add(spoke.id);
        }
      }
      return uniqueSpokes.length > 0 ? uniqueSpokes : [{ id: 'default', label: 'Default' }];
    });

  /**
   * Feature: ui-core-gaps, Property 16: Spoke activation state transition
   * Validates: Requirements 4.4
   * 
   * For any spoke, when activateSpoke is called, isOnHub should be false,
   * activeSpoke should be set, and the spoke should be added to breadcrumbs.
   */
  it('Property 16: Spoke activation state transition', () => {
    fc.assert(
      fc.property(spokesArrayArbitrary, (spokes) => {
        const navigation = createHubAndSpoke({ spokes });
        
        // Pick a random spoke to activate
        const spokeToActivate = spokes[0];
        
        // Activate the spoke
        navigation.actions.activateSpoke(spokeToActivate.id);
        
        const state = navigation.getState();
        
        // Verify state transition
        expect(state.isOnHub).toBe(false);
        expect(state.activeSpoke).toBe(spokeToActivate.id);
        expect(state.breadcrumbs).toContain(spokeToActivate.id);
        expect(state.breadcrumbs[state.breadcrumbs.length - 1]).toBe(spokeToActivate.id);
        
        navigation.destroy();
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: ui-core-gaps, Property 17: Hub return state transition
   * Validates: Requirements 4.5
   * 
   * For any active spoke, when returnToHub is called, isOnHub should be true,
   * activeSpoke should be null, and breadcrumbs should be reset.
   */
  it('Property 17: Hub return state transition', () => {
    fc.assert(
      fc.property(spokesArrayArbitrary, (spokes) => {
        const navigation = createHubAndSpoke({ spokes });
        
        // Activate a spoke first
        const spokeToActivate = spokes[0];
        navigation.actions.activateSpoke(spokeToActivate.id);
        
        // Verify we're on a spoke
        expect(navigation.getState().isOnHub).toBe(false);
        
        // Return to hub
        navigation.actions.returnToHub();
        
        const state = navigation.getState();
        
        // Verify state transition
        expect(state.isOnHub).toBe(true);
        expect(state.activeSpoke).toBe(null);
        expect(state.breadcrumbs).toEqual([]);
        
        navigation.destroy();
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: ui-core-gaps, Property 18: Navigation history consistency
   * Validates: Requirements 4.9
   * 
   * For any sequence of spoke activations, the navigation history should
   * accurately reflect the order of navigation.
   */
  it('Property 18: Navigation history consistency', () => {
    fc.assert(
      fc.property(
        spokesArrayArbitrary,
        fc.array(fc.nat(), { minLength: 1, maxLength: 5 }),
        (spokes, indices) => {
          const navigation = createHubAndSpoke({ spokes });
          
          // Generate a sequence of spoke activations
          const activationSequence: string[] = [];
          for (const index of indices) {
            const spokeIndex = index % spokes.length;
            const spokeId = spokes[spokeIndex].id;
            activationSequence.push(spokeId);
            navigation.actions.activateSpoke(spokeId);
          }
          
          const state = navigation.getState();
          
          // Verify navigation history matches activation sequence
          expect(state.navigationHistory).toEqual(activationSequence);
          
          // Verify the last activated spoke is the active one
          if (activationSequence.length > 0) {
            const lastActivated = activationSequence[activationSequence.length - 1];
            expect(state.activeSpoke).toBe(lastActivated);
          }
          
          navigation.destroy();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: ui-core-gaps, Property 19: Event emission on navigation
   * Validates: Requirements 4.6
   * 
   * For any spoke activation or hub return, the corresponding event
   * (spoke:activated or hub:returned) should be emitted.
   */
  it('Property 19: Event emission on navigation', () => {
    fc.assert(
      fc.property(spokesArrayArbitrary, (spokes) => {
        const navigation = createHubAndSpoke({ spokes });
        
        // Set up event listeners
        const spokeActivatedListener = vi.fn();
        const hubReturnedListener = vi.fn();
        
        navigation.eventBus.on('spoke:activated', spokeActivatedListener);
        navigation.eventBus.on('hub:returned', hubReturnedListener);
        
        // Activate a spoke
        const spokeToActivate = spokes[0];
        navigation.actions.activateSpoke(spokeToActivate.id);
        
        // Verify spoke:activated event was emitted
        expect(spokeActivatedListener).toHaveBeenCalledWith(spokeToActivate.id);
        expect(spokeActivatedListener).toHaveBeenCalledTimes(1);
        
        // Return to hub
        navigation.actions.returnToHub();
        
        // Verify hub:returned event was emitted
        expect(hubReturnedListener).toHaveBeenCalledTimes(1);
        
        navigation.destroy();
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Additional property: Multiple spoke activations should accumulate in breadcrumbs
   */
  it('Property: Breadcrumb accumulation on multiple activations', () => {
    fc.assert(
      fc.property(
        spokesArrayArbitrary,
        fc.array(fc.nat(), { minLength: 2, maxLength: 5 }),
        (spokes, indices) => {
          const navigation = createHubAndSpoke({ spokes });
          
          const expectedBreadcrumbs: string[] = [];
          
          for (const index of indices) {
            const spokeIndex = index % spokes.length;
            const spokeId = spokes[spokeIndex].id;
            expectedBreadcrumbs.push(spokeId);
            navigation.actions.activateSpoke(spokeId);
          }
          
          const state = navigation.getState();
          
          // Verify breadcrumbs match the sequence
          expect(state.breadcrumbs).toEqual(expectedBreadcrumbs);
          
          navigation.destroy();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional property: Navigation history should include hub returns
   */
  it('Property: Navigation history includes hub returns', () => {
    fc.assert(
      fc.property(spokesArrayArbitrary, (spokes) => {
        const navigation = createHubAndSpoke({ spokes });
        
        // Activate spoke, return to hub, activate another spoke
        const firstSpoke = spokes[0];
        navigation.actions.activateSpoke(firstSpoke.id);
        navigation.actions.returnToHub();
        
        const state = navigation.getState();
        
        // Verify history includes both spoke and hub
        expect(state.navigationHistory).toContain(firstSpoke.id);
        expect(state.navigationHistory).toContain('hub');
        expect(state.navigationHistory).toEqual([firstSpoke.id, 'hub']);
        
        navigation.destroy();
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Additional property: goBack should correctly navigate through history
   */
  it('Property: goBack navigates through history correctly', () => {
    fc.assert(
      fc.property(
        spokesArrayArbitrary,
        fc.array(fc.nat(), { minLength: 2, maxLength: 4 }),
        (spokes, indices) => {
          if (spokes.length < 2) return; // Need at least 2 spokes
          
          const navigation = createHubAndSpoke({ spokes });
          
          // Activate multiple spokes
          const activationSequence: string[] = [];
          for (const index of indices) {
            const spokeIndex = index % spokes.length;
            const spokeId = spokes[spokeIndex].id;
            activationSequence.push(spokeId);
            navigation.actions.activateSpoke(spokeId);
          }
          
          // Go back once
          navigation.actions.goBack();
          
          const state = navigation.getState();
          
          // Should be on the second-to-last spoke
          if (activationSequence.length >= 2) {
            const expectedSpoke = activationSequence[activationSequence.length - 2];
            expect(state.activeSpoke).toBe(expectedSpoke);
            expect(state.isOnHub).toBe(false);
          }
          
          navigation.destroy();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional property: Activating non-existent spoke should not change state
   */
  it('Property: Activating non-existent spoke does not change state', () => {
    fc.assert(
      fc.property(spokesArrayArbitrary, spokeIdArbitrary, (spokes, nonExistentId) => {
        // Ensure the ID doesn't exist in spokes
        if (spokes.some(s => s.id === nonExistentId)) return;
        
        const navigation = createHubAndSpoke({ spokes });
        
        const stateBefore = navigation.getState();
        
        // Try to activate non-existent spoke
        navigation.actions.activateSpoke(nonExistentId);
        
        const stateAfter = navigation.getState();
        
        // State should remain unchanged
        expect(stateAfter.isOnHub).toBe(stateBefore.isOnHub);
        expect(stateAfter.activeSpoke).toBe(stateBefore.activeSpoke);
        expect(stateAfter.breadcrumbs).toEqual(stateBefore.breadcrumbs);
        expect(stateAfter.navigationHistory).toEqual(stateBefore.navigationHistory);
        
        navigation.destroy();
      }),
      { numRuns: 100 }
    );
  });
});
