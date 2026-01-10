# LLM Coding Agent Prompt: Convert Traditional React App to Plugin Architecture

## Project Overview

You are working with the Web Loom monorepo, a comprehensive framework for building MVVM applications. The React components from the greenhouse management MVVM app have already been moved to `apps/plugin-react/src/components`. Your task is to convert the traditional React Router-based application structure to use the plugin architecture defined in `packages/plugin-core`.

## Current State

The `apps/plugin-react` app currently has:

- All greenhouse management components moved to `src/components/`
- Traditional React Router setup in `App.tsx`
- Layout components in `src/layout/`
- Standard React app structure

## Repository Structure Context

This is a turborepo monorepo with the following key structure:

### Target App

- `apps/plugin-react/` - Plugin host app with moved greenhouse components

### Key Packages

- `packages/plugin-core/` - Core plugin system architecture
- `packages/view-models/` - Reactive view models for greenhouse data
- `packages/models/` - Data models and schemas
- `packages/mvvm-core/` - Core MVVM framework
- `packages/shared/` - Shared utilities and styles

## Current Components Available (`apps/plugin-react/src/components`)

All these components are already available and working:

### Main Components

- `Dashboard.tsx` - Main dashboard showing overview cards
- `GreenhouseCard.tsx` - Displays greenhouse summary
- `GreenhouseList.tsx` - Full list of greenhouses
- `SensorCard.tsx` - Displays sensor summary
- `SensorList.tsx` - Full list of sensors
- `SensorReadingCard.tsx` - Displays sensor reading summary
- `SensorReadingList.tsx` - Full list of sensor readings
- `ThresholdAlertCard.tsx` - Displays threshold alert summary
- `ThresholdAlertList.tsx` - Full list of threshold alerts

### Layout Components

- `Header.tsx` - Navigation header using react-router-dom
- `Container.tsx` - Layout container
- `Footer.tsx` - Footer component

### Current Routing Structure (to be converted)

- `/` and `/dashboard` - Dashboard component
- `/greenhouses` - GreenhouseList component
- `/sensors` - SensorList component
- `/sensor-readings` - SensorReadingList component
- `/threshold-alerts` - ThresholdAlertList component

### Dependencies Used

- React 19.1.0 with react-router-dom 7.6.1
- Uses `@repo/view-models` reactive view models:
  - `greenHouseViewModel`
  - `sensorViewModel`
  - `sensorReadingViewModel`
  - `thresholdAlertViewModel`
- Custom `useObservable` hook for reactive data binding
- Chart.js 4.4.3 for visualizations

## Plugin Architecture Overview

### Plugin Core System (`packages/plugin-core`)

The plugin system provides:

- `PluginManifest<T>` interface for declaring plugin metadata, routes, widgets, and menu items
- `PluginModule` interface with lifecycle hooks (init, mount, unmount)
- `PluginRegistry` class for managing plugin registration and state
- `FrameworkAdapter<T>` for framework-specific component mounting
- Plugin state management ('registered', 'loading', 'loaded', 'mounted', 'unmounted', 'error')

### Plugin Manifest Structure

```typescript
interface PluginManifest<T extends TComponent = TComponent> {
  id: string;
  name: string;
  version: string;
  entry: string;
  description?: string;
  author?: string;
  icon?: string;
  routes?: PluginRouteDefinition<T>[];
  menuItems?: PluginMenuItem[];
  widgets?: PluginWidgetDefinition<T>[];
  metadata?: Record<string, unknown>;
  dependencies?: Record<string, string>;
}
```

### Plugin Module Lifecycle

```typescript
interface PluginModule {
  init?: (sdk: PluginSDK) => Promise<void> | void;
  mount?: (sdk: PluginSDK) => Promise<void> | void;
  unmount?: () => Promise<void> | void;
}
```

### Framework Adapter

```typescript
interface FrameworkAdapter<T extends TComponent = TComponent> {
  mountComponent(component: T, container: HTMLElement): void;
  unmountComponent(container: HTMLElement): void;
}
```

