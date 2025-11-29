import { createStore, type Store } from '@web-loom/store-core';
import { createEventBus, type EventBus } from '@web-loom/event-bus-core';
import { createListSelection, type ListSelectionBehavior } from '@web-loom/ui-core';

/**
 * Represents a responsive breakpoint configuration.
 */
export interface Breakpoint {
  /**
   * Minimum viewport width in pixels for this breakpoint.
   */
  minWidth: number;

  /**
   * Number of columns to display at this breakpoint.
   */
  columns: number;
}

/**
 * Selection mode for the grid layout.
 */
export type GridSelectionMode = 'single' | 'multi';

/**
 * Represents the state of the grid layout pattern.
 */
export interface GridLayoutState<T> {
  /**
   * Array of items in the grid.
   */
  items: T[];

  /**
   * Current number of columns based on active breakpoint.
   */
  columns: number;

  /**
   * Array of selected item identifiers.
   */
  selectedItems: string[];

  /**
   * Index of the currently focused item.
   */
  focusedIndex: number;

  /**
   * Current active breakpoint.
   */
  breakpoint: Breakpoint;

  /**
   * Current viewport width in pixels.
   */
  viewportWidth: number;

  /**
   * Selection mode (single or multi).
   */
  selectionMode: GridSelectionMode;

  /**
   * Whether navigation wraps at grid boundaries.
   */
  wrap: boolean;
}

/**
 * Actions available for controlling the grid layout pattern.
 */
export interface GridLayoutActions<T> {
  /**
   * Selects an item by its identifier.
   * @param itemId The identifier of the item to select.
   */
  selectItem: (itemId: string) => void;

  /**
   * Navigates focus up to the item in the row above.
   */
  navigateUp: () => void;

  /**
   * Navigates focus down to the item in the row below.
   */
  navigateDown: () => void;

  /**
   * Navigates focus left to the previous item.
   */
  navigateLeft: () => void;

  /**
   * Navigates focus right to the next item.
   */
  navigateRight: () => void;

  /**
   * Sets the breakpoint configuration.
   * @param breakpoints Array of breakpoint configurations.
   */
  setBreakpoints: (breakpoints: Breakpoint[]) => void;

  /**
   * Updates the viewport width and recalculates columns.
   * @param width The new viewport width in pixels.
   */
  updateViewportWidth: (width: number) => void;

  /**
   * Sets the items in the grid.
   * @param items Array of items to display.
   */
  setItems: (items: T[]) => void;

  /**
   * Sets the focused index directly.
   * @param index The index to focus.
   */
  setFocusedIndex: (index: number) => void;
}

/**
 * Event map for grid layout events.
 */
export interface GridLayoutEvents extends Record<string, any[]> {
  'item:focused': [index: number, itemId: string];
  'item:selected': [itemId: string, selectedIds: string[]];
  'breakpoint:changed': [breakpoint: Breakpoint, columns: number];
}

/**
 * Options for configuring the grid layout pattern.
 */
export interface GridLayoutOptions<T> {
  /**
   * Initial array of items.
   */
  items: T[];

  /**
   * Function to extract unique identifier from an item.
   * @param item The item to extract ID from.
   * @returns The unique identifier string.
   */
  getId: (item: T) => string;

  /**
   * Array of responsive breakpoint configurations.
   * Should be sorted by minWidth in ascending order.
   */
  breakpoints: Breakpoint[];

  /**
   * Selection mode (single or multi).
   * @default 'single'
   */
  selectionMode?: GridSelectionMode;

  /**
   * Optional callback invoked when selection changes.
   * @param selected Array of selected items.
   */
  onSelectionChange?: (selected: T[]) => void;

  /**
   * Whether navigation wraps at grid boundaries.
   * @default true
   */
  wrap?: boolean;

  /**
   * Initial viewport width in pixels.
   * @default 1024
   */
  initialViewportWidth?: number;

  /**
   * Initial focused index.
   * @default 0
   */
  initialFocusedIndex?: number;
}

/**
 * The grid layout pattern interface.
 */
export interface GridLayoutBehavior<T> {
  /**
   * Gets the current state of the grid layout.
   */
  getState: () => GridLayoutState<T>;

