# LLM Coding Agent Prompt: Convert MVVM React App to Plugin Architecture

## Project Overview

You are working with the Web Loom monorepo, a comprehensive framework for building MVVM applications. Your task is to reimplement the existing `apps/mvvm-react` application using the plugin architecture defined in the packages, specifically replacing the existing demo plugins in `apps/plugin-react/src/plugins` with greenhouse management system plugins based on the components from `apps/mvvm-react`.

## Repository Structure Context

This is a turborepo monorepo with the following key structure:

### Current Apps

- `apps/mvvm-react/` - Existing greenhouse management MVVM React app (source of components to convert)
- `apps/plugin-react/` - Existing plugin host app (target app to modify)

### Key Packages

- `packages/plugin-core/` - Core plugin system architecture
- `packages/view-models/` - Reactive view models for greenhouse data
- `packages/models/` - Data models and schemas
- `packages/mvvm-core/` - Core MVVM framework
- `packages/shared/` - Shared utilities and styles

## Current MVVM React App Structure (`apps/mvvm-react`)

The existing app has these key components:

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

### Routing Structure

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

- `PluginManifest<T>` interface for declaring plugin metadata
- `PluginModule` interface for plugin lifecycle hooks
- `PluginRegistry` class for managing plugin registration
- `FrameworkAdapter<T>` for framework-specific component mounting
- Support for widgets, routes, and menu items

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
}
```

### Current Plugin Host Structure (`apps/plugin-react`)

- `src/host/PluginHost.tsx` - Main plugin host component with React adapter
- `src/config/plugin.config.ts` - Plugin manifest configuration
- `src/types.ts` - TypeScript type definitions
- Currently has 3 demo plugins: hello-world, chart, and long

## Your Task

Replace the existing demo plugins in `apps/plugin-react/src/plugins` with a complete greenhouse management system structured as plugins. Convert each major component/view from the MVVM React app into individual plugins.

### Required Plugin Structure

Create the following plugins in `apps/plugin-react/src/plugins/`:

1. **Dashboard Plugin** (`dashboard/`)
   - Convert `Dashboard.tsx` to a plugin widget
   - Include all dashboard cards as sub-components

2. **Greenhouse Plugin** (`greenhouse/`)
   - Convert `GreenhouseCard.tsx` and `GreenhouseList.tsx`
   - Provide both card and list widgets
   - Include route for `/greenhouses`

3. **Sensor Plugin** (`sensor/`)
   - Convert `SensorCard.tsx` and `SensorList.tsx`
   - Provide both card and list widgets
   - Include route for `/sensors`

4. **Sensor Reading Plugin** (`sensor-reading/`)
   - Convert `SensorReadingCard.tsx` and `SensorReadingList.tsx`
   - Provide both card and list widgets
   - Include route for `/sensor-readings`

5. **Threshold Alert Plugin** (`threshold-alert/`)
   - Convert `ThresholdAlertCard.tsx` and `ThresholdAlertList.tsx`
   - Provide both card and list widgets
   - Include route for `/threshold-alerts`

6. **Navigation Plugin** (`navigation/`)
   - Convert `Header.tsx` to a navigation plugin
   - Provide menu items for all routes

### Each Plugin Should Include:

1. **index.ts** - Plugin module export with lifecycle hooks
2. **[PluginName].tsx** - Main plugin components
3. **components/** folder if multiple sub-components needed
4. Proper TypeScript typing using `ReactPluginComponent`

### Plugin Configuration Requirements

Update `apps/plugin-react/src/config/plugin.config.ts` to:

- Remove existing demo plugin manifests
- Add all 6 new greenhouse management plugin manifests
- Include proper route definitions for navigation
- Include widget definitions for dashboard display
- Include menu items for header navigation

### Technical Requirements

1. **Preserve Existing Functionality**
   - All components should work exactly as in the original MVVM React app
   - Maintain reactive data binding using `useObservable` hook
   - Keep all view model dependencies intact
   - Preserve styling and layout

2. **Plugin Architecture Compliance**
   - Each plugin must export a `PluginModule` object
   - Components must be typed as `ReactPluginComponent`
   - Use proper plugin manifest structure
   - Support both widget and route-based rendering

3. **Dependencies**
   - Import view models from `@repo/view-models`
   - Use `useObservable` hook from the appropriate location
   - Maintain chart.js integration where applicable
   - Keep react-router-dom compatibility for routes

4. **Plugin Host Integration**
   - Update the main `PluginHost.tsx` if needed for layout
   - Ensure proper React 19 concurrent rendering compatibility
   - Support both widget-based and route-based plugin rendering

### File Structure Example

For the Dashboard Plugin:

```
apps/plugin-react/src/plugins/dashboard/
├── index.ts                    # Plugin module export
├── Dashboard.tsx              # Main dashboard widget
└── components/
    ├── GreenhouseCard.tsx
    ├── SensorCard.tsx
    ├── SensorReadingCard.tsx
    └── ThresholdAlertCard.tsx
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
      component: components.Dashboard,
    },
  ],
  routes: [
    {
      path: '/',
      component: components.Dashboard,
      exact: true,
    },
    {
      path: '/dashboard',
      component: components.Dashboard,
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

## Implementation Notes

1. **Data Flow**: Maintain the same reactive data flow using view models and the `useObservable` hook
2. **Routing**: Convert React Router routes to plugin route definitions
3. **Navigation**: Convert header navigation to plugin menu items
4. **Styling**: Preserve existing CSS classes and styling
5. **Error Handling**: Maintain existing error handling patterns
6. **Performance**: Ensure plugin lazy loading doesn't break functionality

## Deliverables

1. Remove all existing demo plugins from `apps/plugin-react/src/plugins/`
2. Implement all 6 greenhouse management plugins with proper structure
3. Update plugin configuration with all new manifests
4. Ensure the plugin host properly renders both widgets and routes
5. Verify all functionality from the original MVVM React app is preserved
6. Test navigation between all plugin routes works correctly

This is a demo application, so no tests are required. Focus on functional implementation and proper plugin architecture compliance.

## Success Criteria

- All original MVVM React app functionality is preserved
- Plugin architecture is properly implemented
- Navigation works between all sections
- Dashboard displays all widgets correctly
- Each plugin is properly isolated and follows the established patterns
- No TypeScript compilation errors
- Application runs without runtime errors
