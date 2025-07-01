# Integrating query-core and store-core with MVVM Models

This document outlines how to integrate the `query-core` and `store-core` libraries into the Model layer of an Model-View-ViewModel (MVVM) architecture, using `BaseModel` from `mvvm-core` as a foundation. We'll use an e-commerce website as an example to illustrate these concepts.

## Core Libraries Overview

*   **`query-core`**: Responsible for fetching, caching, and managing the state of data from remote sources. It handles aspects like loading states, errors, and automatic refetching.
*   **`store-core`**: A client-side state management library for managing synchronous UI state or other application-wide data that doesn't necessarily come from a remote server (e.g., shopping cart contents, theme preferences).
*   **`BaseModel` (`mvvm-core`)**: A base class for models in MVVM, providing RxJS observables for data (`data$`), loading state (`isLoading$`), and errors (`error$`), along with Zod schema validation.

## Integration Strategy

The primary goal is to leverage `query-core` for asynchronous data operations and `store-core` for synchronous, client-side state management, both within the Model layer of the MVVM pattern. Extended versions of `BaseModel` will encapsulate this logic.

### Model Layer

The Model layer is the direct manager of application data and business logic.

*   **`query-core` in Models**:
    *   Models that deal with server-side data will use `query-core` to define endpoints, fetch data, and manage the lifecycle of that data (caching, staleness, refetching).
    *   The state from `query-core` (e.g., `isLoading`, `isError`, `data`, `lastUpdated`) will be used to update the corresponding observables in the `BaseModel` (e.g., `_isLoading$.next()`, `_error$.next()`, `_data$.next()`).
*   **`store-core` in Models**:
    *   Models that manage complex client-side state or shared state across different parts of the application can use `store-core`.
    *   For example, a `ShoppingCartModel` could use a `store-core` instance to manage cart items. The Model would define actions (like adding/removing items) that interact with the store, and subscribe to store changes to update its own `data$` observable.
    *   Alternatively, a global `store-core` instance could be used for application-wide state, and Models could select parts of this state or dispatch actions to it.

### ViewModel Layer

The ViewModel acts as an intermediary, preparing data from the Model for the View.

*   ViewModels will not directly interact with `query-core` or `store-core`.
*   They will subscribe to the observables (`data$`, `isLoading$`, `error$`) exposed by the Models.
*   They will expose data and commands to the View. User interactions that require data fetching or state modification will be delegated to methods on the Model.

### View Layer

The View remains responsible for UI presentation only.

*   It binds to properties and commands exposed by the ViewModel.
*   It does not contain any business logic or direct data access logic.

## Detailed Integration within Models

Let's explore how `BaseModel` can be extended or composed to work with `query-core` and `store-core`.

### Integrating `query-core` with `BaseModel`

A Model that fetches data from a server can integrate `query-core` as follows:

1.  **Instantiation**: The Model can create or be provided with a `QueryCore` instance. This instance can be shared across multiple models if appropriate (e.g., a global `queryClient`).
2.  **Endpoint Definition**: In its constructor or an initialization method (e.g., `_init`), the Model defines the necessary data endpoints using `queryCore.defineEndpoint()`. The fetcher function provided to `defineEndpoint` should handle fetching and can also include validation using the Model's Zod schema.
3.  **Subscription**: The Model subscribes to the state changes of its defined `query-core` endpoint(s).
4.  **State Synchronization**: When `query-core` emits a new state for an endpoint, the callback in the Model updates its own `_data$`, `_isLoading$`, and `_error$` subjects. This keeps the `BaseModel`'s reactive properties in sync with the query state.
5.  **Control Methods**: The Model can expose methods like `refetchData()` or `invalidateCache()` that internally call `queryCore.refetch()` or `queryCore.invalidate()` for the specific endpoint.
6.  **Disposal**: In its `dispose` method, the Model should unsubscribe from `query-core` to prevent memory leaks.

