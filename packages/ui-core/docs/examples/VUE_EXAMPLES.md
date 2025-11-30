# Vue Framework Examples - UI Core Behaviors

This document provides comprehensive Vue 3 Composition API examples for all UI Core behaviors.

## Table of Contents

1. [Keyboard Shortcuts](#keyboard-shortcuts)
2. [Undo/Redo Stack](#undoredo-stack)
3. [Drag and Drop](#drag-and-drop)
4. [Roving Focus (Enhanced)](#roving-focus-enhanced)
5. [Form Behavior (Enhanced)](#form-behavior-enhanced)

---

## Keyboard Shortcuts

### Basic Command Palette

```typescript
<template>
  <div v-if="isOpen" class="command-palette">
    <input
      type="text"
      placeholder="Type a command..."
      ref="inputRef"
      @keydown="handleKeyDown"
    />
    <div class="shortcuts-help">
      <p>Press Escape to close</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue';
import { useKeyboardShortcuts } from '@web-loom/ui-core/vue';

const isOpen = ref(false);
const inputRef = ref<HTMLInputElement | null>(null);

const shortcuts = useKeyboardShortcuts({
  onShortcutExecuted: (key) => console.log(`Executed: ${key}`),
});

onMounted(() => {
  // Register Ctrl+K to open palette
  shortcuts.registerShortcut({
    key: 'Ctrl+K',
    handler: () => {
      isOpen.value = true;
    },
    description: 'Open command palette',
    preventDefault: true,
  });

  // Register Escape to close (scoped)
  shortcuts.registerShortcut({
    key: 'Escape',
    handler: () => {
      isOpen.value = false;
    },
    description: 'Close command palette',
    scope: 'scoped',
  });
});

// Switch scope when palette opens/closes
watch(isOpen, (newValue) => {
  shortcuts.setScope(newValue ? 'scoped' : 'global');

  if (newValue) {
    // Focus input when opened
    setTimeout(() => inputRef.value?.focus(), 0);
  }
});

const handleKeyDown = (e: KeyboardEvent) => {
  // Additional keyboard handling if needed
};

onUnmounted(() => {
  shortcuts.destroy();
});
</script>

<style scoped>
.command-palette {
  position: fixed;
  top: 20%;
  left: 50%;
  transform: translateX(-50%);
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  min-width: 400px;
}
</style>
```

### Text Editor with Multiple Shortcuts

```typescript
<template>
  <div class="text-editor">
    <textarea
      v-model="content"
      placeholder="Start typing..."
      class="editor-content"
    />
    <div class="shortcuts-bar">
      <span>Ctrl+S: Save</span>
      <span>Ctrl+B: Bold</span>
      <span>Ctrl+I: Italic</span>
      <span>Ctrl+F: Find</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useKeyboardShortcuts } from '@web-loom/ui-core/vue';

const content = ref('');
const shortcuts = useKeyboardShortcuts();

onMounted(() => {
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
});

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

onUnmounted(() => {
  shortcuts.destroy();
});
</script>
```

### Shortcut Help Panel

```typescript
<template>
  <div class="shortcut-help">
    <h2>Keyboard Shortcuts</h2>
    <table>
      <thead>
        <tr>
          <th>Shortcut</th>
          <th>Description</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(shortcut, index) in shortcutList" :key="index">
          <td><kbd>{{ shortcut.key }}</kbd></td>
          <td>{{ shortcut.description }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useKeyboardShortcuts } from '@web-loom/ui-core/vue';

const shortcutList = ref<Array<{ key: string; description: string }>>([]);
const shortcuts = useKeyboardShortcuts();

onMounted(() => {
  // Register some shortcuts
  shortcuts.registerShortcut({
    key: 'Ctrl+K',
    handler: () => {},
    description: 'Open command palette',
  });

  shortcuts.registerShortcut({
    key: 'Ctrl+S',
    handler: () => {},
    description: 'Save document',
  });

  shortcuts.registerShortcut({
    key: 'Ctrl+Shift+P',
    handler: () => {},
    description: 'Open preferences',
  });

  // Get all registered shortcuts
  const state = shortcuts.getState();
  shortcutList.value = Array.from(state.shortcuts.values()).map(s => ({
    key: s.key,
    description: s.description || 'No description',
  }));
});

onUnmounted(() => {
  shortcuts.destroy();
});
</script>
```

---

## Undo/Redo Stack

### Simple Text Editor with Undo/Redo

```typescript
<template>
  <div class="undoable-editor">
    <div class="toolbar">
      <button
        @click="handleUndo"
        :disabled="!state.canUndo"
        aria-label="Undo"
      >
        ↶ Undo
      </button>
      <button
        @click="handleRedo"
        :disabled="!state.canRedo"
        aria-label="Redo"
      >
        ↷ Redo
      </button>
      <span class="history-info">
        History: {{ state.past.length }} / {{ state.maxLength }}
      </span>
    </div>
    <textarea
      v-model="text"
      @input="handleTextChange"
      placeholder="Type something..."
      class="editor-content"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useUndoRedoStack } from '@web-loom/ui-core/vue';

const text = ref('');

const undoRedo = useUndoRedoStack({
  initialState: '',
  maxLength: 50,
  onStateChange: (newText) => {
    text.value = newText;
  },
});

const state = computed(() => undoRedo.getState());

const handleTextChange = () => {
  undoRedo.pushState(text.value);
};

const handleUndo = () => {
  undoRedo.undo();
};

const handleRedo = () => {
  undoRedo.redo();
};

onUnmounted(() => {
  undoRedo.destroy();
});
</script>
```

### Drawing Canvas with Undo/Redo

```typescript
<template>
  <div class="drawing-canvas">
    <div class="toolbar">
      <button @click="handleUndo" :disabled="!state.canUndo">
        ↶ Undo
      </button>
      <button @click="handleRedo" :disabled="!state.canRedo">
        ↷ Redo
      </button>
      <button @click="handleClear">
        Clear
      </button>
      <span>Strokes: {{ state.present.strokes.length }}</span>
    </div>
    <canvas
      ref="canvasRef"
      width="800"
      height="600"
      @mousedown="handleMouseDown"
      @mousemove="handleMouseMove"
      @mouseup="handleMouseUp"
      @mouseleave="handleMouseUp"
      class="canvas"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useUndoRedoStack } from '@web-loom/ui-core/vue';

interface CanvasState {
  strokes: Array<{ x: number; y: number }[]>;
}

const canvasRef = ref<HTMLCanvasElement | null>(null);
const isDrawing = ref(false);
const currentStroke = ref<Array<{ x: number; y: number }>>([]);

const undoRedo = useUndoRedoStack<CanvasState>({
  initialState: { strokes: [] },
  maxLength: 100,
  onStateChange: (state) => redrawCanvas(state),
});

const state = computed(() => undoRedo.getState());

const redrawCanvas = (canvasState: CanvasState) => {
  const canvas = canvasRef.value;
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Redraw all strokes
  canvasState.strokes.forEach(stroke => {
    if (stroke.length < 2) return;

    ctx.beginPath();
    ctx.moveTo(stroke[0].x, stroke[0].y);
    stroke.slice(1).forEach(point => {
      ctx.lineTo(point.x, point.y);
    });
    ctx.stroke();
  });
};

const handleMouseDown = (e: MouseEvent) => {
  isDrawing.value = true;
  const rect = canvasRef.value?.getBoundingClientRect();
  if (!rect) return;

  currentStroke.value = [{
    x: e.clientX - rect.left,
    y: e.clientY - rect.top,
  }];
};

const handleMouseMove = (e: MouseEvent) => {
  if (!isDrawing.value) return;

  const rect = canvasRef.value?.getBoundingClientRect();
  if (!rect) return;

  const point = {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top,
  };

  currentStroke.value.push(point);

  // Draw current stroke
  const ctx = canvasRef.value?.getContext('2d');
  if (!ctx || currentStroke.value.length === 0) return;

  const lastPoint = currentStroke.value[currentStroke.value.length - 2];
  ctx.beginPath();
  ctx.moveTo(lastPoint.x, lastPoint.y);
  ctx.lineTo(point.x, point.y);
  ctx.stroke();
};

const handleMouseUp = () => {
  if (!isDrawing.value) return;
  isDrawing.value = false;

  // Save stroke to history
  const currentState = undoRedo.getState();
  undoRedo.pushState({
    strokes: [...currentState.present.strokes, currentStroke.value],
  });

  currentStroke.value = [];
};

const handleUndo = () => undoRedo.undo();
const handleRedo = () => undoRedo.redo();
const handleClear = () => {
  undoRedo.pushState({ strokes: [] });
};

onUnmounted(() => {
  undoRedo.destroy();
});
</script>
```

### Form with Undo/Redo

```typescript
<template>
  <div class="undoable-form">
    <div class="toolbar">
      <button @click="handleUndo" :disabled="!state.canUndo">
        ↶ Undo
      </button>
      <button @click="handleRedo" :disabled="!state.canRedo">
        ↷ Redo
      </button>
    </div>

    <form>
      <div class="form-field">
        <label for="name">Name:</label>
        <input
          id="name"
          type="text"
          v-model="formData.name"
          @input="handleFieldChange"
        />
      </div>

      <div class="form-field">
        <label for="email">Email:</label>
        <input
          id="email"
          type="email"
          v-model="formData.email"
          @input="handleFieldChange"
        />
      </div>

      <div class="form-field">
        <label for="message">Message:</label>
        <textarea
          id="message"
          v-model="formData.message"
          @input="handleFieldChange"
        />
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onUnmounted } from 'vue';
import { useUndoRedoStack } from '@web-loom/ui-core/vue';

interface FormState {
  name: string;
  email: string;
  message: string;
}

const formData = reactive<FormState>({
  name: '',
  email: '',
  message: '',
});

const undoRedo = useUndoRedoStack<FormState>({
  initialState: { ...formData },
  maxLength: 20,
  onStateChange: (state) => {
    Object.assign(formData, state);
  },
});

const state = computed(() => undoRedo.getState());

const handleFieldChange = () => {
  undoRedo.pushState({ ...formData });
};

const handleUndo = () => undoRedo.undo();
const handleRedo = () => undoRedo.redo();

onUnmounted(() => {
  undoRedo.destroy();
});
</script>
```

---

## Drag and Drop

### Reorderable List

```typescript
<template>
  <div class="reorderable-list">
    <h2>Drag to Reorder</h2>
    <ul>
      <li
        v-for="item in items"
        :key="item.id"
        draggable="true"
        @dragstart="handleDragStart(item.id)"
        @dragover.prevent="handleDragOver(item.id)"
        @drop="handleDrop(item.id)"
        :class="{
          'dragging': state.draggedItem === item.id,
          'drop-target': state.dropTarget === item.id,
        }"
      >
        {{ item.text }}
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useDragDropBehavior } from '@web-loom/ui-core/vue';

interface Item {
  id: string;
  text: string;
}

const items = ref<Item[]>([
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
    const draggedIndex = items.value.findIndex(item => item.id === draggedId);
    const targetIndex = items.value.findIndex(item => item.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newItems = [...items.value];
    const [draggedItem] = newItems.splice(draggedIndex, 1);
    newItems.splice(targetIndex, 0, draggedItem);
    items.value = newItems;
  },
});

const state = computed(() => dragDrop.getState());

// Register all items as drop zones
watch(items, (newItems) => {
  newItems.forEach(item => {
    dragDrop.registerDropZone(item.id);
  });
}, { immediate: true });

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

onUnmounted(() => {
  items.value.forEach(item => {
    dragDrop.unregisterDropZone(item.id);
  });
  dragDrop.destroy();
});
</script>
```

### Kanban Board

```typescript
<template>
  <div class="kanban-board">
    <div
      v-for="column in columns"
      :key="column"
      class="kanban-column"
      @dragover.prevent="dragDrop.setDropTarget(column)"
      @drop="handleColumnDrop(column)"
    >
      <h3>{{ column.replace('-', ' ').toUpperCase() }}</h3>
      <div
        v-for="task in getTasksForColumn(column)"
        :key="task.id"
        draggable="true"
        @dragstart="dragDrop.startDrag(task.id)"
        class="kanban-task"
      >
        {{ task.title }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useDragDropBehavior } from '@web-loom/ui-core/vue';

interface Task {
  id: string;
  title: string;
  column: string;
}

const tasks = ref<Task[]>([
  { id: '1', title: 'Task 1', column: 'todo' },
  { id: '2', title: 'Task 2', column: 'todo' },
  { id: '3', title: 'Task 3', column: 'in-progress' },
  { id: '4', title: 'Task 4', column: 'done' },
]);

const columns = ['todo', 'in-progress', 'done'];

const dragDrop = useDragDropBehavior({
  onDrop: (taskId, columnId) => {
    tasks.value = tasks.value.map(task =>
      task.id === taskId ? { ...task, column: columnId } : task
    );
  },
});

onMounted(() => {
  columns.forEach(col => dragDrop.registerDropZone(col));
});

const getTasksForColumn = (column: string) =>
  tasks.value.filter(task => task.column === column);

const handleColumnDrop = (column: string) => {
  const state = dragDrop.getState();
  if (state.draggedItem) {
    dragDrop.drop(column);
  }
  dragDrop.endDrag();
};

onUnmounted(() => {
  columns.forEach(col => dragDrop.unregisterDropZone(col));
  dragDrop.destroy();
});
</script>
```

### File Upload with Drag and Drop

```vue
<template>
  <div class="file-upload">
    <div
      :class="['upload-zone', { active: state.dropTarget === 'upload-zone' }]"
      @dragover.prevent="handleDragOver"
      @drop.prevent="handleDrop"
    >
      <p>Drag files here to upload</p>
    </div>

    <div v-if="files.length > 0" class="file-list">
      <h3>Uploaded Files:</h3>
      <ul>
        <li v-for="(file, index) in files" :key="index">
          {{ file.name }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useDragDropBehavior } from '@web-loom/ui-core/vue';

const files = ref<File[]>([]);

const dragDrop = useDragDropBehavior({
  onDragStart: () => console.log('Drag started'),
  onDrop: (_, __, data) => {
    if (data?.files) {
      files.value = [...files.value, ...Array.from(data.files)];
    }
  },
});

const state = computed(() => dragDrop.getState());

onMounted(() => {
  dragDrop.registerDropZone('upload-zone');
});

const handleDragOver = () => {
  dragDrop.setDropTarget('upload-zone');
};

const handleDrop = (e: DragEvent) => {
  const droppedFiles = Array.from(e.dataTransfer?.files || []);
  dragDrop.startDrag('files', { files: droppedFiles });
  dragDrop.drop('upload-zone');
  dragDrop.endDrag();
};

onUnmounted(() => {
  dragDrop.unregisterDropZone('upload-zone');
  dragDrop.destroy();
});
</script>
```

---

## Roving Focus (Enhanced)

### Menu with Focus Tracking

```vue
<template>
  <div class="menu-with-tracking" @keydown="handleKeyDown">
    <div class="focus-info">
      <p>Currently focused: {{ focusedItem || 'None' }}</p>
      <p>Previously focused: {{ previousItem || 'None' }}</p>
    </div>

    <ul role="menu">
      <li
        v-for="(item, index) in items"
        :key="item.id"
        role="menuitem"
        :tabindex="state.focusedIndex === index ? 0 : -1"
        :class="{ focused: state.focusedIndex === index }"
        @click="rovingFocus.setFocusedIndex(index)"
      >
        <span class="icon">{{ item.icon }}</span>
        <span class="label">{{ item.label }}</span>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRovingFocus } from '@web-loom/ui-core/vue';

interface MenuItem {
  id: string;
  label: string;
  icon: string;
}

const focusedItem = ref<string | null>(null);
const previousItem = ref<string | null>(null);

const items: MenuItem[] = [
  { id: 'new', label: 'New File', icon: '📄' },
  { id: 'open', label: 'Open', icon: '📂' },
  { id: 'save', label: 'Save', icon: '💾' },
  { id: 'close', label: 'Close', icon: '❌' },
];

const rovingFocus = useRovingFocus({
  items: items.map((item) => item.id),
  onFocusChange: (index, itemId, previousIndex) => {
    focusedItem.value = itemId;
    if (previousIndex !== -1) {
      previousItem.value = items[previousIndex]?.id || null;
    }
    console.log(`Focus moved from ${previousIndex} to ${index}`);
  },
});

const state = computed(() => rovingFocus.getState());

const handleKeyDown = (e: KeyboardEvent) => {
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

onUnmounted(() => {
  rovingFocus.destroy();
});
</script>
```

---

## Form Behavior (Enhanced)

### Form with Server-Side Validation

```vue
<template>
  <form @submit.prevent="handleSubmit" class="login-form">
    <div class="form-field">
      <label for="username">Username:</label>
      <input
        id="username"
        type="text"
        v-model="state.values.username"
        @input="form.setFieldValue('username', $event.target.value)"
        @blur="form.validateField('username')"
        :aria-invalid="!!state.errors.username"
        :aria-describedby="state.errors.username ? 'username-error' : undefined"
      />
      <span v-if="state.errors.username" id="username-error" class="error">
        {{ state.errors.username }}
      </span>
    </div>

    <div class="form-field">
      <label for="password">Password:</label>
      <input
        id="password"
        type="password"
        v-model="state.values.password"
        @input="form.setFieldValue('password', $event.target.value)"
        @blur="form.validateField('password')"
        :aria-invalid="!!state.errors.password"
        :aria-describedby="state.errors.password ? 'password-error' : undefined"
      />
      <span v-if="state.errors.password" id="password-error" class="error">
        {{ state.errors.password }}
      </span>
    </div>

    <button type="submit" :disabled="!state.isValid">Login</button>
  </form>
</template>

<script setup lang="ts">
import { computed, onUnmounted } from 'vue';
import { useFormBehavior } from '@web-loom/ui-core/vue';

interface LoginForm {
  username: string;
  password: string;
}

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

const state = computed(() => form.getState());

const handleSubmit = async () => {
  // Validate form
  form.validateForm();
  const currentState = form.getState();

  if (!currentState.isValid) {
    return;
  }

  try {
    // Simulate API call
    const response = await fetch('/api/login', {
      method: 'POST',
      body: JSON.stringify(currentState.values),
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

onUnmounted(() => {
  form.destroy();
});
</script>
```

---

## Complete Integration Example

### Text Editor with All Features

```vue
<template>
  <div class="full-featured-editor">
    <div class="toolbar">
      <input
        type="text"
        v-model="formState.values.title"
        @input="form.setFieldValue('title', $event.target.value)"
        placeholder="Document title"
      />

      <button @click="undoRedo.undo()" :disabled="!undoRedoState.canUndo">↶ Undo (Ctrl+Z)</button>

      <button @click="undoRedo.redo()" :disabled="!undoRedoState.canRedo">↷ Redo (Ctrl+Y)</button>

      <button @click="handleSave" :disabled="isSaved">💾 Save (Ctrl+S)</button>

      <span :class="isSaved ? 'saved' : 'unsaved'">
        {{ isSaved ? '✓ Saved' : '• Unsaved changes' }}
      </span>
    </div>

    <textarea v-model="content" @input="handleContentChange" placeholder="Start typing..." class="editor-content" />

    <div class="status-bar">
      <span>History: {{ undoRedoState.past.length }} / {{ undoRedoState.maxLength }}</span>
      <span>Characters: {{ undoRedoState.present.content.length }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useKeyboardShortcuts, useUndoRedoStack, useFormBehavior } from '@web-loom/ui-core/vue';

interface EditorState {
  content: string;
  title: string;
}

const isSaved = ref(true);
const content = ref('');

// Undo/Redo for editor content
const undoRedo = useUndoRedoStack<EditorState>({
  initialState: { content: '', title: 'Untitled' },
  maxLength: 100,
});

const undoRedoState = computed(() => undoRedo.getState());

// Form behavior for metadata
const form = useFormBehavior({
  initialValues: {
    title: 'Untitled',
    author: '',
  },
});

const formState = computed(() => form.getState());

// Keyboard shortcuts
const shortcuts = useKeyboardShortcuts();

onMounted(() => {
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
});

const handleSave = () => {
  console.log('Saving document...');
  isSaved.value = true;
  // Save logic here
};

const handleContentChange = () => {
  const state = undoRedo.getState();
  undoRedo.pushState({ ...state.present, content: content.value });
  isSaved.value = false;
};

onUnmounted(() => {
  shortcuts.destroy();
  undoRedo.destroy();
  form.destroy();
});
</script>
```

---

## Best Practices

### 1. Always Clean Up

```vue
<script setup>
import { onUnmounted } from 'vue';

const shortcuts = useKeyboardShortcuts();

onUnmounted(() => {
  shortcuts.destroy(); // Important!
});
</script>
```

### 2. Use Computed for Reactive State

```vue
<script setup>
import { computed } from 'vue';

const shortcuts = useKeyboardShortcuts();
const state = computed(() => shortcuts.getState());

// Use state.value in template
</script>
```

### 3. Debounce Expensive Operations

```vue
<script setup>
import { ref } from 'vue';
import { useDebounceFn } from '@vueuse/core';

const undoRedo = useUndoRedoStack({ initialState: '' });

const debouncedPushState = useDebounceFn((value) => {
  undoRedo.pushState(value);
}, 300);

const handleChange = (value: string) => {
  debouncedPushState(value);
};
</script>
```

### 4. Provide Keyboard Alternatives

```vue
<template>
  <button @click="handleAction" @keydown.enter="handleAction" @keydown.space="handleAction">Action</button>
</template>
```

---

## TypeScript Tips

### Type-Safe Shortcuts

```typescript
type ShortcutKey = 'Ctrl+S' | 'Ctrl+K' | 'Ctrl+Z' | 'Ctrl+Y';

const registerTypedShortcut = (key: ShortcutKey, handler: () => void) => {
  shortcuts.registerShortcut({ key, handler });
};
```

### Generic Undo/Redo

```typescript
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

This completes the Vue examples for UI Core behaviors. For UI Patterns examples, see the patterns documentation.
