# Command Fluent API Implementation Summary

## Overview

Successfully implemented Prism-inspired fluent API enhancements for the `Command` class in `@web-loom/mvvm-core` as specified in `tasks/mvvm-enhancements/mvvm-core-command-fluent-api.md`.

## What Was Implemented

### 1. Enhanced Command Class (`src/commands/Command.ts`)

Added three fluent API methods for declarative command configuration:

**New Methods:**

- `observesProperty<T>(property$)`: Observes a property and re-evaluates canExecute when it changes (truthy check)
- `observesCanExecute(canExecute$)`: Adds additional canExecute conditions (all must be true)
- `raiseCanExecuteChanged()`: Manually triggers re-evaluation of canExecute

**New Internal Infrastructure:**

- `observedProperties`: Array tracking observed property observables
- `additionalCanExecuteConditions`: Array tracking additional canExecute conditions
- `_canExecuteChanged$`: Subject for manual trigger notifications
- `baseCanExecute$`: Stores the original canExecute from constructor
- `rebuildCanExecute()`: Combines all conditions into a single canExecute$ observable

**Key Implementation Details:**

- All methods return `this` for fluent chaining
- Properties are evaluated with truthy check (`!!value`)
- All conditions must be true for command to execute (AND logic)
- Manual trigger works with all observed conditions
- Proper disposal of new Subject in `dispose()` method
- Graceful handling when called on disposed commands

### 2. Comprehensive Test Suite (`src/commands/Command.test.ts`)

**20 new tests covering:**

- `observesProperty()` functionality (6 tests)
  - Returns this for chaining
  - Updates canExecute when property changes to truthy
  - Updates canExecute when property changes to falsy
  - Supports multiple observed properties
  - Handles numeric properties with truthy check
  - Prevents observation on disposed command
- `observesCanExecute()` functionality (4 tests)
  - Returns this for chaining
  - Combines with existing canExecute
  - Supports chaining multiple conditions
  - Prevents adding condition on disposed command
- `raiseCanExecuteChanged()` functionality (3 tests)
  - Triggers re-evaluation
  - Doesn't throw on disposed command
  - Works with observed properties
- Combined fluent API (4 tests)
  - Works with constructor canExecute + observes methods
  - Prevents execution when any condition is false
  - Allows execution when all conditions are true
  - Handles complex scenarios with multiple property types
- Disposal with fluent API (3 tests)
  - Completes canExecuteChanged$ subject
  - Handles disposal with observed properties
  - Handles disposal with observed conditions

**Test Results:** ✅ All 35 Command tests passing (15 existing + 20 new)

### 3. Usage Examples (`src/examples/command-fluent-api-example.ts`)

Comprehensive examples demonstrating:

- **RegistrationFormViewModel**: Complex form validation with multiple conditions
- **ShoppingCartViewModel**: E-commerce cart operations with derived observables
- **DocumentEditorViewModel**: Text editor with external state using raiseCanExecuteChanged
- React, Angular, and Vue integration examples (pseudo-code)

## Files Modified

```
packages/mvvm-core/src/
├── commands/
│   ├── Command.ts                           (MODIFIED - added fluent API)
│   └── Command.test.ts                      (MODIFIED - added 20 tests)
└── examples/
    └── command-fluent-api-example.ts        (NEW - usage examples)
```

## Acceptance Criteria Status

✅ `observesProperty()` method added to Command class  
✅ `observesCanExecute()` method added to Command class  
✅ `raiseCanExecuteChanged()` method added to Command class  
✅ All methods return `this` for fluent chaining  
✅ Existing constructor behavior unchanged (backward compatible)  
✅ All existing tests pass (15/15)  
✅ New tests for fluent API methods pass (20/20)  
✅ `dispose()` cleans up new subscriptions/subjects  
✅ Example demonstrating usage created

## Build Verification

✅ TypeScript compilation successful  
✅ Vite build successful  
✅ Type definitions generated correctly  
✅ No breaking changes introduced  
✅ All existing tests still pass (275 tests total)

## Usage Examples

### Basic Property Observation

