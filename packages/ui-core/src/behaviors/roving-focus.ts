import { createStore, type Store } from '@web-loom/store-core';

/**
 * Represents the state of a roving focus behavior.
 */
export interface RovingFocusState {
  /**
   * The index of the currently focused item.
   */
  currentIndex: number;

  /**
   * The index of the previously focused item.
   */
  previousIndex: number;

  /**
   * Array of item identifiers in the focus order.
   */
  items: string[];

  /**
   * The orientation of the roving focus navigation.
   * - 'horizontal': Use left/right arrow keys
   * - 'vertical': Use up/down arrow keys
   */
  orientation: 'horizontal' | 'vertical';

  /**
   * Whether focus should wrap from last to first item and vice versa.
   */
  wrap: boolean;
}

/**
 * Actions available for controlling the roving focus behavior.
 */
export interface RovingFocusActions {
  /**
   * Moves focus to the next item in the list.
   * If at the end and wrap is enabled, moves to the first item.
   */
  moveNext: () => void;

  /**
   * Moves focus to the previous item in the list.
   * If at the beginning and wrap is enabled, moves to the last item.
   */
  movePrevious: () => void;

  /**
   * Moves focus to the first item in the list.
   */
  moveFirst: () => void;

  /**
   * Moves focus to the last item in the list.
   */
  moveLast: () => void;

  /**
   * Moves focus to a specific index.
   * @param index The index to move focus to.
   */
  moveTo: (index: number) => void;

  /**
   * Updates the list of items.
   * @param items Array of item identifiers.
   */
  setItems: (items: string[]) => void;
}

/**
 * Options for configuring the roving focus behavior.
 */
export interface RovingFocusOptions {
  /**
   * Initial array of item identifiers.
   * @default []
   */
  items?: string[];

  /**
   * Initial index of the focused item.
   * @default 0
   */
  initialIndex?: number;

  /**
   * The orientation of the roving focus navigation.
   * @default 'vertical'
   */
  orientation?: 'horizontal' | 'vertical';

  /**
   * Whether focus should wrap from last to first item and vice versa.
   * @default true
   */
  wrap?: boolean;

  /**
   * Optional callback invoked when focus changes.
   * @param index The new focused index.
   * @param itemId The identifier of the newly focused item.
   * @param previousIndex The previously focused index.
   */
  onFocusChange?: (index: number, itemId: string, previousIndex: number) => void;
}

/**
 * The roving focus behavior interface returned by createRovingFocus.
 */
export interface RovingFocusBehavior {
  /**
   * Gets the current state of the roving focus.
   */
  getState: () => RovingFocusState;

  /**
   * Subscribes to state changes.
   * @param listener Function called when state changes.
   * @returns Unsubscribe function.
   */
  subscribe: (listener: (state: RovingFocusState) => void) => () => void;

  /**
   * Actions for controlling the roving focus.
   */
  actions: RovingFocusActions;

  /**
   * Destroys the behavior and cleans up subscriptions.
   */
  destroy: () => void;
}

/**
 * Creates a roving focus behavior for managing keyboard navigation through a list of items.
 *
 * This behavior implements the roving tabindex pattern commonly used for keyboard navigation
 * in menus, toolbars, tab lists, and other composite widgets.
 *
 * @example
 * ```typescript
 * const rovingFocus = createRovingFocus({
 *   items: ['item-1', 'item-2', 'item-3'],
 *   orientation: 'vertical',
 *   wrap: true,
 * });
 *
 * // Move to next item
 * rovingFocus.actions.moveNext();
 * console.log(rovingFocus.getState().currentIndex); // 1
 *
 * // Move to last item
 * rovingFocus.actions.moveLast();
 * console.log(rovingFocus.getState().currentIndex); // 2
 *
 * // Wrap to first item
 * rovingFocus.actions.moveNext();
 * console.log(rovingFocus.getState().currentIndex); // 0 (wrapped)
 *
 * // Clean up
 * rovingFocus.destroy();
 * ```
 *
 * @param options Configuration options for the roving focus behavior.
 * @returns A roving focus behavior instance.
 */
export function createRovingFocus(options?: RovingFocusOptions): RovingFocusBehavior {
  const items = options?.items || [];
  const initialIndex = options?.initialIndex ?? 0;
  const onFocusChange = options?.onFocusChange;

  const initialState: RovingFocusState = {
    currentIndex: items.length > 0 ? Math.max(0, Math.min(initialIndex, items.length - 1)) : 0,
    previousIndex: -1,
    items,
    orientation: options?.orientation || 'vertical',
    wrap: options?.wrap ?? true,
  };

  const store: Store<RovingFocusState, RovingFocusActions> = createStore<RovingFocusState, RovingFocusActions>(
    initialState,
    (set, get) => {
      // Helper function to update focus and invoke callback
      const updateFocus = (newIndex: number) => {
        const state = get();
        const previousIndex = state.currentIndex;

        if (newIndex !== previousIndex) {
          set((state) => ({
            ...state,
            currentIndex: newIndex,
            previousIndex: previousIndex,
          }));

          // Invoke callback if provided
          if (onFocusChange && state.items[newIndex]) {
            onFocusChange(newIndex, state.items[newIndex], previousIndex);
          }
        }
      };

      return {
        moveNext: () => {
          const state = get();
          if (state.items.length === 0) return;

          const nextIndex = state.currentIndex + 1;

          if (nextIndex >= state.items.length) {
            // At the end of the list
            if (state.wrap) {
              // Wrap to the first item
              updateFocus(0);
            }
            // Otherwise, stay at the last item (do nothing)
          } else {
            // Move to the next item
            updateFocus(nextIndex);
          }
        },

        movePrevious: () => {
          const state = get();
          if (state.items.length === 0) return;

          const prevIndex = state.currentIndex - 1;

          if (prevIndex < 0) {
            // At the beginning of the list
            if (state.wrap) {
              // Wrap to the last item
              updateFocus(state.items.length - 1);
            }
            // Otherwise, stay at the first item (do nothing)
          } else {
            // Move to the previous item
            updateFocus(prevIndex);
          }
        },

        moveFirst: () => {
          const state = get();
          if (state.items.length === 0) return;

          updateFocus(0);
        },

        moveLast: () => {
          const state = get();
          if (state.items.length === 0) return;

          updateFocus(state.items.length - 1);
        },

        moveTo: (index: number) => {
          const state = get();
          if (state.items.length === 0) return;

          // Clamp index to valid range
          const clampedIndex = Math.max(0, Math.min(index, state.items.length - 1));
          updateFocus(clampedIndex);
        },

        setItems: (items: string[]) => {
          const state = get();
          const previousIndex = state.currentIndex;
          // Adjust currentIndex if it's out of bounds after updating items
          const newIndex = items.length > 0 ? Math.min(state.currentIndex, items.length - 1) : 0;

          set((state) => ({
            ...state,
            items,
            currentIndex: newIndex,
            previousIndex: previousIndex,
          }));

          // Invoke callback if index changed due to items update
          if (newIndex !== previousIndex && onFocusChange && items[newIndex]) {
            onFocusChange(newIndex, items[newIndex], previousIndex);
          }
        },
      };
    },
  );

  return {
    getState: store.getState,
    subscribe: store.subscribe,
    actions: store.actions,
    destroy: store.destroy,
  };
}
