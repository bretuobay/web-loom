# @web-loom/mvvm-patterns

Application-level MVVM patterns for Web Loom, providing advanced ViewModel capabilities inspired by Prism Library.

## Features

- **Interaction Request Pattern**: ViewModel-to-View communication without coupling
- **Active Awareness Pattern**: Track whether ViewModels are currently active (visible/focused)
- Framework-agnostic design
- Full TypeScript support
- RxJS-based reactive state management

## Installation

```bash
npm install @web-loom/mvvm-patterns
```

## Interaction Request Pattern

The Interaction Request Pattern allows ViewModels to request UI interactions (dialogs, notifications, prompts) from the View without direct coupling. This maintains clean MVVM separation while enabling ViewModel-driven UI behaviors.

### Why Use Interaction Requests?

- **Separation of Concerns**: ViewModels have zero knowledge of UI components
- **Testability**: Test ViewModel logic without rendering UI
- **Framework Agnostic**: Same ViewModel works across React, Vue, Angular
- **Type Safety**: Strongly typed interaction contracts

### Basic Usage

```typescript
import { ConfirmationRequest, NotificationRequest } from '@web-loom/mvvm-patterns';
import { BaseViewModel } from '@web-loom/mvvm-core';

class OrderViewModel extends BaseViewModel<OrderModel> {
  readonly confirmDelete = new ConfirmationRequest();
  readonly notify = new NotificationRequest();

  async deleteOrder(): Promise<void> {
    // Request confirmation from the View
    const response = await this.confirmDelete.raiseAsync({
      title: 'Delete Order',
      content: 'Are you sure? This cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel'
    });

    if (response.confirmed) {
      await this.model.delete();
      
      // Show success notification
      this.notify.raise({
        title: 'Success',
        content: 'Order deleted successfully'
      });
    }
  }
}
```

### React Integration

```typescript
import { useEffect, useState, useRef } from 'react';
import { IConfirmation } from '@web-loom/mvvm-patterns';

function OrderView({ vm }: { vm: OrderViewModel }) {
  const [confirmDialog, setConfirmDialog] = useState<IConfirmation | null>(null);
  const callbackRef = useRef<((r: IConfirmation) => void) | null>(null);

  useEffect(() => {
    // Subscribe to confirmation requests
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
      <button onClick={() => vm.deleteOrder()}>Delete Order</button>
      
      {confirmDialog && (
        <ConfirmDialog
          title={confirmDialog.title}
          message={confirmDialog.content}
          confirmText={confirmDialog.confirmText}
          cancelText={confirmDialog.cancelText}
          onConfirm={() => handleConfirm(true)}
          onCancel={() => handleConfirm(false)}
        />
      )}
    </>
  );
}
```

### Specialized Request Types

#### ConfirmationRequest

For Yes/No, OK/Cancel dialogs:

```typescript
const confirmRequest = new ConfirmationRequest();
const response = await confirmRequest.raiseAsync({
  title: 'Confirm Action',
  content: 'Proceed with this action?',
  confirmText: 'Yes',
  cancelText: 'No'
});

if (response.confirmed) {
  // User confirmed
}
```

#### NotificationRequest

For toast/snackbar notifications:

```typescript
const notify = new NotificationRequest();
notify.raise({
  title: 'Success',
  content: 'Changes saved successfully'
});
```

#### InputRequest

For text input prompts:

```typescript
const inputRequest = new InputRequest();
const response = await inputRequest.raiseAsync({
  title: 'Rename Item',
  content: 'Enter new name:',
  placeholder: 'Item name',
  defaultValue: currentName,
  inputType: 'text'
});

if (response.inputValue) {
  // User entered a value
}
```

#### SelectionRequest

For selecting from options:

```typescript
enum Priority { Low = 1, Medium = 2, High = 3 }

const selectRequest = new SelectionRequest<Priority>();
const response = await selectRequest.raiseAsync({
  title: 'Set Priority',
  content: 'Choose priority level:',
  options: [
    { label: 'Low', value: Priority.Low },
    { label: 'Medium', value: Priority.Medium },
    { label: 'High', value: Priority.High }
  ]
});

if (response.selectedValue) {
  // User selected a value
}
```

### Custom Interaction Types

Create your own interaction types by extending `InteractionRequest`:

```typescript
interface IFilePickerRequest extends INotification {
  accept?: string;
  multiple?: boolean;
  selectedFiles?: File[];
}

class FilePickerRequest extends InteractionRequest<IFilePickerRequest> {}

// Usage
const filePicker = new FilePickerRequest();
const response = await filePicker.raiseAsync({
  content: 'Select files to upload',
  accept: 'image/*',
  multiple: true
});
```

### Vue Integration

```typescript
import { onMounted, onUnmounted } from 'vue';

export default {
  setup() {
    const vm = new OrderViewModel(model);

    onMounted(() => {
      vm.confirmDelete.requested$.subscribe(async (event) => {
        const confirmed = await showConfirmDialog(
          event.context.title,
          event.context.content
        );
        event.callback({ ...event.context, confirmed });
      });
    });

    onUnmounted(() => {
      vm.dispose();
    });

    return { vm };
  }
};
```