**Conceptual Example:**

```typescript
// File: models/ProductListModel.ts
// (Assuming types and classes are imported from their respective packages)
import { BaseModel, TConstructorInput } from '@web-loom/mvvm-core';
import QueryCore, { EndpointState } from '@web-loom/query-core';
import { z, ZodSchema } from 'zod';

// Define Product data structure and schema
interface Product {
  id: string;
  name: string;
  price: number;
  // other product fields
}
const ProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number().positive(),
});
const ProductListSchema = z.array(ProductSchema); // Schema for the list

// Input for the ProductListModel constructor
interface ProductListModelInput extends TConstructorInput<Product[] | null, typeof ProductListSchema> {
  queryCore: QueryCore; // Pass shared QueryCore instance
  apiEndpointUrl: string; // e.g., '/api/products'
}

export class ProductListModel extends BaseModel<Product[] | null, typeof ProductListSchema> {
  private queryCore: QueryCore;
  private apiEndpointUrl: string;
  private productsEndpointKey: string;
  private unsubscribeFromQuery?: () => void;

  constructor(input: ProductListModelInput) {
    super({ initialData: input.initialData || null, schema: ProductListSchema });
    this.queryCore = input.queryCore;
    this.apiEndpointUrl = input.apiEndpointUrl;
    // Ensure a unique key if multiple instances of this model might exist for different lists
    this.productsEndpointKey = `products-${this.apiEndpointUrl}`;
    this._initializeDataSource();
  }

  private async _initializeDataSource(): Promise<void> {
    // Define the endpoint for fetching products
    await this.queryCore.defineEndpoint<Product[]>(
      this.productsEndpointKey,
      async () => { // This is the fetcher function
        this.setLoading(true); // Manually set loading true before fetch starts
        try {
          const response = await fetch(this.apiEndpointUrl);
          if (!response.ok) {
            throw new Error(`Failed to fetch products: ${response.statusText}`);
          }
          const rawData = await response.json();
          const validatedData = this.validate(rawData); // Use BaseModel's validation
          this.clearError();
          return validatedData;
        } catch (error) {
          this.setError(error);
          // QueryCore also catches and sets error in its state, this is for BaseModel
          throw error; // Re-throw for QueryCore to handle
        } finally {
          // setLoading(false) will be handled by QueryCore's state subscription
        }
      },
      { refetchAfter: 5 * 60 * 1000 } // Example: refetch after 5 minutes
    );

    // Subscribe to the endpoint's state changes
    this.unsubscribeFromQuery = this.queryCore.subscribe<Product[]>(
      this.productsEndpointKey,
      (state: EndpointState<Product[]>) => {
        this.setLoading(state.isLoading);
        if (state.isError) {
          this.setError(state.error);
          // Optionally, decide if data should be cleared or kept stale
          // this.setData(null);
        } else if (state.data !== undefined) { // data can be null if API returns null
          this.setData(state.data); // This will update _data$
          this.clearError(); // Clear previous errors on successful fetch
        }
        // state.lastUpdated could be stored in the model if needed for specific logic
      }
    );

    // Optional: Trigger initial fetch if desired, though QueryCore's subscribe might do it
    // if it finds stale or no data based on its configuration.
    // this.queryCore.refetch(this.productsEndpointKey);
  }

  public refreshProducts(force: boolean = false): void {
    this.queryCore.refetch(this.productsEndpointKey, force);
  }

  public invalidateProductCache(): Promise<void> {
    return this.queryCore.invalidate(this.productsEndpointKey);
  }

  public dispose(): void {
    super.dispose(); // Completes _data$, _isLoading$, _error$
    if (this.unsubscribeFromQuery) {
      this.unsubscribeFromQuery();
    }
    // Note: We don't destroy the shared queryCore instance here.
    // Its lifecycle is managed elsewhere.
  }
}
```

### Integrating `store-core` with `BaseModel`

