# Design Document: UI Core & Patterns Gap Closure

## Overview

This design document outlines the technical approach for implementing the missing behaviors and patterns identified in the Gap Analysis Report for the Web Loom UI Core and UI Patterns packages. The implementation will add three critical core behaviors (Keyboard Shortcuts, Undo/Redo Stack, Drag-and-Drop), three macro patterns (Hub & Spoke Navigation, Grid/Card Layout, Floating Action Button), and enhancements to existing patterns.

The design follows Web Loom's established architectural principles:

- Framework-agnostic core logic using `@web-loom/store-core`
- Event communication via `@web-loom/event-bus-core`
- Headless design with no DOM manipulation
- Type-safe APIs with full TypeScript coverage
- Comprehensive testing with Vitest
- Bundle size optimization (<2KB per behavior)

## Architecture

### High-Level Architecture

All new behaviors and patterns follow the same architectural pattern established in the existing UI Core and Patterns packages:

```
┌─────────────────────────────────────────────────────────────┐
│                    Framework Layer                           │
│  (React Hooks, Vue Composables, Angular Services)           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   UI Patterns Package                        │
│  (Hub & Spoke, Grid Layout, FAB + Enhancements)             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    UI Core Package                           │
│  (Keyboard Shortcuts, Undo/Redo, Drag-Drop + Enhancements)  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              Web Loom Foundation                             │
│  (@web-loom/store-core, @web-loom/event-bus-core)          │
└─────────────────────────────────────────────────────────────┘
```

### State Management Strategy

All behaviors use `@web-loom/store-core` for state management:

- Immutable state updates
- Subscription-based reactivity
- Type-safe state and actions
- Minimal memory footprint

### Event Communication Strategy

Cross-behavior and pattern-level events use `@web-loom/event-bus-core`:

- Loose coupling between components
- Type-safe event payloads
- Scoped event buses for isolation

## Components and Interfaces

### 1. Keyboard Shortcuts Behavior

**Location:** `packages/ui-core/src/behaviors/keyboard-shortcuts.ts`

**Purpose:** Manages keyboard shortcut registration, key combination parsing, and handler execution with support for global and scoped listeners.

**Interface:**

```typescript
interface KeyboardShortcut {
  key: string; // e.g., "Ctrl+K", "Cmd+Shift+P"
  handler: () => void;
  description?: string;
  preventDefault?: boolean;
  scope?: 'global' | 'scoped';
}

interface KeyboardShortcutsState {
  shortcuts: Map<string, KeyboardShortcut>;
  scope: 'global' | 'scoped';
  activeShortcuts: string[];
  enabled: boolean;
}

interface KeyboardShortcutsActions {
  registerShortcut: (shortcut: KeyboardShortcut) => void;
  unregisterShortcut: (key: string) => void;
  setScope: (scope: 'global' | 'scoped') => void;
  clearAllShortcuts: () => void;
  enable: () => void;
  disable: () => void;
}

function createKeyboardShortcuts(options?: {
  scope?: 'global' | 'scoped';
  onShortcutExecuted?: (key: string) => void;
}): Behavior<KeyboardShortcutsState, KeyboardShortcutsActions>;
```

**Key Design Decisions:**

1. **Key Normalization:** Platform-specific keys (Cmd/Ctrl) are normalized internally to a canonical form
2. **Conflict Resolution:** Last registered shortcut wins when conflicts occur
3. **Scope Management:** Global shortcuts work everywhere; scoped shortcuts only work within a component boundary
4. **Event Delegation:** Uses a single global event listener for efficiency

### 2. Undo/Redo Stack Behavior

**Location:** `packages/ui-core/src/behaviors/undo-redo-stack.ts`

**Purpose:** Maintains an immutable history of states with undo/redo operations, supporting time-travel debugging and state persistence.

**Interface:**

```typescript
interface UndoRedoStackState<T> {
  past: T[];
  present: T;
  future: T[];
  canUndo: boolean;
  canRedo: boolean;
  maxLength: number;
}

interface UndoRedoStackActions<T> {
  undo: () => void;
  redo: () => void;
  pushState: (state: T) => void;
  clearHistory: () => void;
  jumpToState: (index: number) => void;
  setMaxLength: (length: number) => void;
}

function createUndoRedoStack<T>(options: {
  initialState: T;
  maxLength?: number;
  onStateChange?: (state: T) => void;
}): Behavior<UndoRedoStackState<T>, UndoRedoStackActions<T>>;
```

**Key Design Decisions:**

1. **Structural Sharing:** Uses immutable data structures to minimize memory usage
2. **Bounded History:** Configurable max length prevents unbounded memory growth
3. **Serialization Support:** All states must be JSON-serializable for persistence
4. **Time-Travel:** `jumpToState` allows direct navigation to any point in history

### 3. Drag-and-Drop Behavior

**Location:** `packages/ui-core/src/behaviors/drag-drop.ts`

