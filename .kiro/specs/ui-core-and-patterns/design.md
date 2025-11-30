# Design Document

## Overview

The Web Loom UI Core and UI Patterns packages provide a universal headless behavior layer for modern frontend development. This design leverages the existing Web Loom ecosystem, particularly `@web-loom/store-core` for state management and `@web-loom/event-bus-core` for cross-behavior communication.

### Design Philosophy

1. **Behavior over Appearance**: Pure logic with no styling or DOM assumptions
2. **Framework-Agnostic Core**: Works with React, Vue, Angular, Svelte, and Vanilla JS
3. **Composable Architecture**: Atomic behaviors compose into complex patterns
4. **Integration First**: Seamless integration with existing Web Loom packages
5. **Type-Safe**: Full TypeScript coverage with no `any` types in public APIs
6. **Minimal Dependencies**: Leverage existing Web Loom infrastructure
7. **Performance-Conscious**: <2KB per behavior, tree-shakeable exports

### Package Relationship

```
@web-loom/ui-patterns
    ↓ depends on
@web-loom/ui-core
    ↓ depends on
@web-loom/store-core + @web-loom/event-bus-core
```

## Architecture

### Layer 1: Foundation (Existing Web Loom Packages)

#### Store Core Integration

All behaviors use `@web-loom/store-core` as the state management foundation:

```typescript
import { createStore } from '@web-loom/store-core';

// Behaviors create stores with typed state and actions
const store = createStore<State, Actions>(initialState, (set, get, actions) => ({
  // Action implementations
}));
```

**Benefits:**

- Consistent state management across all behaviors
- Subscription-based reactivity
- Type-safe state and actions
- Minimal footprint

#### Event Bus Integration

Cross-behavior communication uses `@web-loom/event-bus-core`:

```typescript
import { createEventBus } from '@web-loom/event-bus-core';

const uiEventBus = createEventBus();

// Behaviors emit and listen to events
uiEventBus.emit('dialog:opened', { dialogId: 'settings' });
uiEventBus.on('dialog:opened', (payload) => {
  // Handle event
});
```

### Layer 2: UI Core Package (Atomic Behaviors)

#### Behavior Interface Pattern

All behaviors follow a consistent interface:

```typescript
interface Behavior<State, Actions> {
  getState: () => State;
  subscribe: (listener: (state: State) => void) => () => void;
  actions: Actions;
  destroy: () => void;
}
```

#### State Machine Pattern

Each behavior is modeled as a deterministic state machine:

```typescript
type BehaviorState = {
  status: 'idle' | 'active' | 'transitioning';
  // Additional state properties
};

type BehaviorEvent = { type: 'ACTION_1'; payload?: any } | { type: 'ACTION_2'; payload?: any };
```

### Layer 3: UI Patterns Package (Composed Patterns)

Patterns compose multiple behaviors:

```typescript
function createPattern(options) {
  const behavior1 = createBehavior1();
  const behavior2 = createBehavior2();
  const eventBus = createEventBus();

  // Compose behaviors with coordination logic

  return {
    getState,
    subscribe,
    actions,
    eventBus,
    destroy,
  };
}
```

## Components and Interfaces

### UI Core Behaviors

#### 1. Dialog Behavior

**Purpose**: Manage modal dialog open/close state

**State Interface**:

```typescript
interface DialogState {
  isOpen: boolean;
  content: any;
  id: string | null;
}
```

**Actions Interface**:

```typescript
interface DialogActions {
  open: (content: any) => void;
  close: () => void;
  toggle: (content?: any) => void;
}
```

**Options Interface**:

```typescript
interface DialogBehaviorOptions {
  id?: string;
  onOpen?: (content: any) => void;
  onClose?: () => void;
}
```

#### 2. Roving Focus Behavior

**Purpose**: Manage keyboard navigation through a list of items

**State Interface**:

```typescript
interface RovingFocusState {
  currentIndex: number;
  items: string[];
  orientation: 'horizontal' | 'vertical';
  wrap: boolean;
}
```

