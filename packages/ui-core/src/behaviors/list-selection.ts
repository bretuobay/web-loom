import { createStore, type Store } from '@web-loom/store-core';

/**
 * Selection mode for the list selection behavior.
 */
export type SelectionMode = 'single' | 'multi' | 'range';

/**
 * Represents the state of a list selection behavior.
 */
export interface ListSelectionState {
  /**
   * Array of currently selected item identifiers.
   */
  selectedIds: string[];

  /**
   * The identifier of the last selected item.
   * Used for range selection calculations.
   */
  lastSelectedId: string | null;

  /**
   * The selection mode.
   * - 'single': Only one item can be selected at a time
   * - 'multi': Multiple items can be selected independently
   * - 'range': Supports shift-click range selection and ctrl/cmd toggle
   */
  mode: SelectionMode;

  /**
   * Array of all available item identifiers.
   */
  items: string[];
}

/**
 * Actions available for controlling the list selection behavior.
 */
export interface ListSelectionActions {
  /**
   * Selects an item by its identifier.
   * Behavior depends on the current selection mode.
   * @param id The identifier of the item to select.
   */
  select: (id: string) => void;

  /**
   * Deselects an item by its identifier.
   * @param id The identifier of the item to deselect.
   */
  deselect: (id: string) => void;

  /**
   * Toggles the selection state of an item.
   * @param id The identifier of the item to toggle.
   */
  toggleSelection: (id: string) => void;

  /**
   * Selects a range of items between two identifiers.
   * @param startId The identifier of the start item.
   * @param endId The identifier of the end item.
   */
  selectRange: (startId: string, endId: string) => void;

  /**
   * Clears all selections.
   */
  clearSelection: () => void;

  /**
   * Selects all items in the list.
   */
  selectAll: () => void;
}

/**
 * Options for configuring the list selection behavior.
 */
export interface ListSelectionOptions {
  /**
   * Initial array of item identifiers.
   * @default []
   */
  items?: string[];

  /**
   * Initial array of selected item identifiers.
   * @default []
   */
  initialSelectedIds?: string[];

  /**
   * The selection mode.
   * @default 'single'
   */
  mode?: SelectionMode;

  /**
   * Optional callback invoked when selection changes.
   * @param selectedIds Array of currently selected item identifiers.
   */
  onSelectionChange?: (selectedIds: string[]) => void;
}

/**
 * The list selection behavior interface returned by createListSelection.
 */
export interface ListSelectionBehavior {
  /**
   * Gets the current state of the list selection.
   */
  getState: () => ListSelectionState;

  /**
   * Subscribes to state changes.
   * @param listener Function called when state changes.
   * @returns Unsubscribe function.
   */
  subscribe: (listener: (state: ListSelectionState) => void) => () => void;

  /**
   * Actions for controlling the list selection.
   */
  actions: ListSelectionActions;

  /**
   * Destroys the behavior and cleans up subscriptions.
   */
  destroy: () => void;
}

/**
 * Creates a list selection behavior for managing item selection in lists and tables.
 * 
 * Supports three selection modes:
 * - Single: Only one item can be selected at a time
 * - Multi: Multiple items can be selected independently
 * - Range: Supports shift-click range selection and ctrl/cmd toggle selection
 * 
 * @example
 * ```typescript
 * // Single selection mode
 * const singleSelection = createListSelection({
 *   items: ['item-1', 'item-2', 'item-3'],
 *   mode: 'single',
 * });
 * 
 * singleSelection.actions.select('item-1');
 * console.log(singleSelection.getState().selectedIds); // ['item-1']
 * 
 * singleSelection.actions.select('item-2');
 * console.log(singleSelection.getState().selectedIds); // ['item-2'] (item-1 deselected)
 * 
 * // Multi selection mode
 * const multiSelection = createListSelection({
 *   items: ['item-1', 'item-2', 'item-3'],
 *   mode: 'multi',
 * });
 * 
 * multiSelection.actions.select('item-1');
 * multiSelection.actions.select('item-2');
 * console.log(multiSelection.getState().selectedIds); // ['item-1', 'item-2']
 * 
 * // Range selection mode
 * const rangeSelection = createListSelection({
 *   items: ['item-1', 'item-2', 'item-3', 'item-4'],
 *   mode: 'range',
 * });
 * 
 * rangeSelection.actions.selectRange('item-1', 'item-3');
 * console.log(rangeSelection.getState().selectedIds); // ['item-1', 'item-2', 'item-3']
 * 
 * // Clean up
 * singleSelection.destroy();
 * ```
 * 
 * @param options Configuration options for the list selection behavior.
 * @returns A list selection behavior instance.
 */
