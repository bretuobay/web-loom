# Marko MVVM Application - Product Requirements Document

## Executive Summary

This document outlines the requirements for developing a Marko.js application that demonstrates the integration and usage of the `@web-loom/mvvm-core` library. The application will replicate the functionality of the existing React MVVM application (`apps/mvvm-react`) to showcase how Web-Loom's MVVM pattern can be seamlessly implemented across different JavaScript frameworks.

## Project Overview

### Purpose

Create a Marko.js application that serves as a practical demonstration of:

- MVVM pattern implementation using `@web-loom/mvvm-core`
- Framework agnostic capabilities of Web-Loom's architecture
- Best practices for integrating reactive ViewModels in Marko.js applications

### Goals

- **Primary**: Demonstrate that `@web-loom/mvvm-core` works consistently across frameworks
- **Secondary**: Provide developers with a reference implementation for Marko.js + Web-Loom integration
- **Tertiary**: Showcase Marko.js capabilities in enterprise-level application development

## Current State Analysis

### React Application Features

The existing `apps/mvvm-react` application includes:

- **Dashboard**: Central view displaying greenhouse, sensor, sensor reading, and threshold alert data
- **Navigation**: Multi-page application with routes for each data entity
- **Components**: Modular card-based UI components for different data types
- **MVVM Integration**: Uses `useObservable` hook to subscribe to reactive ViewModels
- **Data Fetching**: Asynchronous data loading with loading states
- **Routing**: React Router for navigation between different views

### ViewModels Used

- `greenHouseViewModel` - Greenhouse data management
- `sensorViewModel` - Sensor data management
- `sensorReadingViewModel` - Sensor reading data management
- `thresholdAlertViewModel` - Alert threshold data management

## Technical Requirements

### 1. Framework Integration

#### Marko.js Setup

- **Framework Version**: Marko 6.x
- **Build System**: @marko/run
- **Language**: TypeScript support
- **Architecture**: File-based routing system

#### Web-Loom Integration

- **Core Package**: `@web-loom/mvvm-core`
- **ViewModels**: `@repo/view-models` package
- **Shared Resources**: `@repo/shared` styles and utilities
- **Models**: `@repo/models` for data schemas

### 2. Application Architecture

#### Routing Structure

```
/                    - Dashboard (landing page)
/dashboard          - Dashboard view
/greenhouses        - Greenhouse list view
/sensors            - Sensor list view
/sensor-readings    - Sensor reading list view
/threshold-alerts   - Threshold alert list view
```

#### Component Structure

```
src/
├── routes/
│   ├── +layout.marko              # Main layout
│   ├── +page.marko                # Dashboard (root)
│   ├── dashboard/
│   │   └── +page.marko            # Dashboard page
│   ├── greenhouses/
│   │   └── +page.marko            # Greenhouse list
│   ├── sensors/
│   │   └── +page.marko            # Sensor list
│   ├── sensor-readings/
│   │   └── +page.marko            # Sensor reading list
│   └── threshold-alerts/
│       └── +page.marko            # Threshold alert list
├── tags/
│   ├── greenhouse-card.marko       # Greenhouse display component
│   ├── sensor-card.marko          # Sensor display component
│   ├── sensor-reading-card.marko  # Sensor reading component
│   ├── threshold-alert-card.marko # Threshold alert component
│   └── observable-data.marko      # MVVM integration helper
└── utils/
    └── observable-helper.js       # Marko-specific observable utilities
```

### 3. MVVM Implementation

#### Observable Integration Pattern

Since Marko doesn't have hooks like React, the integration pattern should:

1. **Component-Level Integration**:
   - Use Marko's lifecycle methods to subscribe/unsubscribe from observables
   - Implement reactive data binding through component state updates
   - Handle loading states and error conditions

2. **Helper Tag Creation**:
   - Create a reusable `<observable-data>` tag that encapsulates subscription logic
   - Provide slot-based content rendering for different loading/data states
   - Handle subscription cleanup automatically

3. **Data Fetching**:
   - Execute ViewModel commands in component `onCreate` lifecycle
   - Manage multiple ViewModels concurrently
   - Provide consistent error handling across all components

#### Example Integration Pattern

```marko
<!-- Dashboard implementation -->
import { greenHouseViewModel } from '@repo/view-models/GreenHouseViewModel';
import { sensorViewModel } from '@repo/view-models/SensorViewModel';

class {
  onCreate() {
    // Initialize data fetching
    this.fetchDashboardData();
  }

  async fetchDashboardData() {
    try {
      await Promise.all([
        greenHouseViewModel.fetchCommand.execute(),
        sensorViewModel.fetchCommand.execute(),
        // ... other ViewModels
      ]);
    } catch (error) {
      console.error('Dashboard data fetch failed:', error);
    }
  }
}

<observable-data viewModel=greenHouseViewModel>
  <@loading>
    <p>Loading greenhouse data...</p>
  </@loading>

  <@data|greenhouses|>
    <greenhouse-card greenhouses=greenhouses />
  </@data>
</observable-data>
```

