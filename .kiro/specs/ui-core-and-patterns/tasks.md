# Implementation Plan

This implementation plan breaks down the UI Core and UI Patterns packages into discrete, actionable coding tasks. Each task builds incrementally on previous work, with all code integrated into the monorepo structure.

- [x] 1. Set up UI Core package infrastructure
  - Create `packages/ui-core` directory with standard Web Loom structure
  - Configure `package.json` with dependencies on `@web-loom/store-core@0.0.4` and `@web-loom/event-bus-core@0.0.2`
  - Set up `tsconfig.json` extending from `@repo/typescript-config`
  - Configure `vite.config.ts` for library build with ES and UMD outputs
  - Set up `vitest.config.js` with jsdom environment
  - Create `src/index.ts` as main entry point
  - Add package to Turborepo pipeline in root `turbo.json`
  - _Requirements: 1.1, 1.2, 1.3, 1.5_

- [ ] 2. Implement Dialog Behavior
  - [x] 2.1 Create dialog behavior core logic
    - Write `src/behaviors/dialog.ts` with `createDialogBehavior` function
    - Implement `DialogState` interface with `isOpen`, `content`, and `id` properties
    - Implement `DialogActions` interface with `open`, `close`, and `toggle` methods
    - Use `createStore` from `@web-loom/store-core` for state management
    - Add support for `onOpen` and `onClose` callbacks in options
    - Export types and factory function from `src/behaviors/index.ts`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 2.2 Write dialog behavior tests
    - Create `src/behaviors/__tests__/dialog.test.ts`
    - Test initial state (isOpen: false)
    - Test open action updates state correctly
    - Test close action updates state correctly
    - Test toggle action switches state
    - Test onOpen callback is invoked
    - Test onClose callback is invoked
    - Test destroy cleans up subscriptions
    - _Requirements: 2.1, 2.2, 2.3, 18.4, 18.5, 18.6_

- [-] 3. Implement Roving Focus Behavior
  - [x] 3.1 Create roving focus behavior core logic
    - Write `src/behaviors/roving-focus.ts` with `createRovingFocus` function
    - Implement `RovingFocusState` with `currentIndex`, `items`, `orientation`, and `wrap` properties
    - Implement `RovingFocusActions` with `moveNext`, `movePrevious`, `moveFirst`, `moveLast`, `moveTo`, and `setItems` methods
    - Add logic for wrapping from last to first item
    - Support both horizontal and vertical orientations
    - Export types and factory function
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 3.2 Write roving focus behavior tests
    - Create `src/behaviors/__tests__/roving-focus.test.ts`
    - Test moveNext increments index
    - Test movePrevious decrements index
    - Test wrapping behavior at boundaries
    - Test moveFirst and moveLast
    - Test moveTo with specific index
    - Test horizontal vs vertical orientation
    - _Requirements: 3.1, 3.2, 3.3, 18.4, 18.5_

- [-] 4. Implement List Selection Behavior
  - [x] 4.1 Create list selection behavior core logic
    - Write `src/behaviors/list-selection.ts` with `createListSelection` function
    - Implement `ListSelectionState` with `selectedIds`, `lastSelectedId`, `mode`, and `items` properties
    - Implement single selection mode (only one item selected)
    - Implement multi selection mode (independent selections)
    - Implement range selection mode (shift-click ranges, ctrl/cmd toggle)
    - Implement `ListSelectionActions` with `select`, `deselect`, `toggleSelection`, `selectRange`, `clearSelection`, and `selectAll` methods
    - Export types and factory function
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

  - [x] 4.2 Write list selection behavior tests
    - Create `src/behaviors/__tests__/list-selection.test.ts`
    - Test single selection mode
    - Test multi selection mode
    - Test range selection with selectRange
    - Test toggleSelection behavior
    - Test clearSelection and selectAll
    - Test mode switching behavior
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 18.4, 18.5_

- [-] 5. Implement Disclosure Behavior
  - [x] 5.1 Create disclosure behavior core logic
    - Write `src/behaviors/disclosure.ts` with `createDisclosureBehavior` function
    - Implement `DisclosureState` with `isExpanded` and `id` properties
    - Implement `DisclosureActions` with `expand`, `collapse`, and `toggle` methods
    - Support single-panel mode (only one expanded at a time)
    - Support multi-panel mode (multiple can be expanded)
    - Export types and factory function
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [x] 5.2 Write disclosure behavior tests
    - Create `src/behaviors/__tests__/disclosure.test.ts`
    - Test initial collapsed state
    - Test expand action
    - Test collapse action
    - Test toggle action
    - Test single-panel vs multi-panel modes
    - _Requirements: 5.1, 5.2, 5.3, 18.4, 18.5_