export function createListSelection(options?: ListSelectionOptions): ListSelectionBehavior {
  const items = options?.items || [];
  const initialSelectedIds = options?.initialSelectedIds || [];
  const mode = options?.mode || 'single';

  const initialState: ListSelectionState = {
    selectedIds: initialSelectedIds,
    lastSelectedId: initialSelectedIds.length > 0 ? initialSelectedIds[initialSelectedIds.length - 1] : null,
    mode,
    items,
  };

  const store: Store<ListSelectionState, ListSelectionActions> = createStore<
    ListSelectionState,
    ListSelectionActions
  >(initialState, (set, get) => ({
    select: (id: string) => {
      const state = get();

      // Check if item exists in the list (only if items array is provided)
      if (state.items.length > 0 && !state.items.includes(id)) {
        return;
      }

      let newSelectedIds: string[];

      if (state.mode === 'single') {
        // Single mode: replace selection with the new item
        newSelectedIds = [id];
      } else if (state.mode === 'multi') {
        // Multi mode: add to selection if not already selected
        if (state.selectedIds.includes(id)) {
          newSelectedIds = state.selectedIds;
        } else {
          newSelectedIds = [...state.selectedIds, id];
        }
      } else {
        // Range mode: add to selection if not already selected
        if (state.selectedIds.includes(id)) {
          newSelectedIds = state.selectedIds;
        } else {
          newSelectedIds = [...state.selectedIds, id];
        }
      }

      set((state) => ({
        ...state,
        selectedIds: newSelectedIds,
        lastSelectedId: id,
      }));

      // Invoke onSelectionChange callback if provided
      if (options?.onSelectionChange) {
        options.onSelectionChange(newSelectedIds);
      }
    },

    deselect: (id: string) => {
      const state = get();

      // Remove the item from selection
      const newSelectedIds = state.selectedIds.filter((selectedId) => selectedId !== id);

      set((state) => ({
        ...state,
        selectedIds: newSelectedIds,
        lastSelectedId: newSelectedIds.length > 0 ? newSelectedIds[newSelectedIds.length - 1] : null,
      }));

      // Invoke onSelectionChange callback if provided
      if (options?.onSelectionChange) {
        options.onSelectionChange(newSelectedIds);
      }
    },

    toggleSelection: (id: string) => {
      const state = get();

      // Check if item exists in the list (only if items array is provided)
      if (state.items.length > 0 && !state.items.includes(id)) {
        return;
      }

      const isSelected = state.selectedIds.includes(id);

      if (isSelected) {
        // Deselect the item
        const newSelectedIds = state.selectedIds.filter((selectedId) => selectedId !== id);

        set((state) => ({
          ...state,
          selectedIds: newSelectedIds,
          lastSelectedId: newSelectedIds.length > 0 ? newSelectedIds[newSelectedIds.length - 1] : null,
        }));

        // Invoke onSelectionChange callback if provided
        if (options?.onSelectionChange) {
          options.onSelectionChange(newSelectedIds);
        }
      } else {
        // Select the item
        let newSelectedIds: string[];

        if (state.mode === 'single') {
          // Single mode: replace selection
          newSelectedIds = [id];
        } else {
          // Multi or range mode: add to selection
          newSelectedIds = [...state.selectedIds, id];
        }

        set((state) => ({
          ...state,
          selectedIds: newSelectedIds,
          lastSelectedId: id,
        }));

        // Invoke onSelectionChange callback if provided
        if (options?.onSelectionChange) {
          options.onSelectionChange(newSelectedIds);
        }
      }
    },

    selectRange: (startId: string, endId: string) => {
      const state = get();

      // Find indices of start and end items
      const startIndex = state.items.indexOf(startId);
      const endIndex = state.items.indexOf(endId);

      // If either item is not found, do nothing
      if (startIndex === -1 || endIndex === -1) {
        return;
      }

      // Determine the range (handle both directions)
      const minIndex = Math.min(startIndex, endIndex);
      const maxIndex = Math.max(startIndex, endIndex);

      // Select all items in the range
      const rangeIds = state.items.slice(minIndex, maxIndex + 1);

      let newSelectedIds: string[];

      if (state.mode === 'single') {
        // Single mode: only select the end item
        newSelectedIds = [endId];
      } else if (state.mode === 'multi') {
        // Multi mode: add range to existing selection (union)
        const selectedSet = new Set([...state.selectedIds, ...rangeIds]);
        newSelectedIds = Array.from(selectedSet);
      } else {
        // Range mode: add range to existing selection (union)
        const selectedSet = new Set([...state.selectedIds, ...rangeIds]);
        newSelectedIds = Array.from(selectedSet);
      }

      set((state) => ({
        ...state,
        selectedIds: newSelectedIds,
        lastSelectedId: endId,
      }));

      // Invoke onSelectionChange callback if provided
      if (options?.onSelectionChange) {
        options.onSelectionChange(newSelectedIds);
      }
    },

    clearSelection: () => {
      set((state) => ({
        ...state,
        selectedIds: [],
        lastSelectedId: null,
      }));

      // Invoke onSelectionChange callback if provided
      if (options?.onSelectionChange) {
        options.onSelectionChange([]);
      }
    },

    selectAll: () => {
      const state = get();

      if (state.mode === 'single') {
        // Single mode: select only the first item
        const newSelectedIds = state.items.length > 0 ? [state.items[0]] : [];
        set((state) => ({
          ...state,
          selectedIds: newSelectedIds,
          lastSelectedId: newSelectedIds.length > 0 ? newSelectedIds[0] : null,
        }));

        // Invoke onSelectionChange callback if provided
        if (options?.onSelectionChange) {
          options.onSelectionChange(newSelectedIds);
        }
      } else {
        // Multi or range mode: select all items
        const newSelectedIds = [...state.items];
        set((state) => ({
          ...state,
          selectedIds: newSelectedIds,
          lastSelectedId: newSelectedIds.length > 0 ? newSelectedIds[newSelectedIds.length - 1] : null,
        }));

        // Invoke onSelectionChange callback if provided
        if (options?.onSelectionChange) {
          options.onSelectionChange(newSelectedIds);
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