**Actions Interface**:

```typescript
interface RovingFocusActions {
  moveNext: () => void;
  movePrevious: () => void;
  moveFirst: () => void;
  moveLast: () => void;
  moveTo: (index: number) => void;
  setItems: (items: string[]) => void;
}
```

#### 3. List Selection Behavior

**Purpose**: Manage single/multi/range selection in lists

**State Interface**:

```typescript
interface ListSelectionState {
  selectedIds: string[];
  lastSelectedId: string | null;
  mode: 'single' | 'multi' | 'range';
  items: string[];
}
```

**Actions Interface**:

```typescript
interface ListSelectionActions {
  select: (id: string) => void;
  deselect: (id: string) => void;
  toggleSelection: (id: string) => void;
  selectRange: (startId: string, endId: string) => void;
  clearSelection: () => void;
  selectAll: () => void;
}
```

#### 4. Disclosure Behavior

**Purpose**: Manage expand/collapse state for accordions and collapsible sections

**State Interface**:

```typescript
interface DisclosureState {
  isExpanded: boolean;
  id: string | null;
}
```

**Actions Interface**:

```typescript
interface DisclosureActions {
  expand: () => void;
  collapse: () => void;
  toggle: () => void;
}
```

#### 5. Form Behavior

**Purpose**: Manage form state, validation, and submission

**State Interface**:

```typescript
interface FormState<T extends Record<string, any>> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  dirty: Partial<Record<keyof T, boolean>>;
  isValidating: boolean;
  isValid: boolean;
  isSubmitting: boolean;
  submitCount: number;
}
```

**Actions Interface**:

```typescript
interface FormActions<T> {
  setFieldValue: (field: keyof T, value: any) => void;
  setFieldTouched: (field: keyof T, touched: boolean) => void;
  validateField: (field: keyof T) => Promise<void>;
  validateForm: () => Promise<boolean>;
  resetForm: () => void;
  submitForm: () => Promise<void>;
}
```

### UI Patterns

#### 1. Master-Detail Pattern

**Composed From**: List Selection Behavior + Event Bus

**State Interface**:

```typescript
interface MasterDetailState<T> {
  items: T[];
  selectedItem: T | null;
  detailView: string;
}
```

**Actions Interface**:

```typescript
interface MasterDetailActions<T> {
  selectItem: (item: T) => void;
  clearSelection: () => void;
  setDetailView: (view: string) => void;
}
```

#### 2. Tabbed Interface Pattern

**Composed From**: Roving Focus + Disclosure Behaviors

**State Interface**:

```typescript
interface TabbedInterfaceState {
  tabs: Array<{ id: string; label: string; disabled?: boolean }>;
  activeTabId: string;
  panels: Map<string, any>;
}
```

**Actions Interface**:

```typescript
interface TabbedInterfaceActions {
  activateTab: (tabId: string) => void;
  addTab: (tab: { id: string; label: string }) => void;
  removeTab: (tabId: string) => void;
  moveTab: (fromIndex: number, toIndex: number) => void;
}
```

#### 3. Sidebar Shell Pattern

**Composed From**: Disclosure Behavior + Event Bus

**State Interface**:

```typescript
interface SidebarShellState {
  isExpanded: boolean;
  activeSection: string | null;
  isPinned: boolean;
  width: number;
}
```

**Actions Interface**:

```typescript
interface SidebarShellActions {
  expand: () => void;
  collapse: () => void;
  toggle: () => void;
  setActiveSection: (section: string) => void;
  togglePin: () => void;
  setWidth: (width: number) => void;
}
```

#### 4. Wizard Pattern

**Composed From**: Form Behavior + Stepper Logic

**State Interface**:

```typescript
interface WizardState<T = any> {
  steps: Array<{ id: string; label: string; isValid?: boolean }>;
  currentStepIndex: number;
  completedSteps: number[];
  canProceed: boolean;
  data: T;
}
```

