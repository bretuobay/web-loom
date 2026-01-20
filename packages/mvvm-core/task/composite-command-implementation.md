# Task: Composite Command Implementation

**Priority**: P0 (High Impact, Low Effort)
**Status**: Not Started
**Estimated Files**: 2-3 new files
**Breaking Changes**: None (additive feature)

---

## Overview

Implement `CompositeCommand` class that aggregates multiple child commands and executes them collectively. This is a core Prism pattern highly relevant for web applications.

## Web Relevance Assessment

**Highly relevant for web development:**
- Dashboard "Refresh All" buttons that update multiple panels
- Multi-form "Save All" operations in complex wizards
- Batch actions on selected items in data tables
- Toolbar commands that affect multiple views/tabs
- Undo/Redo systems that group related operations

## Implementation Steps

### Step 1: Create ICompositeCommand Interface

Create `src/commands/CompositeCommand.ts`:

```typescript
interface ICompositeCommand<TParam = void, TResult = void[]> extends ICommand<TParam, TResult> {
  register(command: ICommand<TParam, any>): void;
  unregister(command: ICommand<TParam, any>): void;
  readonly registeredCommands: ReadonlyArray<ICommand<TParam, any>>;
  readonly monitorCommandActivity: boolean;
}
```

### Step 2: Implement CompositeCommand Class

**Key behaviors:**
- `canExecute$` returns `false` if ANY child cannot execute
- `isExecuting$` returns `true` if ANY child is executing
- `execute()` calls all child commands (configurable: parallel vs sequential)
- Support for optional active awareness monitoring (filters by `isActive` when enabled)
- Memory management: Must clean up when unregistering commands

**Constructor options:**
```typescript
interface CompositeCommandOptions {
  monitorCommandActivity?: boolean;  // Filter by IActiveAware.isActive
  executionMode?: 'parallel' | 'sequential';  // Default: parallel
}
```

### Step 3: Handle Dynamic Command Registration

- `canExecute$` and `isExecuting$` must recalculate when commands are added/removed
- Use `BehaviorSubject` to track registered commands
- Recombine observables via `combineLatest` on registration changes

### Step 4: Add Tests

Create `src/commands/CompositeCommand.test.ts`:

1. **Registration tests:**
   - Register/unregister commands
   - Verify registeredCommands array

2. **canExecute$ aggregation tests:**
   - All commands can execute -> true
   - One command cannot execute -> false
   - Dynamic updates when child canExecute$ changes

3. **isExecuting$ aggregation tests:**
   - No commands executing -> false
   - Any command executing -> true

4. **execute() tests:**
   - Parallel execution (default)
   - Sequential execution option
   - Results aggregation
   - Error handling (one fails, others succeed)

5. **Active awareness tests:**
   - Filter execution by isActive when monitorCommandActivity=true
   - Execute all when monitorCommandActivity=false

6. **Disposal tests:**
   - Properly unsubscribes on dispose
   - Commands are cleared

### Step 5: Export from Index

Update `src/index.ts` to export:
- `CompositeCommand` class
- `ICompositeCommand` interface
- `CompositeCommandOptions` type

### Step 6: Add Example

Create `src/examples/composite-command-example.ts` demonstrating:
- Dashboard with multiple refresh commands
- "Save All" pattern for multi-tab editor

---

## Acceptance Criteria

- [ ] CompositeCommand class implements ICompositeCommand interface
- [ ] canExecute$ correctly aggregates all child command states
- [ ] isExecuting$ correctly shows when any child is executing
- [ ] execute() runs all commands and returns aggregated results
- [ ] Supports both parallel and sequential execution modes
- [ ] Active awareness filtering works when enabled
- [ ] dispose() properly cleans up all subscriptions
- [ ] 100% test coverage for new code
- [ ] Exported from package index
- [ ] Example demonstrating usage

---

## Dependencies

- Existing `ICommand` interface
- Existing `Command` class (for testing)
- Optional: `IActiveAware` interface (if implementing active awareness in same task)

---

## Notes

- This is an additive feature with no breaking changes
- Consider making execution mode configurable per-execute() call, not just constructor
- Error handling strategy: continue executing remaining commands or abort on first failure?