## Your Task

Convert the traditional React Router-based application structure in `apps/plugin-react` to use the plugin architecture system. The greenhouse management components are already available in `src/components/` and need to be organized into plugins and loaded dynamically.

### Current Structure to Convert

The current `App.tsx` uses traditional React Router:

```tsx
function App() {
  return (
    <BrowserRouter>
      <Header />
      <Container>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/greenhouses" element={<GreenhouseList />} />
          <Route path="/sensors" element={<SensorList />} />
          <Route path="/sensor-readings" element={<SensorReadingList />} />
          <Route path="/threshold-alerts" element={<ThresholdAlertList />} />
        </Routes>
      </Container>
      <Footer />
    </BrowserRouter>
  );
}
```

### Target Plugin Structure

Create the following plugins in `apps/plugin-react/src/plugins/`:

1. **Dashboard Plugin** (`dashboard/`)
   - Use existing `Dashboard.tsx` component
   - Include dashboard cards as widgets
   - Route: `/` and `/dashboard`

2. **Greenhouse Plugin** (`greenhouse/`)
   - Use existing `GreenhouseCard.tsx` and `GreenhouseList.tsx`
   - Provide both card widget and list route
   - Route: `/greenhouses`

3. **Sensor Plugin** (`sensor/`)
   - Use existing `SensorCard.tsx` and `SensorList.tsx`
   - Provide both card widget and list route
   - Route: `/sensors`

4. **Sensor Reading Plugin** (`sensor-reading/`)
   - Use existing `SensorReadingCard.tsx` and `SensorReadingList.tsx`
   - Provide both card widget and list route
   - Route: `/sensor-readings`

5. **Threshold Alert Plugin** (`threshold-alert/`)
   - Use existing `ThresholdAlertCard.tsx` and `ThresholdAlertList.tsx`
   - Provide both card widget and list route
   - Route: `/threshold-alerts`

6. **Navigation Plugin** (`navigation/`)
   - Use existing `Header.tsx` component
   - Provide navigation menu items for all routes

### Each Plugin Should Include:

1. **index.ts** - Plugin module export implementing `PluginModule` interface
2. **Components** - Import existing components from `../components/`
3. Proper TypeScript typing using React component types
4. Plugin manifest registration in configuration

### Required Implementation Steps

1. **Create Plugin Host System**
   - Create `src/host/PluginHost.tsx` with React adapter
   - Implement `FrameworkAdapter<React.ComponentType>` for mounting/unmounting React components
   - Support both route-based and widget-based plugin rendering

2. **Create Plugin Configuration**
   - Create `src/config/plugin.config.ts` with all plugin manifests
   - Register all 6 greenhouse management plugins
   - Include route definitions, menu items, and widget definitions

3. **Update App.tsx**
   - Replace traditional React Router structure
   - Use `PluginHost` component instead
   - Maintain layout structure (Header, Container, Footer)

4. **Create TypeScript Types**
   - Create `src/types.ts` defining `ReactPluginComponent` type
   - Ensure compatibility with plugin-core interfaces

### Plugin Configuration Requirements

Create `apps/plugin-react/src/config/plugin.config.ts` with:

- All 6 greenhouse management plugin manifests
- Route definitions for navigation between components
- Widget definitions for dashboard display
- Menu items for header navigation

### Technical Requirements

1. **Use Existing Components**
   - Import all components from `src/components/` directory
   - Do NOT duplicate or copy existing component files
   - Maintain all existing functionality and styling

2. **Plugin Architecture Compliance**
   - Each plugin must implement `PluginModule` interface with optional lifecycle hooks
   - Use proper plugin manifest structure from `packages/plugin-core`
   - Support both widget and route-based rendering
   - Follow plugin state management pattern

3. **Preserve Dependencies**
   - Keep all view model imports from `@repo/view-models`
   - Maintain `useObservable` hook usage from existing location
   - Preserve chart.js integration where applicable
   - Keep all reactive MVVM patterns intact