**Actions Interface**:

```typescript
interface WizardActions {
  goToNextStep: () => Promise<boolean>;
  goToPreviousStep: () => void;
  goToStep: (index: number) => void;
  completeWizard: () => Promise<void>;
  setStepData: (data: any) => void;
}
```

#### 5. Modal Pattern

**Composed From**: Dialog Behavior + Stack Management

**State Interface**:

```typescript
interface ModalState {
  stack: Array<{ id: string; content: any; priority: number }>;
  topModalId: string | null;
}
```

**Actions Interface**:

```typescript
interface ModalActions {
  openModal: (id: string, content: any, priority?: number) => void;
  closeModal: (id: string) => void;
  closeTopModal: () => void;
  closeAllModals: () => void;
}
```

#### 6. Toast Queue Pattern

**Composed From**: Queue Management + Timer Logic

**State Interface**:

```typescript
interface ToastQueueState {
  toasts: Array<{
    id: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    duration: number;
    createdAt: number;
  }>;
  maxVisible: number;
  defaultDuration: number;
}
```

**Actions Interface**:

```typescript
interface ToastQueueActions {
  addToast: (toast: Omit<Toast, 'id' | 'createdAt'>) => string;
  removeToast: (id: string) => void;
  clearAllToasts: () => void;
}
```

#### 7. Command Palette Pattern

**Composed From**: Dialog + Roving Focus + Fuzzy Search

**State Interface**:

```typescript
interface CommandPaletteState {
  isOpen: boolean;
  query: string;
  commands: Command[];
  filteredCommands: Command[];
  selectedIndex: number;
}

interface Command {
  id: string;
  label: string;
  category?: string;
  keywords?: string[];
  shortcut?: string;
  action: () => void | Promise<void>;
}
```

**Actions Interface**:

```typescript
interface CommandPaletteActions {
  open: () => void;
  close: () => void;
  setQuery: (query: string) => void;
  executeCommand: (commandId: string) => Promise<void>;
  registerCommand: (command: Command) => void;
  unregisterCommand: (commandId: string) => void;
}
```

## Data Models

### Behavior Factory Pattern

All behaviors follow a factory function pattern:

```typescript
export function createBehavior<State, Actions>(options?: BehaviorOptions): Behavior<State, Actions> {
  // Create store with initial state
  const store = createStore<State, Actions>(initialState, (set, get, actions) => ({
    // Action implementations
  }));

  // Optional: Set up event listeners
  // Optional: Set up side effects

  return {
    getState: store.getState,
    subscribe: store.subscribe,
    actions: store.actions,
    destroy: () => {
      // Cleanup logic
      store.destroy();
    },
  };
}
```

### Framework Adapter Pattern

#### React Adapter Pattern

```typescript
export function useBehavior<State, Actions>(
  factory: () => Behavior<State, Actions>,
  deps: any[] = [],
): State & { actions: Actions } {
  const [behavior] = useState(factory);
  const [state, setState] = useState(behavior.getState());

  useEffect(() => {
    const unsubscribe = behavior.subscribe(setState);
    return () => {
      unsubscribe();
      behavior.destroy();
    };
  }, [behavior]);

  return {
    ...state,
    actions: behavior.actions,
  };
}
```

#### Vue Adapter Pattern

```typescript
export function useBehavior<State, Actions>(factory: () => Behavior<State, Actions>) {
  const behavior = factory();
  const state = ref(behavior.getState());

  const unsubscribe = behavior.subscribe((newState) => {
    state.value = newState;
  });

  onUnmounted(() => {
    unsubscribe();
    behavior.destroy();
  });

  return {
    state: readonly(state),
    actions: behavior.actions,
  };
}
```

#### Angular Adapter Pattern

