# Requirements Document: UI Core & Patterns Gap Closure

## Introduction

This document defines the requirements for closing the identified gaps in the Web Loom UI Core and UI Patterns packages. Based on the Gap Analysis Report dated November 26, 2025, this spec addresses the missing core behaviors, pattern enhancements, and documentation improvements needed to achieve 100% PRD compliance. The focus is on implementing the three missing core behaviors (Keyboard Shortcuts, Undo/Redo Stack, Drag-and-Drop), three missing macro patterns (Hub & Spoke Navigation, Grid/Card Layout, Floating Action Button), and critical enhancements to existing implementations.

## Glossary

- **Keyboard Shortcuts Behavior**: A core behavior that manages keyboard shortcut registration, event matching, and execution with support for key combinations and scoped listeners
- **Undo/Redo Stack**: A core behavior that maintains an immutable history of states with undo and redo operations
- **Drag-and-Drop Behavior**: A core behavior that manages drag-and-drop interaction state including drag source, drop target, and reordering logic
- **Hub & Spoke Navigation**: A macro pattern where a central hub page serves as the entry point to independent spoke pages
- **Grid/Card Layout Pattern**: A macro pattern that manages responsive grid layouts with keyboard navigation and selection
- **Floating Action Button (FAB)**: A macro pattern that manages visibility and behavior of a primary action button based on scroll position
- **Key Combination**: A keyboard input consisting of modifier keys (Ctrl, Shift, Alt, Meta/Cmd) and a primary key (e.g., "Ctrl+K", "Cmd+Shift+P")
- **Focus Scope**: The boundary within which keyboard shortcuts are active (global or scoped to a specific component)
- **State History**: An immutable sequence of application states that enables time-travel debugging and undo/redo functionality
- **Drop Zone**: A designated area where dragged items can be dropped
- **Spoke**: An independent page or section accessible from a central hub in hub-and-spoke navigation

## Requirements

### Requirement 1: Keyboard Shortcuts Behavior Implementation

**User Story:** As a frontend developer, I want a keyboard shortcuts behavior that handles key combinations and scoped listeners, so that I can implement keyboard-driven interfaces like command palettes and productivity tools.

#### Acceptance Criteria

1. THE UI Core Package SHALL provide a `createKeyboardShortcuts` function that manages keyboard shortcut registration and execution
2. THE Keyboard Shortcuts Behavior SHALL maintain state including `shortcuts` (map of key combinations to handlers), `scope` (global or scoped), and `activeShortcuts` (array of currently registered shortcuts)
3. THE Keyboard Shortcuts Behavior SHALL support key combinations including modifier keys (Ctrl, Shift, Alt, Meta/Cmd) and primary keys (e.g., "Ctrl+K", "Cmd+Shift+P", "Alt+F4")
4. THE Keyboard Shortcuts Behavior SHALL normalize key combinations to handle platform differences (Cmd on macOS, Ctrl on Windows/Linux)
5. THE Keyboard Shortcuts Behavior SHALL provide actions for `registerShortcut`, `unregisterShortcut`, `setScope`, and `clearAllShortcuts`
6. WHEN a registered key combination is pressed, THE Keyboard Shortcuts Behavior SHALL execute the associated handler function
7. WHEN `preventDefault` is enabled for a shortcut, THE Keyboard Shortcuts Behavior SHALL call `event.preventDefault()` to prevent default browser behavior
8. THE Keyboard Shortcuts Behavior SHALL support both global shortcuts (active anywhere) and scoped shortcuts (active only within a specific component)
9. THE Keyboard Shortcuts Behavior SHALL provide an optional `description` field for each shortcut to support help documentation
10. THE Keyboard Shortcuts Behavior SHALL handle conflicts by allowing the most recently registered shortcut to take precedence

### Requirement 2: Undo/Redo Stack Behavior Implementation

**User Story:** As a frontend developer, I want an undo/redo stack behavior, so that I can implement undo/redo functionality in editors, forms, and drawing applications.

#### Acceptance Criteria

