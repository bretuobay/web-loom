# Task: Navigation Aware Interfaces

**Target Package**: `packages/router-core`
**Priority**: P1 (High Impact, Medium Effort)
**Status**: Not Started
**Estimated Files**: 4-5 new files
**Breaking Changes**: None (additive interfaces)

---

## Overview

Implement navigation lifecycle interfaces that allow ViewModels to participate in navigation events:

- `INavigationAware` - Lifecycle hooks for navigation to/from
- `IConfirmNavigationRequest` - Confirm/cancel navigation (unsaved changes)
- `IInitializeAsync` - Async initialization separate from constructor

## Target Location

```
packages/router-core/src/
├── lifecycle/
│   ├── types.ts                      (NEW)
│   ├── INavigationAware.ts           (NEW)
│   ├── IConfirmNavigationRequest.ts  (NEW)
│   ├── IInitializeAsync.ts           (NEW)
│   ├── IViewLifetime.ts              (NEW)
│   └── index.ts                      (NEW)
└── index.ts                          (update exports)
```

**Note**: Check existing `packages/router-core` structure and adapt paths accordingly.

## Web Use Cases

- Loading data when navigating to a page
- Saving state when navigating away
- "You have unsaved changes" prompts
- View reuse optimization
- Deep linking with parameter extraction

## Implementation Steps

### Step 1: Create Navigation Types

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

  /** Previous URI (if available) */
  readonly previousUri?: string;
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
 * - Determine if they are the target for a navigation request (view reuse)
 * - Respond when navigated to (load data, read parameters)
 * - Respond when navigated away (save state, cleanup)
 */
export interface INavigationAware {
  /**
   * Determines if this ViewModel should handle the navigation request.
   * Return true to reuse this ViewModel instance instead of creating a new one.
   *
   * @param context The navigation context
   * @returns true if this ViewModel can handle the navigation
   *
   * @example
   * // Reuse detail view for same entity type
   * isNavigationTarget(context: NavigationContext): boolean {
   *   return context.parameters['type'] === this.entityType;
   * }
   */
  isNavigationTarget(context: NavigationContext): boolean;

  /**
   * Called when navigating TO this ViewModel.
   * Use this to read parameters, load data, initialize state.
   *
   * @param context The navigation context
   *
   * @example
   * async onNavigatedTo(context: NavigationContext): Promise<void> {
   *   this.customerId = context.parameters['id'];
   *   await this.loadCustomerCommand.execute(this.customerId);
   * }
   */
  onNavigatedTo(context: NavigationContext): void | Promise<void>;

  /**
   * Called when navigating AWAY from this ViewModel.
   * Use this to save state, cleanup resources, cancel operations.
   *
   * @param context The navigation context (of the destination)
   *
   * @example
   * onNavigatedFrom(context: NavigationContext): void {
   *   this.cancelPendingRequests();
   *   this.saveScrollPosition();
   * }
   */
  onNavigatedFrom(context: NavigationContext): void | Promise<void>;
}

/**
 * Type guard to check if an object implements INavigationAware
 */
