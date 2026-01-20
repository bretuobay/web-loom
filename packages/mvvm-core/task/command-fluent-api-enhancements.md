# Task: Command Fluent API Enhancements

**Priority**: P0 (High Impact, Medium Effort)
**Status**: Not Started
**Estimated Files**: 1 modified, 1 new test additions
**Breaking Changes**: None (additive/backward compatible)

---

## Overview

Enhance the existing `Command` class with Prism-inspired fluent API methods:
- `observesProperty()` - Auto re-evaluate canExecute when properties change
- `observesCanExecute()` - Combine multiple canExecute conditions
- `raiseCanExecuteChanged()` - Manual trigger for re-evaluation

## Web Relevance Assessment

**Highly relevant for web development:**
- Submit buttons that disable when form fields are invalid
- Actions that depend on multiple conditions (user logged in AND has permission AND data loaded)
- Complex command enablement in enterprise applications
- Reactive UI that responds to multiple state changes

## Current State Analysis

The current `Command` class (from `src/commands/Command.ts`):
- Accepts `canExecuteFn` as Observable<boolean> or function in constructor
- Does not support chaining multiple conditions
- Does not support adding conditions after construction
- No manual trigger for re-evaluation

## Implementation Steps

### Step 1: Add Fluent API Methods to Command Class

Modify `src/commands/Command.ts`:

```typescript
class Command<TParam = void, TResult = void> implements ICommand<TParam, TResult> {
  private readonly observedProperties: Observable<any>[] = [];
  private readonly canExecuteConditions: Observable<boolean>[] = [];

  /**
   * Observes a property and re-evaluates canExecute$ when it emits
   * The property value must be truthy for canExecute to be true
   * @returns this (fluent API)
   */
  observesProperty<T>(property$: Observable<T>): this {
    this.observedProperties.push(property$);
    this.rebuildCanExecute();
    return this;
  }

  /**
   * Adds an additional canExecute condition
   * All conditions must be true for canExecute$ to be true
   * @returns this (fluent API)
   */
  observesCanExecute(canExecute$: Observable<boolean>): this {
    this.canExecuteConditions.push(canExecute$);
    this.rebuildCanExecute();
    return this;
  }

  /**
   * Manually triggers re-evaluation of canExecute$
   * Useful when canExecute depends on external state not tracked by observables
   */
  raiseCanExecuteChanged(): void {
    this._canExecuteSubject.next(/* re-evaluate */);
  }

  private rebuildCanExecute(): void {
    // Rebuild _canExecute$ combining all conditions
  }
}
```

### Step 2: Maintain Backward Compatibility

- Constructor signature must remain unchanged
- Existing tests must pass without modification
- `observesProperty()` and `observesCanExecute()` are optional enhancements

### Step 3: Implement rebuildCanExecute Logic

```typescript
private rebuildCanExecute(): void {
  const allConditions: Observable<boolean>[] = [
    this.baseCanExecute$,  // Original constructor condition
    ...this.canExecuteConditions,
    ...this.observedProperties.map(prop$ => prop$.pipe(map(v => !!v)))
  ];

  this._computedCanExecute$ = combineLatest(allConditions).pipe(
    map(results => results.every(r => r === true)),
    distinctUntilChanged()
  );
}
```

### Step 4: Update ICommand Interface (Optional)

Decide whether to add fluent methods to interface or keep them Command-only:

```typescript
interface ICommand<TParam = void, TResult = void> {
  // ... existing

  // Optional fluent methods (only on Command class, not interface)
  // This keeps the interface minimal for other implementations
}
```

**Recommendation**: Keep interface minimal. Fluent methods are Command implementation details.

### Step 5: Add Tests

Add to `src/commands/Command.test.ts`:

1. **observesProperty() tests:**
   - canExecute$ updates when observed property changes
   - Multiple properties can be observed
   - Falsy property value -> canExecute$ false
   - Fluent chaining works

2. **observesCanExecute() tests:**
   - Additional condition affects canExecute$
   - Multiple conditions combined with AND logic
   - Dynamic updates when conditions change

3. **raiseCanExecuteChanged() tests:**
   - Manual trigger causes re-evaluation
   - Subscribers receive update

4. **Combined tests:**
   - Constructor condition + observesProperty + observesCanExecute
   - All must be true for canExecute$ to be true

5. **Disposal tests:**
   - Observed properties cleaned up on dispose

### Step 6: Add Example

Create or update `src/examples/command-fluent-example.ts`:

```typescript
class RegistrationFormViewModel extends BaseViewModel<RegistrationModel> {
  public readonly username$: Observable<string>;
  public readonly email$: Observable<string>;
  public readonly isEmailValid$: Observable<boolean>;
  public readonly hasAcceptedTerms$: Observable<boolean>;

  public readonly registerCommand = new Command(
    () => this.register()
  )
    .observesProperty(this.username$)           // Must have username
    .observesProperty(this.email$)              // Must have email
    .observesCanExecute(this.isEmailValid$)     // Email format valid
    .observesCanExecute(this.hasAcceptedTerms$) // Terms accepted
    .observesCanExecute(this.isLoading$.pipe(map(l => !l))); // Not loading
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
- [ ] New tests for fluent API methods
- [ ] dispose() cleans up observed property subscriptions
- [ ] Example demonstrating usage

---

## Technical Considerations

### Subscription Management

When `observesProperty()` or `observesCanExecute()` is called:
- New subscriptions are created via combineLatest
- Previous subscription must be cleaned up if rebuilding
- All subscriptions must be cleaned up on dispose()

### Thread Safety

RxJS handles this, but ensure:
- `rebuildCanExecute()` is safe to call multiple times
- No race conditions between rebuild and execute

### Performance

- Avoid rebuilding on every call if no changes
- Use `distinctUntilChanged()` to prevent unnecessary emissions

---

## Dependencies

- RxJS operators: `combineLatest`, `map`, `distinctUntilChanged`
- Existing Command class infrastructure

---

## Breaking Changes

**None** - This is purely additive:
- Existing constructor signature unchanged
- Existing methods unchanged
- New methods are optional