1. THE UI Core Package SHALL provide a `createUndoRedoStack` function that manages an immutable history of states
2. THE Undo/Redo Stack Behavior SHALL maintain state including `past` (array of previous states), `present` (current state), `future` (array of future states), `canUndo` (boolean), and `canRedo` (boolean)
3. THE Undo/Redo Stack Behavior SHALL provide actions for `undo`, `redo`, `pushState`, `clearHistory`, and `jumpToState`
4. WHEN `pushState` is called, THE Undo/Redo Stack Behavior SHALL add the current state to the `past` array, set the new state as `present`, and clear the `future` array
5. WHEN `undo` is called, THE Undo/Redo Stack Behavior SHALL move the current state to `future`, pop the most recent state from `past`, and set it as `present`
6. WHEN `redo` is called, THE Undo/Redo Stack Behavior SHALL move the current state to `past`, pop the most recent state from `future`, and set it as `present`
7. THE Undo/Redo Stack Behavior SHALL support a configurable `maxLength` option to limit the size of the history
8. WHEN the history exceeds `maxLength`, THE Undo/Redo Stack Behavior SHALL remove the oldest state from the `past` array
9. THE Undo/Redo Stack Behavior SHALL support serializable states for persistence and time-travel debugging
10. THE Undo/Redo Stack Behavior SHALL provide an optional `onStateChange` callback that is invoked whenever the present state changes

### Requirement 3: Drag-and-Drop Behavior Implementation

**User Story:** As a frontend developer, I want a drag-and-drop behavior that manages drag state and drop logic, so that I can implement reorderable lists, kanban boards, and file upload interfaces.

#### Acceptance Criteria

1. THE UI Core Package SHALL provide a `createDragDropBehavior` function that manages drag-and-drop interaction state
2. THE Drag-and-Drop Behavior SHALL maintain state including `draggedItem` (identifier or null), `dropTarget` (identifier or null), `isDragging` (boolean), `dragData` (any), and `dropZones` (array of identifiers)
3. THE Drag-and-Drop Behavior SHALL provide actions for `startDrag`, `endDrag`, `setDropTarget`, `drop`, `registerDropZone`, and `unregisterDropZone`
4. WHEN `startDrag` is called, THE Drag-and-Drop Behavior SHALL set `isDragging` to true, store the dragged item identifier, and invoke an optional `onDragStart` callback
5. WHEN `endDrag` is called, THE Drag-and-Drop Behavior SHALL set `isDragging` to false, clear the dragged item, and invoke an optional `onDragEnd` callback
6. WHEN `drop` is called with a valid drop target, THE Drag-and-Drop Behavior SHALL invoke an `onDrop` callback with the dragged item and drop target
7. THE Drag-and-Drop Behavior SHALL support reordering logic where dropping an item on another item swaps their positions or inserts at a specific index
8. THE Drag-and-Drop Behavior SHALL support drag data (payload) that can be transferred from drag source to drop target
9. THE Drag-and-Drop Behavior SHALL validate drop targets and only allow drops on registered drop zones
10. THE Drag-and-Drop Behavior SHALL provide accessibility support by exposing keyboard-based alternatives for drag-and-drop operations

### Requirement 4: Hub & Spoke Navigation Pattern Implementation

**User Story:** As a frontend developer, I want a hub-and-spoke navigation pattern, so that I can build interfaces where users navigate from a central hub to independent spoke pages.

#### Acceptance Criteria

1. THE UI Patterns Package SHALL provide a `createHubAndSpoke` function that manages hub-and-spoke navigation state
2. THE Hub & Spoke Pattern SHALL maintain state including `isOnHub` (boolean), `activeSpoke` (identifier or null), `spokes` (array of spoke definitions), and `breadcrumbs` (array of navigation history)
3. THE Hub & Spoke Pattern SHALL provide actions for `activateSpoke`, `returnToHub`, `goBack`, and `updateBreadcrumbs`
4. WHEN `activateSpoke` is called, THE Hub & Spoke Pattern SHALL set `isOnHub` to false, set the `activeSpoke`, and add the spoke to the breadcrumbs
5. WHEN `returnToHub` is called, THE Hub & Spoke Pattern SHALL set `isOnHub` to true, clear the `activeSpoke`, and reset the breadcrumbs
6. THE Hub & Spoke Pattern SHALL emit events for `spoke:activated` and `hub:returned` using `@web-loom/event-bus-core`
7. THE Hub & Spoke Pattern SHALL support optional nested spokes where a spoke can have its own sub-spokes
8. THE Hub & Spoke Pattern SHALL provide an optional `onSpokeActivate` callback that is invoked when a spoke is activated
9. THE Hub & Spoke Pattern SHALL maintain navigation history to support back navigation
10. THE Hub & Spoke Pattern SHALL integrate with browser history API for URL-based navigation (optional)

