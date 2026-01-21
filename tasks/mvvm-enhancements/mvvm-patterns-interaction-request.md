# Task: Interaction Request Pattern

**Target Package**: `packages/mvvm-patterns`
**Priority**: P1 (High Impact, Medium Effort)
**Status**: Not Started
**Estimated Files**: 4 new files
**Breaking Changes**: None (new package feature)

---

## Overview

Implement the `InteractionRequest<T>` pattern that allows ViewModels to request interactions from the View (dialogs, confirmations, notifications) without direct coupling. This maintains MVVM separation while enabling ViewModel-driven UI interactions.

## Target Location

```
packages/mvvm-patterns/src/
├── interactions/
│   ├── types.ts                (NEW)
│   ├── InteractionRequest.ts   (NEW)
│   ├── requests.ts             (NEW)
│   ├── index.ts                (NEW)
│   └── InteractionRequest.test.ts (NEW)
└── index.ts                    (update exports)
```

**Prerequisite**: Complete `mvvm-patterns-package-setup.md` first.

## Web Use Cases

- Confirmation dialogs before destructive actions
- Toast/snackbar notifications from ViewModel logic
- File picker requests
- Form submission confirmations
- Error dialogs with retry options

## Implementation Steps

### Step 1: Create Interaction Types

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
  confirmText?: string;
  cancelText?: string;
}

/**
 * Input request with response
 */
export interface IInputRequest extends INotification {
  inputValue?: string;
  placeholder?: string;
  inputType?: 'text' | 'number' | 'email' | 'password';
  defaultValue?: string;
}

/**
 * Selection request with options
 */
export interface ISelectionRequest<T = string> extends INotification {
  options: Array<{ label: string; value: T }>;
  selectedValue?: T;
  allowMultiple?: boolean;
}

/**
 * Event emitted when interaction is requested
 */
export interface InteractionRequestedEvent<T> {
  /** The interaction context/data */
  readonly context: T;
  /** Callback to invoke with the response */
  callback: (response: T) => void;
}
```

### Step 2: Create InteractionRequest Class

Create `src/interactions/InteractionRequest.ts`:

```typescript
import { Observable, Subject } from 'rxjs';
import { INotification, InteractionRequestedEvent } from './types';

/**
 * Enables ViewModels to request interactions from Views
 * without direct coupling to UI components.
 *
 * The ViewModel raises a request, the View subscribes and handles it,
 * then calls the callback with the response.
 *
 * @template T The type of interaction data (must extend INotification)
 *
 * @example
 * // In ViewModel
 * class OrderViewModel {
 *   readonly confirmDelete = new InteractionRequest<IConfirmation>();
 *
 *   async deleteOrder() {
 *     const response = await this.confirmDelete.raiseAsync({
 *       title: 'Delete Order',
 *       content: 'Are you sure?'
 *     });
 *     if (response.confirmed) {
 *       await this.performDelete();
 *     }
 *   }
 * }
 *
 * // In View (React)
 * useEffect(() => {
 *   const sub = vm.confirmDelete.requested$.subscribe(event => {
 *     showDialog(event.context, (confirmed) => {
 *       event.callback({ ...event.context, confirmed });
 *     });
 *   });
 *   return () => sub.unsubscribe();
 * }, []);
 */
export class InteractionRequest<T extends INotification> {
  private readonly _requested$ = new Subject<InteractionRequestedEvent<T>>();

  /**
   * Observable that Views subscribe to for handling interaction requests.
   * Each emission contains the context and a callback for the response.
   */
  public readonly requested$: Observable<InteractionRequestedEvent<T>> = this._requested$.asObservable();

  /**
   * Raise an interaction request with a callback.
   *
   * @param context The interaction context/data
   * @param callback Optional callback for the response
   */
  raise(context: T, callback?: (response: T) => void): void {
    this._requested$.next({
      context,
      callback: callback || (() => {}),
    });
  }

