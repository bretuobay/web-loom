# @web-loom/ui-core

Framework-agnostic headless UI behaviors for modern web applications.

## Overview

`@web-loom/ui-core` provides atomic UI interaction behaviors that work across different frameworks (React, Vue, Angular) or with vanilla JavaScript. All behaviors are built on top of `@web-loom/store-core` for reactive state management and are completely headless - providing logic without assumptions about styling or DOM structure.

## Installation

```bash
npm install @web-loom/ui-core
```

## Features

- **Framework-agnostic**: Works with React, Vue, Angular, or vanilla JS
- **Lightweight**: Each behavior is <2KB gzipped with tree-shaking support
- **Type-safe**: Full TypeScript support with comprehensive type definitions
- **Headless**: Pure logic, no styling or DOM assumptions
- **Composable**: Behaviors can be combined to create complex patterns
- **Batteries included**: Framework adapters for React, Vue, and Angular
- **Reactive**: Built on observable patterns for automatic UI updates

## Available Behaviors

> **📚 Detailed Documentation**: See the [docs](./docs) folder for comprehensive guides on each behavior, including advanced usage, accessibility guidelines, and framework-specific examples.

### Dialog Behavior
Manages modal dialog state with open/close/toggle actions.

```typescript
import { createDialogBehavior } from '@web-loom/ui-core';

const dialog = createDialogBehavior({
  id: 'settings-dialog',
  onOpen: (content) => console.log('Dialog opened with:', content),
  onClose: () => console.log('Dialog closed'),
});

// Open the dialog
dialog.actions.open({ title: 'Settings', tab: 'general' });

// Subscribe to changes
const unsubscribe = dialog.subscribe((state) => {
  console.log('Dialog state:', state);
});

// Clean up
unsubscribe();
dialog.destroy();
```

### Disclosure Behavior
Controls expandable/collapsible content sections (accordions, dropdowns).

```typescript
import { createDisclosureBehavior } from '@web-loom/ui-core';

const disclosure = createDisclosureBehavior({
  id: 'faq-item',
  initialExpanded: false,
  onToggle: (isExpanded) => console.log('Expanded:', isExpanded),
});

disclosure.actions.toggle();
console.log(disclosure.getState().isExpanded); // true
```

### Form Behavior
Manages form state with validation, dirty tracking, and submission handling.

```typescript
import { createFormBehavior } from '@web-loom/ui-core';

const form = createFormBehavior({
  initialValues: { email: '', password: '' },
  validateOnChange: true,
  validateOnBlur: true,
  onSubmit: async (values) => {
    console.log('Submitting:', values);
  },
});

// Set field value
form.actions.setFieldValue('email', 'user@example.com');

// Set field error
form.actions.setFieldError('email', 'Invalid email format');

// Submit form
await form.actions.submitForm();
```

### List Selection Behavior
Manages single or multi-select list interactions with keyboard navigation support.

```typescript
import { createListSelection } from '@web-loom/ui-core';

const selection = createListSelection({
  items: ['item-1', 'item-2', 'item-3'],
  mode: 'multi',
  onSelectionChange: (selected) => console.log('Selected:', selected),
});

// Select items
selection.actions.select('item-1');
selection.actions.toggleSelection('item-2');

// Check selection
console.log(selection.getState().selectedItems); // ['item-1', 'item-2']
```

### Roving Focus Behavior
Implements keyboard navigation for composite widgets (toolbars, menus, grids).

```typescript
import { createRovingFocus } from '@web-loom/ui-core';

const rovingFocus = createRovingFocus({
  items: ['button-1', 'button-2', 'button-3'],
  orientation: 'horizontal',
  loop: true,
  onFocusChange: (focusedId) => console.log('Focused:', focusedId),
});

// Move focus
rovingFocus.actions.moveNext();
rovingFocus.actions.movePrevious();
rovingFocus.actions.moveFirst();
rovingFocus.actions.moveLast();
```

### Keyboard Shortcuts Behavior
Manages keyboard shortcut registration and execution with platform normalization.

```typescript
import { createKeyboardShortcuts } from '@web-loom/ui-core';

const shortcuts = createKeyboardShortcuts({
  scope: 'global',
  onShortcutExecuted: (key) => console.log(`Executed: ${key}`),
});

// Register shortcuts
shortcuts.actions.registerShortcut({
  key: 'Ctrl+K',
  handler: () => console.log('Command palette opened'),
  description: 'Open command palette',
  preventDefault: true,
});

// Platform-specific keys are normalized (Cmd on macOS, Ctrl on Windows/Linux)
shortcuts.actions.registerShortcut({
  key: 'Cmd+Shift+P',
  handler: () => console.log('Command palette opened'),
  description: 'Open command palette',
  preventDefault: true,
});

// Clean up
shortcuts.destroy();
```

### Undo/Redo Stack Behavior
Maintains an immutable history of states with undo/redo operations.

```typescript
import { createUndoRedoStack } from '@web-loom/ui-core';

interface EditorState {
  content: string;
  cursor: number;
}

const undoRedo = createUndoRedoStack<EditorState>({
  initialState: { content: '', cursor: 0 },
  maxLength: 100,
  onStateChange: (state) => console.log('State changed:', state),
});

// Push new states
undoRedo.actions.pushState({ content: 'Hello', cursor: 5 });
undoRedo.actions.pushState({ content: 'Hello World', cursor: 11 });

// Undo
undoRedo.actions.undo();
console.log(undoRedo.getState().present); // { content: 'Hello', cursor: 5 }

// Redo
undoRedo.actions.redo();
console.log(undoRedo.getState().present); // { content: 'Hello World', cursor: 11 }
```

