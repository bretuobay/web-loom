import { createStore, type Store } from '@web-loom/store-core';
import { createEventBus, type EventBus } from '@web-loom/event-bus-core';

/**
 * Represents a spoke in the hub-and-spoke navigation.
 */
export interface Spoke {
  /**
   * Unique identifier for the spoke.
   */
  id: string;

  /**
   * Display label for the spoke.
   */
  label: string;

  /**
   * Optional icon identifier for the spoke.
   */
  icon?: string;

  /**
   * Optional nested spokes for hierarchical navigation.
   */
  subSpokes?: Spoke[];
}

/**
 * Represents the state of the hub-and-spoke navigation pattern.
 */
export interface HubAndSpokeState {
  /**
   * Whether the user is currently on the hub page.
   */
  isOnHub: boolean;

  /**
   * The ID of the currently active spoke, or null if on hub.
   */
  activeSpoke: string | null;

  /**
   * Array of available spokes.
   */
  spokes: Spoke[];

  /**
   * Breadcrumb trail showing navigation path.
   */
  breadcrumbs: string[];

  /**
   * Navigation history for back navigation support.
   */
  navigationHistory: string[];
}

/**
 * Actions available for controlling the hub-and-spoke navigation pattern.
 */
export interface HubAndSpokeActions {
  /**
   * Activates a spoke and navigates to it.
   * @param spokeId The ID of the spoke to activate.
   */
  activateSpoke: (spokeId: string) => void;

  /**
   * Returns to the hub page.
   */
  returnToHub: () => void;

  /**
   * Navigates back in the navigation history.
   */
  goBack: () => void;

  /**
   * Updates the breadcrumb trail.
   * @param breadcrumbs Array of spoke IDs representing the breadcrumb path.
   */
  updateBreadcrumbs: (breadcrumbs: string[]) => void;

  /**
   * Adds a new spoke to the available spokes.
   * @param spoke The spoke to add.
   */
  addSpoke: (spoke: Spoke) => void;

  /**
   * Removes a spoke from the available spokes.
   * @param spokeId The ID of the spoke to remove.
   */
  removeSpoke: (spokeId: string) => void;
}

/**
 * Event map for hub-and-spoke navigation events.
 */
export interface HubAndSpokeEvents extends Record<string, any[]> {
  'spoke:activated': [spokeId: string];
  'hub:returned': [];
  'navigation:changed': [state: HubAndSpokeState];
}

/**
 * Options for configuring the hub-and-spoke navigation pattern.
 */
export interface HubAndSpokeOptions {
  /**
   * Initial array of spokes.
   */
  spokes: Spoke[];

  /**
   * Optional callback invoked when a spoke is activated.
   * @param spokeId The ID of the activated spoke.
   */
  onSpokeActivate?: (spokeId: string) => void;

  /**
   * Optional callback invoked when returning to the hub.
   */
  onReturnToHub?: () => void;

  /**
   * Whether to integrate with browser history API for URL-based navigation.
   * @default false
   */
  enableBrowserHistory?: boolean;
}

/**
 * The hub-and-spoke navigation pattern interface.
 */
export interface HubAndSpokeBehavior {
  /**
   * Gets the current state of the hub-and-spoke navigation.
   */
  getState: () => HubAndSpokeState;

  /**
   * Subscribes to state changes.
   * @param listener Function called when state changes.
   * @returns Unsubscribe function.
   */
  subscribe: (listener: (state: HubAndSpokeState) => void) => () => void;

  /**
   * Actions for controlling the hub-and-spoke navigation.
   */
  actions: HubAndSpokeActions;

  /**
   * Event bus for listening to navigation events.
   */
  eventBus: EventBus<HubAndSpokeEvents>;

  /**
   * Destroys the behavior and cleans up subscriptions.
   */
  destroy: () => void;
}

