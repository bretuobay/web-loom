# Keyboard Shortcuts Behavior

## Overview

The Keyboard Shortcuts behavior provides a centralized way to manage keyboard shortcuts in your application. It handles key combination parsing, platform normalization (Cmd on macOS, Ctrl on Windows/Linux), conflict resolution, and provides both global and scoped shortcut support.

**Key Features:**
- Platform-agnostic key combination parsing
- Automatic Cmd/Ctrl normalization for cross-platform compatibility
- Global and scoped shortcut support
- Conflict resolution with last-wins strategy
- Single global event listener for optimal performance
- Optional preventDefault support
- Shortcut descriptions for help documentation

## Installation

```bash
npm install @web-loom/ui-core
```

## Basic Usage

```typescript
import { createKeyboardShortcuts } from '@web-loom/ui-core';

// Create the behavior
const shortcuts = createKeyboardShortcuts({
  scope: 'global',
  onShortcutExecuted: (key) => console.log(`Executed: ${key}`),
});

// Register a shortcut
shortcuts.actions.registerShortcut({
  key: 'Ctrl+K',
  handler: () => {
    console.log('Command palette opened');
    openCommandPalette();
  },
  description: 'Open command palette',
  preventDefault: true,
});

// Subscribe to state changes
const unsubscribe = shortcuts.subscribe((state) => {
  console.log('Active shortcuts:', state.activeShortcuts);
});

// Clean up when done
unsubscribe();
shortcuts.destroy();
```

## API Reference

### `createKeyboardShortcuts(options?)`

Creates a keyboard shortcuts behavior instance.

**Parameters:**
- `options` (optional): Configuration options
  - `scope?: 'global' | 'scoped'` - Initial scope for shortcuts (default: 'global')
  - `onShortcutExecuted?: (key: string) => void` - Callback invoked when a shortcut is executed

**Returns:** `KeyboardShortcutsBehavior`

### State Interface

```typescript
interface KeyboardShortcutsState {
  shortcuts: Map<string, KeyboardShortcut>;  // Registered shortcuts
  scope: 'global' | 'scoped';                // Current scope
  activeShortcuts: string[];                 // Array of registered keys
  enabled: boolean;                          // Whether shortcuts are enabled
}
```

### Actions Interface

```typescript
interface KeyboardShortcutsActions {
  registerShortcut: (shortcut: KeyboardShortcut) => void;
  unregisterShortcut: (key: string) => void;
  setScope: (scope: 'global' | 'scoped') => void;
  clearAllShortcuts: () => void;
  enable: () => void;
  disable: () => void;
}
```

### Shortcut Configuration

```typescript
interface KeyboardShortcut {
  key: string;                    // e.g., "Ctrl+K", "Cmd+Shift+P"
  handler: () => void;            // Function to execute
  description?: string;           // Optional description
  preventDefault?: boolean;       // Prevent default browser behavior
  scope?: 'global' | 'scoped';   // Shortcut scope
}
```

## Advanced Usage

### Platform-Specific Keys

The behavior automatically normalizes platform-specific keys:

```typescript
// On macOS, use Cmd
shortcuts.actions.registerShortcut({
  key: 'Cmd+K',
  handler: openCommandPalette,
});

// On Windows/Linux, use Ctrl
shortcuts.actions.registerShortcut({
  key: 'Ctrl+K',
  handler: openCommandPalette,
});

// Both are normalized to the same internal representation
// and will work correctly on their respective platforms
```

### Scoped Shortcuts

Use scoped shortcuts for component-specific keyboard handling:

```typescript
const shortcuts = createKeyboardShortcuts({ scope: 'global' });

// Register a global shortcut
shortcuts.actions.registerShortcut({
  key: 'Ctrl+K',
  handler: openCommandPalette,
  scope: 'global',
});

// Register a scoped shortcut (only active when scope is 'scoped')
shortcuts.actions.registerShortcut({
  key: 'Escape',
  handler: closeModal,
  scope: 'scoped',
});

// Switch to scoped mode (e.g., when modal opens)
shortcuts.actions.setScope('scoped');

// Switch back to global mode
shortcuts.actions.setScope('global');
```