```typescript
import { Command } from '@web-loom/mvvm-core';
import { BehaviorSubject } from 'rxjs';

const username$ = new BehaviorSubject('');
const email$ = new BehaviorSubject('');

// Command only enabled when both fields have values
const submitCommand = new Command(() => submit()).observesProperty(username$).observesProperty(email$);
```

### Multiple Conditions

```typescript
import { map } from 'rxjs/operators';

const isFormValid$ = formData$.pipe(map((data) => data.isValid));
const isNotBusy$ = isLoading$.pipe(map((loading) => !loading));
const hasAcceptedTerms$ = new BehaviorSubject(false);

// All conditions must be true
const registerCommand = new Command(() => register())
  .observesCanExecute(isFormValid$)
  .observesCanExecute(isNotBusy$)
  .observesCanExecute(hasAcceptedTerms$);
```

### Manual Trigger for External State

```typescript
class MyViewModel extends BaseViewModel<MyModel> {
  private selectedItems: Item[] = [];

  public readonly deleteCommand = this.registerCommand(new Command(() => this.deleteSelected()));

  // Called when selection changes (external event)
  updateSelection(items: Item[]): void {
    this.selectedItems = items;
    // Manually trigger re-evaluation
    this.deleteCommand.raiseCanExecuteChanged();
  }

  private async deleteSelected(): Promise<void> {
    if (this.selectedItems.length === 0) {
      console.log('Cannot delete: no items selected');
      return;
    }
    // Delete logic
  }
}
```

### Complex Form Validation

```typescript
class RegistrationFormViewModel extends BaseViewModel<RegistrationModel> {
  public readonly username$ = new BehaviorSubject('');
  public readonly email$ = new BehaviorSubject('');
  public readonly password$ = new BehaviorSubject('');

  public readonly isEmailValid$ = this.email$.pipe(map((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)));

  public readonly isPasswordValid$ = this.password$.pipe(map((pwd) => pwd.length >= 8 && /\d/.test(pwd)));

  public readonly registerCommand = this.registerCommand(
    new Command(() => this.register())
      .observesProperty(this.username$) // Must have username
      .observesProperty(this.email$) // Must have email
      .observesCanExecute(this.isEmailValid$) // Email must be valid
      .observesCanExecute(this.isPasswordValid$) // Password must be valid
      .observesCanExecute(this.isLoading$.pipe(map((l) => !l))), // Not busy
  );
}
```

## Framework Integration

### React

```typescript
function MyForm() {
  const [vm] = useState(() => new MyViewModel(new MyModel()));
  const [canSubmit, setCanSubmit] = useState(false);

  useEffect(() => {
    const sub = vm.submitCommand.canExecute$.subscribe(setCanSubmit);
    return () => {
      sub.unsubscribe();
      vm.dispose();
    };
  }, []);

  return (
    <button
      disabled={!canSubmit}
      onClick={() => vm.submitCommand.execute()}
    >
      Submit
    </button>
  );
}
```

### Angular

```typescript
@Component({
  selector: 'app-my-form',
  template: `
    <button [disabled]="!(vm.submitCommand.canExecute$ | async)" (click)="vm.submitCommand.execute()">Submit</button>
  `,
})
export class MyFormComponent implements OnDestroy {
  vm = new MyViewModel(new MyModel());

  ngOnDestroy() {
    this.vm.dispose();
  }
}
```

### Vue

```vue
<template>
  <button :disabled="!canSubmit" @click="vm.submitCommand.execute()">Submit</button>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

const vm = new MyViewModel(new MyModel());
const canSubmit = ref(false);

let sub: Subscription;

onMounted(() => {
  sub = vm.submitCommand.canExecute$.subscribe((val) => (canSubmit.value = val));
});

onUnmounted(() => {
  sub?.unsubscribe();
  vm.dispose();
});
</script>
```

## Migration Guide

This feature is **100% backward compatible**. Existing code continues to work without changes.

### Before (Still Works)

```typescript
const canExecute$ = combineLatest([this.isValid$, this.isNotBusy$, this.hasPermission$]).pipe(
  map(([valid, notBusy, hasPermission]) => valid && notBusy && hasPermission),
);

const command = new Command(() => this.execute(), canExecute$);
```

