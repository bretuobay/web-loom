import { createStore, type Store } from '@web-loom/store-core';
import { createEventBus, type EventBus } from '@web-loom/event-bus-core';
import { createListSelection, type ListSelectionBehavior } from '@web-loom/ui-core';

/**
 * Represents the state of a master-detail pattern.
 */
export interface MasterDetailState<T = any> {
  /**
   * Array of all available items.
   */
  items: T[];

  /**
   * The currently selected item, or null if no item is selected.
   */
  selectedItem: T | null;

  /**
   * The current detail view identifier.
   */
  detailView: string;
}

/**
 * Actions available for controlling the master-detail pattern.
 */
export interface MasterDetailActions<T = any> {
  /**
   * Selects an item and updates the detail view.
   * @param item The item to select.
   */
  selectItem: (item: T) => void;

  /**
   * Clears the current selection.
   */
  clearSelection: () => void;

  /**
   * Sets the detail view identifier.
   * @param view The detail view identifier.
   */
  setDetailView: (view: string) => void;
}

/**
 * Event map for master-detail pattern events.
 */
export interface MasterDetailEvents<T = any> extends Record<string, any[]> {
  'item:selected': [item: T];
  'selection:cleared': [];
}

/**
 * Options for configuring the master-detail pattern.
 */
export interface MasterDetailOptions<T = any> {
  /**
   * Initial array of items.
   * @default []
   */
  items?: T[];

  /**
   * Function to extract a unique identifier from an item.
   * @param item The item to extract the ID from.
   * @returns The unique identifier for the item.
   */
  getId: (item: T) => string;

  /**
   * Initial detail view identifier.
   * @default 'default'
   */
  initialDetailView?: string;

  /**
   * Optional callback invoked when selection changes.
   * @param selectedItem The newly selected item, or null if selection is cleared.
   */
  onSelectionChange?: (selectedItem: T | null) => void;
}

/**
 * The master-detail pattern interface returned by createMasterDetail.
 */
export interface MasterDetailBehavior<T = any> {
  /**
   * Gets the current state of the master-detail pattern.
   */
  getState: () => MasterDetailState<T>;

  /**
   * Subscribes to state changes.
   * @param listener Function called when state changes.
   * @returns Unsubscribe function.
   */
  subscribe: (listener: (state: MasterDetailState<T>) => void) => () => void;

  /**
   * Actions for controlling the master-detail pattern.
   */
  actions: MasterDetailActions<T>;

  /**
   * Event bus for listening to master-detail events.
   */
  eventBus: EventBus<MasterDetailEvents<T>>;

  /**
   * Destroys the behavior and cleans up subscriptions.
   */
  destroy: () => void;
}

/**
 * Creates a master-detail pattern that synchronizes list selection with detail view.
 *
 * This pattern composes the list selection behavior from UI Core with detail view
 * synchronization, making it ideal for building split-view interfaces like email
 * clients, file explorers, and other master-detail layouts.
 *
 * @example
 * ```typescript
 * interface Item {
 *   id: string;
 *   name: string;
 *   description: string;
 * }
 *
 * const items: Item[] = [
 *   { id: '1', name: 'Item 1', description: 'First item' },
 *   { id: '2', name: 'Item 2', description: 'Second item' },
 *   { id: '3', name: 'Item 3', description: 'Third item' },
 * ];
 *
 * const masterDetail = createMasterDetail({
 *   items,
 *   getId: (item) => item.id,
 *   onSelectionChange: (item) => {
 *     console.log('Selected:', item);
 *   },
 * });
 *
 * // Listen to events
 * masterDetail.eventBus.on('item:selected', (item) => {
 *   console.log('Item selected event:', item);
 * });
 *
 * // Select an item
 * masterDetail.actions.selectItem(items[0]);
 * console.log(masterDetail.getState().selectedItem); // items[0]
 *
 * // Clear selection
 * masterDetail.actions.clearSelection();
 * console.log(masterDetail.getState().selectedItem); // null
 *
 * // Clean up
 * masterDetail.destroy();
 * ```
 *
 * @param options Configuration options for the master-detail pattern.
 * @returns A master-detail pattern instance.
 */
export function createMasterDetail<T = any>(options: MasterDetailOptions<T>): MasterDetailBehavior<T> {
  const items = options.items || [];
  const initialDetailView = options.initialDetailView || 'default';

  // Create event bus for master-detail events
  const eventBus = createEventBus<MasterDetailEvents<T>>();

  // Create a map from item ID to item for quick lookup
  const itemMap = new Map<string, T>();
  items.forEach((item) => {
    const id = options.getId(item);
    itemMap.set(id, item);
  });

  // Create list selection behavior for managing selection
  const listSelection: ListSelectionBehavior = createListSelection({
    items: items.map(options.getId),
    mode: 'single', // Master-detail typically uses single selection
    onSelectionChange: (selectedIds) => {
      // Sync selection with master-detail state
      const selectedId = selectedIds.length > 0 ? selectedIds[0] : null;
      const selectedItem = selectedId ? itemMap.get(selectedId) || null : null;

      store.actions.updateSelectedItem(selectedItem);

      // Invoke onSelectionChange callback if provided
      if (options.onSelectionChange) {
        options.onSelectionChange(selectedItem);
      }

      // Emit event
      if (selectedItem) {
        eventBus.emit('item:selected', selectedItem);
      }
    },
  });

  // Create store for master-detail state
  const initialState: MasterDetailState<T> = {
    items,
    selectedItem: null,
    detailView: initialDetailView,
  };

  interface InternalActions {
    updateSelectedItem: (item: T | null) => void;
  }

  const store: Store<MasterDetailState<T>, MasterDetailActions<T> & InternalActions> = createStore<
    MasterDetailState<T>,
    MasterDetailActions<T> & InternalActions
  >(initialState, (set) => ({
    selectItem: (item: T) => {
      const id = options.getId(item);
      listSelection.actions.select(id);
    },

    clearSelection: () => {
      listSelection.actions.clearSelection();
      set((state) => ({
        ...state,
        selectedItem: null,
      }));

      // Emit event
      eventBus.emit('selection:cleared');

      // Note: onSelectionChange callback is already invoked by listSelection's onSelectionChange
    },

    setDetailView: (view: string) => {
      set((state) => ({
        ...state,
        detailView: view,
      }));
    },

    updateSelectedItem: (item: T | null) => {
      set((state) => ({
        ...state,
        selectedItem: item,
      }));
    },
  }));

  return {
    getState: store.getState,
    subscribe: store.subscribe,
    actions: {
      selectItem: store.actions.selectItem,
      clearSelection: store.actions.clearSelection,
      setDetailView: store.actions.setDetailView,
    },
    eventBus,
    destroy: () => {
      listSelection.destroy();
      store.destroy();
    },
  };
}
