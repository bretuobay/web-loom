import { createStore, type Store } from '@web-loom/store-core';

/**
 * Represents the state of a drag-and-drop behavior.
 */
export interface DragDropState {
  /**
   * The identifier of the currently dragged item, or null if nothing is being dragged.
   */
  draggedItem: string | null;

  /**
   * The identifier of the current drop target, or null if no valid target.
   */
  dropTarget: string | null;

  /**
   * Whether a drag operation is currently in progress.
   */
  isDragging: boolean;

  /**
   * Arbitrary data associated with the dragged item.
   */
  dragData: any;

  /**
   * Array of registered drop zone identifiers.
   */
  dropZones: string[];

  /**
   * The drop zone currently being hovered over, or null.
   */
  dragOverZone: string | null;
}

/**
 * Actions available for controlling the drag-and-drop behavior.
 */
export interface DragDropActions {
  /**
   * Starts a drag operation.
   * @param itemId The identifier of the item being dragged.
   * @param data Optional data to associate with the drag operation.
   */
  startDrag: (itemId: string, data?: any) => void;

  /**
   * Ends the current drag operation.
   */
  endDrag: () => void;

  /**
   * Sets the current drop target.
   * @param targetId The identifier of the drop target, or null to clear.
   */
  setDropTarget: (targetId: string | null) => void;

  /**
   * Performs a drop operation on the specified target.
   * @param targetId The identifier of the drop target.
   */
  drop: (targetId: string) => void;

  /**
   * Registers a drop zone.
   * @param zoneId The identifier of the drop zone to register.
   */
  registerDropZone: (zoneId: string) => void;

  /**
   * Unregisters a drop zone.
   * @param zoneId The identifier of the drop zone to unregister.
   */
  unregisterDropZone: (zoneId: string) => void;

  /**
   * Sets the drop zone currently being dragged over.
   * @param zoneId The identifier of the drop zone, or null to clear.
   */
  setDragOver: (zoneId: string | null) => void;
}

/**
 * Options for configuring the drag-and-drop behavior.
 */
export interface DragDropOptions {
  /**
   * Optional callback invoked when a drag operation starts.
   * @param itemId The identifier of the dragged item.
   * @param data The data associated with the drag operation.
   */
  onDragStart?: (itemId: string, data: any) => void;

  /**
   * Optional callback invoked when a drag operation ends.
   * @param itemId The identifier of the dragged item.
   */
  onDragEnd?: (itemId: string) => void;

  /**
   * Optional callback invoked when a drop operation occurs.
   * @param draggedItem The identifier of the dragged item.
   * @param dropTarget The identifier of the drop target.
   * @param data The data associated with the drag operation.
   */
  onDrop?: (draggedItem: string, dropTarget: string, data: any) => void;

  /**
   * Optional validation function to determine if a drop is allowed.
   * @param draggedItem The identifier of the dragged item.
   * @param dropTarget The identifier of the drop target.
   * @returns True if the drop is allowed, false otherwise.
   */
  validateDrop?: (draggedItem: string, dropTarget: string) => boolean;
}

/**
 * The drag-and-drop behavior interface returned by createDragDropBehavior.
 */
export interface DragDropBehavior {
  /**
   * Gets the current state of the drag-and-drop behavior.
   */
  getState: () => DragDropState;

  /**
   * Subscribes to state changes.
   * @param listener Function called when state changes.
   * @returns Unsubscribe function.
   */
  subscribe: (listener: (state: DragDropState) => void) => () => void;

  /**
   * Actions for controlling the drag-and-drop behavior.
   */
  actions: DragDropActions;

  /**
   * Destroys the behavior and cleans up subscriptions.
   */
  destroy: () => void;
}

/**
 * Creates a drag-and-drop behavior for managing drag-and-drop interaction state.
 *
 * This behavior manages drag state including drag source, drop target, drag data,
 * and reordering logic. It provides a framework-agnostic way to implement
 * drag-and-drop functionality with support for validation and keyboard alternatives.
 *
 * @example
 * ```typescript
 * const dragDrop = createDragDropBehavior({
 *   onDragStart: (itemId, data) => console.log('Drag started:', itemId),
 *   onDragEnd: (itemId) => console.log('Drag ended:', itemId),
 *   onDrop: (draggedItem, dropTarget, data) => {
 *     console.log('Dropped', draggedItem, 'on', dropTarget);
 *   },
 *   validateDrop: (draggedItem, dropTarget) => {
 *     // Custom validation logic
 *     return dropTarget !== 'restricted-zone';
 *   },
 * });
 *
 * // Register drop zones
 * dragDrop.actions.registerDropZone('zone-1');
 * dragDrop.actions.registerDropZone('zone-2');
 *
 * // Start dragging
 * dragDrop.actions.startDrag('item-1', { type: 'card', priority: 'high' });
 *
 * // Set drop target
 * dragDrop.actions.setDropTarget('zone-1');
 *
 * // Perform drop
 * dragDrop.actions.drop('zone-1');
 *
 * // Clean up
 * dragDrop.destroy();
 * ```
 *
 * @param options Configuration options for the drag-and-drop behavior.
 * @returns A drag-and-drop behavior instance.
 */