  /**
   * Raise an interaction request and return a Promise.
   * Useful for async/await style code.
   *
   * @param context The interaction context/data
   * @returns Promise that resolves with the response
   *
   * @example
   * const response = await confirmRequest.raiseAsync({
   *   title: 'Confirm',
   *   content: 'Proceed?'
   * });
   * if (response.confirmed) { ... }
   */
  raiseAsync(context: T): Promise<T> {
    return new Promise<T>((resolve) => {
      this.raise(context, resolve);
    });
  }

  /**
   * Clean up resources
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
 * Request for confirmation dialogs (Yes/No, OK/Cancel).
 *
 * @example
 * const confirmDelete = new ConfirmationRequest();
 * const response = await confirmDelete.raiseAsync({
 *   title: 'Delete Item',
 *   content: 'This action cannot be undone.',
 *   confirmText: 'Delete',
 *   cancelText: 'Keep'
 * });
 */
export class ConfirmationRequest extends InteractionRequest<IConfirmation> {}

/**
 * Request for simple notifications (toast, snackbar, alert).
 *
 * @example
 * const notify = new NotificationRequest();
 * notify.raise({
 *   title: 'Success',
 *   content: 'Your changes have been saved.'
 * });
 */
export class NotificationRequest extends InteractionRequest<INotification> {}

/**
 * Request for user text input (prompt dialog).
 *
 * @example
 * const inputRequest = new InputRequest();
 * const response = await inputRequest.raiseAsync({
 *   title: 'Rename',
 *   content: 'Enter new name:',
 *   defaultValue: currentName,
 *   placeholder: 'Item name'
 * });
 * if (response.inputValue) { ... }
 */
export class InputRequest extends InteractionRequest<IInputRequest> {}

/**
 * Request for selection from a list of options.
 *
 * @example
 * const selectRequest = new SelectionRequest<Priority>();
 * const response = await selectRequest.raiseAsync({
 *   title: 'Set Priority',
 *   content: 'Choose priority level:',
 *   options: [
 *     { label: 'High', value: Priority.High },
 *     { label: 'Medium', value: Priority.Medium },
 *     { label: 'Low', value: Priority.Low }
 *   ]
 * });
 */
export class SelectionRequest<T = string> extends InteractionRequest<ISelectionRequest<T>> {}
```

### Step 4: Create Interactions Index

Create `src/interactions/index.ts`:

```typescript
export * from './types';
export { InteractionRequest } from './InteractionRequest';
export { ConfirmationRequest, NotificationRequest, InputRequest, SelectionRequest } from './requests';
```

### Step 5: Add Tests

Create `src/interactions/InteractionRequest.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { firstValueFrom } from 'rxjs';
import { take, toArray } from 'rxjs/operators';
import { InteractionRequest, ConfirmationRequest, IConfirmation, INotification } from './index';

describe('InteractionRequest', () => {
  describe('raise', () => {
    it('should emit event on requested$', async () => {
      const request = new InteractionRequest<INotification>();
      const eventPromise = firstValueFrom(request.requested$);

      request.raise({ content: 'Test message' });

      const event = await eventPromise;
      expect(event.context.content).toBe('Test message');
    });

    it('should invoke callback when provided', () => {
      const request = new InteractionRequest<INotification>();
      const callback = vi.fn();

      request.requested$.subscribe((event) => {
        event.callback({ content: 'Response' });
      });

      request.raise({ content: 'Test' }, callback);

      expect(callback).toHaveBeenCalledWith({ content: 'Response' });
    });

    it('should not throw when callback is not provided', () => {
      const request = new InteractionRequest<INotification>();

      request.requested$.subscribe((event) => {
        event.callback({ content: 'Response' });
      });

      expect(() => request.raise({ content: 'Test' })).not.toThrow();
    });
  });

  describe('raiseAsync', () => {
    it('should return promise that resolves with response', async () => {
      const request = new InteractionRequest<IConfirmation>();

      // Simulate view handling the request
      request.requested$.subscribe((event) => {
        event.callback({ ...event.context, confirmed: true });
      });

      const response = await request.raiseAsync({
        content: 'Confirm?',
      });

      expect(response.confirmed).toBe(true);
    });

    it('should work with async/await pattern', async () => {
      const request = new ConfirmationRequest();

      request.requested$.subscribe((event) => {
        // Simulate async dialog
        setTimeout(() => {
          event.callback({ ...event.context, confirmed: false });
        }, 10);
      });

      const response = await request.raiseAsync({
        title: 'Delete',
        content: 'Are you sure?',
      });

      expect(response.confirmed).toBe(false);
    });
  });

  describe('multiple requests', () => {
    it('should handle sequential requests', async () => {
      const request = new InteractionRequest<INotification>();
      const contexts: string[] = [];

      request.requested$.subscribe((event) => {
        contexts.push(event.context.content);
        event.callback(event.context);
      });

      await request.raiseAsync({ content: 'First' });
      await request.raiseAsync({ content: 'Second' });

      expect(contexts).toEqual(['First', 'Second']);
    });
  });

  describe('dispose', () => {
    it('should complete requested$ observable', async () => {
      const request = new InteractionRequest<INotification>();
      const completeSpy = vi.fn();

      request.requested$.subscribe({ complete: completeSpy });
      request.dispose();

      expect(completeSpy).toHaveBeenCalled();
    });
  });
});

describe('ConfirmationRequest', () => {
  it('should work with IConfirmation type', async () => {
    const request = new ConfirmationRequest();

    request.requested$.subscribe((event) => {
      event.callback({
        ...event.context,
        confirmed: true,
      });
    });

    const response = await request.raiseAsync({
      title: 'Confirm',
      content: 'Proceed?',
      confirmText: 'Yes',
      cancelText: 'No',
    });

    expect(response.confirmed).toBe(true);
    expect(response.title).toBe('Confirm');
  });
});
```

### Step 6: Update Package Index

Update `packages/mvvm-patterns/src/index.ts`:

```typescript
export * from './interactions';
```

---

## Acceptance Criteria

- [ ] `InteractionRequest<T>` base class implemented
- [ ] `raise()` method works with callback
- [ ] `raiseAsync()` method returns Promise
- [ ] Specialized types: `ConfirmationRequest`, `NotificationRequest`, `InputRequest`, `SelectionRequest`
- [ ] `dispose()` properly cleans up
- [ ] Unit tests pass
- [ ] Exported from package index

---

## View Integration Examples

### React

```typescript
function OrderView({ vm }: { vm: OrderViewModel }) {
  const [confirmDialog, setConfirmDialog] = useState<IConfirmation | null>(null);
  const callbackRef = useRef<((r: IConfirmation) => void) | null>(null);

  useEffect(() => {
    const sub = vm.confirmDelete.requested$.subscribe(event => {
      setConfirmDialog(event.context);
      callbackRef.current = event.callback;
    });
    return () => sub.unsubscribe();
  }, [vm]);

  const handleConfirm = (confirmed: boolean) => {
    if (callbackRef.current && confirmDialog) {
      callbackRef.current({ ...confirmDialog, confirmed });
    }
    setConfirmDialog(null);
  };

  return (
    <>
      <button onClick={() => vm.deleteCommand.execute()}>Delete</button>
      {confirmDialog && (
        <ConfirmDialog
          title={confirmDialog.title}
          message={confirmDialog.content}
          onConfirm={() => handleConfirm(true)}
          onCancel={() => handleConfirm(false)}
        />
      )}
    </>
  );
}
```

### Vue

```typescript
// In setup()
onMounted(() => {
  vm.confirmDelete.requested$.subscribe((event) => {
    showConfirmDialog(event.context.content).then((confirmed) => {
      event.callback({ ...event.context, confirmed });
    });
  });
});
```

---

## Dependencies

- RxJS: `Observable`, `Subject`
- Prerequisite: mvvm-patterns package setup
