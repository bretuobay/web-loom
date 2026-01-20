# Task: Navigation Aware Interfaces

**Priority**: P1 (High Impact, Medium Effort)
**Status**: Not Started
**Estimated Files**: 2-3 new files
**Breaking Changes**: None (additive interfaces)

---

## Overview

Implement navigation lifecycle interfaces that allow ViewModels to participate in navigation events:
- `INavigationAware` - Lifecycle hooks for navigation to/from
- `IConfirmNavigationRequest` - Ability to confirm/cancel navigation (unsaved changes)
- `IInitializeAsync` - Async initialization separate from constructor

These interfaces define contracts that can be integrated with any router (router-core, React Router, Vue Router, Angular Router).

## Web Relevance Assessment

**Highly relevant for SPA development:**
- Loading data when navigating to a page
- Saving/discarding state when navigating away
- "You have unsaved changes" prompts
- View reuse optimization (same ViewModel for different parameters)
- Async initialization without blocking instantiation
- Deep linking with parameter extraction

## Implementation Steps

### Step 1: Create Navigation Context Type

Create `src/lifecycle/types.ts`:

```typescript
/**
 * Navigation mode indicating how the navigation was triggered
 */
export type NavigationMode = 'new' | 'back' | 'forward' | 'replace' | 'refresh';

/**
 * Context passed to navigation lifecycle methods
 */
export interface NavigationContext {
  /** Route parameters (e.g., { id: '123' }) */
  readonly parameters: Record<string, any>;

  /** Current URI/path */
  readonly uri: string;

  /** How navigation was triggered */
  readonly navigationMode: NavigationMode;

  /** Query string parameters */
  readonly queryParams?: Record<string, string>;

  /** State passed during navigation */
  readonly state?: any;
}

/**
 * Callback for navigation confirmation
 */
export type NavigationCallback = (canNavigate: boolean) => void;
```

### Step 2: Create INavigationAware Interface

Create `src/lifecycle/INavigationAware.ts`:

```typescript
import { NavigationContext } from './types';

/**
 * Implement this interface to participate in navigation lifecycle.
 * ViewModels implementing this interface can:
 * - Determine if they are the target for a navigation request
 * - Respond when navigated to (load data, read parameters)
 * - Respond when navigated away (save state, cleanup)
 */
export interface INavigationAware {
  /**
   * Determines if this ViewModel should handle the navigation request.
   * Useful for view reuse - e.g., detail view can stay active
   * if showing different items of the same type.
   *
   * @param context The navigation context
   * @returns true if this ViewModel can handle the navigation
   */
  isNavigationTarget(context: NavigationContext): boolean;

  /**
   * Called when navigating TO this ViewModel.
   * Use this to:
   * - Read navigation parameters
   * - Load data based on parameters
   * - Initialize state
   *
   * @param context The navigation context
   */
  onNavigatedTo(context: NavigationContext): void | Promise<void>;

  /**
   * Called when navigating AWAY from this ViewModel.
   * Use this to:
   * - Save state
   * - Cleanup resources
   * - Cancel pending operations
   *
   * @param context The navigation context (of the destination)
   */
  onNavigatedFrom(context: NavigationContext): void | Promise<void>;
}

/**
 * Type guard to check if an object implements INavigationAware
 */
export function isNavigationAware(obj: any): obj is INavigationAware {
  return (
    obj &&
    typeof obj.isNavigationTarget === 'function' &&
    typeof obj.onNavigatedTo === 'function' &&
    typeof obj.onNavigatedFrom === 'function'
  );
}
```

### Step 3: Create IConfirmNavigationRequest Interface

Create `src/lifecycle/IConfirmNavigationRequest.ts`:

