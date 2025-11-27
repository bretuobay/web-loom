# UI Core Documentation

Comprehensive documentation for all behaviors in the `@web-loom/ui-core` package.

## New Behaviors

### [Keyboard Shortcuts](./KEYBOARD_SHORTCUTS.md)
Centralized keyboard shortcut management with platform normalization and scope support.

**Key Features:**
- Platform-agnostic key combination parsing
- Automatic Cmd/Ctrl normalization
- Global and scoped shortcuts
- Conflict resolution
- Single global event listener

**Use Cases:**
- Command palettes
- Text editors
- Productivity tools
- Keyboard-driven interfaces

---

### [Undo/Redo Stack](./UNDO_REDO_STACK.md)
Immutable state history management with undo/redo operations.

**Key Features:**
- Immutable state history
- Configurable history limits
- Time-travel debugging
- State persistence support
- Type-safe with generics

**Use Cases:**
- Text editors
- Drawing applications
- Form state management
- Any application requiring undo/redo

---

### [Drag-and-Drop](./DRAG_DROP.md)
Framework-agnostic drag-and-drop state management with validation.

**Key Features:**
- Drop zone registration
- Drag data transfer
- Custom validation
- Lifecycle callbacks
- Keyboard accessibility support

**Use Cases:**
- Kanban boards
- Reorderable lists
- File upload interfaces
- Multi-list management

---

## Quick Start

```bash
npm install @web-loom/ui-core
```

### Keyboard Shortcuts

```typescript
import { createKeyboardShortcuts } from '@web-loom/ui-core';

const shortcuts = createKeyboardShortcuts();
shortcuts.actions.registerShortcut({
  key: 'Ctrl+K',
  handler: () => console.log('Shortcut executed!'),
  preventDefault: true,
});
```

### Undo/Redo Stack

```typescript
import { createUndoRedoStack } from '@web-loom/ui-core';

const undoRedo = createUndoRedoStack({
  initialState: { content: '' },
  maxLength: 100,
});

undoRedo.actions.pushState({ content: 'Hello' });
undoRedo.actions.undo();
undoRedo.actions.redo();
```

### Drag-and-Drop

```typescript
import { createDragDropBehavior } from '@web-loom/ui-core';

const dragDrop = createDragDropBehavior({
  onDrop: (item, target) => console.log('Dropped!'),
});

dragDrop.actions.registerDropZone('zone-1');
dragDrop.actions.startDrag('item-1');
dragDrop.actions.drop('zone-1');
```

## Framework Support

All behaviors include adapters for:
- **React**: Hooks (`useKeyboardShortcuts`, `useUndoRedoStack`, `useDragDropBehavior`)
- **Vue**: Composables (same names as React hooks)
- **Angular**: Services (`KeyboardShortcutsService`, `UndoRedoStackService`, `DragDropBehaviorService`)

## Accessibility

All behaviors follow WCAG 2.1 Level AA guidelines:
- Keyboard-only navigation support
- Screen reader announcements
- Proper ARIA attributes
- Visual feedback for state changes

See individual behavior documentation for detailed accessibility guidelines.

## TypeScript Support

Full TypeScript support with exported types for all behaviors:

```typescript
import type {
  KeyboardShortcutsBehavior,
  UndoRedoStackBehavior,
  DragDropBehavior,
} from '@web-loom/ui-core';
```

## Performance

All behaviors are optimized for performance:
- **Bundle Size**: <2KB gzipped per behavior
- **Tree-Shaking**: Import only what you need
- **Memory**: Efficient state management with structural sharing
- **Events**: Optimized event delegation

## Browser Support

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- IE11: ❌ Not supported

## License

MIT
