# Drag-and-Drop Behavior

## Overview

The Drag-and-Drop behavior provides a framework-agnostic solution for managing drag-and-drop interactions. It handles drag state, drop validation, and provides callbacks for drag lifecycle events. The behavior is completely headless, providing logic without DOM manipulation.

**Key Features:**

- Framework-agnostic drag-and-drop state management
- Drop zone registration and validation
- Drag data transfer support
- Lifecycle callbacks (onDragStart, onDragEnd, onDrop)
- Custom drop validation
- Keyboard accessibility support
- Type-safe with full TypeScript support

## Installation

```bash
npm install @web-loom/ui-core
```

## Basic Usage

```typescript
import { createDragDropBehavior } from '@web-loom/ui-core';

// Create the behavior
const dragDrop = createDragDropBehavior({
  onDragStart: (itemId, data) => {
    console.log('Drag started:', itemId, data);
  },
  onDragEnd: (itemId) => {
    console.log('Drag ended:', itemId);
  },
  onDrop: (draggedItem, dropTarget, data) => {
    console.log('Dropped', draggedItem, 'on', dropTarget);
    // Handle the drop (e.g., reorder items, move to different list)
  },
  validateDrop: (draggedItem, dropTarget) => {
    // Custom validation logic
    return dropTarget !== 'restricted-zone';
  },
});

// Register drop zones
dragDrop.actions.registerDropZone('list-1');
dragDrop.actions.registerDropZone('list-2');
dragDrop.actions.registerDropZone('trash');

// Start dragging (typically triggered by mousedown/touchstart)
dragDrop.actions.startDrag('item-1', {
  type: 'card',
  priority: 'high',
  content: 'Task description',
});

// Set drop target (typically triggered by dragover)
dragDrop.actions.setDropTarget('list-2');

// Perform drop (typically triggered by drop event)
dragDrop.actions.drop('list-2');

// Clean up
dragDrop.destroy();
```

## API Reference

### `createDragDropBehavior(options?)`

Creates a drag-and-drop behavior instance.

**Parameters:**

- `options` (optional): Configuration options
  - `onDragStart?: (itemId: string, data: any) => void` - Callback when drag starts
  - `onDragEnd?: (itemId: string) => void` - Callback when drag ends
  - `onDrop?: (draggedItem: string, dropTarget: string, data: any) => void` - Callback when drop occurs
  - `validateDrop?: (draggedItem: string, dropTarget: string) => boolean` - Custom drop validation

**Returns:** `DragDropBehavior`

### State Interface

```typescript
interface DragDropState {
  draggedItem: string | null; // Currently dragged item ID
  dropTarget: string | null; // Current drop target ID
  isDragging: boolean; // Whether drag is in progress
  dragData: any; // Data associated with drag
  dropZones: string[]; // Registered drop zones
  dragOverZone: string | null; // Zone being hovered over
}
```

### Actions Interface

```typescript
interface DragDropActions {
  startDrag: (itemId: string, data?: any) => void;
  endDrag: () => void;
  setDropTarget: (targetId: string | null) => void;
  drop: (targetId: string) => void;
  registerDropZone: (zoneId: string) => void;
  unregisterDropZone: (zoneId: string) => void;
  setDragOver: (zoneId: string | null) => void;
}
```

### Options Interface

```typescript
interface DragDropOptions {
  onDragStart?: (itemId: string, data: any) => void;
  onDragEnd?: (itemId: string) => void;
  onDrop?: (draggedItem: string, dropTarget: string, data: any) => void;
  validateDrop?: (draggedItem: string, dropTarget: string) => boolean;
}
```

## Advanced Usage

### Kanban Board

```typescript
interface Task {
  id: string;
  title: string;
  column: string;
}

const dragDrop = createDragDropBehavior({
  onDrop: (taskId, columnId, data) => {
    // Move task to new column
    moveTask(taskId, columnId);
    updateUI();
  },
  validateDrop: (taskId, columnId) => {
    // Prevent dropping on the same column
    const task = getTask(taskId);
    return task.column !== columnId;
  },
});

// Register columns as drop zones
['todo', 'in-progress', 'done'].forEach((columnId) => {
  dragDrop.actions.registerDropZone(columnId);
});

// Handle drag start
function handleDragStart(taskId: string) {
  const task = getTask(taskId);
  dragDrop.actions.startDrag(taskId, {
    title: task.title,
    originalColumn: task.column,
  });
}

// Handle drag over
function handleDragOver(columnId: string) {
  dragDrop.actions.setDragOver(columnId);
}

// Handle drop
function handleDrop(columnId: string) {
  dragDrop.actions.drop(columnId);
}
```

