# Requirements Document

## Introduction

This document defines the requirements for the Web Loom UI Core and UI Patterns packages. These packages provide a universal headless behavior layer for modern frontend development, offering framework-agnostic UI interaction logic that integrates seamlessly with the existing Web Loom ecosystem. The UI Core package provides atomic interaction behaviors, while the UI Patterns package composes these behaviors into higher-level UI patterns.

## Glossary

- **UI Core Package**: `@web-loom/ui-core` - A framework-agnostic package providing atomic UI interaction behaviors (dialogs, forms, tabs, selection models, etc.)
- **UI Patterns Package**: `@web-loom/ui-patterns` - A package providing composed macro UI patterns (master-detail, wizard, sidebar shell, etc.) built on UI Core behaviors
- **Behavior**: A pure logic module that manages state and events for a specific UI interaction pattern without any rendering or DOM manipulation
- **Store Core**: `@web-loom/store-core` - The existing Web Loom state management package used as the foundation for all behavior state
- **Event Bus Core**: `@web-loom/event-bus-core` - The existing Web Loom event communication package used for cross-behavior messaging
- **Framework Adapter**: A thin wrapper that connects framework-agnostic behaviors to specific UI frameworks (React, Vue, Angular)
- **Headless**: A design approach where logic is separated from presentation, with no assumptions about DOM structure or styling
- **State Machine**: A deterministic model that defines states, transitions, and events for a behavior
- **MVVM Core**: `@web-loom/mvvm-core` - The existing Web Loom MVVM pattern package for optional integration
- **Roving Focus**: A keyboard navigation pattern where focus moves through a list of items using arrow keys
- **Focus Trap**: A pattern that constrains keyboard focus within a specific UI element (e.g., modal dialog)

## Requirements

### Requirement 1: Package Infrastructure Setup

**User Story:** As a Web Loom developer, I want the UI Core and UI Patterns packages to follow established Web Loom conventions, so that they integrate seamlessly with the existing monorepo structure.

#### Acceptance Criteria

1. THE System SHALL create a `packages/ui-core` directory with standard Web Loom package structure including `src`, `dist`, `package.json`, `tsconfig.json`, `vite.config.ts`, and `vitest.config.js` files
2. THE System SHALL create a `packages/ui-patterns` directory with standard Web Loom package structure including `src`, `dist`, `package.json`, `tsconfig.json`, `vite.config.ts`, and `vitest.config.js` files
3. THE System SHALL configure `@web-loom/ui-core` to depend on `@web-loom/store-core@0.0.4` and `@web-loom/event-bus-core@0.0.2`
4. THE System SHALL configure `@web-loom/ui-patterns` to depend on `@web-loom/ui-core`, `@web-loom/store-core@0.0.4`, and `@web-loom/event-bus-core@0.0.2`
5. THE System SHALL add both packages to the Turborepo pipeline configuration in `turbo.json`

### Requirement 2: Dialog Behavior Implementation

**User Story:** As a frontend developer, I want a framework-agnostic dialog behavior, so that I can implement modal dialogs consistently across different UI frameworks.

#### Acceptance Criteria

1. THE UI Core Package SHALL provide a `createDialogBehavior` function that returns a behavior object with `getState`, `subscribe`, `actions`, and `destroy` methods
2. THE Dialog Behavior SHALL maintain state including `isOpen` (boolean), `content` (any), and `id` (string or null) properties
3. THE Dialog Behavior SHALL provide `open`, `close`, and `toggle` actions that update the dialog state
4. THE Dialog Behavior SHALL invoke optional `onOpen` and `onClose` callbacks when the dialog state changes
5. THE Dialog Behavior SHALL use `@web-loom/store-core` for state management with no external state library dependencies

### Requirement 3: Roving Focus Behavior Implementation

**User Story:** As a frontend developer, I want a roving focus behavior for keyboard navigation, so that users can navigate through lists, menus, and tab interfaces using arrow keys.

#### Acceptance Criteria

1. THE UI Core Package SHALL provide a `createRovingFocus` function that manages focus state for a collection of items
2. THE Roving Focus Behavior SHALL maintain state including `currentIndex` (number), `items` (array of identifiers), and `orientation` (horizontal or vertical)
3. THE Roving Focus Behavior SHALL provide actions for `moveNext`, `movePrevious`, `moveFirst`, `moveLast`, and `moveTo` that update the current focus index
4. THE Roving Focus Behavior SHALL support both horizontal (left/right arrows) and vertical (up/down arrows) navigation orientations
5. THE Roving Focus Behavior SHALL wrap focus from the last item to the first item and vice versa

### Requirement 4: List Selection Behavior Implementation

