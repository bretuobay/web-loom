# Undo/Redo Stack Behavior

## Overview

The Undo/Redo Stack behavior provides a robust solution for managing state history with undo and redo operations. It maintains an immutable history of states, supports time-travel debugging, and includes configurable history limits to prevent unbounded memory growth.

**Key Features:**
- Immutable state history with structural sharing
- Undo and redo operations
- Configurable maximum history length
- Time-travel debugging with `jumpToState`
- State change callbacks
- Serializable states for persistence
- Type-safe with full TypeScript support

## Installation

```bash
npm install @web-loom/ui-core
```

## Basic Usage

```typescript
import { createUndoRedoStack } from '@web-loom/ui-core';

// Define your state type
interface EditorState {
  content: string;
  cursor: number;
}

// Create the behavior
const undoRedo = createUndoRedoStack<EditorState>({
  initialState: { content: '', cursor: 0 },
  maxLength: 100,
  onStateChange: (state) => {
    console.log('State changed:', state);
    updateEditor(state);
  },
});

// Push new states as changes occur
undoRedo.actions.pushState({ content: 'Hello', cursor: 5 });
undoRedo.actions.pushState({ content: 'Hello World', cursor: 11 });

// Undo
undoRedo.actions.undo();
console.log(undoRedo.getState().present); // { content: 'Hello', cursor: 5 }

// Redo
undoRedo.actions.redo();
console.log(undoRedo.getState().present); // { content: 'Hello World', cursor: 11 }

// Check if undo/redo is available
console.log(undoRedo.getState().canUndo); // true
console.log(undoRedo.getState().canRedo); // false

// Clean up
undoRedo.destroy();
```

## API Reference

### `createUndoRedoStack<T>(options)`

Creates an undo/redo stack behavior instance.

**Type Parameters:**
- `T` - The type of state being tracked in the history

**Parameters:**
- `options`: Configuration options (required)
  - `initialState: T` - The initial state to start with (required)
  - `maxLength?: number` - Maximum number of states to keep (default: 50)
  - `onStateChange?: (state: T) => void` - Callback invoked when present state changes

**Returns:** `UndoRedoStackBehavior<T>`

### State Interface

```typescript
interface UndoRedoStackState<T> {
  past: T[];           // Array of past states (oldest to most recent)
  present: T;          // The current state
  future: T[];         // Array of future states (next to furthest)
  canUndo: boolean;    // Whether undo is available
  canRedo: boolean;    // Whether redo is available
  maxLength: number;   // Maximum history length
}
```

### Actions Interface

```typescript
interface UndoRedoStackActions<T> {
  undo: () => void;                    // Move to previous state
  redo: () => void;                    // Move to next state
  pushState: (state: T) => void;       // Push new state
  clearHistory: () => void;            // Clear all history
  jumpToState: (index: number) => void; // Jump to specific state
  setMaxLength: (length: number) => void; // Update max length
}
```

### Options Interface

```typescript
interface UndoRedoStackOptions<T> {
  initialState: T;                     // Required initial state
  maxLength?: number;                  // Optional max length (default: 50)
  onStateChange?: (state: T) => void;  // Optional change callback
}
```

## Advanced Usage

### Text Editor with Undo/Redo

```typescript
interface EditorState {
  content: string;
  cursor: number;
  selection: { start: number; end: number } | null;
}

const undoRedo = createUndoRedoStack<EditorState>({
  initialState: {
    content: '',
    cursor: 0,
    selection: null,
  },
  maxLength: 100,
  onStateChange: (state) => {
    // Update editor UI
    editor.setContent(state.content);
    editor.setCursor(state.cursor);
    if (state.selection) {
      editor.setSelection(state.selection.start, state.selection.end);
    }
  },
});

// Handle text input
function handleInput(newContent: string, newCursor: number) {
  undoRedo.actions.pushState({
    content: newContent,
    cursor: newCursor,
    selection: null,
  });
}

// Keyboard shortcuts
shortcuts.actions.registerShortcut({
  key: 'Ctrl+Z',
  handler: () => undoRedo.actions.undo(),
  description: 'Undo',
});

shortcuts.actions.registerShortcut({
  key: 'Ctrl+Y',
  handler: () => undoRedo.actions.redo(),
  description: 'Redo',
});
```

### Form State Management

```typescript
interface FormState {
  name: string;
  email: string;
  message: string;
}

const formHistory = createUndoRedoStack<FormState>({
  initialState: {
    name: '',
    email: '',
    message: '',
  },
  maxLength: 50,
});

// Track field changes
function handleFieldChange(field: keyof FormState, value: string) {
  const currentState = formHistory.getState().present;
  formHistory.actions.pushState({
    ...currentState,
    [field]: value,
  });
}
```