4. **React Framework Integration**
   - Create React-specific `FrameworkAdapter` for component mounting
   - Ensure compatibility with React 19 concurrent rendering
   - Support both BrowserRouter routing and plugin-based routing
   - Maintain existing layout structure

### File Structure Example

For the Dashboard Plugin:

```
apps/plugin-react/src/plugins/dashboard/
├── index.ts                    # Plugin module export
└── Dashboard.tsx               # Import and re-export from ../components/Dashboard
```

Plugin index.ts should import existing components:

```typescript
import Dashboard from '../components/Dashboard';
// Additional imports as needed
```

### Expected Plugin Manifest Example

```typescript
{
  id: 'greenhouse-dashboard-plugin',
  name: 'Greenhouse Dashboard',
  version: '1.0.0',
  entry: '../plugins/dashboard/index.ts',
  description: 'Main dashboard showing greenhouse system overview',
  widgets: [
    {
      id: 'greenhouse-dashboard-widget',
      title: 'Dashboard',
      component: Dashboard, // Imported from components
    },
  ],
  routes: [
    {
      path: '/',
      component: Dashboard,
      exact: true,
    },
    {
      path: '/dashboard',
      component: Dashboard,
      exact: true,
    },
  ],
  menuItems: [
    {
      label: 'Dashboard',
      path: '/dashboard',
      icon: 'dashboard',
    },
  ],
}
```

### Plugin Module Example

```typescript
import type { PluginModule } from '@repo/plugin-core';
import Dashboard from '../components/Dashboard';

const dashboardModule: PluginModule = {
  init: async (sdk) => {
    console.log('Dashboard plugin initialized');
  },
  mount: async (sdk) => {
    console.log('Dashboard plugin mounted');
  },
  unmount: async () => {
    console.log('Dashboard plugin unmounted');
  },
};

export const components = {
  Dashboard,
};

export default dashboardModule;
```

## Implementation Notes

1. **Component Reuse**: Import all existing components from `src/components/` - do not copy or duplicate files
2. **Plugin Organization**: Each plugin should be minimal and mainly serve as a wrapper for existing components
3. **Routing Conversion**: Convert React Router paths to plugin route definitions
4. **Navigation Integration**: Convert header navigation links to plugin menu items
5. **Layout Preservation**: Maintain the existing Header/Container/Footer layout structure
6. **State Management**: Preserve all existing view model integrations and reactive patterns
7. **Plugin Lifecycle**: Use lifecycle hooks (init, mount, unmount) for proper resource management

## Deliverables

1. **Plugin System Setup**
   - Create `src/host/PluginHost.tsx` with React framework adapter
   - Create `src/config/plugin.config.ts` with all plugin manifests
   - Create `src/types.ts` with React plugin type definitions

2. **Plugin Implementation**
   - Create 6 plugin directories in `src/plugins/`
   - Each plugin with `index.ts` implementing `PluginModule`
   - Import and re-export components from `src/components/`

3. **App Conversion**
   - Convert `App.tsx` from React Router to plugin host
   - Maintain existing layout structure
   - Support both route navigation and widget rendering

4. **Integration**
   - Register all plugins in the configuration
   - Ensure navigation menu items work correctly
   - Test all routes and dashboard widgets function properly

This is a demo application, so no tests are required. Focus on converting the traditional React Router structure to the plugin architecture while preserving all existing functionality.

## Success Criteria

- All existing component functionality is preserved without modification
- Plugin architecture is properly implemented using `packages/plugin-core`
- Traditional React Router structure is replaced with plugin-based routing
- Navigation works correctly between all plugin routes
- Dashboard displays all widgets from plugins
- Each plugin follows the established `PluginModule` interface
- Plugin manifests are properly configured with routes, widgets, and menu items
- No TypeScript compilation errors
- Application runs without runtime errors
- Existing MVVM reactive patterns remain intact