```typescript
import { NavigationContext, NavigationCallback } from './types';
import { INavigationAware } from './INavigationAware';

/**
 * Extends INavigationAware to add the ability to confirm or cancel navigation.
 * Use this for "unsaved changes" prompts.
 */
export interface IConfirmNavigationRequest extends INavigationAware {
  /**
   * Called before navigation occurs, allowing the ViewModel to
   * confirm or cancel the navigation.
   *
   * @param context The navigation context (of the destination)
   * @param callback Call with true to allow navigation, false to cancel
   */
  confirmNavigationRequest(
    context: NavigationContext,
    callback: NavigationCallback
  ): void | Promise<void>;
}

/**
 * Type guard for IConfirmNavigationRequest
 */
export function isConfirmNavigationRequest(obj: any): obj is IConfirmNavigationRequest {
  return (
    isNavigationAware(obj) &&
    typeof obj.confirmNavigationRequest === 'function'
  );
}

// Re-export for convenience
import { isNavigationAware } from './INavigationAware';
```

### Step 4: Create IInitializeAsync Interface

Create `src/lifecycle/IInitializeAsync.ts`:

```typescript
/**
 * Interface for ViewModels that need async initialization
 * separate from their constructor.
 *
 * Benefits over constructor:
 * - Async operations without blocking instantiation
 * - Navigation parameters available during init
 * - Better testability (can test without triggering init)
 * - Framework can instantiate, then call initialize
 */
export interface IInitialize {
  /**
   * Synchronous initialization with parameters
   */
  initialize(parameters: Record<string, any>): void;
}

export interface IInitializeAsync {
  /**
   * Async initialization with parameters
   * Called after constructor, before ViewModel is used
   */
  initializeAsync(parameters: Record<string, any>): Promise<void>;
}

/**
 * Type guards
 */
export function hasInitialize(obj: any): obj is IInitialize {
  return obj && typeof obj.initialize === 'function';
}

export function hasInitializeAsync(obj: any): obj is IInitializeAsync {
  return obj && typeof obj.initializeAsync === 'function';
}
```

### Step 5: Create IDestructible Interface

Create `src/lifecycle/IDestructible.ts`:

```typescript
/**
 * Interface for ViewModels that need cleanup notification
 * before disposal.
 *
 * Different from dispose():
 * - onDestroy() is called BEFORE resources are released
 * - Can perform async cleanup
 * - Can save state
 * - dispose() handles actual resource cleanup
 */
export interface IDestructible {
  /**
   * Called when the ViewModel is about to be destroyed.
   * Perform final cleanup, save state, etc.
   */
  onDestroy(): void | Promise<void>;
}

/**
 * Type guard
 */
export function isDestructible(obj: any): obj is IDestructible {
  return obj && typeof obj.onDestroy === 'function';
}
```

### Step 6: Create IViewLifetime Interface

Create `src/lifecycle/IViewLifetime.ts`:

```typescript
/**
 * Controls whether a ViewModel is kept alive when deactivated.
 * Used by frameworks/routers to determine caching behavior.
 */
export interface IViewLifetime {
  /**
   * When false, the ViewModel is disposed when navigating away.
   * When true, the ViewModel is kept in memory for fast reactivation.
   *
   * Set to true for:
   * - List views that are expensive to rebuild
   * - Views with significant user state
   *
   * Set to false for:
   * - Detail views with different data each time
   * - Views that should always show fresh data
   */
  readonly keepAlive: boolean;
}

/**
 * Type guard
 */
export function hasViewLifetime(obj: any): obj is IViewLifetime {
  return obj && typeof obj.keepAlive === 'boolean';
}
```

### Step 7: Create Lifecycle Index

Create `src/lifecycle/index.ts`:

```typescript
export * from './types';
export * from './INavigationAware';
export * from './IConfirmNavigationRequest';
export * from './IInitializeAsync';
export * from './IDestructible';
export * from './IViewLifetime';
```

### Step 8: Add Tests

Create `src/lifecycle/lifecycle.test.ts`:

1. **Type guard tests:**
   - isNavigationAware correctly identifies implementing objects
   - isConfirmNavigationRequest correctly identifies implementing objects
   - hasInitialize/hasInitializeAsync work correctly
   - isDestructible works correctly
   - hasViewLifetime works correctly

2. **Interface implementation tests:**
   - Create mock classes implementing each interface
   - Verify methods are called with correct parameters

### Step 9: Add Example ViewModel

Create `src/examples/navigation-aware-example.ts`:

```typescript
class CustomerDetailViewModel
  extends BaseViewModel<CustomerModel>
  implements INavigationAware, IConfirmNavigationRequest, IInitializeAsync {

  private currentCustomerId: string | null = null;
  private hasUnsavedChanges = false;

  // IInitializeAsync
  async initializeAsync(parameters: Record<string, any>): Promise<void> {
    this.currentCustomerId = parameters['id'];
    await this.loadCustomer();
  }

  // INavigationAware
  isNavigationTarget(context: NavigationContext): boolean {
    // Reuse this ViewModel if same customer ID
    return this.currentCustomerId === context.parameters['id'];
  }

  async onNavigatedTo(context: NavigationContext): Promise<void> {
    if (this.currentCustomerId !== context.parameters['id']) {
      this.currentCustomerId = context.parameters['id'];
      await this.loadCustomer();
    }
  }

  async onNavigatedFrom(context: NavigationContext): Promise<void> {
    // Auto-save drafts
    if (this.hasUnsavedChanges) {
      await this.saveDraft();
    }
  }

  // IConfirmNavigationRequest
  async confirmNavigationRequest(
    context: NavigationContext,
    callback: NavigationCallback
  ): Promise<void> {
    if (!this.hasUnsavedChanges) {
      callback(true);
      return;
    }

    // Would use InteractionRequest in real implementation
    const confirmed = window.confirm(
      'You have unsaved changes. Are you sure you want to leave?'
    );
    callback(confirmed);
  }
}
```

### Step 10: Export from Main Index

Update `src/index.ts`:

```typescript
export * from './lifecycle';
```

---

## Acceptance Criteria

- [ ] `NavigationContext` type defined
- [ ] `INavigationAware` interface with isNavigationTarget, onNavigatedTo, onNavigatedFrom
- [ ] `IConfirmNavigationRequest` interface extending INavigationAware
- [ ] `IInitialize` and `IInitializeAsync` interfaces
- [ ] `IDestructible` interface
- [ ] `IViewLifetime` interface
- [ ] Type guards for all interfaces
- [ ] Unit tests for type guards
- [ ] Example ViewModel implementing interfaces
- [ ] Exported from package index
- [ ] Documentation for router integration patterns

---

## Router Integration Notes

These interfaces are **router-agnostic**. Integration with specific routers:

**router-core (Web Loom):**
```typescript
// Router checks if ViewModel implements INavigationAware
if (isNavigationAware(viewModel)) {
  await viewModel.onNavigatedTo(context);
}
```

**React Router:**
```typescript
// Custom hook that calls lifecycle methods
function useNavigationAware(viewModel: INavigationAware) {
  const location = useLocation();
  const params = useParams();

  useEffect(() => {
    viewModel.onNavigatedTo({ uri: location.pathname, parameters: params, ... });
    return () => viewModel.onNavigatedFrom({ ... });
  }, [location]);
}
```

**Vue Router:**
```typescript
// Navigation guard
router.beforeResolve(async (to, from, next) => {
  const vm = getCurrentViewModel();
  if (isConfirmNavigationRequest(vm)) {
    await vm.confirmNavigationRequest(context, (can) => can ? next() : next(false));
  } else {
    next();
  }
});
```

---

## Dependencies

- None (pure interfaces and type guards)

---

## Breaking Changes

**None** - All interfaces are optional:
- ViewModels can implement any subset
- Type guards allow runtime detection
- No changes to BaseViewModel required
