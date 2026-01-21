# Task: Command Fluent API Enhancements

**Target Package**: `packages/mvvm-core`
**Priority**: P0 (High Impact, Medium Effort)
**Status**: Not Started
**Estimated Files**: 1 modified, 1 test file updated
**Breaking Changes**: None (additive/backward compatible)

---

## Overview

Enhance the existing `Command` class with Prism-inspired fluent API methods:

- `observesProperty()` - Auto re-evaluate canExecute when properties change
- `observesCanExecute()` - Combine multiple canExecute conditions
- `raiseCanExecuteChanged()` - Manual trigger for re-evaluation

## Target Location

```
packages/mvvm-core/src/
├── commands/
│   ├── Command.ts          (MODIFY)
│   └── Command.test.ts     (ADD TESTS)
└── index.ts                (no changes needed)
```

## Web Use Cases

- Submit buttons that disable when form fields are invalid
- Actions that depend on multiple conditions (user logged in AND has permission AND data loaded)
- Complex command enablement in enterprise applications
- Reactive UI that responds to multiple state changes

## Implementation Steps

### Step 1: Analyze Current Command Implementation

The current `Command` class in `src/commands/Command.ts`:

- Accepts `canExecuteFn` as `Observable<boolean>` or function in constructor
- `canExecute$` combines base condition with `isExecuting$`

### Step 2: Add Fluent API Methods

Modify `src/commands/Command.ts` - add after existing properties:

```typescript
import { BehaviorSubject, Observable, isObservable, of, Subscription, combineLatest, Subject } from 'rxjs';
import { first, map, switchMap, distinctUntilChanged, startWith, takeUntil } from 'rxjs/operators';

export class Command<TParam = void, TResult = void> implements ICommand<TParam, TResult>, IDisposable {
  // ... existing properties ...

  // NEW: For fluent API
  private readonly observedProperties: Observable<any>[] = [];
  private readonly additionalCanExecuteConditions: Observable<boolean>[] = [];
  private readonly _canExecuteChanged$ = new Subject<void>();
  private baseCanExecute$: Observable<boolean>;

  constructor(
    executeFn: (param: TParam) => Promise<TResult>,
    canExecuteFn?: ((param: TParam) => Observable<boolean> | boolean) | Observable<boolean>,
  ) {
    // ... existing constructor code ...

    // Store the base canExecute for rebuilding
    this.baseCanExecute$ = this._canExecute$;
  }

  /**
   * Observes a property observable and re-evaluates canExecute$ when it changes.
   * The property value must be truthy for canExecute to be true.
   *
   * @param property$ Observable to observe
   * @returns this (for fluent chaining)
   *
   * @example
   * this.submitCommand = new Command(() => this.submit())
   *   .observesProperty(this.username$)
   *   .observesProperty(this.email$);
   */
  observesProperty<T>(property$: Observable<T>): this {
    if (this._isDisposed) {
      console.warn('Cannot observe property on disposed Command');
      return this;
    }

    this.observedProperties.push(property$);
    this.rebuildCanExecute();
    return this;
  }

  /**
   * Adds an additional canExecute condition.
   * All conditions must be true for canExecute$ to be true.
   *
   * @param canExecute$ Observable<boolean> condition
   * @returns this (for fluent chaining)
   *
   * @example
   * this.submitCommand = new Command(() => this.submit())
   *   .observesCanExecute(this.isFormValid$)
   *   .observesCanExecute(this.isNotBusy$);
   */
  observesCanExecute(canExecute$: Observable<boolean>): this {
    if (this._isDisposed) {
      console.warn('Cannot add canExecute condition on disposed Command');
      return this;
    }

    this.additionalCanExecuteConditions.push(canExecute$);
    this.rebuildCanExecute();
    return this;
  }

  /**
   * Manually triggers re-evaluation of canExecute$ and notifies subscribers.
   * Useful when canExecute depends on external state not tracked by observables.
   *
   * @example
   * updateSelection(items: Item[]): void {
   *   this.selectedItems = items;
   *   this.deleteCommand.raiseCanExecuteChanged();
   * }
   */
  raiseCanExecuteChanged(): void {
    if (this._isDisposed) return;
    this._canExecuteChanged$.next();
  }

  /**
   * Rebuilds the canExecute$ observable combining all conditions
   */
  private rebuildCanExecute(): void {
    const allConditions: Observable<boolean>[] = [this.baseCanExecute$, ...this.additionalCanExecuteConditions];

    // Convert observed properties to boolean conditions (truthy check)
    const propertyConditions = this.observedProperties.map((prop$) =>
      prop$.pipe(
        map((value) => !!value),
        startWith(false), // Assume false until first emission
      ),
    );

    allConditions.push(...propertyConditions);

    // Combine with manual trigger
    this._canExecute$ = combineLatest([
      combineLatest(allConditions).pipe(map((results) => results.every((r) => r === true))),
      this._canExecuteChanged$.pipe(startWith(undefined)),
    ]).pipe(
      map(([canExecute]) => canExecute),
      distinctUntilChanged(),
    );
  }

  // Update dispose to clean up new subjects
  public dispose(): void {
    if (this._isDisposed) {
      return;
    }
    this._isExecuting$.complete();
    this._executeError$.complete();
    this._canExecuteChanged$.complete(); // NEW

    if (this._canExecuteSubscription) {
      this._canExecuteSubscription.unsubscribe();
    }

    this._isDisposed = true;
  }

  // ... rest of existing implementation ...
}
```