```typescript
@Injectable()
export class BehaviorService<State, Actions> implements OnDestroy {
  private behavior: Behavior<State, Actions>;
  private state$ = new BehaviorSubject<State>(null!);

  constructor(factory: () => Behavior<State, Actions>) {
    this.behavior = factory();
    this.state$.next(this.behavior.getState());
    this.behavior.subscribe((state) => this.state$.next(state));
  }

  getState$(): Observable<State> {
    return this.state$.asObservable();
  }

  get actions(): Actions {
    return this.behavior.actions;
  }

  ngOnDestroy(): void {
    this.behavior.destroy();
    this.state$.complete();
  }
}
```

## Error Handling

### Behavior Error Handling

Behaviors handle errors gracefully:

1. **Validation Errors**: Captured in state (e.g., `errors` field in form behavior)
2. **Async Errors**: Caught and stored in state with error messages
3. **Action Errors**: Logged to console in development, silent in production
4. **Subscription Errors**: Wrapped in try-catch to prevent crashes

```typescript
// Example: Form validation error handling
async validateField(field: keyof T): Promise<void> {
  try {
    set((state) => ({ ...state, isValidating: true }));

    const validator = options.fields[field]?.validate;
    if (!validator) return;

    const error = await validator(get().values[field]);

    set((state) => ({
      ...state,
      errors: { ...state.errors, [field]: error || undefined },
      isValidating: false,
    }));
  } catch (err) {
    console.error(`Validation error for field ${String(field)}:`, err);
    set((state) => ({
      ...state,
      errors: { ...state.errors, [field]: 'Validation failed' },
      isValidating: false,
    }));
  }
}
```

### Pattern Error Handling

Patterns propagate errors from composed behaviors:

```typescript
// Example: Wizard pattern error handling
async goToNextStep(): Promise<boolean> {
  try {
    const isValid = await this.validateCurrentStep();
    if (!isValid) return false;

    // Proceed to next step
    return true;
  } catch (err) {
    console.error('Error proceeding to next step:', err);
    eventBus.emit('wizard:error', { error: err });
    return false;
  }
}
```

## Testing Strategy

### Unit Testing (Vitest)

Each behavior is tested in isolation:

```typescript
describe('createDialogBehavior', () => {
  it('should initialize with closed state', () => {
    const dialog = createDialogBehavior();
    expect(dialog.getState().isOpen).toBe(false);
  });

  it('should open dialog with content', () => {
    const dialog = createDialogBehavior();
    dialog.actions.open({ title: 'Test' });
    expect(dialog.getState().isOpen).toBe(true);
    expect(dialog.getState().content).toEqual({ title: 'Test' });
  });

  it('should call onOpen callback', () => {
    const onOpen = vi.fn();
    const dialog = createDialogBehavior({ onOpen });
    dialog.actions.open({ title: 'Test' });
    expect(onOpen).toHaveBeenCalledWith({ title: 'Test' });
  });

  it('should clean up on destroy', () => {
    const dialog = createDialogBehavior();
    const unsubscribe = vi.fn();
    dialog.subscribe(() => {});
    dialog.destroy();
    // Verify no memory leaks
  });
});
```

### Integration Testing

Patterns are tested with composed behaviors:

```typescript
describe('createMasterDetail', () => {
  it('should sync selection with detail view', () => {
    const items = [{ id: '1', name: 'Item 1' }];
    const masterDetail = createMasterDetail({
      items,
      getId: (item) => item.id,
    });

    masterDetail.actions.selectItem(items[0]);
    expect(masterDetail.getState().selectedItem).toBe(items[0]);
  });
});
```

### Framework Adapter Testing

React adapters tested with React Testing Library:

```typescript
describe('useDialogBehavior', () => {
  it('should update component on state change', () => {
    const { result } = renderHook(() => useDialogBehavior());

    expect(result.current.isOpen).toBe(false);

    act(() => {
      result.current.open({ title: 'Test' });
    });

    expect(result.current.isOpen).toBe(true);
  });
});
```

### Accessibility Testing

Behaviors include accessibility guidance:

```typescript
// Example: Dialog behavior accessibility tests
describe('Dialog Accessibility', () => {
  it('should provide focus trap guidance', () => {
    const dialog = createDialogBehavior();
    // Test that behavior emits events for focus management
  });

  it('should support escape key to close', () => {
    const dialog = createDialogBehavior();
    dialog.actions.open({});
    // Simulate escape key
    dialog.actions.close();
    expect(dialog.getState().isOpen).toBe(false);
  });
});
```

## Performance Considerations

### Bundle Size Optimization

1. **Tree-Shaking**: Each behavior is a separate export
2. **No Heavy Dependencies**: Only store-core and event-bus-core
3. **Minimal Code**: Each behavior <2KB gzipped
4. **Code Splitting**: Patterns can be lazy-loaded

### Runtime Performance

1. **Efficient State Updates**: Use store-core's optimized subscription system
2. **Memoization**: Computed values cached where appropriate
3. **Debouncing**: Expensive operations (e.g., fuzzy search) debounced
4. **Cleanup**: All subscriptions properly cleaned up

### Memory Management

1. **Subscription Cleanup**: `destroy()` method removes all listeners
2. **No Memory Leaks**: Behaviors don't hold references after destruction
3. **Weak References**: Event bus uses weak references where possible

## Integration Points

### MVVM Core Integration

Behaviors integrate seamlessly with ViewModels:

```typescript
import { BaseViewModel } from '@web-loom/mvvm-core';
import { createDialogBehavior } from '@web-loom/ui-core';

export class SettingsViewModel extends BaseViewModel {
  private dialogBehavior = createDialogBehavior({
    id: 'settings-dialog',
  });

  constructor() {
    super();
    this.dialogBehavior.subscribe((state) => {
      if (state.isOpen) {
        this.loadSettings();
      }
    });
  }

  get isDialogOpen(): boolean {
    return this.dialogBehavior.getState().isOpen;
  }

  openSettings(tab: string): void {
    this.dialogBehavior.actions.open({ tab });
  }

  dispose(): void {
    this.dialogBehavior.destroy();
    super.dispose();
  }
}
```

### Query Core Integration

Patterns can integrate with data fetching:

```typescript
import { createQuery } from '@web-loom/query-core';
import { createMasterDetail } from '@web-loom/ui-patterns';

const itemsQuery = createQuery({
  queryKey: ['items'],
  queryFn: fetchItems,
});

const masterDetail = createMasterDetail({
  items: itemsQuery.data || [],
  getId: (item) => item.id,
});
```

### Design Core Integration

Behaviors can respect theme settings:

```typescript
import { useTheme } from '@web-loom/design-core';
import { useDialogBehavior } from '@web-loom/ui-core/react';

function ThemedDialog() {
  const theme = useTheme();
  const dialog = useDialogBehavior();

  // Use theme values for styling
}
```

## Deployment and Distribution

### Package Publishing

Both packages published to npm:

- `@web-loom/ui-core@1.0.0`
- `@web-loom/ui-patterns@1.0.0`

### Versioning Strategy

Follow semantic versioning:

- Major: Breaking API changes
- Minor: New behaviors/patterns
- Patch: Bug fixes

### Documentation

1. **API Documentation**: Auto-generated from TSDoc
2. **Interactive Examples**: Playground app
3. **Tutorials**: Step-by-step guides
4. **Migration Guides**: Upgrading between versions

## Security Considerations

1. **No XSS Vulnerabilities**: Behaviors don't manipulate DOM
2. **Input Validation**: Form behavior validates all inputs
3. **Safe Serialization**: All state is JSON-serializable
4. **No Eval**: No dynamic code execution

## Accessibility Guidelines

Each behavior includes accessibility guidance:

1. **Keyboard Navigation**: All interactive patterns support keyboard
2. **Screen Reader Support**: State changes announced appropriately
3. **Focus Management**: Clear focus indicators and trapping
4. **ARIA Attributes**: Guidance for proper ARIA usage
5. **WCAG 2.1 AA Compliance**: All patterns meet accessibility standards
