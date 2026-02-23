# `@web-loom/mvvm-patterns` — The Conversations ViewModels Need to Have

---

There's a moment in every MVVM implementation where the architecture hits a wall.

You have a ViewModel. It's clean — no framework imports, no DOM references, no UI logic. It manages business state beautifully. Then the user clicks "Delete," and the ViewModel needs to ask "Are you sure?" before proceeding. And now it has a problem.

To show a confirmation dialog, something needs to reach the UI. But the ViewModel isn't supposed to know about the UI. If it reaches directly for a React state setter, or fires a DOM event, or imports a modal component, the clean separation collapses. The ViewModel is no longer framework-agnostic. The test that was trivially simple becomes complicated. The promise of MVVM starts to fray.

This tension isn't unique to web development. Every platform that uses MVVM has encountered it and worked out a solution.

---

## How Other Platforms Solved It

In WPF — Microsoft's 2006 XAML UI framework where the MVVM pattern was formalised — the solution was named `InteractionRequest` by the Prism library. The ViewModel would raise an `InteractionRequest<T>`, the View would register a `Trigger` on it, and when the request fired, the Trigger would open a dialog. The ViewModel never touched the dialog code. The dialog never knew about the ViewModel. They communicated through a shared event that both could read without coupling to each other.

Prism for WPF called these "Interaction Requests." The same pattern appears in Prism for Xamarin, in Microsoft's MVVM Toolkit under `AsyncRelayCommand` and `WeakReferenceMessenger`, and as the foundation of MvvmCross's `IMvxInteraction`. Every mature MVVM framework on desktop or mobile has a version of this.

The pattern is also sometimes called the "Mediator" for UI requests, or "View Services," depending on who's describing it and in what decade. The concept is the same: the ViewModel expresses a need; the View fulfils it. The contract between them is the request type, not a concrete reference.

On Android, a similar problem is handled through `SharedFlow` / `LiveData` with the View observing "events" from the ViewModel and acting on them (show toast, navigate, open dialog). In SwiftUI, it's `ViewModifier` combined with `.sheet(item:)` or `.alert(isPresented:)` — the ViewModel publishes a value; SwiftUI responds by opening the UI.

The web frontend ecosystem, being younger and React-centric, mostly handles this by just calling a React hook or zustand action from inside a "ViewModel" (which is usually just a custom hook anyway). The coupling is there; it just tends not to get named.

`@web-loom/mvvm-patterns` brings the formalised pattern to TypeScript.

---

## The Problem in Concrete Terms

Here's what the coupling looks like before you have a solution:

```typescript
// The bad version — ViewModel reaches into the UI
class OrderViewModel extends BaseViewModel<OrderModel> {
  readonly deleteCommand = this.registerCommand(
    new Command(async (id: string) => {
      // ❌ This shouldn't be here
      const confirmed = window.confirm('Delete this order?');
      if (confirmed) {
        await this.model.delete(id);
      }
    })
  );
}
```

`window.confirm` is synchronous, ugly, and not styleable. But even if you replace it with a custom modal:

```typescript
// Still bad — direct dependency on a UI component or store
import { openModal } from '../modal-store';

class OrderViewModel extends BaseViewModel<OrderModel> {
  readonly deleteCommand = this.registerCommand(
    new Command(async (id: string) => {
      // ❌ Now the ViewModel depends on a specific UI mechanism
      const confirmed = await openModal('confirm', {
        message: 'Delete this order?'
      });
      if (confirmed) {
        await this.model.delete(id);
      }
    })
  );
}
```

The ViewModel now depends on how modals are implemented in your app. Change the modal library, rename the function, move the store — the ViewModel breaks. And you can't test the ViewModel without mocking the modal infrastructure.

---

## InteractionRequest

`@web-loom/mvvm-patterns` exports `InteractionRequest<T>` — a thin Observable-based bridge. The ViewModel raises it; the View handles it.