**Purpose:** Manages drag-and-drop interaction state including drag source, drop target, drag data, and reordering logic.

**Interface:**

```typescript
interface DragDropState {
  draggedItem: string | null;
  dropTarget: string | null;
  isDragging: boolean;
  dragData: any;
  dropZones: string[];
  dragOverZone: string | null;
}

interface DragDropActions {
  startDrag: (itemId: string, data?: any) => void;
  endDrag: () => void;
  setDropTarget: (targetId: string | null) => void;
  drop: (targetId: string) => void;
  registerDropZone: (zoneId: string) => void;
  unregisterDropZone: (zoneId: string) => void;
  setDragOver: (zoneId: string | null) => void;
}

function createDragDropBehavior(options?: {
  onDragStart?: (itemId: string, data: any) => void;
  onDragEnd?: (itemId: string) => void;
  onDrop?: (draggedItem: string, dropTarget: string, data: any) => void;
  validateDrop?: (draggedItem: string, dropTarget: string) => boolean;
}): Behavior<DragDropState, DragDropActions>;
```

**Key Design Decisions:**

1. **Validation Layer:** Optional `validateDrop` callback allows custom drop validation logic
2. **Drag Data:** Supports arbitrary data transfer from source to target
3. **Drop Zone Registry:** Explicit registration ensures only valid drop targets
4. **Accessibility:** Provides state for keyboard-based drag-and-drop alternatives

### 4. Hub & Spoke Navigation Pattern

**Location:** `packages/ui-patterns/src/patterns/hub-and-spoke.ts`

**Purpose:** Manages navigation between a central hub and independent spoke pages with breadcrumb tracking.

**Interface:**

```typescript
interface Spoke {
  id: string;
  label: string;
  icon?: string;
  subSpokes?: Spoke[];
}

interface HubAndSpokeState {
  isOnHub: boolean;
  activeSpoke: string | null;
  spokes: Spoke[];
  breadcrumbs: string[];
  navigationHistory: string[];
}

interface HubAndSpokeActions {
  activateSpoke: (spokeId: string) => void;
  returnToHub: () => void;
  goBack: () => void;
  updateBreadcrumbs: (breadcrumbs: string[]) => void;
  addSpoke: (spoke: Spoke) => void;
  removeSpoke: (spokeId: string) => void;
}

function createHubAndSpoke(options: {
  spokes: Spoke[];
  onSpokeActivate?: (spokeId: string) => void;
  onReturnToHub?: () => void;
  enableBrowserHistory?: boolean;
}): Pattern<HubAndSpokeState, HubAndSpokeActions>;
```

**Key Design Decisions:**

1. **Nested Spokes:** Supports hierarchical spoke structures for complex navigation
2. **History Integration:** Optional browser history API integration for URL-based navigation
3. **Breadcrumb Management:** Automatic breadcrumb generation based on navigation path
4. **Event Emission:** Emits `spoke:activated` and `hub:returned` events

### 5. Grid/Card Layout Pattern

**Location:** `packages/ui-patterns/src/patterns/grid-layout.ts`

**Purpose:** Manages responsive grid layouts with keyboard navigation and selection support.

**Interface:**

```typescript
interface Breakpoint {
  minWidth: number;
  columns: number;
}

interface GridLayoutState<T> {
  items: T[];
  columns: number;
  selectedItems: string[];
  focusedIndex: number;
  breakpoint: Breakpoint;
  viewportWidth: number;
  selectionMode: 'single' | 'multi';
}

interface GridLayoutActions<T> {
  selectItem: (itemId: string) => void;
  navigateUp: () => void;
  navigateDown: () => void;
  navigateLeft: () => void;
  navigateRight: () => void;
  setBreakpoints: (breakpoints: Breakpoint[]) => void;
  updateViewportWidth: (width: number) => void;
  setItems: (items: T[]) => void;
}

function createGridLayout<T>(options: {
  items: T[];
  getId: (item: T) => string;
  breakpoints: Breakpoint[];
  selectionMode?: 'single' | 'multi';
  onSelectionChange?: (selected: T[]) => void;
  wrap?: boolean;
}): Pattern<GridLayoutState<T>, GridLayoutActions<T>>;
```

**Key Design Decisions:**

1. **Responsive Logic:** Pure JavaScript breakpoint calculation (no CSS media queries)
2. **2D Navigation:** Arrow key navigation respects grid structure (up/down/left/right)
3. **Selection Integration:** Uses `createListSelection` from UI Core
4. **Wrapping Support:** Optional wrapping at grid boundaries
5. **Event Emission:** Emits `item:focused`, `item:selected`, `breakpoint:changed` events

### 6. Floating Action Button Pattern

**Location:** `packages/ui-patterns/src/patterns/floating-action-button.ts`

**Purpose:** Manages FAB visibility based on scroll position and direction.

**Interface:**

