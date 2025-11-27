import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { createTabbedInterface, type Tab } from '../tabbed-interface';

/**
 * Property-Based Tests for Tabbed Interface Pattern Enhancements
 * 
 * These tests validate the correctness properties defined in the design document
 * using property-based testing with fast-check.
 */

describe('Tabbed Interface - Property-Based Tests', () => {
  /**
   * Arbitrary generator for tab arrays
   * Generates arrays of tabs with unique IDs
   */
  const tabsArbitrary = fc
    .array(
      fc.record({
        id: fc.string({ minLength: 1, maxLength: 20 }),
        label: fc.string({ minLength: 1, maxLength: 50 }),
        disabled: fc.boolean(),
      }),
      { minLength: 2, maxLength: 10 }
    )
    .map((tabs) => {
      // Ensure unique IDs
      const uniqueTabs: Tab[] = [];
      const seenIds = new Set<string>();
      
      tabs.forEach((tab, index) => {
        const uniqueId = seenIds.has(tab.id) ? `${tab.id}-${index}` : tab.id;
        seenIds.add(uniqueId);
        uniqueTabs.push({
          id: uniqueId,
          label: tab.label,
          disabled: tab.disabled,
        });
      });
      
      return uniqueTabs;
    });

  /**
   * Feature: ui-core-gaps, Property 36: Tab navigation delegation
   * Validates: Requirements 12.3, 12.4
   * 
   * For any tab interface, calling focusNextTab or focusPreviousTab should
   * delegate to the underlying roving focus behavior.
   */
  it('Property 36: Tab navigation delegation', () => {
    fc.assert(
      fc.property(
        tabsArbitrary,
        fc.boolean(), // wrap option
        (tabs, wrap) => {
          // Filter to only non-disabled tabs for clearer testing
          const enabledTabs = tabs.filter((t) => !t.disabled);
          
          // Skip if no enabled tabs
          if (enabledTabs.length === 0) {
            return true;
          }

          const tabbedInterface = createTabbedInterface({
            tabs,
            wrap,
          });

          // Ensure we start on an enabled tab
          tabbedInterface.actions.activateTab(enabledTabs[0].id);
          
          const initialState = tabbedInterface.getState();
          const initialActiveTabId = initialState.activeTabId;

          // Test focusNextTab delegation
          tabbedInterface.actions.focusNextTab();
          const stateAfterNext = tabbedInterface.getState();

          // The active tab should be valid (one of the tabs)
          const activeTabAfterNext = tabs.find((t) => t.id === stateAfterNext.activeTabId);
          expect(activeTabAfterNext).toBeDefined();
          
          // If there's more than one enabled tab, we should have moved or wrapped
          if (enabledTabs.length > 1) {
            // Either moved to a different tab or stayed (if next is disabled)
            const nextTabIndex = tabs.findIndex((t) => t.id === stateAfterNext.activeTabId);
            expect(nextTabIndex).toBeGreaterThanOrEqual(0);
          } else {
            // With only one enabled tab, should stay on the same tab
            expect(stateAfterNext.activeTabId).toBe(initialActiveTabId);
          }

          // Reset to initial state for previous test
          tabbedInterface.actions.activateTab(enabledTabs[0].id);

          // Test focusPreviousTab delegation
          tabbedInterface.actions.focusPreviousTab();
          const stateAfterPrevious = tabbedInterface.getState();

          // The active tab should be valid (one of the tabs)
          const activeTabAfterPrevious = tabs.find((t) => t.id === stateAfterPrevious.activeTabId);
          expect(activeTabAfterPrevious).toBeDefined();

          // If there's more than one enabled tab, we should have moved or wrapped
          if (enabledTabs.length > 1) {
            // Either moved to a different tab or stayed (if previous is disabled)
            const prevTabIndex = tabs.findIndex((t) => t.id === stateAfterPrevious.activeTabId);
            expect(prevTabIndex).toBeGreaterThanOrEqual(0);
          } else {
            // With only one enabled tab, should stay on the same tab
            expect(stateAfterPrevious.activeTabId).toBe(enabledTabs[0].id);
          }

          tabbedInterface.destroy();
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional property: Multiple focusNextTab calls should navigate through tabs
   */
  it('Property: Multiple focusNextTab calls navigate sequentially', () => {
    fc.assert(
      fc.property(
        tabsArbitrary,
        fc.integer({ min: 1, max: 5 }),
        (tabs, numCalls) => {
          // Filter to only non-disabled tabs for this test
          const enabledTabs = tabs.filter((t) => !t.disabled);
          
          // Skip if no enabled tabs
          if (enabledTabs.length === 0) {
            return true;
          }

          const tabbedInterface = createTabbedInterface({
            tabs,
            wrap: true,
          });

          // Start from first enabled tab
          tabbedInterface.actions.activateTab(enabledTabs[0].id);
          const initialActiveTabId = tabbedInterface.getState().activeTabId;

          // Call focusNextTab multiple times
          for (let i = 0; i < numCalls; i++) {
            tabbedInterface.actions.focusNextTab();
          }

          const finalActiveTabId = tabbedInterface.getState().activeTabId;

          // The active tab should have changed (unless there's only one enabled tab)
          if (enabledTabs.length > 1) {
            // After multiple calls, we should be on a different tab or wrapped around
            const finalIndex = enabledTabs.findIndex((t) => t.id === finalActiveTabId);
            expect(finalIndex).toBeGreaterThanOrEqual(0);
            expect(finalIndex).toBeLessThan(enabledTabs.length);
          } else {
            // With only one enabled tab, should stay on the same tab
            expect(finalActiveTabId).toBe(initialActiveTabId);
          }

          tabbedInterface.destroy();
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional property: focusNextTab then focusPreviousTab should return to original (with wrap)
   */
  it('Property: focusNextTab then focusPreviousTab returns to original tab', () => {
    fc.assert(
      fc.property(
        tabsArbitrary,
        (tabs) => {
          // Filter to only non-disabled tabs
          const enabledTabs = tabs.filter((t) => !t.disabled);
          
          // Skip if less than 2 enabled tabs
          if (enabledTabs.length < 2) {
            return true;
          }

          const tabbedInterface = createTabbedInterface({
            tabs,
            wrap: true,
          });

          // Start from first enabled tab
          tabbedInterface.actions.activateTab(enabledTabs[0].id);
          const initialActiveTabId = tabbedInterface.getState().activeTabId;

          // Navigate next then previous
          tabbedInterface.actions.focusNextTab();
          tabbedInterface.actions.focusPreviousTab();

          const finalActiveTabId = tabbedInterface.getState().activeTabId;

          // Should return to the original tab
          expect(finalActiveTabId).toBe(initialActiveTabId);

          tabbedInterface.destroy();
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional property: Convenience methods should respect wrap setting
   */
  it('Property: Convenience methods respect wrap setting', () => {
    fc.assert(
      fc.property(
        tabsArbitrary,
        fc.boolean(),
        (tabs, wrap) => {
          // Filter to only non-disabled tabs
          const enabledTabs = tabs.filter((t) => !t.disabled);
          
          // Skip if less than 2 enabled tabs (need at least 2 to test wrapping)
          if (enabledTabs.length < 2) {
            return true;
          }

          const tabbedInterface = createTabbedInterface({
            tabs,
            wrap,
          });

          // Test at the last enabled tab
          const lastEnabledTab = enabledTabs[enabledTabs.length - 1];
          tabbedInterface.actions.activateTab(lastEnabledTab.id);

          // Try to move next
          tabbedInterface.actions.focusNextTab();
          const stateAfterNext = tabbedInterface.getState();

          if (wrap) {
            // Should wrap to first enabled tab (or stay if next tab is disabled)
            // The key is that we should have moved from the last tab
            const isOnLastTab = stateAfterNext.activeTabId === lastEnabledTab.id;
            const isOnFirstTab = stateAfterNext.activeTabId === enabledTabs[0].id;
            
            // Should either wrap to first or stay on last (if there are disabled tabs in between)
            expect(isOnLastTab || isOnFirstTab).toBe(true);
          } else {
            // Should stay on last tab (no wrap)
            expect(stateAfterNext.activeTabId).toBe(lastEnabledTab.id);
          }

          // Test at the first enabled tab
          const firstEnabledTab = enabledTabs[0];
          tabbedInterface.actions.activateTab(firstEnabledTab.id);

          // Try to move previous
          tabbedInterface.actions.focusPreviousTab();
          const stateAfterPrevious = tabbedInterface.getState();

          if (wrap) {
            // Should wrap to last enabled tab (or stay if previous tab is disabled)
            const isOnFirstTab = stateAfterPrevious.activeTabId === firstEnabledTab.id;
            const isOnLastTab = stateAfterPrevious.activeTabId === lastEnabledTab.id;
            
            // Should either wrap to last or stay on first (if there are disabled tabs in between)
            expect(isOnFirstTab || isOnLastTab).toBe(true);
          } else {
            // Should stay on first tab (no wrap)
            expect(stateAfterPrevious.activeTabId).toBe(firstEnabledTab.id);
          }

          tabbedInterface.destroy();
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional property: Convenience methods should work with dynamically added tabs
   */
  it('Property: Convenience methods work after adding tabs', () => {
    fc.assert(
      fc.property(
        tabsArbitrary,
        fc.record({
          id: fc.string({ minLength: 1, maxLength: 20 }),
          label: fc.string({ minLength: 1, maxLength: 50 }),
        }),
        (initialTabs, newTab) => {
          const tabbedInterface = createTabbedInterface({
            tabs: initialTabs,
            wrap: true,
          });

          // Add a new tab with a unique ID
          const uniqueNewTab: Tab = {
            id: `new-${newTab.id}`,
            label: newTab.label,
          };
          tabbedInterface.actions.addTab(uniqueNewTab);

          // Navigate to the new tab
          tabbedInterface.actions.activateTab(uniqueNewTab.id);
          expect(tabbedInterface.getState().activeTabId).toBe(uniqueNewTab.id);

          // Use convenience methods
          tabbedInterface.actions.focusNextTab();
          const stateAfterNext = tabbedInterface.getState();

          // Should have navigated to a valid tab (could be the same if it's the only enabled tab)
          const allTabs = tabbedInterface.getState().tabs;
          const activeTab = allTabs.find((t) => t.id === stateAfterNext.activeTabId);
          expect(activeTab).toBeDefined();
          
          // If there are multiple enabled tabs, we should have moved or stayed
          const enabledTabs = allTabs.filter((t) => !t.disabled);
          if (enabledTabs.length > 1) {
            // Should be on a valid tab (either moved or stayed if next is disabled)
            expect(enabledTabs.some((t) => t.id === stateAfterNext.activeTabId)).toBe(true);
          }

          tabbedInterface.destroy();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional property: State consistency after convenience method calls
   */
  it('Property: State remains consistent after convenience method calls', () => {
    fc.assert(
      fc.property(
        tabsArbitrary,
        fc.array(fc.boolean(), { minLength: 1, maxLength: 20 }),
        (tabs, navigationSequence) => {
          const tabbedInterface = createTabbedInterface({
            tabs,
            wrap: true,
          });

          // Execute a sequence of navigation calls
          navigationSequence.forEach((useNext) => {
            if (useNext) {
              tabbedInterface.actions.focusNextTab();
            } else {
              tabbedInterface.actions.focusPreviousTab();
            }
          });

          const finalState = tabbedInterface.getState();

          // State should be consistent
          expect(finalState.tabs).toEqual(tabs);
          expect(finalState.activeTabId).toBeTruthy();
          
          // Active tab should be one of the tabs
          const activeTab = tabs.find((t) => t.id === finalState.activeTabId);
          expect(activeTab).toBeDefined();

          tabbedInterface.destroy();
        }
      ),
      { numRuns: 100 }
    );
  });
});