```typescript
import { InteractionRequest, ConfirmationRequest } from '@web-loom/mvvm-patterns';
import type { IConfirmation } from '@web-loom/mvvm-patterns';

class OrderViewModel extends BaseViewModel<OrderModel> {
  // Declare the interaction request as a property
  readonly confirmDelete = new ConfirmationRequest();

  readonly deleteCommand = this.registerCommand(
    new Command(async (id: string) => {
      // Raise the request and await the response
      const response = await this.confirmDelete.raiseAsync({
        title: 'Delete Order',
        content: 'This action cannot be undone.',
        confirmText: 'Delete',
        cancelText: 'Cancel',
      });

      if (response.confirmed) {
        await this.model.delete(id);
      }
    })
  );
}
```

The ViewModel has no idea what happens when `confirmDelete.raiseAsync()` is called. It just awaits the response. The Promise resolves when the callback is invoked with a result.

On the View side:

```tsx
// React example
function OrderList({ vm }: { vm: OrderViewModel }) {
  const [confirmation, setConfirmation] = useState<{
    context: IConfirmation;
    callback: (response: IConfirmation) => void;
  } | null>(null);

  useEffect(() => {
    const sub = vm.confirmDelete.requested$.subscribe((event) => {
      setConfirmation(event);
    });
    return () => sub.unsubscribe();
  }, [vm]);

  function handleConfirm() {
    confirmation?.callback({ ...confirmation.context, confirmed: true });
    setConfirmation(null);
  }

  function handleCancel() {
    confirmation?.callback({ ...confirmation.context, confirmed: false });
    setConfirmation(null);
  }

  return (
    <>
      {/* Order list UI */}

      {confirmation && (
        <ConfirmationDialog
          title={confirmation.context.title}
          message={confirmation.context.content}
          confirmText={confirmation.context.confirmText}
          cancelText={confirmation.context.cancelText}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </>
  );
}
```

The View subscribes to `requested$`. When an event arrives, it shows the appropriate dialog. When the user responds, it calls `event.callback` with the result. The ViewModel's `raiseAsync` Promise resolves. Control flows back to the ViewModel's command handler.

No shared store. No import of UI code in the ViewModel. The contract is the `IConfirmation` type.

---

## The Built-in Request Types

`mvvm-patterns` ships four concrete request types:

### ConfirmationRequest

For yes/no, OK/cancel dialogs. The response carries a `confirmed` boolean.

```typescript
const confirmDelete = new ConfirmationRequest();

const response = await confirmDelete.raiseAsync({
  title: 'Delete Item',
  content: 'This action cannot be undone.',
  confirmText: 'Delete',
  cancelText: 'Keep',
});

if (response.confirmed) {
  // proceed
}
```

### NotificationRequest

For fire-and-forget notifications — toasts, snackbars, alerts. The ViewModel raises it; the View shows the message; no response is awaited.

```typescript
const notify = new NotificationRequest();

notify.raise({
  title: 'Success',
  content: 'Your changes have been saved.',
});
```

This version uses `raise()` instead of `raiseAsync()` — there's no response to wait for.

### InputRequest

For prompting the user to type something — rename dialogs, note inputs, search prompts. The response carries the `inputValue` string.

```typescript
const rename = new InputRequest();

const response = await rename.raiseAsync({
  title: 'Rename Item',
  content: 'Enter a new name:',
  defaultValue: item.name,
  placeholder: 'Item name',
});

if (response.inputValue) {
  await this.model.rename(item.id, response.inputValue);
}
```

### SelectionRequest

For presenting a list of options. Generic over the option value type.

```typescript
type Priority = 'high' | 'medium' | 'low';
const selectPriority = new SelectionRequest<Priority>();

const response = await selectPriority.raiseAsync({
  title: 'Set Priority',
  content: 'Choose a priority level for this task:',
  options: [
    { label: 'High',   value: 'high'   },
    { label: 'Medium', value: 'medium' },
    { label: 'Low',    value: 'low'    },
  ],
});

if (response.selectedValue) {
  await this.model.setPriority(task.id, response.selectedValue);
}
```

---

## Custom Interaction Types

The base `InteractionRequest<T>` class accepts any type that extends `INotification` (`{ title?: string; content: string }`). You can extend it for domain-specific interactions:

```typescript
import { InteractionRequest } from '@web-loom/mvvm-patterns';

interface IFilePicker {
  content: string;
  accept?: string;     // e.g., '.csv,.xlsx'
  multiple?: boolean;
  selectedFiles?: File[];
}

class FilePickerRequest extends InteractionRequest<IFilePicker> {}

// In ViewModel
const importFiles = new FilePickerRequest();

const response = await importFiles.raiseAsync({
  content: 'Select files to import',
  accept: '.csv',
  multiple: true,
});

if (response.selectedFiles?.length) {
  await this.model.importCSV(response.selectedFiles);
}
```

The View handles `importFiles.requested$` by opening a file input or a drag-drop zone — whatever makes sense for the platform.

---

## Testing Without Mocks

The cleanest benefit of this pattern shows up in tests. Because the ViewModel doesn't depend on any UI infrastructure, you can test the entire flow by subscribing to `requested$` yourself:

```typescript
import { describe, it, expect } from 'vitest';
import { firstValueFrom } from 'rxjs';
import { OrderViewModel } from './OrderViewModel';
import { OrderModel } from '../models/OrderModel';

describe('OrderViewModel', () => {
  it('only deletes when confirmed', async () => {
    const model = new OrderModel({ id: 'order-1' });
    const vm = new OrderViewModel(model);
    const deleteSpy = vi.spyOn(model, 'delete');

    // Subscribe to the interaction request and simulate cancellation
    vm.confirmDelete.requested$.subscribe((event) => {
      event.callback({ ...event.context, confirmed: false });
    });

    await vm.deleteCommand.execute('order-1');

    expect(deleteSpy).not.toHaveBeenCalled();
    vm.dispose();
  });

  it('proceeds with deletion when confirmed', async () => {
    const model = new OrderModel({ id: 'order-1' });
    const vm = new OrderViewModel(model);
    const deleteSpy = vi.spyOn(model, 'delete').mockResolvedValue(undefined);

    vm.confirmDelete.requested$.subscribe((event) => {
      event.callback({ ...event.context, confirmed: true });
    });

    await vm.deleteCommand.execute('order-1');

    expect(deleteSpy).toHaveBeenCalledWith('order-1');
    vm.dispose();
  });
});
```

No DOM. No React. No modal rendering. The test drives the ViewModel's interaction request directly, as if it were the View, and verifies the ViewModel's subsequent behaviour. This is the payoff for keeping the View out of the ViewModel.

---

## ActiveAwareViewModel

The second pattern in this package addresses a different problem: some ViewModels should only do work when their corresponding View is active.

Think about a tabbed interface. Tab 1 shows a live dashboard with a polling subscription that refreshes data every 30 seconds. Tab 2 shows account settings. When the user is on Tab 2, Tab 1's ViewModel is still alive — it was created when the app loaded, and it'll be needed again when the user switches back. But should it keep polling?

Keeping it polling is wasteful. Destroying and recreating it every time the user switches tabs would cause flickering and loss of scroll position. The right behaviour is: pause when the tab is inactive, resume when it becomes active.

This is `ActiveAwareViewModel`.

### The IActiveAware Interface

```typescript
interface IActiveAware {
  isActive: boolean;
  isActive$: Observable<boolean>;
  activate(): void;
  deactivate(): void;
}
```

`ActiveAwareViewModel` implements `IActiveAware` on top of `BaseViewModel`. The protected `onIsActiveChanged` hook fires whenever `isActive` transitions, letting derived classes respond:

```typescript
import { ActiveAwareViewModel } from '@web-loom/mvvm-patterns';
import type { Subscription } from 'rxjs';
import { interval } from 'rxjs';
import { switchMap } from 'rxjs/operators';

class DashboardViewModel extends ActiveAwareViewModel<DashboardModel> {
  private pollingSubscription?: Subscription;

  protected onIsActiveChanged(isActive: boolean): void {
    if (isActive) {
      this.startPolling();
    } else {
      this.stopPolling();
    }
  }

  private startPolling(): void {
    this.pollingSubscription = interval(30_000).subscribe(() => {
      this.loadCommand.execute();
    });
  }

  private stopPolling(): void {
    this.pollingSubscription?.unsubscribe();
    this.pollingSubscription = undefined;
  }

  dispose(): void {
    this.stopPolling();
    super.dispose();
  }
}
```

### Wiring Activation to the View

The View manages the lifecycle. In a tabbed interface:

```tsx
// React tabbed interface
function Dashboard() {
  const vm = useMemo(() => new DashboardViewModel(new DashboardModel()), []);

  useEffect(() => {
    vm.activate();
    return () => vm.deactivate();
  }, [vm]);

  useEffect(() => {
    return () => vm.dispose();
  }, [vm]);

  return <DashboardPanel vm={vm} />;
}
```

In a tab bar that shows/hides panels:

```tsx
function TabbedWorkspace() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const dashboardVM = useMemo(() => new DashboardViewModel(new DashboardModel()), []);
  const settingsVM  = useMemo(() => new SettingsViewModel(new SettingsModel()),   []);

  useEffect(() => {
    if (activeTab === 'dashboard') {
      dashboardVM.activate();
      settingsVM.deactivate();
    } else {
      settingsVM.activate();
      dashboardVM.deactivate();
    }
  }, [activeTab, dashboardVM, settingsVM]);

  useEffect(() => {
    return () => {
      dashboardVM.dispose();
      settingsVM.dispose();
    };
  }, []);

  return (
    <div>
      <TabBar active={activeTab} onChange={setActiveTab} />
      {activeTab === 'dashboard' && <DashboardPanel vm={dashboardVM} />}
      {activeTab === 'settings'  && <SettingsPanel  vm={settingsVM}  />}
    </div>
  );
}
```

The ViewModel doesn't know it's in a tab. It knows whether it's active or not. The tab bar manages that transition.

### Route Activation

The same pattern applies to router-based navigation. In React Router, a component mounts when the route is active and unmounts when the user navigates away — but if you want the ViewModel to persist (so it retains its scroll position, loaded data, and in-progress edits) while the View is hidden, you create the ViewModel at the application level and pass activation down:

```tsx
// In a route wrapper
function ProductsRoute() {
  const vm = useProductsViewModel(); // singleton in context

  useEffect(() => {
    vm.activate();
    return () => vm.deactivate();
  }, [vm]);

  return <ProductList vm={vm} />;
}
```

When the user navigates to `/products`, `activate()` fires — the ViewModel starts loading, begins subscriptions, resumes polling. When they navigate away, `deactivate()` fires — work pauses but state is preserved. Navigate back: the View mounts, `activate()` fires, the ViewModel resumes from exactly where it was.

### The isActive$ Observable

For components that want to react to activation state — perhaps to start or stop their own animations, or show a "loading" state specifically for when the ViewModel becomes active for the first time:

```tsx
function DashboardPanel({ vm }: { vm: DashboardViewModel }) {
  const [isActive, setIsActive] = useState(vm.isActive);

  useEffect(() => {
    const sub = vm.isActive$.subscribe(setIsActive);
    return () => sub.unsubscribe();
  }, [vm]);

  if (!isActive) return <Skeleton />; // show while activating
  return <LiveDashboard vm={vm} />;
}
```

---

## How These Patterns Complete MVVM

Both patterns in this package solve the same category of problem: the moments when the ViewModel and the View need to coordinate, but can't be directly coupled.

`InteractionRequest` solves the coordination problem for user decisions: the ViewModel needs information from the user, expressed through the View, but without the ViewModel knowing what kind of UI will show up.

`ActiveAwareViewModel` solves the coordination problem for lifecycle: the ViewModel needs to know whether its View is currently shown, without the View having to pass that information down through props or events.

In both cases, the mechanism is Observable-based: the ViewModel exposes a stream, the View subscribes. The data flows in one direction; the ViewModel's independence from the View is preserved.

These two gaps — user interaction and lifecycle awareness — are the last things a clean ViewModel architecture needs to handle. With them addressed, the ViewModel can genuinely own all application behaviour, and the View can genuinely be a thin subscriber.

---

## Installing

```bash
npm install @web-loom/mvvm-patterns
```

`@web-loom/mvvm-core` and RxJS are peer dependencies. Both `InteractionRequest` and `ActiveAwareViewModel` are exported from the package root.

---

Next in the series: the final article — putting all ten packages together to build a complete feature from scratch. One ViewModel, one model, caching, UI state, interaction requests, design tokens, and a headless command palette — assembled piece by piece into something you'd actually ship.
