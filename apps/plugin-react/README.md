# Plugin Architecture Demo (React)

This application demonstrates a production-ready plugin architecture using `@repo/plugin-core` in a React + Vite environment with React Router integration. It showcases a greenhouse monitoring system with multiple interconnected plugins.

## Overview

The application consists of a **Plugin Host** that dynamically loads and manages multiple plugins. Each plugin can contribute routes, widgets, and menu items to the host application. Plugins use MVVM architecture with shared ViewModels from `@repo/view-models` for data management.

### Core Concepts

- **`@repo/plugin-core`**: Framework-agnostic plugin management library (registration, lifecycle, SDK)
- **`PluginHost.tsx`**: Main component that initializes the plugin registry, manages plugin lifecycle, and provides host services
- **`ReactAdapter`**: Framework adapter for mounting/unmounting React components in the plugin system
- **`plugin.config.ts`**: Configuration file containing plugin manifests and module mappings
- **`PluginSDK`**: API exposed to plugins for interacting with the host (routes, widgets, menu items, events)
- **React Router Integration**: Plugins can register routes that are dynamically added to the application router
- **MVVM Integration**: Plugins use ViewModels from `@repo/view-models` for reactive data management

## Implemented Plugins

This demo includes 6 production plugins for greenhouse monitoring:

1. **`dashboard-plugin`**: Main dashboard overview with summary widgets
   - Routes: `/`, `/dashboard`
   - Purpose: Aggregated view of greenhouse system status

2. **`greenhouse-plugin`**: Greenhouse management
   - Routes: `/greenhouses`
   - Widgets: Greenhouse summary card
   - ViewModel: `GreenhouseViewModel`

3. **`sensor-plugin`**: Sensor monitoring
   - Routes: `/sensors`
   - Widgets: Sensor summary card
   - ViewModel: `SensorViewModel`

4. **`sensor-reading-plugin`**: Sensor data visualization
   - Routes: `/sensor-readings`
   - Widgets: Sensor readings chart
   - ViewModel: `SensorReadingViewModel`

5. **`threshold-alert-plugin`**: Alert management
   - Routes: `/threshold-alerts`
   - Widgets: Alert summary card
   - ViewModel: `ThresholdAlertViewModel`

6. **`navigation-plugin`**: Navigation menu provider
   - Menu Items: Links to all plugin routes with icons

## Plugin Architecture Features

### Plugin Manifest Structure

Each plugin manifest can define:

- **`routes`**: Route definitions that get added to React Router
- **`widgets`**: Reusable UI components that can be rendered on the dashboard
- **`menuItems`**: Navigation links with icons for the sidebar menu
- **`hooks`**: Lifecycle hooks (init, mount, unmount)

### Plugin Module Structure

Each plugin module implements the `PluginModule` interface:

```typescript
const myPluginModule: PluginModule = {
  init: async (sdk) => {
    // Initialize plugin resources
  },
  mount: async (sdk) => {
    // Register contributions (routes, widgets, menu items)
    registerManifestContributions(sdk);
  },
  unmount: async () => {
    // Clean up resources
    unregisterManifestContributions(activeSdk);
  },
};
```

## How to Add a New Plugin

To add a new plugin, follow these steps:

### 1. Create the Plugin Directory

Create a new directory for your plugin in `src/plugins/`:

```bash
mkdir src/plugins/my-feature
```

### 2. Create the Plugin Module

Create `src/plugins/my-feature/index.tsx`:

```typescript
import React, { useEffect } from 'react';
import type { PluginModule, PluginSDK } from '@repo/plugin-core';
import { registerManifestContributions, unregisterManifestContributions } from '../utils/manifestHelpers';
import { useObservable } from '../../hooks/useObservable';
import { myFeatureViewModel } from '@repo/view-models/MyFeatureViewModel';

// Widget Component
export const MyFeatureWidget: React.FC = () => {
  const data = useObservable(myFeatureViewModel.data$, []);

  useEffect(() => {
    myFeatureViewModel.fetchCommand.execute();
  }, []);

  return (
    <div>
      <h3>My Feature</h3>
      {/* Render your data */}
    </div>
  );
};

// Plugin Module
let activeSdk: PluginSDK | null = null;

const myFeatureModule: PluginModule = {
  init: async (sdk) => {
    activeSdk = sdk;
    console.debug('[my-feature] initialized');
  },
  mount: async (sdk) => {
    activeSdk = sdk;
    registerManifestContributions(sdk);
    console.debug('[my-feature] mounted');
  },
  unmount: async () => {
    if (!activeSdk) return;
    unregisterManifestContributions(activeSdk);
    console.debug('[my-feature] unmounted');
    activeSdk = null;
  },
};

export default myFeatureModule;
```