A Model that manages complex client-side state (like a shopping cart or UI preferences) can integrate `store-core`:

1.  **Store Instantiation**:
    *   The Model can create and own a `store-core` instance for its specific domain.
    *   Alternatively, it can interact with a global or feature-scoped `store-core` instance provided to it.
2.  **Actions Definition**: The Model defines public methods that serve as actions. These methods internally call `store.actions` from the `store-core` instance to modify the state.
3.  **State Subscription**: The Model subscribes to the `store-core` instance's state changes.
4.  **State Synchronization/Transformation**:
    *   When the `store-core` state changes, the Model's subscription callback is triggered.
    *   The Model can then:
        *   Directly set this state (or a part of it) to its `_data$` subject if the structure matches.
        *   Transform the store's state into a different structure suitable for its `_data$` observable (e.g., calculating totals for a shopping cart) and then set it. This transformation logic resides within the Model.
    *   Validation (using Zod schema if defined for `BaseModel.data$`) should be applied to the data before updating `_data$`.
5.  **Disposal**: In its `dispose` method, the Model should unsubscribe from the `store-core` instance and, if it owns the store, call `store.destroy()` to clean up listeners.

**Conceptual Example:**

```typescript
// File: models/ShoppingCartModel.ts
// (Assuming types and classes are imported from their respective packages)
import { BaseModel, TConstructorInput } from '@web-loom/mvvm-core';
import { createStore, Store, State as StoreState, Actions as StoreActions } from '@web-loom/store-core';
import { z, ZodSchema } from 'zod';

// Define Cart item structure and schema (used by store and model)
interface CartItem {
  productId: string;
  name: string; // Added for display convenience in CartViewData
  quantity: number;
  unitPrice: number;
}
const CartItemSchema = z.object({
  productId: z.string(),
  name: z.string(),
  quantity: z.number().int().min(1),
  unitPrice: z.number().positive(),
});

// Define Cart state for store-core
interface CartStoreState extends StoreState {
  items: CartItem[];
}
// Define Cart actions for store-core
interface CartStoreActions extends StoreActions<CartStoreState, CartStoreActions> {
  addItem: (item: CartItem) => void;
  removeItem: (productId: string) => void;
  updateItemQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
}

// Define the structure for the ShoppingCartModel's data$ (derived/transformed data)
export interface CartViewData {
  items: CartItem[];
  totalPrice: number;
  itemCount: number;
}
const CartViewDataSchema = z.object({
  items: z.array(CartItemSchema),
  totalPrice: z.number().nonnegative(),
  itemCount: z.number().int().nonnegative(),
});

// Input for the ShoppingCartModel constructor
interface ShoppingCartModelInput extends TConstructorInput<CartViewData | null, typeof CartViewDataSchema> {
  // Optionally, pass a pre-configured store-core instance if it's shared
  // externalCartStore?: Store<CartStoreState, CartStoreActions>;
}

export class ShoppingCartModel extends BaseModel<CartViewData | null, typeof CartViewDataSchema> {
  private cartStore: Store<CartStoreState, CartStoreActions>;
  private unsubscribeFromStore?: () => void;
  private ownsStore: boolean;

  constructor(input: ShoppingCartModelInput) {
    super({ initialData: null, schema: CartViewDataSchema }); // Initial data will come from store

    // Example: Model owns its store
    this.cartStore = createStore<CartStoreState, CartStoreActions>(
      { items: [] }, // Initial state for the cart store
      (set, get) => ({
        addItem: (newItem) => set(state => {
          const existingItemIndex = state.items.findIndex(i => i.productId === newItem.productId);
          if (existingItemIndex > -1) {
            const updatedItems = [...state.items];
            updatedItems[existingItemIndex] = {
              ...updatedItems[existingItemIndex],
              quantity: updatedItems[existingItemIndex].quantity + newItem.quantity,
            };
            return { ...state, items: updatedItems };
          }
          return { ...state, items: [...state.items, newItem] };
        }),
        removeItem: (productId) => set(state => ({
          ...state,
          items: state.items.filter(i => i.productId !== productId),
        })),
        updateItemQuantity: (productId, quantity) => set(state => {
          if (quantity <= 0) { // Remove if quantity is zero or less
            return { ...state, items: state.items.filter(i => i.productId !== productId) };
          }
          return {
            ...state,
            items: state.items.map(i =>
              i.productId === productId ? { ...i, quantity } : i
            ),
          };
        }),
        clearCart: () => set(state => ({ ...state, items: [] })),
      })
    );
    this.ownsStore = true;
    this._initializeStoreSubscription();
  }

  private _initializeStoreSubscription(): void {
    this.unsubscribeFromStore = this.cartStore.subscribe((newState) => {
      const transformedData = this._transformStoreStateToViewData(newState);
      try {
        // Validate the transformed data against the model's schema
        const validatedData = this.validate(transformedData);
        this.setData(validatedData); // Update BaseModel's data$
        this.clearError();
      } catch (error) {
        this.setError(error); // Set error if derived data validation fails
        this.setData(null); // Or handle error state appropriately
      }
    });
    // Initialize BaseModel's data with the current (possibly empty) cart state
    const initialViewData = this._transformStoreStateToViewData(this.cartStore.getState());
    this.setData(this.validate(initialViewData));
  }

  private _transformStoreStateToViewData(storeState: CartStoreState): CartViewData {
    const items = storeState.items;
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
    return { items, itemCount, totalPrice };
  }

  // Public methods for ViewModel to interact with the cart
  public addItem(item: CartItem): void {
    // Input validation for 'item' can be done here before calling store action
    this.cartStore.actions.addItem(item);
  }

  public removeItem(productId: string): void {
    this.cartStore.actions.removeItem(productId);
  }

  public updateItemQuantity(productId: string, newQuantity: number): void {
    this.cartStore.actions.updateItemQuantity(productId, newQuantity);
  }

  public clearCart(): void {
    this.cartStore.actions.clearCart();
  }

  public dispose(): void {
    super.dispose();
    if (this.unsubscribeFromStore) {
      this.unsubscribeFromStore();
    }
    if (this.ownsStore) {
      this.cartStore.destroy(); // Important: clean up store-core instance if owned
    }
  }
}
```

