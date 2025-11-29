import { createStore, type Store } from '@web-loom/store-core';
import { createEventBus, type EventBus } from '@web-loom/event-bus-core';

/**
 * Scroll direction type.
 */
export type ScrollDirection = 'up' | 'down' | null;

/**
 * Represents the state of the floating action button pattern.
 */
export interface FABState {
  /**
   * Whether the FAB is currently visible.
   */
  isVisible: boolean;

  /**
   * Current scroll position in pixels.
   */
  scrollPosition: number;

  /**
   * Current scroll direction.
   */
  scrollDirection: ScrollDirection;

  /**
   * Scroll threshold in pixels - FAB shows when scrolled past this point.
   */
  scrollThreshold: number;

  /**
   * Whether to hide the FAB when scrolling down.
   */
  hideOnScrollDown: boolean;
}

/**
 * Actions available for controlling the floating action button pattern.
 */
export interface FABActions {
  /**
   * Shows the FAB.
   */
  show: () => void;

  /**
   * Hides the FAB.
   */
  hide: () => void;

  /**
   * Sets the current scroll position and updates visibility accordingly.
   * @param position The scroll position in pixels.
   */
  setScrollPosition: (position: number) => void;

  /**
   * Sets the scroll threshold.
   * @param threshold The threshold in pixels.
   */
  setScrollThreshold: (threshold: number) => void;

  /**
   * Toggles the FAB visibility.
   */
  toggle: () => void;

  /**
   * Sets whether to hide the FAB when scrolling down.
   * @param hide Whether to hide on scroll down.
   */
  setHideOnScrollDown: (hide: boolean) => void;
}

/**
 * Event map for floating action button events.
 */
export interface FABEvents extends Record<string, any[]> {
  'fab:shown': [];
  'fab:hidden': [];
  'fab:visibility-changed': [isVisible: boolean];
  'fab:scroll-direction-changed': [direction: ScrollDirection];
}

/**
 * Options for configuring the floating action button pattern.
 */
export interface FABOptions {
  /**
   * Initial scroll threshold in pixels.
   * @default 100
   */
  scrollThreshold?: number;

  /**
   * Whether to hide the FAB when scrolling down.
   * @default false
   */
  hideOnScrollDown?: boolean;

  /**
   * Optional callback invoked when visibility changes.
   * @param visible Whether the FAB is visible.
   */
  onVisibilityChange?: (visible: boolean) => void;
}

/**
 * The floating action button pattern interface.
 */
export interface FABBehavior {
  /**
   * Gets the current state of the FAB.
   */
  getState: () => FABState;

  /**
   * Subscribes to state changes.
   * @param listener Function called when state changes.
   * @returns Unsubscribe function.
   */
  subscribe: (listener: (state: FABState) => void) => () => void;

  /**
   * Actions for controlling the FAB.
   */
  actions: FABActions;

  /**
   * Event bus for listening to FAB events.
   */
  eventBus: EventBus<FABEvents>;

  /**
   * Destroys the behavior and cleans up subscriptions.
   */
  destroy: () => void;
}

/**
 * Creates a floating action button pattern for managing FAB visibility based
 * on scroll position and direction.
 * 
 * This pattern is ideal for implementing scroll-aware primary action buttons
 * that appear/disappear based on user scroll behavior, improving UX by
 * reducing visual clutter when not needed.
 * 
 * @example
 * ```typescript
 * const fab = createFloatingActionButton({
 *   scrollThreshold: 200,
 *   hideOnScrollDown: true,
 *   onVisibilityChange: (visible) => {
 *     console.log('FAB visibility:', visible);
 *   },
 * });
 * 
 * // Listen to visibility events
 * fab.eventBus.on('fab:shown', () => {
 *   console.log('FAB is now visible');
 * });
 * 
 * fab.eventBus.on('fab:hidden', () => {
 *   console.log('FAB is now hidden');
 * });
 * 
 * // Update scroll position (typically from a throttled scroll event)
 * window.addEventListener('scroll', throttle(() => {
 *   fab.actions.setScrollPosition(window.scrollY);
 * }, 100));
 * 
 * // Manual control
 * fab.actions.show();
 * fab.actions.hide();
 * fab.actions.toggle();
 * 
 * // Update configuration
 * fab.actions.setScrollThreshold(300);
 * fab.actions.setHideOnScrollDown(false);
 * 
 * // Clean up
 * fab.destroy();
 * ```
 * 
 * @param options Configuration options for the FAB.
 * @returns A floating action button pattern instance.
 */