  /**
   * Subscribes to state changes.
   * @param listener Function called when state changes.
   * @returns Unsubscribe function.
   */
  subscribe: (listener: (state: GridLayoutState<T>) => void) => () => void;

  /**
   * Actions for controlling the grid layout.
   */
  actions: GridLayoutActions<T>;

  /**
   * Event bus for listening to grid layout events.
   */
  eventBus: EventBus<GridLayoutEvents>;

  /**
   * Destroys the behavior and cleans up subscriptions.
   */
  destroy: () => void;
}

/**
 * Creates a grid/card layout pattern for managing responsive grid layouts
 * with keyboard navigation and selection support.
 * 
 * This pattern is ideal for photo galleries, product grids, dashboards,
 * and any interface that displays items in a responsive grid with
 * keyboard navigation support.
 * 
 * @example
 * ```typescript
 * interface Photo {
 *   id: string;
 *   url: string;
 *   title: string;
 * }
 * 
 * const photos: Photo[] = [
 *   { id: '1', url: '/photo1.jpg', title: 'Photo 1' },
 *   { id: '2', url: '/photo2.jpg', title: 'Photo 2' },
 *   { id: '3', url: '/photo3.jpg', title: 'Photo 3' },
 * ];
 * 
 * const gridLayout = createGridLayout({
 *   items: photos,
 *   getId: (photo) => photo.id,
 *   breakpoints: [
 *     { minWidth: 0, columns: 1 },
 *     { minWidth: 640, columns: 2 },
 *     { minWidth: 1024, columns: 3 },
 *     { minWidth: 1280, columns: 4 },
 *   ],
 *   selectionMode: 'multi',
 *   wrap: true,
 *   onSelectionChange: (selected) => {
 *     console.log('Selected photos:', selected);
 *   },
 * });
 * 
 * // Listen to events
 * gridLayout.eventBus.on('item:focused', (index, itemId) => {
 *   console.log('Focused item:', index, itemId);
 * });
 * 
 * gridLayout.eventBus.on('breakpoint:changed', (breakpoint, columns) => {
 *   console.log('Breakpoint changed:', breakpoint, 'Columns:', columns);
 * });
 * 
 * // Navigate with arrow keys
 * gridLayout.actions.navigateRight(); // Move focus to next item
 * gridLayout.actions.navigateDown();  // Move focus down one row
 * 
 * // Select items
 * gridLayout.actions.selectItem('1');
 * console.log(gridLayout.getState().selectedItems); // ['1']
 * 
 * // Update viewport width (e.g., on window resize)
 * gridLayout.actions.updateViewportWidth(800);
 * console.log(gridLayout.getState().columns); // 2 (based on breakpoints)
 * 
 * // Clean up
 * gridLayout.destroy();
 * ```
 * 
 * @param options Configuration options for the grid layout.
 * @returns A grid layout pattern instance.
 */
