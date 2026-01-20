# Task: Composite Command Implementation

**Target Package**: `packages/mvvm-core`
**Priority**: P0 (High Impact, Low Effort)
**Status**: Not Started
**Estimated Files**: 2-3 new files
**Breaking Changes**: None (additive feature)

---

## Overview

Implement `CompositeCommand` class that aggregates multiple child commands and executes them collectively. This is a core Prism pattern highly relevant for web applications.

## Target Location

```
packages/mvvm-core/src/
├── commands/
│   ├── Command.ts          (existing)
│   ├── Command.test.ts     (existing)
│   ├── CompositeCommand.ts (NEW)
│   └── CompositeCommand.test.ts (NEW)
└── index.ts                (update exports)
```

## Web Use Cases

- Dashboard "Refresh All" buttons that update multiple panels
- Multi-form "Save All" operations in complex wizards
- Batch actions on selected items in data tables
- Toolbar commands that affect multiple views/tabs

## Implementation Steps

### Step 1: Create ICompositeCommand Interface

Create `src/commands/CompositeCommand.ts`:

```typescript
import { Observable, BehaviorSubject, combineLatest, Subscription } from 'rxjs';
import { map, distinctUntilChanged } from 'rxjs/operators';
import { ICommand } from './Command';
import { IDisposable } from '../models/BaseModel';

/**
 * Options for CompositeCommand construction
 */
export interface CompositeCommandOptions {
  /**
   * When true, only executes commands where isActive is true (if they implement IActiveAware)
   * Default: false
   */
  monitorCommandActivity?: boolean;

  /**
   * Execution mode for child commands
   * - 'parallel': Execute all commands simultaneously (default)
   * - 'sequential': Execute commands one after another
   */
  executionMode?: 'parallel' | 'sequential';
}

/**
 * Interface for CompositeCommand
 */
export interface ICompositeCommand<TParam = void, TResult = any[]> extends ICommand<TParam, TResult> {
  register(command: ICommand<TParam, any>): void;
  unregister(command: ICommand<TParam, any>): void;
  readonly registeredCommands: ReadonlyArray<ICommand<TParam, any>>;
}
```

### Step 2: Implement CompositeCommand Class

Continue in `src/commands/CompositeCommand.ts`:

```typescript
/**
 * Aggregates multiple child commands and executes them collectively.
 * - canExecute$ is false if ANY child cannot execute
 * - isExecuting$ is true if ANY child is executing
 * - execute() runs all child commands
 */
export class CompositeCommand<TParam = void, TResult = any[]>
  implements ICompositeCommand<TParam, TResult>, IDisposable {

  private readonly commands = new Set<ICommand<TParam, any>>();
  private readonly _commands$ = new BehaviorSubject<ICommand<TParam, any>[]>([]);
  private readonly _isExecuting$ = new BehaviorSubject<boolean>(false);
  private readonly _executeError$ = new BehaviorSubject<any>(null);
  private readonly options: Required<CompositeCommandOptions>;

  private canExecuteSubscription: Subscription | null = null;
  private isExecutingSubscription: Subscription | null = null;
  private _canExecute$: Observable<boolean>;
  private _isDisposed = false;

  public readonly isExecuting$: Observable<boolean> = this._isExecuting$.asObservable();
  public readonly executeError$: Observable<any> = this._executeError$.asObservable();

  constructor(options: CompositeCommandOptions = {}) {
    this.options = {
      monitorCommandActivity: options.monitorCommandActivity ?? false,
      executionMode: options.executionMode ?? 'parallel',
    };

    // Initialize canExecute$ - will be rebuilt when commands change
    this._canExecute$ = this._commands$.pipe(
      map(() => true) // Default when no commands
    );

    this.rebuildObservables();
  }

  get canExecute$(): Observable<boolean> {
    return this._canExecute$;
  }

  get registeredCommands(): ReadonlyArray<ICommand<TParam, any>> {
    return Array.from(this.commands);
  }

  /**
   * Register a command to be executed as part of this composite
   */
  register(command: ICommand<TParam, any>): void {
    if (this._isDisposed) {
      console.warn('Cannot register command to disposed CompositeCommand');
      return;
    }

    this.commands.add(command);
    this._commands$.next(Array.from(this.commands));
    this.rebuildObservables();
  }

  /**
   * Unregister a command from this composite
   */
  unregister(command: ICommand<TParam, any>): void {
    this.commands.delete(command);
    this._commands$.next(Array.from(this.commands));
    this.rebuildObservables();
  }

  /**
   * Execute all registered commands
   */
  async execute(param: TParam): Promise<TResult> {
    if (this._isDisposed) {
      console.warn('Cannot execute disposed CompositeCommand');
      return [] as unknown as TResult;
    }

    const commandsArray = Array.from(this.commands);

    if (commandsArray.length === 0) {
      return [] as unknown as TResult;
    }

    // Filter by active state if monitoring
    const commandsToExecute = this.options.monitorCommandActivity
      ? commandsArray.filter(cmd => this.shouldExecuteCommand(cmd))
      : commandsArray;

    this._isExecuting$.next(true);
    this._executeError$.next(null);

    try {
      let results: any[];

      if (this.options.executionMode === 'sequential') {
        results = [];
        for (const cmd of commandsToExecute) {
          const result = await cmd.execute(param);
          results.push(result);
        }
      } else {
        results = await Promise.all(
          commandsToExecute.map(cmd => cmd.execute(param))
        );
      }

      return results as TResult;
    } catch (error) {
      this._executeError$.next(error);
      throw error;
    } finally {
      this._isExecuting$.next(false);
    }
  }

  /**
   * Check if a command should be executed (for active awareness)
   */
  private shouldExecuteCommand(command: ICommand<TParam, any>): boolean {
    // Check if command implements IActiveAware
    if ('isActive' in command && typeof (command as any).isActive === 'boolean') {
      return (command as any).isActive;
    }
    return true;
  }

  /**
   * Rebuild the canExecute$ and isExecuting$ observables when commands change
   */
  private rebuildObservables(): void {
    // Clean up previous subscriptions
    this.canExecuteSubscription?.unsubscribe();
    this.isExecutingSubscription?.unsubscribe();

    const commandsArray = Array.from(this.commands);

    if (commandsArray.length === 0) {
      this._canExecute$ = new BehaviorSubject(true).asObservable();
      return;
    }

    // Combine all canExecute$ - ALL must be true
    this._canExecute$ = combineLatest(
      commandsArray.map(cmd => cmd.canExecute$)
    ).pipe(
      map(canExecuteStates => canExecuteStates.every(can => can)),
      distinctUntilChanged()
    );

    // Combine all isExecuting$ - ANY true means executing
    this.isExecutingSubscription = combineLatest(
      commandsArray.map(cmd => cmd.isExecuting$)
    ).pipe(
      map(isExecutingStates => isExecutingStates.some(is => is))
    ).subscribe(isExecuting => {
      this._isExecuting$.next(isExecuting);
    });
  }

  /**
   * Dispose of the composite command
   */
  dispose(): void {
    if (this._isDisposed) return;

    this.canExecuteSubscription?.unsubscribe();
    this.isExecutingSubscription?.unsubscribe();
    this._commands$.complete();
    this._isExecuting$.complete();
    this._executeError$.complete();
    this.commands.clear();
    this._isDisposed = true;
  }
}
```

### Step 3: Add Tests