These detailed examples illustrate how `BaseModel` can be effectively combined with `query-core` for server data and `store-core` for client-side state, providing a robust Model layer for an MVVM application.

## E-commerce Site Example Scenarios

Let's apply these integration patterns to common e-commerce scenarios. We'll assume the existence of a shared `QueryCore` instance (`queryClient`) and potentially shared `store-core` instances if applicable, managed at a higher application level (e.g., dependency injection or service locator).

### Scenario 1: Product Listing Page

**Objective**: Display a list of products fetched from an API.

**Components**:

*   **Model**: `ProductListModel` (as detailed in the `query-core` integration example above).
    *   Uses `queryCore` (e.g., a shared `queryClient`) to define an endpoint for `/api/products`.
    *   Its `data$` observable will emit `Product[] | null`.
    *   Its `isLoading$` and `error$` observables reflect the state of the data fetching operation.
*   **ViewModel**: `ProductListViewModel`
    *   Takes an instance of `ProductListModel` in its constructor.
    *   Subscribes to `productListModel.data$`, `productListModel.isLoading$`, and `productListModel.error$`.
    *   Exposes properties like `products: Observable<Product[] | null>`, `isLoading: Observable<boolean>`, `error: Observable<any>` to the View.
    *   May include commands like `refreshProductsCommand` which calls `productListModel.refreshProducts()`.
