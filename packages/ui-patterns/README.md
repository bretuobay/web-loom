# @web-loom/ui-patterns

Composed UI patterns built on Web Loom UI Core behaviors.

## Overview

`@web-loom/ui-patterns` provides higher-level UI patterns that compose atomic behaviors from `@web-loom/ui-core` into complete interaction patterns. These patterns handle common UI workflows like master-detail views, wizards, modals, command palettes, and more. All patterns are framework-agnostic and work with React, Vue, Angular, or vanilla JavaScript.

## Installation

```bash
npm install @web-loom/ui-patterns
```

## Features

- **Framework-agnostic**: Works with any UI framework or vanilla JS
- **Composable**: Built by composing atomic behaviors from `@web-loom/ui-core`
- **Type-safe**: Full TypeScript support with comprehensive type definitions
- **Reactive**: Automatic UI updates through observable patterns
- **Event-driven**: Built-in event bus for cross-component communication
- **Lightweight**: Tree-shakeable with minimal bundle impact

## Available Patterns

### Master-Detail Pattern

Split-view interfaces with synchronized list selection and detail view.

```typescript
import { createMasterDetail } from '@web-loom/ui-patterns';

interface Item {
  id: string;
  name: string;
  description: string;
}

const items: Item[] = [
  { id: '1', name: 'Item 1', description: 'First item' },
  { id: '2', name: 'Item 2', description: 'Second item' },
];

const masterDetail = createMasterDetail({
  items,
  getId: (item) => item.id,
  onSelectionChange: (item) => {
    console.log('Selected:', item);
  },
});

// Listen to events
masterDetail.eventBus.on('item:selected', (item) => {
  console.log('Item selected event:', item);
});

// Select an item
masterDetail.actions.selectItem(items[0]);

// Clear selection
masterDetail.actions.clearSelection();

// Clean up
masterDetail.destroy();
```

**Use cases**: Email clients, file explorers, admin panels, data browsers

### Wizard Pattern

Multi-step flows with validation and optional branching logic.

```typescript
import { createWizard } from '@web-loom/ui-patterns';

interface WizardData {
  accountType?: 'personal' | 'business';
  email?: string;
  companyName?: string;
}

const wizard = createWizard<WizardData>({
  steps: [
    {
      id: 'account-type',
      label: 'Account Type',
      validate: (data) => {
        if (!data.accountType) return 'Please select an account type';
        return null;
      },
      getNextStep: (data) => {
        // Branch based on account type
        return data.accountType === 'business' ? 'company-info' : 'personal-info';
      },
    },
    {
      id: 'company-info',
      label: 'Company Information',
      validate: (data) => {
        if (!data.companyName) return 'Company name is required';
        return null;
      },
    },
    {
      id: 'personal-info',
      label: 'Personal Information',
      validate: (data) => {
        if (!data.email) return 'Email is required';
        return null;
      },
    },
  ],
  initialData: {},
  onComplete: async (data) => {
    console.log('Wizard completed:', data);
  },
  onStepChange: (stepIndex, step) => {
    console.log('Moved to step:', step.label);
  },
});

// Set step data
wizard.actions.setStepData({ accountType: 'business' });

// Navigate
const success = await wizard.actions.goToNextStep();
wizard.actions.goToPreviousStep();
wizard.actions.goToStep(0);

// Complete wizard
await wizard.actions.completeWizard();

// Clean up
wizard.destroy();
```

**Use cases**: Onboarding flows, checkout processes, configuration wizards, form builders

### Modal Pattern

Modal dialog management with stacking support.

```typescript
import { createModal } from '@web-loom/ui-patterns';

const modal = createModal({
  id: 'confirmation-modal',
  closeOnEscape: true,
  closeOnBackdropClick: true,
  onOpen: () => console.log('Modal opened'),
  onClose: () => console.log('Modal closed'),
});

// Open modal with content
modal.actions.open({
  title: 'Confirm Action',
  message: 'Are you sure you want to proceed?',
});

// Subscribe to state
modal.subscribe((state) => {
  console.log('Modal open:', state.isOpen);
  console.log('Content:', state.content);
});

// Clean up
modal.destroy();
```