export function createDragDropBehavior(options?: DragDropOptions): DragDropBehavior {
  const initialState: DragDropState = {
    draggedItem: null,
    dropTarget: null,
    isDragging: false,
    dragData: null,
    dropZones: [],
    dragOverZone: null,
  };

  const store: Store<DragDropState, DragDropActions> = createStore<DragDropState, DragDropActions>(
    initialState,
    (set, get) => ({
      startDrag: (itemId: string, data?: any) => {
        const state = get();

        if (state.isDragging) {
          console.warn('Cannot start drag: drag operation already in progress');
          return;
        }

        set(() => ({
          ...state,
          draggedItem: itemId,
          isDragging: true,
          dragData: data ?? null,
        }));

        // Invoke onDragStart callback if provided
        if (options?.onDragStart) {
          options.onDragStart(itemId, data ?? null);
        }
      },

      endDrag: () => {
        const state = get();

        if (!state.isDragging) {
          console.warn('Cannot end drag: no active drag operation');
          return;
        }

        const draggedItem = state.draggedItem;

        set(() => ({
          draggedItem: null,
          dropTarget: null,
          isDragging: false,
          dragData: null,
          dropZones: state.dropZones,
          dragOverZone: null,
        }));

        // Invoke onDragEnd callback if provided
        if (options?.onDragEnd && draggedItem) {
          options.onDragEnd(draggedItem);
        }
      },

      setDropTarget: (targetId: string | null) => {
        const state = get();

        set(() => ({
          ...state,
          dropTarget: targetId,
        }));
      },

      drop: (targetId: string) => {
        const state = get();

        // Validate that we're currently dragging
        if (!state.isDragging) {
          console.warn('Cannot drop: no active drag operation');
          return;
        }

        // Validate that the target is a registered drop zone
        if (!state.dropZones.includes(targetId)) {
          console.error(`Invalid drop target: ${targetId} is not a registered drop zone`);
          return;
        }

        // Validate drop using custom validation function if provided
        if (options?.validateDrop && state.draggedItem) {
          const isValid = options.validateDrop(state.draggedItem, targetId);
          if (!isValid) {
            console.warn(`Drop validation failed for ${state.draggedItem} on ${targetId}`);
            return;
          }
        }

        // Invoke onDrop callback if provided
        if (options?.onDrop && state.draggedItem) {
          options.onDrop(state.draggedItem, targetId, state.dragData);
        }

        // End the drag operation
        const draggedItem = state.draggedItem;
        set(() => ({
          draggedItem: null,
          dropTarget: null,
          isDragging: false,
          dragData: null,
          dropZones: state.dropZones,
          dragOverZone: null,
        }));

        // Invoke onDragEnd callback if provided
        if (options?.onDragEnd && draggedItem) {
          options.onDragEnd(draggedItem);
        }
      },

      registerDropZone: (zoneId: string) => {
        const state = get();

        if (state.dropZones.includes(zoneId)) {
          console.warn(`Drop zone ${zoneId} is already registered`);
          return;
        }

        set(() => ({
          ...state,
          dropZones: [...state.dropZones, zoneId],
        }));
      },

      unregisterDropZone: (zoneId: string) => {
        const state = get();

        if (!state.dropZones.includes(zoneId)) {
          console.warn(`Drop zone ${zoneId} is not registered`);
          return;
        }

        set(() => ({
          ...state,
          dropZones: state.dropZones.filter((id) => id !== zoneId),
        }));
      },

      setDragOver: (zoneId: string | null) => {
        const state = get();

        set(() => ({
          ...state,
          dragOverZone: zoneId,
        }));
      },
    }),
  );

  return {
    getState: store.getState,
    subscribe: store.subscribe,
    actions: store.actions,
    destroy: store.destroy,
  };
}
