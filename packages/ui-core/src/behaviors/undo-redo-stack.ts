import { createStore, type Store } from '@web-loom/store-core';

/**
 * Represents the state of an undo/redo stack behavior.
 * @template T The type of state being tracked in the history.
 */
export interface UndoRedoStackState<T> {
  /**
   * Array of past states (oldest to most recent).
   */
  past: T[];

  /**
   * The current state.
   */
  present: T;

  /**
   * Array of future states (next to furthest).
   */
  future: T[];

  /**
   * Whether undo is available (past is not empty).
   */
  canUndo: boolean;

  /**
   * Whether redo is available (future is not empty).
   */
  canRedo: boolean;

  /**
   * Maximum number of states to keep in history.
   */
  maxLength: number;
}

/**
 * Actions available for controlling the undo/redo stack behavior.
 * @template T The type of state being tracked in the history.
 */
export interface UndoRedoStackActions<T> {
  /**
   * Moves to the previous state in history.
   * No-op if past is empty.
   */
  undo: () => void;

  /**
   * Moves to the next state in history.
   * No-op if future is empty.
   */
  redo: () => void;

  /**
   * Pushes a new state onto the history stack.
   * Clears the future array and adds current state to past.
   * @param state The new state to push.
   */
  pushState: (state: T) => void;

  /**
   * Clears all history (past and future), keeping only the present state.
   */
  clearHistory: () => void;

  /**
   * Jumps to a specific state in the combined history.
   * @param index The index in the combined history (past + present + future).
   */
  jumpToState: (index: number) => void;

  /**
   * Sets the maximum length of the history.
   * @param length The new maximum length.
   */
  setMaxLength: (length: number) => void;
}

/**
 * Options for configuring the undo/redo stack behavior.
 * @template T The type of state being tracked in the history.
 */
export interface UndoRedoStackOptions<T> {
  /**
   * The initial state to start with.
   */
  initialState: T;

  /**
   * Maximum number of states to keep in history.
   * When exceeded, the oldest state is removed.
   * @default 50
   */
  maxLength?: number;

  /**
   * Optional callback invoked when the present state changes.
   * @param state The new present state.
   */
  onStateChange?: (state: T) => void;
}

/**
 * The undo/redo stack behavior interface returned by createUndoRedoStack.
 * @template T The type of state being tracked in the history.
 */
export interface UndoRedoStackBehavior<T> {
  /**
   * Gets the current state of the undo/redo stack.
   */
  getState: () => UndoRedoStackState<T>;

  /**
   * Subscribes to state changes.
   * @param listener Function called when state changes.
   * @returns Unsubscribe function.
   */
  subscribe: (listener: (state: UndoRedoStackState<T>) => void) => () => void;

  /**
   * Actions for controlling the undo/redo stack.
   */
  actions: UndoRedoStackActions<T>;

  /**
   * Destroys the behavior and cleans up subscriptions.
   */
  destroy: () => void;
}

/**
 * Creates an undo/redo stack behavior for managing state history.
 *
 * This behavior maintains an immutable history of states with undo/redo operations,
 * supporting time-travel debugging and state persistence. The history is bounded
 * by a configurable maximum length to prevent unbounded memory growth.
 *
 * @example
 * ```typescript
 * interface EditorState {
 *   content: string;
 *   cursor: number;
 * }
 *
 * const undoRedo = createUndoRedoStack<EditorState>({
 *   initialState: { content: '', cursor: 0 },
 *   maxLength: 100,
 *   onStateChange: (state) => console.log('State changed:', state),
 * });
 *
 * // Push new states
 * undoRedo.actions.pushState({ content: 'Hello', cursor: 5 });
 * undoRedo.actions.pushState({ content: 'Hello World', cursor: 11 });
 *
 * // Undo
 * undoRedo.actions.undo();
 * console.log(undoRedo.getState().present); // { content: 'Hello', cursor: 5 }
 *
 * // Redo
 * undoRedo.actions.redo();
 * console.log(undoRedo.getState().present); // { content: 'Hello World', cursor: 11 }
 *
 * // Clean up
 * undoRedo.destroy();
 * ```
 *
 * @template T The type of state being tracked in the history.
 * @param options Configuration options for the undo/redo stack behavior.
 * @returns An undo/redo stack behavior instance.
 */
