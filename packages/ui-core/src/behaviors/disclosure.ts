import { createStore, type Store } from '@web-loom/store-core';

/**
 * Represents the state of a disclosure behavior.
 */
export interface DisclosureState {
  /**
   * Whether the disclosure is currently expanded.
   */
  isExpanded: boolean;

  /**
   * Optional unique identifier for the disclosure.
   */
  id: string | null;
}

/**
 * Actions available for controlling the disclosure behavior.
 */
export interface DisclosureActions {
  /**
   * Expands the disclosure.
   */
  expand: () => void;

  /**
   * Collapses the disclosure.
   */
  collapse: () => void;

  /**
   * Toggles the disclosure expanded/collapsed state.
   */
  toggle: () => void;
}

/**
 * Options for configuring the disclosure behavior.
 */
export interface DisclosureBehaviorOptions {
  /**
   * Optional unique identifier for the disclosure.
   */
  id?: string;

  /**
   * Initial expanded state.
   * @default false
   */
  initialExpanded?: boolean;

  /**
   * Optional callback invoked when the disclosure expands.
   */
  onExpand?: () => void;

  /**
   * Optional callback invoked when the disclosure collapses.
   */
  onCollapse?: () => void;
}

/**
 * The disclosure behavior interface returned by createDisclosureBehavior.
 */
export interface DisclosureBehavior {
  /**
   * Gets the current state of the disclosure.
   */
  getState: () => DisclosureState;

  /**
   * Subscribes to state changes.
   * @param listener Function called when state changes.
   * @returns Unsubscribe function.
   */
  subscribe: (listener: (state: DisclosureState) => void) => () => void;

  /**
   * Actions for controlling the disclosure.
   */
  actions: DisclosureActions;

  /**
   * Destroys the behavior and cleans up subscriptions.
   */
  destroy: () => void;
}

/**
 * Creates a disclosure behavior for managing expandable/collapsible content.
 * 
 * This behavior is useful for implementing accordions, collapsible sections,
 * disclosure widgets, and other expandable UI patterns.
 * 
 * @example
 * ```typescript
 * const disclosure = createDisclosureBehavior({
 *   id: 'faq-section-1',
 *   initialExpanded: false,
 *   onExpand: () => console.log('Section expanded'),
 *   onCollapse: () => console.log('Section collapsed'),
 * });
 * 
 * // Expand the disclosure
 * disclosure.actions.expand();
 * console.log(disclosure.getState().isExpanded); // true
 * 
 * // Toggle the disclosure
 * disclosure.actions.toggle();
 * console.log(disclosure.getState().isExpanded); // false
 * 
 * // Clean up
 * disclosure.destroy();
 * ```
 * 
 * @param options Configuration options for the disclosure behavior.
 * @returns A disclosure behavior instance.
 */
export function createDisclosureBehavior(
  options?: DisclosureBehaviorOptions
): DisclosureBehavior {
  const initialState: DisclosureState = {
    isExpanded: options?.initialExpanded ?? false,
    id: options?.id || null,
  };

  const store: Store<DisclosureState, DisclosureActions> = createStore<
    DisclosureState,
    DisclosureActions
  >(initialState, (set, get) => ({
    expand: () => {
      const currentState = get();
      if (!currentState.isExpanded) {
        set((state) => ({
          ...state,
          isExpanded: true,
        }));

        // Invoke onExpand callback if provided
        if (options?.onExpand) {
          options.onExpand();
        }
      }
    },

    collapse: () => {
      const currentState = get();
      if (currentState.isExpanded) {
        set((state) => ({
          ...state,
          isExpanded: false,
        }));

        // Invoke onCollapse callback if provided
        if (options?.onCollapse) {
          options.onCollapse();
        }
      }
    },

    toggle: () => {
      const currentState = get();
      if (currentState.isExpanded) {
        set((state) => ({
          ...state,
          isExpanded: false,
        }));

        // Invoke onCollapse callback if provided
        if (options?.onCollapse) {
          options.onCollapse();
        }
      } else {
        set((state) => ({
          ...state,
          isExpanded: true,
        }));

        // Invoke onExpand callback if provided
        if (options?.onExpand) {
          options.onExpand();
        }
      }
    },
  }));

  return {
    getState: store.getState,
    subscribe: store.subscribe,
    actions: store.actions,
    destroy: store.destroy,
  };
}