- [ ] 6. Implement Form Behavior
  - [x] 6.1 Create form behavior core logic
    - Write `src/behaviors/form.ts` with `createFormBehavior` function
    - Implement `FormState` with `values`, `errors`, `touched`, `dirty`, `isValidating`, `isValid`, `isSubmitting`, and `submitCount` properties
    - Implement `FormActions` with `setFieldValue`, `setFieldTouched`, `validateField`, `validateForm`, `resetForm`, and `submitForm` methods
    - Support synchronous validation functions
    - Support asynchronous validation functions returning promises
    - Mark fields as dirty when values change
    - Track overall form validity
    - Export types and factory function
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

  - [x] 6.2 Write form behavior tests
    - Create `src/behaviors/__tests__/form.test.ts`
    - Test setFieldValue updates value and marks dirty
    - Test synchronous validation
    - Test asynchronous validation
    - Test validateForm checks all fields
    - Test resetForm clears state
    - Test submitForm workflow
    - Test touched and dirty tracking
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 18.4, 18.5_

- [x] 7. Create React Framework Adapters
  - [x] 7.1 Implement React hooks for all behaviors
    - Create `src/adapters/react/index.ts` entry point
    - Write `useDialogBehavior` hook that creates and manages dialog behavior
    - Write `useRovingFocus` hook for roving focus behavior
    - Write `useListSelection` hook for list selection behavior
    - Write `useDisclosureBehavior` hook for disclosure behavior
    - Write `useFormBehavior` hook for form behavior
    - Ensure hooks subscribe to state changes and trigger re-renders
    - Ensure hooks clean up on unmount with `destroy()`
    - Export all hooks from adapter entry point
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [x] 7.2 Write React adapter tests
    - Create `src/adapters/react/__tests__/` directory
    - Test useDialogBehavior with React Testing Library
    - Test state updates trigger re-renders
    - Test cleanup on unmount
    - Test hooks for other behaviors
    - _Requirements: 7.1, 7.2, 7.3, 18.7_

- [x] 8. Create Vue Framework Adapters
  - [x] 8.1 Implement Vue composables for all behaviors
    - Create `src/adapters/vue/index.ts` entry point
    - Write `useDialogBehavior` composable using Vue `ref` and `computed`
    - Write composables for roving focus, list selection, disclosure, and form behaviors
    - Use `onUnmounted` for cleanup
    - Return computed properties for state and direct action references
    - Export all composables from adapter entry point
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [x] 8.2 Write Vue adapter tests
    - Create `src/adapters/vue/__tests__/` directory
    - Test useDialogBehavior with Vue Test Utils
    - Test reactivity with Vue's reactive system
    - Test cleanup on unmount
    - _Requirements: 8.1, 8.2, 8.3, 18.7_

- [-] 9. Create Angular Framework Adapters
  - [x] 9.1 Implement Angular services for all behaviors
    - Create `src/adapters/angular/index.ts` entry point
    - Write `DialogBehaviorService` that wraps dialog behavior
    - Expose state as RxJS Observable using `BehaviorSubject`
    - Implement `OnDestroy` with cleanup in `ngOnDestroy`
    - Write services for roving focus, list selection, disclosure, and form behaviors
    - Export all services from adapter entry point
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

  - [x] 9.2 Write Angular adapter tests
    - Create `src/adapters/angular/__tests__/` directory
    - Test DialogBehaviorService with Angular testing utilities
    - Test Observable emissions
    - Test cleanup on destroy
    - _Requirements: 9.1, 9.2, 9.3, 18.7_

- [x] 10. Set up UI Patterns package infrastructure
  - Create `packages/ui-patterns` directory with standard Web Loom structure
  - Configure `package.json` with dependencies on `@web-loom/ui-core`, `@web-loom/store-core@0.0.4`, and `@web-loom/event-bus-core@0.0.2`
  - Add peer dependencies for `@web-loom/mvvm-core` and `@web-loom/query-core` (optional)
  - Set up `tsconfig.json` extending from `@repo/typescript-config`
  - Configure `vite.config.ts` for library build
  - Set up `vitest.config.js` with jsdom environment
  - Create `src/index.ts` as main entry point
  - Add package to Turborepo pipeline in root `turbo.json`
  - _Requirements: 1.1, 1.2, 1.4, 1.5_

