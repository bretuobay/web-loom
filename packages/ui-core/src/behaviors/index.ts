/**
 * UI Core Behaviors
 *
 * This module exports all atomic UI interaction behaviors.
 * Each behavior is framework-agnostic and can be used with any UI framework
 * or vanilla JavaScript.
 */

export {
  createDialogBehavior,
  type DialogBehavior,
  type DialogState,
  type DialogActions,
  type DialogBehaviorOptions,
} from './dialog';

export {
  createRovingFocus,
  type RovingFocusBehavior,
  type RovingFocusState,
  type RovingFocusActions,
  type RovingFocusOptions,
} from './roving-focus';

export {
  createListSelection,
  type ListSelectionBehavior,
  type ListSelectionState,
  type ListSelectionActions,
  type ListSelectionOptions,
  type SelectionMode,
} from './list-selection';

export {
  createDisclosureBehavior,
  type DisclosureBehavior,
  type DisclosureState,
  type DisclosureActions,
  type DisclosureBehaviorOptions,
} from './disclosure';

export {
  createFormBehavior,
  type FormBehavior,
  type FormState,
  type FormActions,
  type FormBehaviorOptions,
  type FieldConfig,
  type ValidationFunction,
} from './form';

export {
  createKeyboardShortcuts,
  type KeyboardShortcutsBehavior,
  type KeyboardShortcutsState,
  type KeyboardShortcutsActions,
  type KeyboardShortcutsOptions,
  type KeyboardShortcut,
} from './keyboard-shortcuts';

export {
  createUndoRedoStack,
  type UndoRedoStackBehavior,
  type UndoRedoStackState,
  type UndoRedoStackActions,
  type UndoRedoStackOptions,
} from './undo-redo-stack';

export {
  createDragDropBehavior,
  type DragDropBehavior,
  type DragDropState,
  type DragDropActions,
  type DragDropOptions,
} from './drag-drop';