### Requirement 5: Grid/Card Layout Pattern Implementation

**User Story:** As a frontend developer, I want a grid/card layout pattern with keyboard navigation, so that I can build responsive galleries, dashboards, and product grids with accessibility support.

#### Acceptance Criteria

1. THE UI Patterns Package SHALL provide a `createGridLayout` function that manages responsive grid layout state and keyboard navigation
2. THE Grid Layout Pattern SHALL maintain state including `items` (array), `columns` (number), `selectedItems` (array of identifiers), `focusedIndex` (number), and `breakpoint` (current breakpoint)
3. THE Grid Layout Pattern SHALL use `createListSelection` from UI Core for selection management
4. THE Grid Layout Pattern SHALL support responsive breakpoints that define the number of columns based on viewport width
5. WHEN the viewport width changes, THE Grid Layout Pattern SHALL recalculate the number of columns based on the active breakpoint
6. THE Grid Layout Pattern SHALL provide actions for `selectItem`, `navigateUp`, `navigateDown`, `navigateLeft`, `navigateRight`, `setBreakpoints`, and `updateViewportWidth`
7. WHEN `navigateUp` is called, THE Grid Layout Pattern SHALL move focus to the item in the row above (focusedIndex - columns)
8. WHEN `navigateDown` is called, THE Grid Layout Pattern SHALL move focus to the item in the row below (focusedIndex + columns)
9. WHEN `navigateLeft` is called, THE Grid Layout Pattern SHALL move focus to the previous item (focusedIndex - 1) with wrapping support
10. WHEN `navigateRight` is called, THE Grid Layout Pattern SHALL move focus to the next item (focusedIndex + 1) with wrapping support
11. THE Grid Layout Pattern SHALL support single and multi-selection modes
12. THE Grid Layout Pattern SHALL emit events for `item:focused`, `item:selected`, and `breakpoint:changed` using `@web-loom/event-bus-core`

### Requirement 6: Floating Action Button Pattern Implementation

**User Story:** As a frontend developer, I want a floating action button pattern that responds to scroll behavior, so that I can implement scroll-aware primary action buttons.

#### Acceptance Criteria

1. THE UI Patterns Package SHALL provide a `createFloatingActionButton` function that manages FAB visibility based on scroll position
2. THE FAB Pattern SHALL maintain state including `isVisible` (boolean), `scrollPosition` (number), `scrollDirection` (up, down, or null), and `scrollThreshold` (number)
3. THE FAB Pattern SHALL provide actions for `show`, `hide`, `setScrollPosition`, `setScrollThreshold`, and `toggle`
4. WHEN `setScrollPosition` is called, THE FAB Pattern SHALL update the scroll position and calculate the scroll direction
5. WHEN the scroll position exceeds the `scrollThreshold`, THE FAB Pattern SHALL set `isVisible` to true
6. WHEN the scroll position is below the `scrollThreshold`, THE FAB Pattern SHALL set `isVisible` to false
7. WHEN `hideOnScrollDown` is enabled and the user scrolls down, THE FAB Pattern SHALL hide the FAB
8. WHEN `hideOnScrollDown` is enabled and the user scrolls up, THE FAB Pattern SHALL show the FAB
9. THE FAB Pattern SHALL provide an optional `onVisibilityChange` callback that is invoked when visibility changes
10. THE FAB Pattern SHALL emit events for `fab:shown` and `fab:hidden` using `@web-loom/event-bus-core`

### Requirement 7: Modal Pattern Enhancements

**User Story:** As a frontend developer, I want modal configuration options for escape key and backdrop click behavior, so that I can control how modals are dismissed.

#### Acceptance Criteria