export function createUndoRedoStack<T>(options: UndoRedoStackOptions<T>): UndoRedoStackBehavior<T> {
  const maxLength = options.maxLength ?? 50;

  const initialState: UndoRedoStackState<T> = {
    past: [],
    present: options.initialState,
    future: [],
    canUndo: false,
    canRedo: false,
    maxLength,
  };

  const store: Store<UndoRedoStackState<T>, UndoRedoStackActions<T>> = createStore<
    UndoRedoStackState<T>,
    UndoRedoStackActions<T>
  >(initialState, (set, get) => ({
    undo: () => {
      const state = get();
      if (state.past.length === 0) {
        console.warn('Cannot undo: no past states');
        return;
      }

      const previous = state.past[state.past.length - 1];
      const newPast = state.past.slice(0, -1);

      set(() => ({
        past: newPast,
        present: previous,
        future: [state.present, ...state.future],
        canUndo: newPast.length > 0,
        canRedo: true,
        maxLength: state.maxLength,
      }));

      // Invoke onStateChange callback if provided
      if (options.onStateChange) {
        options.onStateChange(previous);
      }
    },

    redo: () => {
      const state = get();
      if (state.future.length === 0) {
        console.warn('Cannot redo: no future states');
        return;
      }

      const next = state.future[0];
      const newFuture = state.future.slice(1);

      set(() => ({
        past: [...state.past, state.present],
        present: next,
        future: newFuture,
        canUndo: true,
        canRedo: newFuture.length > 0,
        maxLength: state.maxLength,
      }));

      // Invoke onStateChange callback if provided
      if (options.onStateChange) {
        options.onStateChange(next);
      }
    },

    pushState: (newState: T) => {
      const state = get();

      // Add current state to past
      let newPast = [...state.past, state.present];

      // Enforce maxLength by removing oldest states
      if (newPast.length > state.maxLength) {
        newPast = newPast.slice(newPast.length - state.maxLength);
      }

      set(() => ({
        past: newPast,
        present: newState,
        future: [], // Clear future when pushing new state
        canUndo: true,
        canRedo: false,
        maxLength: state.maxLength,
      }));

      // Invoke onStateChange callback if provided
      if (options.onStateChange) {
        options.onStateChange(newState);
      }
    },

    clearHistory: () => {
      const state = get();

      set(() => ({
        past: [],
        present: state.present,
        future: [],
        canUndo: false,
        canRedo: false,
        maxLength: state.maxLength,
      }));
    },

    jumpToState: (index: number) => {
      const state = get();

      // Build combined history: past + present + future
      const allStates = [...state.past, state.present, ...state.future];

      if (index < 0 || index >= allStates.length) {
        console.error(`Cannot jump to state: index ${index} out of bounds (0-${allStates.length - 1})`);
        return;
      }

      const targetState = allStates[index];
      const newPast = allStates.slice(0, index);
      const newFuture = allStates.slice(index + 1);

      set(() => ({
        past: newPast,
        present: targetState,
        future: newFuture,
        canUndo: newPast.length > 0,
        canRedo: newFuture.length > 0,
        maxLength: state.maxLength,
      }));

      // Invoke onStateChange callback if provided
      if (options.onStateChange) {
        options.onStateChange(targetState);
      }
    },

    setMaxLength: (length: number) => {
      const state = get();

      if (length < 1) {
        console.error('maxLength must be at least 1');
        return;
      }

      let newPast = state.past;

      // If new length is smaller, trim the oldest states
      if (newPast.length > length) {
        newPast = newPast.slice(newPast.length - length);
      }

      set(() => ({
        ...state,
        past: newPast,
        maxLength: length,
        canUndo: newPast.length > 0,
      }));
    },
  }));

  return {
    getState: store.getState,
    subscribe: store.subscribe,
    actions: store.actions,
    destroy: store.destroy,
  };
}
