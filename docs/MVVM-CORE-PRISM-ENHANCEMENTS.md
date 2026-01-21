# MVVM-Core Enhancement Roadmap: Prism-Inspired Features

This document outlines Prism Library features that could enhance `mvvm-core` to make it a more complete standalone MVVM library for web/mobile applications. While other Web Loom packages handle concerns like DI, navigation, and plugins at the application level, these features would strengthen the core MVVM patterns within `mvvm-core` itself.

> **Context**: Prism Library is a mature MVVM framework for desktop applications (WPF, Xamarin, MAUI). This analysis focuses on core MVVM patterns that translate well to web/mobile development, adapted for RxJS-based reactive programming rather than INotifyPropertyChanged.

---

## Table of Contents

1. [Command System Enhancements](#1-command-system-enhancements)
2. [Property Change Notification Improvements](#2-property-change-notification-improvements)
3. [ViewModel Lifecycle Interfaces](#3-viewmodel-lifecycle-interfaces)
4. [Active Awareness Pattern](#4-active-awareness-pattern)
5. [Interaction Request Pattern](#5-interaction-request-pattern)
6. [Enhanced Validation Support](#6-enhanced-validation-support)
7. [Memory Leak Prevention Patterns](#7-memory-leak-prevention-patterns)
8. [ViewModel State Management](#8-viewmodel-state-management)
9. [Implementation Priority Matrix](#9-implementation-priority-matrix)

---

## 1. Command System Enhancements

### 1.1 CompositeCommand

**Status**: ❌ Not Implemented (mentioned in comparison doc but missing)

**Prism Pattern**: CompositeCommand aggregates multiple child commands and executes them collectively.

**Key Features**:

- Maintains a list of child DelegateCommands
- `canExecute$` returns false if ANY child cannot execute
- `isExecuting$` returns true if ANY child is executing
- `execute()` calls all child commands sequentially
- Optional active awareness monitoring (see §4)
- Memory management: Must unregister commands to prevent leaks

**Web Loom Adaptation**:

```typescript
interface ICompositeCommand<TParam = void, TResult = void[]> extends ICommand<TParam, TResult> {
  register(command: ICommand<TParam, any>): void;
  unregister(command: ICommand<TParam, any>): void;
  readonly registeredCommands: ReadonlyArray<ICommand<TParam, any>>;
  readonly monitorCommandActivity: boolean;
}

class CompositeCommand<TParam = void, TResult = void[]> implements ICompositeCommand<TParam, TResult>, IDisposable {
  private readonly commands = new Set<ICommand<TParam, any>>();
  private readonly _canExecute$: Observable<boolean>;
  private readonly _isExecuting$: Observable<boolean>;

  constructor(private readonly monitorCommandActivity: boolean = false) {
    // Aggregate child command states
    this._canExecute$ = combineLatest(Array.from(this.commands).map((cmd) => cmd.canExecute$)).pipe(
      map((canExecuteStates) => canExecuteStates.every((can) => can)),
    );

    this._isExecuting$ = combineLatest(Array.from(this.commands).map((cmd) => cmd.isExecuting$)).pipe(
      map((isExecutingStates) => isExecutingStates.some((is) => is)),
    );
  }

  register(command: ICommand<TParam, any>): void {
    if (this.monitorCommandActivity && !this.implementsActiveAware(command)) {
      console.warn('Command registered to active-aware CompositeCommand but does not implement IActiveAware');
    }
    this.commands.add(command);
  }

  unregister(command: ICommand<TParam, any>): void {
    this.commands.delete(command);
  }

  async execute(param: TParam): Promise<TResult> {
    const commandsToExecute = this.monitorCommandActivity
      ? Array.from(this.commands).filter((cmd) => (this.implementsActiveAware(cmd) ? cmd.isActive : true))
      : Array.from(this.commands);

    const results = await Promise.all(commandsToExecute.map((cmd) => cmd.execute(param)));

    return results as TResult;
  }

  dispose(): void {
    this.commands.clear();
  }
}
```

**Use Cases**:

- Save All: Execute save commands across multiple view models
- Zoom All: Apply zoom to all active child views
- Toolbar Actions: Single toolbar button triggers multiple related operations
- Batch Operations: Apply same action to collection of entities

**References**:

- [Prism Composite Commands Documentation](https://prismlibrary.github.io/docs/commands/composite-commands.html)
- [Prism DelegateCommand and CompositeCommand (CodeProject)](https://www.codeproject.com/Articles/1055060/DelegateCommand-and-CompositeCommand-in-Prism)

---

### 1.2 ObservesProperty / ObservesCanExecute

**Status**: ⚠️ Partially Implemented (supports Observable<boolean> for canExecute but not property observation)

**Prism Pattern**: Commands automatically observe properties and re-evaluate `CanExecute` when properties change.

**Prism Syntax**:

```csharp
SubmitCommand = new DelegateCommand(ExecuteSubmit, CanExecuteSubmit)
    .ObservesProperty(() => IsValid)
    .ObservesProperty(() => IsNotBusy);
```

**Web Loom Adaptation**:

```typescript
class Command<TParam = void, TResult = void> implements ICommand<TParam, TResult> {
  private readonly observedProperties: Observable<any>[] = [];

  /**
   * Observes a property observable and re-evaluates canExecute$ when it changes
   */
  observesProperty<T>(property$: Observable<T>): this {
    this.observedProperties.push(property$);

    // Recombine canExecute$ with all observed properties
    this._canExecute$ = combineLatest([this.baseCanExecute$, ...this.observedProperties]).pipe(
      map(([baseCanExecute, ...props]) => {
        // Custom logic: all observed properties must be truthy
        return baseCanExecute && props.every((p) => !!p);
      }),
    );

    return this; // Fluent API
  }

  /**
   * Directly observes an observable for canExecute evaluation
   */
  observesCanExecute(canExecute$: Observable<boolean>): this {
    // Combine with existing canExecute$
    this._canExecute$ = combineLatest([this._canExecute$, canExecute$]).pipe(
      map(([current, observed]) => current && observed),
    );

    return this; // Fluent API
  }
}

// Usage
class MyViewModel extends BaseViewModel<MyModel> {
  public readonly isValid$: Observable<boolean>;
  public readonly isNotBusy$: Observable<boolean>;
  public readonly submitCommand: ICommand<void, void>;

  constructor(model: MyModel) {
    super(model);

    this.isValid$ = this.data$.pipe(map((data) => data !== null && data.name.length > 0));

    this.isNotBusy$ = this.isLoading$.pipe(map((loading) => !loading));

    // Fluent command configuration
    this.submitCommand = new Command(() => this.submit())
      .observesProperty(this.isValid$)
      .observesProperty(this.isNotBusy$);
  }
}
```

**Benefits**:

- Declarative command configuration
- Automatic CanExecute re-evaluation
- Reduces boilerplate for complex command enablement logic
- Fluent API improves readability

**References**:

- [Prism Commanding Documentation](https://docs.prismlibrary.com/docs/commands/commanding.html)
- [ObservesProperty GitHub Discussion](https://github.com/PrismLibrary/Prism/issues/760)

---

### 1.3 Explicit RaiseCanExecuteChanged

**Status**: ❌ Not Implemented

**Prism Pattern**: Manual trigger for CanExecute re-evaluation.

```typescript
interface ICommand<TParam = void, TResult = void> {
  // ... existing properties

  /**
   * Manually trigger re-evaluation of canExecute$ and notify subscribers
   * Useful when canExecute depends on external state changes
   */
  raiseCanExecuteChanged(): void;
}

class Command<TParam = void, TResult = void> implements ICommand<TParam, TResult> {
  private readonly _canExecuteSubject = new BehaviorSubject<boolean>(true);

  raiseCanExecuteChanged(): void {
    // Re-evaluate the current canExecute state
    this.canExecute$.pipe(first()).subscribe((canExecute) => {
      this._canExecuteSubject.next(canExecute);
    });
  }
}

// Usage: When external state changes affect command availability
class MyViewModel extends BaseViewModel<MyModel> {
  private selectedItems: Item[] = [];

  updateSelection(items: Item[]): void {
    this.selectedItems = items;
    this.deleteCommand.raiseCanExecuteChanged();
  }
}
```

---

## 2. Property Change Notification Improvements

### 2.1 Enhanced SetProperty with Callbacks

**Status**: ⚠️ Partially Implemented (BaseModel has setData but no granular property setters)

**Prism Pattern**: `SetProperty<T>` method with optional callbacks and property name validation.

**Prism Syntax**:

```csharp
private string _name;
public string Name
{
    get => _name;
    set => SetProperty(ref _name, value, OnNameChanged);
}

private void OnNameChanged()
{
    // Custom logic after property change
    SubmitCommand.RaiseCanExecuteChanged();
}
```

**Web Loom Adaptation**:

```typescript
abstract class BaseViewModel<TModel extends BaseModel<any, any>> {
  // Existing properties...

  /**
   * Creates a managed property with automatic change notifications
   * @param initialValue Initial value
   * @param onChanged Optional callback invoked after value changes
   * @param propertyName Optional property name for debugging
   */
  protected createProperty<T>(
    initialValue: T,
    onChanged?: (oldValue: T, newValue: T) => void,
    propertyName?: string,
  ): {
    value$: Observable<T>;
    setValue: (newValue: T) => void;
    getValue: () => T;
  } {
    const subject$ = new BehaviorSubject<T>(initialValue);

    return {
      value$: subject$.asObservable().pipe(distinctUntilChanged(), takeUntil(this._destroy$)),

      setValue: (newValue: T) => {
        const oldValue = subject$.value;

        if (oldValue !== newValue) {
          subject$.next(newValue);

          if (onChanged) {
            onChanged(oldValue, newValue);
          }
        }
      },

      getValue: () => subject$.value,
    };
  }
}

// Usage
class CustomerViewModel extends BaseViewModel<CustomerModel> {
  private readonly _firstName = this.createProperty(
    '',
    (oldValue, newValue) => {
      console.log(`First name changed from "${oldValue}" to "${newValue}"`);
      this.saveCommand.raiseCanExecuteChanged();
    },
    'firstName',
  );

  public readonly firstName$ = this._firstName.value$;
  public setFirstName = this._firstName.setValue;
}
```

**Benefits**:

- Consistent property change handling
- Automatic change notifications
- Memory leak prevention via takeUntil
- Type-safe property access
- Optional callbacks for side effects

---

### 2.2 Property Change Validation

**Status**: ⚠️ Exists in BaseModel but could be enhanced

```typescript
abstract class BaseViewModel<TModel extends BaseModel<any, any>> {
  protected createValidatedProperty<T>(
    initialValue: T,
    validator: (value: T) => boolean | string,
    propertyName?: string,
  ): {
    value$: Observable<T>;
    error$: Observable<string | null>;
    isValid$: Observable<boolean>;
    setValue: (newValue: T) => void;
  } {
    const subject$ = new BehaviorSubject<T>(initialValue);
    const error$ = new BehaviorSubject<string | null>(null);

    return {
      value$: subject$.asObservable().pipe(takeUntil(this._destroy$)),
      error$: error$.asObservable().pipe(takeUntil(this._destroy$)),
      isValid$: error$.pipe(map((err) => err === null)),

      setValue: (newValue: T) => {
        const validationResult = validator(newValue);

        if (validationResult === true) {
          error$.next(null);
          subject$.next(newValue);
        } else {
          const errorMessage = typeof validationResult === 'string' ? validationResult : 'Invalid value';
          error$.next(errorMessage);
        }
      },
    };
  }
}
```

---

## 3. ViewModel Lifecycle Interfaces

### 3.1 INavigationAware

**Status**: ❌ Not Implemented (navigation exists in router-core but no ViewModel participation)

**Prism Pattern**: ViewModels participate in navigation lifecycle.

```typescript
/**
 * Navigation context passed to lifecycle methods
 */
interface NavigationContext {
  readonly parameters: Record<string, any>;
  readonly uri: string;
  readonly navigationMode: 'new' | 'back' | 'forward' | 'replace';
}

/**
 * Implement this interface to participate in navigation
 */
interface INavigationAware {
  /**
   * Called to determine if this ViewModel can handle the navigation request.
   * Useful for view reuse (e.g., detail view showing different items)
   */
  isNavigationTarget(context: NavigationContext): boolean;

  /**
   * Called when navigating TO this ViewModel
   * Use this to initialize state, load data, or read navigation parameters
   */
  onNavigatedTo(context: NavigationContext): void | Promise<void>;

  /**
   * Called when navigating AWAY from this ViewModel
   * Use this to save state or perform cleanup
   */
  onNavigatedFrom(context: NavigationContext): void | Promise<void>;
}

// Usage
class CustomerDetailViewModel extends BaseViewModel<CustomerModel> implements INavigationAware {
  private currentCustomerId: string | null = null;

  isNavigationTarget(context: NavigationContext): boolean {
    const customerId = context.parameters['customerId'];
    // Reuse this ViewModel if showing the same customer
    return this.currentCustomerId === customerId;
  }

  async onNavigatedTo(context: NavigationContext): Promise<void> {
    this.currentCustomerId = context.parameters['customerId'];
    await this.loadCustomerCommand.execute(this.currentCustomerId);
  }

  async onNavigatedFrom(context: NavigationContext): Promise<void> {
    // Save any pending changes
    if (this.hasUnsavedChanges) {
      await this.saveCommand.execute();
    }
  }
}
```

**Integration with router-core**: The router would check if ViewModels implement INavigationAware and call lifecycle methods appropriately.

**References**:

- [Prism Navigation Documentation](https://prismlibrary.github.io/docs/wpf/legacy/Navigation.html)
- [View and ViewModel Participation in Navigation](https://prismlibrary.github.io/docs/wpf/region-navigation/view-viewmodel-participation.html)

---

### 3.2 IConfirmNavigationRequest

**Status**: ❌ Not Implemented

**Prism Pattern**: ViewModels can confirm or cancel navigation (e.g., "You have unsaved changes").

```typescript
/**
 * Callback for navigation confirmation
 */
type NavigationCallback = (canNavigate: boolean) => void;

/**
 * Extends INavigationAware to add confirmation capability
 */
interface IConfirmNavigationRequest extends INavigationAware {
  /**
   * Called before navigation occurs, allowing the ViewModel to confirm or cancel
   * @param context Navigation context
   * @param callback Callback to invoke with confirmation result
   */
  confirmNavigationRequest(context: NavigationContext, callback: NavigationCallback): void | Promise<void>;
}

// Usage
class EditFormViewModel extends BaseViewModel<FormModel> implements IConfirmNavigationRequest {
  private hasUnsavedChanges = false;

  async confirmNavigationRequest(context: NavigationContext, callback: NavigationCallback): Promise<void> {
    if (!this.hasUnsavedChanges) {
      callback(true);
      return;
    }

    // Show confirmation dialog (using ui-core or notifications-core)
    const confirmed = await this.dialogService.confirm(
      'You have unsaved changes. Are you sure you want to leave?',
      'Unsaved Changes',
    );

    callback(confirmed);
  }

  isNavigationTarget(context: NavigationContext): boolean {
    return true;
  }

  onNavigatedTo(context: NavigationContext): void {
    this.hasUnsavedChanges = false;
  }

  onNavigatedFrom(context: NavigationContext): void {
    // Cleanup
  }
}
```

**References**:

- [Confirming Navigation (Prism)](https://docs.prismlibrary.com/docs/navigation/regions/confirming-navigation.html)
- [3 Navigation Service (PrismNew)](https://prismnew.readthedocs.io/en/latest/Xamarin-Forms/3-Navigation-Service/)

---

### 3.3 IInitialize / IInitializeAsync

**Status**: ❌ Not Implemented

**Prism Pattern**: Separate initialization from constructor for async operations.

```typescript
/**
 * Synchronous initialization interface
 */
interface IInitialize {
  initialize(parameters: Record<string, any>): void;
}

/**
 * Asynchronous initialization interface
 */
interface IInitializeAsync {
  initializeAsync(parameters: Record<string, any>): Promise<void>;
}

// Usage
class DashboardViewModel extends BaseViewModel<DashboardModel> implements IInitializeAsync {
  async initializeAsync(parameters: Record<string, any>): Promise<void> {
    // Heavy initialization logic
    await this.loadUserPreferences();
    await this.loadDashboardData();

    // Subscribe to real-time updates
    this.setupRealTimeSubscriptions();
  }

  private async loadUserPreferences(): Promise<void> {
    // ...
  }
}
```

**Benefits over constructor**:

- Async operations without blocking instantiation
- Navigation parameters available during init
- Testability: Can test ViewModel without triggering initialization
- Framework integration: DI container can instantiate, then framework calls initialize

---

### 3.4 IDestructible

**Status**: ⚠️ Partially via dispose() but not formalized

**Prism Pattern**: Cleanup hook called before ViewModel destruction.

```typescript
interface IDestructible {
  /**
   * Called when the ViewModel is about to be destroyed
   * Perform final cleanup, save state, etc.
   */
  onDestroy(): void | Promise<void>;
}

// Enhanced BaseViewModel
abstract class BaseViewModel<TModel extends BaseModel<any, any>> implements IDisposable {
  public dispose(): void {
    // Check if implements IDestructible
    if (this.implementsDestructible()) {
      (this as any).onDestroy();
    }

    this._destroy$.next();
    this._destroy$.complete();
    this._subscriptions.unsubscribe();
  }

  private implementsDestructible(): this is this & IDestructible {
    return 'onDestroy' in this && typeof (this as any).onDestroy === 'function';
  }
}
```

---

### 3.5 IRegionMemberLifetime (KeepAlive)

**Status**: ❌ Not Implemented

**Prism Pattern**: Controls whether a view/ViewModel is kept alive when deactivated.

```typescript
interface IViewLifetime {
  /**
   * When false, the ViewModel is disposed when navigating away
   * When true, the ViewModel is kept in memory for fast reactivation
   */
  readonly keepAlive: boolean;
}

// Usage
class CustomerListViewModel extends BaseViewModel<CustomerListModel> implements IViewLifetime {
  // Keep this view alive for fast back navigation
  readonly keepAlive = true;
}

class CustomerDetailViewModel extends BaseViewModel<CustomerDetailModel> implements IViewLifetime {
  // Don't keep detail views in memory
  readonly keepAlive = false;
}
```

**Integration**: Framework-level integration with router-core or ui-patterns for shell management.

---

## 4. Active Awareness Pattern

### 4.1 IActiveAware Interface

**Status**: ❌ Not Implemented

**Prism Pattern**: Tracks whether a ViewModel/Command is currently "active" (e.g., visible tab, selected region).

```typescript
/**
 * Implement this interface for ViewModels or Commands that need to know
 * if they are currently active
 */
interface IActiveAware {
  /**
   * Gets or sets whether the object is active
   */
  isActive: boolean;

  /**
   * Observable that emits when active state changes
   */
  readonly isActive$: Observable<boolean>;
}

// Base implementation
abstract class ActiveAwareViewModel<TModel extends BaseModel<any, any>>
  extends BaseViewModel<TModel>
  implements IActiveAware
{
  private readonly _isActive$ = new BehaviorSubject<boolean>(false);
  public readonly isActive$ = this._isActive$.asObservable();

  get isActive(): boolean {
    return this._isActive$.value;
  }

  set isActive(value: boolean) {
    if (this._isActive$.value !== value) {
      this._isActive$.next(value);
      this.onIsActiveChanged(value);
    }
  }

  /**
   * Override this method to react to active state changes
   */
  protected onIsActiveChanged(isActive: boolean): void {
    // Default: no-op
  }
}

// Usage with tabs
class TabViewModel extends ActiveAwareViewModel<TabModel> {
  protected onIsActiveChanged(isActive: boolean): void {
    if (isActive) {
      // Tab became active: refresh data, start animations
      this.refreshCommand.execute();
    } else {
      // Tab became inactive: pause updates, stop animations
      this.pauseUpdates();
    }
  }
}
```

**Integration with CompositeCommand**:

```typescript
const zoomInCommand = new CompositeCommand(true); // monitorCommandActivity = true

// Only active tabs will execute zoom
tab1ViewModel.zoomCommand; // isActive = true → executes
tab2ViewModel.zoomCommand; // isActive = false → skips
```

**References**:

- [Prism IActiveAware and CompositeCommand](https://prismlibrary.github.io/docs/commands/composite-commands.html)

---

## 5. Interaction Request Pattern

### 5.1 InteractionRequest<T>

**Status**: ❌ Not Implemented

**Prism Pattern**: ViewModels request interactions from the View without direct coupling.

**Purpose**: ViewModels need to trigger UI-specific behaviors (show dialog, display notification, ask for confirmation) without knowing about the View.

```typescript
/**
 * Notification data for an interaction request
 */
interface INotification {
  title?: string;
  content: string;
}

/**
 * Confirmation request with callback
 */
interface IConfirmation extends INotification {
  confirmed?: boolean;
}

/**
 * Interaction request event
 */
interface InteractionRequestedEvent<T> {
  context: T;
  callback: (response: T) => void;
}

/**
 * Manages interaction requests between ViewModel and View
 */
class InteractionRequest<T extends INotification> {
  private readonly _requested$ = new Subject<InteractionRequestedEvent<T>>();
  public readonly requested$ = this._requested$.asObservable();

  /**
   * Raise an interaction request
   * @param context The interaction context data
   * @param callback Optional callback for the response
   */
  raise(context: T, callback?: (response: T) => void): void {
    this._requested$.next({
      context,
      callback: callback || (() => {})
    });
  }
}

// Usage in ViewModel
class OrderViewModel extends BaseViewModel<OrderModel> {
  public readonly confirmDeleteRequest = new InteractionRequest<IConfirmation>();
  public readonly deleteCommand: ICommand<void, void>;

  constructor(model: OrderModel) {
    super(model);

    this.deleteCommand = new Command(async () => {
      // Request confirmation from the View
      this.confirmDeleteRequest.raise(
        {
          title: 'Delete Order',
          content: 'Are you sure you want to delete this order? This cannot be undone.'
        },
        (response) => {
          if (response.confirmed) {
            this.performDelete();
          }
        }
      );
    });
  }

  private async performDelete(): Promise<void> {
    await this.model.delete();
  }
}

// Usage in View (React example)
function OrderView() {
  const [vm] = useState(() => new OrderViewModel(new OrderModel()));
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmContext, setConfirmContext] = useState<IConfirmation | null>(null);

  useEffect(() => {
    const sub = vm.confirmDeleteRequest.requested$.subscribe(event => {
      setConfirmContext(event.context);
      setShowConfirmDialog(true);
    });

    return () => {
      sub.unsubscribe();
      vm.dispose();
    };
  }, []);

  const handleConfirm = () => {
    if (confirmContext) {
      confirmContext.confirmed = true;
      setShowConfirmDialog(false);
    }
  };

  return (
    <>
      <button onClick={() => vm.deleteCommand.execute()}>Delete</button>

      {showConfirmDialog && (
        <ConfirmDialog
          title={confirmContext?.title}
          message={confirmContext?.content}
          onConfirm={handleConfirm}
          onCancel={() => setShowConfirmDialog(false)}
        />
      )}
    </>
  );
}
```

**Benefits**:

- Complete separation of concerns: ViewModel has zero UI knowledge
- Testable: Can test ViewModel interaction logic without rendering UI
- Framework-agnostic: Same ViewModel works across React, Vue, Angular
- Type-safe interaction contracts

**Interaction Types**:

- `NotificationRequest`: Show toast/snackbar
- `ConfirmationRequest`: Yes/No dialogs
- `InputRequest`: Prompt for user input
- `NavigationRequest`: Request navigation to another view
- `FilePickerRequest`: Request file selection

**References**:

- [Prism Advanced MVVM Scenarios](https://prismlibrary.github.io/docs/wpf/legacy/Implementing-MVVM.html)
- [Implementing MVVM Pattern Using Prism Library (Microsoft)](<https://learn.microsoft.com/en-us/previous-versions/msp-n-p/gg405484(v=pandp.40)>)

---

## 6. Enhanced Validation Support

### 6.1 ErrorsContainer

**Status**: ⚠️ Partial (BaseModel has error$ but no property-level errors)

**Prism Pattern**: Tracks validation errors per property with INotifyDataErrorInfo support.

```typescript
/**
 * Tracks validation errors for multiple properties
 */
class ErrorsContainer<T = any> {
  private readonly errors = new Map<keyof T, string[]>();
  private readonly _errorsChanged$ = new Subject<keyof T | null>();
  public readonly errorsChanged$ = this._errorsChanged$.asObservable();

  /**
   * Set errors for a specific property
   */
  setErrors(propertyName: keyof T, errors: string[]): void {
    const hasErrorsBefore = this.hasErrors;

    if (errors.length === 0) {
      this.errors.delete(propertyName);
    } else {
      this.errors.set(propertyName, [...errors]);
    }

    this._errorsChanged$.next(propertyName);

    if (hasErrorsBefore !== this.hasErrors) {
      this._errorsChanged$.next(null); // Signal overall error state changed
    }
  }

  /**
   * Get errors for a specific property
   */
  getErrors(propertyName: keyof T): string[] {
    return this.errors.get(propertyName) || [];
  }

  /**
   * Check if a property has errors
   */
  hasPropertyErrors(propertyName: keyof T): boolean {
    return this.errors.has(propertyName);
  }

  /**
   * Check if any property has errors
   */
  get hasErrors(): boolean {
    return this.errors.size > 0;
  }

  /**
   * Get all errors as a flat array
   */
  getAllErrors(): string[] {
    return Array.from(this.errors.values()).flat();
  }

  /**
   * Clear errors for a specific property or all properties
   */
  clearErrors(propertyName?: keyof T): void {
    if (propertyName) {
      this.errors.delete(propertyName);
      this._errorsChanged$.next(propertyName);
    } else {
      this.errors.clear();
      this._errorsChanged$.next(null);
    }
  }

  /**
   * Get errors as an observable stream
   */
  getErrors$(propertyName: keyof T): Observable<string[]> {
    return this._errorsChanged$.pipe(
      filter((prop) => prop === null || prop === propertyName),
      map(() => this.getErrors(propertyName)),
      startWith(this.getErrors(propertyName)),
    );
  }
}

// Usage in ViewModel
interface CustomerData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

class CustomerFormViewModel extends BaseViewModel<CustomerModel> {
  private readonly errorsContainer = new ErrorsContainer<CustomerData>();

  public readonly hasErrors$ = this.errorsContainer.errorsChanged$.pipe(map(() => this.errorsContainer.hasErrors));

  public readonly firstNameErrors$ = this.errorsContainer.getErrors$('firstName');
  public readonly emailErrors$ = this.errorsContainer.getErrors$('email');

  validateFirstName(value: string): void {
    const errors: string[] = [];

    if (!value || value.trim().length === 0) {
      errors.push('First name is required');
    }

    if (value.length < 2) {
      errors.push('First name must be at least 2 characters');
    }

    this.errorsContainer.setErrors('firstName', errors);
  }

  validateEmail(value: string): void {
    const errors: string[] = [];

    if (!value || value.trim().length === 0) {
      errors.push('Email is required');
    } else if (!this.isValidEmail(value)) {
      errors.push('Email format is invalid');
    }

    this.errorsContainer.setErrors('email', errors);
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
}
```

**Integration with Zod**: Can combine with BaseModel's Zod validation:

```typescript
class CustomerFormViewModel extends BaseViewModel<CustomerModel> {
  private readonly errorsContainer = new ErrorsContainer<CustomerData>();

  validateWithZod(data: CustomerData): void {
    try {
      this.model.validate(data);
      this.errorsContainer.clearErrors();
    } catch (error) {
      if (error instanceof ZodError) {
        error.errors.forEach((err) => {
          const propertyName = err.path[0] as keyof CustomerData;
          const currentErrors = this.errorsContainer.getErrors(propertyName);
          this.errorsContainer.setErrors(propertyName, [...currentErrors, err.message]);
        });
      }
    }
  }
}
```

**References**:

- [ErrorsContainer Class (Microsoft)](<https://learn.microsoft.com/en-us/previous-versions/msp-n-p/gg431577(v=pandp.50)>)
- [Prism.Validation (GitHub)](https://github.com/mfe-/Prism.Validation)

---

### 6.2 Async Validation Support

```typescript
class AsyncErrorsContainer<T = any> extends ErrorsContainer<T> {
  private readonly validatingProperties = new Set<keyof T>();
  private readonly _isValidating$ = new BehaviorSubject<boolean>(false);
  public readonly isValidating$ = this._isValidating$.asObservable();

  async validateAsync(propertyName: keyof T, value: any, validator: (value: any) => Promise<string[]>): Promise<void> {
    this.validatingProperties.add(propertyName);
    this._isValidating$.next(true);

    try {
      const errors = await validator(value);
      this.setErrors(propertyName, errors);
    } finally {
      this.validatingProperties.delete(propertyName);
      this._isValidating$.next(this.validatingProperties.size > 0);
    }
  }
}

// Usage: Async email uniqueness check
class RegistrationViewModel extends BaseViewModel<RegistrationModel> {
  private readonly errorsContainer = new AsyncErrorsContainer<RegistrationData>();

  async validateEmailUniqueness(email: string): Promise<void> {
    await this.errorsContainer.validateAsync('email', email, async (value) => {
      const exists = await this.userService.emailExists(value);
      return exists ? ['This email is already registered'] : [];
    });
  }
}
```

---

## 7. Memory Leak Prevention Patterns

### 7.1 WeakEvent Pattern

**Status**: ⚠️ RxJS handles this differently (unsubscribe), but could formalize

**Prism Pattern**: Weak event subscriptions prevent memory leaks when event sources outlive subscribers.

**Problem**: In Prism/WPF, if a long-lived object (e.g., singleton service) raises events that ViewModels subscribe to, the event source holds strong references to ViewModels, preventing garbage collection even after Views are destroyed.

**Web Loom Context**: RxJS subscriptions have the same problem if not properly unsubscribed.

**Solution**: Formalize subscription management in BaseViewModel:

```typescript
abstract class BaseViewModel<TModel extends BaseModel<any, any>> {
  protected readonly _subscriptions = new Subscription();
  protected readonly _destroy$ = new Subject<void>();

  /**
   * Register a subscription for automatic cleanup on dispose
   */
  protected registerSubscription(subscription: Subscription): void {
    this._subscriptions.add(subscription);
  }

  /**
   * Subscribe to an observable with automatic cleanup
   */
  protected subscribe<T>(
    observable$: Observable<T>,
    next?: (value: T) => void,
    error?: (error: any) => void,
    complete?: () => void,
  ): Subscription {
    const sub = observable$.pipe(takeUntil(this._destroy$)).subscribe({
      next,
      error,
      complete,
    });

    this._subscriptions.add(sub);
    return sub;
  }

  /**
   * Create an observable that automatically completes when ViewModel is disposed
   */
  protected createManagedObservable<T>(factory: (observer: Observer<T>) => TeardownLogic): Observable<T> {
    return new Observable<T>(factory).pipe(takeUntil(this._destroy$));
  }
}

// Usage: Safe event bus subscriptions
class DashboardViewModel extends BaseViewModel<DashboardModel> {
  constructor(
    model: DashboardModel,
    private readonly eventBus: EventBus<AppEvents>,
  ) {
    super(model);

    // This subscription will automatically clean up when disposed
    this.subscribe(this.eventBus.on('user:logged-out'), () => this.handleLogout());
  }
}
```

**Audit Tool**: Could add a static registry to track active ViewModels and detect leaks:

```typescript
class ViewModelRegistry {
  private static instances = new WeakMap<BaseViewModel<any>, string>();

  static register(vm: BaseViewModel<any>, name: string): void {
    this.instances.set(vm, name);
  }

  static getActiveCount(): number {
    // In development mode, track active ViewModels
    // Could integrate with memory profiling tools
    return 0; // Placeholder
  }
}
```

**References**:

- [Weak Event Patterns (Microsoft)](https://learn.microsoft.com/en-us/dotnet/desktop/wpf/events/weak-event-patterns)
- [Prism Memory Leak Issues (GitHub)](https://github.com/PrismLibrary/Prism/issues/345)
- [Preventing Event-based Memory Leaks (Reed Copsey)](http://reedcopsey.com/2009/08/06/preventing-event-based-memory-leaks-weakeventmanager/)

---

### 7.2 Automatic Command Disposal

**Current Issue**: Commands created in ViewModels are not automatically disposed.

```typescript
abstract class BaseViewModel<TModel extends BaseModel<any, any>> {
  private readonly commands: ICommand<any, any>[] = [];

  /**
   * Register a command for automatic disposal
   */
  protected registerCommand<TParam, TResult>(command: ICommand<TParam, TResult>): ICommand<TParam, TResult> {
    this.commands.push(command);
    return command;
  }

  public dispose(): void {
    // Dispose all registered commands
    this.commands.forEach((cmd) => {
      if ('dispose' in cmd && typeof (cmd as any).dispose === 'function') {
        (cmd as any).dispose();
      }
    });

    this._destroy$.next();
    this._destroy$.complete();
    this._subscriptions.unsubscribe();
  }
}

// Usage
class MyViewModel extends BaseViewModel<MyModel> {
  public readonly saveCommand = this.registerCommand(new Command(() => this.save()));
}
```

---

## 8. ViewModel State Management

### 8.1 Busy Indicator Pattern

**Status**: ⚠️ Exists via Command.isExecuting$ but not centralized

```typescript
abstract class BaseViewModel<TModel extends BaseModel<any, any>> {
  private readonly busyStack: string[] = [];
  private readonly _isBusy$ = new BehaviorSubject<boolean>(false);
  public readonly isBusy$ = this._isBusy$.asObservable();

  /**
   * Mark the ViewModel as busy with a reason
   * Returns a dispose function to clear the busy state
   */
  protected setBusy(reason: string = 'Loading'): () => void {
    this.busyStack.push(reason);
    this._isBusy$.next(true);

    return () => {
      const index = this.busyStack.indexOf(reason);
      if (index > -1) {
        this.busyStack.splice(index, 1);
      }

      if (this.busyStack.length === 0) {
        this._isBusy$.next(false);
      }
    };
  }

  /**
   * Execute an async operation with automatic busy state management
   */
  protected async executeBusy<T>(operation: () => Promise<T>, reason: string = 'Loading'): Promise<T> {
    const clearBusy = this.setBusy(reason);

    try {
      return await operation();
    } finally {
      clearBusy();
    }
  }
}

// Usage
class CustomerListViewModel extends BaseViewModel<CustomerListModel> {
  async loadCustomers(): Promise<void> {
    await this.executeBusy(async () => {
      const customers = await this.customerService.getAll();
      this.model.setData(customers);
    }, 'Loading customers');
  }
}
```

---

### 8.2 Dirty Tracking

**Status**: ❌ Not Implemented

```typescript
interface IDirtyTrackable {
  readonly isDirty$: Observable<boolean>;
  markClean(): void;
  markDirty(): void;
}

abstract class TrackableViewModel<TModel extends BaseModel<any, any>>
  extends BaseViewModel<TModel>
  implements IDirtyTrackable
{
  private readonly _isDirty$ = new BehaviorSubject<boolean>(false);
  public readonly isDirty$ = this._isDirty$.asObservable();

  markClean(): void {
    this._isDirty$.next(false);
  }

  markDirty(): void {
    this._isDirty$.next(true);
  }

  /**
   * Track changes to a property
   */
  protected trackProperty<T>(property$: Observable<T>): Observable<T> {
    return property$.pipe(
      tap(() => this.markDirty()),
      takeUntil(this._destroy$),
    );
  }
}

// Usage
class EditCustomerViewModel extends TrackableViewModel<CustomerModel> {
  public readonly firstName$ = this.trackProperty(this.model.data$.pipe(map((data) => data?.firstName ?? '')));

  public readonly canNavigateAway$ = this.isDirty$.pipe(map((isDirty) => !isDirty));
}
```

---

## 9. Implementation Priority Matrix

| Feature                                 | Impact | Effort | Priority | Dependencies            |
| --------------------------------------- | ------ | ------ | -------- | ----------------------- |
| **CompositeCommand**                    | High   | Low    | 🔴 P0    | None                    |
| **ObservesProperty/ObservesCanExecute** | High   | Medium | 🔴 P0    | Command enhancements    |
| **INavigationAware**                    | High   | Medium | 🟠 P1    | router-core integration |
| **InteractionRequest**                  | High   | Medium | 🟠 P1    | None                    |
| **ErrorsContainer**                     | High   | Medium | 🟠 P1    | None                    |
| **IActiveAware**                        | Medium | Low    | 🟡 P2    | CompositeCommand        |
| **IConfirmNavigationRequest**           | Medium | Low    | 🟡 P2    | INavigationAware        |
| **Enhanced SetProperty**                | Medium | Low    | 🟡 P2    | None                    |
| **RaiseCanExecuteChanged**              | Low    | Low    | 🟢 P3    | None                    |
| **WeakEvent Formalization**             | Low    | Low    | 🟢 P3    | None                    |
| **Dirty Tracking**                      | Medium | Low    | 🟢 P3    | None                    |
| **IDestructible**                       | Low    | Low    | 🟢 P3    | None                    |
| **IInitializeAsync**                    | Medium | Low    | 🟡 P2    | None                    |
| **Busy Indicator**                      | Medium | Low    | 🟡 P2    | None                    |

---

## Summary

This roadmap outlines **14 major feature categories** inspired by Prism Library that would enhance `mvvm-core` as a standalone MVVM library for web/mobile development:

### Core Command Enhancements (P0)

1. **CompositeCommand** - Execute multiple commands as one
2. **ObservesProperty/ObservesCanExecute** - Declarative command enablement

### ViewModel Lifecycle (P1-P2)

3. **INavigationAware** - Participate in navigation lifecycle
4. **IConfirmNavigationRequest** - Confirm or cancel navigation
5. **IInitializeAsync** - Async initialization separate from constructor
6. **IDestructible** - Cleanup hook before destruction
7. **IViewLifetime** - Control ViewModel lifecycle (keepAlive)

### UI Communication (P1)

8. **InteractionRequest** - ViewModel-to-View communication without coupling
9. **ErrorsContainer** - Property-level validation error tracking

### State Management (P2)

10. **IActiveAware** - Track active/inactive state
11. **Enhanced SetProperty** - Property change callbacks
12. **Dirty Tracking** - Track unsaved changes
13. **Busy Indicator** - Centralized busy state management

### Memory Management (P3)

14. **WeakEvent Pattern** - Formalized subscription management

All patterns are adapted for:

- **RxJS** instead of INotifyPropertyChanged
- **Web/Mobile** instead of desktop
- **Modern TypeScript** with strong typing
- **Framework-agnostic** design

---

## Sources

- [Prism Composite Commands Documentation](https://prismlibrary.github.io/docs/commands/composite-commands.html)
- [Prism Commanding Documentation](https://docs.prismlibrary.com/docs/commands/commanding.html)
- [Implementing the MVVM Pattern Using Prism Library](https://prismlibrary.github.io/docs/wpf/legacy/Implementing-MVVM.html)
- [Prism BindableBase Documentation](https://docs.prismlibrary.com/docs/mvvm/bindablebase.html)
- [BindableBase Source Code (GitHub)](https://github.com/PrismLibrary/Prism/blob/master/src/Prism.Core/Mvvm/BindableBase.cs)
- [Navigation Using Prism Library for WPF](https://prismlibrary.github.io/docs/wpf/legacy/Navigation.html)
- [View and ViewModel Participation in Navigation](https://prismlibrary.github.io/docs/wpf/region-navigation/view-viewmodel-participation.html)
- [Confirming Navigation (Prism)](https://docs.prismlibrary.com/docs/navigation/regions/confirming-navigation.html)
- [ErrorsContainer Class (Microsoft)](<https://learn.microsoft.com/en-us/previous-versions/msp-n-p/gg431577(v=pandp.50)>)
- [Prism.Validation (GitHub)](https://github.com/mfe-/Prism.Validation)
- [Weak Event Patterns (Microsoft)](https://learn.microsoft.com/en-us/dotnet/desktop/wpf/events/weak-event-patterns)
- [Prism Memory Leak Issues (GitHub)](https://github.com/PrismLibrary/Prism/issues/345)
- [DelegateCommand Source Code (GitHub)](https://github.com/PrismLibrary/Prism/blob/master/src/Prism.Core/Commands/DelegateCommand.cs)
- [Advanced MVVM Scenarios Using Prism Library](https://prismnew.readthedocs.io/en/latest/WPF/06-Advanced-MVVM/)
- [Microsoft Learn: Implementing MVVM Pattern Using Prism Library 5.0](<https://learn.microsoft.com/en-us/previous-versions/msp-n-p/gg405484(v=pandp.40)>)
