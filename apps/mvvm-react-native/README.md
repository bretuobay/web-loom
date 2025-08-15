# React Native MVVM App

This is a React Native application built using the MVVM pattern, bootstrapped with Expo.

# MVVM in React Native

This project applies the MVVM (Model-View-ViewModel) pattern in React Native. Components interact with ViewModels that expose observable streams and commands for data management. The GreenhouseList component is a practical example of MVVM in action.

## How MVVM is Applied: Real Example from GreenhouseList

### ViewModel Usage

ViewModels encapsulate data-fetching and mutation logic, exposing observable streams and commands for the component to consume. For example:

```typescript
// Provided via import in the component
export const greenHouseViewModel = {
  data$: greenHouseDataObservable, // Observable stream of greenhouse data
  fetchCommand: {
    execute: async () => {
      /* fetches greenhouse data */
    },
  },
  createCommand: {
    execute: async (data) => {
      /* creates a greenhouse */
    },
  },
  updateCommand: {
    execute: async ({ id, payload }) => {
      /* updates a greenhouse */
    },
  },
  deleteCommand: {
    execute: async (id) => {
      /* deletes a greenhouse */
    },
  },
};
```

### View: GreenhouseList Component

The component subscribes to the observable data and triggers data fetching and mutations via ViewModel commands:

```tsx
import React, { useEffect, useState } from 'react';
import { useObservable } from '../hooks/useObservable';
import { greenHouseViewModel } from '@repo/view-models/GreenHouseViewModel';

export const GreenhouseList = () => {
  const greenHouses = useObservable(greenHouseViewModel.data$);
  // ...state for form fields...

  useEffect(() => {
    greenHouseViewModel.fetchCommand.execute();
  }, []);

  // handleSubmit, handleDelete, handleUpdate call respective ViewModel commands
  // ...existing code...
};
```

### MVVM Mapping

- **Model:** Data sources and business logic (e.g., greenhouse models)
- **ViewModel:** Observable streams and commands (e.g., `data$`, `fetchCommand`, `createCommand`, `updateCommand`, `deleteCommand`)
- **View:** React Native components subscribe to ViewModel observables and render UI, triggering commands for CRUD operations

This approach keeps data logic out of the UI components and enables reactive updates when data changes.

## Prerequisites

- Node.js
- npm or yarn
- Expo CLI

## Getting Started

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Run the app:**

   To run the app on iOS:

   ```bash
   npm run ios
   ```

   To run the app on Android:

   ```bash
   npm run android
   ```

   To run the app on the web:

   ```bash
   npm run web
   ```

## Building the App

To create a production build of the app, run the following command:

```bash
npm run build
```
