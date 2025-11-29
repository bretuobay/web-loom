import { createStore, type Store } from '@web-loom/store-core';
import { createRovingFocus, type RovingFocusBehavior } from '@web-loom/ui-core';

/**
 * Represents a tab in the tabbed interface.
 */
export interface Tab {
  /**
   * Unique identifier for the tab.
   */
  id: string;

  /**
   * Display label for the tab.
   */
  label: string;

  /**
   * Whether the tab is disabled.
   * @default false
   */
  disabled?: boolean;
}

/**
 * Represents the state of a tabbed interface pattern.
 */
export interface TabbedInterfaceState {
  /**
   * Array of all tabs.
   */
  tabs: Tab[];

  /**
   * The ID of the currently active tab.
   */
  activeTabId: string;

  /**
   * Map of tab IDs to their panel content.
   */
  panels: Map<string, any>;
}

/**
 * Actions available for controlling the tabbed interface pattern.
 */
export interface TabbedInterfaceActions {
  /**
   * Activates a tab by its ID.
   * @param tabId The ID of the tab to activate.
   */
  activateTab: (tabId: string) => void;

  /**
   * Adds a new tab to the interface.
   * @param tab The tab to add.
   */
  addTab: (tab: Tab) => void;

  /**
   * Removes a tab from the interface.
   * @param tabId The ID of the tab to remove.
   */
  removeTab: (tabId: string) => void;

  /**
   * Moves a tab from one position to another.
   * @param fromIndex The current index of the tab.
   * @param toIndex The target index for the tab.
   */
  moveTab: (fromIndex: number, toIndex: number) => void;

  /**
   * Moves focus to the next tab.
   * Delegates to the underlying roving focus behavior's moveNext action.
   */
  focusNextTab: () => void;

  /**
   * Moves focus to the previous tab.
   * Delegates to the underlying roving focus behavior's movePrevious action.
   */
  focusPreviousTab: () => void;
}

/**
 * Options for configuring the tabbed interface pattern.
 */
export interface TabbedInterfaceOptions {
  /**
   * Initial array of tabs.
   * @default []
   */
  tabs?: Tab[];

  /**
   * Initial active tab ID. If not provided, the first tab will be active.
   */
  initialActiveTabId?: string;

  /**
   * The orientation of the tab list for keyboard navigation.
   * @default 'horizontal'
   */
  orientation?: 'horizontal' | 'vertical';

  /**
   * Whether keyboard focus should wrap from last to first tab.
   * @default true
   */
  wrap?: boolean;

  /**
   * Optional callback invoked when the active tab changes.
   * @param tabId The ID of the newly active tab.
   */
  onTabChange?: (tabId: string) => void;
}

/**
 * The tabbed interface pattern interface returned by createTabbedInterface.
 */
export interface TabbedInterfaceBehavior {
  /**
   * Gets the current state of the tabbed interface.
   */
  getState: () => TabbedInterfaceState;

  /**
   * Subscribes to state changes.
   * @param listener Function called when state changes.
   * @returns Unsubscribe function.
   */
  subscribe: (listener: (state: TabbedInterfaceState) => void) => () => void;

  /**
   * Actions for controlling the tabbed interface.
   */
  actions: TabbedInterfaceActions;

  /**
   * Destroys the behavior and cleans up subscriptions.
   */
  destroy: () => void;
}

/**
 * Creates a tabbed interface pattern with keyboard navigation support.
 * 
 * This pattern composes roving focus behavior for keyboard navigation between tabs
 * and manages the visibility of tab panels. It's ideal for building accessible
 * tab-based UIs with proper keyboard support.
 * 
 * @example
 * ```typescript
 * const tabs: Tab[] = [
 *   { id: 'tab-1', label: 'Profile' },
 *   { id: 'tab-2', label: 'Settings' },
 *   { id: 'tab-3', label: 'Notifications' },
 * ];
 * 
 * const tabbedInterface = createTabbedInterface({
 *   tabs,
 *   orientation: 'horizontal',
 *   onTabChange: (tabId) => {
 *     console.log('Active tab:', tabId);
 *   },
 * });
 * 
 * // Activate a tab
 * tabbedInterface.actions.activateTab('tab-2');
 * console.log(tabbedInterface.getState().activeTabId); // 'tab-2'
 * 
 * // Add a new tab
 * tabbedInterface.actions.addTab({ id: 'tab-4', label: 'Help' });
 * 
 * // Remove a tab
 * tabbedInterface.actions.removeTab('tab-3');
 * 
 * // Move a tab
 * tabbedInterface.actions.moveTab(0, 2); // Move first tab to third position
 * 
 * // Clean up
 * tabbedInterface.destroy();
 * ```
 * 
 * @param options Configuration options for the tabbed interface pattern.
 * @returns A tabbed interface pattern instance.
 */