/**
 * Creates a hub-and-spoke navigation pattern for managing navigation between
 * a central hub page and independent spoke pages.
 *
 * This pattern is ideal for applications where users navigate from a central
 * dashboard or menu to independent sections, with support for breadcrumb
 * tracking and navigation history.
 *
 * @example
 * ```typescript
 * const navigation = createHubAndSpoke({
 *   spokes: [
 *     { id: 'settings', label: 'Settings', icon: 'gear' },
 *     { id: 'profile', label: 'Profile', icon: 'user' },
 *     { id: 'notifications', label: 'Notifications', icon: 'bell' },
 *   ],
 *   onSpokeActivate: (spokeId) => {
 *     console.log('Navigated to spoke:', spokeId);
 *   },
 *   onReturnToHub: () => {
 *     console.log('Returned to hub');
 *   },
 * });
 *
 * // Listen to navigation events
 * navigation.eventBus.on('spoke:activated', (spokeId) => {
 *   console.log('Spoke activated:', spokeId);
 * });
 *
 * // Navigate to a spoke
 * navigation.actions.activateSpoke('settings');
 * console.log(navigation.getState().isOnHub); // false
 * console.log(navigation.getState().activeSpoke); // 'settings'
 * console.log(navigation.getState().breadcrumbs); // ['settings']
 *
 * // Return to hub
 * navigation.actions.returnToHub();
 * console.log(navigation.getState().isOnHub); // true
 * console.log(navigation.getState().activeSpoke); // null
 *
 * // Navigate with history
 * navigation.actions.activateSpoke('profile');
 * navigation.actions.activateSpoke('notifications');
 * navigation.actions.goBack(); // Returns to 'profile'
 *
 * // Clean up
 * navigation.destroy();
 * ```
 *
 * @param options Configuration options for the hub-and-spoke navigation.
 * @returns A hub-and-spoke navigation pattern instance.
 */