*   **View**: A component (e.g., React, Angular, Vue, or vanilla JS with a templating engine) that:
    *   Binds to `ProductListViewModel`'s properties.
    *   Displays a loading indicator when `isLoading` is true.
    *   Shows an error message if `error` is present.
    *   Renders the list of `products` when available.
    *   Allows triggering `refreshProductsCommand`.

**Interaction Flow**:

1.  `ProductListViewModel` is instantiated, which in turn instantiates `ProductListModel`.
2.  `ProductListModel` initializes, defines its `query-core` endpoint, and subscribes. This typically triggers an initial fetch if data is stale or not cached (behavior depends on `query-core` endpoint options and subscription logic).
3.  `ProductListModel` updates its `isLoading$`, `data$`, `error$` based on `query-core` state updates.
4.  `ProductListViewModel` receives these updates and exposes them.
5.  The View reacts to the ViewModel's exposed observables and renders the UI accordingly.
6.  If the user triggers a refresh, the ViewModel's command calls the Model's `refreshProducts()`, which then uses `queryCore.refetch()`.

### Scenario 2: Shopping Cart

**Objective**: Manage and display the user's shopping cart.

**Components**:

*   **Model**: `ShoppingCartModel` (as detailed in the `store-core` integration example above).
    *   Uses `store-core` (either an owned instance or a shared one) to manage `CartItem` objects.
    *   Its `data$` observable emits `CartViewData | null` (containing items, total price, item count).
    *   It provides methods like `addItem()`, `removeItem()`, `updateItemQuantity()`, `clearCart()`.
*   **ViewModel**: `ShoppingCartViewModel`
    *   Takes an instance of `ShoppingCartModel`.
    *   Subscribes to `shoppingCartModel.data$`.
    *   Exposes properties like `cart: Observable<CartViewData | null>`, `isEmpty: Observable<boolean>`.
    *   Exposes commands like `addItemCommand(itemDetails)`, `removeItemCommand(productId)`, etc., which call the corresponding methods on `ShoppingCartModel`.
*   **View**: A component that:
    *   Binds to `ShoppingCartViewModel`'s properties.
    *   Displays cart items, total price, and item count.
    *   Provides UI elements (buttons, input fields) to trigger cart modification commands (add, remove, update quantity).
    *   May show a "Cart is empty" message.

**Interaction Flow**:

1.  `ShoppingCartViewModel` is instantiated with `ShoppingCartModel`.
2.  `ShoppingCartModel` initializes, sets up its `store-core` instance (if owned) and subscribes to it. It transforms the store's state into `CartViewData` and updates its `data$`.
3.  `ShoppingCartViewModel` receives `CartViewData` updates and exposes them.
4.  The View renders the cart based on the ViewModel's data.
5.  When a user interacts (e.g., clicks "Add to Cart" on a product page, or changes quantity in the cart view):
    *   An action might originate from another ViewModel (e.g., `ProductViewModel.addToCartCommand(product)`).
    *   This command would typically interact with the `ShoppingCartModel` (potentially via a shared service or directly if the ViewModel has access) by calling, for example, `shoppingCartModel.addItem({ productId: '123', name: 'Product Foo', quantity: 1, unitPrice: 9.99 })`.
    *   `ShoppingCartModel.addItem()` dispatches an action to its `cartStore`.
    *   `cartStore` updates its state, notifying `ShoppingCartModel`.
    *   `ShoppingCartModel` transforms the new store state and updates its `data$`.
    *   `ShoppingCartViewModel` (and any other subscribers) receive the updated `CartViewData`.
    *   The View re-renders to reflect the changes in the cart.

### Scenario 3: User Profile Page (Combined Usage)

**Objective**: Display user profile information (fetched from API) and allow editing some preferences (client-side state before saving).