### After (Recommended)

```typescript
const command = new Command(() => this.execute())
  .observesCanExecute(this.isValid$)
  .observesCanExecute(this.isNotBusy$)
  .observesCanExecute(this.hasPermission$);
```

## Benefits

1. **Declarative Configuration**: Clear, readable command setup
2. **Less Boilerplate**: No need to manually combine observables
3. **Type Safe**: Full TypeScript support with proper type inference
4. **Fluent API**: Chainable methods for elegant configuration
5. **Backward Compatible**: Existing code continues to work
6. **Flexible**: Mix constructor canExecute with fluent methods
7. **Testable**: Easy to test individual conditions
8. **Performance**: Efficient observable combination with distinctUntilChanged

## Implementation Notes

### Truthy Check for Properties

Properties are evaluated with JavaScript truthy check:

```typescript
// Truthy values: non-empty strings, non-zero numbers, true, objects, arrays
username$.next('john'); // true
count$.next(5); // true
items$.next([1, 2, 3]); // true

// Falsy values: empty string, 0, false, null, undefined
username$.next(''); // false
count$.next(0); // false
items$.next(null); // false
```

### Condition Combination

All conditions are combined with AND logic:

```typescript
// Command can execute only when ALL are true:
// - baseCanExecute (from constructor) is true
// - property1 is truthy
// - property2 is truthy
// - condition1$ emits true
// - condition2$ emits true
const cmd = new Command(() => {}, baseCanExecute$)
  .observesProperty(property1$)
  .observesProperty(property2$)
  .observesCanExecute(condition1$)
  .observesCanExecute(condition2$);
```

### Manual Trigger Use Cases

Use `raiseCanExecuteChanged()` when:

- Command depends on external state not tracked by observables
- Selection state managed outside observables
- Clipboard state changes
- Window focus/blur events
- Any imperative state changes

### Disposal

The fluent API properly cleans up:

```typescript
public dispose(): void {
  this._isExecuting$.complete();
  this._executeError$.complete();
  this._canExecuteChanged$.complete(); // NEW: Fluent API cleanup

  if (this._canExecuteSubscription) {
    this._canExecuteSubscription.unsubscribe();
  }

  this._isDisposed = true;
}
```

## Performance Considerations

- Uses `distinctUntilChanged()` to prevent unnecessary emissions
- Uses `startWith(false)` for properties to provide immediate value
- Combines observables efficiently with `combineLatest`
- No memory leaks when properly disposed

## Comparison with Prism Library

This implementation adapts Prism's command patterns for web development:

| Prism (C#/WPF)                         | Web Loom (TypeScript/RxJS)        |
| -------------------------------------- | --------------------------------- |
| `ObservesProperty(() => Property)`     | `observesProperty(property$)`     |
| `ObservesCanExecute(() => CanExecute)` | `observesCanExecute(canExecute$)` |
| `RaiseCanExecuteChanged()`             | `raiseCanExecuteChanged()`        |
| INotifyPropertyChanged                 | RxJS Observables                  |
| Lambda expressions                     | Observable streams                |

## Related Features

This feature complements:

- **Command Disposal**: Commands registered with `registerCommand()` are automatically disposed
- **BusyState**: Can be used together for comprehensive state management
- **BaseViewModel**: Provides the context for command usage

## Related Documentation

- Task Specification: `tasks/mvvm-enhancements/mvvm-core-command-fluent-api.md`
- Enhancement Roadmap: `docs/MVVM-CORE-PRISM-ENHANCEMENTS.md` (Section 1.2)
- Command Class: `packages/mvvm-core/src/commands/Command.ts`
- Usage Examples: `packages/mvvm-core/src/examples/command-fluent-api-example.ts`

## Version

Implemented in: `@web-loom/mvvm-core@0.5.4`  
Date: January 21, 2025  
Status: ✅ Complete  
Priority: P0 (High Impact, Medium Effort)  
Breaking Changes: None (additive feature)
