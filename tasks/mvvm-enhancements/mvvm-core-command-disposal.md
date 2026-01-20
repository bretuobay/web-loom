# Task: Automatic Command Disposal

**Target Package**: `packages/mvvm-core`
**Priority**: P3 (Low Impact, Low Effort)
**Status**: Not Started
**Estimated Files**: 1 modified file
**Breaking Changes**: None (additive feature)

---

## Overview

Enhance `BaseViewModel` with a `registerCommand()` method that tracks commands and automatically disposes them when the ViewModel is disposed. This prevents memory leaks from orphaned command subscriptions.

## Target Location

```
packages/mvvm-core/src/
├── viewmodels/
│   ├── BaseViewModel.ts      (MODIFY)
│   └── BaseViewModel.test.ts (ADD TESTS)
└── index.ts                  (no changes needed)
```

## Web Use Cases

- Prevents memory leaks in long-running SPAs
- Ensures command subscriptions are cleaned up
- Reduces boilerplate for manual disposal

## Implementation Steps

### Step 1: Add registerCommand to BaseViewModel

Modify `src/viewmodels/BaseViewModel.ts`:

```typescript
import { Observable, Subject, Subscription } from 'rxjs';
import { map, startWith, takeUntil } from 'rxjs/operators';
import { ZodError } from 'zod';
import { BaseModel, IDisposable } from '../models/BaseModel';
import { ICommand } from '../commands/Command';

export class BaseViewModel<TModel extends BaseModel<any, any>> {
  protected readonly _subscriptions = new Subscription();
  protected readonly _destroy$ = new Subject<void>();

  // NEW: Track registered commands
  private readonly _registeredCommands: ICommand<any, any>[] = [];

  // ... existing properties ...

  constructor(model: TModel) {
    // ... existing constructor code ...
  }

  /**
   * Register a command for automatic disposal when ViewModel is disposed.
   * Returns the command for convenient assignment.
   *
   * @param command The command to register
   * @returns The same command (for assignment chaining)
   *
   * @example
   * class MyViewModel extends BaseViewModel<MyModel> {
   *   public readonly saveCommand = this.registerCommand(
   *     new Command(() => this.save())
   *   );
   *
   *   public readonly deleteCommand = this.registerCommand(
   *     new Command(() => this.delete(), this.canDelete$)
   *   );
   * }
   */
  protected registerCommand<TParam, TResult>(
    command: ICommand<TParam, TResult>
  ): ICommand<TParam, TResult> {
    this._registeredCommands.push(command);
    return command;
  }

  /**
   * Check if an object has a dispose method
   */
  private isDisposable(obj: any): obj is IDisposable {
    return obj && typeof obj.dispose === 'function';
  }

  /**
   * Disposes of all RxJS subscriptions and registered commands.
   * This method should be called when the ViewModel is no longer needed.
   */
  public dispose(): void {
    // Dispose all registered commands
    this._registeredCommands.forEach(cmd => {
      if (this.isDisposable(cmd)) {
        cmd.dispose();
      }
    });
    this._registeredCommands.length = 0; // Clear array

    // Existing disposal logic
    this._destroy$.next();
    this._destroy$.complete();
    this._subscriptions.unsubscribe();
  }

  // ... rest of existing implementation ...
}
```

### Step 2: Add Tests

Add to `src/viewmodels/BaseViewModel.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BaseViewModel } from './BaseViewModel';
import { BaseModel } from '../models/BaseModel';
import { Command } from '../commands/Command';

describe('BaseViewModel Command Registration', () => {
  let model: BaseModel<any, any>;
  let viewModel: TestViewModel;

  class TestViewModel extends BaseViewModel<BaseModel<any, any>> {
    public readonly cmd1 = this.registerCommand(
      new Command(async () => 'result1')
    );

    public readonly cmd2 = this.registerCommand(
      new Command(async () => 'result2')
    );

    // Expose for testing
    public getRegisteredCommandCount(): number {
      return (this as any)._registeredCommands.length;
    }
  }

  beforeEach(() => {
    model = new BaseModel({ initialData: null });
    viewModel = new TestViewModel(model);
  });

  describe('registerCommand', () => {
    it('should return the same command for chaining', () => {
      const cmd = new Command(async () => {});
      const registered = (viewModel as any).registerCommand(cmd);
      expect(registered).toBe(cmd);
    });

    it('should track registered commands', () => {
      expect(viewModel.getRegisteredCommandCount()).toBe(2);
    });

    it('should allow command execution after registration', async () => {
      const result = await viewModel.cmd1.execute();
      expect(result).toBe('result1');
    });
  });

  describe('dispose with commands', () => {
    it('should dispose all registered commands', () => {
      const disposeSpy1 = vi.spyOn(viewModel.cmd1, 'dispose');
      const disposeSpy2 = vi.spyOn(viewModel.cmd2, 'dispose');

      viewModel.dispose();

      expect(disposeSpy1).toHaveBeenCalled();
      expect(disposeSpy2).toHaveBeenCalled();
    });

    it('should clear command array after disposal', () => {
      viewModel.dispose();
      expect(viewModel.getRegisteredCommandCount()).toBe(0);
    });

    it('should handle commands without dispose gracefully', () => {
      // Create a mock command without dispose
      const cmdWithoutDispose = {
        canExecute$: {} as any,
        isExecuting$: {} as any,
        executeError$: {} as any,
        execute: async () => {},
      };

      (viewModel as any)._registeredCommands.push(cmdWithoutDispose);

      // Should not throw
      expect(() => viewModel.dispose()).not.toThrow();
    });
  });
});
```

### Step 3: Update Documentation

Add usage documentation in README or code comments:

```typescript
/**
 * Recommended pattern: Use registerCommand for automatic cleanup
 *
 * @example
 * class OrderViewModel extends BaseViewModel<OrderModel> {
 *   // Commands are automatically disposed when ViewModel is disposed
 *   public readonly loadCommand = this.registerCommand(
 *     new Command(() => this.model.fetch())
 *   );
 *
 *   public readonly saveCommand = this.registerCommand(
 *     new Command(() => this.model.save(), this.canSave$)
 *   );
 *
 *   public readonly deleteCommand = this.registerCommand(
 *     new Command(() => this.model.delete(), this.canDelete$)
 *   );
 * }
 *
 * // In React component:
 * useEffect(() => {
 *   return () => viewModel.dispose(); // All commands cleaned up
 * }, []);
 */
```

---

## Acceptance Criteria

- [ ] `registerCommand()` method added to BaseViewModel
- [ ] Returns command for assignment chaining
- [ ] `dispose()` calls `dispose()` on all registered commands
- [ ] Handles commands without `dispose()` gracefully
- [ ] Clears command array after disposal
- [ ] Unit tests pass
- [ ] Existing tests still pass
- [ ] Documentation added

---

## Migration Notes

This is **backward compatible**:

```typescript
// Old code (still works, manual disposal needed):
public readonly myCommand = new Command(() => this.doSomething());

// New code (recommended, automatic disposal):
public readonly myCommand = this.registerCommand(
  new Command(() => this.doSomething())
);
```

Existing ViewModels continue to work without changes. The `registerCommand` pattern is opt-in for better memory management.

---

## Dependencies

- Existing `Command` class (already has `dispose()`)
- Existing `BaseViewModel` class
- `IDisposable` interface from BaseModel
