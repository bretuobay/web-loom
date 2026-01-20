# MVVM-Core Breaking Changes Documentation

This document tracks any breaking changes introduced by the Prism-inspired enhancements. All tasks are designed to be **non-breaking** and **additive**, but this document serves as the official record.

---

## Current Status: No Breaking Changes

All tasks in this enhancement series are designed to be backward compatible:

| Task | Breaking Changes | Notes |
|------|------------------|-------|
| CompositeCommand | None | New class, no changes to existing Command |
| Command Fluent API | None | New methods added, existing API unchanged |
| InteractionRequest | None | New feature, no existing code modified |
| Property-Level Validation | None | New ErrorsContainer class, existing validation unchanged |
| Navigation Aware Interfaces | None | New interfaces, ViewModels can optionally implement |
| Active Aware Pattern | None | New interface and optional base class |
| Busy State Management | None | New BusyState class, optional BaseViewModel enhancement |
| Dirty Tracking | None | New DirtyTracker class and optional base class |
| Automatic Command Disposal | None | New registerCommand() method, existing behavior unchanged |

---

## Potential Future Breaking Changes

The following changes were considered but **NOT** included to maintain backward compatibility:

### 1. ICommand Interface Extension

**Not Implemented** - Would break existing ICommand implementations:
```typescript
// CONSIDERED BUT NOT DONE:
interface ICommand<TParam, TResult> {
  // ... existing
  dispose(): void; // Would require all implementations to add this
}
```

**Instead**: Commands can optionally have dispose(), checked at runtime.

### 2. BaseViewModel Constructor Change

**Not Implemented** - Would break all ViewModel subclasses:
```typescript
// CONSIDERED BUT NOT DONE:
constructor(model: TModel, options?: ViewModelOptions) {
  // Additional options parameter would break existing constructors
}
```

**Instead**: Features like BusyState are added via protected properties.

### 3. Mandatory Lifecycle Interface

**Not Implemented** - Would require changes to all ViewModels:
```typescript
// CONSIDERED BUT NOT DONE:
abstract class BaseViewModel implements INavigationAware {
  abstract onNavigatedTo(context: NavigationContext): void;
  // Would require all subclasses to implement
}
```

**Instead**: Lifecycle interfaces are optional; ViewModels implement them only if needed.

---

## Migration Guide (If Breaking Changes Occur)

This section will be updated if any breaking changes are introduced in future versions.

### Version X.Y.Z (Future)

No breaking changes planned.

---

## Compatibility Matrix

| mvvm-core Version | Compatible With | Notes |
|-------------------|-----------------|-------|
| Current + Enhancements | All existing apps | Fully backward compatible |

---

## How Breaking Changes Will Be Handled

If breaking changes become necessary:

1. **Major Version Bump**: Breaking changes only in major versions
2. **Migration Guide**: This document will include step-by-step migration
3. **Deprecation Period**: APIs will be deprecated before removal
4. **Codemods**: Automated migration scripts where possible

---

## Reporting Issues

If you encounter unexpected breaking changes after implementing these enhancements:

1. Check if you're using internal/undocumented APIs
2. Verify your TypeScript version compatibility
3. Report issues with:
   - mvvm-core version
   - TypeScript version
   - Minimal reproduction
   - Expected vs actual behavior

---

## Changelog

### Enhancement Phase 1 (Planned)

**P0 Tasks:**
- [ ] CompositeCommand (additive)
- [ ] Command Fluent API (additive)

**P1 Tasks:**
- [ ] InteractionRequest (additive)
- [ ] Property-Level Validation (additive)
- [ ] Navigation Aware Interfaces (additive)

**P2 Tasks:**
- [ ] Active Aware Pattern (additive)
- [ ] Busy State Management (additive)

**P3 Tasks:**
- [ ] Dirty Tracking (additive)
- [ ] Automatic Command Disposal (additive)

---

## Design Principles

These principles guide our approach to avoid breaking changes:

1. **Additive Over Modifying**: New classes/interfaces instead of modifying existing
2. **Optional Features**: All enhancements are opt-in
3. **Runtime Checks**: Type guards instead of mandatory interface implementation
4. **Composition Over Inheritance**: Mixins and composition when possible
5. **Default Behavior Preserved**: Existing code works without changes