*   **Model**: `UserProfileModel` extends `BaseModel`.
    *   **`query-core` for fetching profile**:
        *   Defines an endpoint (e.g., `/api/user/profile`) using `queryCore`.
        *   Subscribes to this endpoint to get profile data (`User`), loading, and error states.
        *   When profile data is fetched, it might populate both its main `_data$` (for display) and parts of an internal `store-core` instance (for editable fields).
    *   **`store-core` for managing editable preferences**:
        *   Uses an internal `store-core` instance (or a section of a larger user preferences store) to manage temporary changes to preferences (e.g., theme, notification settings) before they are saved.
        *   The Model's `data$` could expose a merged view of fetched profile data and current (potentially unsaved) preferences from the store.
        *   Methods like `updatePreference(key, value)` would update the `store-core` instance.
        *   A `savePreferences()` method would:
            1.  Read current preferences from the `store-core` instance.
            2.  Use `queryCore` to define and trigger another endpoint (e.g., a POST to `/api/user/profile/preferences`) to save the data.
            3.  Handle loading/error states for the save operation, potentially updating `BaseModel`'s `isLoading$` and `error$` or separate observables for save status.
            4.  On successful save, it might refetch the main profile data or update the local `query-core` cache for the profile endpoint.
*   **ViewModel**: `UserProfileViewModel`
    *   Subscribes to `UserProfileModel.data$` (which includes fetched and local preference data), `isLoading$`, `error$`.
    *   Exposes profile fields and preference settings to the View.
    *   Provides commands like `changePreferenceCommand(key, value)` and `savePreferencesCommand`.
*   **View**:
    *   Displays user information and preference controls.
    *   Allows users to modify preferences (triggering `changePreferenceCommand`).
    *   Has a "Save" button (triggering `savePreferencesCommand`).

This illustrates how both libraries can coexist and complement each other within a single, more complex Model.

## Suggested Enhancements and Patterns

While the integration approaches described are functional, the following suggestions could enhance the developer experience and robustness when using `query-core` and `store-core` with `BaseModel`.

### 1. `BaseModel` Enhancements for `query-core`

*   **Generic Fetch Method**: `BaseModel` could offer a protected generic method, say `_initQuery<DataType>(...)`, that encapsulates the common logic of defining a `query-core` endpoint, subscribing to it, and synchronizing its state with `BaseModel`'s `_data$`, `_isLoading$`, and `_error$` observables.
    *   This method would take the `queryKey`, `fetcherFn`, `queryCoreInstance`, and `queryOptions` as parameters.
    *   It would handle the subscription and unsubscription logic internally.
    *   This would reduce boilerplate in concrete Model implementations.

    ```typescript
    // Conceptual addition to BaseModel
    protected async _initQuery<DataType>(
      queryKey: string,
      fetcherFn: () => Promise<DataType>,
      queryCoreInstance: QueryCore,
      schema?: ZodSchema<DataType>, // Schema for this specific query's data
      queryOptions?: EndpointOptions
    ): Promise<() => void> { // Returns unsubscribe function
      await queryCoreInstance.defineEndpoint<DataType>(queryKey, fetcherFn, queryOptions);

      const unsubscribe = queryCoreInstance.subscribe<DataType>(queryKey, (state) => {
        this.setLoading(state.isLoading);
        if (state.isError) {
          this.setError(state.error);
        } else if (state.data !== undefined) {
          try {
            // Use the provided schema for this specific query, or model's default if not provided
            const dataToValidate = state.data;
            const effectiveSchema = schema || this.schema;

            if (effectiveSchema) {
              // Ensure 'this' refers to the BaseModel instance for 'validate'
              const validatedData = (effectiveSchema as ZodSchema<any>).parse(dataToValidate);
              this.setData(validatedData as TData); // TData is BaseModel's generic type
            } else {
              this.setData(dataToValidate as unknown as TData);
            }
            this.clearError();
          } catch (validationError) {
            this.setError(validationError);
            this.setData(null); // Or handle as per requirements
          }
        }
      });
      return unsubscribe;
    }
    ```
    *Usage in `ProductListModel` would then simplify its `_initializeDataSource` method.*