export function isNavigationAware(obj: any): obj is INavigationAware {
  return (
    obj !== null &&
    typeof obj === 'object' &&
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
import { INavigationAware, isNavigationAware } from './INavigationAware';

/**
 * Extends INavigationAware to add the ability to confirm or cancel navigation.
 * Implement this for "unsaved changes" prompts.
 */
export interface IConfirmNavigationRequest extends INavigationAware {
  /**
   * Called before navigation occurs, allowing the ViewModel to
   * confirm or cancel the navigation.
   *
   * @param context The navigation context (of the destination)
   * @param callback Call with true to allow navigation, false to cancel
   *
   * @example
   * async confirmNavigationRequest(
   *   context: NavigationContext,
   *   callback: NavigationCallback
   * ): Promise<void> {
   *   if (!this.hasUnsavedChanges) {
   *     callback(true);
   *     return;
   *   }
   *
   *   const confirmed = await this.showConfirmDialog(
   *     'You have unsaved changes. Leave anyway?'
   *   );
   *   callback(confirmed);
   * }
   */
  confirmNavigationRequest(context: NavigationContext, callback: NavigationCallback): void | Promise<void>;
}

/**
 * Type guard for IConfirmNavigationRequest
 */
export function isConfirmNavigationRequest(obj: any): obj is IConfirmNavigationRequest {
  return isNavigationAware(obj) && typeof obj.confirmNavigationRequest === 'function';
}
```

### Step 4: Create IInitializeAsync Interface

Create `src/lifecycle/IInitializeAsync.ts`:

```typescript
/**
 * Synchronous initialization interface.
 * Called after constructor with navigation parameters.
 */
export interface IInitialize {
  /**
   * Initialize the ViewModel with parameters.
   * Called synchronously after construction.
   */
  initialize(parameters: Record<string, any>): void;
}

/**
 * Async initialization interface.
 * Separates heavy initialization from constructor.
 *
 * Benefits:
 * - Async operations without blocking instantiation
 * - Navigation parameters available during init
 * - Better testability (can test without triggering init)
 */
export interface IInitializeAsync {
  /**
   * Initialize the ViewModel asynchronously.
   * Called after constructor, before ViewModel is used.
   *
   * @example
   * async initializeAsync(parameters: Record<string, any>): Promise<void> {
   *   this.userId = parameters['id'];
   *   await this.loadUserData();
   *   this.setupSubscriptions();
   * }
   */
  initializeAsync(parameters: Record<string, any>): Promise<void>;
}

/**
 * Type guards
 */
export function hasInitialize(obj: any): obj is IInitialize {
  return obj !== null && typeof obj === 'object' && typeof obj.initialize === 'function';
}

export function hasInitializeAsync(obj: any): obj is IInitializeAsync {
  return obj !== null && typeof obj === 'object' && typeof obj.initializeAsync === 'function';
}
```

### Step 5: Create IViewLifetime Interface

Create `src/lifecycle/IViewLifetime.ts`:

```typescript
/**
 * Controls whether a ViewModel is kept alive when deactivated.
 * Used by router to determine caching behavior.
 */
export interface IViewLifetime {
  /**
   * When false, the ViewModel is disposed when navigating away.
   * When true, the ViewModel is kept in memory for fast reactivation.
   *
   * @example
   * // Keep list views alive for fast back navigation
   * class CustomerListViewModel implements IViewLifetime {
   *   readonly keepAlive = true;
   * }
   *
   * // Don't keep detail views (different data each time)
   * class CustomerDetailViewModel implements IViewLifetime {
   *   readonly keepAlive = false;
   * }
   */
  readonly keepAlive: boolean;
}

/**
 * Type guard
 */
export function hasViewLifetime(obj: any): obj is IViewLifetime {
  return obj !== null && typeof obj === 'object' && typeof obj.keepAlive === 'boolean';
}
```

### Step 6: Create Lifecycle Index

Create `src/lifecycle/index.ts`:

```typescript
export * from './types';
export * from './INavigationAware';
export * from './IConfirmNavigationRequest';
export * from './IInitializeAsync';
export * from './IViewLifetime';
```

### Step 7: Add Tests

Create `src/lifecycle/lifecycle.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import {
  isNavigationAware,
  isConfirmNavigationRequest,
  hasInitialize,
  hasInitializeAsync,
  hasViewLifetime,
  NavigationContext,
} from './index';

describe('Navigation Lifecycle Type Guards', () => {
  const mockContext: NavigationContext = {
    parameters: { id: '123' },
    uri: '/customers/123',
    navigationMode: 'new',
  };

  describe('isNavigationAware', () => {
    it('should return true for implementing objects', () => {
      const obj = {
        isNavigationTarget: () => true,
        onNavigatedTo: () => {},
        onNavigatedFrom: () => {},
      };
      expect(isNavigationAware(obj)).toBe(true);
    });

    it('should return false for non-implementing objects', () => {
      expect(isNavigationAware({})).toBe(false);
      expect(isNavigationAware(null)).toBe(false);
      expect(isNavigationAware({ onNavigatedTo: () => {} })).toBe(false);
    });
  });

  describe('isConfirmNavigationRequest', () => {
    it('should return true for implementing objects', () => {
      const obj = {
        isNavigationTarget: () => true,
        onNavigatedTo: () => {},
        onNavigatedFrom: () => {},
        confirmNavigationRequest: () => {},
      };
      expect(isConfirmNavigationRequest(obj)).toBe(true);
    });

    it('should return false if missing INavigationAware methods', () => {
      const obj = {
        confirmNavigationRequest: () => {},
      };
      expect(isConfirmNavigationRequest(obj)).toBe(false);
    });
  });

  describe('hasInitialize', () => {
    it('should return true for implementing objects', () => {
      const obj = { initialize: () => {} };
      expect(hasInitialize(obj)).toBe(true);
    });

    it('should return false for non-implementing objects', () => {
      expect(hasInitialize({})).toBe(false);
    });
  });

  describe('hasInitializeAsync', () => {
    it('should return true for implementing objects', () => {
      const obj = { initializeAsync: async () => {} };
      expect(hasInitializeAsync(obj)).toBe(true);
    });
  });

  describe('hasViewLifetime', () => {
    it('should return true for keepAlive: true', () => {
      expect(hasViewLifetime({ keepAlive: true })).toBe(true);
    });

    it('should return true for keepAlive: false', () => {
      expect(hasViewLifetime({ keepAlive: false })).toBe(true);
    });

    it('should return false for missing keepAlive', () => {
      expect(hasViewLifetime({})).toBe(false);
    });
  });
});
```

### Step 8: Update Package Index

Update `packages/router-core/src/index.ts`:

```typescript
// ... existing exports ...

export * from './lifecycle';
```

---

## Acceptance Criteria

- [ ] `NavigationContext` type defined with parameters, uri, navigationMode
- [ ] `INavigationAware` interface with isNavigationTarget, onNavigatedTo, onNavigatedFrom
- [ ] `IConfirmNavigationRequest` interface extending INavigationAware
- [ ] `IInitialize` and `IInitializeAsync` interfaces
- [ ] `IViewLifetime` interface with keepAlive
- [ ] Type guards for all interfaces
- [ ] Unit tests for type guards
- [ ] Exported from package index

---

## Router Integration Example

```typescript
// In router-core navigation logic
async function navigate(uri: string, params: Record<string, any>) {
  const currentVM = getCurrentViewModel();
  const context: NavigationContext = { uri, parameters: params, navigationMode: 'new' };

  // Check for confirmation
  if (isConfirmNavigationRequest(currentVM)) {
    const canNavigate = await new Promise<boolean>((resolve) => {
      currentVM.confirmNavigationRequest(context, resolve);
    });
    if (!canNavigate) return; // Navigation cancelled
  }

  // Notify current VM of navigation away
  if (isNavigationAware(currentVM)) {
    await currentVM.onNavigatedFrom(context);
  }

  // Create or reuse ViewModel
  const newVM = createOrReuseViewModel(uri);

  // Initialize if needed
  if (hasInitializeAsync(newVM)) {
    await newVM.initializeAsync(params);
  } else if (hasInitialize(newVM)) {
    newVM.initialize(params);
  }

  // Notify new VM of navigation to
  if (isNavigationAware(newVM)) {
    await newVM.onNavigatedTo(context);
  }
}
```

---

## Dependencies

- None (pure interfaces and type guards)
