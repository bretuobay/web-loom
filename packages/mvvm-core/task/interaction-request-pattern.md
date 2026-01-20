# Task: Interaction Request Pattern

**Priority**: P1 (High Impact, Medium Effort)
**Status**: Not Started
**Estimated Files**: 3-4 new files
**Breaking Changes**: None (additive feature)

---

## Overview

Implement the `InteractionRequest<T>` pattern that allows ViewModels to request interactions from the View (dialogs, confirmations, notifications) without direct coupling. This maintains MVVM separation while enabling ViewModel-driven UI interactions.

## Web Relevance Assessment

**Highly relevant for web development:**
- Confirmation dialogs before destructive actions (delete, discard changes)
- Toast/snackbar notifications triggered by ViewModel logic
- File picker requests from ViewModel
- Form submission confirmations
- Error dialogs with retry options
- Navigation confirmations (unsaved changes)

**Framework-agnostic benefit**: Same ViewModel works with React, Vue, Angular, or vanilla JS - only the View binding differs.

## Implementation Steps

### Step 1: Create Core Interfaces

Create `src/interactions/types.ts`:

```typescript
/**
 * Base notification data for interaction requests
 */
export interface INotification {
  title?: string;
  content: string;
}

/**
 * Confirmation request with response
 */
export interface IConfirmation extends INotification {
  confirmed?: boolean;
}

/**
 * Input request with response
 */
export interface IInputRequest extends INotification {
  inputValue?: string;
  placeholder?: string;
  inputType?: 'text' | 'number' | 'email' | 'password';
}

/**
 * Selection request with options
 */
export interface ISelectionRequest<T> extends INotification {
  options: Array<{ label: string; value: T }>;
  selectedValue?: T;
  allowMultiple?: boolean;
}

/**
 * Event emitted when interaction is requested
 */
export interface InteractionRequestedEvent<T> {
  readonly context: T;
  callback: (response: T) => void;
}
```

### Step 2: Implement InteractionRequest Class

Create `src/interactions/InteractionRequest.ts`:

```typescript
import { Observable, Subject } from 'rxjs';
import { INotification, InteractionRequestedEvent } from './types';

/**
 * Enables ViewModels to request interactions from Views
 * without direct coupling to UI components
 */
export class InteractionRequest<T extends INotification> {
  private readonly _requested$ = new Subject<InteractionRequestedEvent<T>>();

  /**
   * Observable that Views subscribe to for handling interaction requests
   */
  public readonly requested$: Observable<InteractionRequestedEvent<T>> =
    this._requested$.asObservable();

  /**
   * Raise an interaction request
   * @param context The interaction context/data
   * @param callback Optional callback for the response
   */
  raise(context: T, callback?: (response: T) => void): void {
    this._requested$.next({
      context,
      callback: callback || (() => {})
    });
  }

  /**
   * Raise an interaction request and return a Promise
   * Useful for async/await style code
   */
  raiseAsync(context: T): Promise<T> {
    return new Promise((resolve) => {
      this.raise(context, resolve);
    });
  }

  /**
   * Clean up
   */
  dispose(): void {
    this._requested$.complete();
  }
}
```

### Step 3: Create Specialized Request Types

Create `src/interactions/requests.ts`:

```typescript
import { InteractionRequest } from './InteractionRequest';
import { IConfirmation, INotification, IInputRequest, ISelectionRequest } from './types';

/**
 * Request for confirmation dialogs (Yes/No, OK/Cancel)
 */
export class ConfirmationRequest extends InteractionRequest<IConfirmation> {}

/**
 * Request for simple notifications (toast, snackbar)
 */
export class NotificationRequest extends InteractionRequest<INotification> {}

/**
 * Request for user text input
 */
export class InputRequest extends InteractionRequest<IInputRequest> {}

/**
 * Request for selection from options
 */
export class SelectionRequest<T> extends InteractionRequest<ISelectionRequest<T>> {}
```

### Step 4: Add Tests

Create `src/interactions/InteractionRequest.test.ts`:

1. **Basic raise tests:**
   - raise() emits event on requested$
   - Context is passed correctly
   - Callback is invoked when called

2. **raiseAsync tests:**
   - Returns Promise
   - Promise resolves with response
   - Works with async/await

