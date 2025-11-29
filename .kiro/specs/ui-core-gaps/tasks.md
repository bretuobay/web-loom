# Implementation Plan: UI Core & Patterns Gap Closure

## Overview

This implementation plan breaks down the gap closure work into discrete, manageable tasks. Each task builds incrementally on previous work, with checkpoints to ensure quality. The plan follows a behavior-first approach: implement core behaviors, then compose them into patterns, then add framework adapters and documentation.

---

## Phase 1: Core Behaviors Implementation

- [x] 1. Implement Keyboard Shortcuts Behavior
  - Create `packages/ui-core/src/behaviors/keyboard-shortcuts.ts`
  - Implement key combination parser with platform normalization (Cmd/Ctrl)
  - Implement shortcut registry using Map data structure
  - Implement event delegation with single global listener
  - Implement scope management (global vs scoped)
  - Implement conflict resolution (last-wins strategy)
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 1.10_

- [ ]* 1.1 Write property tests for Keyboard Shortcuts
  - **Property 1: Key combination registration and execution**
  - **Property 2: Platform normalization consistency**
  - **Property 3: preventDefault behavior**
  - **Property 4: Scope isolation**
  - **Property 5: Conflict resolution**
  - **Validates: Requirements 1.3, 1.4, 1.6, 1.7, 1.8, 1.10**

- [ ]* 1.2 Write unit tests for Keyboard Shortcuts
  - Test key combination parsing edge cases
  - Test shortcut registration and unregistration
  - Test scope switching
  - Test error handling for invalid key combinations
  - _Requirements: 1.1, 1.2, 1.5_

- [x] 2. Implement Undo/Redo Stack Behavior
  - Create `packages/ui-core/src/behaviors/undo-redo-stack.ts`
  - Implement three-part history structure (past, present, future)
  - Implement undo action with state transitions
  - Implement redo action with state transitions
  - Implement pushState with future clearing
  - Implement maxLength enforcement with oldest state removal
  - Implement jumpToState for time-travel debugging
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10_

- [x] 2.1 Write property tests for Undo/Redo Stack
  - **Property 6: Push state transition**
  - **Property 7: Undo state transition**
  - **Property 8: Redo state transition**
  - **Property 9: Undo-redo round trip**
  - **Property 10: History length limit**
  - **Property 11: State serializability**
  - **Validates: Requirements 2.4, 2.5, 2.6, 2.7, 2.8, 2.9**

- [-] 2.2 Write unit tests for Undo/Redo Stack
  - Test empty past/future edge cases
  - Test maxLength boundary conditions
  - Test onStateChange callback invocation
  - Test clearHistory functionality
  - _Requirements: 2.3, 2.7, 2.10_

- [x] 3. Implement Drag-and-Drop Behavior
  - Create `packages/ui-core/src/behaviors/drag-drop.ts`
  - Implement drag state management (isDragging, draggedItem, dragData)
  - Implement drop zone registry
  - Implement startDrag action with callback invocation
  - Implement endDrag action with state cleanup
  - Implement drop action with validation
  - Implement setDropTarget for hover state
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10_

- [x] 3.1 Write property tests for Drag-and-Drop
  - **Property 12: Drag start state transition**
  - **Property 13: Drag end state transition**
  - **Property 14: Drop validation**
  - **Property 15: Drag data preservation**
  - **Validates: Requirements 3.4, 3.5, 3.8, 3.9**

- [x] 3.2 Write unit tests for Drag-and-Drop
  - Test drop zone registration/unregistration
  - Test invalid drop target handling
  - Test drag without start edge case
  - Test reordering logic
  - _Requirements: 3.3, 3.6, 3.7_

- [ ] 4. Checkpoint - Core Behaviors Complete
  - Ensure all tests pass, ask the user if questions arise.


## Phase 2: Macro Patterns Implementation

- [x] 5. Implement Hub & Spoke Navigation Pattern
  - Create `packages/ui-patterns/src/patterns/hub-and-spoke.ts`
  - Implement spoke state management (isOnHub, activeSpoke, breadcrumbs)
  - Implement activateSpoke action with breadcrumb updates
  - Implement returnToHub action with state reset
  - Implement navigation history tracking
  - Implement event emission for spoke:activated and hub:returned
  - Implement optional nested spokes support
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 4.10_

- [x] 5.1 Write property tests for Hub & Spoke
  - **Property 16: Spoke activation state transition**
  - **Property 17: Hub return state transition**
  - **Property 18: Navigation history consistency**
  - **Property 19: Event emission on navigation**
  - **Validates: Requirements 4.4, 4.5, 4.6, 4.9**

