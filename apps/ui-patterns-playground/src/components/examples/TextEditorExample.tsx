import { useState } from 'react';
import { useUndoRedoStack } from '@web-loom/ui-core/react';
import './examples.css';

/**
 * Text Editor Example with Undo/Redo
 * 
 * Demonstrates:
 * - useUndoRedoStack hook for managing text history
 * - Undo/redo buttons with keyboard shortcuts
 * - State history visualization
 */
export function TextEditorExample() {
  const [text, setText] = useState('Start typing to see undo/redo in action...');
  
  const undoRedo = useUndoRedoStack({
    initialState: text,
    maxLength: 50,
    onStateChange: (newText) => {
      setText(newText);
    },
  });

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setText(newText);
    undoRedo.actions.pushState(newText);
  };

  const handleUndo = () => {
    undoRedo.actions.undo();
  };

  const handleRedo = () => {
    undoRedo.actions.redo();
  };

  const handleClear = () => {
    const emptyText = '';
    setText(emptyText);
    undoRedo.actions.pushState(emptyText);
  };

  return (
    <div className="example-container">
      <div className="example-header">
        <h2>Text Editor with Undo/Redo</h2>
        <p>
          This example demonstrates the <code>useUndoRedoStack</code> hook for managing
          text editing history with undo and redo operations.
        </p>
      </div>

      <div className="example-content">
        <div className="text-editor-controls">
          <button
            onClick={handleUndo}
            disabled={!undoRedo.canUndo}
            className="control-button"
            title="Undo (Ctrl+Z)"
          >
            ↶ Undo
          </button>
          <button
            onClick={handleRedo}
            disabled={!undoRedo.canRedo}
            className="control-button"
            title="Redo (Ctrl+Y)"
          >
            ↷ Redo
          </button>
          <button
            onClick={handleClear}
            className="control-button secondary"
          >
            Clear
          </button>
          <div className="history-info">
            <span className="badge">Past: {undoRedo.past.length}</span>
            <span className="badge">Future: {undoRedo.future.length}</span>
          </div>
        </div>

        <textarea
          value={text}
          onChange={handleTextChange}
          className="text-editor-textarea"
          placeholder="Type something..."
          rows={10}
        />

        <div className="state-history">
          <h3>State History</h3>
          <div className="history-visualization">
            <div className="history-section">
              <h4>Past States ({undoRedo.past.length})</h4>
              <div className="history-list">
                {undoRedo.past.length === 0 ? (
                  <div className="history-item empty">No past states</div>
                ) : (
                  undoRedo.past.slice(-5).reverse().map((state, index) => (
                    <div key={index} className="history-item">
                      <div className="history-preview">
                        {state.substring(0, 50)}
                        {state.length > 50 ? '...' : ''}
                      </div>
                      <div className="history-meta">
                        {state.length} chars
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="history-section current">
              <h4>Current State</h4>
              <div className="history-item current">
                <div className="history-preview">
                  {undoRedo.present.substring(0, 50)}
                  {undoRedo.present.length > 50 ? '...' : ''}
                </div>
                <div className="history-meta">
                  {undoRedo.present.length} chars
                </div>
              </div>
            </div>

            <div className="history-section">
              <h4>Future States ({undoRedo.future.length})</h4>
              <div className="history-list">
                {undoRedo.future.length === 0 ? (
                  <div className="history-item empty">No future states</div>
                ) : (
                  undoRedo.future.slice(0, 5).map((state, index) => (
                    <div key={index} className="history-item">
                      <div className="history-preview">
                        {state.substring(0, 50)}
                        {state.length > 50 ? '...' : ''}
                      </div>
                      <div className="history-meta">
                        {state.length} chars
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="example-footer">
        <h3>Key Features</h3>
        <ul>
          <li>Undo/redo operations with state history tracking</li>
          <li>Configurable maximum history length (50 states)</li>
          <li>Visual representation of past, present, and future states</li>
          <li>Disabled buttons when no undo/redo available</li>
        </ul>
      </div>
    </div>
  );
}