1. THE Modal Pattern SHALL support a `closeOnEscape` option that, when enabled, closes the modal when the Escape key is pressed
2. THE Modal Pattern SHALL support a `closeOnBackdropClick` option that, when enabled, closes the modal when the backdrop is clicked
3. WHEN `closeOnEscape` is true and the Escape key is pressed, THE Modal Pattern SHALL close the top modal in the stack
4. WHEN `closeOnBackdropClick` is true and the backdrop is clicked, THE Modal Pattern SHALL close the modal
5. THE Modal Pattern SHALL provide an `openModal` action that accepts a configuration object including `id`, `content`, `priority`, `closeOnEscape`, and `closeOnBackdropClick`
6. THE Modal Pattern SHALL maintain these configuration options in the modal stack state
7. THE Modal Pattern SHALL emit events for `modal:escape-pressed` and `modal:backdrop-clicked` using `@web-loom/event-bus-core`

### Requirement 8: Roving Focus Behavior Enhancements

**User Story:** As a frontend developer, I want a callback for focus changes in roving focus behavior, so that I can respond to focus changes and update UI accordingly.

#### Acceptance Criteria

1. THE Roving Focus Behavior SHALL support an optional `onFocusChange` callback that is invoked when the focused index changes
2. WHEN the focused index changes, THE Roving Focus Behavior SHALL invoke the `onFocusChange` callback with the new index and the item identifier
3. THE `onFocusChange` callback SHALL receive parameters including `index` (number), `itemId` (string), and `previousIndex` (number)

### Requirement 9: Form Behavior Enhancements

**User Story:** As a frontend developer, I want to manually set field errors in form behavior, so that I can display server-side validation errors.

#### Acceptance Criteria

1. THE Form Behavior SHALL provide a `setFieldError` action that allows manually setting an error message for a specific field
2. WHEN `setFieldError` is called, THE Form Behavior SHALL update the field's error state without triggering validation
3. THE `setFieldError` action SHALL accept parameters including `field` (field name) and `error` (error message or null)
4. THE Form Behavior SHALL merge manually set errors with validation errors

### Requirement 10: Sidebar Shell Pattern Enhancements

**User Story:** As a frontend developer, I want mobile-specific behavior for sidebar shell, so that I can build responsive layouts that work well on mobile devices.

#### Acceptance Criteria

1. THE Sidebar Shell Pattern SHALL support a `toggleMobile` action that toggles the sidebar for mobile viewports
2. THE Sidebar Shell Pattern SHALL maintain state including `isMobile` (boolean) that indicates whether the sidebar is in mobile mode
3. WHEN `isMobile` is true, THE Sidebar Shell Pattern SHALL automatically collapse the sidebar when a section is selected
4. THE Sidebar Shell Pattern SHALL provide a `setMobileMode` action that sets the mobile mode based on viewport width
5. THE Sidebar Shell Pattern SHALL emit events for `sidebar:mobile-toggled` using `@web-loom/event-bus-core`

### Requirement 11: Toast Queue Pattern Enhancements

**User Story:** As a frontend developer, I want to configure toast position, so that I can display toasts in different screen locations (top-right, bottom-left, etc.).

#### Acceptance Criteria

1. THE Toast Queue Pattern SHALL support a `position` option that specifies where toasts appear on the screen
2. THE Toast Queue Pattern SHALL support position values including `top-left`, `top-center`, `top-right`, `bottom-left`, `bottom-center`, and `bottom-right`
3. THE Toast Queue Pattern SHALL maintain the `position` in state
4. THE Toast Queue Pattern SHALL provide a `setPosition` action that updates the toast position
5. THE Toast Queue Pattern SHALL emit events for `toast:position-changed` using `@web-loom/event-bus-core`

### Requirement 12: Tabbed Interface Pattern Enhancements

**User Story:** As a frontend developer, I want convenience methods for tab navigation, so that I can easily navigate between tabs programmatically.

#### Acceptance Criteria

1. THE Tabbed Interface Pattern SHALL provide a `focusNextTab` action that moves focus to the next tab
2. THE Tabbed Interface Pattern SHALL provide a `focusPreviousTab` action that moves focus to the previous tab
3. WHEN `focusNextTab` is called, THE Tabbed Interface Pattern SHALL delegate to the underlying roving focus behavior's `moveNext` action
4. WHEN `focusPreviousTab` is called, THE Tabbed Interface Pattern SHALL delegate to the underlying roving focus behavior's `movePrevious` action

### Requirement 13: Command Palette Pattern Enhancements

**User Story:** As a frontend developer, I want convenience methods for command palette navigation, so that I can easily navigate and execute commands programmatically.