- [x] 11. Implement Master-Detail Pattern
  - [x] 11.1 Create master-detail pattern core logic
    - Write `src/patterns/master-detail.ts` with `createMasterDetail` function
    - Compose `createListSelection` from ui-core for selection management
    - Use `createEventBus` from event-bus-core for events
    - Implement `MasterDetailState` with `items`, `selectedItem`, and `detailView` properties
    - Implement `MasterDetailActions` with `selectItem`, `clearSelection`, and `setDetailView` methods
    - Emit `item:selected` and `selection:cleared` events
    - Support `onSelectionChange` callback
    - Export types and factory function
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_

  - [x] 11.2 Write master-detail pattern tests
    - Create `src/patterns/__tests__/master-detail.test.ts`
    - Test selectItem updates selectedItem state
    - Test clearSelection clears selection
    - Test event emissions
    - Test onSelectionChange callback
    - _Requirements: 10.1, 10.2, 10.3, 18.4, 18.5_

- [ ] 12. Implement Tabbed Interface Pattern
  - [x] 12.1 Create tabbed interface pattern core logic
    - Write `src/patterns/tabbed-interface.ts` with `createTabbedInterface` function
    - Compose `createRovingFocus` for keyboard navigation
    - Compose `createDisclosureBehavior` for panel management
    - Implement `TabbedInterfaceState` with `tabs`, `activeTabId`, and `panels` properties
    - Implement `TabbedInterfaceActions` with `activateTab`, `addTab`, `removeTab`, and `moveTab` methods
    - Support keyboard navigation between tabs
    - Export types and factory function
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

  - [x] 12.2 Write tabbed interface pattern tests
    - Create `src/patterns/__tests__/tabbed-interface.test.ts`
    - Test activateTab switches active tab
    - Test addTab and removeTab
    - Test keyboard navigation integration
    - Test panel visibility based on active tab
    - _Requirements: 11.1, 11.2, 11.3, 18.4, 18.5_

- [-] 13. Implement Sidebar Shell Pattern
  - [x] 13.1 Create sidebar shell pattern core logic
    - Write `src/patterns/sidebar-shell.ts` with `createSidebarShell` function
    - Compose `createDisclosureBehavior` for collapse/expand
    - Use `createEventBus` for state change events
    - Implement `SidebarShellState` with `isExpanded`, `activeSection`, `isPinned`, and `width` properties
    - Implement `SidebarShellActions` with `expand`, `collapse`, `toggle`, `setActiveSection`, `togglePin`, and `setWidth` methods
    - Emit events on state changes
    - Export types and factory function
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

  - [x] 13.2 Write sidebar shell pattern tests
    - Create `src/patterns/__tests__/sidebar-shell.test.ts`
    - Test expand and collapse actions
    - Test toggle action
    - Test setActiveSection
    - Test pin functionality
    - Test event emissions
    - _Requirements: 12.1, 12.2, 12.3, 18.4, 18.5_

- [x] 14. Implement Wizard Pattern
  - [x] 14.1 Create wizard pattern core logic
    - Write `src/patterns/wizard.ts` with `createWizard` function
    - Compose `createFormBehavior` for step validation
    - Implement `WizardState` with `steps`, `currentStepIndex`, `completedSteps`, `canProceed`, and `data` properties
    - Implement `WizardActions` with `goToNextStep`, `goToPreviousStep`, `goToStep`, `completeWizard`, and `setStepData` methods
    - Validate current step before allowing progression
    - Support optional branching logic
    - Track completed steps
    - Export types and factory function
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6_

  - [x] 14.2 Write wizard pattern tests
    - Create `src/patterns/__tests__/wizard.test.ts`
    - Test goToNextStep with validation
    - Test goToPreviousStep
    - Test goToStep navigation
    - Test step completion tracking
    - Test validation blocking progression
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 18.4, 18.5_

- [x] 15. Implement Modal Pattern
  - [x] 15.1 Create modal pattern core logic
    - Write `src/patterns/modal.ts` with `createModal` function
    - Compose `createDialogBehavior` for base dialog functionality
    - Implement modal stack management
    - Implement `ModalState` with `stack` and `topModalId` properties
    - Implement `ModalActions` with `openModal`, `closeModal`, `closeTopModal`, and `closeAllModals` methods
    - Support modal priority for stacking order
    - Emit lifecycle events (opened, closed, stacked)
    - Export types and factory function
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6_

  - [x] 15.2 Write modal pattern tests
    - Create `src/patterns/__tests__/modal.test.ts`
    - Test openModal adds to stack
    - Test closeModal removes from stack
    - Test closeTopModal removes top modal
    - Test closeAllModals clears stack
    - Test modal priority ordering
    - Test event emissions
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 18.4, 18.5_