- [x] 5.2 Write unit tests for Hub & Spoke
  - Test spoke addition/removal
  - Test nested spoke navigation
  - Test goBack functionality
  - Test browser history integration (optional)
  - _Requirements: 4.3, 4.7, 4.10_

- [x] 6. Implement Grid/Card Layout Pattern
  - Create `packages/ui-patterns/src/patterns/grid-layout.ts`
  - Implement responsive breakpoint calculation
  - Implement 2D grid navigation (up, down, left, right)
  - Integrate createListSelection for selection management
  - Implement wrapping logic for navigation boundaries
  - Implement viewport width tracking and column recalculation
  - Implement event emission for focus, selection, and breakpoint changes
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 5.10, 5.11, 5.12_

- [x] 6.1 Write property tests for Grid Layout
  - **Property 20: Breakpoint column calculation**
  - **Property 21: Up navigation correctness**
  - **Property 22: Down navigation correctness**
  - **Property 23: Left navigation with wrapping**
  - **Property 24: Right navigation with wrapping**
  - **Property 25: Selection mode consistency**
  - **Validates: Requirements 5.4, 5.5, 5.7, 5.8, 5.9, 5.10, 5.11**

- [x] 6.2 Write unit tests for Grid Layout
  - Test empty grid handling
  - Test single-column grid edge case
  - Test breakpoint array validation
  - Test event emission
  - _Requirements: 5.6, 5.12_

- [x] 7. Implement Floating Action Button Pattern
  - Create `packages/ui-patterns/src/patterns/floating-action-button.ts`
  - Implement scroll position tracking
  - Implement scroll direction detection
  - Implement threshold-based visibility logic
  - Implement hideOnScrollDown behavior
  - Implement event emission for visibility changes
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9, 6.10_

- [x] 7.1 Write property tests for FAB
  - **Property 26: Scroll direction detection**
  - **Property 27: Threshold-based visibility**
  - **Property 28: Hide on scroll down behavior**
  - **Validates: Requirements 6.4, 6.5, 6.6, 6.7, 6.8**

- [x] 7.2 Write unit tests for FAB
  - Test show/hide actions
  - Test threshold configuration
  - Test visibility callback invocation
  - Test event emission
  - _Requirements: 6.3, 6.9, 6.10_

- [ ] 8. Checkpoint - Macro Patterns Complete
  - Ensure all tests pass, ask the user if questions arise.


## Phase 3: Pattern Enhancements

- [x] 9. Enhance Modal Pattern with Escape and Backdrop Options
  - Update `packages/ui-patterns/src/patterns/modal.ts`
  - Add closeOnEscape option to modal configuration
  - Add closeOnBackdropClick option to modal configuration
  - Implement escape key detection and modal closing
  - Implement backdrop click detection and modal closing
  - Update openModal action to accept new configuration options
  - Emit events for escape-pressed and backdrop-clicked
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

- [ ]* 9.1 Write property tests for Modal enhancements
  - **Property 29: Escape key closes modal**
  - **Property 30: Backdrop click closes modal**
  - **Validates: Requirements 7.3, 7.4**

- [x] 9.2 Write unit tests for Modal enhancements
  - Test configuration persistence in stack
  - Test event emission
  - Test interaction with existing modal stack
  - _Requirements: 7.5, 7.6, 7.7_

- [x] 10. Enhance Roving Focus with Focus Change Callback
  - Update `packages/ui-core/src/behaviors/roving-focus.ts`
  - Add onFocusChange callback option
  - Invoke callback on all focus changes with index, itemId, and previousIndex
  - Update state to track previousIndex
  - _Requirements: 8.1, 8.2, 8.3_

- [x] 10.1 Write property tests for Roving Focus enhancement
  - **Property 31: Focus change callback invocation**
  - **Validates: Requirements 8.2, 8.3**

- [x] 11. Enhance Form Behavior with Manual Error Setting
  - Update `packages/ui-core/src/behaviors/form.ts`
  - Add setFieldError action
  - Implement error setting without validation trigger
  - Implement error merging logic (manual + validation errors)
  - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [x] 11.1 Write property tests for Form enhancement
  - **Property 32: Manual error setting**
  - **Property 33: Error merging**
  - **Validates: Requirements 9.2, 9.4**