```typescript
interface FABState {
  isVisible: boolean;
  scrollPosition: number;
  scrollDirection: 'up' | 'down' | null;
  scrollThreshold: number;
  hideOnScrollDown: boolean;
}

interface FABActions {
  show: () => void;
  hide: () => void;
  setScrollPosition: (position: number) => void;
  setScrollThreshold: (threshold: number) => void;
  toggle: () => void;
  setHideOnScrollDown: (hide: boolean) => void;
}

function createFloatingActionButton(options?: {
  scrollThreshold?: number;
  hideOnScrollDown?: boolean;
  onVisibilityChange?: (visible: boolean) => void;
}): Pattern<FABState, FABActions>;
```

**Key Design Decisions:**

1. **Scroll Direction Detection:** Tracks scroll direction for hide-on-scroll-down behavior
2. **Threshold-Based Visibility:** Shows FAB only after scrolling past threshold
3. **Performance:** Expects throttled scroll events from view layer
4. **Event Emission:** Emits `fab:shown` and `fab:hidden` events

## Data Models

### Key Combination Parsing

The Keyboard Shortcuts behavior uses a normalized key combination format:

```typescript
interface ParsedKeyCombo {
  ctrl: boolean;
  shift: boolean;
  alt: boolean;
  meta: boolean;
  key: string;
  normalized: string; // e.g., "Ctrl+Shift+K"
}

function parseKeyCombo(combo: string): ParsedKeyCombo {
  // Normalize platform differences (Cmd → Meta, Ctrl → Ctrl)
  // Parse modifiers and primary key
  // Generate normalized string representation
}
```

### State History Structure

The Undo/Redo Stack uses a three-part history structure:

```typescript
interface History<T> {
  past: T[]; // [oldest, ..., most recent]
  present: T; // current state
  future: T[]; // [next, ..., furthest]
}
```

Operations:

- **Push:** `past.push(present)`, `present = new`, `future = []`
- **Undo:** `future.unshift(present)`, `present = past.pop()`
- **Redo:** `past.push(present)`, `present = future.shift()`

### Grid Navigation Algorithm

The Grid Layout pattern uses a 2D navigation algorithm:

```typescript
interface GridPosition {
  row: number;
  col: number;
}

function indexToPosition(index: number, columns: number): GridPosition {
  return {
    row: Math.floor(index / columns),
    col: index % columns,
  };
}

function positionToIndex(pos: GridPosition, columns: number): number {
  return pos.row * columns + pos.col;
}

// Navigation functions
function navigateUp(currentIndex: number, columns: number, totalItems: number): number {
  const newIndex = currentIndex - columns;
  return newIndex >= 0 ? newIndex : currentIndex; // or wrap to bottom
}

function navigateDown(currentIndex: number, columns: number, totalItems: number): number {
  const newIndex = currentIndex + columns;
  return newIndex < totalItems ? newIndex : currentIndex; // or wrap to top
}
```

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Keyboard Shortcuts Behavior Properties

**Property 1: Key combination registration and execution**
_For any_ valid key combination and handler function, when the key combination is registered and then triggered, the handler should be executed exactly once.
**Validates: Requirements 1.3, 1.6**

**Property 2: Platform normalization consistency**
_For any_ key combination using Cmd on macOS or Ctrl on Windows/Linux, the normalized internal representation should be identical, ensuring cross-platform consistency.
**Validates: Requirements 1.4**

**Property 3: preventDefault behavior**
_For any_ registered shortcut with `preventDefault: true`, when the key combination is triggered, the default browser behavior should be prevented.
**Validates: Requirements 1.7**

**Property 4: Scope isolation**
_For any_ scoped shortcut, when triggered outside its scope, the handler should not be executed; when triggered inside its scope, the handler should be executed.
**Validates: Requirements 1.8**

**Property 5: Conflict resolution**
_For any_ key combination with multiple registered handlers, only the most recently registered handler should be executed when the key combination is triggered.
**Validates: Requirements 1.10**

### Undo/Redo Stack Properties

**Property 6: Push state transition**
_For any_ state, when `pushState` is called, the current state should move to `past`, the new state should become `present`, and `future` should be empty.
**Validates: Requirements 2.4**

**Property 7: Undo state transition**
_For any_ non-empty past history, when `undo` is called, the current state should move to `future`, and the most recent past state should become `present`.
**Validates: Requirements 2.5**

**Property 8: Redo state transition**
_For any_ non-empty future history, when `redo` is called, the current state should move to `past`, and the next future state should become `present`.
**Validates: Requirements 2.6**

**Property 9: Undo-redo round trip**
_For any_ state, performing undo followed by redo should return to the original state (idempotence).
**Validates: Requirements 2.5, 2.6**

**Property 10: History length limit**
_For any_ maxLength value, when the number of past states exceeds maxLength, the oldest state should be removed.
**Validates: Requirements 2.7, 2.8**

