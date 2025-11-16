import { createStore, type Store } from '@web-loom/store-core';

/**
 * Represents the type of a toast notification.
 */
export type ToastType = 'info' | 'success' | 'warning' | 'error';

/**
 * Represents a toast notification.
 */
export interface Toast {
  /**
   * Unique identifier for the toast.
   */
  id: string;

  /**
   * The message to display in the toast.
   */
  message: string;

  /**
   * The type of toast notification.
   */
  type: ToastType;

  /**
   * Duration in milliseconds before the toast auto-removes.
   */
  duration: number;

  /**
   * Timestamp when the toast was created.
   */
  createdAt: number;
}

/**
 * Represents the state of a toast queue pattern.
 */
export interface ToastQueueState {
  /**
   * Array of all toasts (visible and queued).
   */
  toasts: Toast[];

  /**
   * Maximum number of toasts to display at once.
   */
  maxVisible: number;

  /**
   * Default duration in milliseconds for toasts.
   */
  defaultDuration: number;
}

/**
 * Actions available for controlling the toast queue pattern.
 */
export interface ToastQueueActions {
  /**
   * Adds a toast to the queue.
   * @param toast Toast data without id and createdAt (auto-generated).
   * @returns The unique ID of the created toast.
   */
  addToast: (toast: Omit<Toast, 'id' | 'createdAt'>) => string;

  /**
   * Removes a specific toast from the queue.
   * @param id The ID of the toast to remove.
   */
  removeToast: (id: string) => void;

  /**
   * Clears all toasts from the queue.
   */
  clearAllToasts: () => void;
}

/**
 * Options for configuring the toast queue pattern.
 */
export interface ToastQueueOptions {
  /**
   * Maximum number of toasts to display at once.
   * @default 3
   */
  maxVisible?: number;

  /**
   * Default duration in milliseconds for toasts.
   * @default 5000
   */
  defaultDuration?: number;

  /**
   * Optional callback invoked when a toast is added.
   * @param toast The toast that was added.
   */
  onToastAdded?: (toast: Toast) => void;

  /**
   * Optional callback invoked when a toast is removed.
   * @param toastId The ID of the toast that was removed.
   */
  onToastRemoved?: (toastId: string) => void;
}

/**
 * The toast queue pattern interface returned by createToastQueue.
 */
export interface ToastQueueBehavior {
  /**
   * Gets the current state of the toast queue.
   */
  getState: () => ToastQueueState;

  /**
   * Subscribes to state changes.
   * @param listener Function called when state changes.
   * @returns Unsubscribe function.
   */
  subscribe: (listener: (state: ToastQueueState) => void) => () => void;

  /**
   * Actions for controlling the toast queue.
   */
  actions: ToastQueueActions;

  /**
   * Destroys the behavior and cleans up subscriptions and timers.
   */
  destroy: () => void;
}

/**
 * Creates a toast queue pattern for managing temporary notifications.
 * 
 * This pattern manages a queue of toast notifications with automatic removal
 * after a specified duration. It supports limiting the number of visible toasts
 * and queuing additional toasts until space becomes available.
 * 
 * @example
 * ```typescript
 * const toastQueue = createToastQueue({
 *   maxVisible: 3,
 *   defaultDuration: 5000,
 *   onToastAdded: (toast) => {
 *     console.log('Toast added:', toast.message);
 *   },
 *   onToastRemoved: (toastId) => {
 *     console.log('Toast removed:', toastId);
 *   },
 * });
 * 
 * // Add toasts
 * const id1 = toastQueue.actions.addToast({
 *   message: 'Operation successful!',
 *   type: 'success',
 *   duration: 3000,
 * });
 * 
 * const id2 = toastQueue.actions.addToast({
 *   message: 'Warning: Low disk space',
 *   type: 'warning',
 *   duration: 5000,
 * });
 * 
 * // Add toast with default duration
 * const id3 = toastQueue.actions.addToast({
 *   message: 'Information message',
 *   type: 'info',
 *   duration: 5000, // Uses defaultDuration if not specified
 * });
 * 
 * // Remove a specific toast
 * toastQueue.actions.removeToast(id1);
 * 
 * // Clear all toasts
 * toastQueue.actions.clearAllToasts();
 * 
 * // Clean up
 * toastQueue.destroy();
 * ```
 * 
 * @param options Configuration options for the toast queue pattern.
 * @returns A toast queue pattern instance.
 */