### Reorderable List

```typescript
interface ListItem {
  id: string;
  order: number;
  content: string;
}

const dragDrop = createDragDropBehavior({
  onDrop: (draggedId, targetId, data) => {
    // Reorder items
    const draggedItem = items.find((i) => i.id === draggedId);
    const targetItem = items.find((i) => i.id === targetId);

    if (draggedItem && targetItem) {
      reorderItems(draggedItem, targetItem);
    }
  },
});

// Register each item as a drop zone
items.forEach((item) => {
  dragDrop.actions.registerDropZone(item.id);
});

// Visual feedback during drag
dragDrop.subscribe((state) => {
  if (state.isDragging) {
    highlightDropZones(state.dropZones);
  } else {
    clearHighlights();
  }

  if (state.dragOverZone) {
    showDropIndicator(state.dragOverZone);
  }
});
```

### File Upload with Drag-and-Drop

```typescript
const dragDrop = createDragDropBehavior({
  onDrop: (fileId, dropZoneId, data) => {
    if (dropZoneId === 'upload-zone') {
      uploadFile(data.file);
    } else if (dropZoneId === 'trash') {
      deleteFile(fileId);
    }
  },
  validateDrop: (fileId, dropZoneId) => {
    // Only allow certain file types in certain zones
    const file = getFile(fileId);
    if (dropZoneId === 'image-zone') {
      return file.type.startsWith('image/');
    }
    return true;
  },
});

dragDrop.actions.registerDropZone('upload-zone');
dragDrop.actions.registerDropZone('image-zone');
dragDrop.actions.registerDropZone('trash');

// Handle file drag
function handleFileDrag(file: File) {
  dragDrop.actions.startDrag(file.name, {
    file,
    type: file.type,
    size: file.size,
  });
}
```

### Multi-List Drag-and-Drop

```typescript
interface List {
  id: string;
  items: string[];
}

const dragDrop = createDragDropBehavior({
  onDrop: (itemId, listId, data) => {
    // Remove from source list
    const sourceList = lists.find((l) => l.id === data.sourceListId);
    if (sourceList) {
      sourceList.items = sourceList.items.filter((id) => id !== itemId);
    }

    // Add to target list
    const targetList = lists.find((l) => l.id === listId);
    if (targetList) {
      targetList.items.push(itemId);
    }

    updateUI();
  },
});

// Register all lists as drop zones
lists.forEach((list) => {
  dragDrop.actions.registerDropZone(list.id);
});

// Start drag with source list info
function handleItemDrag(itemId: string, sourceListId: string) {
  dragDrop.actions.startDrag(itemId, {
    sourceListId,
    timestamp: Date.now(),
  });
}
```

## Framework Integration

### React

```typescript
import { useDragDropBehavior } from '@web-loom/ui-core/react';

function KanbanBoard() {
  const [tasks, setTasks] = useState<Task[]>([]);

  const dragDrop = useDragDropBehavior({
    onDrop: (taskId, columnId) => {
      setTasks(prev => prev.map(task =>
        task.id === taskId ? { ...task, column: columnId } : task
      ));
    },
  });

  useEffect(() => {
    ['todo', 'in-progress', 'done'].forEach(col => {
      dragDrop.registerDropZone(col);
    });
  }, []);

  return (
    <div className="kanban-board">
      {['todo', 'in-progress', 'done'].map(column => (
        <div
          key={column}
          className="column"
          onDragOver={(e) => {
            e.preventDefault();
            dragDrop.setDragOver(column);
          }}
          onDrop={() => dragDrop.drop(column)}
        >
          {tasks.filter(t => t.column === column).map(task => (
            <div
              key={task.id}
              draggable
              onDragStart={() => dragDrop.startDrag(task.id, task)}
              onDragEnd={() => dragDrop.endDrag()}
            >
              {task.title}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
```

### Vue

```typescript
import { useDragDropBehavior } from '@web-loom/ui-core/vue';

export default {
  setup() {
    const tasks = ref<Task[]>([]);

    const dragDrop = useDragDropBehavior({
      onDrop: (taskId, columnId) => {
        const task = tasks.value.find((t) => t.id === taskId);
        if (task) {
          task.column = columnId;
        }
      },
    });

    onMounted(() => {
      ['todo', 'in-progress', 'done'].forEach((col) => {
        dragDrop.registerDropZone(col);
      });
    });

    return {
      tasks,
      dragDrop,
    };
  },
};
```

### Angular

