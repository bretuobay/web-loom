import { createStore, type Store } from '@web-loom/store-core';
import { createEventBus, type EventBus } from '@web-loom/event-bus-core';
import { createDialogBehavior, type DialogBehavior } from '@web-loom/ui-core';

/**
 * Represents a modal in the stack.
 */
export interface Modal {
  /**
   * Unique identifier for the modal.
   */
  id: string;

  /**
   * The content to display in the modal.
   */
  content: any;

  /**
   * Priority for stacking order (higher priority appears on top).
   * @default 0
   */
  priority: number;

  /**
   * Whether the modal should close when the Escape key is pressed.
   * @default false
   */
  closeOnEscape?: boolean;

  /**
   * Whether the modal should close when the backdrop is clicked.
   * @default false
   */
  closeOnBackdropClick?: boolean;
}

/**
 * Represents the state of a modal pattern.
 */
export interface ModalState {
  /**
   * Stack of open modals, ordered by priority and open order.
   */
  stack: Modal[];

  /**
   * The ID of the topmost modal, or null if no modals are open.
   */
  topModalId: string | null;
}

/**
 * Configuration options for opening a modal.
 */
export interface OpenModalConfig {
  /**
   * Unique identifier for the modal.
   */
  id: string;

  /**
   * The content to display in the modal.
   */
  content: any;

  /**
   * Optional priority for stacking order (default: 0).
   */
  priority?: number;

  /**
   * Whether the modal should close when the Escape key is pressed.
   * @default false
   */
  closeOnEscape?: boolean;

  /**
   * Whether the modal should close when the backdrop is clicked.
   * @default false
   */
  closeOnBackdropClick?: boolean;
}

/**
 * Actions available for controlling the modal pattern.
 */
export interface ModalActions {
  /**
   * Opens a modal and adds it to the stack.
   * @param id Unique identifier for the modal.
   * @param content The content to display in the modal.
   * @param priority Optional priority for stacking order (default: 0).
   */
  openModal: (id: string, content: any, priority?: number) => void;

  /**
   * Opens a modal with configuration options.
   * @param config Configuration object for the modal.
   */
  openModalWithConfig: (config: OpenModalConfig) => void;

  /**
   * Handles escape key press for the top modal.
   */
  handleEscapeKey: () => void;

  /**
   * Handles backdrop click for a specific modal.
   * @param id The ID of the modal whose backdrop was clicked.
   */
  handleBackdropClick: (id: string) => void;

  /**
   * Closes a specific modal and removes it from the stack.
   * @param id The ID of the modal to close.
   */
  closeModal: (id: string) => void;

  /**
   * Closes the topmost modal in the stack.
   */
  closeTopModal: () => void;

  /**
   * Closes all modals and clears the stack.
   */
  closeAllModals: () => void;
}

/**
 * Event map for modal pattern events.
 */
export interface ModalEvents extends Record<string, any[]> {
  'modal:opened': [modal: Modal];
  'modal:closed': [modalId: string];
  'modal:stacked': [stack: Modal[]];
  'modal:escape-pressed': [modalId: string];
  'modal:backdrop-clicked': [modalId: string];
}

/**
 * Options for configuring the modal pattern.
 */
export interface ModalOptions {
  /**
   * Optional callback invoked when a modal is opened.
   * @param modal The modal that was opened.
   */
  onModalOpened?: (modal: Modal) => void;

  /**
   * Optional callback invoked when a modal is closed.
   * @param modalId The ID of the modal that was closed.
   */
  onModalClosed?: (modalId: string) => void;

  /**
   * Optional callback invoked when the modal stack changes.
   * @param stack The current modal stack.
   */
  onStackChange?: (stack: Modal[]) => void;
}

/**
 * The modal pattern interface returned by createModal.
 */
export interface ModalBehavior {
  /**
   * Gets the current state of the modal pattern.
   */
  getState: () => ModalState;

  /**
   * Subscribes to state changes.
   * @param listener Function called when state changes.
   * @returns Unsubscribe function.
   */
  subscribe: (listener: (state: ModalState) => void) => () => void;

  /**
   * Actions for controlling the modal pattern.
   */
  actions: ModalActions;

  /**
   * Event bus for listening to modal events.
   */
  eventBus: EventBus<ModalEvents>;

  /**
   * Destroys the behavior and cleans up subscriptions.
   */
  destroy: () => void;
}