### Step 3: Update canExecute$ Getter

The existing getter needs to work with the rebuilt observable:

```typescript
public get canExecute$(): Observable<boolean> {
  return this._canExecute$.pipe(
    switchMap(canExec => this._isExecuting$.pipe(
      map(isExec => canExec && !isExec)
    ))
  );
}
```

### Step 4: Add Tests

Add to `src/commands/Command.test.ts`:

```typescript
describe('Command Fluent API', () => {
  describe('observesProperty', () => {
    it('should return this for chaining', () => {
      const cmd = new Command(async () => {});
      const property$ = new BehaviorSubject('value');

      const result = cmd.observesProperty(property$);

      expect(result).toBe(cmd);
    });

    it('should update canExecute$ when property changes to truthy', async () => {
      const property$ = new BehaviorSubject('');
      const cmd = new Command(async () => {}).observesProperty(property$);

      // Initially falsy
      let canExecute = await firstValueFrom(cmd.canExecute$);
      expect(canExecute).toBe(false);

      // Change to truthy
      property$.next('value');
      canExecute = await firstValueFrom(cmd.canExecute$);
      expect(canExecute).toBe(true);
    });

    it('should support multiple observed properties', async () => {
      const prop1$ = new BehaviorSubject('value1');
      const prop2$ = new BehaviorSubject('');
      const cmd = new Command(async () => {}).observesProperty(prop1$).observesProperty(prop2$);

      // One falsy = cannot execute
      let canExecute = await firstValueFrom(cmd.canExecute$);
      expect(canExecute).toBe(false);

      // Both truthy = can execute
      prop2$.next('value2');
      canExecute = await firstValueFrom(cmd.canExecute$);
      expect(canExecute).toBe(true);
    });
  });

  describe('observesCanExecute', () => {
    it('should combine with existing canExecute', async () => {
      const baseCanExecute$ = new BehaviorSubject(true);
      const additionalCondition$ = new BehaviorSubject(false);

      const cmd = new Command(async () => {}, baseCanExecute$).observesCanExecute(additionalCondition$);

      // Additional is false
      let canExecute = await firstValueFrom(cmd.canExecute$);
      expect(canExecute).toBe(false);

      // Both true
      additionalCondition$.next(true);
      canExecute = await firstValueFrom(cmd.canExecute$);
      expect(canExecute).toBe(true);
    });

    it('should support chaining multiple conditions', async () => {
      const cond1$ = new BehaviorSubject(true);
      const cond2$ = new BehaviorSubject(true);
      const cond3$ = new BehaviorSubject(false);

      const cmd = new Command(async () => {})
        .observesCanExecute(cond1$)
        .observesCanExecute(cond2$)
        .observesCanExecute(cond3$);

      let canExecute = await firstValueFrom(cmd.canExecute$);
      expect(canExecute).toBe(false);

      cond3$.next(true);
      canExecute = await firstValueFrom(cmd.canExecute$);
      expect(canExecute).toBe(true);
    });
  });

  describe('raiseCanExecuteChanged', () => {
    it('should trigger re-evaluation', async () => {
      let externalState = false;
      const cmd = new Command(
        async () => {},
        new BehaviorSubject(true), // Always true from observable
      );

      // Manual trigger should cause subscribers to re-evaluate
      const values: boolean[] = [];
      cmd.canExecute$.subscribe((v) => values.push(v));

      cmd.raiseCanExecuteChanged();
      cmd.raiseCanExecuteChanged();

      // Should have received updates
      expect(values.length).toBeGreaterThan(0);
    });
  });

  describe('combined fluent API', () => {
    it('should work with constructor canExecute + observes methods', async () => {
      const constructorCondition$ = new BehaviorSubject(true);
      const property$ = new BehaviorSubject('value');
      const additionalCondition$ = new BehaviorSubject(true);

      const cmd = new Command(async () => {}, constructorCondition$)
        .observesProperty(property$)
        .observesCanExecute(additionalCondition$);

      let canExecute = await firstValueFrom(cmd.canExecute$);
      expect(canExecute).toBe(true);

      // Any false = cannot execute
      constructorCondition$.next(false);
      canExecute = await firstValueFrom(cmd.canExecute$);
      expect(canExecute).toBe(false);
    });
  });
});
```

