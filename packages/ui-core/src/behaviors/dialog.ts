import { createStore, type Store } from '@web-loom/store-core';

/**
 * Represents the state of a dialog behavior.
 */
export interface DialogState {
  /**
   * Whether the dialog is currently open.
   */
  isOpen: boolean;

  /**
   * The content to display in the dialog.
   * Can be any type of data that the consumer wants to pass.
   */
  content: any;

  /**
   * Optional unique identifier for the dialog.
   */
  id: string | null;
}

/**
 * Actions available for controlling the dialog behavior.
 */
export interface DialogActions {
  /**
   * Opens the dialog with the specified content.
   * @param content The content to display in the dialog.
   */
  open: (content: any) => void;

  /**
   * Closes the dialog.
   */
  close: () => void;

  /**
   * Toggles the dialog open/closed state.
   * @param content Optional content to set when opening the dialog.
   */
  toggle: (content?: any) => void;
}

/**
 * Options for configuring the dialog behavior.
 */
export interface DialogBehaviorOptions {
  /**
   * Optional unique identifier for the dialog.
   */
  id?: string;

  /**
   * Optional callback invoked when the dialog opens.
   * @param content The content passed to the open action.
   */
  onOpen?: (content: any) => void;

  /**
   * Optional callback invoked when the dialog closes.
   */
  onClose?: () => void;
}

/**
 * The dialog behavior interface returned by createDialogBehavior.
 */
export interface DialogBehavior {
  /**
   * Gets the current state of the dialog.
   */
  getState: () => DialogState;

  /**
   * Subscribes to state changes.
   * @param listener Function called when state changes.
   * @returns Unsubscribe function.
   */
  subscribe: (listener: (state: DialogState) => void) => () => void;

  /**
   * Actions for controlling the dialog.
   */
  actions: DialogActions;

  /**
   * Destroys the behavior and cleans up subscriptions.
   */
  destroy: () => void;
}

/**
 * Creates a dialog behavior for managing modal dialog state.
 *
 * @example
 * ```typescript
 * const dialog = createDialogBehavior({
 *   id: 'settings-dialog',
 *   onOpen: (content) => console.log('Dialog opened with:', content),
 *   onClose: () => console.log('Dialog closed'),
 * });
 *
 * // Open the dialog
 * dialog.actions.open({ title: 'Settings', tab: 'general' });
 *
 * // Check state
 * console.log(dialog.getState().isOpen); // true
 *
 * // Close the dialog
 * dialog.actions.close();
 *
 * // Clean up
 * dialog.destroy();
 * ```
 *
 * @param options Configuration options for the dialog behavior.
 * @returns A dialog behavior instance.
 */
export function createDialogBehavior(options?: DialogBehaviorOptions): DialogBehavior {
  const initialState: DialogState = {
    isOpen: false,
    content: null,
    id: options?.id || null,
  };

  const store: Store<DialogState, DialogActions> = createStore<DialogState, DialogActions>(
    initialState,
    (set, get, actions) => ({
      open: (content: any) => {
        set((state) => ({
          ...state,
          isOpen: true,
          content,
        }));

        // Invoke onOpen callback if provided
        if (options?.onOpen) {
          options.onOpen(content);
        }
      },

      close: () => {
        set((state) => ({
          ...state,
          isOpen: false,
          content: null,
        }));

        // Invoke onClose callback if provided
        if (options?.onClose) {
          options.onClose();
        }
      },

      toggle: (content?: any) => {
        const currentState = get();
        if (currentState.isOpen) {
          actions.close();
        } else {
          actions.open(content !== undefined ? content : null);
        }
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