**Property 11: State serializability**
_For any_ state in the history, serializing and deserializing the state should produce an equivalent state.
**Validates: Requirements 2.9**

### Drag-and-Drop Behavior Properties

**Property 12: Drag start state transition**
_For any_ item, when `startDrag` is called, `isDragging` should be true, `draggedItem` should be set, and `onDragStart` callback should be invoked.
**Validates: Requirements 3.4**

**Property 13: Drag end state transition**
_For any_ dragging state, when `endDrag` is called, `isDragging` should be false, `draggedItem` should be null, and `onDragEnd` callback should be invoked.
**Validates: Requirements 3.5**

**Property 14: Drop validation**
_For any_ drop operation, the drop should only succeed if the target is a registered drop zone.
**Validates: Requirements 3.9**

**Property 15: Drag data preservation**
_For any_ drag data, the data should be accessible throughout the drag operation and passed to the `onDrop` callback.
**Validates: Requirements 3.8**

### Hub & Spoke Navigation Properties

**Property 16: Spoke activation state transition**
_For any_ spoke, when `activateSpoke` is called, `isOnHub` should be false, `activeSpoke` should be set, and the spoke should be added to breadcrumbs.
**Validates: Requirements 4.4**

**Property 17: Hub return state transition**
_For any_ active spoke, when `returnToHub` is called, `isOnHub` should be true, `activeSpoke` should be null, and breadcrumbs should be reset.
**Validates: Requirements 4.5**

**Property 18: Navigation history consistency**
_For any_ sequence of spoke activations, the navigation history should accurately reflect the order of navigation.
**Validates: Requirements 4.9**

**Property 19: Event emission on navigation**
_For any_ spoke activation or hub return, the corresponding event (`spoke:activated` or `hub:returned`) should be emitted.
**Validates: Requirements 4.6**

### Grid Layout Pattern Properties

**Property 20: Breakpoint column calculation**
_For any_ viewport width and set of breakpoints, the number of columns should match the breakpoint with the largest minWidth that is less than or equal to the viewport width.
**Validates: Requirements 5.4, 5.5**

**Property 21: Up navigation correctness**
_For any_ focused item not in the first row, navigating up should move focus to the item in the same column in the row above (index - columns).
**Validates: Requirements 5.7**

**Property 22: Down navigation correctness**
_For any_ focused item not in the last row, navigating down should move focus to the item in the same column in the row below (index + columns).
**Validates: Requirements 5.8**

**Property 23: Left navigation with wrapping**
_For any_ focused item, navigating left should move to the previous item, wrapping to the last item if at the first position.
**Validates: Requirements 5.9**

**Property 24: Right navigation with wrapping**
_For any_ focused item, navigating right should move to the next item, wrapping to the first item if at the last position.
**Validates: Requirements 5.10**

**Property 25: Selection mode consistency**
_For any_ selection mode (single or multi), the selection behavior should match the mode (single allows one selection, multi allows multiple).
**Validates: Requirements 5.11**

### Floating Action Button Properties

**Property 26: Scroll direction detection**
_For any_ two consecutive scroll positions, the scroll direction should be correctly calculated as 'up' or 'down'.
**Validates: Requirements 6.4**

**Property 27: Threshold-based visibility**
_For any_ scroll position above the threshold, the FAB should be visible; for any position below, it should be hidden.
**Validates: Requirements 6.5, 6.6**

**Property 28: Hide on scroll down behavior**
_For any_ scroll down event when `hideOnScrollDown` is enabled, the FAB should be hidden; for scroll up, it should be shown.
**Validates: Requirements 6.7, 6.8**

### Modal Pattern Enhancement Properties

**Property 29: Escape key closes modal**
_For any_ modal with `closeOnEscape: true`, pressing the Escape key should close the top modal in the stack.
**Validates: Requirements 7.3**

**Property 30: Backdrop click closes modal**
_For any_ modal with `closeOnBackdropClick: true`, clicking the backdrop should close the modal.
**Validates: Requirements 7.4**

### Roving Focus Enhancement Properties

**Property 31: Focus change callback invocation**
_For any_ focus change, the `onFocusChange` callback should be invoked with the correct index, itemId, and previousIndex.
**Validates: Requirements 8.2, 8.3**

### Form Behavior Enhancement Properties

**Property 32: Manual error setting**
_For any_ field, when `setFieldError` is called, the field error should be set without triggering validation.
**Validates: Requirements 9.2**

**Property 33: Error merging**
_For any_ field with both manual and validation errors, both errors should be present in the field's error state.
**Validates: Requirements 9.4**

### Sidebar Shell Enhancement Properties

**Property 34: Mobile auto-collapse**
_For any_ sidebar in mobile mode, when a section is selected, the sidebar should automatically collapse.
**Validates: Requirements 10.3**

### Toast Queue Enhancement Properties