export function createTabbedInterface(
  options?: TabbedInterfaceOptions
): TabbedInterfaceBehavior {
  const tabs = options?.tabs || [];
  const orientation = options?.orientation || 'horizontal';
  const wrap = options?.wrap ?? true;

  // Determine initial active tab
  const initialActiveTabId =
    options?.initialActiveTabId || (tabs.length > 0 ? tabs[0].id : '');

  // Flag to prevent circular updates between activateTab and roving focus
  let isUpdatingFromRovingFocus = false;

  // Create roving focus behavior for keyboard navigation
  const rovingFocus: RovingFocusBehavior = createRovingFocus({
    items: tabs.map((tab) => tab.id),
    initialIndex: tabs.findIndex((tab) => tab.id === initialActiveTabId),
    orientation,
    wrap,
  });

  // Subscribe to roving focus changes to sync with active tab
  const rovingFocusUnsubscribe = rovingFocus.subscribe((focusState) => {
    if (isUpdatingFromRovingFocus) return; // Prevent circular updates
    
    if (focusState.items.length > 0 && focusState.currentIndex >= 0) {
      const focusedTabId = focusState.items[focusState.currentIndex];
      const currentState = store.getState();
      
      // Only update if the focused tab is different from the active tab
      if (focusedTabId !== currentState.activeTabId) {
        // Check if the tab is not disabled
        const tab = currentState.tabs.find((t) => t.id === focusedTabId);
        if (tab && !tab.disabled) {
          isUpdatingFromRovingFocus = true;
          store.actions.activateTab(focusedTabId);
          isUpdatingFromRovingFocus = false;
        }
      }
    }
  });

  // Create store for tabbed interface state
  const initialState: TabbedInterfaceState = {
    tabs,
    activeTabId: initialActiveTabId,
    panels: new Map(),
  };

  const store: Store<TabbedInterfaceState, TabbedInterfaceActions> = createStore<
    TabbedInterfaceState,
    TabbedInterfaceActions
  >(initialState, (set, get) => ({
    activateTab: (tabId: string) => {
      const state = get();
      const tab = state.tabs.find((t) => t.id === tabId);

      // Only activate if tab exists and is not disabled
      if (tab && !tab.disabled && state.activeTabId !== tabId) {
        set((state) => ({
          ...state,
          activeTabId: tabId,
        }));

        // Update roving focus to match (only if not already updating from roving focus)
        if (!isUpdatingFromRovingFocus) {
          const tabIndex = state.tabs.findIndex((t) => t.id === tabId);
          if (tabIndex >= 0) {
            isUpdatingFromRovingFocus = true;
            rovingFocus.actions.moveTo(tabIndex);
            isUpdatingFromRovingFocus = false;
          }
        }

        // Invoke onTabChange callback if provided
        if (options?.onTabChange) {
          options.onTabChange(tabId);
        }
      }
    },

    addTab: (tab: Tab) => {
      set((state) => {
        const newTabs = [...state.tabs, tab];
        
        // Update roving focus items
        rovingFocus.actions.setItems(newTabs.map((t) => t.id));

        // If this is the first tab, make it active
        const newActiveTabId = state.tabs.length === 0 ? tab.id : state.activeTabId;

        return {
          ...state,
          tabs: newTabs,
          activeTabId: newActiveTabId,
        };
      });
    },

    removeTab: (tabId: string) => {
      const state = get();
      const tabIndex = state.tabs.findIndex((t) => t.id === tabId);

      if (tabIndex === -1) return; // Tab not found

      set((currentState) => {
        const newTabs = currentState.tabs.filter((t) => t.id !== tabId);
        
        // Update roving focus items
        rovingFocus.actions.setItems(newTabs.map((t) => t.id));

        // Remove panel content for this tab
        const newPanels = new Map(currentState.panels);
        newPanels.delete(tabId);

        // If removing the active tab, activate another tab
        let newActiveTabId = currentState.activeTabId;
        if (currentState.activeTabId === tabId) {
          if (newTabs.length > 0) {
            // Activate the tab at the same index, or the last tab if index is out of bounds
            const newIndex = Math.min(tabIndex, newTabs.length - 1);
            newActiveTabId = newTabs[newIndex].id;

            // Invoke onTabChange callback if provided
            if (options?.onTabChange) {
              options.onTabChange(newActiveTabId);
            }
          } else {
            newActiveTabId = '';
          }
        }

        return {
          ...currentState,
          tabs: newTabs,
          activeTabId: newActiveTabId,
          panels: newPanels,
        };
      });
    },

    moveTab: (fromIndex: number, toIndex: number) => {
      const state = get();

      // Validate indices
      if (
        fromIndex < 0 ||
        fromIndex >= state.tabs.length ||
        toIndex < 0 ||
        toIndex >= state.tabs.length ||
        fromIndex === toIndex
      ) {
        return;
      }

      set((currentState) => {
        const newTabs = [...currentState.tabs];
        const [movedTab] = newTabs.splice(fromIndex, 1);
        newTabs.splice(toIndex, 0, movedTab);

        // Update roving focus items
        rovingFocus.actions.setItems(newTabs.map((t) => t.id));

        // Update roving focus index if the active tab was moved
        if (currentState.activeTabId === movedTab.id) {
          rovingFocus.actions.moveTo(toIndex);
        }

        return {
          ...currentState,
          tabs: newTabs,
        };
      });
    },

    focusNextTab: () => {
      // Delegate to roving focus moveNext action
      rovingFocus.actions.moveNext();
    },

    focusPreviousTab: () => {
      // Delegate to roving focus movePrevious action
      rovingFocus.actions.movePrevious();
    },
  }));

  return {
    getState: store.getState,
    subscribe: store.subscribe,
    actions: store.actions,
    destroy: () => {
      rovingFocusUnsubscribe();
      rovingFocus.destroy();
      store.destroy();
    },
  };
}