3. **Multiple requests tests:**
   - Can handle sequential requests
   - Each request gets its own callback

4. **Disposal tests:**
   - dispose() completes requested$
   - No emissions after disposal

5. **Type-specific tests:**
   - ConfirmationRequest with confirmed flag
   - InputRequest with inputValue
   - SelectionRequest with selectedValue

### Step 5: Add ViewModel Integration Example

Create `src/examples/interaction-request-example.ts`:

```typescript
class OrderViewModel extends BaseViewModel<OrderModel> {
  // Interaction requests
  public readonly confirmDeleteRequest = new ConfirmationRequest();
  public readonly notifySuccessRequest = new NotificationRequest();
  public readonly editNameRequest = new InputRequest();

  public readonly deleteCommand = new Command(async () => {
    // Request confirmation from View
    const response = await this.confirmDeleteRequest.raiseAsync({
      title: 'Delete Order',
      content: 'Are you sure you want to delete this order? This cannot be undone.'
    });

    if (response.confirmed) {
      await this.performDelete();

      // Notify success
      this.notifySuccessRequest.raise({
        title: 'Success',
        content: 'Order deleted successfully'
      });
    }
  });

  public readonly renameCommand = new Command(async () => {
    const response = await this.editNameRequest.raiseAsync({
      title: 'Rename Order',
      content: 'Enter a new name for this order:',
      inputValue: this.model.data?.name || '',
      placeholder: 'Order name'
    });

    if (response.inputValue) {
      await this.updateName(response.inputValue);
    }
  });
}
```

### Step 6: Document View Binding Patterns

Add examples for different frameworks:

**React:**
```typescript
function OrderView() {
  const [vm] = useState(() => new OrderViewModel(new OrderModel()));
  const [confirmDialog, setConfirmDialog] = useState<IConfirmation | null>(null);
  const [dialogCallback, setDialogCallback] = useState<((r: IConfirmation) => void) | null>(null);

  useEffect(() => {
    const sub = vm.confirmDeleteRequest.requested$.subscribe(event => {
      setConfirmDialog(event.context);
      setDialogCallback(() => event.callback);
    });
    return () => { sub.unsubscribe(); vm.dispose(); };
  }, []);

  return (
    <>
      <button onClick={() => vm.deleteCommand.execute()}>Delete</button>
      {confirmDialog && (
        <ConfirmDialog
          title={confirmDialog.title}
          message={confirmDialog.content}
          onConfirm={() => {
            dialogCallback?.({ ...confirmDialog, confirmed: true });
            setConfirmDialog(null);
          }}
          onCancel={() => {
            dialogCallback?.({ ...confirmDialog, confirmed: false });
            setConfirmDialog(null);
          }}
        />
      )}
    </>
  );
}
```

### Step 7: Export from Index

Update `src/index.ts`:

```typescript
export { InteractionRequest } from './interactions/InteractionRequest';
export { ConfirmationRequest, NotificationRequest, InputRequest, SelectionRequest } from './interactions/requests';
export type { INotification, IConfirmation, IInputRequest, ISelectionRequest, InteractionRequestedEvent } from './interactions/types';
```

---

## Acceptance Criteria

- [ ] `InteractionRequest<T>` base class implemented
- [ ] `raise()` method works with callback
- [ ] `raiseAsync()` method returns Promise
- [ ] Specialized request types: Confirmation, Notification, Input, Selection
- [ ] dispose() properly cleans up
- [ ] Unit tests for all functionality
- [ ] Example demonstrating ViewModel usage
- [ ] Documentation for View binding patterns (React/Vue/Angular)
- [ ] Exported from package index

---

## Integration Notes

### With NotificationService

The existing `NotificationService` in mvvm-core can be enhanced or replaced with this pattern:
- `NotificationService` is for app-wide notifications
- `InteractionRequest` is for ViewModel-specific interactions
- They can coexist or InteractionRequest can use NotificationService internally

### With Commands

Commands can use InteractionRequest for:
- Pre-execution confirmation
- Post-execution notification
- Error handling dialogs

---

## Dependencies

- RxJS `Subject`, `Observable`
- No external UI dependencies (framework-agnostic)

---

## Breaking Changes

**None** - This is a new feature:
- New files only
- No modifications to existing code
- Optional integration with existing patterns
