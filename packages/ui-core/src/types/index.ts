/**
 * Type definitions for UI Core
 * 
 * This module exports all TypeScript type definitions for UI Core behaviors.
 * These types provide full type safety and excellent IDE autocomplete support.
 * 
 * @packageDocumentation
 */

// ============================================================================
// Common Behavior Interface
// ============================================================================

/**
 * Base interface for all UI Core behaviors.
 * 
 * All behaviors follow this consistent interface pattern, providing:
 * - State access via `getState()`
 * - Reactive updates via `subscribe()`
 * - Actions for state manipulation
 * - Cleanup via `destroy()`
 * 
 * @template TState The state type for this behavior
 * @template TActions The actions type for this behavior
 */
export interface Behavior<TState, TActions> {
  /**
   * Gets the current state of the behavior.
   * @returns The current state snapshot
   */
  getState: () => TState;

  /**
   * Subscribes to state changes.
   * The listener will be called immediately with the current state,
   * and then again whenever the state changes.
   * 
   * @param listener Function called when state changes
   * @returns Unsubscribe function to stop listening to changes
   * 
   * @example
   * ```typescript
   * const unsubscribe = behavior.subscribe((state) => {
   *   console.log('State changed:', state);
   * });
   * 
   * // Later, stop listening
   * unsubscribe();
   * ```
   */
  subscribe: (listener: (state: TState) => void) => () => void;

  /**
   * Actions for controlling the behavior.
   * Each behavior defines its own set of actions.
   */
  actions: TActions;

  /**
   * Destroys the behavior and cleans up all subscriptions.
   * Always call this method when you're done with a behavior to prevent memory leaks.
   * 
   * @example
   * ```typescript
   * // In React useEffect cleanup
   * useEffect(() => {
   *   const behavior = createBehavior();
   *   return () => behavior.destroy();
   * }, []);
   * ```
   */
  destroy: () => void;
}

// ============================================================================
// Dialog Behavior Types
// ============================================================================

export {
  type DialogState,
  type DialogActions,
  type DialogBehaviorOptions,
  type DialogBehavior,
} from '../behaviors/dialog';

// ============================================================================
// Roving Focus Behavior Types
// ============================================================================

export {
  type RovingFocusState,
  type RovingFocusActions,
  type RovingFocusOptions,
  type RovingFocusBehavior,
} from '../behaviors/roving-focus';

// ============================================================================
// List Selection Behavior Types
// ============================================================================

export {
  type SelectionMode,
  type ListSelectionState,
  type ListSelectionActions,
  type ListSelectionOptions,
  type ListSelectionBehavior,
} from '../behaviors/list-selection';

// ============================================================================
// Disclosure Behavior Types
// ============================================================================

export {
  type DisclosureState,
  type DisclosureActions,
  type DisclosureBehaviorOptions,
  type DisclosureBehavior,
} from '../behaviors/disclosure';

// ============================================================================
// Form Behavior Types
// ============================================================================

export {
  type ValidationFunction,
  type FieldConfig,
  type FormState,
  type FormActions,
  type FormBehaviorOptions,
  type FormBehavior,
} from '../behaviors/form';

// ============================================================================
// Keyboard Shortcuts Behavior Types
// ============================================================================

export {
  type KeyboardShortcut,
  type KeyboardShortcutsState,
  type KeyboardShortcutsActions,
  type KeyboardShortcutsOptions,
  type KeyboardShortcutsBehavior,
} from '../behaviors/keyboard-shortcuts';