*   **Dedicated Loading/Error States for Mutations**: `BaseModel` currently has single `isLoading$` and `error$` observables. For models that perform mutations (e.g., saving data via `query-core`), it might be beneficial to have separate observables for the mutation's loading/error state, distinct from the primary data fetching state.
    *   For instance, `isSaving$` and `saveError$`.
    *   Alternatively, `query-core` itself could be enhanced to provide more detailed state for mutation-specific hooks/endpoints if it were to support optimistic updates or dedicated mutation functions.

### 2. `BaseModel` Enhancements for `store-core`

*   **Generic Store Synchronizer**: Similar to `_initQuery`, `BaseModel` could provide a helper, `_syncWithStore<StoreDataType, TransformedDataType>(...)`, to manage subscribing to a `store-core` instance, transforming its state, validating it, and updating `BaseModel._data$`.
    *   This method would take the `storeInstance`, a `transformerFn`, and optionally a `schema` for the transformed data.

    ```typescript
    // Conceptual addition to BaseModel
    protected _syncWithStore<StoreDataType extends State, TransformedDataType>(
      storeInstance: Store<StoreDataType, any>,
      transformerFn: (storeState: StoreDataType) => TransformedDataType,
      schema?: ZodSchema<TransformedDataType> // Schema for the transformed data
    ): () => void { // Returns unsubscribe function
      const updateModelData = (storeState: StoreDataType) => {
        const transformedData = transformerFn(storeState);
        try {
          const effectiveSchema = schema || this.schema;
          if (effectiveSchema) {
            // Ensure 'this' refers to the BaseModel instance for 'validate'
            const validatedData = (effectiveSchema as ZodSchema<any>).parse(transformedData);
            this.setData(validatedData as TData);
          } else {
            this.setData(transformedData as unknown as TData);
          }
          this.clearError();
        } catch (validationError) {
          this.setError(validationError);
          this.setData(null);
        }
      };

      const unsubscribe = storeInstance.subscribe(updateModelData);
      // Initial sync
      updateModelData(storeInstance.getState());
      return unsubscribe;
    }
    ```
    *Usage in `ShoppingCartModel` would simplify its `_initializeStoreSubscription` and state transformation logic.*

### 3. Centralized `QueryCore` Instance

*   It's generally recommended to have a single, application-wide `QueryCore` instance (`queryClient`). This instance should be created at the application's entry point and provided to Models, typically via dependency injection or a service locator pattern. This allows `query-core` to manage a global cache and deduplicate requests effectively.

### 4. Scoped `store-core` Instances

*   While some `store-core` instances might be global (e.g., user authentication state), many are better scoped to specific features or even individual complex components/models.
*   The `ShoppingCartModel` owning its `cartStore` is a good example of feature-scoped state. This prevents unrelated parts of the application from directly depending on or accidentally modifying the cart's internal store structure.

### 5. ViewModel Interaction Patterns

*   **Commands for Model Actions**: ViewModels should expose commands (e.g., using `rxjs` subjects/observables or simple methods) that delegate to the Model's public methods. This keeps the action logic within the Model and makes ViewModels cleaner.
*   **Selective Subscription**: ViewModels should subscribe only to the data they need from Models. If a Model exposes multiple distinct pieces of data or states, the ViewModel should subscribe to them granularly if possible, or the Model should provide specific observables for different data slices if it makes sense.

### 6. Error Handling and Presentation

*   Models should consistently use `setError()` to update their `error$` observable.
*   ViewModels should subscribe to `error$` and transform errors into user-friendly messages or error states for the View.
*   Consider a global error handling mechanism (e.g., an error boundary in UI frameworks, or a global error event bus subscriber) that can catch and log unhandled errors from Models or ViewModels.

By considering these enhancements and patterns, the integration of `query-core` and `store-core` into an MVVM architecture with `BaseModel` can become more streamlined, maintainable, and robust.