**Property 35: Position configuration**
_For any_ valid position value, setting the position should update the state and emit a position change event.
**Validates: Requirements 11.2, 11.5**

### Tabbed Interface Enhancement Properties

**Property 36: Tab navigation delegation**
_For any_ tab interface, calling `focusNextTab` or `focusPreviousTab` should delegate to the underlying roving focus behavior.
**Validates: Requirements 12.3, 12.4**

### Command Palette Enhancement Properties

**Property 37: Command navigation delegation**
_For any_ command palette, calling `selectNext` or `selectPrevious` should delegate to the underlying roving focus behavior.
**Validates: Requirements 13.4, 13.5**

**Property 38: Execute selected command**
_For any_ command palette with a selected command, calling `executeSelected` should execute the command at the current selected index.
**Validates: Requirements 13.6**

## Error Handling

### Keyboard Shortcuts Behavior

**Error Scenarios:**

1. **Invalid Key Combination:** Malformed key combinations (e.g., "Ctrl++K") should be rejected with a clear error message
2. **Duplicate Registration:** Registering the same key combination twice should log a warning and use last-wins strategy
3. **Handler Execution Errors:** Errors thrown in handler functions should be caught and logged without breaking the behavior

**Error Handling Strategy:**

```typescript
try {
  const parsed = parseKeyCombo(keyCombo);
  if (!parsed.isValid) {
    console.error(`Invalid key combination: ${keyCombo}`);
    return;
  }
  // Register shortcut
} catch (error) {
  console.error('Failed to register keyboard shortcut:', error);
}
```

### Undo/Redo Stack Behavior

**Error Scenarios:**

1. **Undo on Empty Past:** Calling `undo` when `past` is empty should be a no-op
2. **Redo on Empty Future:** Calling `redo` when `future` is empty should be a no-op
3. **Invalid State:** Non-serializable states should be rejected with an error
4. **Jump to Invalid Index:** `jumpToState` with out-of-bounds index should be rejected

**Error Handling Strategy:**

```typescript
actions.undo = () => {
  const state = get();
  if (state.past.length === 0) {
    console.warn('Cannot undo: no past states');
    return;
  }
  // Perform undo
};
```

### Drag-and-Drop Behavior

**Error Scenarios:**

1. **Drop on Invalid Target:** Dropping on an unregistered drop zone should be rejected
2. **End Drag Without Start:** Calling `endDrag` when not dragging should be a no-op
3. **Invalid Item ID:** Dragging a non-existent item should log an error

**Error Handling Strategy:**

```typescript
actions.drop = (targetId: string) => {
  const state = get();
  if (!state.dropZones.includes(targetId)) {
    console.error(`Invalid drop target: ${targetId}`);
    return;
  }
  if (!state.isDragging) {
    console.warn('Cannot drop: no active drag operation');
    return;
  }
  // Perform drop
};
```

### Grid Layout Pattern

**Error Scenarios:**

1. **Invalid Breakpoints:** Breakpoints with negative minWidth or columns should be rejected
2. **Navigation Out of Bounds:** Navigation beyond grid boundaries should wrap or stop based on configuration
3. **Empty Items Array:** Operations on empty grid should be handled gracefully

**Error Handling Strategy:**

```typescript
actions.navigateUp = () => {
  const state = get();
  if (state.items.length === 0) {
    console.warn('Cannot navigate: grid is empty');
    return;
  }
  const newIndex = state.focusedIndex - state.columns;
  if (newIndex < 0) {
    // Handle based on wrap configuration
    return;
  }
  // Perform navigation
};
```

## Testing Strategy

### Unit Testing Approach

All new behaviors and patterns will have comprehensive unit tests using Vitest:

**Test Structure:**

```typescript
describe('createKeyboardShortcuts', () => {
  describe('shortcut registration', () => {
    it('should register a valid shortcut', () => {
      // Test basic registration
    });

    it('should normalize platform-specific keys', () => {
      // Test Cmd/Ctrl normalization
    });

    it('should handle duplicate registrations', () => {
      // Test conflict resolution
    });
  });

  describe('shortcut execution', () => {
    it('should execute handler when key combination is pressed', () => {
      // Test handler execution
    });

    it('should respect scope settings', () => {
      // Test global vs scoped
    });
  });
});
```

### Property-Based Testing

We will use **fast-check** (for TypeScript/JavaScript) as the property-based testing library. Each correctness property will be implemented as a property-based test with a minimum of 100 iterations.

**Example Property Test:**

```typescript
import fc from 'fast-check';

describe('Undo/Redo Stack Properties', () => {
  it('Property 9: Undo-redo round trip', () => {
    fc.assert(
      fc.property(
        fc.anything(), // Generate random state
        (state) => {
          const stack = createUndoRedoStack({ initialState: state });

          // Push a new state
          const newState = { ...state, modified: true };
          stack.actions.pushState(newState);

          // Undo then redo
          stack.actions.undo();
          stack.actions.redo();

          // Should return to newState
          expect(stack.getState().present).toEqual(newState);
        },
      ),
      { numRuns: 100 },
    );
  });
});
```