export function createFloatingActionButton(options?: FABOptions): FABBehavior {
  const {
    scrollThreshold = 100,
    hideOnScrollDown = false,
    onVisibilityChange,
  } = options || {};

  // Create event bus for FAB events
  const eventBus = createEventBus<FABEvents>();

  // Create store for FAB state
  const initialState: FABState = {
    isVisible: false,
    scrollPosition: 0,
    scrollDirection: null,
    scrollThreshold,
    hideOnScrollDown,
  };

  const store: Store<FABState, FABActions> = createStore<FABState, FABActions>(
    initialState,
    (set, get) => ({
      show: () => {
        const state = get();
        if (state.isVisible) return;

        set((prevState) => ({
          ...prevState,
          isVisible: true,
        }));

        // Emit events
        eventBus.emit('fab:shown');
        eventBus.emit('fab:visibility-changed', true);

        // Invoke callback
        if (onVisibilityChange) {
          onVisibilityChange(true);
        }
      },

      hide: () => {
        const state = get();
        if (!state.isVisible) return;

        set((prevState) => ({
          ...prevState,
          isVisible: false,
        }));

        // Emit events
        eventBus.emit('fab:hidden');
        eventBus.emit('fab:visibility-changed', false);

        // Invoke callback
        if (onVisibilityChange) {
          onVisibilityChange(false);
        }
      },

      setScrollPosition: (position: number) => {
        const state = get();
        const previousPosition = state.scrollPosition;

        // Calculate scroll direction
        let newDirection: ScrollDirection = null;
        if (position > previousPosition) {
          newDirection = 'down';
        } else if (position < previousPosition) {
          newDirection = 'up';
        }

        // Update state
        set((prevState) => ({
          ...prevState,
          scrollPosition: position,
          scrollDirection: newDirection,
        }));

        // Emit scroll direction event if changed
        if (newDirection !== state.scrollDirection && newDirection !== null) {
          eventBus.emit('fab:scroll-direction-changed', newDirection);
        }

        // Determine visibility based on scroll position and direction
        const newState = get();
        let shouldBeVisible = false;

        // Check threshold
        if (position >= newState.scrollThreshold) {
          shouldBeVisible = true;

          // Apply hideOnScrollDown logic
          if (newState.hideOnScrollDown && newDirection === 'down') {
            shouldBeVisible = false;
          }
        } else {
          shouldBeVisible = false;
        }

        // Update visibility if changed
        if (shouldBeVisible !== newState.isVisible) {
          if (shouldBeVisible) {
            store.actions.show();
          } else {
            store.actions.hide();
          }
        }
      },

      setScrollThreshold: (threshold: number) => {
        if (threshold < 0) {
          console.warn('Scroll threshold must be non-negative');
          return;
        }

        set((prevState) => ({
          ...prevState,
          scrollThreshold: threshold,
        }));

        // Re-evaluate visibility with new threshold
        const state = get();
        store.actions.setScrollPosition(state.scrollPosition);
      },

      toggle: () => {
        const state = get();
        if (state.isVisible) {
          store.actions.hide();
        } else {
          store.actions.show();
        }
      },

      setHideOnScrollDown: (hide: boolean) => {
        set((prevState) => ({
          ...prevState,
          hideOnScrollDown: hide,
        }));

        // Re-evaluate visibility with new setting
        const state = get();
        store.actions.setScrollPosition(state.scrollPosition);
      },
    })
  );

  return {
    getState: store.getState,
    subscribe: store.subscribe,
    actions: store.actions,
    eventBus,
    destroy: store.destroy,
  };
}