- [x] 12. Enhance Sidebar Shell with Mobile Behavior
  - Update `packages/ui-patterns/src/patterns/sidebar-shell.ts`
  - Add isMobile state property
  - Add toggleMobile action
  - Add setMobileMode action
  - Implement auto-collapse on section selection when in mobile mode
  - Emit sidebar:mobile-toggled event
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 12.1 Write property tests for Sidebar enhancement
  - **Property 34: Mobile auto-collapse**
  - **Validates: Requirements 10.3**

- [x] 13. Enhance Toast Queue with Position Configuration
  - Update `packages/ui-patterns/src/patterns/toast-queue.ts`
  - Add position state property
  - Add setPosition action
  - Support position values: top-left, top-center, top-right, bottom-left, bottom-center, bottom-right
  - Emit toast:position-changed event
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [x] 13.1 Write property tests for Toast enhancement
  - **Property 35: Position configuration**
  - **Validates: Requirements 11.2, 11.5**

- [x] 14. Enhance Tabbed Interface with Convenience Methods
  - Update `packages/ui-patterns/src/patterns/tabbed-interface.ts`
  - Add focusNextTab action that delegates to roving focus moveNext
  - Add focusPreviousTab action that delegates to roving focus movePrevious
  - _Requirements: 12.1, 12.2, 12.3, 12.4_

- [x] 14.1 Write property tests for Tabbed Interface enhancement
  - **Property 36: Tab navigation delegation**
  - **Validates: Requirements 12.3, 12.4**

- [x] 15. Enhance Command Palette with Convenience Methods
  - Update `packages/ui-patterns/src/patterns/command-palette.ts`
  - Add selectNext action that delegates to roving focus moveNext
  - Add selectPrevious action that delegates to roving focus movePrevious
  - Add executeSelected action that executes command at current index
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6_

- [x] 15.1 Write property tests for Command Palette enhancement
  - **Property 37: Command navigation delegation**
  - **Property 38: Execute selected command**
  - **Validates: Requirements 13.4, 13.5, 13.6**

- [ ] 16. Checkpoint - Pattern Enhancements Complete
  - Ensure all tests pass, ask the user if questions arise.


## Phase 4: Framework Adapters

- [x] 17. Create React Adapters for New Behaviors
  - Create `packages/ui-core/src/adapters/react/useKeyboardShortcuts.ts`
  - Create `packages/ui-core/src/adapters/react/useUndoRedoStack.ts`
  - Create `packages/ui-core/src/adapters/react/useDragDropBehavior.ts`
  - Implement proper lifecycle management with useEffect
  - Implement state synchronization with useState
  - Implement cleanup on unmount
  - Export from `packages/ui-core/src/adapters/react/index.ts`
  - _Requirements: 14.1, 14.6_

- [x] 17.1 Write integration tests for React adapters
  - Test useKeyboardShortcuts hook lifecycle
  - Test useUndoRedoStack hook lifecycle
  - Test useDragDropBehavior hook lifecycle
  - Test state updates trigger re-renders
  - Test cleanup on unmount
  - _Requirements: 14.6_

- [x] 18. Create Vue Adapters for New Behaviors
  - Create `packages/ui-core/src/adapters/vue/useKeyboardShortcuts.ts`
  - Create `packages/ui-core/src/adapters/vue/useUndoRedoStack.ts`
  - Create `packages/ui-core/src/adapters/vue/useDragDropBehavior.ts`
  - Implement reactive state with ref() and computed()
  - Implement cleanup with onUnmounted()
  - Export from `packages/ui-core/src/adapters/vue/index.ts`
  - _Requirements: 14.4, 14.6_

- [x] 18.1 Write integration tests for Vue adapters
  - Test composable lifecycle
  - Test reactive state updates
  - Test cleanup on unmount
  - _Requirements: 14.6_

- [x] 19. Create Angular Adapters for New Behaviors
  - Create `packages/ui-core/src/adapters/angular/keyboard-shortcuts.service.ts`
  - Create `packages/ui-core/src/adapters/angular/undo-redo-stack.service.ts`
  - Create `packages/ui-core/src/adapters/angular/drag-drop-behavior.service.ts`
  - Implement @Injectable() decorators
  - Implement RxJS BehaviorSubject for state
  - Implement OnDestroy interface
  - Export from `packages/ui-core/src/adapters/angular/index.ts`
  - _Requirements: 14.5, 14.6_

- [x] 19.1 Write integration tests for Angular adapters
  - Test service initialization
  - Test RxJS observable state
  - Test OnDestroy cleanup
  - _Requirements: 14.6_

- [ ] 20. Checkpoint - Framework Adapters Complete
  - Ensure all tests pass, ask the user if questions arise.


## Phase 5: Documentation and Examples

