# Prism to Web Loom Feature Mapping

This document maps features from [Prism Library](https://prismlibrary.github.io/docs/index.html) (a WPF/Xamarin MVVM framework) to their equivalents in Web Loom (a web/mobile MVVM framework).

> **Context**: While Prism targets desktop applications (WPF, Xamarin, Uno Platform), Web Loom targets web and mobile applications. Both share the MVVM architectural pattern and many similar concerns for building maintainable, testable UI applications.

---

## Feature Comparison Matrix

| Prism Feature        | Web Loom Equivalent           | Package          | Status     |
| -------------------- | ----------------------------- | ---------------- | ---------- |
| DelegateCommand      | `Command`                     | `mvvm-core`      | ✅ Full    |
| CompositeCommand     | `CompositeCommand`            | `mvvm-core`      | ✅ Full    |
| Event Aggregator     | `EventBus`                    | `event-bus-core` | ✅ Full    |
| Modules              | `PluginModule`                | `plugin-core`    | ✅ Full    |
| Regions              | Shell Patterns                | `ui-patterns`    | ⚠️ Adapted |
| Dependency Injection | `SimpleDIContainer`           | `mvvm-core`      | ✅ Full    |
| Navigation           | `Router`                      | `router-core`    | ✅ Full    |
| ViewModelLocator     | DI-based resolution           | `mvvm-core`      | ⚠️ Adapted |
| Dialog Service       | `Dialog` behavior             | `ui-core`        | ✅ Full    |
| BindableBase         | `BaseModel` / `BaseViewModel` | `mvvm-core`      | ✅ Full    |

---

## Detailed Feature Mapping

### 1. Delegate Commands

**Prism Pattern:**

```csharp
public DelegateCommand SubmitCommand { get; }
SubmitCommand = new DelegateCommand(ExecuteSubmit, CanExecuteSubmit)
    .ObservesProperty(() => IsValid);
```

**Web Loom Pattern (`mvvm-core`):**

```typescript
import { Command, ICommand } from '@repo/mvvm-core';

// Command with reactive state
const submitCommand = new Command<void, void>(
  async () => await this.submit(),
  this.isValid$, // Observable<boolean> for canExecute
);

// Usage in ViewModel
class MyViewModel extends BaseViewModel<MyModel> {
  public readonly submitCommand: ICommand<void, void>;

  constructor(model: MyModel) {
    super(model);
    this.submitCommand = new Command(() => this.performSubmit(), this.canSubmit$);
  }
}
```

**Key Differences:**

- Prism uses `INotifyPropertyChanged`, Web Loom uses RxJS `Observable<boolean>`
- Web Loom commands expose `isExecuting$`, `executeError$` for async operations
- Both support parameterized commands

**Web Loom Command Interface:**

```typescript
interface ICommand<TParam = void, TResult = void> {
  readonly canExecute$: Observable<boolean>;
  readonly isExecuting$: Observable<boolean>;
  readonly executeError$: Observable<any>;
  execute(param: TParam): Promise<TResult | undefined>;
}
```

---

### 2. Composite Commands

**Prism Pattern:**

```csharp
public CompositeCommand SaveAllCommand { get; } = new CompositeCommand();
SaveAllCommand.RegisterCommand(viewModel1.SaveCommand);
SaveAllCommand.RegisterCommand(viewModel2.SaveCommand);
```

**Web Loom Pattern (`mvvm-core`):**

```typescript
import { CompositeCommand, ICommand } from '@repo/mvvm-core';

const saveAllCommand = new CompositeCommand<void, void[]>();

// Register child commands
saveAllCommand.register(viewModel1.saveCommand);
saveAllCommand.register(viewModel2.saveCommand);

// Execute all registered commands
await saveAllCommand.execute();

// Observables aggregate child command states
saveAllCommand.canExecute$; // true only when ALL can execute
saveAllCommand.isExecuting$; // true when ANY is executing
```

**Web Loom CompositeCommand Features:**

- Aggregates `canExecute$` (all must be true)
- Aggregates `isExecuting$` (any executing = true)
- Collects results from all child commands
- Supports `register()` / `unregister()` for dynamic composition

---

### 3. Event Aggregator / Event Aggregation

**Prism Pattern:**

```csharp
public class TickerSymbolSelectedEvent : PubSubEvent<string> { }

// Subscribe
_eventAggregator.GetEvent<TickerSymbolSelectedEvent>()
    .Subscribe(OnTickerSelected);

// Publish
_eventAggregator.GetEvent<TickerSymbolSelectedEvent>()
    .Publish("AAPL");
```

**Web Loom Pattern (`event-bus-core`):**

```typescript
import { createEventBus } from '@repo/event-bus-core';

// Define typed events
interface AppEvents {
  'ticker:selected': [symbol: string];
  'user:logged-in': [userId: string, email: string];
  'cart:updated': [items: CartItem[]];
}

// Create typed event bus
const eventBus = createEventBus<AppEvents>();

// Subscribe
const unsubscribe = eventBus.on('ticker:selected', (symbol) => {
  console.log(`Selected: ${symbol}`);
});

// Subscribe to multiple events
eventBus.on(['ticker:selected', 'user:logged-in'], handler);

// Subscribe once
eventBus.once('user:logged-in', (userId, email) => {
  // Only fires once
});

// Publish
eventBus.emit('ticker:selected', 'AAPL');

// Cleanup
unsubscribe();
eventBus.off('ticker:selected', handler);
```

**Additional: Event Emitter Core (`event-emitter-core`):**
For component-level events, Web Loom also provides a lightweight emitter:

```typescript
import { EventEmitter } from '@repo/event-emitter-core';

class MyComponent extends EventEmitter<{
  change: [value: string];
  submit: [data: FormData];
}> {
  handleChange(value: string) {
    this.emit('change', value);
  }
}
```

---

### 4. Modules

**Prism Pattern:**

```csharp
public class ModuleA : IModule
{
    public void OnInitialized(IContainerProvider containerProvider) { }
    public void RegisterTypes(IContainerRegistry containerRegistry) { }
}

// Module catalog
protected override void ConfigureModuleCatalog(IModuleCatalog moduleCatalog)
{
    moduleCatalog.AddModule<ModuleA>();
    moduleCatalog.AddModule<ModuleB>(dependsOn: typeof(ModuleA));
}
```

**Web Loom Pattern (`plugin-core`):**

```typescript
import { PluginModule, PluginManifest, PluginSDK } from '@repo/plugin-core';

// Plugin Manifest (declarative metadata)
const manifest: PluginManifest = {
  id: 'module-a',
  name: 'Module A',
  version: '1.0.0',
  entry: './moduleA.js',
  dependencies: {
    'core-services': '^1.0.0',
  },
  routes: [{ path: '/module-a', component: ModuleAPage }],
  menuItems: [{ label: 'Module A', path: '/module-a', icon: 'dashboard' }],
  widgets: [{ id: 'module-a-widget', component: ModuleAWidget, slot: 'dashboard' }],
};

// Plugin Module (lifecycle hooks)
const moduleA: PluginModule = {
  async init(sdk: PluginSDK) {
    // Register services, set up state
    sdk.services.storage.set('initialized', true);
  },

  async mount(sdk: PluginSDK) {
    // Add routes, menu items, widgets
    sdk.routes.add({ path: '/extra', component: ExtraPage });
    sdk.menus.addItem({ label: 'Extra', path: '/extra' });
  },

  async unmount() {
    // Cleanup
  },
};

export default moduleA;
```

**Plugin Registry (Module Catalog equivalent):**

```typescript
import { PluginRegistry } from '@repo/plugin-core';

const registry = new PluginRegistry();

// Register plugins
registry.register(moduleAManifest);
registry.register(moduleBManifest);

// Resolve load order (topological sort with dependency resolution)
const loadOrder = registry.resolveLoadOrder();
// Throws on circular dependencies or missing dependencies
```

**Plugin Lifecycle States:**

```
registered → loading → loaded → mounted → unmounted
                         ↓
                       error
```

---

### 5. Regions

**Prism Pattern:**

```xml
<ContentControl prism:RegionManager.RegionName="MainContent" />
```

```csharp
_regionManager.RequestNavigate("MainContent", "ViewA");
_regionManager.Regions["MainContent"].Add(view);
```

**Web Loom Pattern (`ui-patterns`):**

Web Loom uses composition patterns rather than named regions. The concept translates to:

**Sidebar Shell Pattern:**

```typescript
import { createSidebarShell } from '@repo/ui-patterns';

const shell = createSidebarShell({
  slots: {
    header: HeaderComponent,
    sidebar: SidebarComponent,
    main: null, // Dynamic content area
    footer: FooterComponent,
  },
});

// Navigate content into main slot
shell.setSlot('main', DashboardView);
shell.setSlot('main', SettingsView);
```

**Master-Detail Pattern:**

```typescript
import { createMasterDetail } from '@repo/ui-patterns';

const masterDetail = createMasterDetail({
  masterSlot: ListComponent,
  detailSlot: null, // Dynamic based on selection
});

masterDetail.setDetail(ItemDetailView);
```

**Plugin SDK Widgets (Region-like):**

```typescript
// Plugins can contribute to named slots
sdk.widgets.add({
  id: 'my-widget',
  component: MyWidget,
  slot: 'dashboard-sidebar', // Named slot/region
});
```

**Conceptual Mapping:**
| Prism Region | Web Loom Equivalent |
|--------------|---------------------|
| Named regions | Shell slots / Widget slots |
| RegionManager | Shell composition + Plugin SDK |
| Region navigation | Router + shell slot updates |

---

### 6. Dependency Injection

**Prism Pattern:**

```csharp
containerRegistry.Register<ICustomerStore, CustomerStore>();
containerRegistry.RegisterSingleton<IEventAggregator, EventAggregator>();

// Resolution
var store = container.Resolve<ICustomerStore>();
```

**Web Loom Pattern (`mvvm-core`):**

```typescript
import { SimpleDIContainer } from '@repo/mvvm-core';

// Extend ServiceRegistry for type safety
declare module '@repo/mvvm-core' {
  interface ServiceRegistry {
    ICustomerStore: CustomerStore;
    IEventBus: EventBus<AppEvents>;
    ILogger: Logger;
  }
}

// Register services
SimpleDIContainer.register('ICustomerStore', CustomerStore);
SimpleDIContainer.register('IEventBus', () => createEventBus<AppEvents>(), {
  isSingleton: true,
});

// Register with dependencies
SimpleDIContainer.register('CustomerViewModel', CustomerViewModel, {
  dependencies: ['ICustomerStore', 'IEventBus'],
});

// Resolution
const store = SimpleDIContainer.resolve('ICustomerStore');
const vm = SimpleDIContainer.resolve('CustomerViewModel');

// Utilities
SimpleDIContainer.isRegistered('ICustomerStore'); // true
SimpleDIContainer.unregister('ICustomerStore');
SimpleDIContainer.reset(); // Clear all registrations
```

**Features:**

- Type-safe with ServiceRegistry interface augmentation
- Singleton vs transient registration
- Automatic dependency resolution via constructor parameters
- Circular dependency detection
- Factory function support

---

### 7. Navigation

**Prism Pattern:**

```csharp
_regionManager.RequestNavigate("MainRegion", "ViewA",
    new NavigationParameters { { "id", customerId } });

// INavigationAware
public void OnNavigatedTo(NavigationContext context)
{
    var id = context.Parameters.GetValue<string>("id");
}
```

**Web Loom Pattern (`router-core`):**

```typescript
import { createRouter, createRoute } from '@repo/router-core';

// Define routes
const routes = [
  createRoute('/customers', CustomersView),
  createRoute('/customers/:id', CustomerDetailView),
  createRoute('/orders', OrdersView),
];

// Create router
const router = createRouter({
  routes,
  mode: 'history', // or 'hash'
});

// Navigation
await router.push('/customers/123');
await router.push({ path: '/customers', query: { filter: 'active' } });
await router.replace('/orders');
router.back();
router.forward();
router.go(-2);

// Subscribe to route changes
const unsubscribe = router.subscribe((route) => {
  console.log('Navigated to:', route.path);
  console.log('Params:', route.params); // { id: '123' }
  console.log('Query:', route.query);
});

// Navigation guards (like IConfirmNavigationRequest)
router.beforeEach((to, from) => {
  if (!isAuthenticated && to.path.startsWith('/admin')) {
    return '/login'; // Redirect
  }
  return true; // Allow
});

// After navigation hooks
router.afterEach((to, from) => {
  analytics.trackPageView(to.path);
});

// Error handling
router.onError((error, to, from) => {
  console.error('Navigation failed:', error);
});

// Current route
const currentRoute = router.currentRoute;
```

**Route Matching:**

```typescript
// Resolve without navigating
const match = router.resolve('/customers/456');
// { path: '/customers/456', params: { id: '456' }, matched: [...] }
```

---

### 8. ViewModelLocator

**Prism Pattern:**

```xml
<UserControl prism:ViewModelLocator.AutoWireViewModel="True" />
```

**Web Loom Pattern (DI-based):**

Web Loom doesn't have automatic view-model wiring. Instead, it uses explicit DI resolution:

```typescript
// Register ViewModels
SimpleDIContainer.register('CustomerListViewModel', CustomerListViewModel, {
  dependencies: ['ICustomerStore', 'IEventBus'],
});

// In framework adapters (React example)
function CustomerListView() {
  const [vm] = useState(() => SimpleDIContainer.resolve('CustomerListViewModel'));

  useEffect(() => {
    vm.loadCommand.execute();
    return () => vm.dispose();
  }, []);

  // ...
}

// Or create a locator utility
class ViewModelLocator {
  static get<K extends keyof ViewModelRegistry>(key: K): ViewModelRegistry[K] {
    return SimpleDIContainer.resolve(key);
  }
}

// Usage
const vm = ViewModelLocator.get('CustomerListViewModel');
```

**Factory Pattern Alternative:**

```typescript
// ViewModel factory with proper typing
const createCustomerListViewModel = () => {
  const store = SimpleDIContainer.resolve('ICustomerStore');
  const eventBus = SimpleDIContainer.resolve('IEventBus');
  return new CustomerListViewModel(store, eventBus);
};
```

---

### 9. Dialog Service

**Prism Pattern:**

```csharp
_dialogService.ShowDialog("ConfirmationDialog",
    new DialogParameters { { "message", "Are you sure?" } },
    result => { /* handle result */ });
```

**Web Loom Pattern (`ui-core`):**

```typescript
import { createDialog } from '@repo/ui-core';

// Create dialog behavior
const dialog = createDialog({
  initialOpen: false,
  onClose: (result) => console.log('Dialog closed with:', result),
});

// Control dialog
dialog.open();
dialog.close('confirmed');
dialog.toggle();

// Subscribe to state
dialog.isOpen$.subscribe((isOpen) => {
  console.log('Dialog open:', isOpen);
});

// Access current state
const isOpen = dialog.getState().isOpen;
```

**Modal Pattern (`ui-patterns`):**

```typescript
import { createModal } from '@repo/ui-patterns';

const modal = createModal({
  // Configuration
});

// Show modal with data
modal.show({
  title: 'Confirm Action',
  message: 'Are you sure you want to proceed?',
  confirmText: 'Yes, proceed',
  cancelText: 'Cancel',
});

// Get result
const result = await modal.result;
if (result.confirmed) {
  // User confirmed
}
```

**Plugin SDK UI Services:**

```typescript
// From within a plugin
sdk.ui.showModal(ConfirmationComponent, {
  data: { message: 'Are you sure?' },
});

sdk.ui.showToast('Operation successful', 'success');
```

**Notifications (`notifications-core`):**

```typescript
import { createNotifications } from '@repo/notifications-core';

const notifications = createNotifications();

notifications.show({
  type: 'success',
  message: 'Item saved successfully',
  duration: 3000,
});

notifications.confirm({
  title: 'Delete Item',
  message: 'This action cannot be undone.',
  onConfirm: () => deleteItem(),
  onCancel: () => {},
});
```

---

### 10. BindableBase / Observable Properties

**Prism Pattern:**

```csharp
public class CustomerViewModel : BindableBase
{
    private string _name;
    public string Name
    {
        get => _name;
        set => SetProperty(ref _name, value);
    }
}
```

**Web Loom Pattern (`mvvm-core`):**

```typescript
import { BaseModel, BaseViewModel } from '@repo/mvvm-core';
import { BehaviorSubject, Observable } from 'rxjs';

// Model with observable state
class CustomerModel extends BaseModel<Customer, typeof CustomerSchema> {
  constructor() {
    super(CustomerSchema);
  }
}

// ViewModel with computed observables
class CustomerViewModel extends BaseViewModel<CustomerModel> {
  public readonly name$: Observable<string>;
  public readonly isValid$: Observable<boolean>;

  constructor(model: CustomerModel) {
    super(model);

    // Derive observables from model data
    this.name$ = this.data$.pipe(map((customer) => customer?.name ?? ''));

    this.isValid$ = this.data$.pipe(map((customer) => customer !== null && customer.name.length > 0));
  }
}
```

**Observable Properties Pattern:**

```typescript
// Using BehaviorSubject for writable properties
class EditableCustomerViewModel extends BaseViewModel<CustomerModel> {
  private readonly _editName$ = new BehaviorSubject<string>('');
  public readonly editName$ = this._editName$.asObservable();

  setName(name: string) {
    this._editName$.next(name);
  }
}
```

**Validation Integration:**

```typescript
// BaseModel with Zod validation
class CustomerModel extends BaseModel<Customer, typeof CustomerSchema> {
  setData(data: Customer | null) {
    if (data !== null) {
      this.validate(data); // Throws ZodError on invalid
    }
    super.setData(data);
  }
}

// ViewModel exposes validation errors
this.validationErrors$ = this.error$.pipe(
  filter((err) => err instanceof ZodError),
  map((err) => err.errors),
);
```

---

## Additional Web Loom Features (Beyond Prism)

### State Management (`store-core`)

Centralized client-side state management:

```typescript
import { createStore, LocalStorageAdapter } from '@repo/store-core';

interface AppState {
  user: User | null;
  theme: 'light' | 'dark';
  notifications: Notification[];
}

const store = createStore<AppState, AppActions>(
  { user: null, theme: 'light', notifications: [] },
  (set, get, actions) => ({
    setUser: (user) => set((state) => ({ ...state, user })),
    toggleTheme: () =>
      set((state) => ({
        ...state,
        theme: state.theme === 'light' ? 'dark' : 'light',
      })),
    addNotification: (n) =>
      set((state) => ({
        ...state,
        notifications: [...state.notifications, n],
      })),
  }),
  { adapter: new LocalStorageAdapter('app-state') }, // Persistence
);

// Usage
store.actions.setUser({ id: '1', name: 'John' });
store.subscribe((state) => console.log('State changed:', state));
```

---

### Server State (`query-core`)

Server-state management with caching (similar to React Query):

```typescript
import { QueryCore } from '@repo/query-core';

const queryCore = new QueryCore();

// Define an endpoint
await queryCore.defineEndpoint(
  'customers',
  () => fetch('/api/customers').then((r) => r.json()),
  { refetchAfter: 5 * 60 * 1000 }, // 5 minutes
);

// Subscribe to state
const unsubscribe = queryCore.subscribe('customers', (state) => {
  console.log('Data:', state.data);
  console.log('Loading:', state.isLoading);
  console.log('Error:', state.error);
});

// Refetch
await queryCore.refetch('customers');

// Invalidate cache
await queryCore.invalidate('customers');
```

---

### Forms (`forms-core`)

Framework-agnostic form management:

```typescript
import { createForm } from '@repo/forms-core';

const form = createForm({
  schema: CustomerSchema, // Zod schema
  initialValues: { name: '', email: '' },
  onSubmit: async (values) => {
    await api.createCustomer(values);
  },
});

// Field operations
form.setValue('name', 'John');
form.setTouched('name', true);

// Validation
const errors = form.validate();
const isValid = form.isValid();

// Submit
await form.submit();
```

---

### Headless UI Behaviors (`ui-core`)

Reusable UI logic without rendering:

```typescript
import {
  createDisclosure, // Accordion/collapsible
  createListSelection, // Single/multi select
  createRovingFocus, // Keyboard navigation
  createUndoRedoStack, // History management
} from '@repo/ui-core';

// List selection
const selection = createListSelection({ multiple: true });
selection.select('item-1');
selection.toggle('item-2');
selection.selectedIds$.subscribe((ids) => console.log('Selected:', ids));

// Undo/Redo
const history = createUndoRedoStack<DocumentState>();
history.push(currentState);
history.undo();
history.redo();
history.canUndo$.subscribe((can) => updateUndoButton(can));
```

---

### HTTP Client (`http-core`)

Enhanced HTTP client:

```typescript
import { createHttpClient } from '@repo/http-core';

const http = createHttpClient({
  baseURL: '/api',
  interceptors: {
    request: [
      (config) => {
        config.headers['Authorization'] = `Bearer ${token}`;
        return config;
      },
    ],
    response: [
      (response) => {
        if (response.status === 401) {
          refreshToken();
        }
        return response;
      },
    ],
  },
  retry: { attempts: 3, delay: 1000 },
});

const { data, cancel } = await http.get('/customers');
cancel(); // Cancel request
```

---

## Architecture Comparison

```
┌─────────────────────────────────────────────────────────────────┐
│                         PRISM (Desktop)                         │
├─────────────────────────────────────────────────────────────────┤
│  Views (XAML) ←→ ViewModels ←→ Models                          │
│       ↑              ↑           ↑                              │
│    Regions     DelegateCommand  Services                        │
│       ↑              ↑           ↑                              │
│  RegionManager  EventAggregator  DI Container                   │
│       ↑              ↑           ↑                              │
│            Module Catalog (IModule)                             │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                       WEB LOOM (Web/Mobile)                     │
├─────────────────────────────────────────────────────────────────┤
│  Views (React/Vue/Angular/Lit) ←→ ViewModels ←→ Models         │
│       ↑                               ↑           ↑             │
│  Shell Patterns (ui-patterns)     Command      Services         │
│       ↑                               ↑           ↑             │
│   Router (router-core)          EventBus    SimpleDIContainer   │
│       ↑                               ↑           ↑             │
│            Plugin System (plugin-core)                          │
│       ↑                               ↑           ↑             │
│   store-core  ←──────────────→  query-core  ←──→ http-core     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Summary

Web Loom successfully adapts Prism's desktop MVVM patterns for web/mobile development:

| Concern          | Prism                  | Web Loom                   |
| ---------------- | ---------------------- | -------------------------- |
| **Reactivity**   | INotifyPropertyChanged | RxJS Observables           |
| **Commands**     | DelegateCommand        | Command with async support |
| **Events**       | EventAggregator        | EventBus (typed)           |
| **Modularity**   | IModule                | PluginModule + Manifest    |
| **Composition**  | Regions                | Shell slots + UI patterns  |
| **DI**           | Unity/DryIoc           | SimpleDIContainer          |
| **Navigation**   | RegionManager          | Router                     |
| **Dialogs**      | IDialogService         | Dialog behaviors + Modal   |
| **Data Binding** | BindableBase           | BaseModel + BaseViewModel  |

**Key Adaptations:**

1. **Observables over PropertyChanged** - RxJS provides more powerful composition
2. **Plugin Manifest** - Declarative metadata for web module loading
3. **Framework Adapters** - Same core logic works across React, Vue, Angular, Lit
4. **Server State** - query-core handles API caching (not needed in desktop)
5. **Shell Patterns** - Flexible composition instead of rigid regions

Both frameworks share the core MVVM philosophy: **separation of concerns, testable business logic, and reusable patterns**.
