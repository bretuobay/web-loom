# React Framework Examples - UI Core Behaviors

This document provides comprehensive React examples for all UI Core behaviors.

## Table of Contents

1. [Keyboard Shortcuts](#keyboard-shortcuts)
2. [Undo/Redo Stack](#undoredo-stack)
3. [Drag and Drop](#drag-and-drop)
4. [Roving Focus (Enhanced)](#roving-focus-enhanced)
5. [Form Behavior (Enhanced)](#form-behavior-enhanced)

---

## Keyboard Shortcuts

### Basic Command Palette

```tsx
import React, { useState, useEffect } from 'react';
import { useKeyboardShortcuts } from '@web-loom/ui-core/react';

function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const shortcuts = useKeyboardShortcuts({
    onShortcutExecuted: (key) => console.log(`Executed: ${key}`),
  });

  useEffect(() => {
    // Register Ctrl+K to open palette
    shortcuts.registerShortcut({
      key: 'Ctrl+K',
      handler: () => setIsOpen(true),
      description: 'Open command palette',
      preventDefault: true,
    });

    // Register Escape to close (scoped)
    shortcuts.registerShortcut({
      key: 'Escape',
      handler: () => setIsOpen(false),
      description: 'Close command palette',
      scope: 'scoped',
    });

    return () => shortcuts.destroy();
  }, []);

  useEffect(() => {
    // Switch scope when palette opens/closes
    shortcuts.setScope(isOpen ? 'scoped' : 'global');
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="command-palette">
      <input
        type="text"
        placeholder="Type a command..."
        autoFocus
      />
      <div className="shortcuts-help">
        <p>Press Escape to close</p>
      </div>
    </div>
  );
}

export default CommandPalette;
```

### Text Editor with Multiple Shortcuts

```tsx
import React, { useEffect, useRef } from 'react';
import { useKeyboardShortcuts } from '@web-loom/ui-core/react';

function TextEditor() {
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const shortcuts = useKeyboardShortcuts();

  useEffect(() => {
    // Save shortcut
    shortcuts.registerShortcut({
      key: 'Ctrl+S',
      handler: handleSave,
      description: 'Save document',
      preventDefault: true,
    });

    // Bold text
    shortcuts.registerShortcut({
      key: 'Ctrl+B',
      handler: () => formatText('bold'),
      description: 'Bold text',
      preventDefault: true,
    });

    // Italic text
    shortcuts.registerShortcut({
      key: 'Ctrl+I',
      handler: () => formatText('italic'),
      description: 'Italic text',
      preventDefault: true,
    });

    // Find
    shortcuts.registerShortcut({
      key: 'Ctrl+F',
      handler: openFindDialog,
      description: 'Find in document',
      preventDefault: true,
    });

    return () => shortcuts.destroy();
  }, []);

  const handleSave = () => {
    console.log('Saving document...');
    // Save logic here
  };

  const formatText = (format: string) => {
    console.log(`Applying ${format} formatting`);
    // Format logic here
  };

  const openFindDialog = () => {
    console.log('Opening find dialog');
    // Find dialog logic
  };

  return (
    <div className="text-editor">
      <textarea
        ref={editorRef}
        placeholder="Start typing..."
        className="editor-content"
      />
      <div className="shortcuts-bar">
        <span>Ctrl+S: Save</span>
        <span>Ctrl+B: Bold</span>
        <span>Ctrl+I: Italic</span>
        <span>Ctrl+F: Find</span>
      </div>
    </div>
  );
}

export default TextEditor;
```

### Shortcut Help Panel

```tsx
import React, { useState, useEffect } from 'react';
import { useKeyboardShortcuts } from '@web-loom/ui-core/react';

function ShortcutHelpPanel() {
  const [shortcuts, setShortcuts] = useState<Array<{
    key: string;
    description: string;
  }>>([]);
  const shortcutBehavior = useKeyboardShortcuts();

  useEffect(() => {
    // Register some shortcuts
    shortcutBehavior.registerShortcut({
      key: 'Ctrl+K',
      handler: () => {},
      description: 'Open command palette',
    });

    shortcutBehavior.registerShortcut({
      key: 'Ctrl+S',
      handler: () => {},
      description: 'Save document',
    });

    shortcutBehavior.registerShortcut({
      key: 'Ctrl+Shift+P',
      handler: () => {},
      description: 'Open preferences',
    });

    // Get all registered shortcuts
    const state = shortcutBehavior.getState();
    const shortcutList = Array.from(state.shortcuts.values()).map(s => ({
      key: s.key,
      description: s.description || 'No description',
    }));
    setShortcuts(shortcutList);

    return () => shortcutBehavior.destroy();
  }, []);

  return (
    <div className="shortcut-help">
      <h2>Keyboard Shortcuts</h2>
      <table>
        <thead>
          <tr>
            <th>Shortcut</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          {shortcuts.map((shortcut, index) => (
            <tr key={index}>
              <td><kbd>{shortcut.key}</kbd></td>
              <td>{shortcut.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ShortcutHelpPanel;
```

---

## Undo/Redo Stack

### Simple Text Editor with Undo/Redo

```tsx
import React, { useState, useEffect } from 'react';
import { useUndoRedoStack } from '@web-loom/ui-core/react';

function UndoableTextEditor() {
  const [text, setText] = useState('');
  const undoRedo = useUndoRedoStack({
    initialState: '',
    maxLength: 50,
    onStateChange: (newText) => setText(newText),
  });

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setText(newText);
    undoRedo.pushState(newText);
  };

  const handleUndo = () => {
    undoRedo.undo();
  };

  const handleRedo = () => {
    undoRedo.redo();
  };

  const state = undoRedo.getState();

  return (
    <div className="undoable-editor">
      <div className="toolbar">
        <button
          onClick={handleUndo}
          disabled={!state.canUndo}
          aria-label="Undo"
        >
          ↶ Undo
        </button>
        <button
          onClick={handleRedo}
          disabled={!state.canRedo}
          aria-label="Redo"
        >
          ↷ Redo
        </button>
        <span className="history-info">
          History: {state.past.length} / {state.maxLength}
        </span>
      </div>
      <textarea
        value={text}
        onChange={handleTextChange}
        placeholder="Type something..."
        className="editor-content"
      />
    </div>
  );
}

export default UndoableTextEditor;
```

### Drawing Canvas with Undo/Redo

```tsx
import React, { useRef, useState, useEffect } from 'react';
import { useUndoRedoStack } from '@web-loom/ui-core/react';

interface CanvasState {
  strokes: Array<{ x: number; y: number }[]>;
}

function DrawingCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<Array<{ x: number; y: number }>>([]);

  const undoRedo = useUndoRedoStack<CanvasState>({
    initialState: { strokes: [] },
    maxLength: 100,
    onStateChange: (state) => redrawCanvas(state),
  });

  const redrawCanvas = (state: CanvasState) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Redraw all strokes
    state.strokes.forEach(stroke => {
      if (stroke.length < 2) return;

      ctx.beginPath();
      ctx.moveTo(stroke[0].x, stroke[0].y);
      stroke.slice(1).forEach(point => {
        ctx.lineTo(point.x, point.y);
      });
      ctx.stroke();
    });
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    setCurrentStroke([{
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }]);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const point = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };

    setCurrentStroke(prev => [...prev, point]);

    // Draw current stroke
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx || currentStroke.length === 0) return;

    const lastPoint = currentStroke[currentStroke.length - 1];
    ctx.beginPath();
    ctx.moveTo(lastPoint.x, lastPoint.y);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
  };

  const handleMouseUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    // Save stroke to history
    const state = undoRedo.getState();
    undoRedo.pushState({
      strokes: [...state.present.strokes, currentStroke],
    });

    setCurrentStroke([]);
  };

  const handleUndo = () => undoRedo.undo();
  const handleRedo = () => undoRedo.redo();
  const handleClear = () => {
    undoRedo.pushState({ strokes: [] });
  };

  const state = undoRedo.getState();

  return (
    <div className="drawing-canvas">
      <div className="toolbar">
        <button onClick={handleUndo} disabled={!state.canUndo}>
          ↶ Undo
        </button>
        <button onClick={handleRedo} disabled={!state.canRedo}>
          ↷ Redo
        </button>
        <button onClick={handleClear}>
          Clear
        </button>
        <span>Strokes: {state.present.strokes.length}</span>
      </div>
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="canvas"
      />
    </div>
  );
}

export default DrawingCanvas;
```

### Form with Undo/Redo

```tsx
import React, { useState } from 'react';
import { useUndoRedoStack } from '@web-loom/ui-core/react';

interface FormState {
  name: string;
  email: string;
  message: string;
}

function UndoableForm() {
  const [formData, setFormData] = useState<FormState>({
    name: '',
    email: '',
    message: '',
  });

  const undoRedo = useUndoRedoStack<FormState>({
    initialState: formData,
    maxLength: 20,
    onStateChange: (state) => setFormData(state),
  });

  const handleFieldChange = (field: keyof FormState, value: string) => {
    const newState = { ...formData, [field]: value };
    setFormData(newState);
    undoRedo.pushState(newState);
  };

  const state = undoRedo.getState();

  return (
    <div className="undoable-form">
      <div className="toolbar">
        <button onClick={() => undoRedo.undo()} disabled={!state.canUndo}>
          ↶ Undo
        </button>
        <button onClick={() => undoRedo.redo()} disabled={!state.canRedo}>
          ↷ Redo
        </button>
      </div>

      <form>
        <div className="form-field">
          <label htmlFor="name">Name:</label>
          <input
            id="name"
            type="text"
            value={formData.name}
            onChange={(e) => handleFieldChange('name', e.target.value)}
          />
        </div>

        <div className="form-field">
          <label htmlFor="email">Email:</label>
          <input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleFieldChange('email', e.target.value)}
          />
        </div>

        <div className="form-field">
          <label htmlFor="message">Message:</label>
          <textarea
            id="message"
            value={formData.message}
            onChange={(e) => handleFieldChange('message', e.target.value)}
          />
        </div>
      </form>
    </div>
  );
}

export default UndoableForm;
```

---

## Drag and Drop

### Reorderable List

```tsx
import React, { useState } from 'react';
import { useDragDropBehavior } from '@web-loom/ui-core/react';

interface Item {
  id: string;
  text: string;
}

function ReorderableList() {
  const [items, setItems] = useState<Item[]>([
    { id: '1', text: 'Item 1' },
    { id: '2', text: 'Item 2' },
    { id: '3', text: 'Item 3' },
    { id: '4', text: 'Item 4' },
  ]);

  const dragDrop = useDragDropBehavior({
    onDragStart: (itemId) => console.log('Drag started:', itemId),
    onDragEnd: (itemId) => console.log('Drag ended:', itemId),
    onDrop: (draggedId, targetId) => {
      // Reorder items
      const draggedIndex = items.findIndex(item => item.id === draggedId);
      const targetIndex = items.findIndex(item => item.id === targetId);

      if (draggedIndex === -1 || targetIndex === -1) return;

      const newItems = [...items];
      const [draggedItem] = newItems.splice(draggedIndex, 1);
      newItems.splice(targetIndex, 0, draggedItem);
      setItems(newItems);
    },
  });

  // Register all items as drop zones
  React.useEffect(() => {
    items.forEach(item => {
      dragDrop.registerDropZone(item.id);
    });

    return () => {
      items.forEach(item => {
        dragDrop.unregisterDropZone(item.id);
      });
    };
  }, [items]);

  const handleDragStart = (itemId: string) => {
    dragDrop.startDrag(itemId);
  };

  const handleDragOver = (itemId: string) => {
    dragDrop.setDropTarget(itemId);
  };

  const handleDrop = (itemId: string) => {
    dragDrop.drop(itemId);
    dragDrop.endDrag();
  };

  const state = dragDrop.getState();

  return (
    <div className="reorderable-list">
      <h2>Drag to Reorder</h2>
      <ul>
        {items.map(item => (
          <li
            key={item.id}
            draggable
            onDragStart={() => handleDragStart(item.id)}
            onDragOver={(e) => {
              e.preventDefault();
              handleDragOver(item.id);
            }}
            onDrop={() => handleDrop(item.id)}
            className={`
              ${state.draggedItem === item.id ? 'dragging' : ''}
              ${state.dropTarget === item.id ? 'drop-target' : ''}
            `}
          >
            {item.text}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ReorderableList;
```

### Kanban Board

```tsx
import React, { useState } from 'react';
import { useDragDropBehavior } from '@web-loom/ui-core/react';

interface Task {
  id: string;
  title: string;
  column: string;
}

function KanbanBoard() {
  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', title: 'Task 1', column: 'todo' },
    { id: '2', title: 'Task 2', column: 'todo' },
    { id: '3', title: 'Task 3', column: 'in-progress' },
    { id: '4', title: 'Task 4', column: 'done' },
  ]);

  const columns = ['todo', 'in-progress', 'done'];

  const dragDrop = useDragDropBehavior({
    onDrop: (taskId, columnId) => {
      setTasks(prev =>
        prev.map(task =>
          task.id === taskId ? { ...task, column: columnId } : task
        )
      );
    },
  });

  React.useEffect(() => {
    columns.forEach(col => dragDrop.registerDropZone(col));
    return () => {
      columns.forEach(col => dragDrop.unregisterDropZone(col));
    };
  }, []);

  const getTasksForColumn = (column: string) =>
    tasks.filter(task => task.column === column);

  return (
    <div className="kanban-board">
      {columns.map(column => (
        <div
          key={column}
          className="kanban-column"
          onDragOver={(e) => {
            e.preventDefault();
            dragDrop.setDropTarget(column);
          }}
          onDrop={() => {
            const state = dragDrop.getState();
            if (state.draggedItem) {
              dragDrop.drop(column);
            }
            dragDrop.endDrag();
          }}
        >
          <h3>{column.replace('-', ' ').toUpperCase()}</h3>
          {getTasksForColumn(column).map(task => (
            <div
              key={task.id}
              draggable
              onDragStart={() => dragDrop.startDrag(task.id)}
              className="kanban-task"
            >
              {task.title}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export default KanbanBoard;
```

### File Upload with Drag and Drop

```tsx
import React, { useState } from 'react';
import { useDragDropBehavior } from '@web-loom/ui-core/react';

function FileUploadZone() {
  const [files, setFiles] = useState<File[]>([]);

  const dragDrop = useDragDropBehavior({
    onDragStart: () => console.log('Drag started'),
    onDrop: (_, __, data) => {
      if (data?.files) {
        setFiles(prev => [...prev, ...Array.from(data.files)]);
      }
    },
  });

  React.useEffect(() => {
    dragDrop.registerDropZone('upload-zone');
    return () => dragDrop.unregisterDropZone('upload-zone');
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    dragDrop.setDropTarget('upload-zone');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    dragDrop.startDrag('files', { files: droppedFiles });
    dragDrop.drop('upload-zone');
    dragDrop.endDrag();
  };

  const state = dragDrop.getState();

  return (
    <div className="file-upload">
      <div
        className={`upload-zone ${state.dropTarget === 'upload-zone' ? 'active' : ''}`}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <p>Drag files here to upload</p>
      </div>

      {files.length > 0 && (
        <div className="file-list">
          <h3>Uploaded Files:</h3>
          <ul>
            {files.map((file, index) => (
              <li key={index}>{file.name}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default FileUploadZone;
```

---

## Roving Focus (Enhanced)

### Menu with Focus Tracking

```tsx
import React, { useState } from 'react';
import { useRovingFocus } from '@web-loom/ui-core/react';

interface MenuItem {
  id: string;
  label: string;
  icon: string;
}

function MenuWithFocusTracking() {
  const [focusedItem, setFocusedItem] = useState<string | null>(null);
  const [previousItem, setPreviousItem] = useState<string | null>(null);

  const items: MenuItem[] = [
    { id: 'new', label: 'New File', icon: '📄' },
    { id: 'open', label: 'Open', icon: '📂' },
    { id: 'save', label: 'Save', icon: '💾' },
    { id: 'close', label: 'Close', icon: '❌' },
  ];

  const rovingFocus = useRovingFocus({
    items: items.map(item => item.id),
    onFocusChange: (index, itemId, previousIndex) => {
      setFocusedItem(itemId);
      if (previousIndex !== -1) {
        setPreviousItem(items[previousIndex]?.id || null);
      }
      console.log(`Focus moved from ${previousIndex} to ${index}`);
    },
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      rovingFocus.moveNext();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      rovingFocus.movePrevious();
    } else if (e.key === 'Home') {
      e.preventDefault();
      rovingFocus.moveFirst();
    } else if (e.key === 'End') {
      e.preventDefault();
      rovingFocus.moveLast();
    }
  };

  const state = rovingFocus.getState();

  return (
    <div className="menu-with-tracking" onKeyDown={handleKeyDown}>
      <div className="focus-info">
        <p>Currently focused: {focusedItem || 'None'}</p>
        <p>Previously focused: {previousItem || 'None'}</p>
      </div>

      <ul role="menu">
        {items.map((item, index) => (
          <li
            key={item.id}
            role="menuitem"
            tabIndex={state.focusedIndex === index ? 0 : -1}
            className={state.focusedIndex === index ? 'focused' : ''}
            onClick={() => rovingFocus.setFocusedIndex(index)}
          >
            <span className="icon">{item.icon}</span>
            <span className="label">{item.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default MenuWithFocusTracking;
```

---

## Form Behavior (Enhanced)

### Form with Server-Side Validation

```tsx
import React, { useState } from 'react';
import { useFormBehavior } from '@web-loom/ui-core/react';

interface LoginForm {
  username: string;
  password: string;
}

function LoginFormWithServerValidation() {
  const form = useFormBehavior<LoginForm>({
    initialValues: {
      username: '',
      password: '',
    },
    validators: {
      username: (value) => {
        if (!value) return 'Username is required';
        if (value.length < 3) return 'Username must be at least 3 characters';
        return null;
      },
      password: (value) => {
        if (!value) return 'Password is required';
        if (value.length < 8) return 'Password must be at least 8 characters';
        return null;
      },
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    form.validateForm();
    const state = form.getState();

    if (!state.isValid) {
      return;
    }

    try {
      // Simulate API call
      const response = await fetch('/api/login', {
        method: 'POST',
        body: JSON.stringify(state.values),
      });

      if (!response.ok) {
        const error = await response.json();

        // Set server-side errors manually
        if (error.field === 'username') {
          form.setFieldError('username', error.message);
        } else if (error.field === 'password') {
          form.setFieldError('password', error.message);
        }
      } else {
        console.log('Login successful!');
      }
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const state = form.getState();

  return (
    <form onSubmit={handleSubmit} className="login-form">
      <div className="form-field">
        <label htmlFor="username">Username:</label>
        <input
          id="username"
          type="text"
          value={state.values.username}
          onChange={(e) => form.setFieldValue('username', e.target.value)}
          onBlur={() => form.validateField('username')}
          aria-invalid={!!state.errors.username}
          aria-describedby={state.errors.username ? 'username-error' : undefined}
        />
        {state.errors.username && (
          <span id="username-error" className="error">
            {state.errors.username}
          </span>
        )}
      </div>

      <div className="form-field">
        <label htmlFor="password">Password:</label>
        <input
          id="password"
          type="password"
          value={state.values.password}
          onChange={(e) => form.setFieldValue('password', e.target.value)}
          onBlur={() => form.validateField('password')}
          aria-invalid={!!state.errors.password}
          aria-describedby={state.errors.password ? 'password-error' : undefined}
        />
        {state.errors.password && (
          <span id="password-error" className="error">
            {state.errors.password}
          </span>
        )}
      </div>

      <button type="submit" disabled={!state.isValid}>
        Login
      </button>
    </form>
  );
}

export default LoginFormWithServerValidation;
```

---

## Complete Integration Example

### Text Editor with All Features

```tsx
import React, { useState, useEffect } from 'react';
import {
  useKeyboardShortcuts,
  useUndoRedoStack,
  useFormBehavior,
} from '@web-loom/ui-core/react';

interface EditorState {
  content: string;
  title: string;
}

function FullFeaturedTextEditor() {
  const [isSaved, setIsSaved] = useState(true);

  // Undo/Redo for editor content
  const undoRedo = useUndoRedoStack<EditorState>({
    initialState: { content: '', title: 'Untitled' },
    maxLength: 100,
  });

  // Form behavior for metadata
  const form = useFormBehavior({
    initialValues: {
      title: 'Untitled',
      author: '',
    },
  });

  // Keyboard shortcuts
  const shortcuts = useKeyboardShortcuts();

  useEffect(() => {
    // Save shortcut
    shortcuts.registerShortcut({
      key: 'Ctrl+S',
      handler: handleSave,
      description: 'Save document',
      preventDefault: true,
    });

    // Undo shortcut
    shortcuts.registerShortcut({
      key: 'Ctrl+Z',
      handler: () => undoRedo.undo(),
      description: 'Undo',
      preventDefault: true,
    });

    // Redo shortcut
    shortcuts.registerShortcut({
      key: 'Ctrl+Y',
      handler: () => undoRedo.redo(),
      description: 'Redo',
      preventDefault: true,
    });

    return () => shortcuts.destroy();
  }, []);

  const handleSave = () => {
    console.log('Saving document...');
    setIsSaved(true);
    // Save logic here
  };

  const handleContentChange = (content: string) => {
    const state = undoRedo.getState();
    undoRedo.pushState({ ...state.present, content });
    setIsSaved(false);
  };

  const undoRedoState = undoRedo.getState();
  const formState = form.getState();

  return (
    <div className="full-featured-editor">
      <div className="toolbar">
        <input
          type="text"
          value={formState.values.title}
          onChange={(e) => form.setFieldValue('title', e.target.value)}
          placeholder="Document title"
        />

        <button
          onClick={() => undoRedo.undo()}
          disabled={!undoRedoState.canUndo}
        >
          ↶ Undo (Ctrl+Z)
        </button>

        <button
          onClick={() => undoRedo.redo()}
          disabled={!undoRedoState.canRedo}
        >
          ↷ Redo (Ctrl+Y)
        </button>

        <button onClick={handleSave} disabled={isSaved}>
          💾 Save (Ctrl+S)
        </button>

        <span className={isSaved ? 'saved' : 'unsaved'}>
          {isSaved ? '✓ Saved' : '• Unsaved changes'}
        </span>
      </div>

      <textarea
        value={undoRedoState.present.content}
        onChange={(e) => handleContentChange(e.target.value)}
        placeholder="Start typing..."
        className="editor-content"
      />

      <div className="status-bar">
        <span>History: {undoRedoState.past.length} / {undoRedoState.maxLength}</span>
        <span>Characters: {undoRedoState.present.content.length}</span>
      </div>
    </div>
  );
}

export default FullFeaturedTextEditor;
```

---

## Best Practices

### 1. Always Clean Up

```tsx
useEffect(() => {
  const shortcuts = createKeyboardShortcuts();
  // ... register shortcuts

  return () => shortcuts.destroy(); // Important!
}, []);
```

### 2. Use Proper Dependencies

```tsx
useEffect(() => {
  shortcuts.registerShortcut({
    key: 'Ctrl+S',
    handler: handleSave, // Make sure handleSave is stable
  });
}, [handleSave]); // Include in dependencies
```

### 3. Debounce Expensive Operations

```tsx
const debouncedPushState = useMemo(
  () => debounce((state) => undoRedo.pushState(state), 300),
  []
);

const handleChange = (value: string) => {
  setValue(value);
  debouncedPushState(value);
};
```

### 4. Provide Keyboard Alternatives

```tsx
// Always provide both mouse and keyboard interactions
<button
  onClick={handleAction}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleAction();
    }
  }}
>
  Action
</button>
```

---

## TypeScript Tips

### Type-Safe Shortcuts

```tsx
type ShortcutKey = 'Ctrl+S' | 'Ctrl+K' | 'Ctrl+Z' | 'Ctrl+Y';

const registerTypedShortcut = (key: ShortcutKey, handler: () => void) => {
  shortcuts.registerShortcut({ key, handler });
};
```

### Generic Undo/Redo

```tsx
function useTypedUndoRedo<T>(initialState: T) {
  return useUndoRedoStack<T>({
    initialState,
    maxLength: 50,
  });
}

// Usage
const undoRedo = useTypedUndoRedo<MyStateType>({ ... });
```

---

This completes the React examples for UI Core behaviors. For UI Patterns examples, see the patterns documentation.