**Use cases**: Confirmation dialogs, lightboxes, forms in overlays

### Tabbed Interface Pattern

Tab-based navigation with keyboard support.

```typescript
import { createTabbedInterface } from '@web-loom/ui-patterns';

const tabs = createTabbedInterface({
  tabs: [
    { id: 'tab1', label: 'Profile', disabled: false },
    { id: 'tab2', label: 'Settings', disabled: false },
    { id: 'tab3', label: 'Billing', disabled: true },
  ],
  initialActiveTabId: 'tab1',
  onTabChange: (tab) => {
    console.log('Active tab:', tab.label);
  },
});

// Change tab
tabs.actions.activateTab('tab2');

// Navigate with keyboard
tabs.actions.focusNextTab();
tabs.actions.focusPreviousTab();

// Get state
console.log(tabs.getState().activeTabId); // 'tab2'

// Clean up
tabs.destroy();
```

**Use cases**: Settings panels, dashboards, document viewers

### Sidebar Shell Pattern

Collapsible navigation sidebar with responsive behavior.

```typescript
import { createSidebarShell } from '@web-loom/ui-patterns';

const sidebar = createSidebarShell({
  initialCollapsed: false,
  initialMobileOpen: false,
  onToggle: (isCollapsed) => {
    console.log('Sidebar collapsed:', isCollapsed);
  },
});

// Toggle sidebar
sidebar.actions.toggle();

// Mobile-specific controls
sidebar.actions.toggleMobile();

// Get state
console.log(sidebar.getState().isCollapsed); // true/false

// Clean up
sidebar.destroy();
```

**Use cases**: Application layouts, admin dashboards, documentation sites

### Toast Queue Pattern

Notification queue with auto-dismiss and priority support.

```typescript
import { createToastQueue } from '@web-loom/ui-patterns';

const toasts = createToastQueue({
  maxVisible: 3,
  defaultDuration: 5000,
  position: 'top-right',
});

// Add toast
const toastId = toasts.actions.addToast({
  message: 'Operation successful!',
  type: 'success',
  duration: 3000,
});

// Remove toast
toasts.actions.removeToast(toastId);

// Subscribe to queue
toasts.subscribe((state) => {
  console.log('Active toasts:', state.toasts);
});

// Clean up
toasts.destroy();
```

**Use cases**: Success messages, error notifications, system alerts

### Command Palette Pattern

Keyboard-driven command interface with fuzzy search.

```typescript
import { createCommandPalette } from '@web-loom/ui-patterns';

const palette = createCommandPalette({
  commands: [
    {
      id: 'new-file',
      label: 'Create New File',
      keywords: ['file', 'create', 'new'],
      handler: () => console.log('Creating file...'),
    },
    {
      id: 'save',
      label: 'Save File',
      keywords: ['save', 'write'],
      handler: () => console.log('Saving...'),
      shortcut: 'Ctrl+S',
    },
  ],
  onExecute: (command) => {
    console.log('Executed:', command.label);
  },
});

// Open palette
palette.actions.open();

// Search commands
palette.actions.setQuery('new');

// Navigate results
palette.actions.selectNext();
palette.actions.selectPrevious();

// Execute selected command
palette.actions.executeSelected();

// Clean up
palette.destroy();
```

**Use cases**: IDE-style command palettes, quick actions, keyboard shortcuts

## Event Bus Integration

All patterns include an event bus for listening to pattern-specific events:

```typescript
const masterDetail = createMasterDetail({ ... });

// Listen to specific events
masterDetail.eventBus.on('item:selected', (item) => {
  console.log('Item selected:', item);
});

// Listen once
masterDetail.eventBus.once('selection:cleared', () => {
  console.log('Selection cleared');
});

// Remove listener
const handler = (item) => console.log(item);
masterDetail.eventBus.on('item:selected', handler);
masterDetail.eventBus.off('item:selected', handler);
```