### Angular Integration

```typescript
@Component({
  selector: 'app-order',
  template: `
    <button (click)="vm.deleteOrder()">Delete</button>
    <app-confirm-dialog
      *ngIf="confirmDialog"
      [title]="confirmDialog.title"
      [message]="confirmDialog.content"
      (confirm)="handleConfirm(true)"
      (cancel)="handleConfirm(false)"
    ></app-confirm-dialog>
  `
})
export class OrderComponent implements OnInit, OnDestroy {
  confirmDialog: IConfirmation | null = null;
  private callback: ((r: IConfirmation) => void) | null = null;
  private subscription?: Subscription;

  ngOnInit() {
    this.subscription = this.vm.confirmDelete.requested$.subscribe(event => {
      this.confirmDialog = event.context;
      this.callback = event.callback;
    });
  }

  handleConfirm(confirmed: boolean) {
    if (this.callback && this.confirmDialog) {
      this.callback({ ...this.confirmDialog, confirmed });
    }
    this.confirmDialog = null;
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
    this.vm.dispose();
  }
}
```

---

## Active Awareness Pattern

The Active Awareness Pattern allows ViewModels to know when they are "active" (visible, focused, or receiving user interaction). This is useful for:

- Pausing polling/updates when tabs are inactive
- Stopping animations when views are hidden
- Optimizing performance by suspending inactive ViewModels
- Filtering command execution to only active views

### Basic Usage

```typescript
import { ActiveAwareViewModel } from '@web-loom/mvvm-patterns';
import { BaseModel } from '@web-loom/mvvm-core';

class DashboardModel extends BaseModel<DashboardData, any> {
  constructor() {
    super({ initialData: null });
  }
}

class DashboardViewModel extends ActiveAwareViewModel<DashboardModel> {
  private pollingInterval?: NodeJS.Timeout;

  protected onIsActiveChanged(isActive: boolean, wasActive: boolean): void {
    if (isActive) {
      console.log('Dashboard became active - starting updates');
      this.startPolling();
    } else {
      console.log('Dashboard became inactive - pausing updates');
      this.stopPolling();
    }
  }

  private startPolling(): void {
    this.pollingInterval = setInterval(() => {
      this.refreshData();
    }, 5000);
  }

  private stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = undefined;
    }
  }

  private async refreshData(): Promise<void> {
    // Fetch fresh data
  }

  public override dispose(): void {
    this.stopPolling();
    super.dispose();
  }
}
```

### React Integration

```typescript
import { useEffect } from 'react';
import { IActiveAware } from '@web-loom/mvvm-patterns';

function useActiveAware(viewModel: IActiveAware) {
  useEffect(() => {
    // Activate when component mounts
    viewModel.isActive = true;

    // Handle browser tab visibility
    const handleVisibility = () => {
      viewModel.isActive = document.visibilityState === 'visible';
    };

    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      viewModel.isActive = false;
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [viewModel]);
}

function DashboardView() {
  const vm = useViewModel(() => new DashboardViewModel(new DashboardModel()));
  useActiveAware(vm);

  return <div>Dashboard Content</div>;
}
```

### Tab Component Integration

```typescript
function TabPanel({ 
  viewModel, 
  isSelected 
}: { 
  viewModel: IActiveAware; 
  isSelected: boolean 
}) {
  useEffect(() => {
    viewModel.isActive = isSelected;
  }, [viewModel, isSelected]);

  return <div>Tab Content</div>;
}
```

### Type Guard

Use the `isActiveAware` type guard to check if an object implements the `IActiveAware` interface:

```typescript
import { isActiveAware } from '@web-loom/mvvm-patterns';

function handleViewModel(vm: any) {
  if (isActiveAware(vm)) {
    vm.isActive = true;
    console.log('ViewModel supports active awareness');
  }
}
```

### Observing Active State

Subscribe to the `isActive$` observable to react to state changes:

```typescript
class MyViewModel extends ActiveAwareViewModel<MyModel> {
  constructor(model: MyModel) {
    super(model);

    // React to active state changes
    this.isActive$.subscribe(isActive => {
      console.log(`ViewModel is now ${isActive ? 'active' : 'inactive'}`);
    });
  }
}
```

## API Reference

### `IActiveAware`

Interface for objects that track active state.

**Properties:**
- `isActive: boolean` - Gets or sets the active state
- `isActive$: Observable<boolean>` - Observable that emits when active state changes

### `ActiveAwareViewModel<TModel>`

Base ViewModel class that implements `IActiveAware`.

**Methods:**
- `activate()` - Convenience method to set `isActive = true`
- `deactivate()` - Convenience method to set `isActive = false`
- `onIsActiveChanged(isActive: boolean, wasActive: boolean)` - Override to react to state changes
- `dispose()` - Clean up resources

### `isActiveAware(obj: any): obj is IActiveAware`

Type guard function to check if an object implements `IActiveAware`.

## License

MIT