```typescript
import { Component } from '@angular/core';
import { DragDropBehaviorService } from '@web-loom/ui-core/angular';

@Component({
  selector: 'app-kanban-board',
  template: `
    <div class="kanban-board">
      <div
        *ngFor="let column of columns"
        class="column"
        (dragover)="handleDragOver($event, column)"
        (drop)="handleDrop(column)"
      >
        <div
          *ngFor="let task of getTasksForColumn(column)"
          draggable="true"
          (dragstart)="handleDragStart(task)"
          (dragend)="dragDrop.endDrag()"
        >
          {{ task.title }}
        </div>
      </div>
    </div>
  `,
  providers: [DragDropBehaviorService],
})
export class KanbanBoardComponent implements OnInit {
  columns = ['todo', 'in-progress', 'done'];
  tasks: Task[] = [];

  constructor(public dragDrop: DragDropBehaviorService) {}

  ngOnInit() {
    this.dragDrop.initialize({
      onDrop: (taskId, columnId) => {
        const task = this.tasks.find((t) => t.id === taskId);
        if (task) {
          task.column = columnId;
        }
      },
    });

    this.columns.forEach((col) => {
      this.dragDrop.registerDropZone(col);
    });
  }

  handleDragStart(task: Task) {
    this.dragDrop.startDrag(task.id, task);
  }

  handleDragOver(event: DragEvent, column: string) {
    event.preventDefault();
    this.dragDrop.setDragOver(column);
  }

  handleDrop(column: string) {
    this.dragDrop.drop(column);
  }

  getTasksForColumn(column: string): Task[] {
    return this.tasks.filter((t) => t.column === column);
  }
}
```

## Accessibility Guidelines

### Keyboard Alternative

Provide keyboard-based drag-and-drop for accessibility:

```typescript
const dragDrop = createDragDropBehavior({
  onDrop: (itemId, targetId) => {
    moveItem(itemId, targetId);
  },
});

// Keyboard-based drag-and-drop
let keyboardDraggedItem: string | null = null;

function handleKeyDown(event: KeyboardEvent, itemId: string) {
  if (event.key === ' ' && !keyboardDraggedItem) {
    // Pick up item
    event.preventDefault();
    keyboardDraggedItem = itemId;
    dragDrop.actions.startDrag(itemId);
    announceToScreenReader('Item picked up. Use arrow keys to move, Space to drop, Escape to cancel.');
  } else if (event.key === ' ' && keyboardDraggedItem) {
    // Drop item
    event.preventDefault();
    const dropTarget = getFocusedDropZone();
    if (dropTarget) {
      dragDrop.actions.drop(dropTarget);
      keyboardDraggedItem = null;
      announceToScreenReader('Item dropped.');
    }
  } else if (event.key === 'Escape' && keyboardDraggedItem) {
    // Cancel drag
    dragDrop.actions.endDrag();
    keyboardDraggedItem = null;
    announceToScreenReader('Drag cancelled.');
  } else if (keyboardDraggedItem && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
    // Navigate between drop zones
    event.preventDefault();
    const nextZone = getNextDropZone(event.key);
    dragDrop.actions.setDragOver(nextZone);
    announceToScreenReader(`Over ${nextZone}`);
  }
}
```

### ARIA Attributes

Use appropriate ARIA attributes for drag-and-drop:

```typescript
// Draggable item
<div
  role="button"
  aria-grabbed={isDragging ? 'true' : 'false'}
  aria-dropeffect="move"
  tabIndex={0}
  draggable
  onDragStart={() => dragDrop.startDrag(item.id)}
  onKeyDown={(e) => handleKeyDown(e, item.id)}
>
  {item.title}
</div>

// Drop zone
<div
  role="region"
  aria-label={`${column} column`}
  aria-dropeffect="move"
  data-drop-zone={column}
  onDragOver={(e) => {
    e.preventDefault();
    dragDrop.setDragOver(column);
  }}
  onDrop={() => dragDrop.drop(column)}
>
  {/* Items */}
</div>
```

### Screen Reader Announcements

Announce drag-and-drop actions:

```typescript
function announceToScreenReader(message: string) {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', 'polite');
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  document.body.appendChild(announcement);
  setTimeout(() => announcement.remove(), 1000);
}

const dragDrop = createDragDropBehavior({
  onDragStart: (itemId) => {
    announceToScreenReader(`Started dragging ${getItemTitle(itemId)}`);
  },
  onDragEnd: (itemId) => {
    announceToScreenReader(`Stopped dragging ${getItemTitle(itemId)}`);
  },
  onDrop: (itemId, targetId) => {
    announceToScreenReader(`Moved ${getItemTitle(itemId)} to ${getZoneTitle(targetId)}`);
  },
});
```