#### Acceptance Criteria

1. THE Command Palette Pattern SHALL provide a `selectNext` action that moves selection to the next filtered command
2. THE Command Palette Pattern SHALL provide a `selectPrevious` action that moves selection to the previous filtered command
3. THE Command Palette Pattern SHALL provide an `executeSelected` action that executes the currently selected command
4. WHEN `selectNext` is called, THE Command Palette Pattern SHALL delegate to the underlying roving focus behavior's `moveNext` action
5. WHEN `selectPrevious` is called, THE Command Palette Pattern SHALL delegate to the underlying roving focus behavior's `movePrevious` action
6. WHEN `executeSelected` is called, THE Command Palette Pattern SHALL execute the command at the current selected index

### Requirement 14: Framework Adapters for New Behaviors

**User Story:** As a framework developer, I want React, Vue, and Angular adapters for all new behaviors, so that I can use them idiomatically in my framework of choice.

#### Acceptance Criteria

1. THE UI Core Package SHALL provide a `useKeyboardShortcuts` React hook that creates and manages a keyboard shortcuts behavior instance
2. THE UI Core Package SHALL provide a `useUndoRedoStack` React hook that creates and manages an undo/redo stack behavior instance
3. THE UI Core Package SHALL provide a `useDragDropBehavior` React hook that creates and manages a drag-and-drop behavior instance
4. THE UI Core Package SHALL provide Vue composables for `useKeyboardShortcuts`, `useUndoRedoStack`, and `useDragDropBehavior`
5. THE UI Core Package SHALL provide Angular services for `KeyboardShortcutsService`, `UndoRedoStackService`, and `DragDropBehaviorService`
6. THE Framework Adapters SHALL follow the same patterns as existing adapters (lifecycle management, state synchronization, cleanup)

### Requirement 15: Comprehensive Testing for New Features

**User Story:** As a package maintainer, I want comprehensive test coverage for all new behaviors and patterns, so that I can ensure reliability and catch regressions.

#### Acceptance Criteria

1. THE System SHALL provide unit tests for `createKeyboardShortcuts` covering key combination parsing, shortcut registration, and execution
2. THE System SHALL provide unit tests for `createUndoRedoStack` covering undo, redo, state pushing, and history limits
3. THE System SHALL provide unit tests for `createDragDropBehavior` covering drag start, drag end, drop, and reordering logic
4. THE System SHALL provide unit tests for `createHubAndSpoke` covering spoke activation, hub return, and breadcrumb management
5. THE System SHALL provide unit tests for `createGridLayout` covering keyboard navigation, selection, and responsive breakpoints
6. THE System SHALL provide unit tests for `createFloatingActionButton` covering scroll detection, visibility changes, and threshold logic
7. THE System SHALL provide unit tests for all pattern enhancements (modal, sidebar, toast, tabbed interface, command palette)
8. THE System SHALL provide integration tests for framework adapters (React, Vue, Angular) for all new behaviors
9. THE System SHALL achieve greater than 90% code coverage for all new behaviors and patterns
10. THE System SHALL test edge cases including empty states, boundary conditions, and error scenarios

### Requirement 16: Documentation Updates

**User Story:** As a developer using the UI Core and Patterns packages, I want accurate and comprehensive documentation, so that I can understand and use the APIs correctly.

#### Acceptance Criteria

1. THE UI Core Package README SHALL be updated to match actual API names (e.g., `toggleSelection` instead of `toggleSelect`, `moveNext` instead of `focusNext`)
2. THE UI Patterns Package README SHALL be updated to match actual API names (e.g., `activateTab` instead of `setActiveTab`, `maxVisible` instead of `maxToasts`)
3. THE Documentation SHALL include API reference for all new behaviors (Keyboard Shortcuts, Undo/Redo Stack, Drag-and-Drop)
4. THE Documentation SHALL include API reference for all new patterns (Hub & Spoke, Grid/Card Layout, Floating Action Button)
5. THE Documentation SHALL include usage examples for all new behaviors and patterns in React, Vue, and Angular
6. THE Documentation SHALL include migration guides for any breaking changes
7. THE Documentation SHALL include accessibility guidelines for all new behaviors and patterns
8. THE Documentation SHALL include performance considerations and best practices
9. THE Documentation SHALL be updated to reflect all enhancements to existing patterns (modal, sidebar, toast, tabbed interface, command palette)
10. THE Documentation SHALL include a comprehensive changelog documenting all additions and changes