**User Story:** As a frontend developer, I want a list selection behavior that supports single, multi, and range selection modes, so that users can select items in lists and tables with familiar desktop-like interactions.

#### Acceptance Criteria

1. THE UI Core Package SHALL provide a `createListSelection` function that manages selection state for a collection of items
2. THE List Selection Behavior SHALL support three selection modes: `single`, `multi`, and `range`
3. WHEN the selection mode is `single`, THE List Selection Behavior SHALL allow only one item to be selected at a time
4. WHEN the selection mode is `multi`, THE List Selection Behavior SHALL allow multiple items to be selected independently
5. WHEN the selection mode is `range`, THE List Selection Behavior SHALL support shift-click range selection and ctrl/cmd-click toggle selection
6. THE List Selection Behavior SHALL provide actions for `select`, `deselect`, `toggleSelection`, `selectRange`, and `clearSelection`
7. THE List Selection Behavior SHALL maintain state including `selectedIds` (array of identifiers) and `lastSelectedId` (identifier or null)

### Requirement 5: Disclosure Behavior Implementation

**User Story:** As a frontend developer, I want a disclosure behavior for expandable/collapsible content, so that I can implement accordions, collapsible sections, and disclosure widgets.

#### Acceptance Criteria

1. THE UI Core Package SHALL provide a `createDisclosureBehavior` function that manages expand/collapse state
2. THE Disclosure Behavior SHALL maintain state including `isExpanded` (boolean) and `id` (string or null)
3. THE Disclosure Behavior SHALL provide `expand`, `collapse`, and `toggle` actions
4. THE Disclosure Behavior SHALL support single-panel mode where only one panel can be expanded at a time
5. THE Disclosure Behavior SHALL support multi-panel mode where multiple panels can be expanded simultaneously

### Requirement 6: Form Behavior Implementation

**User Story:** As a frontend developer, I want a form behavior with validation support, so that I can build forms with consistent validation logic across different frameworks.

#### Acceptance Criteria

1. THE UI Core Package SHALL provide a `createFormBehavior` function that manages form state and validation
2. THE Form Behavior SHALL maintain state for each field including `value`, `touched`, `dirty`, `errors`, and `isValidating`
3. THE Form Behavior SHALL support synchronous validation functions that return error messages or null
4. THE Form Behavior SHALL support asynchronous validation functions that return promises resolving to error messages or null
5. THE Form Behavior SHALL provide actions for `setFieldValue`, `setFieldTouched`, `validateField`, `validateForm`, `resetForm`, and `submitForm`
6. THE Form Behavior SHALL track overall form state including `isValid`, `isSubmitting`, and `submitCount`
7. WHEN a field value changes, THE Form Behavior SHALL mark the field as dirty and optionally trigger validation

### Requirement 7: React Framework Adapter

**User Story:** As a React developer, I want React hooks for UI Core behaviors, so that I can use behaviors in React components with idiomatic React patterns.

#### Acceptance Criteria

1. THE UI Core Package SHALL provide a `useDialogBehavior` hook that creates and manages a dialog behavior instance
2. THE React Adapter SHALL automatically subscribe to behavior state changes and trigger React re-renders
3. THE React Adapter SHALL automatically clean up behavior subscriptions and call `destroy` when the component unmounts
4. THE React Adapter SHALL return the current state and actions in a format convenient for React components
5. THE UI Core Package SHALL provide React hooks for all core behaviors including `useRovingFocus`, `useListSelection`, `useDisclosureBehavior`, and `useFormBehavior`

### Requirement 8: Vue Framework Adapter

**User Story:** As a Vue developer, I want Vue composables for UI Core behaviors, so that I can use behaviors in Vue components with idiomatic Vue patterns.

#### Acceptance Criteria

1. THE UI Core Package SHALL provide a `useDialogBehavior` composable that creates and manages a dialog behavior instance
2. THE Vue Adapter SHALL use Vue `ref` or `reactive` to make behavior state reactive
3. THE Vue Adapter SHALL automatically clean up behavior subscriptions using `onUnmounted`
4. THE Vue Adapter SHALL return computed properties for state values and direct references to actions
5. THE UI Core Package SHALL provide Vue composables for all core behaviors

### Requirement 9: Angular Framework Adapter

**User Story:** As an Angular developer, I want Angular services for UI Core behaviors, so that I can use behaviors in Angular components with idiomatic Angular patterns.

#### Acceptance Criteria

1. THE UI Core Package SHALL provide an Angular service class for each behavior (e.g., `DialogBehaviorService`)
2. THE Angular Adapter SHALL expose behavior state as RxJS Observables
3. THE Angular Adapter SHALL implement `OnDestroy` and clean up subscriptions in `ngOnDestroy`
4. THE Angular Adapter SHALL provide methods that wrap behavior actions
5. THE UI Core Package SHALL provide Angular services for all core behaviors