**Property Test Tags:**
Each property-based test will be tagged with a comment referencing the design document:

```typescript
/**
 * Feature: ui-core-gaps, Property 9: Undo-redo round trip
 * Validates: Requirements 2.5, 2.6
 */
it('Property 9: Undo-redo round trip', () => {
  // Test implementation
});
```

### Integration Testing

Framework adapters will be tested with appropriate testing libraries:

**React Testing:**

```typescript
import { renderHook, act } from '@testing-library/react';
import { useKeyboardShortcuts } from '@web-loom/ui-core/react';

describe('useKeyboardShortcuts', () => {
  it('should register and execute shortcuts', () => {
    const handler = vi.fn();
    const { result } = renderHook(() => useKeyboardShortcuts({ scope: 'global' }));

    act(() => {
      result.current.registerShortcut({
        key: 'Ctrl+K',
        handler,
      });
    });

    // Simulate key press
    fireEvent.keyDown(document, { key: 'k', ctrlKey: true });

    expect(handler).toHaveBeenCalledOnce();
  });
});
```

**Vue Testing:**

```typescript
import { mount } from '@vue/test-utils';
import { useKeyboardShortcuts } from '@web-loom/ui-core/vue';

describe('useKeyboardShortcuts composable', () => {
  it('should work in Vue components', async () => {
    const handler = vi.fn();
    const wrapper = mount({
      setup() {
        const shortcuts = useKeyboardShortcuts();
        shortcuts.registerShortcut({ key: 'Ctrl+K', handler });
        return { shortcuts };
      },
      template: '<div></div>',
    });

    // Test shortcut execution
  });
});
```

**Angular Testing:**

```typescript
import { TestBed } from '@angular/core/testing';
import { KeyboardShortcutsService } from '@web-loom/ui-core/angular';

describe('KeyboardShortcutsService', () => {
  let service: KeyboardShortcutsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [KeyboardShortcutsService],
    });
    service = TestBed.inject(KeyboardShortcutsService);
  });

  it('should register shortcuts', () => {
    const handler = jasmine.createSpy('handler');
    service.registerShortcut({ key: 'Ctrl+K', handler });
    // Test execution
  });
});
```

### Test Coverage Goals

- **Unit Tests:** >90% code coverage for all behaviors and patterns
- **Property Tests:** All 38 correctness properties implemented as property-based tests
- **Integration Tests:** All framework adapters tested with appropriate libraries
- **Edge Cases:** Boundary conditions, empty states, error scenarios

### Accessibility Testing

All new patterns will be tested with **axe-core** for WCAG 2.1 Level AA compliance:

```typescript
import { axe } from 'jest-axe';

describe('Grid Layout Accessibility', () => {
  it('should have no accessibility violations', async () => {
    const { container } = render(<GridLayoutExample />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

## Performance Considerations

### Bundle Size Optimization

**Target Sizes (gzipped):**

- Keyboard Shortcuts: <2KB
- Undo/Redo Stack: <2KB
- Drag-and-Drop: <3KB
- Hub & Spoke: <2KB
- Grid Layout: <3KB
- Floating Action Button: <1KB

**Optimization Strategies:**

1. **Tree-shaking:** All exports are ES modules with proper side-effect annotations
2. **Code splitting:** Each behavior is independently importable
3. **Minimal dependencies:** Only `@web-loom/store-core` and `@web-loom/event-bus-core`
4. **No polyfills:** Assumes modern browser environment

### Runtime Performance

**Performance Targets:**

- State updates: <1ms (95th percentile)
- Event handler execution: <1ms
- Keyboard shortcut matching: <0.1ms
- Grid navigation calculation: <0.5ms

**Optimization Techniques:**

1. **Event Delegation:** Single global listener for keyboard shortcuts

```typescript
// Instead of multiple listeners
document.addEventListener('keydown', handler1);
document.addEventListener('keydown', handler2);