### Conflict Resolution

When multiple shortcuts use the same key combination, the last registered one wins:

```typescript
shortcuts.actions.registerShortcut({
  key: 'Ctrl+S',
  handler: () => console.log('First handler'),
});

shortcuts.actions.registerShortcut({
  key: 'Ctrl+S',
  handler: () => console.log('Second handler'), // This one will be used
});
```

### Temporarily Disabling Shortcuts

```typescript
// Disable all shortcuts (e.g., when a text input is focused)
shortcuts.actions.disable();

// Re-enable shortcuts
shortcuts.actions.enable();
```

### Building a Shortcut Help Panel

```typescript
const shortcuts = createKeyboardShortcuts();

// Register shortcuts with descriptions
shortcuts.actions.registerShortcut({
  key: 'Ctrl+K',
  handler: openCommandPalette,
  description: 'Open command palette',
});

shortcuts.actions.registerShortcut({
  key: 'Ctrl+S',
  handler: saveDocument,
  description: 'Save document',
});

// Display help panel
function showShortcutHelp() {
  const state = shortcuts.getState();
  const helpItems = Array.from(state.shortcuts.values()).map(shortcut => ({
    key: shortcut.key,
    description: shortcut.description || 'No description',
  }));
  
  console.table(helpItems);
}
```

## Framework Integration

### React

```typescript
import { useKeyboardShortcuts } from '@web-loom/ui-core/react';

function CommandPalette() {
  const shortcuts = useKeyboardShortcuts({
    onShortcutExecuted: (key) => console.log(`Executed: ${key}`),
  });

  useEffect(() => {
    shortcuts.registerShortcut({
      key: 'Ctrl+K',
      handler: () => setIsOpen(true),
      description: 'Open command palette',
      preventDefault: true,
    });
  }, []);

  return <div>Command Palette</div>;
}
```

### Vue

```typescript
import { useKeyboardShortcuts } from '@web-loom/ui-core/vue';

export default {
  setup() {
    const shortcuts = useKeyboardShortcuts({
      onShortcutExecuted: (key) => console.log(`Executed: ${key}`),
    });

    onMounted(() => {
      shortcuts.registerShortcut({
        key: 'Ctrl+K',
        handler: () => isOpen.value = true,
        description: 'Open command palette',
        preventDefault: true,
      });
    });

    return { shortcuts };
  },
};
```

### Angular

```typescript
import { Component, OnInit } from '@angular/core';
import { KeyboardShortcutsService } from '@web-loom/ui-core/angular';

@Component({
  selector: 'app-command-palette',
  template: `<div>Command Palette</div>`,
  providers: [KeyboardShortcutsService],
})
export class CommandPaletteComponent implements OnInit {
  constructor(private shortcuts: KeyboardShortcutsService) {}

  ngOnInit() {
    this.shortcuts.registerShortcut({
      key: 'Ctrl+K',
      handler: () => this.openPalette(),
      description: 'Open command palette',
      preventDefault: true,
    });
  }

  openPalette() {
    console.log('Opening command palette');
  }
}
```

## Accessibility Guidelines

### Visual Indicators

Provide visual feedback when shortcuts are available:

```typescript
// Show keyboard shortcut hints in UI
<button aria-label="Save (Ctrl+S)">
  Save
  <span className="shortcut-hint">Ctrl+S</span>
</button>
```

### Screen Reader Announcements

Announce shortcut execution to screen readers:

```typescript
function announceShortcut(description: string) {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', 'polite');
  announcement.textContent = `Executed: ${description}`;
  document.body.appendChild(announcement);
  setTimeout(() => announcement.remove(), 1000);
}

shortcuts.actions.registerShortcut({
  key: 'Ctrl+S',
  handler: () => {
    saveDocument();
    announceShortcut('Document saved');
  },
  description: 'Save document',
});
```

### Standard Shortcuts

Respect standard keyboard shortcuts:

```typescript
// Don't override browser shortcuts unless necessary
// Good: Custom shortcuts
shortcuts.actions.registerShortcut({
  key: 'Ctrl+K',
  handler: openCommandPalette,
});

// Avoid: Overriding standard shortcuts
// shortcuts.actions.registerShortcut({
//   key: 'Ctrl+C', // Don't override copy
//   handler: customCopy,
// });
```

### Keyboard-Only Navigation

Ensure all functionality is accessible via keyboard:

```typescript
// Provide keyboard shortcuts for all major actions
shortcuts.actions.registerShortcut({
  key: 'Ctrl+N',
  handler: createNew,
  description: 'Create new item',
});

shortcuts.actions.registerShortcut({
  key: 'Ctrl+O',
  handler: openFile,
  description: 'Open file',
});

shortcuts.actions.registerShortcut({
  key: 'Ctrl+S',
  handler: save,
  description: 'Save',
});
```

## TypeScript Support

Full TypeScript support with exported types:

```typescript
import type {
  KeyboardShortcut,
  KeyboardShortcutsState,
  KeyboardShortcutsActions,
  KeyboardShortcutsBehavior,
  KeyboardShortcutsOptions,
} from '@web-loom/ui-core';

// Type-safe shortcut configuration
const shortcut: KeyboardShortcut = {
  key: 'Ctrl+K',
  handler: () => console.log('Executed'),
  description: 'Open command palette',
  preventDefault: true,
  scope: 'global',
};
```

## Performance Considerations

### Single Event Listener

The behavior uses a single global event listener for all shortcuts, minimizing overhead:

```typescript
// Efficient: One listener for all shortcuts
const shortcuts = createKeyboardShortcuts();
shortcuts.actions.registerShortcut({ key: 'Ctrl+K', handler: fn1 });
shortcuts.actions.registerShortcut({ key: 'Ctrl+S', handler: fn2 });
shortcuts.actions.registerShortcut({ key: 'Ctrl+O', handler: fn3 });

// Inefficient: Multiple listeners (don't do this)
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key === 'k') fn1();
});
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key === 's') fn2();
});
```

### Memory Management

Always clean up when components unmount:

```typescript
// React example
useEffect(() => {
  const shortcuts = createKeyboardShortcuts();
  shortcuts.actions.registerShortcut({
    key: 'Ctrl+K',
    handler: openPalette,
  });

  return () => shortcuts.destroy(); // Clean up
}, []);
```

## Common Patterns

### Command Palette Integration

```typescript
const shortcuts = createKeyboardShortcuts();
const [isOpen, setIsOpen] = useState(false);

shortcuts.actions.registerShortcut({
  key: 'Ctrl+K',
  handler: () => setIsOpen(true),
  preventDefault: true,
});

shortcuts.actions.registerShortcut({
  key: 'Escape',
  handler: () => setIsOpen(false),
  scope: 'scoped',
});
```

### Modal Shortcuts

```typescript
function Modal({ isOpen, onClose }) {
  const shortcuts = useKeyboardShortcuts();

  useEffect(() => {
    if (isOpen) {
      shortcuts.setScope('scoped');
      shortcuts.registerShortcut({
        key: 'Escape',
        handler: onClose,
        scope: 'scoped',
      });
    } else {
      shortcuts.setScope('global');
    }
  }, [isOpen]);
}
```

## Bundle Size

- Gzipped: ~1.8KB
- Tree-shakeable: Import only what you need
- Zero dependencies (except @web-loom/store-core)

## Browser Support

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- IE11: ❌ Not supported (requires modern JavaScript)

## License

MIT