### Requirement 10: Master-Detail Pattern Implementation

**User Story:** As a frontend developer, I want a master-detail pattern that synchronizes list selection with detail view, so that I can build split-view interfaces like email clients and file explorers.

#### Acceptance Criteria

1. THE UI Patterns Package SHALL provide a `createMasterDetail` function that composes list selection behavior with detail synchronization
2. THE Master-Detail Pattern SHALL maintain state including `items` (array), `selectedItem` (object or null), and `detailView` (string)
3. THE Master-Detail Pattern SHALL use `createListSelection` from UI Core for selection management
4. WHEN an item is selected, THE Master-Detail Pattern SHALL update the `selectedItem` state and emit an `item:selected` event
5. THE Master-Detail Pattern SHALL provide actions for `selectItem`, `clearSelection`, and `setDetailView`
6. THE Master-Detail Pattern SHALL invoke an optional `onSelectionChange` callback when selection changes

### Requirement 11: Tabbed Interface Pattern Implementation

**User Story:** As a frontend developer, I want a tabbed interface pattern with keyboard navigation, so that I can build tab-based UIs with proper accessibility support.

#### Acceptance Criteria

1. THE UI Patterns Package SHALL provide a `createTabbedInterface` function that composes roving focus and disclosure behaviors
2. THE Tabbed Interface Pattern SHALL maintain state including `tabs` (array), `activeTabId` (string), and `panels` (map of tab IDs to panel content)
3. THE Tabbed Interface Pattern SHALL use `createRovingFocus` for keyboard navigation between tabs
4. WHEN a tab is activated, THE Tabbed Interface Pattern SHALL update the `activeTabId` and show the corresponding panel
5. THE Tabbed Interface Pattern SHALL provide actions for `activateTab`, `addTab`, `removeTab`, and `moveTab`

### Requirement 12: Sidebar Shell Pattern Implementation

**User Story:** As a frontend developer, I want a sidebar shell pattern with collapse/expand behavior, so that I can build application layouts with collapsible navigation sidebars.

#### Acceptance Criteria

1. THE UI Patterns Package SHALL provide a `createSidebarShell` function that manages sidebar state
2. THE Sidebar Shell Pattern SHALL maintain state including `isExpanded` (boolean), `activeSection` (string or null), and `isPinned` (boolean)
3. THE Sidebar Shell Pattern SHALL use `createDisclosureBehavior` for collapse/expand logic
4. THE Sidebar Shell Pattern SHALL provide actions for `expand`, `collapse`, `toggle`, `setActiveSection`, and `togglePin`
5. THE Sidebar Shell Pattern SHALL emit events when the sidebar state changes using `@web-loom/event-bus-core`

### Requirement 13: Wizard Pattern Implementation

**User Story:** As a frontend developer, I want a wizard pattern with step validation, so that I can build multi-step flows like checkout processes and onboarding wizards.

#### Acceptance Criteria

1. THE UI Patterns Package SHALL provide a `createWizard` function that manages multi-step flow state
2. THE Wizard Pattern SHALL maintain state including `steps` (array), `currentStepIndex` (number), `completedSteps` (array of indices), and `canProceed` (boolean)
3. THE Wizard Pattern SHALL use `createFormBehavior` for step validation
4. THE Wizard Pattern SHALL provide actions for `goToNextStep`, `goToPreviousStep`, `goToStep`, and `completeWizard`
5. WHEN attempting to proceed to the next step, THE Wizard Pattern SHALL validate the current step and only proceed if validation passes
6. THE Wizard Pattern SHALL support optional branching logic where the next step depends on previous answers

### Requirement 14: Modal Pattern Implementation

**User Story:** As a frontend developer, I want a modal pattern with stacking support, so that I can display multiple modals and manage focus correctly.

#### Acceptance Criteria

1. THE UI Patterns Package SHALL provide a `createModal` function that extends dialog behavior with stacking support
2. THE Modal Pattern SHALL maintain a stack of open modals with unique identifiers
3. WHEN a modal is opened, THE Modal Pattern SHALL add it to the top of the stack
4. WHEN a modal is closed, THE Modal Pattern SHALL remove it from the stack and restore focus to the previous modal or page
5. THE Modal Pattern SHALL provide actions for `openModal`, `closeModal`, `closeTopModal`, and `closeAllModals`
6. THE Modal Pattern SHALL emit events for modal lifecycle (opened, closed, stacked) using `@web-loom/event-bus-core`

### Requirement 15: Toast Queue Pattern Implementation

**User Story:** As a frontend developer, I want a toast notification queue, so that I can display temporary notifications without overwhelming the user.

