# Breaking Changes Documentation

This document tracks breaking changes for the MVVM enhancement tasks.

## Current Status: No Breaking Changes

**All tasks are designed to be backward compatible and additive.**

---

## Summary by Package

| Package | Breaking Changes | Notes |
|---------|------------------|-------|
| `mvvm-core` | None | New classes/methods only |
| `forms-core` | None | New validation utilities |
| `router-core` | None | New interfaces only |
| `mvvm-patterns` | N/A | New package |

---

## Task-by-Task Analysis

### mvvm-core Tasks

| Task | Status | Impact |
|------|--------|--------|
| CompositeCommand | Additive | New `CompositeCommand` class |
| Command Fluent API | Additive | New methods on `Command` class |
| Busy State | Additive | New `BusyState` class |
| Command Disposal | Additive | New `registerCommand()` method |

**Existing code continues to work without modification.**

### forms-core Tasks

| Task | Status | Impact |
|------|--------|--------|
| ErrorsContainer | Additive | New validation classes |
| Dirty Tracking | Additive | New `DirtyTracker` class |

**Existing form handling unaffected.**

### router-core Tasks

| Task | Status | Impact |
|------|--------|--------|
| Navigation Interfaces | Additive | New optional interfaces |

**Existing routing unchanged. ViewModels can optionally implement new interfaces.**

### mvvm-patterns Tasks (New Package)

| Task | Status | Impact |
|------|--------|--------|
| Package Setup | New | Creates new package |
| Interaction Request | New | New pattern |
| Active Aware | New | New pattern |

**New package - no existing code affected.**

---

## Potential Future Breaking Changes

These changes were **NOT** implemented to maintain compatibility:

### 1. Making ICommand.dispose() Required

```typescript
// NOT DONE - Would break existing implementations
interface ICommand<TParam, TResult> {
  dispose(): void; // Would require all implementations to add
}
```

**Alternative**: Runtime check for dispose method.

### 2. Changing BaseViewModel Constructor

```typescript
// NOT DONE - Would break subclass constructors
constructor(model: TModel, options?: ViewModelOptions)
```

**Alternative**: Features added via protected properties/methods.

### 3. Mandatory Lifecycle Interfaces

```typescript
// NOT DONE - Would require changes to all ViewModels
abstract class BaseViewModel implements INavigationAware {
  abstract onNavigatedTo(context: NavigationContext): void;
}
```

**Alternative**: Interfaces are optional; type guards for detection.

---

## Migration Guide

No migration required for any task. All changes are opt-in:

```typescript
// Old code (still works):
class MyViewModel extends BaseViewModel<MyModel> {
  saveCommand = new Command(() => this.save());
}

// New code (optional enhancements):
class MyViewModel extends BaseViewModel<MyModel> {
  saveCommand = this.registerCommand(
    new Command(() => this.save())
      .observesCanExecute(this.canSave$)
  );
}
```

---

## Version Compatibility

| Enhancement Version | mvvm-core | forms-core | router-core |
|--------------------|-----------|------------|-------------|
| All tasks | Compatible | Compatible | Compatible |

---

## If Breaking Changes Become Necessary

Future breaking changes will follow this process:

1. **Major version bump** (semver)
2. **Deprecation warnings** in minor version before removal
3. **Migration guide** in this document
4. **Codemods** where possible for automated migration

---

## Questions?

If you encounter unexpected behavior after implementing these tasks:

1. Verify you're using the correct package versions
2. Check that new methods/classes are imported from correct locations
3. Ensure TypeScript is configured correctly for the monorepo
