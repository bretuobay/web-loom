# Conceptual Usage Guide: RestfulApiModel & RestfulApiViewModel

## 1. Introduction

The `RestfulApiModel` and `RestfulApiViewModel` are foundational classes within the MVVM (Model-View-ViewModel) core library, designed to streamline interactions with RESTful APIs and manage application state reactively.

- **`RestfulApiModel`**: This class is responsible for the direct communication with your API endpoints. It handles fetching, creating, updating, and deleting resources, along with data validation using Zod schemas. It exposes the fetched data, loading status, and any errors as RxJS Observables.

- **`RestfulApiViewModel`**: This class acts as an intermediary between the `RestfulApiModel` and your UI (View). It consumes the observables from the model and exposes them, often directly, to the UI. More importantly, it provides `Command` objects for performing actions (like CRUD operations), encapsulating the execution logic and managing states like `isExecuting` or errors specific to that command. This makes the UI code cleaner and more declarative.

Together, they provide a robust pattern for managing remote data, handling loading and error states, and performing operations in a structured and testable way.

## 2. Setting up `RestfulApiModel`

First, you'll need to define a model that represents your API resource. This involves defining a Zod schema for validation and creating a class that extends `RestfulApiModel`.

### 2.1. Define Your Zod Schema

Zod is used for runtime data validation, ensuring that your API responses (and request payloads) conform to expected structures.

**Example: User Schema**

```typescript
// src/schemas/user.schema.ts
import { z } from 'zod';

export const UserSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Name cannot be empty'),
  email: z.string().email('Invalid email format'),
});
export type User = z.infer<typeof UserSchema>;

export const UserProfileSchema = z.object({
  userId: z.string(),
  bio: z.string().optional(),
  website: z.string().url().optional(),
});
export type UserProfile = z.infer<typeof UserProfileSchema>;
```

### 2.2. Create a Custom API Model Class

Your custom model class will extend `RestfulApiModel` and be configured for a specific endpoint and schema.

**Constructor Parameters:**

The constructor accepts a single input object with the following properties:

- `baseUrl`: The base URL of your API (e.g., `https://api.example.com`).
- `endpoint`: The specific path for the resource (e.g., `users`, `profile`).
- `fetcher`: A function responsible for making the actual HTTP requests. This allows you to use `window.fetch`, a library like `axios`, or any custom fetching logic.
- `schema`: The Zod schema for validating the data (`TData`) this model handles.
- `initialData` (optional): Initial data for the model.

**Fetcher Function Example:**

A simple fetcher using `window.fetch`:

```typescript
// src/utils/fetcher.ts
import { Fetcher } from 'mvvm-core/models'; // Adjust path as per your library structure

export const appFetcher: Fetcher = async (url, options) => {
  const headers = {
    'Content-Type': 'application/json',
    // Add other common headers like Authorization if needed
    ...options?.headers,
  };

  try {
    const response = await window.fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      // Attempt to parse error response body
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    return response; // RestfulApiModel expects a Response object
  } catch (error) {
    // Network errors or other fetch-related issues
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unknown fetch error occurred.');
  }
};
```

**Scenario 1: Collection Model (e.g., `User[]`)**

This model manages a list of users. `TData` will be `User[]`, and the schema passed to the `RestfulApiModel` constructor should be `z.array(UserSchema)`.

```typescript
// src/models/user.api.model.ts
import { RestfulApiModel } from 'mvvm-core/models'; // Adjust path
import { z } from 'zod';
import { User, UserSchema } from '../schemas/user.schema';
import { appFetcher } from '../utils/fetcher';

export class UserCollectionApiModel extends RestfulApiModel<User[], z.ZodArray<typeof UserSchema>> {
  constructor() {
    super({
      baseUrl: 'https://api.yourapp.com',
      endpoint: 'users',
      fetcher: appFetcher,
      schema: z.array(UserSchema),
      initialData: null, // Or an empty array [] if that's preferred for collections
    });
  }

  // You can add custom methods here if needed, e.g.:
  // async fetchActiveUsers(): Promise<User[] | undefined> {
  //   return this.fetchWithQuery({ status: 'active' });
  // }
}
```

**Scenario 2: Single Resource Model (e.g., `UserProfile`)**

This model manages a single user profile object. `TData` will be `UserProfile`, and the schema is `UserProfileSchema`.