/**
 * Creates a modal pattern with stacking support for managing multiple modals.
 * 
 * This pattern extends the dialog behavior from UI Core with modal stack management,
 * allowing multiple modals to be displayed with proper priority ordering and focus
 * management. It's ideal for complex applications that need to display multiple
 * overlays simultaneously.
 * 
 * @example
 * ```typescript
 * const modal = createModal({
 *   onModalOpened: (modal) => {
 *     console.log('Modal opened:', modal.id);
 *   },
 *   onModalClosed: (modalId) => {
 *     console.log('Modal closed:', modalId);
 *   },
 * });
 * 
 * // Listen to events
 * modal.eventBus.on('modal:opened', (modal) => {
 *   console.log('Modal opened event:', modal);
 * });
 * 
 * modal.eventBus.on('modal:escape-pressed', (modalId) => {
 *   console.log('Escape pressed on modal:', modalId);
 * });
 * 
 * modal.eventBus.on('modal:backdrop-clicked', (modalId) => {
 *   console.log('Backdrop clicked on modal:', modalId);
 * });
 * 
 * // Open modals with different priorities
 * modal.actions.openModal('settings', { title: 'Settings' }, 0);
 * modal.actions.openModal('confirm', { message: 'Are you sure?' }, 10);
 * 
 * // Open modal with escape and backdrop close options
 * modal.actions.openModalWithConfig({
 *   id: 'dialog',
 *   content: { message: 'Press Escape or click backdrop to close' },
 *   priority: 5,
 *   closeOnEscape: true,
 *   closeOnBackdropClick: true,
 * });
 * 
 * // The confirm modal appears on top due to higher priority
 * console.log(modal.getState().topModalId); // 'confirm'
 * 
 * // Handle escape key press (will close top modal if closeOnEscape is true)
 * modal.actions.handleEscapeKey();
 * 
 * // Handle backdrop click (will close modal if closeOnBackdropClick is true)
 * modal.actions.handleBackdropClick('dialog');
 * 
 * // Close the top modal
 * modal.actions.closeTopModal();
 * console.log(modal.getState().topModalId); // 'settings'
 * 
 * // Close all modals
 * modal.actions.closeAllModals();
 * console.log(modal.getState().stack.length); // 0
 * 
 * // Clean up
 * modal.destroy();
 * ```
 * 
 * @param options Configuration options for the modal pattern.
 * @returns A modal pattern instance.
 */
