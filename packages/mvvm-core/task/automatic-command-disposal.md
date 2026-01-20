# Task: Automatic Command Disposal

**Priority**: P3 (Low Impact, Low Effort)
**Status**: Not Started
**Estimated Files**: 1 modified file
**Breaking Changes**: None (additive feature)

---

## Overview

Enhance `BaseViewModel` with automatic command disposal by adding a `registerCommand()` method that tracks commands and disposes them when the ViewModel is disposed. This prevents memory leaks from orphaned command subscriptions.

## Web Relevance Assessment

**Relevant for web development:**
- Prevents memory leaks in long-running SPAs
- Ensures command subscriptions are cleaned up
- Reduces boilerplate for manual disposal
- Important for views that are frequently created/destroyed

**Current gap**: Commands created in ViewModels must be manually disposed. If forgotten, their internal subscriptions may leak.

## Implementation Steps

### Step 1: Add Command Registration to BaseViewModel

Modify `src/viewmodels/BaseViewModel.ts`:

```typescript
import { ICommand } from '../commands/Command';

export class BaseViewModel<TModel extends BaseModel<any, any>> {
  protected readonly _subscriptions = new Subscription();
  protected readonly _destroy$ = new Subject<void>();
  private readonly _commands: ICommand<any, any>[] = [];

  // ... existing code ...

  /**
   * Register a command for automatic disposal when ViewModel is disposed.
   * Returns the command for fluent assignment.
   *
   * @param command The command to register
   * @returns The same command (for assignment chaining)
   *
   * @example
   * public readonly saveCommand = this.registerCommand(
   *   new Command(() => this.save())
   * );
   */
  protected registerCommand<TParam, TResult>(
    command: ICommand<TParam, TResult>
  ): ICommand<TParam, TResult> {
    this._commands.push(command);
    return command;
  }

  /**
   * Check if a command implements dispose
   */
  private isDisposable(obj: any): obj is { dispose(): void } {
    return obj && typeof obj.dispose === 'function';
  }

  public dispose(): void {
    // Dispose all registered commands
    this._commands.forEach(cmd => {
      if (this.isDisposable(cmd)) {
        cmd.dispose();
      }
    });
    this._commands.length = 0; // Clear array

    this._destroy$.next();
    this._destroy$.complete();
    this._subscriptions.unsubscribe();
  }
}
```

### Step 2: Add Disposable Interface Check

Since `ICommand` doesn't currently extend `IDisposable`, check at runtime:

```typescript
interface ICommandWithDispose<TParam, TResult> extends ICommand<TParam, TResult> {
  dispose(): void;
}

private isCommandDisposable(
  command: ICommand<any, any>
): command is ICommandWithDispose<any, any> {
  return 'dispose' in command && typeof (command as any).dispose === 'function';
}
```

### Step 3: Optional - Update ICommand Interface

Consider extending `ICommand` to include optional dispose (non-breaking):

```typescript
export interface ICommand<TParam = void, TResult = void> {
  readonly canExecute$: Observable<boolean>;
  readonly isExecuting$: Observable<boolean>;
  readonly executeError$: Observable<any>;

  execute(param: TParam): Promise<TResult | undefined>;

  // Optional disposal method
  dispose?(): void;
}
```

This is optional and maintains backward compatibility.

### Step 4: Add Helper for Subscription Management

Enhance the `subscribe()` helper method already mentioned in the document:

```typescript
export class BaseViewModel<TModel extends BaseModel<any, any>> {
  // ... existing code ...

  /**
   * Subscribe to an observable with automatic cleanup on dispose.
   * Preferred over manual subscription for memory safety.
   */
  protected subscribe<T>(
    observable$: Observable<T>,
    next?: (value: T) => void,
    error?: (error: any) => void,
    complete?: () => void
  ): Subscription {
    const sub = observable$.pipe(takeUntil(this._destroy$)).subscribe({
      next,
      error,
      complete
    });

    this._subscriptions.add(sub);
    return sub;
  }
}
```

### Step 5: Add Tests

Add to `src/viewmodels/BaseViewModel.test.ts`:

1. **registerCommand tests:**
   - Command is stored in internal array
   - Returns the same command (for chaining)

2. **Disposal tests:**
   - Registered commands are disposed
   - Commands without dispose() don't cause errors
   - Multiple commands disposed in order

3. **Memory leak prevention tests:**
   - After dispose, commands are cleared
   - No references held to disposed commands

### Step 6: Update Documentation

Add to README or docs:

```typescript
// Recommended: Use registerCommand for automatic cleanup
class MyViewModel extends BaseViewModel<MyModel> {
  public readonly saveCommand = this.registerCommand(
    new Command(() => this.save())
  );

  public readonly loadCommand = this.registerCommand(
    new Command(() => this.load(), this.canLoad$)
  );
}

// View component should call dispose when unmounting
useEffect(() => {
  return () => vm.dispose(); // All commands automatically disposed
}, []);
```

### Step 7: Add Example

Update existing examples to use `registerCommand`:

```typescript
class RestfulTodoViewModel extends BaseViewModel<RestfulTodoModel> {
  // Before (manual disposal required):
  // public readonly fetchCommand = new Command(...);

  // After (automatic disposal):
  public readonly fetchCommand = this.registerCommand(
    new Command(() => this.model.fetch())
  );

  public readonly createCommand = this.registerCommand(
    new Command((item: TodoItem) => this.model.create(item))
  );

  public readonly deleteCommand = this.registerCommand(
    new Command((id: string) => this.model.delete(id))
  );
}
```

---

## Acceptance Criteria

- [ ] `registerCommand()` method added to BaseViewModel
- [ ] Returns command for assignment chaining
- [ ] dispose() calls dispose() on all registered commands
- [ ] Handles commands without dispose() gracefully
- [ ] Clears command array after disposal
- [ ] Unit tests for command registration and disposal
- [ ] Existing tests still pass
- [ ] Documentation updated
- [ ] Examples updated to use registerCommand

---

## Migration Path

This is **non-breaking** but recommended for new code:

```typescript
// Old code (still works):
public readonly myCommand = new Command(...);

// New code (recommended):
public readonly myCommand = this.registerCommand(new Command(...));
```

Existing code without registerCommand continues to work. The ViewModel's dispose() will still clean up its own subscriptions; commands just won't be auto-disposed.

---

## Dependencies

- Existing `Command` class (already has dispose())
- Existing `BaseViewModel`

---

## Breaking Changes

**None** - Purely additive:
- New protected method `registerCommand()`
- Enhanced dispose() behavior
- Existing code unaffected