```typescript
// src/models/user-profile.api.model.ts
import { RestfulApiModel } from 'mvvm-core/models'; // Adjust path
import { UserProfile, UserProfileSchema } from '../schemas/user.schema';
import { appFetcher } from '../utils/fetcher';

export class UserProfileApiModel extends RestfulApiModel<UserProfile, typeof UserProfileSchema> {
  constructor(userId: string) {
    // Endpoint might be dynamic, e.g., users/{userId}/profile
    super({
      baseUrl: 'https://api.yourapp.com',
      endpoint: `users/${userId}/profile`,
      fetcher: appFetcher,
      schema: UserProfileSchema,
      initialData: null,
    });
  }

  // Example: Custom method to update specific fields
  // async updateBio(newBio: string): Promise<UserProfile | undefined> {
  //   return this.update('', { bio: newBio }); // Assuming base endpoint is already the profile
  // }
}
```

_Note:_ For a single resource model where the ID is part of the endpoint, `fetch(id)` might not be used if the model's endpoint already points to the specific resource. `fetch()` would fetch that specific resource. `create` might create it if the endpoint supports POST, and `update` would update it.

## 3. Setting up `RestfulApiViewModel`

The ViewModel consumes an instance of your API model and exposes its data and operations for the UI.

**Scenario 1: Collection ViewModel (`UserListViewModel`)**

```typescript
// src/viewmodels/user-list.viewmodel.ts
import { RestfulApiViewModel } from 'mvvm-core/viewmodels'; // Adjust path
import { z } from 'zod';
import { User, UserSchema } from '../schemas/user.schema';
import { UserCollectionApiModel } from '../models/user.api.model';

// TData is User[], TSchema for RestfulApiModel was z.array(UserSchema)
export class UserListViewModel extends RestfulApiViewModel<User[], z.ZodArray<typeof UserSchema>> {
  constructor(userCollectionApiModel: UserCollectionApiModel) {
    super(userCollectionApiModel);
  }

  // Example: ViewModel-specific logic
  // filterUsersByName(nameQuery: string) {
  //   // This would typically involve transforming data$ or setting internal filters
  // }
}
```

**Scenario 2: Single Resource ViewModel (`UserProfileViewModel`)**

```typescript
// src/viewmodels/user-profile.viewmodel.ts
import { RestfulApiViewModel } from 'mvvm-core/viewmodels'; // Adjust path
import { UserProfile, UserProfileSchema } from '../schemas/user.schema';
import { UserProfileApiModel } from '../models/user-profile.api.model';

export class UserProfileViewModel extends RestfulApiViewModel<UserProfile, typeof UserProfileSchema> {
  constructor(userProfileApiModel: UserProfileApiModel) {
    super(userProfileApiModel);
  }
}
```

## 4. Using the ViewModel in a UI (Conceptual React Example)

This example demonstrates how to use the `UserListViewModel` in a React functional component. Similar principles apply to other frameworks like Angular (using `async` pipe) or Vue (using computed properties or watchers).

