import { useState } from 'react';
import { useDragDropBehavior } from '@web-loom/ui-core/react';
import './examples.css';

interface Task {
  id: string;
  title: string;
  description: string;
}

interface Column {
  id: string;
  title: string;
  tasks: Task[];
}

/**
 * Kanban Board Example with Drag-and-Drop
 *
 * Demonstrates:
 * - useDragDropBehavior hook for drag-and-drop
 * - Moving tasks between columns
 * - Keyboard alternative for accessibility
 */
export function KanbanBoardExample() {
  const [columns, setColumns] = useState<Column[]>([
    {
      id: 'todo',
      title: 'To Do',
      tasks: [
        { id: 'task-1', title: 'Design mockups', description: 'Create UI mockups for new feature' },
        { id: 'task-2', title: 'Write tests', description: 'Add unit tests for components' },
      ],
    },
    {
      id: 'in-progress',
      title: 'In Progress',
      tasks: [{ id: 'task-3', title: 'Implement API', description: 'Build REST API endpoints' }],
    },
    {
      id: 'done',
      title: 'Done',
      tasks: [{ id: 'task-4', title: 'Setup project', description: 'Initialize repository and dependencies' }],
    },
  ]);

  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [keyboardMode, setKeyboardMode] = useState(false);

  const dragDrop = useDragDropBehavior({
    onDrop: (draggedItemId, dropTargetId) => {
      moveTask(draggedItemId, dropTargetId);
    },
  });

  const moveTask = (taskId: string, targetColumnId: string) => {
    setColumns((prevColumns) => {
      const newColumns = [...prevColumns];

      // Find source column and task
      let task: Task | undefined;

      for (const col of newColumns) {
        const taskIndex = col.tasks.findIndex((t) => t.id === taskId);
        if (taskIndex !== -1) {
          task = col.tasks[taskIndex];
          col.tasks.splice(taskIndex, 1);
          break;
        }
      }

      // Add to target column
      if (task) {
        const targetColumn = newColumns.find((c) => c.id === targetColumnId);
        if (targetColumn) {
          targetColumn.tasks.push(task);
        }
      }

      return newColumns;
    });
  };

  const handleDragStart = (taskId: string) => {
    dragDrop.actions.startDrag(taskId);
  };

  const handleDragEnd = () => {
    dragDrop.actions.endDrag();
  };

  const handleDrop = (columnId: string) => {
    if (dragDrop.draggedItem) {
      dragDrop.actions.drop(columnId);
    }
  };

  const handleKeyboardMove = (direction: 'left' | 'right') => {
    if (!selectedTask) return;

    const currentColumnIndex = columns.findIndex((col) => col.tasks.some((t) => t.id === selectedTask));

    if (currentColumnIndex === -1) return;

    const targetIndex =
      direction === 'left' ? Math.max(0, currentColumnIndex - 1) : Math.min(columns.length - 1, currentColumnIndex + 1);

    if (targetIndex !== currentColumnIndex) {
      moveTask(selectedTask, columns[targetIndex].id);
    }
  };

  return (
    <div className="example-container">
      <div className="example-header">
        <h2>Kanban Board with Drag-and-Drop</h2>
        <p>
          This example demonstrates the <code>useDragDropBehavior</code> hook for implementing drag-and-drop between
          columns with keyboard alternatives.
        </p>
      </div>

      <div className="example-content">
        <div className="kanban-controls">
          <button
            onClick={() => setKeyboardMode((prev) => !prev)}
            className={`control-button ${keyboardMode ? 'primary' : 'secondary'}`}
          >
            {keyboardMode ? '⌨️ Keyboard Mode: ON' : '🖱️ Mouse Mode'}
          </button>
          {keyboardMode && selectedTask && (
            <div className="keyboard-controls">
              <button onClick={() => handleKeyboardMove('left')} className="control-button">
                ← Move Left
              </button>
              <button onClick={() => handleKeyboardMove('right')} className="control-button">
                → Move Right
              </button>
            </div>
          )}
        </div>

        <div className="kanban-board">
          {columns.map((column) => (
            <div
              key={column.id}
              className={`kanban-column ${dragDrop.dropTarget === column.id ? 'drag-over' : ''}`}
              onDragOver={(e) => {
                e.preventDefault();
                dragDrop.actions.setDropTarget(column.id);
              }}
              onDragLeave={() => {
                dragDrop.actions.setDropTarget(null);
              }}
              onDrop={() => handleDrop(column.id)}
            >
              <div className="kanban-column-header">
                <h3>{column.title}</h3>
                <span className="task-count">{column.tasks.length}</span>
              </div>

              <div className="kanban-column-content">
                {column.tasks.length === 0 ? (
                  <div className="empty-column">Drop tasks here</div>
                ) : (
                  column.tasks.map((task) => (
                    <div
                      key={task.id}
                      draggable={!keyboardMode}
                      onDragStart={() => handleDragStart(task.id)}
                      onDragEnd={handleDragEnd}
                      onClick={() => keyboardMode && setSelectedTask(task.id)}
                      className={`kanban-task ${dragDrop.draggedItem === task.id ? 'dragging' : ''} ${
                        keyboardMode && selectedTask === task.id ? 'selected' : ''
                      }`}
                    >
                      <div className="task-title">{task.title}</div>
                      <div className="task-description">{task.description}</div>
                      {!keyboardMode && <div className="drag-handle">⋮⋮</div>}
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="drag-state-info">
          <h3>Drag State</h3>
          <div className="state-grid">
            <div className="state-item">
              <span className="state-label">Is Dragging:</span>
              <span className={`state-value ${dragDrop.isDragging ? 'active' : ''}`}>
                {dragDrop.isDragging ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="state-item">
              <span className="state-label">Dragged Item:</span>
              <span className="state-value">{dragDrop.draggedItem || 'None'}</span>
            </div>
            <div className="state-item">
              <span className="state-label">Drop Target:</span>
              <span className="state-value">{dragDrop.dropTarget || 'None'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="example-footer">
        <h3>Key Features</h3>
        <ul>
          <li>Drag-and-drop tasks between columns</li>
          <li>Visual feedback during drag operations</li>
          <li>Keyboard alternative for accessibility</li>
          <li>Real-time drag state visualization</li>
        </ul>
      </div>
    </div>
  );
}
