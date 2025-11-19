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
  mode: 'multiple',
  onSelectionChange: (selected) => console.log('Selected:', selected),
});

// Select items
selection.actions.select('item-1');
selection.actions.toggleSelect('item-2');

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
rovingFocus.actions.focusNext();
rovingFocus.actions.focusPrevious();
rovingFocus.actions.focusFirst();
rovingFocus.actions.focusLast();
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

## Dependencies

- `@web-loom/store-core`: Reactive state management (included)
- `@web-loom/event-bus-core`: Event system for cross-component communication (included)

## License

MIT