// Use single delegated listener
document.addEventListener('keydown', (e) => {
  const combo = normalizeKeyCombo(e);
  const shortcut = shortcuts.get(combo);
  if (shortcut) shortcut.handler();
});
```

2. **Memoization:** Cache expensive calculations

```typescript
const memoizedBreakpoint = useMemo(() => {
  return calculateBreakpoint(viewportWidth, breakpoints);
}, [viewportWidth, breakpoints]);
```

3. **Structural Sharing:** Minimize memory allocations in undo/redo

```typescript
// Reuse unchanged parts of state
const newState = {
  ...oldState,
  modifiedField: newValue,
};
```

4. **Throttling:** Limit high-frequency events

```typescript
// Throttle scroll events in view layer before passing to FAB
const throttledScroll = throttle((position) => {
  fab.actions.setScrollPosition(position);
}, 100);
```

## Accessibility Guidelines

### Keyboard Shortcuts Behavior

**ARIA Considerations:**

- Provide visual indicators for active shortcuts
- Announce shortcut execution to screen readers
- Support standard keyboard shortcuts (Ctrl+C, Ctrl+V, etc.)

**Recommended Implementation:**

```typescript
// Announce shortcut execution
const announceShortcut = (description: string) => {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', 'polite');
  announcement.textContent = `Executed: ${description}`;
  document.body.appendChild(announcement);
  setTimeout(() => announcement.remove(), 1000);
};
```

### Drag-and-Drop Behavior

**Keyboard Alternative:**

- Space to pick up item
- Arrow keys to move
- Space to drop
- Escape to cancel

**ARIA Attributes:**

```html
<div role="button" aria-grabbed="true" aria-dropeffect="move" tabindex="0">Draggable Item</div>
```

**Recommended Implementation:**

```typescript
// Keyboard-based drag-and-drop
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === ' ' && !isDragging) {
    startDrag(itemId);
    announceToScreenReader('Item picked up. Use arrow keys to move.');
  } else if (e.key === ' ' && isDragging) {
    drop(currentDropTarget);
    announceToScreenReader('Item dropped.');
  } else if (e.key === 'Escape' && isDragging) {
    endDrag();
    announceToScreenReader('Drag cancelled.');
  }
};
```

### Grid Layout Pattern

**ARIA Grid Role:**

```html
<div role="grid" aria-label="Photo Gallery">
  <div role="row">
    <div role="gridcell" tabindex="0">Item 1</div>
    <div role="gridcell" tabindex="-1">Item 2</div>
  </div>
</div>
```

**Focus Management:**

- Only one gridcell should have `tabindex="0"` at a time
- Arrow keys navigate between cells
- Announce row and column position on focus

**Recommended Implementation:**

```typescript
// Announce grid position
const announcePosition = (index: number, columns: number, total: number) => {
  const row = Math.floor(index / columns) + 1;
  const col = (index % columns) + 1;
  const totalRows = Math.ceil(total / columns);
  announceToScreenReader(`Row ${row} of ${totalRows}, Column ${col} of ${columns}`);
};
```

### Hub & Spoke Navigation

**ARIA Landmarks:**

```html
<nav aria-label="Main Navigation">
  <ul role="list">
    <li><a href="#hub" aria-current="page">Hub</a></li>
    <li><a href="#spoke1">Spoke 1</a></li>
  </ul>
</nav>
```

**Breadcrumb Navigation:**

```html
<nav aria-label="Breadcrumb">
  <ol>
    <li><a href="#hub">Home</a></li>
    <li aria-current="page">Current Spoke</li>
  </ol>
</nav>
```

### Floating Action Button

**ARIA Button:**

```html
<button aria-label="Create New Item" aria-hidden="false">
  <span aria-hidden="true">+</span>
</button>
```

**Visibility Announcements:**

```typescript
// Announce FAB visibility changes
fab.subscribe((state) => {
  if (state.isVisible) {
    announceToScreenReader('Primary action button available');
  }
});
```

## Migration Guide

### For Existing UI Core Users

**No Breaking Changes:**
All existing behaviors remain unchanged. New behaviors are additive.

**Adopting New Behaviors:**

```typescript
// Before: Manual keyboard shortcut handling
useEffect(() => {
  const handler = (e: KeyboardEvent) => {
    if (e.ctrlKey && e.key === 'k') {
      openCommandPalette();
    }
  };
  document.addEventListener('keydown', handler);
  return () => document.removeEventListener('keydown', handler);
}, []);

// After: Using Keyboard Shortcuts behavior
const shortcuts = useKeyboardShortcuts();
useEffect(() => {
  shortcuts.registerShortcut({
    key: 'Ctrl+K',
    handler: openCommandPalette,
    description: 'Open command palette',
  });
}, []);
```

### For Existing UI Patterns Users

**Modal Pattern Enhancement:**

```typescript
// Before: Manual escape key handling
const modal = createModal();
useEffect(() => {
  const handler = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      modal.actions.closeTopModal();
    }
  };
  document.addEventListener('keydown', handler);
  return () => document.removeEventListener('keydown', handler);
}, []);

// After: Built-in escape handling
const modal = createModal();
modal.actions.openModal({
  id: 'settings',
  content: settingsData,
  closeOnEscape: true,
  closeOnBackdropClick: true,
});
```

**Sidebar Shell Enhancement:**

```typescript
// Before: Manual mobile detection
const sidebar = createSidebarShell();
useEffect(() => {
  const checkMobile = () => {
    if (window.innerWidth < 768) {
      sidebar.actions.collapse();
    }
  };
  window.addEventListener('resize', checkMobile);
  return () => window.removeEventListener('resize', checkMobile);
}, []);