export function createToastQueue(options?: ToastQueueOptions): ToastQueueBehavior {
  const maxVisible = options?.maxVisible ?? 3;
  const defaultDuration = options?.defaultDuration ?? 5000;

  // Map to store timeout IDs for auto-removal
  const timeoutIds = new Map<string, ReturnType<typeof setTimeout>>();

  // Counter for generating unique IDs
  let idCounter = 0;

  // Helper function to generate unique toast ID
  const generateId = (): string => {
    idCounter += 1;
    return `toast-${Date.now()}-${idCounter}`;
  };

  // Helper function to schedule auto-removal of a toast
  const scheduleRemoval = (toastId: string, duration: number, removeAction: () => void) => {
    // Clear existing timeout if any
    const existingTimeout = timeoutIds.get(toastId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Schedule new timeout
    const timeoutId = setTimeout(() => {
      removeAction();
      timeoutIds.delete(toastId);
    }, duration);

    timeoutIds.set(toastId, timeoutId);
  };

  // Create store for toast queue state
  const initialState: ToastQueueState = {
    toasts: [],
    maxVisible,
    defaultDuration,
  };

  const store: Store<ToastQueueState, ToastQueueActions> = createStore<
    ToastQueueState,
    ToastQueueActions
  >(initialState, (set, get, actions) => ({
    addToast: (toastData: Omit<Toast, 'id' | 'createdAt'>) => {
      const id = generateId();
      const toast: Toast = {
        id,
        message: toastData.message,
        type: toastData.type,
        duration: toastData.duration,
        createdAt: Date.now(),
      };

      // Add toast to queue
      set((state) => ({
        ...state,
        toasts: [...state.toasts, toast],
      }));

      // Schedule auto-removal
      scheduleRemoval(id, toast.duration, () => {
        actions.removeToast(id);
      });

      // Invoke callback
      if (options?.onToastAdded) {
        options.onToastAdded(toast);
      }

      return id;
    },

    removeToast: (id: string) => {
      const state = get();

      // Check if toast exists
      const toastExists = state.toasts.some((t) => t.id === id);
      if (!toastExists) {
        return;
      }

      // Clear timeout for this toast
      const timeoutId = timeoutIds.get(id);
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutIds.delete(id);
      }

      // Remove toast from queue
      set((state) => ({
        ...state,
        toasts: state.toasts.filter((t) => t.id !== id),
      }));

      // Invoke callback
      if (options?.onToastRemoved) {
        options.onToastRemoved(id);
      }
    },

    clearAllToasts: () => {
      const state = get();

      // Clear all timeouts
      state.toasts.forEach((toast) => {
        const timeoutId = timeoutIds.get(toast.id);
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutIds.delete(toast.id);
        }
      });

      // Clear all toasts
      set((state) => ({
        ...state,
        toasts: [],
      }));

      // Invoke callbacks for each removed toast
      if (options?.onToastRemoved) {
        const callback = options.onToastRemoved;
        state.toasts.forEach((toast) => {
          callback(toast.id);
        });
      }
    },
  }));

  return {
    getState: store.getState,
    subscribe: store.subscribe,
    actions: store.actions,
    destroy: () => {
      // Clear all timeouts
      timeoutIds.forEach((timeoutId) => clearTimeout(timeoutId));
      timeoutIds.clear();
      store.destroy();
    },
  };
}