### Visual Feedback

Provide clear visual feedback during drag operations:

```typescript
dragDrop.subscribe((state) => {
  // Highlight dragged item
  if (state.isDragging && state.draggedItem) {
    const element = document.querySelector(`[data-item-id="${state.draggedItem}"]`);
    element?.classList.add('dragging');
  }

  // Highlight valid drop zones
  state.dropZones.forEach((zoneId) => {
    const zone = document.querySelector(`[data-drop-zone="${zoneId}"]`);
    zone?.classList.add('drop-zone-active');
  });

  // Highlight current drop target
  if (state.dragOverZone) {
    const zone = document.querySelector(`[data-drop-zone="${state.dragOverZone}"]`);
    zone?.classList.add('drop-zone-hover');
  }
});
```

## TypeScript Support

Full TypeScript support with exported types:

```typescript
import type { DragDropState, DragDropActions, DragDropBehavior, DragDropOptions } from '@web-loom/ui-core';

// Type-safe drag data
interface TaskDragData {
  taskId: string;
  title: string;
  sourceColumn: string;
  priority: 'low' | 'medium' | 'high';
}

const dragDrop = createDragDropBehavior({
  onDragStart: (itemId: string, data: TaskDragData) => {
    console.log('Dragging task:', data.title);
  },
  onDrop: (draggedItem: string, dropTarget: string, data: TaskDragData) => {
    moveTask(draggedItem, dropTarget, data);
  },
});

// Type-safe drag start
function startDragging(task: Task) {
  const dragData: TaskDragData = {
    taskId: task.id,
    title: task.title,
    sourceColumn: task.column,
    priority: task.priority,
  };

  dragDrop.actions.startDrag(task.id, dragData);
}
```

## Performance Considerations

### Throttle Drag Events

Throttle high-frequency drag events:

```typescript
import { throttle } from 'lodash';

const throttledSetDragOver = throttle((zoneId: string) => {
  dragDrop.actions.setDragOver(zoneId);
}, 100);

// Use throttled version in dragover handler
element.addEventListener('dragover', (e) => {
  e.preventDefault();
  throttledSetDragOver(zoneId);
});
```

### Cleanup Drop Zones

Unregister drop zones when components unmount:

```typescript
useEffect(() => {
  // Register drop zones
  dropZones.forEach((zone) => {
    dragDrop.actions.registerDropZone(zone.id);
  });

  // Cleanup
  return () => {
    dropZones.forEach((zone) => {
      dragDrop.actions.unregisterDropZone(zone.id);
    });
  };
}, [dropZones]);
```

### Optimize Large Lists

For large lists, use virtualization:

```typescript
// Only register visible items as drop zones
const visibleItems = getVisibleItems(scrollPosition, itemHeight);

useEffect(() => {
  // Clear previous drop zones
  dragDrop.getState().dropZones.forEach((zone) => {
    dragDrop.actions.unregisterDropZone(zone);
  });

  // Register only visible items
  visibleItems.forEach((item) => {
    dragDrop.actions.registerDropZone(item.id);
  });
}, [visibleItems]);
```

## Common Patterns

### Drag Handle

Implement a drag handle for better UX:

```typescript
<div className="item">
  <div
    className="drag-handle"
    draggable
    onDragStart={() => dragDrop.startDrag(item.id)}
    onDragEnd={() => dragDrop.endDrag()}
  >
    ⋮⋮
  </div>
  <div className="item-content">
    {item.title}
  </div>
</div>
```

### Copy vs Move

Implement copy behavior with modifier keys:

```typescript
const dragDrop = createDragDropBehavior({
  onDrop: (itemId, targetId, data) => {
    if (data.copyMode) {
      copyItem(itemId, targetId);
    } else {
      moveItem(itemId, targetId);
    }
  },
});

// Detect modifier key
element.addEventListener('dragstart', (e) => {
  const copyMode = e.ctrlKey || e.metaKey;
  dragDrop.actions.startDrag(item.id, { copyMode });
});
```

### Nested Drop Zones

Handle nested drop zones:

```typescript
function handleDrop(e: DragEvent, zoneId: string) {
  e.stopPropagation(); // Prevent parent drop zones from handling
  dragDrop.actions.drop(zoneId);
}
```

## Bundle Size

- Gzipped: ~2.5KB
- Tree-shakeable: Import only what you need
- Zero dependencies (except @web-loom/store-core)

## Browser Support

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- IE11: ❌ Not supported (requires modern JavaScript)

## License

MIT