## Pattern Composition

Patterns can be composed together to build complex UIs:

```typescript
import { createMasterDetail, createModal, createToastQueue } from '@web-loom/ui-patterns';

// Master-detail with modal for item editing
const masterDetail = createMasterDetail({ ... });
const editModal = createModal({ ... });
const toasts = createToastQueue({ ... });

masterDetail.eventBus.on('item:selected', (item) => {
  editModal.actions.open({ item });
});

// Show toast on modal close
editModal.subscribe((state) => {
  if (!state.isOpen) {
    toasts.actions.addToast({
      message: 'Changes saved',
      type: 'success',
    });
  }
});
```

## API Reference

### Common Pattern Interface

All patterns follow a consistent interface:

```typescript
interface Pattern<State, Actions, Events = {}> {
  getState: () => State;
  subscribe: (listener: (state: State) => void) => () => void;
  actions: Actions;
  eventBus?: EventBus<Events>;
  destroy: () => void;
}
```

- `getState()`: Returns current state snapshot
- `subscribe(listener)`: Subscribe to state changes, returns unsubscribe function
- `actions`: Object containing all available actions
- `eventBus`: Optional event bus for pattern-specific events
- `destroy()`: Cleanup method to remove all subscriptions

## Pattern Enhancements

Several existing patterns have been enhanced with new features:

- **[Modal Pattern](./docs/PATTERN_ENHANCEMENTS.md#modal-pattern-enhancements)** - `closeOnEscape` and `closeOnBackdropClick` options
- **[Sidebar Shell Pattern](./docs/PATTERN_ENHANCEMENTS.md#sidebar-shell-pattern-enhancements)** - Mobile mode with auto-collapse behavior
- **[Toast Queue Pattern](./docs/PATTERN_ENHANCEMENTS.md#toast-queue-pattern-enhancements)** - Configurable positioning
- **[Tabbed Interface Pattern](./docs/PATTERN_ENHANCEMENTS.md#tabbed-interface-pattern-enhancements)** - Convenience methods for keyboard navigation
- **[Command Palette Pattern](./docs/PATTERN_ENHANCEMENTS.md#command-palette-pattern-enhancements)** - Simplified command navigation and execution

See the **[Pattern Enhancements Documentation](./docs/PATTERN_ENHANCEMENTS.md)** for complete details on all enhancements.

## TypeScript

Full TypeScript support with exported types for all patterns:

```typescript
import type {
  MasterDetailState,
  MasterDetailActions,
  MasterDetailBehavior,
  WizardState,
  WizardActions,
  WizardBehavior,
} from '@web-loom/ui-patterns';
```

## Dependencies

- `@web-loom/ui-core`: Core UI behaviors (included)
- `@web-loom/store-core`: Reactive state management (included)
- `@web-loom/event-bus-core`: Event system (included)

Optional peer dependencies:

- `@web-loom/mvvm-core`: For MVVM integration
- `@web-loom/query-core`: For data fetching integration

## Tree-Shaking

The package supports tree-shaking. Import only what you need:

```typescript
// Import specific pattern
import { createWizard } from '@web-loom/ui-patterns';

// Or use direct imports
import { createWizard } from '@web-loom/ui-patterns/patterns/wizard';
```

## License

MIT

### From the root README:

#### [@web-loom/ui-patterns](packages/ui-patterns) ![Version](https://img.shields.io/badge/version-0.5.2-blue)

Composed UI patterns (Master-Detail, Wizard, Modal, Command Palette, Tabbed Interface, Sidebar Shell, Toast Queue). Built by composing ui-core behaviors.

**Key features**: 7+ production patterns, event bus integration, validation support

```typescript
import { createWizard } from '@web-loom/ui-patterns';
const wizard = createWizard({ steps: [...], onComplete: (data) => {...} });
```