- [x] 16. Implement Toast Queue Pattern
  - [x] 16.1 Create toast queue pattern core logic
    - Write `src/patterns/toast-queue.ts` with `createToastQueue` function
    - Implement queue management with max visible limit
    - Implement `ToastQueueState` with `toasts`, `maxVisible`, and `defaultDuration` properties
    - Implement `ToastQueueActions` with `addToast`, `removeToast`, and `clearAllToasts` methods
    - Auto-generate unique IDs for toasts
    - Implement auto-removal after duration expires using timers
    - Support toast types: info, success, warning, error
    - Queue toasts when max visible is reached
    - Export types and factory function
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.7_

  - [x] 16.2 Write toast queue pattern tests
    - Create `src/patterns/__tests__/toast-queue.test.ts`
    - Test addToast creates toast with ID
    - Test removeToast removes specific toast
    - Test clearAllToasts removes all
    - Test max visible limit queuing
    - Test auto-removal after duration
    - Test different toast types
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 18.4, 18.5_

- [x] 17. Implement Command Palette Pattern
  - [x] 17.1 Create command palette pattern core logic
    - Write `src/patterns/command-palette.ts` with `createCommandPalette` function
    - Compose `createDialogBehavior` for open/close state
    - Compose `createRovingFocus` for keyboard navigation
    - Implement fuzzy search filtering for commands
    - Implement `CommandPaletteState` with `isOpen`, `query`, `commands`, `filteredCommands`, and `selectedIndex` properties
    - Implement `CommandPaletteActions` with `open`, `close`, `setQuery`, `executeCommand`, `registerCommand`, and `unregisterCommand` methods
    - Support command categories and keyboard shortcuts
    - Filter commands based on query using fuzzy matching
    - Export types and factory function
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6, 16.7_

  - [x] 17.2 Write command palette pattern tests
    - Create `src/patterns/__tests__/command-palette.test.ts`
    - Test open and close actions
    - Test setQuery filters commands
    - Test fuzzy matching algorithm
    - Test executeCommand runs command action
    - Test registerCommand and unregisterCommand
    - Test keyboard navigation integration
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 18.4, 18.5_

- [x] 18. Add TypeScript type exports and documentation
  - Export all state interfaces from `packages/ui-core/src/types/index.ts`
  - Export all action interfaces from `packages/ui-core/src/types/index.ts`
  - Export all pattern interfaces from `packages/ui-patterns/src/types/index.ts`
  - Add comprehensive JSDoc comments to all exported functions
  - Add JSDoc comments to all interfaces and types
  - Ensure no `any` types in public APIs
  - Configure `vite-plugin-dts` to generate declaration files
  - Verify type exports in package.json exports field
  - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5, 17.6, 17.7_

- [x] 19. Configure package exports and build optimization
  - Configure package.json exports for ui-core (main, react, vue, angular)
  - Configure package.json exports for ui-patterns
  - Set up Vite build for tree-shaking support
  - Configure Vite to generate separate chunks for each behavior
  - Add build scripts to package.json (dev, build, test)
  - Test tree-shaking by importing individual behaviors
  - Measure and verify bundle sizes (<2KB per behavior gzipped)
  - Add bundle size checks to CI pipeline
  - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5_

- [ ] 20. Create integration examples in existing apps
  - [ ] 20.1 Add React examples to apps/mvvm-react
    - Create example component using `useDialogBehavior`
    - Create example component using `useListSelection`
    - Create example component using `createMasterDetail` pattern
    - Create example component using `createWizard` pattern
    - Add examples to existing app routes
    - _Requirements: 7.1, 10.1, 13.1_

  - [ ] 20.2 Add Vue examples to apps/mvvm-vue
    - Create example component using `useDialogBehavior` composable
    - Create example component using `useListSelection` composable
    - Create example component using `createTabbedInterface` pattern
    - Add examples to existing app routes
    - _Requirements: 8.1, 11.1_

  - [ ] 20.3 Add Vanilla JS examples to apps/mvvm-vanilla
    - Create example using dialog behavior with vanilla JS
    - Create example using roving focus with vanilla JS
    - Create example using command palette pattern
    - Demonstrate framework-agnostic usage
    - _Requirements: 2.1, 3.1, 16.1_

- [ ] 21. Create MVVM integration examples
  - Create example ViewModel using dialog behavior in `packages/view-models`
  - Create example ViewModel using form behavior
  - Create example ViewModel using master-detail pattern
  - Document ViewModel integration patterns
  - Add examples to existing MVVM apps
  - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.5_

- [ ] 22. Final package configuration and publishing preparation
  - Verify all package.json metadata (name, version, description, author, license, keywords)
  - Verify all dependencies are correctly specified
  - Verify peer dependencies are marked as optional where appropriate
  - Add README.md files to both packages with usage examples
  - Add CHANGELOG.md files to both packages
  - Add LICENSE files to both packages
  - Configure npm publish scripts
  - Test local package linking with `npm link`
  - Verify packages build successfully in CI
  - _Requirements: 1.1, 1.2, 1.3, 1.4_
