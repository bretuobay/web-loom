import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { createSidebarShell } from '../sidebar-shell';

/**
 * Property-Based Tests for Sidebar Shell Pattern
 *
 * These tests use fast-check to verify correctness properties across
 * a wide range of randomly generated inputs.
 */

describe('Sidebar Shell Property-Based Tests', () => {
  /**
   * Feature: ui-core-gaps, Property 34: Mobile auto-collapse
   * Validates: Requirements 10.3
   *
   * For any sidebar in mobile mode with expanded state, when a section is selected,
   * the sidebar should automatically collapse.
   */
  it('Property 34: Mobile auto-collapse', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }), // section name
        fc.boolean(), // initial pinned state
        fc.integer({ min: 100, max: 500 }), // initial width
        (sectionName, initialPinned, initialWidth) => {
          // Create sidebar in mobile mode and expanded state
          const sidebar = createSidebarShell({
            initialMobile: true,
            initialExpanded: true,
            initialPinned,
            initialWidth,
          });

          // Get initial state
          const initialState = sidebar.getState();
          expect(initialState.isMobile).toBe(true);
          expect(initialState.isExpanded).toBe(true);

          // Select a section
          sidebar.actions.setActiveSection(sectionName);

          // Get final state
          const finalState = sidebar.getState();

          // Property: Sidebar should be collapsed after section selection in mobile mode
          expect(finalState.isExpanded).toBe(false);
          expect(finalState.activeSection).toBe(sectionName);
          expect(finalState.isMobile).toBe(true);

          // Other state should remain unchanged
          expect(finalState.isPinned).toBe(initialPinned);
          expect(finalState.width).toBe(initialWidth);

          sidebar.destroy();
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Additional property: Mobile mode should not affect desktop behavior
   *
   * For any sidebar NOT in mobile mode, selecting a section should NOT auto-collapse
   * the sidebar, regardless of its expanded state.
   */
  it('Property: Desktop mode does not auto-collapse', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }), // section name
        fc.boolean(), // initial expanded state
        fc.boolean(), // initial pinned state
        fc.integer({ min: 100, max: 500 }), // initial width
        (sectionName, initialExpanded, initialPinned, initialWidth) => {
          // Create sidebar in desktop mode (mobile = false)
          const sidebar = createSidebarShell({
            initialMobile: false,
            initialExpanded,
            initialPinned,
            initialWidth,
          });

          // Get initial state
          const initialState = sidebar.getState();
          expect(initialState.isMobile).toBe(false);

          // Select a section
          sidebar.actions.setActiveSection(sectionName);

          // Get final state
          const finalState = sidebar.getState();

          // Property: Expanded state should remain unchanged in desktop mode
          expect(finalState.isExpanded).toBe(initialExpanded);
          expect(finalState.activeSection).toBe(sectionName);
          expect(finalState.isMobile).toBe(false);

          // Other state should remain unchanged
          expect(finalState.isPinned).toBe(initialPinned);
          expect(finalState.width).toBe(initialWidth);

          sidebar.destroy();
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Additional property: Mobile mode toggle preserves other state
   *
   * For any sidebar state, toggling mobile mode should only change the isMobile
   * property and not affect other state properties.
   */
  it('Property: Mobile toggle preserves other state', () => {
    fc.assert(
      fc.property(
        fc.boolean(), // initial expanded state
        fc.string({ minLength: 0, maxLength: 50 }).map((s) => s || null), // initial active section
        fc.boolean(), // initial pinned state
        fc.integer({ min: 100, max: 500 }), // initial width
        fc.boolean(), // initial mobile state
        (initialExpanded, initialActiveSection, initialPinned, initialWidth, initialMobile) => {
          // Create sidebar with initial state
          const sidebar = createSidebarShell({
            initialExpanded,
            initialActiveSection,
            initialPinned,
            initialWidth,
            initialMobile,
          });

          // Get initial state
          const initialState = sidebar.getState();

          // Toggle mobile mode
          sidebar.actions.toggleMobile();

          // Get final state
          const finalState = sidebar.getState();

          // Property: Only isMobile should change, all other state should be preserved
          expect(finalState.isMobile).toBe(!initialMobile);
          expect(finalState.isExpanded).toBe(initialState.isExpanded);
          expect(finalState.activeSection).toBe(initialState.activeSection);
          expect(finalState.isPinned).toBe(initialState.isPinned);
          expect(finalState.width).toBe(initialState.width);

          sidebar.destroy();
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Additional property: setMobileMode is idempotent
   *
   * For any sidebar state, calling setMobileMode with the same value multiple times
   * should result in the same final state.
   */
  it('Property: setMobileMode is idempotent', () => {
    fc.assert(
      fc.property(
        fc.boolean(), // target mobile mode
        fc.boolean(), // initial expanded state
        fc.boolean(), // initial pinned state
        (targetMobile, initialExpanded, initialPinned) => {
          // Create sidebar
          const sidebar = createSidebarShell({
            initialExpanded,
            initialPinned,
          });

          // Set mobile mode once
          sidebar.actions.setMobileMode(targetMobile);
          const stateAfterFirst = sidebar.getState();

          // Set mobile mode again with same value
          sidebar.actions.setMobileMode(targetMobile);
          const stateAfterSecond = sidebar.getState();

          // Property: State should be identical after both calls
          expect(stateAfterSecond).toEqual(stateAfterFirst);

          sidebar.destroy();
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Additional property: Auto-collapse only happens when expanded
   *
   * For any sidebar in mobile mode that is already collapsed, selecting a section
   * should NOT trigger any collapse action (no-op for collapse).
   */
  it('Property: Auto-collapse only when expanded', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }), // section name
        (sectionName) => {
          // Create sidebar in mobile mode but collapsed
          const sidebar = createSidebarShell({
            initialMobile: true,
            initialExpanded: false,
          });

          // Get initial state
          const initialState = sidebar.getState();
          expect(initialState.isMobile).toBe(true);
          expect(initialState.isExpanded).toBe(false);

          // Select a section
          sidebar.actions.setActiveSection(sectionName);

          // Get final state
          const finalState = sidebar.getState();

          // Property: Sidebar should remain collapsed (no change to expanded state)
          expect(finalState.isExpanded).toBe(false);
          expect(finalState.activeSection).toBe(sectionName);

          sidebar.destroy();
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Additional property: Multiple section changes in mobile mode
   *
   * For any sequence of section selections in mobile mode with the sidebar expanded,
   * each selection should result in the sidebar being collapsed.
   */
  it('Property: Multiple section changes auto-collapse', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 1, maxLength: 10 }), // array of section names
        (sectionNames) => {
          // Create sidebar in mobile mode
          const sidebar = createSidebarShell({
            initialMobile: true,
          });

          // For each section name
          for (const sectionName of sectionNames) {
            // Expand the sidebar
            sidebar.actions.expand();
            expect(sidebar.getState().isExpanded).toBe(true);

            // Select the section
            sidebar.actions.setActiveSection(sectionName);

            // Property: Sidebar should be collapsed after each section selection
            const state = sidebar.getState();
            expect(state.isExpanded).toBe(false);
            expect(state.activeSection).toBe(sectionName);
          }

          sidebar.destroy();
        },
      ),
      { numRuns: 100 },
    );
  });
});
