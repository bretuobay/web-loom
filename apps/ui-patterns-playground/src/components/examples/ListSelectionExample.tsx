import { useListSelection } from '@web-loom/ui-core/react';
import { useState } from 'react';
import './examples.css';

/**
 * Example component demonstrating the useListSelection hook
 * Shows single, multi, and range selection modes
 */
export function ListSelectionExample() {
  const [mode, setMode] = useState<'single' | 'multi' | 'range'>('single');

  const items = [
    { id: '1', name: 'Item 1', description: 'First item' },
    { id: '2', name: 'Item 2', description: 'Second item' },
    { id: '3', name: 'Item 3', description: 'Third item' },
    { id: '4', name: 'Item 4', description: 'Fourth item' },
    { id: '5', name: 'Item 5', description: 'Fifth item' },
  ];

  const selection = useListSelection({
    mode,
    items: items.map((item) => item.id),
  });

  const handleItemClick = (
    id: string,
    event: React.MouseEvent<HTMLDivElement>
  ) => {
    if (mode === 'range' && event.shiftKey && selection.lastSelectedId) {
      selection.actions.selectRange(selection.lastSelectedId, id);
    } else if (mode === 'multi' && (event.ctrlKey || event.metaKey)) {
      selection.actions.toggleSelection(id);
    } else {
      selection.actions.select(id);
    }
  };

  const isSelected = (id: string) => selection.selectedIds.includes(id);

  return (
    <div className="example-container">
      <h2>List Selection Example</h2>
      <p>
        This example demonstrates the <code>useListSelection</code> hook with
        different selection modes.
      </p>

      <div className="example-controls">
        <div className="mode-selector">
          <label>Selection Mode:</label>
          <select
            value={mode}
            onChange={(e) => {
              setMode(e.target.value as 'single' | 'multi' | 'range');
              selection.actions.clearSelection();
            }}
            className="select"
          >
            <option value="single">Single</option>
            <option value="multi">Multi (Ctrl/Cmd + Click)</option>
            <option value="range">Range (Shift + Click)</option>
          </select>
        </div>

        <button
          onClick={() => selection.actions.selectAll()}
          className="btn btn-secondary"
        >
          Select All
        </button>
        <button
          onClick={() => selection.actions.clearSelection()}
          className="btn btn-secondary"
        >
          Clear Selection
        </button>
      </div>

      <div className="list-container">
        {items.map((item) => (
          <div
            key={item.id}
            className={`list-item ${isSelected(item.id) ? 'selected' : ''}`}
            onClick={(e) => handleItemClick(item.id, e)}
          >
            <div className="list-item-content">
              <h4>{item.name}</h4>
              <p>{item.description}</p>
            </div>
            {isSelected(item.id) && <span className="check-mark">✓</span>}
          </div>
        ))}
      </div>

      <div className="example-state">
        <h3>Current State:</h3>
        <pre>{JSON.stringify(selection, null, 2)}</pre>
      </div>
    </div>
  );
}