export function createGridLayout<T>(options: GridLayoutOptions<T>): GridLayoutBehavior<T> {
  const {
    items,
    getId,
    breakpoints,
    selectionMode = 'single',
    onSelectionChange,
    wrap = true,
    initialViewportWidth = 1024,
    initialFocusedIndex = 0,
  } = options;

  // Validate breakpoints
  if (!breakpoints || breakpoints.length === 0) {
    throw new Error('At least one breakpoint must be provided');
  }

  // Sort breakpoints by minWidth in ascending order
  const sortedBreakpoints = [...breakpoints].sort((a, b) => a.minWidth - b.minWidth);

  // Validate breakpoints have positive values
  for (const bp of sortedBreakpoints) {
    if (bp.minWidth < 0 || bp.columns <= 0) {
      throw new Error('Breakpoints must have non-negative minWidth and positive columns');
    }
  }

  // Create event bus for grid layout events
  const eventBus = createEventBus<GridLayoutEvents>();

  // Helper function to calculate active breakpoint based on viewport width
  const calculateBreakpoint = (width: number): Breakpoint => {
    // Find the largest breakpoint that fits within the viewport width
    let activeBreakpoint = sortedBreakpoints[0];
    for (const bp of sortedBreakpoints) {
      if (width >= bp.minWidth) {
        activeBreakpoint = bp;
      } else {
        break;
      }
    }
    return activeBreakpoint;
  };

  // Calculate initial breakpoint and columns
  const initialBreakpoint = calculateBreakpoint(initialViewportWidth);

  // Create list selection behavior for managing selection
  const itemIds = items.map(getId);
  const listSelection: ListSelectionBehavior = createListSelection({
    items: itemIds,
    mode: selectionMode,
    onSelectionChange: (selectedIds) => {
      if (onSelectionChange) {
        const selectedItems = items.filter((item) => selectedIds.includes(getId(item)));
        onSelectionChange(selectedItems);
      }
    },
  });

  // Create store for grid layout state
  const initialState: GridLayoutState<T> = {
    items: [...items],
    columns: initialBreakpoint.columns,
    selectedItems: [],
    focusedIndex: Math.min(initialFocusedIndex, items.length - 1),
    breakpoint: initialBreakpoint,
    viewportWidth: initialViewportWidth,
    selectionMode,
    wrap,
  };

  const store: Store<GridLayoutState<T>, GridLayoutActions<T>> = createStore<
    GridLayoutState<T>,
    GridLayoutActions<T>
  >(initialState, (set, get) => ({
    selectItem: (itemId: string) => {
      // Delegate to list selection behavior
      listSelection.actions.select(itemId);

      // Update local state
      const selectionState = listSelection.getState();
      set((prevState) => ({
        ...prevState,
        selectedItems: selectionState.selectedIds,
      }));

      // Emit event
      eventBus.emit('item:selected', itemId, selectionState.selectedIds);
    },

    navigateUp: () => {
      const state = get();

      if (state.items.length === 0) {
        console.warn('Cannot navigate: grid is empty');
        return;
      }

      const newIndex = state.focusedIndex - state.columns;

      if (newIndex >= 0) {
        // Move up one row
        set((prevState) => ({
          ...prevState,
          focusedIndex: newIndex,
        }));

        const itemId = getId(state.items[newIndex]);
        eventBus.emit('item:focused', newIndex, itemId);
      } else if (state.wrap) {
        // Wrap to bottom: find the corresponding column in the last row
        const currentCol = state.focusedIndex % state.columns;
        const totalRows = Math.ceil(state.items.length / state.columns);
        const lastRowStartIndex = (totalRows - 1) * state.columns;
        const wrappedIndex = Math.min(lastRowStartIndex + currentCol, state.items.length - 1);

        set((prevState) => ({
          ...prevState,
          focusedIndex: wrappedIndex,
        }));

        const itemId = getId(state.items[wrappedIndex]);
        eventBus.emit('item:focused', wrappedIndex, itemId);
      }
    },

    navigateDown: () => {
      const state = get();

      if (state.items.length === 0) {
        console.warn('Cannot navigate: grid is empty');
        return;
      }

      const newIndex = state.focusedIndex + state.columns;

      if (newIndex < state.items.length) {
        // Move down one row
        set((prevState) => ({
          ...prevState,
          focusedIndex: newIndex,
        }));

        const itemId = getId(state.items[newIndex]);
        eventBus.emit('item:focused', newIndex, itemId);
      } else if (state.wrap) {
        // Wrap to top: find the corresponding column in the first row
        const currentCol = state.focusedIndex % state.columns;
        const wrappedIndex = Math.min(currentCol, state.items.length - 1);

        set((prevState) => ({
          ...prevState,
          focusedIndex: wrappedIndex,
        }));

        const itemId = getId(state.items[wrappedIndex]);
        eventBus.emit('item:focused', wrappedIndex, itemId);
      }
    },

    navigateLeft: () => {
      const state = get();

      if (state.items.length === 0) {
        console.warn('Cannot navigate: grid is empty');
        return;
      }

      const newIndex = state.focusedIndex - 1;

      if (newIndex >= 0) {
        // Move to previous item
        set((prevState) => ({
          ...prevState,
          focusedIndex: newIndex,
        }));

        const itemId = getId(state.items[newIndex]);
        eventBus.emit('item:focused', newIndex, itemId);
      } else if (state.wrap) {
        // Wrap to last item
        const wrappedIndex = state.items.length - 1;

        set((prevState) => ({
          ...prevState,
          focusedIndex: wrappedIndex,
        }));

        const itemId = getId(state.items[wrappedIndex]);
        eventBus.emit('item:focused', wrappedIndex, itemId);
      }
    },

    navigateRight: () => {
      const state = get();

      if (state.items.length === 0) {
        console.warn('Cannot navigate: grid is empty');
        return;
      }

      const newIndex = state.focusedIndex + 1;

      if (newIndex < state.items.length) {
        // Move to next item
        set((prevState) => ({
          ...prevState,
          focusedIndex: newIndex,
        }));

        const itemId = getId(state.items[newIndex]);
        eventBus.emit('item:focused', newIndex, itemId);
      } else if (state.wrap) {
        // Wrap to first item
        const wrappedIndex = 0;

        set((prevState) => ({
          ...prevState,
          focusedIndex: wrappedIndex,
        }));

        const itemId = getId(state.items[wrappedIndex]);
        eventBus.emit('item:focused', wrappedIndex, itemId);
      }
    },

    setBreakpoints: (newBreakpoints: Breakpoint[]) => {
      if (!newBreakpoints || newBreakpoints.length === 0) {
        console.error('At least one breakpoint must be provided');
        return;
      }

      // Sort and validate breakpoints
      const sorted = [...newBreakpoints].sort((a, b) => a.minWidth - b.minWidth);

      for (const bp of sorted) {
        if (bp.minWidth < 0 || bp.columns <= 0) {
          console.error('Breakpoints must have non-negative minWidth and positive columns');
          return;
        }
      }

      const state = get();
      const newBreakpoint = calculateBreakpoint(state.viewportWidth);

      set((prevState) => ({
        ...prevState,
        breakpoint: newBreakpoint,
        columns: newBreakpoint.columns,
      }));

      eventBus.emit('breakpoint:changed', newBreakpoint, newBreakpoint.columns);
    },

    updateViewportWidth: (width: number) => {
      const state = get();
      const newBreakpoint = calculateBreakpoint(width);

      // Check if breakpoint changed
      const breakpointChanged = newBreakpoint.minWidth !== state.breakpoint.minWidth ||
                                newBreakpoint.columns !== state.breakpoint.columns;

      set((prevState) => ({
        ...prevState,
        viewportWidth: width,
        breakpoint: newBreakpoint,
        columns: newBreakpoint.columns,
      }));

      if (breakpointChanged) {
        eventBus.emit('breakpoint:changed', newBreakpoint, newBreakpoint.columns);
      }
    },

    setItems: (newItems: T[]) => {
      // Update list selection with new items
      // Note: We need to recreate the selection behavior with new items
      // For now, we'll clear the selection when items change
      listSelection.actions.clearSelection();

      set((prevState) => ({
        ...prevState,
        items: [...newItems],
        selectedItems: [],
        focusedIndex: Math.min(prevState.focusedIndex, newItems.length - 1),
      }));
    },

    setFocusedIndex: (index: number) => {
      const state = get();

      if (index < 0 || index >= state.items.length) {
        console.warn(`Invalid focused index: ${index}`);
        return;
      }

      set((prevState) => ({
        ...prevState,
        focusedIndex: index,
      }));

      const itemId = getId(state.items[index]);
      eventBus.emit('item:focused', index, itemId);
    },
  }));

  // Subscribe to list selection changes to keep state in sync
  const unsubscribeSelection = listSelection.subscribe((selectionState) => {
    const currentState = store.getState();
    if (JSON.stringify(currentState.selectedItems) !== JSON.stringify(selectionState.selectedIds)) {
      // Update the store state directly through actions
      // This is handled by the selectItem action, so we don't need to do anything here
    }
  });

  // Override destroy to clean up both store and list selection
  const originalDestroy = store.destroy;
  const destroy = () => {
    unsubscribeSelection();
    listSelection.destroy();
    originalDestroy();
  };

  return {
    getState: store.getState,
    subscribe: store.subscribe,
    actions: store.actions,
    eventBus,
    destroy,
  };
}