### 4. Feature Parity Requirements

#### Dashboard View

- **Data Display**: Show summary cards for all entity types
- **Loading States**: Display loading indicators during data fetch
- **Error Handling**: Graceful error display and retry mechanisms
- **Layout**: Responsive grid layout matching React version styling

#### List Views

- **Greenhouse List**: Display all greenhouse entities with details
- **Sensor List**: Show sensor information and status
- **Sensor Reading List**: Display sensor readings with timestamps
- **Threshold Alert List**: Show alert information and status

#### Navigation

- **Header Navigation**: Consistent navigation bar with active state indication
- **Routing**: Smooth navigation between different views
- **Layout**: Shared layout with header and footer components

#### Styling

- **CSS Integration**: Utilize `@repo/shared/styles` for consistent theming
- **Responsive Design**: Mobile-friendly layouts
- **Component Styling**: Scoped styles for each Marko component

### 5. Performance Requirements

#### Loading Performance

- **Initial Load**: Application should load within 2 seconds
- **Route Navigation**: Sub-second transitions between routes
- **Data Fetching**: Concurrent loading of multiple ViewModels

#### Memory Management

- **Observable Subscriptions**: Proper cleanup to prevent memory leaks
- **Component Lifecycle**: Efficient mounting/unmounting of components

### 6. Development Requirements

#### Package Configuration

```json
{
  "dependencies": {
    "@repo/shared": "*",
    "@repo/view-models": "*",
    "marko": "^6.0.132"
  },
  "devDependencies": {
    "@marko/run": "^0.9.3",
    "typescript": "^5.8.3"
  }
}
```

#### Build Configuration

- **TypeScript**: Full TypeScript support with proper type checking
- **Development Server**: Hot reloading for efficient development
- **Production Build**: Optimized bundles for deployment

#### Development Scripts

```json
{
  "scripts": {
    "dev": "marko-run",
    "build": "marko-run build",
    "preview": "marko-run preview",
    "type-check": "tsc --noEmit"
  }
}
```

## Implementation Plan

### Phase 1: Foundation Setup

1. **Project Setup**: Configure Marko.js with TypeScript and Web-Loom dependencies
2. **Layout Creation**: Implement base layout with header/footer
3. **Routing Structure**: Set up file-based routing system
4. **Observable Helper**: Create Marko-specific observable integration utilities

### Phase 2: Core Components

1. **Observable Data Tag**: Implement reusable observable subscription component
2. **Card Components**: Create entity display cards (greenhouse, sensor, etc.)
3. **Dashboard View**: Implement main dashboard with all data integration
4. **Basic Navigation**: Working navigation between routes

### Phase 3: Feature Completion

1. **Individual List Views**: Implement all entity-specific list pages
2. **Loading States**: Add proper loading indicators and error handling
3. **Styling Integration**: Apply shared styles and responsive design
4. **Performance Optimization**: Optimize bundle size and loading performance

### Phase 4: Testing and Documentation

1. **Integration Testing**: Verify MVVM pattern works correctly
2. **Cross-browser Testing**: Ensure compatibility across browsers
3. **Documentation**: Create comprehensive setup and usage documentation
4. **Performance Validation**: Verify performance requirements are met

## Success Criteria

### Functional Requirements

- ✅ All React app features replicated in Marko.js
- ✅ MVVM pattern successfully integrated using `@web-loom/mvvm-core`
- ✅ Consistent data display across all views
- ✅ Working navigation between all routes
- ✅ Proper loading and error states

### Technical Requirements

- ✅ TypeScript compilation without errors
- ✅ No observable subscription memory leaks
- ✅ Responsive design on mobile and desktop
- ✅ Performance metrics meet requirements
- ✅ Code follows Web-Loom architectural patterns

### Documentation Requirements

- ✅ Clear setup instructions
- ✅ MVVM integration examples
- ✅ Component usage documentation
- ✅ Comparison with React implementation

## Risk Assessment

### Technical Risks

- **Marko Observable Integration**: May require custom subscription management
- **TypeScript Compatibility**: Ensuring proper type inference with Marko components
- **Bundle Size**: Managing dependencies to keep bundle size reasonable

### Mitigation Strategies

- **Prototype Early**: Build observable integration proof-of-concept first
- **TypeScript Configuration**: Use strict type checking throughout development
- **Performance Monitoring**: Regular performance testing during development

## Conclusion

This PRD outlines the development of a Marko.js application that demonstrates the framework-agnostic capabilities of Web-Loom's MVVM architecture. By replicating the React application functionality, we will provide developers with a clear example of how `@web-loom/mvvm-core` can be integrated into different frontend frameworks while maintaining consistent patterns and architecture.

The successful implementation of this project will serve as both a technical demonstration and a reference implementation for developers looking to use Web-Loom with Marko.js in their own projects.