```typescript
// src/components/UserList.tsx
import React, { useEffect, useMemo } from 'react';
// Hypothetical hook for easy RxJS observable consumption in React
// Popular choices: 'react-rxjs', 'rxjs-hooks', or write a simple custom one.
import { useObservable } from 'react-rxjs-hooks';

import { UserCollectionApiModel } from '../models/user.api.model';
import { UserListViewModel } from '../viewmodels/user-list.viewmodel';
import { User } from '../schemas/user.schema';

// Instantiate once (consider Dependency Injection for real applications)
const userCollectionApiModel = new UserCollectionApiModel();
const userListViewModel = new UserListViewModel(userCollectionApiModel);

const UserListComponent: React.FC = () => {
  // --- Data Binding ---
  const users = useObservable(userListViewModel.data$, null); // Default to null or initial state
  const isLoading = useObservable(userListViewModel.isLoading$, true); // Assume loading initially
  const error = useObservable(userListViewModel.error$, null);

  // For collection view models, selectedItem$ can be used
  const selectedUser = useObservable(userListViewModel.selectedItem$, null);

  // --- Commands ---
  const {
    fetchCommand,
    createCommand,
    updateCommand,
    deleteCommand
  } = userListViewModel;

  // Command states
  const isFetching = useObservable(fetchCommand.isExecuting$, false);
  const isCreating = useObservable(createCommand.isExecuting$, false);
  // const canCreate = useObservable(createCommand.canExecute$, true); // Example
  const createError = useObservable(createCommand.executeError$, null);


  useEffect(() => {
    // Fetch users when the component mounts
    fetchCommand.execute(); // For fetching the whole collection

    // Example: Fetch a single user by ID (if applicable to the model's fetch logic)
    // fetchCommand.execute("some-user-id");

    // Cleanup on unmount
    return () => {
      // userListViewModel.dispose(); // See Lifecycle Management section
    };
  }, []); // Empty dependency array means run once on mount

  const handleCreateUser = () => {
    const newUserPayload: Partial<User> = { name: 'New User', email: 'new@example.com' };
    createCommand.execute(newUserPayload);
  };

  const handleUpdateUser = (user: User) => {
    const updatedPayload: Partial<User> = { ...user, name: `${user.name} (Updated)` };
    updateCommand.execute({ id: user.id, payload: updatedPayload });
  };

  const handleDeleteUser = (userId: string) => {
    deleteCommand.execute(userId);
  };

  const handleSelectUser = (userId: string) => {
    userListViewModel.selectItem(userId);
  };

  if (isLoading && !users) return <div>Loading users...</div>; // Show loading if no data yet
  if (error) return <div>Error loading users: {error.message || 'Unknown error'}</div>;

  return (
    <div>
      <h1>User List</h1>
      <button onClick={handleCreateUser} disabled={isCreating}>
        {isCreating ? 'Creating...' : 'Add New User'}
      </button>
      {createError && <div style={{color: 'red'}}>Error creating user: {createError.message}</div>}

      <h2>All Users:</h2>
      <ul>
        {users && users.map(user => (
          <li key={user.id} style={{ marginBottom: '10px', background: selectedUser?.id === user.id ? 'lightyellow' : 'transparent' }}>
            {user.name} ({user.email})
            <button onClick={() => handleSelectUser(user.id)} style={{ marginLeft: '5px' }}>
              {selectedUser?.id === user.id ? 'Selected' : 'View Details'}
            </button>
            <button onClick={() => handleUpdateUser(user)} style={{ marginLeft: '5px' }}>Update Name</button>
            <button onClick={() => handleDeleteUser(user.id)} disabled={useObservable(deleteCommand.isExecuting$, false)} style={{ marginLeft: '5px' }}>
              Delete
            </button>
          </li>
        ))}
      </ul>

      {selectedUser && (
        <div>
          <h2>Selected User Details:</h2>
          <p>ID: {selectedUser.id}</p>
          <p>Name: {selectedUser.name}</p>
          <p>Email: {selectedUser.email}</p>
          <button onClick={() => userListViewModel.selectItem(null)}>Clear Selection</button>
        </div>
      )}
    </div>
  );
};

export default UserListComponent;
```

**Notes for other frameworks:**

- **Angular:** You would typically inject the ViewModel into your component and use the `async` pipe in your templates to subscribe to observables (e.g., `*ngIf="viewModel.data$ | async as users"`).
- **Vue:** You might use `ref` or `reactive` for state and update them from the ViewModel's observables using watchers or a setup function. Vue's reactivity system can often work well with RxJS observables with some adaptation.

### 4.1. Data Binding (`data$`, `isLoading$`, `error$`)

These observables provide the core state from the `RestfulApiModel`:

- `viewModel.data$`: Emits the data fetched from the API (e.g., `User[]` or `UserProfile`). Initialize your UI with a default state (e.g., empty array, null) until the first emission.
- `viewModel.isLoading$`: Emits `true` while an API request (fetch, create, update, delete via the model's direct methods) is in progress, and `false` otherwise. Useful for showing loading indicators.
- `viewModel.error$`: Emits an error object if any operation on the `RestfulApiModel` fails (including Zod validation errors during parsing of fetched data or pre-send validation).

### 4.2. CRUD Operations using Commands

Commands encapsulate actions and their states.

- **`fetchCommand.execute(id?: string | string[])`**:
  - Call `fetchCommand.execute()` to fetch all resources (for collection models).
  - Call `fetchCommand.execute(id)` to fetch a specific resource by ID. This is relevant for both collection models (to refresh/fetch one item into the main `data$`, though `RestfulApiModel` might replace the whole collection with the single item if not handled carefully) and single-resource models where the ID specifies the resource.
- **`createCommand.execute(payload: Partial<TData>)`**:
  - Initiates creating a new resource. `payload` is an object with properties for the new item.
  - The `RestfulApiModel` typically expects `TData` to be a single item type for create, even if it's part of a collection model.
- **`updateCommand.execute({ id: string; payload: Partial<TData> })`**:
  - Updates an existing resource. `id` identifies the resource, and `payload` contains the properties to change.
- **`deleteCommand.execute(id: string)`**:
  - Deletes a resource by its `id`.

### 4.3. Command States

Each command instance (`fetchCommand`, `createCommand`, etc.) provides its own state observables:

- `command.isExecuting$`: Emits `true` while this specific command is running, `false` otherwise. Ideal for disabling the button that triggered the command.
- `command.canExecute$`: An observable that emits `true` if the command can currently be executed, `false` otherwise. (Note: The provided `Command` class has this property, but its behavior depends on whether a `canExecute` function was passed to its constructor, which is not shown in the basic PRD example. Assume it's generally available).
- `command.executeError$`: Emits an error if the last execution of _this specific command_ failed. This is useful for showing errors right next to the UI element that triggered the command, as opposed to the general `viewModel.error$` which might reflect model-level errors too.

### 4.4. `selectedItem$` (for Collection ViewModels)

When `TData` in `RestfulApiViewModel<TData, ...>` is an array type (e.g., `User[]`), the `selectedItem$` observable is particularly useful.

- **Purpose**: It observes a single item from the collection currently held in `data$`, based on a selected ID.
- **`viewModel.selectItem(id: string | null)`**: Call this method to change the selected ID. If `id` is `null`, the selection is cleared, and `selectedItem$` will emit `null`.
- **Binding to `selectedItem$`**: Subscribe to this observable to display details of the selected item in your UI. If no item is selected or the selected ID is not found in the current `data$`, it emits `null`.

## 5. Validation

Data validation is primarily handled by the `RestfulApiModel` using the Zod schema provided to it.

- **On Fetch**: When data is fetched from the API, `RestfulApiModel` attempts to parse and validate it against the schema. If validation fails, the `model.error$` (and thus `viewModel.error$`) will emit a `ZodError`.
- **On Create/Update (Pre-send)**: While `RestfulApiModel`'s `create` and `update` methods take `Partial<TData>`, the actual implementation within the model can (and should, if desired) validate this partial payload against a partial schema or the full schema (if all fields are required for the operation) before sending it to the API. If pre-send validation fails, it can throw an error that the command will catch and expose via `command.executeError$`.
- **On Create/Update (Post-send Response)**: If the API responds with the created/updated resource, this response data is also parsed and validated by the model. Failures will be emitted via `model.error$`.

Your UI should monitor `viewModel.error$` and/or `command.executeError$` to display validation errors or other operational errors to the user.

## 6. Lifecycle Management and `dispose()`

**This is a critical aspect to prevent memory leaks in your application.** RxJS subscriptions, if not managed, can persist even after a component is no longer in use, leading to unexpected behavior and performance degradation.

Both `RestfulApiModel`, `RestfulApiViewModel`, and the `Command` class implement an `IDisposable`-like `dispose()` method.

- **When to call `dispose()`**: When the ViewModel (and its associated Model and Commands) is no longer needed, you **must** call its `dispose()` method. This typically happens when the UI component that owns/uses the ViewModel is unmounted or destroyed.

- **What `dispose()` does**:
  - `ViewModel.dispose()`:
    - Calls `dispose()` on the `RestfulApiModel` instance it holds.
    - Calls `dispose()` on each of its `Command` instances.
    - Completes internal subjects (like `_selectedItemId$`) to release subscribers.
  - `Model.dispose()`:
    - Completes its internal `BehaviorSubject` instances (`_data$`, `_isLoading$`, `_error$`), which automatically unsubscribes most listeners.
  - `Command.dispose()`:
    - Completes its internal `BehaviorSubject` instances (`_isExecuting$`, `_canExecute$`, `_error$`).

**Example: Calling `dispose()` in a React `useEffect` cleanup:**

```typescript
// src/components/UserList.tsx (continued)
// ... imports ...

// It's often better to create and manage ViewModel instances per component instance,
// unless global state is explicitly desired.
// const userListViewModel = new UserListViewModel(new UserCollectionApiModel()); // Instance per component

const UserListComponent: React.FC = () => {
  // If creating model/viewModel inside the component:
  const userListViewModel = useMemo(() => {
    const model = new UserCollectionApiModel();
    return new UserListViewModel(model);
  }, []);

  // ... other hooks and logic ...
  // Ensure fetchCommand is stable, e.g. from the useMemo-ized viewModel
  const { fetchCommand } = userListViewModel;

  useEffect(() => {
    fetchCommand.execute();

    // Cleanup function: called when the component unmounts
    return () => {
      console.log("UserListComponent unmounting. Disposing ViewModel.");
      userListViewModel.dispose();
    };
  }, [userListViewModel, fetchCommand]); // Add userListViewModel & fetchCommand to dependency array

  // ... rest of the component ...
  return (
    // JSX
  );
};
```

By diligently calling `dispose()`, you ensure that all subscriptions are torn down and resources are released, contributing to a more stable and performant application.