- [x] 21. Update API Documentation for Accuracy
  - Update `packages/ui-core/README.md` to fix API name discrepancies
    - Change `toggleSelect()` to `toggleSelection()`
    - Change `focusNext()` to `moveNext()`, `focusPrevious()` to `movePrevious()`
    - Change `focusFirst()` to `moveFirst()`, `focusLast()` to `moveLast()`
    - Change mode `'multiple'` to `'multi'`
  - Update `packages/ui-patterns/README.md` to fix API name discrepancies
    - Change `setActiveTab()` to `activateTab()`
    - Change `maxToasts` to `maxVisible`
    - Change `setSearch()` to `setQuery()`
  - _Requirements: 16.1, 16.2_

- [x] 22. Write API Documentation for New Behaviors
  - Write documentation for Keyboard Shortcuts behavior
    - Overview, installation, basic usage, API reference, advanced usage
  - Write documentation for Undo/Redo Stack behavior
    - Overview, installation, basic usage, API reference, advanced usage
  - Write documentation for Drag-and-Drop behavior
    - Overview, installation, basic usage, API reference, advanced usage
  - Include TypeScript interface definitions
  - Include accessibility guidelines
  - _Requirements: 16.3, 16.7_

- [x] 23. Write API Documentation for New Patterns
  - Write documentation for Hub & Spoke Navigation pattern
    - Overview, installation, basic usage, API reference, advanced usage
  - Write documentation for Grid/Card Layout pattern
    - Overview, installation, basic usage, API reference, advanced usage
  - Write documentation for Floating Action Button pattern
    - Overview, installation, basic usage, API reference, advanced usage
  - Include TypeScript interface definitions
  - Include accessibility guidelines
  - _Requirements: 16.4, 16.7_

- [x] 24. Write Documentation for Pattern Enhancements
  - Document Modal closeOnEscape and closeOnBackdropClick options
  - Document Roving Focus onFocusChange callback
  - Document Form setFieldError action
  - Document Sidebar Shell mobile behavior
  - Document Toast Queue position configuration
  - Document Tabbed Interface convenience methods
  - Document Command Palette convenience methods
  - _Requirements: 16.9_

- [x] 25. Create Integration Examples in Playground
  - Create Text Editor example with Undo/Redo
    - Implement simple text editor with undo/redo buttons
    - Demonstrate useUndoRedoStack hook
    - Show state history visualization
  - Create Command Palette example with Keyboard Shortcuts
    - Implement command palette with Ctrl+K shortcut
    - Demonstrate useKeyboardShortcuts hook
    - Show shortcut help panel
  - Create Kanban Board example with Drag-and-Drop
    - Implement drag-and-drop between columns
    - Demonstrate useDragDropBehavior hook
    - Show keyboard alternative
  - Create Photo Gallery example with Grid Layout
    - Implement responsive grid with keyboard navigation
    - Demonstrate grid layout pattern
    - Show breakpoint changes
  - Create Settings Interface example with Hub & Spoke
    - Implement hub-and-spoke navigation
    - Demonstrate breadcrumb tracking
    - Show nested spokes
  - Create Scroll-Aware FAB example
    - Implement FAB with scroll behavior
    - Demonstrate hideOnScrollDown option
    - Show threshold configuration
  - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5, 19.6, 19.8_

- [x] 26. Write Framework-Specific Usage Examples
  - Write React examples for all new behaviors and patterns
  - Write Vue examples for all new behaviors and patterns
  - Write Angular examples for all new behaviors and patterns
  - Include code snippets in documentation
  - _Requirements: 16.5_

- [ ] 27. Write Migration Guide
  - Document changes to existing APIs (if any)
  - Provide before/after code examples
  - Explain benefits of new features
  - Include upgrade checklist
  - _Requirements: 16.6_

- [ ] 28. Write Performance and Best Practices Guide
  - Document bundle size for each behavior/pattern
  - Provide performance optimization tips
  - Include throttling/debouncing recommendations
  - Document memory management best practices
  - _Requirements: 16.8_

- [ ] 29. Create Comprehensive Changelog
  - List all new behaviors and patterns
  - List all enhancements to existing patterns
  - List all bug fixes and improvements
  - Include migration notes
  - _Requirements: 16.10_

- [ ] 30. Checkpoint - Documentation Complete
  - Ensure all documentation is accurate and comprehensive, ask the user if questions arise.


## Phase 6: Testing, Optimization, and Quality Assurance