export function createHubAndSpoke(options: HubAndSpokeOptions): HubAndSpokeBehavior {
  const { spokes, onSpokeActivate, onReturnToHub, enableBrowserHistory = false } = options;

  // Create event bus for navigation events
  const eventBus = createEventBus<HubAndSpokeEvents>();

  // Helper function to find a spoke by ID (including nested spokes)
  const findSpoke = (spokeId: string, spokesArray: Spoke[]): Spoke | null => {
    for (const spoke of spokesArray) {
      if (spoke.id === spokeId) {
        return spoke;
      }
      if (spoke.subSpokes) {
        const found = findSpoke(spokeId, spoke.subSpokes);
        if (found) return found;
      }
    }
    return null;
  };

  // Create store for hub-and-spoke state
  const initialState: HubAndSpokeState = {
    isOnHub: true,
    activeSpoke: null,
    spokes: [...spokes],
    breadcrumbs: [],
    navigationHistory: [],
  };

  const store: Store<HubAndSpokeState, HubAndSpokeActions> = createStore<HubAndSpokeState, HubAndSpokeActions>(
    initialState,
    (set, get) => ({
      activateSpoke: (spokeId: string) => {
        const state = get();

        // Verify spoke exists
        const spoke = findSpoke(spokeId, state.spokes);
        if (!spoke) {
          console.warn(`Spoke with ID "${spokeId}" not found`);
          return;
        }

        // Update state
        set((prevState) => ({
          ...prevState,
          isOnHub: false,
          activeSpoke: spokeId,
          breadcrumbs: [...prevState.breadcrumbs, spokeId],
          navigationHistory: [...prevState.navigationHistory, spokeId],
        }));

        // Emit event
        eventBus.emit('spoke:activated', spokeId);
        eventBus.emit('navigation:changed', get());

        // Invoke callback
        if (onSpokeActivate) {
          onSpokeActivate(spokeId);
        }

        // Browser history integration
        if (enableBrowserHistory && typeof window !== 'undefined' && window.history) {
          window.history.pushState({ spokeId }, '', `#${spokeId}`);
        }
      },

      returnToHub: () => {
        // Update state
        set((prevState) => ({
          ...prevState,
          isOnHub: true,
          activeSpoke: null,
          breadcrumbs: [],
          navigationHistory: [...prevState.navigationHistory, 'hub'],
        }));

        // Emit event
        eventBus.emit('hub:returned');
        eventBus.emit('navigation:changed', get());

        // Invoke callback
        if (onReturnToHub) {
          onReturnToHub();
        }

        // Browser history integration
        if (enableBrowserHistory && typeof window !== 'undefined' && window.history) {
          window.history.pushState({ hub: true }, '', '#hub');
        }
      },

      goBack: () => {
        const state = get();

        if (state.navigationHistory.length === 0) {
          console.warn('Cannot go back: navigation history is empty');
          return;
        }

        // Remove current location from history
        const newHistory = [...state.navigationHistory];
        newHistory.pop();

        if (newHistory.length === 0) {
          // No more history, return to hub
          set((prevState) => ({
            ...prevState,
            isOnHub: true,
            activeSpoke: null,
            breadcrumbs: [],
            navigationHistory: [],
          }));

          eventBus.emit('hub:returned');
          eventBus.emit('navigation:changed', get());

          if (onReturnToHub) {
            onReturnToHub();
          }
        } else {
          // Navigate to previous location
          const previousLocation = newHistory[newHistory.length - 1];

          if (previousLocation === 'hub') {
            set((prevState) => ({
              ...prevState,
              isOnHub: true,
              activeSpoke: null,
              breadcrumbs: [],
              navigationHistory: newHistory,
            }));

            eventBus.emit('hub:returned');
            eventBus.emit('navigation:changed', get());

            if (onReturnToHub) {
              onReturnToHub();
            }
          } else {
            // Navigate to previous spoke
            // Rebuild breadcrumbs from history
            const newBreadcrumbs = newHistory.filter((item) => item !== 'hub');

            set((prevState) => ({
              ...prevState,
              isOnHub: false,
              activeSpoke: previousLocation,
              breadcrumbs: newBreadcrumbs,
              navigationHistory: newHistory,
            }));

            eventBus.emit('spoke:activated', previousLocation);
            eventBus.emit('navigation:changed', get());

            if (onSpokeActivate) {
              onSpokeActivate(previousLocation);
            }
          }
        }

        // Browser history integration
        if (enableBrowserHistory && typeof window !== 'undefined' && window.history) {
          window.history.back();
        }
      },

      updateBreadcrumbs: (breadcrumbs: string[]) => {
        set((prevState) => ({
          ...prevState,
          breadcrumbs: [...breadcrumbs],
        }));

        eventBus.emit('navigation:changed', get());
      },

      addSpoke: (spoke: Spoke) => {
        const state = get();

        // Check if spoke already exists
        if (findSpoke(spoke.id, state.spokes)) {
          console.warn(`Spoke with ID "${spoke.id}" already exists`);
          return;
        }

        set((prevState) => ({
          ...prevState,
          spokes: [...prevState.spokes, spoke],
        }));

        eventBus.emit('navigation:changed', get());
      },

      removeSpoke: (spokeId: string) => {
        const state = get();

        // Helper to remove spoke recursively
        const removeFromArray = (spokesArray: Spoke[]): Spoke[] => {
          return spokesArray
            .filter((s) => s.id !== spokeId)
            .map((s) => ({
              ...s,
              subSpokes: s.subSpokes ? removeFromArray(s.subSpokes) : undefined,
            }));
        };

        const newSpokes = removeFromArray(state.spokes);

        // If the active spoke is being removed, return to hub
        if (state.activeSpoke === spokeId) {
          set((prevState) => ({
            ...prevState,
            isOnHub: true,
            activeSpoke: null,
            breadcrumbs: [],
            spokes: newSpokes,
          }));

          eventBus.emit('hub:returned');
          eventBus.emit('navigation:changed', get());

          if (onReturnToHub) {
            onReturnToHub();
          }
        } else {
          set((prevState) => ({
            ...prevState,
            spokes: newSpokes,
          }));

          eventBus.emit('navigation:changed', get());
        }
      },
    }),
  );

  // Browser history integration - listen to popstate events
  if (enableBrowserHistory && typeof window !== 'undefined') {
    const handlePopState = (event: PopStateEvent) => {
      if (event.state?.hub) {
        store.actions.returnToHub();
      } else if (event.state?.spokeId) {
        store.actions.activateSpoke(event.state.spokeId);
      }
    };

    window.addEventListener('popstate', handlePopState);

    // Store cleanup function
    const originalDestroy = store.destroy;
    store.destroy = () => {
      window.removeEventListener('popstate', handlePopState);
      originalDestroy();
    };
  }

  return {
    getState: store.getState,
    subscribe: store.subscribe,
    actions: store.actions,
    eventBus,
    destroy: store.destroy,
  };
}