### Requirement 17: Bundle Size Validation for New Features

**User Story:** As a frontend developer, I want new features to maintain minimal bundle size, so that my application remains performant.

#### Acceptance Criteria

1. WHEN gzipped, THE Keyboard Shortcuts Behavior SHALL be less than 2 kilobytes
2. WHEN gzipped, THE Undo/Redo Stack Behavior SHALL be less than 2 kilobytes
3. WHEN gzipped, THE Drag-and-Drop Behavior SHALL be less than 3 kilobytes (slightly larger due to complexity)
4. WHEN gzipped, THE Hub & Spoke Pattern SHALL be less than 2 kilobytes
5. WHEN gzipped, THE Grid/Card Layout Pattern SHALL be less than 3 kilobytes
6. WHEN gzipped, THE Floating Action Button Pattern SHALL be less than 1 kilobyte
7. THE System SHALL continue to support tree-shaking for all new behaviors and patterns
8. THE System SHALL provide bundle size analysis reports for all new features

### Requirement 18: Accessibility Compliance for New Features

**User Story:** As an accessibility-conscious developer, I want all new behaviors and patterns to meet WCAG 2.1 Level AA standards, so that my applications are accessible to all users.

#### Acceptance Criteria

1. THE Keyboard Shortcuts Behavior SHALL provide keyboard-only access to all functionality
2. THE Drag-and-Drop Behavior SHALL provide keyboard alternatives for drag-and-drop operations (e.g., arrow keys + space to pick up/drop)
3. THE Grid/Card Layout Pattern SHALL support keyboard navigation with arrow keys
4. THE Hub & Spoke Pattern SHALL support keyboard navigation and announce navigation changes to screen readers
5. THE Floating Action Button Pattern SHALL be keyboard accessible and announce visibility changes
6. THE Documentation SHALL include ARIA attribute recommendations for all new patterns
7. THE System SHALL pass automated accessibility tests using axe-core for all new features
8. THE System SHALL provide examples of proper ARIA labeling and announcements for all new patterns

### Requirement 19: Integration Examples

**User Story:** As a developer learning the UI Core and Patterns packages, I want comprehensive integration examples, so that I can understand how to use the new features in real-world scenarios.

#### Acceptance Criteria

1. THE Documentation SHALL include an example of building a text editor with undo/redo using `createUndoRedoStack`
2. THE Documentation SHALL include an example of building a command palette with keyboard shortcuts using `createKeyboardShortcuts` and `createCommandPalette`
3. THE Documentation SHALL include an example of building a kanban board with drag-and-drop using `createDragDropBehavior`
4. THE Documentation SHALL include an example of building a photo gallery with grid layout using `createGridLayout`
5. THE Documentation SHALL include an example of building a settings interface with hub-and-spoke navigation using `createHubAndSpoke`
6. THE Documentation SHALL include an example of building a scroll-aware action button using `createFloatingActionButton`
7. THE Examples SHALL demonstrate integration with existing Web Loom packages (`@web-loom/mvvm-core`, `@web-loom/query-core`)
8. THE Examples SHALL be available in the `apps/ui-patterns-playground` application

### Requirement 20: Performance Optimization

**User Story:** As a performance-conscious developer, I want all new behaviors and patterns to be optimized for performance, so that they don't negatively impact my application's responsiveness.

#### Acceptance Criteria

1. THE Keyboard Shortcuts Behavior SHALL use efficient event delegation to minimize event listener overhead
2. THE Undo/Redo Stack Behavior SHALL use structural sharing for immutable state to minimize memory usage
3. THE Drag-and-Drop Behavior SHALL throttle or debounce drag events to prevent excessive state updates
4. THE Grid/Card Layout Pattern SHALL use efficient algorithms for keyboard navigation calculations
5. THE Floating Action Button Pattern SHALL throttle scroll event handling to prevent performance degradation
6. THE System SHALL provide performance benchmarks for all new behaviors and patterns
7. THE System SHALL ensure state updates complete in less than 1 millisecond in the 95th percentile
8. THE System SHALL provide guidance on performance best practices in the documentation