export function createModal(options?: ModalOptions): ModalBehavior {
  // Create event bus for modal events
  const eventBus = createEventBus<ModalEvents>();

  // Create a base dialog behavior for each modal
  // We'll manage multiple dialog instances internally
  const dialogBehaviors = new Map<string, DialogBehavior>();

  // Helper function to sort stack by priority (higher first) and then by order
  const sortStack = (stack: Modal[]): Modal[] => {
    return [...stack].sort((a, b) => {
      // Higher priority comes first
      if (b.priority !== a.priority) {
        return b.priority - a.priority;
      }
      // If priorities are equal, maintain insertion order (already in array)
      return 0;
    });
  };

  // Helper function to get top modal ID from stack
  const getTopModalId = (stack: Modal[]): string | null => {
    if (stack.length === 0) return null;
    const sorted = sortStack(stack);
    return sorted[0].id;
  };

  // Create store for modal state
  const initialState: ModalState = {
    stack: [],
    topModalId: null,
  };

  const store: Store<ModalState, ModalActions> = createStore<ModalState, ModalActions>(
    initialState,
    (set, get) => ({
      openModal: (id: string, content: any, priority: number = 0) => {
        // Delegate to openModalWithConfig for backward compatibility
        store.actions.openModalWithConfig({
          id,
          content,
          priority,
          closeOnEscape: false,
          closeOnBackdropClick: false,
        });
      },

      openModalWithConfig: (config: OpenModalConfig) => {
        const {
          id,
          content,
          priority = 0,
          closeOnEscape = false,
          closeOnBackdropClick = false,
        } = config;

        const state = get();

        // Check if modal with this ID already exists
        const existingIndex = state.stack.findIndex((m) => m.id === id);
        if (existingIndex !== -1) {
          // Modal already open, update its content and priority
          const updatedStack = [...state.stack];
          updatedStack[existingIndex] = {
            id,
            content,
            priority,
            closeOnEscape,
            closeOnBackdropClick,
          };

          const sortedStack = sortStack(updatedStack);
          const topModalId = getTopModalId(sortedStack);

          set(() => ({
            stack: sortedStack,
            topModalId,
          }));

          // Emit stacked event
          eventBus.emit('modal:stacked', sortedStack);

          if (options?.onStackChange) {
            options.onStackChange(sortedStack);
          }

          return;
        }

        // Create new modal
        const modal: Modal = {
          id,
          content,
          priority,
          closeOnEscape,
          closeOnBackdropClick,
        };

        // Create dialog behavior for this modal
        const dialogBehavior = createDialogBehavior({
          id,
        });

        dialogBehaviors.set(id, dialogBehavior);

        // Open the dialog
        dialogBehavior.actions.open(content);

        // Add to stack
        const newStack = [...state.stack, modal];
        const sortedStack = sortStack(newStack);
        const topModalId = getTopModalId(sortedStack);

        set(() => ({
          stack: sortedStack,
          topModalId,
        }));

        // Emit events
        eventBus.emit('modal:opened', modal);
        eventBus.emit('modal:stacked', sortedStack);

        // Invoke callbacks
        if (options?.onModalOpened) {
          options.onModalOpened(modal);
        }

        if (options?.onStackChange) {
          options.onStackChange(sortedStack);
        }
      },

      handleEscapeKey: () => {
        const state = get();
        if (!state.topModalId) {
          return;
        }

        // Find the top modal
        const topModal = state.stack.find((m) => m.id === state.topModalId);
        if (!topModal) {
          return;
        }

        // Emit escape-pressed event
        eventBus.emit('modal:escape-pressed', topModal.id);

        // Close the modal if closeOnEscape is enabled
        if (topModal.closeOnEscape) {
          store.actions.closeModal(topModal.id);
        }
      },

      handleBackdropClick: (id: string) => {
        const state = get();

        // Find the modal
        const modal = state.stack.find((m) => m.id === id);
        if (!modal) {
          return;
        }

        // Emit backdrop-clicked event
        eventBus.emit('modal:backdrop-clicked', id);

        // Close the modal if closeOnBackdropClick is enabled
        if (modal.closeOnBackdropClick) {
          store.actions.closeModal(id);
        }
      },

      closeModal: (id: string) => {
        const state = get();

        // Find modal in stack
        const modalIndex = state.stack.findIndex((m) => m.id === id);
        if (modalIndex === -1) {
          // Modal not found
          return;
        }

        // Close and destroy dialog behavior
        const dialogBehavior = dialogBehaviors.get(id);
        if (dialogBehavior) {
          dialogBehavior.actions.close();
          dialogBehavior.destroy();
          dialogBehaviors.delete(id);
        }

        // Remove from stack
        const newStack = state.stack.filter((m) => m.id !== id);
        const topModalId = getTopModalId(newStack);

        set(() => ({
          stack: newStack,
          topModalId,
        }));

        // Emit events
        eventBus.emit('modal:closed', id);
        if (newStack.length > 0) {
          eventBus.emit('modal:stacked', newStack);
        }

        // Invoke callbacks
        if (options?.onModalClosed) {
          options.onModalClosed(id);
        }

        if (options?.onStackChange) {
          options.onStackChange(newStack);
        }
      },

      closeTopModal: () => {
        const state = get();
        if (state.topModalId) {
          store.actions.closeModal(state.topModalId);
        }
      },

      closeAllModals: () => {
        const state = get();

        // Close all dialog behaviors
        state.stack.forEach((modal) => {
          const dialogBehavior = dialogBehaviors.get(modal.id);
          if (dialogBehavior) {
            dialogBehavior.actions.close();
            dialogBehavior.destroy();
          }
        });

        dialogBehaviors.clear();

        // Clear stack
        set(() => ({
          stack: [],
          topModalId: null,
        }));

        // Invoke callback
        if (options?.onStackChange) {
          options.onStackChange([]);
        }
      },
    })
  );

  return {
    getState: store.getState,
    subscribe: store.subscribe,
    actions: store.actions,
    eventBus,
    destroy: () => {
      // Clean up all dialog behaviors
      dialogBehaviors.forEach((behavior) => behavior.destroy());
      dialogBehaviors.clear();
      store.destroy();
    },
  };
}