### 3. Create the Route Component (Optional)

Create `src/components/MyFeatureList.tsx` for the full-page view:

```typescript
import React, { useEffect } from 'react';
import { useObservable } from '../hooks/useObservable';
import { myFeatureViewModel } from '@repo/view-models/MyFeatureViewModel';

export const MyFeatureList: React.FC = () => {
  const data = useObservable(myFeatureViewModel.data$, []);
  const isLoading = useObservable(myFeatureViewModel.isLoading$, false);
  const error = useObservable(myFeatureViewModel.error$, null);

  useEffect(() => {
    myFeatureViewModel.fetchCommand.execute();
  }, []);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h1>My Feature</h1>
      {/* Render your list */}
    </div>
  );
};
```

### 4. Add the Plugin Manifest

Update `src/config/plugin.config.ts`:

```typescript
import { MyFeatureList } from '../components/MyFeatureList';
import myFeatureModule, { MyFeatureWidget } from '../plugins/my-feature';

const myFeatureManifest: PluginManifest<ReactPluginComponent> = {
  id: 'my-feature-plugin',
  name: 'My Feature Plugin',
  version: '1.0.0',
  entry: '../plugins/my-feature/index.tsx',
  description: 'My feature description',
  routes: [
    {
      path: '/my-feature',
      component: MyFeatureList,
    },
  ],
  widgets: [
    {
      id: 'my-feature-widget',
      title: 'My Feature',
      component: MyFeatureWidget,
    },
  ],
};

// Add to pluginManifests array
export const pluginManifests: PluginManifest<ReactPluginComponent>[] = [
  // ... existing manifests
  myFeatureManifest,
];

// Add to pluginModules object
export const pluginModules: Record<string, PluginModule> = {
  // ... existing modules
  [myFeatureManifest.id]: myFeatureModule,
};
```

### 5. Add Navigation (Optional)

To add a menu item, update the `navigationManifest` in `plugin.config.ts`:

```typescript
const navigationManifest: PluginManifest<ReactPluginComponent> = {
  // ... existing config
  menuItems: [
    // ... existing menu items
    {
      label: 'My Feature',
      path: '/my-feature',
      icon: 'feature',
    },
  ],
};
```

### 6. Run the Application

Start the development server:

```bash
npm run dev
```

Your new plugin should now be loaded, with its route accessible via the navigation menu and its widget rendered on the dashboard.

## Development Commands

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run lint     # Run ESLint
npm run preview  # Preview production build
```

## Key Technologies

- **React 19** - UI framework
- **Vite 6** - Build tool and dev server
- **React Router 7** - Client-side routing
- **TypeScript 5.8** - Type safety
- **@repo/plugin-core** - Plugin architecture library
- **@repo/view-models** - Shared MVVM ViewModels
- **Chart.js** - Data visualization

## Plugin Lifecycle

1. **Registration**: Host registers all plugin manifests with the PluginRegistry
2. **Initialization**: Each plugin's `init()` hook is called with the PluginSDK
3. **Mounting**: Plugin's `mount()` hook registers contributions (routes, widgets, menu items)
4. **Runtime**: Plugin components are rendered by the host
5. **Unmounting**: Plugin's `unmount()` hook cleans up resources when needed

## Architecture Benefits

- **Modularity**: Each feature is isolated in its own plugin
- **Reusability**: Plugins can be shared across different host applications
- **Dynamic Loading**: Plugins are loaded at runtime without rebuilding the host
- **Type Safety**: Full TypeScript support across the plugin system
- **Framework Agnostic**: Core plugin system works with any framework
- **MVVM Integration**: Business logic is shared via ViewModels, not coupled to plugins