- [ ] 31. Achieve Comprehensive Test Coverage
  - Run coverage reports for all new code
  - Identify and test uncovered code paths
  - Ensure >90% coverage for all behaviors
  - Ensure >90% coverage for all patterns
  - _Requirements: 15.9_

- [ ] 32. Run Property-Based Tests at Scale
  - Configure all property tests to run 100+ iterations
  - Verify all 38 correctness properties pass
  - Document any edge cases discovered
  - Fix any issues found by property tests
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.7_

- [ ] 33. Test Edge Cases and Error Scenarios
  - Test empty state handling for all behaviors
  - Test boundary conditions (max length, grid edges, etc.)
  - Test error scenarios (invalid inputs, null values, etc.)
  - Test concurrent operations (multiple shortcuts, rapid undo/redo)
  - _Requirements: 15.10_

- [ ] 34. Perform Bundle Size Analysis
  - Build production bundles for all behaviors
  - Measure gzipped sizes
  - Verify Keyboard Shortcuts <2KB
  - Verify Undo/Redo Stack <2KB
  - Verify Drag-and-Drop <3KB
  - Verify Hub & Spoke <2KB
  - Verify Grid Layout <3KB
  - Verify FAB <1KB
  - Optimize if any exceed targets
  - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5, 17.6, 17.7_

- [ ] 35. Verify Tree-Shaking Support
  - Test that individual behaviors can be imported separately
  - Verify unused behaviors are not included in bundle
  - Test with Rollup and Webpack
  - _Requirements: 17.8_

- [ ] 36. Perform Performance Profiling
  - Profile state update performance
  - Verify state updates <1ms (95th percentile)
  - Profile keyboard shortcut matching
  - Profile grid navigation calculations
  - Optimize any slow operations
  - _Requirements: 20.7_

- [ ] 37. Conduct Accessibility Audit
  - Run axe-core on all new patterns
  - Verify zero critical violations
  - Test keyboard-only navigation
  - Test screen reader announcements
  - Test high contrast mode
  - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5, 18.7_

- [ ] 38. Manual Accessibility Testing
  - Test with NVDA screen reader
  - Test with JAWS screen reader
  - Test with VoiceOver screen reader
  - Test keyboard navigation in all patterns
  - Document any accessibility issues
  - _Requirements: 18.6_

- [ ] 39. Cross-Browser Testing
  - Test in Chrome (latest)
  - Test in Firefox (latest)
  - Test in Safari (latest)
  - Test in Edge (latest)
  - Document any browser-specific issues
  - Fix compatibility issues
  - _Requirements: 15.9_

- [ ] 40. Performance Benchmarking
  - Create performance benchmarks for all behaviors
  - Measure and document baseline performance
  - Compare with performance targets
  - Document performance characteristics
  - _Requirements: 20.6_

- [ ] 41. Final Integration Testing
  - Test all behaviors work together
  - Test patterns compose correctly
  - Test framework adapters in real applications
  - Test with existing Web Loom packages (mvvm-core, query-core)
  - _Requirements: 19.7_

- [ ] 42. Final Checkpoint - Quality Assurance Complete
  - Ensure all tests pass, ask the user if questions arise.
  - Verify all quality metrics are met
  - Confirm production readiness

---

## Summary

**Total Tasks:** 42 main tasks
**Optional Tasks:** 21 test-related tasks (marked with *)
**Checkpoints:** 7 quality checkpoints
**Estimated Effort:** 60 hours (~1.5 sprints)

**Phase Breakdown:**
- Phase 1: Core Behaviors (12 hours)
- Phase 2: Macro Patterns (12 hours)
- Phase 3: Pattern Enhancements (8 hours)
- Phase 4: Framework Adapters (8 hours)
- Phase 5: Documentation (12 hours)
- Phase 6: Testing & QA (8 hours)

**Key Deliverables:**
- 3 new core behaviors (Keyboard Shortcuts, Undo/Redo, Drag-Drop)
- 3 new macro patterns (Hub & Spoke, Grid Layout, FAB)
- 6 enhanced existing patterns (Modal, Roving Focus, Form, Sidebar, Toast, Tabbed Interface, Command Palette)
- Framework adapters for React, Vue, Angular
- Comprehensive documentation and examples
- 38 property-based tests
- >90% code coverage
- Production-ready implementation

**Success Criteria:**
- ✅ All 38 correctness properties pass
- ✅ >90% code coverage
- ✅ All behaviors meet bundle size targets
- ✅ Zero critical accessibility violations
- ✅ All tests pass in Chrome, Firefox, Safari, Edge
- ✅ Complete documentation and examples
- ✅ 100% PRD compliance achieved