### Drawing Application

```typescript
interface CanvasState {
  shapes: Shape[];
  selectedShapeId: string | null;
  zoom: number;
}

const canvasHistory = createUndoRedoStack<CanvasState>({
  initialState: {
    shapes: [],
    selectedShapeId: null,
    zoom: 1.0,
  },
  maxLength: 200,
  onStateChange: (state) => {
    redrawCanvas(state);
  },
});

// Add shape
function addShape(shape: Shape) {
  const current = canvasHistory.getState().present;
  canvasHistory.actions.pushState({
    ...current,
    shapes: [...current.shapes, shape],
  });
}

// Delete shape
function deleteShape(shapeId: string) {
  const current = canvasHistory.getState().present;
  canvasHistory.actions.pushState({
    ...current,
    shapes: current.shapes.filter(s => s.id !== shapeId),
    selectedShapeId: null,
  });
}
```

### Time-Travel Debugging

```typescript
const undoRedo = createUndoRedoStack<AppState>({
  initialState: initialAppState,
  maxLength: 100,
});

// Build a history timeline UI
function renderHistoryTimeline() {
  const state = undoRedo.getState();
  const allStates = [...state.past, state.present, ...state.future];
  const currentIndex = state.past.length;

  return allStates.map((historyState, index) => (
    <button
      key={index}
      onClick={() => undoRedo.actions.jumpToState(index)}
      className={index === currentIndex ? 'active' : ''}
    >
      State {index}
    </button>
  ));
}
```

### State Persistence

```typescript
// Save history to localStorage
function saveHistory() {
  const state = undoRedo.getState();
  localStorage.setItem('editor-history', JSON.stringify({
    past: state.past,
    present: state.present,
    future: state.future,
  }));
}

// Load history from localStorage
function loadHistory() {
  const saved = localStorage.getItem('editor-history');
  if (saved) {
    const { past, present, future } = JSON.parse(saved);
    // Recreate the undo/redo stack with loaded state
    const undoRedo = createUndoRedoStack({
      initialState: present,
      maxLength: 100,
    });
    
    // Manually restore past and future
    past.forEach(state => undoRedo.actions.pushState(state));
    // Note: Restoring future states requires custom logic
  }
}
```

## Framework Integration

### React

```typescript
import { useUndoRedoStack } from '@web-loom/ui-core/react';

function TextEditor() {
  const [content, setContent] = useState('');
  
  const undoRedo = useUndoRedoStack<string>({
    initialState: '',
    maxLength: 100,
    onStateChange: (state) => setContent(state),
  });

  const handleChange = (newContent: string) => {
    undoRedo.pushState(newContent);
  };

  return (
    <div>
      <div>
        <button
          onClick={() => undoRedo.undo()}
          disabled={!undoRedo.state.canUndo}
        >
          Undo
        </button>
        <button
          onClick={() => undoRedo.redo()}
          disabled={!undoRedo.state.canRedo}
        >
          Redo
        </button>
      </div>
      <textarea
        value={content}
        onChange={(e) => handleChange(e.target.value)}
      />
    </div>
  );
}
```

### Vue

```typescript
import { useUndoRedoStack } from '@web-loom/ui-core/vue';

export default {
  setup() {
    const content = ref('');
    
    const undoRedo = useUndoRedoStack<string>({
      initialState: '',
      maxLength: 100,
      onStateChange: (state) => {
        content.value = state;
      },
    });

    const handleChange = (newContent: string) => {
      undoRedo.pushState(newContent);
    };

    return {
      content,
      undoRedo,
      handleChange,
    };
  },
};
```

### Angular

```typescript
import { Component } from '@angular/core';
import { UndoRedoStackService } from '@web-loom/ui-core/angular';

@Component({
  selector: 'app-text-editor',
  template: `
    <div>
      <button
        (click)="undoRedo.undo()"
        [disabled]="!(undoRedo.state$ | async)?.canUndo"
      >
        Undo
      </button>
      <button
        (click)="undoRedo.redo()"
        [disabled]="!(undoRedo.state$ | async)?.canRedo"
      >
        Redo
      </button>
      <textarea
        [value]="content"
        (input)="handleChange($event.target.value)"
      ></textarea>
    </div>
  `,
  providers: [UndoRedoStackService],
})
export class TextEditorComponent {
  content = '';

  constructor(public undoRedo: UndoRedoStackService<string>) {
    undoRedo.initialize({
      initialState: '',
      maxLength: 100,
      onStateChange: (state) => {
        this.content = state;
      },
    });
  }

  handleChange(newContent: string) {
    this.undoRedo.pushState(newContent);
  }
}
```

