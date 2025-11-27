/**
 * Example: Text Editor with Undo/Redo
 * 
 * This example demonstrates how to use the undo/redo stack behavior
 * to implement undo/redo functionality in a simple text editor.
 */

import { createUndoRedoStack } from '../src/behaviors/undo-redo-stack';

interface EditorState {
  content: string;
  cursor: number;
}

// Create an undo/redo stack for the editor
const editorHistory = createUndoRedoStack<EditorState>({
  initialState: { content: '', cursor: 0 },
  maxLength: 100,
  onStateChange: (state) => {
    console.log('Editor state changed:', state);
  },
});

// Subscribe to state changes to update the UI
editorHistory.subscribe((state) => {
  console.log('History state:', {
    canUndo: state.canUndo,
    canRedo: state.canRedo,
    historySize: state.past.length + 1 + state.future.length,
  });
});

// Simulate typing
console.log('\n--- Typing "Hello World" ---');
editorHistory.actions.pushState({ content: 'H', cursor: 1 });
editorHistory.actions.pushState({ content: 'He', cursor: 2 });
editorHistory.actions.pushState({ content: 'Hel', cursor: 3 });
editorHistory.actions.pushState({ content: 'Hell', cursor: 4 });
editorHistory.actions.pushState({ content: 'Hello', cursor: 5 });
editorHistory.actions.pushState({ content: 'Hello ', cursor: 6 });
editorHistory.actions.pushState({ content: 'Hello W', cursor: 7 });
editorHistory.actions.pushState({ content: 'Hello Wo', cursor: 8 });
editorHistory.actions.pushState({ content: 'Hello Wor', cursor: 9 });
editorHistory.actions.pushState({ content: 'Hello Worl', cursor: 10 });
editorHistory.actions.pushState({ content: 'Hello World', cursor: 11 });

console.log('Current content:', editorHistory.getState().present.content);

// Undo 5 times
console.log('\n--- Undo 5 times ---');
for (let i = 0; i < 5; i++) {
  editorHistory.actions.undo();
}
console.log('Current content:', editorHistory.getState().present.content);

// Redo 2 times
console.log('\n--- Redo 2 times ---');
editorHistory.actions.redo();
editorHistory.actions.redo();
console.log('Current content:', editorHistory.getState().present.content);

// Type something new (this clears the future)
console.log('\n--- Type "!" (clears future) ---');
editorHistory.actions.pushState({ content: 'Hello W!', cursor: 8 });
console.log('Current content:', editorHistory.getState().present.content);
console.log('Can redo:', editorHistory.getState().canRedo);

// Jump to a specific state
console.log('\n--- Jump to state at index 3 ---');
editorHistory.actions.jumpToState(3);
console.log('Current content:', editorHistory.getState().present.content);

// Clear history
console.log('\n--- Clear history ---');
editorHistory.actions.clearHistory();
console.log('Can undo:', editorHistory.getState().canUndo);
console.log('Can redo:', editorHistory.getState().canRedo);

// Clean up
editorHistory.destroy();
console.log('\n--- Cleanup complete ---');
