# Plugin Architecture Demo (React)

This application demonstrates a simple plugin architecture using `@repo/plugin-core` in a React + Vite environment.

## Overview

The application consists of a **Plugin Host** that loads and renders multiple plugins. The plugins are defined as React components and are registered with the host through a manifest file.

### Core Concepts

- **`@repo/plugin-core`**: The core library that provides the plugin management logic (registration, lifecycle, etc.).
- **`PluginHost.tsx`**: The main component that initializes the plugin system, registers plugins, and renders them.
- **`plugin.config.ts`**: A configuration file that contains the manifests for all the plugins in the application.
- **Plugins**: Self-contained units of functionality, each consisting of a React component and a manifest.

## Implemented Plugins

This demo includes two sample plugins:

1.  **`HelloWorldPlugin`**: A simple plugin that displays a static "Hello World" message.
2.  **`ChartPlugin`**: A plugin that renders a simple bar chart using the `recharts` library.

## How to Add a New Plugin

To add a new plugin, follow these steps:

1.  **Create the Plugin Directory**:
    Create a new directory for your plugin in `src/plugins/`. For example, `src/plugins/my-new-plugin`.

2.  **Create the Plugin Component**:
    Create a new React component in your plugin's directory. For example, `src/plugins/my-new-plugin/MyNewPlugin.tsx`.

3.  **Create the Plugin Module**:
    Create an `index.ts` file in your plugin's directory that exports the component.

    ```typescript
    // src/plugins/my-new-plugin/index.ts
    import MyNewPlugin from './MyNewPlugin';

    export const components = {
      MyNewPlugin,
    };
    ```

4.  **Add the Plugin Manifest**:
    Add a new manifest object to the `pluginManifests` array in `src/config/plugin.config.ts`.

    ```typescript
    // src/config/plugin.config.ts
    import { components as myNewPluginComponents } from '../plugins/my-new-plugin';

    // ... existing manifests
    {
      id: 'my-new-plugin',
      name: 'My New Plugin',
      version: '1.0.0',
      entry: '../plugins/my-new-plugin',
      widgets: [
        {
          id: 'my-new-widget',
          title: 'My New Widget',
          component: myNewPluginComponents.MyNewPlugin,
        },
      ],
    },
    ```

5.  **Run the Application**:
    Start the development server (`npm run dev`) and you should see your new plugin rendered by the host.