Create `src/commands/CompositeCommand.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { firstValueFrom } from 'rxjs';
import { CompositeCommand } from './CompositeCommand';
import { Command } from './Command';

describe('CompositeCommand', () => {
  describe('registration', () => {
    it('should register commands', () => {
      const composite = new CompositeCommand();
      const cmd1 = new Command(async () => {});
      const cmd2 = new Command(async () => {});

      composite.register(cmd1);
      composite.register(cmd2);

      expect(composite.registeredCommands).toHaveLength(2);
    });

    it('should unregister commands', () => {
      const composite = new CompositeCommand();
      const cmd = new Command(async () => {});

      composite.register(cmd);
      composite.unregister(cmd);

      expect(composite.registeredCommands).toHaveLength(0);
    });
  });

  describe('canExecute$', () => {
    it('should be true when all commands can execute', async () => {
      const composite = new CompositeCommand();
      const cmd1 = new Command(async () => {});
      const cmd2 = new Command(async () => {});

      composite.register(cmd1);
      composite.register(cmd2);

      const canExecute = await firstValueFrom(composite.canExecute$);
      expect(canExecute).toBe(true);
    });

    it('should be true when no commands registered', async () => {
      const composite = new CompositeCommand();
      const canExecute = await firstValueFrom(composite.canExecute$);
      expect(canExecute).toBe(true);
    });
  });

  describe('execute', () => {
    it('should execute all commands in parallel by default', async () => {
      const results: number[] = [];
      const composite = new CompositeCommand();

      const cmd1 = new Command(async () => { results.push(1); return 'a'; });
      const cmd2 = new Command(async () => { results.push(2); return 'b'; });

      composite.register(cmd1);
      composite.register(cmd2);

      const result = await composite.execute();

      expect(result).toEqual(['a', 'b']);
      expect(results).toContain(1);
      expect(results).toContain(2);
    });

    it('should execute sequentially when configured', async () => {
      const results: number[] = [];
      const composite = new CompositeCommand({ executionMode: 'sequential' });

      const cmd1 = new Command(async () => {
        await new Promise(r => setTimeout(r, 10));
        results.push(1);
        return 'a';
      });
      const cmd2 = new Command(async () => {
        results.push(2);
        return 'b';
      });

      composite.register(cmd1);
      composite.register(cmd2);

      await composite.execute();

      expect(results).toEqual([1, 2]); // Sequential order
    });

    it('should return empty array when no commands', async () => {
      const composite = new CompositeCommand();
      const result = await composite.execute();
      expect(result).toEqual([]);
    });
  });

  describe('isExecuting$', () => {
    it('should be true while any command is executing', async () => {
      const composite = new CompositeCommand();
      let resolveCmd: () => void;
      const cmdPromise = new Promise<void>(r => { resolveCmd = r; });

      const cmd = new Command(async () => { await cmdPromise; });
      composite.register(cmd);

      const executePromise = composite.execute();

      // Should be executing
      const isExecuting = await firstValueFrom(composite.isExecuting$);
      expect(isExecuting).toBe(true);

      resolveCmd!();
      await executePromise;
    });
  });

  describe('disposal', () => {
    it('should clear commands on dispose', () => {
      const composite = new CompositeCommand();
      const cmd = new Command(async () => {});

      composite.register(cmd);
      composite.dispose();

      expect(composite.registeredCommands).toHaveLength(0);
    });
  });
});
```

### Step 4: Export from Index

Update `src/index.ts`:

```typescript
// ... existing exports ...

export { CompositeCommand } from './commands/CompositeCommand';
export type { ICompositeCommand, CompositeCommandOptions } from './commands/CompositeCommand';
```

### Step 5: Add Example

Create `src/examples/composite-command-example.ts`:

```typescript
import { Command, CompositeCommand, BaseViewModel, BaseModel } from '../index';

// Example: Dashboard with multiple refresh commands
class DashboardViewModel extends BaseViewModel<BaseModel<any, any>> {
  // Individual panel refresh commands
  public readonly refreshUsersCommand = new Command(async () => {
    console.log('Refreshing users...');
    // await this.usersModel.fetch();
  });

  public readonly refreshOrdersCommand = new Command(async () => {
    console.log('Refreshing orders...');
    // await this.ordersModel.fetch();
  });

  public readonly refreshStatsCommand = new Command(async () => {
    console.log('Refreshing stats...');
    // await this.statsModel.fetch();
  });

  // Composite command to refresh all
  public readonly refreshAllCommand = new CompositeCommand();

  constructor(model: BaseModel<any, any>) {
    super(model);

    // Register all refresh commands
    this.refreshAllCommand.register(this.refreshUsersCommand);
    this.refreshAllCommand.register(this.refreshOrdersCommand);
    this.refreshAllCommand.register(this.refreshStatsCommand);
  }

  public override dispose(): void {
    this.refreshAllCommand.dispose();
    super.dispose();
  }
}
```

---

## Acceptance Criteria

- [ ] `CompositeCommand` class implements `ICompositeCommand` interface
- [ ] `register()` and `unregister()` methods work correctly
- [ ] `canExecute$` correctly aggregates all child command states (ALL must be true)
- [ ] `isExecuting$` correctly shows when ANY child is executing
- [ ] `execute()` runs all commands and returns aggregated results
- [ ] Supports both `parallel` and `sequential` execution modes
- [ ] `monitorCommandActivity` option filters by `isActive` when enabled
- [ ] `dispose()` properly cleans up all subscriptions
- [ ] Unit tests pass
- [ ] Exported from package index
- [ ] Example demonstrating usage

---

## Dependencies

- Existing `ICommand` interface from `./Command.ts`
- Existing `IDisposable` interface from `../models/BaseModel.ts`
- RxJS: `Observable`, `BehaviorSubject`, `combineLatest`, `Subscription`