## Accessibility Guidelines

### Keyboard Shortcuts

Provide standard undo/redo keyboard shortcuts:

```typescript
// Standard shortcuts
shortcuts.actions.registerShortcut({
  key: 'Ctrl+Z',
  handler: () => undoRedo.actions.undo(),
  description: 'Undo',
  preventDefault: true,
});

shortcuts.actions.registerShortcut({
  key: 'Ctrl+Y', // or Ctrl+Shift+Z on some platforms
  handler: () => undoRedo.actions.redo(),
  description: 'Redo',
  preventDefault: true,
});
```

### Screen Reader Announcements

Announce undo/redo actions to screen readers:

```typescript
function announceAction(action: string, description: string) {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', 'polite');
  announcement.textContent = `${action}: ${description}`;
  document.body.appendChild(announcement);
  setTimeout(() => announcement.remove(), 1000);
}

const undoRedo = createUndoRedoStack<EditorState>({
  initialState,
  onStateChange: (state) => {
    // Announce state changes
    announceAction('State changed', `Content: ${state.content.substring(0, 50)}...`);
  },
});
```

### Button States

Properly disable undo/redo buttons when unavailable:

```typescript
<button
  onClick={() => undoRedo.actions.undo()}
  disabled={!undoRedo.getState().canUndo}
  aria-label="Undo last action"
>
  Undo
</button>

<button
  onClick={() => undoRedo.actions.redo()}
  disabled={!undoRedo.getState().canRedo}
  aria-label="Redo last undone action"
>
  Redo
</button>
```

### History Navigation

Make history timeline keyboard accessible:

```typescript
<div role="toolbar" aria-label="History timeline">
  {allStates.map((state, index) => (
    <button
      key={index}
      onClick={() => undoRedo.actions.jumpToState(index)}
      aria-label={`Jump to state ${index}`}
      aria-current={index === currentIndex ? 'true' : 'false'}
      tabIndex={index === currentIndex ? 0 : -1}
    >
      State {index}
    </button>
  ))}
</div>
```

## TypeScript Support

Full TypeScript support with generic types:

```typescript
import type {
  UndoRedoStackState,
  UndoRedoStackActions,
  UndoRedoStackBehavior,
  UndoRedoStackOptions,
} from '@web-loom/ui-core';

// Define your state type
interface MyState {
  data: string;
  metadata: Record<string, any>;
}

// Type-safe configuration
const options: UndoRedoStackOptions<MyState> = {
  initialState: {
    data: '',
    metadata: {},
  },
  maxLength: 100,
  onStateChange: (state: MyState) => {
    console.log(state.data);
  },
};

const undoRedo: UndoRedoStackBehavior<MyState> = createUndoRedoStack(options);
```

## Performance Considerations

### Structural Sharing

The behavior uses structural sharing to minimize memory usage:

```typescript
// Efficient: Only changed parts are copied
const newState = {
  ...oldState,
  content: newContent, // Only this field is new
};
undoRedo.actions.pushState(newState);
```

### History Limits

Always set appropriate history limits:

```typescript
// For text editors: 100-200 states
const textEditor = createUndoRedoStack({
  initialState: '',
  maxLength: 100,
});

// For drawing apps: 200-500 states
const drawingApp = createUndoRedoStack({
  initialState: { shapes: [] },
  maxLength: 200,
});

// For simple forms: 20-50 states
const formState = createUndoRedoStack({
  initialState: formData,
  maxLength: 20,
});
```

### Debouncing State Changes

Debounce rapid state changes to avoid cluttering history:

```typescript
import { debounce } from 'lodash';

const debouncedPush = debounce((state) => {
  undoRedo.actions.pushState(state);
}, 300);

// Use debounced version for text input
function handleInput(newContent: string) {
  debouncedPush({ content: newContent, cursor: getCursor() });
}
```

## Common Patterns

### Grouping Related Changes

```typescript
// Group multiple changes into a single undo step
function applyFormatting(text: string, format: Format) {
  const formatted = applyFormat(text, format);
  const withMetadata = addMetadata(formatted, format);
  
  // Push only the final state
  undoRedo.actions.pushState(withMetadata);
}
```

### Conditional History

```typescript
// Only push to history if state actually changed
function updateState(newState: State) {
  const current = undoRedo.getState().present;
  
  if (JSON.stringify(current) !== JSON.stringify(newState)) {
    undoRedo.actions.pushState(newState);
  }
}
```

## Bundle Size

- Gzipped: ~1.5KB
- Tree-shakeable: Import only what you need
- Zero dependencies (except @web-loom/store-core)

## Browser Support

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- IE11: ❌ Not supported (requires modern JavaScript)

## License

MIT