### Step 5: Add Example

Create or update `src/examples/command-fluent-example.ts`:

```typescript
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Command, BaseViewModel, BaseModel } from '../index';

class RegistrationFormViewModel extends BaseViewModel<BaseModel<any, any>> {
  // Form fields as observables
  public readonly username$ = new BehaviorSubject<string>('');
  public readonly email$ = new BehaviorSubject<string>('');
  public readonly password$ = new BehaviorSubject<string>('');

  // Derived validation states
  public readonly isEmailValid$: Observable<boolean>;
  public readonly isPasswordValid$: Observable<boolean>;
  public readonly hasAcceptedTerms$ = new BehaviorSubject<boolean>(false);

  // Register command with fluent configuration
  public readonly registerCommand: Command<void, void>;

  constructor(model: BaseModel<any, any>) {
    super(model);

    // Email validation
    this.isEmailValid$ = this.email$.pipe(map((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)));

    // Password validation (min 8 chars)
    this.isPasswordValid$ = this.password$.pipe(map((pwd) => pwd.length >= 8));

    // Fluent command configuration
    this.registerCommand = new Command(() => this.register())
      .observesProperty(this.username$) // Must have username
      .observesProperty(this.email$) // Must have email
      .observesCanExecute(this.isEmailValid$) // Email must be valid format
      .observesCanExecute(this.isPasswordValid$) // Password must be valid
      .observesCanExecute(this.hasAcceptedTerms$) // Must accept terms
      .observesCanExecute(this.isLoading$.pipe(map((l) => !l))); // Not currently loading
  }

  private async register(): Promise<void> {
    console.log('Registering user:', {
      username: this.username$.value,
      email: this.email$.value,
    });
  }
}
```

---

## Acceptance Criteria

- [ ] `observesProperty()` method added to Command class
- [ ] `observesCanExecute()` method added to Command class
- [ ] `raiseCanExecuteChanged()` method added to Command class
- [ ] All methods return `this` for fluent chaining
- [ ] Existing constructor behavior unchanged (backward compatible)
- [ ] All existing tests pass
- [ ] New tests for fluent API methods pass
- [ ] `dispose()` cleans up new subscriptions/subjects
- [ ] Example demonstrating usage created

---

## Migration Notes

This is **backward compatible**. Existing code continues to work:

```typescript
// Old code (still works):
const cmd = new Command(() => save(), canSave$);

// New code (optional enhancement):
const cmd = new Command(() => save()).observesCanExecute(canSave$).observesCanExecute(isNotBusy$);
```

---

## Dependencies

- RxJS operators: `combineLatest`, `map`, `distinctUntilChanged`, `startWith`
- Existing Command class infrastructure