#### Acceptance Criteria

1. THE UI Patterns Package SHALL provide a `createToastQueue` function that manages a queue of toast notifications
2. THE Toast Queue Pattern SHALL maintain state including `toasts` (array), `maxVisible` (number), and `defaultDuration` (milliseconds)
3. THE Toast Queue Pattern SHALL provide actions for `addToast`, `removeToast`, and `clearAllToasts`
4. WHEN a toast is added, THE Toast Queue Pattern SHALL assign it a unique identifier and add it to the queue
5. WHEN the number of visible toasts exceeds `maxVisible`, THE Toast Queue Pattern SHALL queue additional toasts and show them as space becomes available
6. THE Toast Queue Pattern SHALL automatically remove toasts after their duration expires
7. THE Toast Queue Pattern SHALL support toast types including `info`, `success`, `warning`, and `error`

### Requirement 16: Command Palette Pattern Implementation

**User Story:** As a frontend developer, I want a command palette pattern with fuzzy search, so that I can build keyboard-driven command interfaces.

#### Acceptance Criteria

1. THE UI Patterns Package SHALL provide a `createCommandPalette` function that manages command search and execution
2. THE Command Palette Pattern SHALL maintain state including `isOpen` (boolean), `query` (string), `commands` (array), `filteredCommands` (array), and `selectedIndex` (number)
3. THE Command Palette Pattern SHALL use `createDialogBehavior` for open/close state
4. THE Command Palette Pattern SHALL use `createRovingFocus` for keyboard navigation through filtered commands
5. WHEN the query changes, THE Command Palette Pattern SHALL filter commands using fuzzy matching
6. THE Command Palette Pattern SHALL provide actions for `open`, `close`, `setQuery`, `executeCommand`, and `registerCommand`
7. THE Command Palette Pattern SHALL support command categories and keyboard shortcuts

### Requirement 17: TypeScript Type Safety

**User Story:** As a TypeScript developer, I want full type safety for all behaviors and patterns, so that I can catch errors at compile time and get excellent IDE autocomplete.

#### Acceptance Criteria

1. THE UI Core Package SHALL export TypeScript interfaces for all behavior state types
2. THE UI Core Package SHALL export TypeScript interfaces for all behavior options types
3. THE UI Core Package SHALL export TypeScript interfaces for all behavior action types
4. THE UI Patterns Package SHALL export TypeScript interfaces for all pattern state types
5. THE System SHALL generate TypeScript declaration files (`.d.ts`) for all exported functions and types
6. THE System SHALL use no `any` types in public APIs
7. THE System SHALL provide comprehensive JSDoc comments for all exported functions and types

### Requirement 18: Testing Infrastructure

**User Story:** As a package maintainer, I want comprehensive test coverage for all behaviors and patterns, so that I can ensure reliability and catch regressions.

#### Acceptance Criteria

1. THE System SHALL use Vitest as the testing framework for both packages
2. THE System SHALL achieve greater than 90% code coverage for UI Core behaviors
3. THE System SHALL achieve greater than 90% code coverage for UI Patterns
4. THE System SHALL test all state transitions for each behavior
5. THE System SHALL test all actions for each behavior
6. THE System SHALL test subscription and cleanup logic for each behavior
7. THE System SHALL test framework adapters with appropriate testing libraries (React Testing Library, Vue Test Utils)

### Requirement 19: Bundle Size Optimization

**User Story:** As a frontend developer, I want minimal bundle size impact, so that my application loads quickly and performs well.

#### Acceptance Criteria

1. WHEN gzipped, THE UI Core Package SHALL be less than 20 kilobytes for all behaviors combined
2. WHEN gzipped, EACH individual behavior in UI Core SHALL be less than 2 kilobytes
3. WHEN gzipped, THE UI Patterns Package SHALL be less than 30 kilobytes for all patterns combined
4. THE System SHALL support tree-shaking so developers only bundle the behaviors they use
5. THE System SHALL configure Vite to generate optimized ES modules and UMD bundles

### Requirement 20: MVVM Integration

**User Story:** As a Web Loom developer using MVVM patterns, I want behaviors to integrate with ViewModels, so that I can use behaviors within the existing MVVM architecture.

#### Acceptance Criteria

1. THE UI Core Package SHALL provide examples of using behaviors within `BaseViewModel` classes
2. THE Behaviors SHALL be compatible with ViewModel lifecycle methods (constructor, dispose)
3. THE Behaviors SHALL allow ViewModels to subscribe to behavior state changes
4. THE Behaviors SHALL allow ViewModels to expose behavior actions as ViewModel methods
5. THE Documentation SHALL include examples of MVVM integration patterns