// After: Built-in mobile mode
const sidebar = createSidebarShell();
useEffect(() => {
  const updateMobile = () => {
    sidebar.actions.setMobileMode(window.innerWidth < 768);
  };
  window.addEventListener('resize', updateMobile);
  return () => window.removeEventListener('resize', updateMobile);
}, []);
```

## Documentation Requirements

### API Documentation

All new behaviors and patterns will have comprehensive API documentation:

**Structure:**

1. **Overview:** Purpose and use cases
2. **Installation:** Import statements
3. **Basic Usage:** Simple example
4. **API Reference:** Complete interface documentation
5. **Advanced Usage:** Complex scenarios
6. **Accessibility:** ARIA guidelines
7. **Performance:** Best practices
8. **Examples:** Real-world implementations

**Example Documentation Template:**

````markdown
# Keyboard Shortcuts Behavior

## Overview

The Keyboard Shortcuts behavior manages keyboard shortcut registration...

## Installation

```typescript
import { createKeyboardShortcuts } from '@web-loom/ui-core';
```
````

## Basic Usage

```typescript
const shortcuts = createKeyboardShortcuts();
shortcuts.actions.registerShortcut({
  key: 'Ctrl+K',
  handler: () => console.log('Shortcut executed!'),
});
```

## API Reference

### createKeyboardShortcuts(options?)

...

```

### Integration Examples

The `apps/ui-patterns-playground` will include interactive examples for all new features:

1. **Text Editor with Undo/Redo:** Demonstrates undo/redo stack
2. **Command Palette:** Demonstrates keyboard shortcuts + command palette
3. **Kanban Board:** Demonstrates drag-and-drop
4. **Photo Gallery:** Demonstrates grid layout
5. **Settings Interface:** Demonstrates hub-and-spoke navigation
6. **Scroll-Aware FAB:** Demonstrates floating action button

Each example will include:
- Live demo
- Source code
- Explanation of key concepts
- Accessibility notes

## Implementation Phases

### Phase 1: Core Behaviors (Week 1-2)

**Week 1:**
- Implement Keyboard Shortcuts behavior
- Write unit tests and property tests
- Create React/Vue/Angular adapters
- Update documentation

**Week 2:**
- Implement Undo/Redo Stack behavior
- Implement Drag-and-Drop behavior
- Write tests for both behaviors
- Create framework adapters

**Deliverable:** Three new core behaviors with full test coverage and framework support

### Phase 2: Macro Patterns (Week 3-4)

**Week 3:**
- Implement Hub & Spoke Navigation pattern
- Implement Grid/Card Layout pattern
- Write tests for both patterns

**Week 4:**
- Implement Floating Action Button pattern
- Implement all pattern enhancements (Modal, Sidebar, Toast, etc.)
- Write tests for enhancements

**Deliverable:** Three new patterns and six enhanced patterns with full test coverage

### Phase 3: Documentation & Examples (Week 5)

- Update all README files with correct API names
- Write comprehensive API documentation
- Create integration examples in playground
- Write migration guide
- Conduct accessibility audit

**Deliverable:** Complete documentation and interactive examples

### Phase 4: Testing & Optimization (Week 6)

- Achieve >90% code coverage
- Run property-based tests (100+ iterations each)
- Bundle size analysis and optimization
- Performance profiling and optimization
- Cross-browser testing

**Deliverable:** Production-ready implementation with verified performance and bundle size

## Success Criteria

### Technical Metrics

- ✅ All 38 correctness properties implemented as property-based tests
- ✅ >90% code coverage for all new code
- ✅ All behaviors <2KB gzipped (except Drag-Drop <3KB, Grid Layout <3KB)
- ✅ State updates <1ms (95th percentile)
- ✅ Zero critical accessibility violations (axe-core)
- ✅ All tests passing in Chrome, Firefox, Safari, Edge

### Documentation Metrics

- ✅ API documentation for all new features
- ✅ 6+ integration examples in playground
- ✅ Migration guide for existing users
- ✅ Accessibility guidelines for all patterns
- ✅ Performance best practices documented

### Developer Experience Metrics

- ✅ Consistent API patterns with existing behaviors
- ✅ Type-safe interfaces with full TypeScript support
- ✅ Framework adapters for React, Vue, Angular
- ✅ Clear error messages for common mistakes
- ✅ Comprehensive JSDoc comments

## Conclusion

This design provides a comprehensive technical approach for closing the gaps in the UI Core and Patterns packages. By following Web Loom's established architectural patterns and maintaining consistency with existing implementations, we ensure that the new features integrate seamlessly while providing significant value to developers building modern web applications.

The focus on correctness properties and property-based testing ensures that the implementations are robust and reliable. The emphasis on accessibility, performance, and developer experience aligns with Web Loom's core values and will result in production-ready packages that developers can confidently use in their applications.
```