### Drag-and-Drop Behavior
Manages drag-and-drop interaction state with validation and callbacks.

```typescript
import { createDragDropBehavior } from '@web-loom/ui-core';

const dragDrop = createDragDropBehavior({
  onDragStart: (itemId, data) => console.log('Drag started:', itemId),
  onDragEnd: (itemId) => console.log('Drag ended:', itemId),
  onDrop: (draggedItem, dropTarget, data) => {
    console.log('Dropped', draggedItem, 'on', dropTarget);
  },
  validateDrop: (draggedItem, dropTarget) => {
    return dropTarget !== 'restricted-zone';
  },
});

// Register drop zones
dragDrop.actions.registerDropZone('zone-1');
dragDrop.actions.registerDropZone('zone-2');

// Start dragging
dragDrop.actions.startDrag('item-1', { type: 'card', priority: 'high' });

// Perform drop
dragDrop.actions.drop('zone-1');
```

## Framework Adapters

### React

```typescript
import { useDialogBehavior } from '@web-loom/ui-core/react';

function MyComponent() {
  const dialog = useDialogBehavior({
    onOpen: (content) => console.log('Opened:', content),
  });

  return (
    <div>
      <button onClick={() => dialog.open({ title: 'Hello' })}>
        Open Dialog
      </button>
      {dialog.state.isOpen && (
        <div>Dialog is open with content: {dialog.state.content.title}</div>
      )}
    </div>
  );
}
```

### Vue

```typescript
import { useDialogBehavior } from '@web-loom/ui-core/vue';

export default {
  setup() {
    const dialog = useDialogBehavior({
      onOpen: (content) => console.log('Opened:', content),
    });

    return { dialog };
  },
};
```

```vue
<template>
  <div>
    <button @click="dialog.open({ title: 'Hello' })">Open Dialog</button>
    <div v-if="dialog.state.isOpen">
      Dialog is open with content: {{ dialog.state.content.title }}
    </div>
  </div>
</template>
```

### Angular

```typescript
import { Component } from '@angular/core';
import { DialogBehaviorService } from '@web-loom/ui-core/angular';

@Component({
  selector: 'app-my-component',
  template: `
    <button (click)="dialog.actions.open({ title: 'Hello' })">Open Dialog</button>
    <div *ngIf="(dialog.state$ | async)?.isOpen">
      Dialog is open
    </div>
  `,
  providers: [DialogBehaviorService],
})
export class MyComponent {
  constructor(public dialog: DialogBehaviorService) {}
}
```

## Vanilla JavaScript

```javascript
import { createDialogBehavior } from '@web-loom/ui-core';

const dialog = createDialogBehavior();

// Subscribe to state changes and update DOM
dialog.subscribe((state) => {
  const dialogEl = document.getElementById('my-dialog');
  dialogEl.style.display = state.isOpen ? 'block' : 'none';
});

// Attach to button
document.getElementById('open-btn').addEventListener('click', () => {
  dialog.actions.open({ title: 'Hello' });
});
```

## API Reference

### Common Behavior Interface

All behaviors follow a consistent interface:

```typescript
interface Behavior<State, Actions> {
  getState: () => State;
  subscribe: (listener: (state: State) => void) => () => void;
  actions: Actions;
  destroy: () => void;
}
```

- `getState()`: Returns current state snapshot
- `subscribe(listener)`: Subscribe to state changes, returns unsubscribe function
- `actions`: Object containing all available actions for the behavior
- `destroy()`: Cleanup method to remove all subscriptions

## Tree-Shaking

The package is built with ESM support and proper `sideEffects: false` configuration. Import only what you need:

```typescript
// Only imports the dialog behavior
import { createDialogBehavior } from '@web-loom/ui-core';

// Or use direct imports for maximum tree-shaking
import { createDialogBehavior } from '@web-loom/ui-core/behaviors/dialog';
```

## TypeScript

Full TypeScript support with exported types for all behaviors:

```typescript
import type {
  DialogState,
  DialogActions,
  DialogBehavior
} from '@web-loom/ui-core';
```

## Detailed Documentation

For comprehensive guides including advanced usage, accessibility guidelines, and real-world examples, see the documentation for each behavior:

### New Behaviors
- **[Keyboard Shortcuts](./docs/KEYBOARD_SHORTCUTS.md)** - Centralized keyboard shortcut management with platform normalization
- **[Undo/Redo Stack](./docs/UNDO_REDO_STACK.md)** - Immutable state history with undo/redo operations
- **[Drag-and-Drop](./docs/DRAG_DROP.md)** - Framework-agnostic drag-and-drop state management

### Behavior Enhancements
- **[Roving Focus Enhancement](../ui-patterns/docs/PATTERN_ENHANCEMENTS.md#roving-focus-behavior-enhancements)** - Focus change callback for responding to focus changes
- **[Form Behavior Enhancement](../ui-patterns/docs/PATTERN_ENHANCEMENTS.md#form-behavior-enhancements)** - Manual error setting for server-side validation

Each documentation file includes:
- Complete API reference with TypeScript interfaces
- Advanced usage examples and patterns
- Framework integration guides (React, Vue, Angular)
- Accessibility guidelines and ARIA recommendations
- Performance considerations and best practices
- Common use cases and real-world examples

## Dependencies

- `@web-loom/store-core`: Reactive state management (included)
- `@web-loom/event-bus-core`: Event system for cross-component communication (included)

## License

MIT
