# MVVM Enhancement Tasks

This folder contains step-by-step implementation tasks for Prism-inspired MVVM enhancements. Tasks are organized by target package and priority.

## For LLM Coding Agents

Each task file contains:

- **Target Package**: Where to implement the code
- **Priority**: P0 (highest) to P3 (lowest)
- **Implementation Steps**: Detailed step-by-step instructions
- **Code Examples**: TypeScript code to implement
- **Tests to Write**: Test cases with descriptions
- **Acceptance Criteria**: Checklist for completion

**Important**: Check the `Target Package` field at the top of each task to know which package to modify.

---

## Task Overview by Package

### `packages/mvvm-core` (Existing Package)

Core MVVM primitives - extensions to existing Command and BaseViewModel:

| Task File                         | Priority | Description                                  |
| --------------------------------- | -------- | -------------------------------------------- |
| `mvvm-core-composite-command.md`  | P0       | Aggregate multiple commands                  |
| `mvvm-core-command-fluent-api.md` | P0       | `observesProperty()`, `observesCanExecute()` |
| `mvvm-core-busy-state.md`         | P2       | Stacked loading state management             |
| `mvvm-core-command-disposal.md`   | P3       | Automatic command cleanup                    |

### `packages/forms-core` (Existing Package)

Form handling enhancements:

| Task File                        | Priority | Description                      |
| -------------------------------- | -------- | -------------------------------- |
| `forms-core-errors-container.md` | P1       | Property-level validation errors |
| `forms-core-dirty-tracking.md`   | P3       | Track unsaved changes            |

### `packages/router-core` (Existing Package)

Navigation lifecycle interfaces:

| Task File                         | Priority | Description                    |
| --------------------------------- | -------- | ------------------------------ |
| `router-core-navigation-aware.md` | P1       | ViewModel navigation lifecycle |

### `packages/mvvm-patterns` (New Package)

Application-level MVVM patterns - **create this package first**:

| Task File                              | Priority | Description                     |
| -------------------------------------- | -------- | ------------------------------- |
| `mvvm-patterns-package-setup.md`       | P0       | Create the new package          |
| `mvvm-patterns-interaction-request.md` | P1       | ViewModel-to-View communication |
| `mvvm-patterns-active-aware.md`        | P2       | Track active/inactive state     |

---

## Execution Order

Recommended order for implementation:

### Phase 1: Foundation

1. `mvvm-patterns-package-setup.md` - Create new package
2. `mvvm-core-composite-command.md` - P0
3. `mvvm-core-command-fluent-api.md` - P0

### Phase 2: Core Patterns

4. `mvvm-patterns-interaction-request.md` - P1
5. `forms-core-errors-container.md` - P1
6. `router-core-navigation-aware.md` - P1

### Phase 3: Enhancements

7. `mvvm-patterns-active-aware.md` - P2
8. `mvvm-core-busy-state.md` - P2

### Phase 4: Utilities

9. `forms-core-dirty-tracking.md` - P3
10. `mvvm-core-command-disposal.md` - P3

---

## Breaking Changes

See `BREAKING-CHANGES.md` - **All tasks are designed to be non-breaking**.

---

## Package Dependencies

After implementation:

```
mvvm-patterns
├── depends on: mvvm-core (for BaseViewModel, Command, ICommand)
└── peer deps: rxjs

forms-core (existing)
├── may import: ErrorsContainer types
└── no new deps

router-core (existing)
├── may import: navigation interfaces from mvvm-core or define own
└── no new deps
```

---

## Quick Start for Agents

```bash
# Read the task
cat tasks/mvvm-enhancements/mvvm-core-composite-command.md

# Navigate to target package
cd packages/mvvm-core

# Implement according to task steps
# Run tests
npm test
```

⏺ Good question. Looking at the Web Loom package structure and the nature of these  
 patterns, I'd recommend a hybrid approach:

Keep in mvvm-core (Core MVVM Primitives)

These extend existing core classes directly:  
 ┌────────────────────────────┬─────────────────────────────────────┐  
 │ Component │ Reason │  
 ├────────────────────────────┼─────────────────────────────────────┤  
 │ CompositeCommand │ Direct extension of Command pattern │  
 ├────────────────────────────┼─────────────────────────────────────┤  
 │ Command Fluent API │ Modifies existing Command class │  
 ├────────────────────────────┼─────────────────────────────────────┤  
 │ Automatic Command Disposal │ Modifies BaseViewModel │  
 ├────────────────────────────┼─────────────────────────────────────┤  
 │ BusyState │ Generic ViewModel utility │  
 └────────────────────────────┴─────────────────────────────────────┘  
 Move to Existing Packages

These align with existing specialized packages:  
 ┌───────────────────────┬────────────────┬─────────────────────────┐  
 │ Component │ Target Package │ Reason │  
 ├───────────────────────┼────────────────┼─────────────────────────┤  
 │ ErrorsContainer │ forms-core │ Form validation concern │  
 ├───────────────────────┼────────────────┼─────────────────────────┤  
 │ DirtyTracking │ forms-core │ Form state tracking │  
 ├───────────────────────┼────────────────┼─────────────────────────┤  
 │ Navigation Interfaces │ router-core │ Navigation lifecycle │  
 └───────────────────────┴────────────────┴─────────────────────────┘  
 New Package: mvvm-patterns (or mvvm-extras)

Application-level patterns that don't fit elsewhere:  
 ┌────────────────────┬──────────────────────────────────────────────────────────┐  
 │ Component │ Reason for New Package │  
 ├────────────────────┼──────────────────────────────────────────────────────────┤  
 │ InteractionRequest │ UI interaction abstraction, not tied to forms or routing │  
 ├────────────────────┼──────────────────────────────────────────────────────────┤  
 │ ActiveAware │ Application-level visibility tracking │  
 ├────────────────────┼──────────────────────────────────────────────────────────┤  
 │ IViewLifetime │ Framework integration concern │  
 └────────────────────┴──────────────────────────────────────────────────────────┘  
 Recommended Structure

packages/  
 ├── mvvm-core/ # Core primitives (existing + P0 tasks)  
 │ ├── Command.ts # + fluent API, CompositeCommand  
 │ ├── BaseViewModel.ts # + registerCommand, BusyState  
 │ └── BaseModel.ts  
 │  
 ├── forms-core/ # Form handling (existing + validation)  
 │ ├── ErrorsContainer.ts  
 │ ├── DirtyTracker.ts  
 │ └── ...existing  
 │  
 ├── router-core/ # Navigation (existing + lifecycle)  
 │ ├── INavigationAware.ts  
 │ ├── IConfirmNavigationRequest.ts  
 │ └── ...existing  
 │  
 └── mvvm-patterns/ # NEW: Application patterns  
 ├── InteractionRequest.ts  
 ├── ActiveAwareViewModel.ts  
 └── IViewLifetime.ts

Tradeoffs  
 Approach: All in mvvm-core  
 Pros: Simple dependency, complete out-of-box  
 Cons: Bloated core, harder to tree-shake  
 ────────────────────────────────────────  
 Approach: Hybrid (recommended)  
 Pros: Follows existing patterns, right abstraction level  
 Cons: More packages to manage  
 ────────────────────────────────────────  
 Approach: All separate  
 Pros: Maximum flexibility  
 Cons: Fragmented, complex dependencies  
 The hybrid approach follows Web Loom's existing philosophy: small focused packages  
 (forms-core, query-core, store-core) rather than a monolithic core.

Should I update the task files to reflect this package distribution?
