# Pattern Enhancements

This document describes the enhancements made to existing UI patterns in `@web-loom/ui-patterns` and `@web-loom/ui-core`. These enhancements add new configuration options, callbacks, and convenience methods to improve developer experience and functionality.

## Table of Contents

- [Modal Pattern Enhancements](#modal-pattern-enhancements)
- [Roving Focus Behavior Enhancements](#roving-focus-behavior-enhancements)
- [Form Behavior Enhancements](#form-behavior-enhancements)
- [Sidebar Shell Pattern Enhancements](#sidebar-shell-pattern-enhancements)
- [Toast Queue Pattern Enhancements](#toast-queue-pattern-enhancements)
- [Tabbed Interface Pattern Enhancements](#tabbed-interface-pattern-enhancements)
- [Command Palette Pattern Enhancements](#command-palette-pattern-enhancements)

---

## Modal Pattern Enhancements

### Overview

The Modal pattern now supports configuration options for closing modals via the Escape key or backdrop clicks. These options provide fine-grained control over modal dismissal behavior.

### New Configuration Options

#### `closeOnEscape`

Controls whether the modal should close when the Escape key is pressed.

**Type:** `boolean`  
**Default:** `false`

#### `closeOnBackdropClick`

Controls whether the modal should close when the backdrop (overlay) is clicked.

**Type:** `boolean`  
**Default:** `false`

### Usage

```typescript
import { createModal } from '@web-loom/ui-patterns';

const modal = createModal({
  onModalOpened: (modal) => console.log('Modal opened:', modal.id),
  onModalClosed: (modalId) => console.log('Modal closed:', modalId),
});

// Open modal with escape and backdrop close enabled
modal.actions.openModalWithConfig({
  id: 'settings-modal',
  content: { title: 'Settings', tab: 'general' },
  priority: 0,
  closeOnEscape: true,
  closeOnBackdropClick: true,
});

// Listen to escape key and backdrop click events
modal.eventBus.on('modal:escape-pressed', (modalId) => {
  console.log('Escape pressed on modal:', modalId);
});

modal.eventBus.on('modal:backdrop-clicked', (modalId) => {
  console.log('Backdrop clicked on modal:', modalId);
});

// Handle escape key press (call this when Escape key is detected)
modal.actions.handleEscapeKey();

// Handle backdrop click (call this when backdrop is clicked)
modal.actions.handleBackdropClick('settings-modal');
```

### New Actions

#### `openModalWithConfig(config: OpenModalConfig)`

Opens a modal with full configuration options including `closeOnEscape` and `closeOnBackdropClick`.

**Parameters:**

- `config.id` (string): Unique identifier for the modal
- `config.content` (any): The content to display in the modal
- `config.priority` (number, optional): Priority for stacking order (default: 0)
- `config.closeOnEscape` (boolean, optional): Whether to close on Escape key (default: false)
- `config.closeOnBackdropClick` (boolean, optional): Whether to close on backdrop click (default: false)

#### `handleEscapeKey()`

Handles the Escape key press for the top modal. If the top modal has `closeOnEscape: true`, it will be closed.

**Usage:** Call this action when the Escape key is detected in your view layer.

#### `handleBackdropClick(id: string)`

Handles a backdrop click for a specific modal. If the modal has `closeOnBackdropClick: true`, it will be closed.

**Parameters:**

- `id` (string): The ID of the modal whose backdrop was clicked

**Usage:** Call this action when the backdrop element is clicked in your view layer.

### New Events

#### `modal:escape-pressed`

Emitted when the Escape key is pressed while a modal is open.

**Payload:** `modalId` (string) - The ID of the top modal

#### `modal:backdrop-clicked`

Emitted when a modal's backdrop is clicked.

**Payload:** `modalId` (string) - The ID of the modal whose backdrop was clicked

### Example: Confirmation Dialog

```typescript
const confirmDialog = createModal();

confirmDialog.actions.openModalWithConfig({
  id: 'confirm-delete',
  content: {
    title: 'Confirm Deletion',
    message: 'Are you sure you want to delete this item?',
  },
  closeOnEscape: true,
  closeOnBackdropClick: true,
});

// In your view layer, wire up keyboard and click handlers
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    confirmDialog.actions.handleEscapeKey();
  }
});

backdropElement.addEventListener('click', () => {
  confirmDialog.actions.handleBackdropClick('confirm-delete');
});
```

---

## Roving Focus Behavior Enhancements

### Overview

The Roving Focus behavior now supports an optional callback that is invoked whenever focus changes. This allows you to respond to focus changes and update your UI accordingly.

### New Configuration Option

#### `onFocusChange`

Optional callback invoked when the focused index changes.

**Type:** `(index: number, itemId: string, previousIndex: number) => void`  
**Default:** `undefined`

**Parameters:**

- `index` (number): The new focused index
- `itemId` (string): The identifier of the newly focused item
- `previousIndex` (number): The previously focused index

### Usage

```typescript
import { createRovingFocus } from '@web-loom/ui-core';

const rovingFocus = createRovingFocus({
  items: ['button-1', 'button-2', 'button-3'],
  orientation: 'horizontal',
  wrap: true,
  onFocusChange: (index, itemId, previousIndex) => {
    console.log(`Focus moved from index ${previousIndex} to ${index}`);
    console.log(`Now focused on: ${itemId}`);

    // Update UI to reflect focus change
    updateFocusIndicator(itemId);
    announceToScreenReader(`Focused on ${itemId}`);
  },
});

// Move focus
rovingFocus.actions.moveNext();
// Callback is invoked: Focus moved from index 0 to 1, Now focused on: button-2
```

### Example: Toolbar with Focus Announcements

```typescript
const toolbar = createRovingFocus({
  items: ['save-btn', 'undo-btn', 'redo-btn', 'settings-btn'],
  orientation: 'horizontal',
  wrap: true,
  onFocusChange: (index, itemId, previousIndex) => {
    // Update visual focus indicator
    document.querySelectorAll('[role="button"]').forEach((btn) => {
      btn.setAttribute('tabindex', '-1');
    });
    document.getElementById(itemId)?.setAttribute('tabindex', '0');
    document.getElementById(itemId)?.focus();

    // Announce to screen readers
    const labels = {
      'save-btn': 'Save',
      'undo-btn': 'Undo',
      'redo-btn': 'Redo',
      'settings-btn': 'Settings',
    };
    announceToScreenReader(`${labels[itemId]} button focused`);
  },
});

// Keyboard navigation
document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight') {
    toolbar.actions.moveNext();
  } else if (e.key === 'ArrowLeft') {
    toolbar.actions.movePrevious();
  }
});
```

### State Tracking

The Roving Focus behavior now tracks the `previousIndex` in its state, which is updated whenever focus changes:

```typescript
const state = rovingFocus.getState();
console.log(state.currentIndex); // Current focused index
console.log(state.previousIndex); // Previously focused index
```

---

## Form Behavior Enhancements

### Overview

The Form behavior now supports manually setting field errors without triggering validation. This is useful for displaying server-side validation errors or custom error messages.

### New Action

#### `setFieldError(field: keyof T, error: string | null)`

Sets a manual error message for a specific field without triggering validation.

**Parameters:**

- `field` (keyof T): The field name
- `error` (string | null): The error message, or null to clear the manual error

**Behavior:**

- Manual errors are merged with validation errors
- Manual errors take precedence over validation errors for the same field
- Setting a manual error does NOT trigger the field's validation function
- Passing `null` clears the manual error for that field

### Usage

```typescript
import { createFormBehavior } from '@web-loom/ui-core';

const form = createFormBehavior({
  initialValues: {
    email: '',
    password: '',
  },
  fields: {
    email: {
      validate: (value) => {
        if (!value) return 'Email is required';
        if (!/\S+@\S+\.\S+/.test(value)) return 'Invalid email format';
        return null;
      },
    },
  },
  onSubmit: async (values) => {
    try {
      await api.register(values);
    } catch (error) {
      // Set server-side validation errors
      if (error.field === 'email') {
        form.actions.setFieldError('email', error.message);
      }
    }
  },
});

// Set a manual error
form.actions.setFieldError('email', 'This email is already registered');

// Clear a manual error
form.actions.setFieldError('email', null);

// Check errors
console.log(form.getState().errors.email); // 'This email is already registered'
```

### Error Merging

Manual errors and validation errors are merged together. Manual errors take precedence:

```typescript
const form = createFormBehavior({
  initialValues: { email: '' },
  fields: {
    email: {
      validate: (value) => {
        if (!value) return 'Email is required';
        return null;
      },
    },
  },
});

// Trigger validation (client-side error)
await form.actions.validateField('email');
console.log(form.getState().errors.email); // 'Email is required'

// Set manual error (server-side error)
form.actions.setFieldError('email', 'Email already exists');
console.log(form.getState().errors.email); // 'Email already exists' (manual takes precedence)

// Clear manual error
form.actions.setFieldError('email', null);
console.log(form.getState().errors.email); // 'Email is required' (validation error remains)
```

### State Structure

The form state now includes a `manualErrors` field that tracks manually set errors separately:

```typescript
interface FormState<T> {
  values: T;
  errors: Partial<Record<keyof T, string>>; // Merged errors (manual + validation)
  manualErrors: Partial<Record<keyof T, string>>; // Manual errors only
  touched: Partial<Record<keyof T, boolean>>;
  dirty: Partial<Record<keyof T, boolean>>;
  isValidating: boolean;
  isValid: boolean;
  isSubmitting: boolean;
  submitCount: number;
}
```

### Example: Server-Side Validation

```typescript
const registrationForm = createFormBehavior({
  initialValues: {
    username: '',
    email: '',
    password: '',
  },
  fields: {
    username: {
      validate: (value) => {
        if (!value) return 'Username is required';
        if (value.length < 3) return 'Username must be at least 3 characters';
        return null;
      },
    },
    email: {
      validate: (value) => {
        if (!value) return 'Email is required';
        if (!/\S+@\S+\.\S+/.test(value)) return 'Invalid email format';
        return null;
      },
    },
    password: {
      validate: (value) => {
        if (!value) return 'Password is required';
        if (value.length < 8) return 'Password must be at least 8 characters';
        return null;
      },
    },
  },
  onSubmit: async (values) => {
    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const errors = await response.json();

        // Set server-side validation errors
        if (errors.username) {
          registrationForm.actions.setFieldError('username', errors.username);
        }
        if (errors.email) {
          registrationForm.actions.setFieldError('email', errors.email);
        }
        if (errors.password) {
          registrationForm.actions.setFieldError('password', errors.password);
        }
      } else {
        console.log('Registration successful!');
      }
    } catch (error) {
      console.error('Registration failed:', error);
    }
  },
});
```

---

## Sidebar Shell Pattern Enhancements

### Overview

The Sidebar Shell pattern now supports mobile-specific behavior with automatic collapse when a section is selected in mobile mode.

### New State Properties

#### `isMobile`

Indicates whether the sidebar is in mobile mode.

**Type:** `boolean`  
**Default:** `false`

### New Configuration Options

#### `initialMobile`

Sets the initial mobile mode state.

**Type:** `boolean`  
**Default:** `false`

#### `onMobileChange`

Optional callback invoked when mobile mode changes.

**Type:** `(isMobile: boolean) => void`  
**Default:** `undefined`

### New Actions

#### `toggleMobile()`

Toggles the mobile mode of the sidebar.

#### `setMobileMode(isMobile: boolean)`

Sets the mobile mode of the sidebar.

**Parameters:**

- `isMobile` (boolean): Whether the sidebar should be in mobile mode

### New Events

#### `sidebar:mobile-toggled`

Emitted when mobile mode is toggled or set.

**Payload:** `isMobile` (boolean) - The new mobile mode state

### Mobile Auto-Collapse Behavior

When `isMobile` is `true`, the sidebar automatically collapses when a section is selected. This provides a better mobile experience by maximizing content space after navigation.

### Usage

```typescript
import { createSidebarShell } from '@web-loom/ui-patterns';

const sidebar = createSidebarShell({
  initialExpanded: true,
  initialWidth: 300,
  initialMobile: false,
  onMobileChange: (isMobile) => {
    console.log('Mobile mode:', isMobile);
    // Update responsive layout
    updateLayout(isMobile);
  },
});

// Listen to mobile toggle events
sidebar.eventBus.on('sidebar:mobile-toggled', (isMobile) => {
  console.log('Mobile mode toggled:', isMobile);
});

// Enable mobile mode
sidebar.actions.setMobileMode(true);

// Expand sidebar
sidebar.actions.expand();
console.log(sidebar.getState().isExpanded); // true

// Select a section (auto-collapses in mobile mode)
sidebar.actions.setActiveSection('navigation');
console.log(sidebar.getState().isExpanded); // false (auto-collapsed)
console.log(sidebar.getState().activeSection); // 'navigation'
```

### Example: Responsive Sidebar

```typescript
const sidebar = createSidebarShell({
  initialExpanded: true,
  initialWidth: 280,
  initialMobile: window.innerWidth < 768,
  onMobileChange: (isMobile) => {
    // Update CSS classes or styles
    document.body.classList.toggle('mobile-layout', isMobile);
  },
});

// Respond to window resize
window.addEventListener('resize', () => {
  const isMobile = window.innerWidth < 768;
  sidebar.actions.setMobileMode(isMobile);
});

// Navigation items
const navItems = ['Dashboard', 'Projects', 'Settings', 'Help'];

navItems.forEach((item, index) => {
  const button = document.getElementById(`nav-${index}`);
  button?.addEventListener('click', () => {
    sidebar.actions.setActiveSection(item);
    // In mobile mode, sidebar auto-collapses after selection
  });
});

// Mobile menu toggle button
const menuButton = document.getElementById('mobile-menu-btn');
menuButton?.addEventListener('click', () => {
  sidebar.actions.toggle();
});
```

### Desktop vs Mobile Behavior

**Desktop Mode (`isMobile: false`):**

- Sidebar remains open after section selection
- User must manually collapse/expand
- Typically pinned or persistent

**Mobile Mode (`isMobile: true`):**

- Sidebar auto-collapses after section selection
- Maximizes content space
- Typically overlays content when expanded

---

## Toast Queue Pattern Enhancements

### Overview

The Toast Queue pattern now supports configurable positioning, allowing toasts to appear in different screen locations.

### New State Property

#### `position`

The position where toasts appear on the screen.

**Type:** `ToastPosition`  
**Values:** `'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right'`  
**Default:** `'top-right'`

### New Configuration Option

#### `position`

Sets the initial position for toasts.

**Type:** `ToastPosition`  
**Default:** `'top-right'`

#### `onPositionChanged`

Optional callback invoked when the position changes.

**Type:** `(position: ToastPosition) => void`  
**Default:** `undefined`

### New Action

#### `setPosition(position: ToastPosition)`

Sets the position where toasts appear on the screen.

**Parameters:**

- `position` (ToastPosition): The new position for toasts

### New Event

#### `toast:position-changed`

Emitted when the toast position changes.

**Payload:** `{ position: ToastPosition }`

### Usage

```typescript
import { createToastQueue } from '@web-loom/ui-patterns';

const toasts = createToastQueue({
  maxVisible: 3,
  defaultDuration: 5000,
  position: 'bottom-right',
  onPositionChanged: (position) => {
    console.log('Toast position changed to:', position);
    // Update CSS classes or container positioning
    updateToastContainer(position);
  },
});

// Listen to position change events
toasts.eventBus.on('toast:position-changed', ({ position }) => {
  console.log('Position changed event:', position);
});

// Change position
toasts.actions.setPosition('top-center');

// Add toasts (they will appear at the current position)
toasts.actions.addToast({
  message: 'Settings saved successfully',
  type: 'success',
  duration: 3000,
});
```

### Example: User-Configurable Toast Position

```typescript
const toasts = createToastQueue({
  position: 'top-right',
  onPositionChanged: (position) => {
    // Save user preference
    localStorage.setItem('toastPosition', position);

    // Update container CSS
    const container = document.getElementById('toast-container');
    container?.setAttribute('data-position', position);
  },
});

// Load user preference
const savedPosition = localStorage.getItem('toastPosition');
if (savedPosition) {
  toasts.actions.setPosition(savedPosition as ToastPosition);
}

// Settings UI
const positionSelect = document.getElementById('toast-position-select');
positionSelect?.addEventListener('change', (e) => {
  const position = (e.target as HTMLSelectElement).value as ToastPosition;
  toasts.actions.setPosition(position);
});
```

### CSS Example

```css
/* Toast container positioning */
.toast-container {
  position: fixed;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  pointer-events: none;
}

.toast-container[data-position='top-left'] {
  top: 1rem;
  left: 1rem;
}

.toast-container[data-position='top-center'] {
  top: 1rem;
  left: 50%;
  transform: translateX(-50%);
}

.toast-container[data-position='top-right'] {
  top: 1rem;
  right: 1rem;
}

.toast-container[data-position='bottom-left'] {
  bottom: 1rem;
  left: 1rem;
}

.toast-container[data-position='bottom-center'] {
  bottom: 1rem;
  left: 50%;
  transform: translateX(-50%);
}

.toast-container[data-position='bottom-right'] {
  bottom: 1rem;
  right: 1rem;
}
```

---

## Tabbed Interface Pattern Enhancements

### Overview

The Tabbed Interface pattern now provides convenience methods for keyboard navigation that delegate to the underlying roving focus behavior.

### New Actions

#### `focusNextTab()`

Moves focus to the next tab. Delegates to the underlying roving focus behavior's `moveNext` action.

**Behavior:**

- Moves focus to the next tab in the list
- Wraps to the first tab if at the end (when `wrap: true`)
- Skips disabled tabs

#### `focusPreviousTab()`

Moves focus to the previous tab. Delegates to the underlying roving focus behavior's `movePrevious` action.

**Behavior:**

- Moves focus to the previous tab in the list
- Wraps to the last tab if at the beginning (when `wrap: true`)
- Skips disabled tabs

### Usage

```typescript
import { createTabbedInterface } from '@web-loom/ui-patterns';

const tabs = createTabbedInterface({
  tabs: [
    { id: 'profile', label: 'Profile' },
    { id: 'settings', label: 'Settings' },
    { id: 'notifications', label: 'Notifications' },
  ],
  orientation: 'horizontal',
  wrap: true,
  onTabChange: (tabId) => {
    console.log('Active tab:', tabId);
  },
});

// Navigate with convenience methods
tabs.actions.focusNextTab(); // Focus moves to 'settings'
tabs.actions.focusNextTab(); // Focus moves to 'notifications'
tabs.actions.focusNextTab(); // Focus wraps to 'profile'

tabs.actions.focusPreviousTab(); // Focus moves to 'notifications'
```

### Example: Keyboard Navigation

```typescript
const tabs = createTabbedInterface({
  tabs: [
    { id: 'tab1', label: 'Dashboard' },
    { id: 'tab2', label: 'Analytics' },
    { id: 'tab3', label: 'Reports' },
    { id: 'tab4', label: 'Settings', disabled: true },
  ],
  orientation: 'horizontal',
  wrap: true,
});

// Wire up keyboard navigation
document.addEventListener('keydown', (e) => {
  const tabList = document.querySelector('[role="tablist"]');
  if (!tabList?.contains(document.activeElement)) return;

  switch (e.key) {
    case 'ArrowRight':
      e.preventDefault();
      tabs.actions.focusNextTab();
      break;
    case 'ArrowLeft':
      e.preventDefault();
      tabs.actions.focusPreviousTab();
      break;
    case 'Home':
      e.preventDefault();
      tabs.actions.activateTab(tabs.getState().tabs[0].id);
      break;
    case 'End':
      e.preventDefault();
      const lastTab = tabs.getState().tabs[tabs.getState().tabs.length - 1];
      tabs.actions.activateTab(lastTab.id);
      break;
  }
});
```

### Comparison: Direct vs Convenience Methods

```typescript
// Using convenience methods (recommended)
tabs.actions.focusNextTab();
tabs.actions.focusPreviousTab();

// Equivalent direct roving focus access (advanced)
// Note: This requires understanding the internal roving focus behavior
// The convenience methods are preferred for clarity and maintainability
```

---

## Command Palette Pattern Enhancements

### Overview

The Command Palette pattern now provides convenience methods for command navigation and execution that delegate to the underlying roving focus behavior.

### New Actions

#### `selectNext()`

Moves selection to the next filtered command. Delegates to the underlying roving focus behavior's `moveNext` action.

**Behavior:**

- Moves selection to the next command in the filtered list
- Wraps to the first command if at the end
- Updates the `selectedIndex` in state

#### `selectPrevious()`

Moves selection to the previous filtered command. Delegates to the underlying roving focus behavior's `movePrevious` action.

**Behavior:**

- Moves selection to the previous command in the filtered list
- Wraps to the last command if at the beginning
- Updates the `selectedIndex` in state

#### `executeSelected()`

Executes the currently selected command.

**Returns:** `Promise<void>`

**Behavior:**

- Executes the command at the current `selectedIndex`
- Closes the command palette
- Invokes the `onCommandExecute` callback if provided
- Handles errors gracefully

### Usage

```typescript
import { createCommandPalette } from '@web-loom/ui-patterns';

const palette = createCommandPalette({
  commands: [
    {
      id: 'save',
      label: 'Save File',
      category: 'File',
      keywords: ['write', 'persist'],
      shortcut: 'Ctrl+S',
      action: () => console.log('Saving file...'),
    },
    {
      id: 'open',
      label: 'Open File',
      category: 'File',
      shortcut: 'Ctrl+O',
      action: () => console.log('Opening file...'),
    },
    {
      id: 'search',
      label: 'Search in Files',
      category: 'Search',
      keywords: ['find', 'grep'],
      shortcut: 'Ctrl+Shift+F',
      action: () => console.log('Searching...'),
    },
  ],
  onCommandExecute: (command) => {
    console.log('Executed:', command.label);
  },
});

// Open palette
palette.actions.open();

// Search for commands
palette.actions.setQuery('save');

// Navigate with convenience methods
palette.actions.selectNext(); // Select next command
palette.actions.selectPrevious(); // Select previous command

// Execute selected command
await palette.actions.executeSelected();
```

### Example: Full Keyboard Navigation

```typescript
const palette = createCommandPalette({
  commands: [
    {
      id: 'new-file',
      label: 'Create New File',
      category: 'File',
      keywords: ['file', 'create', 'new'],
      action: () => createNewFile(),
    },
    {
      id: 'save',
      label: 'Save File',
      category: 'File',
      keywords: ['save', 'write'],
      shortcut: 'Ctrl+S',
      action: () => saveFile(),
    },
    {
      id: 'close',
      label: 'Close File',
      category: 'File',
      keywords: ['close'],
      shortcut: 'Ctrl+W',
      action: () => closeFile(),
    },
  ],
  onCommandExecute: (command) => {
    console.log('Executed:', command.label);
    showToast(`Executed: ${command.label}`);
  },
});

// Open palette with keyboard shortcut
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    palette.actions.open();
  }
});

// Handle keyboard navigation within palette
const paletteElement = document.getElementById('command-palette');
paletteElement?.addEventListener('keydown', async (e) => {
  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault();
      palette.actions.selectNext();
      break;
    case 'ArrowUp':
      e.preventDefault();
      palette.actions.selectPrevious();
      break;
    case 'Enter':
      e.preventDefault();
      await palette.actions.executeSelected();
      break;
    case 'Escape':
      e.preventDefault();
      palette.actions.close();
      break;
  }
});

// Handle search input
const searchInput = document.getElementById('palette-search');
searchInput?.addEventListener('input', (e) => {
  const query = (e.target as HTMLInputElement).value;
  palette.actions.setQuery(query);
});
```

### Example: React Integration

```typescript
import { useEffect, useState } from 'react';
import { createCommandPalette } from '@web-loom/ui-patterns';

function CommandPaletteComponent() {
  const [palette] = useState(() => createCommandPalette({
    commands: [...],
    onCommandExecute: (command) => {
      console.log('Executed:', command.label);
    },
  }));

  const [state, setState] = useState(palette.getState());

  useEffect(() => {
    const unsubscribe = palette.subscribe(setState);
    return () => {
      unsubscribe();
      palette.destroy();
    };
  }, [palette]);

  const handleKeyDown = async (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        palette.actions.selectNext();
        break;
      case 'ArrowUp':
        e.preventDefault();
        palette.actions.selectPrevious();
        break;
      case 'Enter':
        e.preventDefault();
        await palette.actions.executeSelected();
        break;
      case 'Escape':
        e.preventDefault();
        palette.actions.close();
        break;
    }
  };

  if (!state.isOpen) return null;

  return (
    <div className="command-palette" onKeyDown={handleKeyDown}>
      <input
        type="text"
        placeholder="Type a command..."
        value={state.query}
        onChange={(e) => palette.actions.setQuery(e.target.value)}
        autoFocus
      />
      <ul>
        {state.filteredCommands.map((command, index) => (
          <li
            key={command.id}
            className={index === state.selectedIndex ? 'selected' : ''}
            onClick={() => palette.actions.executeCommand(command.id)}
          >
            <span>{command.label}</span>
            {command.shortcut && <kbd>{command.shortcut}</kbd>}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### Comparison: Direct vs Convenience Methods

```typescript
// Using convenience methods (recommended)
palette.actions.selectNext();
palette.actions.selectPrevious();
await palette.actions.executeSelected();

// Equivalent direct access (advanced)
palette.rovingFocus.actions.moveNext();
palette.rovingFocus.actions.movePrevious();
const state = palette.getState();
const selectedCommand = state.filteredCommands[state.selectedIndex];
await palette.actions.executeCommand(selectedCommand.id);
```

The convenience methods provide a cleaner, more intuitive API and are the recommended approach for most use cases.

---

## Summary

These enhancements improve the developer experience and functionality of existing patterns:

1. **Modal Pattern**: Fine-grained control over dismissal behavior with `closeOnEscape` and `closeOnBackdropClick`
2. **Roving Focus Behavior**: React to focus changes with the `onFocusChange` callback
3. **Form Behavior**: Set server-side validation errors with `setFieldError`
4. **Sidebar Shell Pattern**: Responsive mobile behavior with auto-collapse
5. **Toast Queue Pattern**: Configurable positioning with `setPosition`
6. **Tabbed Interface Pattern**: Convenient keyboard navigation with `focusNextTab` and `focusPreviousTab`
7. **Command Palette Pattern**: Simplified command navigation and execution with `selectNext`, `selectPrevious`, and `executeSelected`

All enhancements maintain backward compatibility and follow the established patterns of the Web Loom UI library.

---

## Framework-Specific Examples

For comprehensive framework-specific implementation examples of all pattern enhancements, see:

- **[React Examples](./examples/REACT_EXAMPLES.md)** - Complete React implementations including:
  - Modal with escape and backdrop close options
  - Responsive sidebar with mobile mode
  - Toast queue with position configuration
  - Tabbed interface with keyboard navigation
  - Command palette with enhanced navigation
- **[Vue Examples](./examples/VUE_EXAMPLES.md)** - Vue 3 Composition API examples with:
  - Reactive pattern enhancements
  - Computed properties for state management
  - Event handling patterns

- **[Angular Examples](./examples/ANGULAR_EXAMPLES.md)** - Angular service-based examples featuring:
  - Observable-based pattern state
  - RxJS integration patterns
  - Dependency injection examples

These examples demonstrate real-world usage of all pattern enhancements with proper accessibility, responsive design, and framework-specific best practices.
