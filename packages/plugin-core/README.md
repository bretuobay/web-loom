# @repo/plugin-core

`@repo/plugin-core` is a framework-agnostic TypeScript library for building modular, plugin-based web interfaces. It provides the core logic for registering, loading, and managing plugins, allowing you to create extensible applications where features can be added or removed dynamically.

This package is designed to be decoupled from any specific UI framework, but it can be easily integrated with libraries like React, Vue, or Angular by implementing a simple `FrameworkAdapter`.

## What Problems Does It Solve?

- **Modularity**: Decouple features into isolated plugins, making the codebase easier to maintain and scale.
- **Extensibility**: Allow third-party developers to extend your application with new features, routes, and UI components.
- **Dynamic Loading**: Load plugins on-demand to improve initial application performance.
- **Framework Agnostic**: Build a core application that is not tied to a specific UI framework, with the ability to adapt to different technologies.

## Installation

Install the package using your favorite package manager:

```bash
npm install @repo/plugin-core
```

```bash
pnpm add @repo/plugin-core
```

## Conceptual Structure

The plugin system is built around a few core concepts:

- **`PluginManifest`**: A static `plugin.json` file that declares a plugin's metadata, such as its ID, name, version, and entry point. It also defines the contributions the plugin makes to the host application, such as routes, menu items, and widgets.

- **`PluginModule`**: A JavaScript module, specified in the manifest's `entry` field, that exports an object with lifecycle hooks (`init`, `mount`, `unmount`). This module contains the plugin's runtime logic.

- **`PluginRegistry`**: A central class in the host application that manages the entire lifecycle of plugins. It is responsible for registering plugins from their manifests, resolving dependencies, and loading/unloading them.

- **`FrameworkAdapter`**: An interface that the host application must implement. It acts as a bridge between the framework-agnostic core and the specific UI framework (e.g., React, Vue). It provides the logic for rendering and unmounting components.

- **`PluginSDK`**: A sandboxed API provided to each plugin. It is the sole communication channel between a plugin and the host application, giving plugins access to services like routing, event bus, and UI components in a controlled manner.

## API Documentation

### `PluginManifest<T>`

The manifest is a static JSON object that describes the plugin.

- `id: string`: A unique identifier for the plugin.
- `name: string`: A human-readable name for the plugin.
- `version: string`: The version of the plugin (e.g., "1.0.0").
- `entry: string`: The path to the plugin's entry point file (e.g., "dist/index.js").
- `description?: string`: A brief description of the plugin.
- `author?: string`: The author of the plugin.
- `icon?: string`: A URL to an icon for the plugin.
- `routes?: PluginRouteDefinition<T>[]`: An array of routes to be registered by the plugin.
- `menuItems?: PluginMenuItem[]`: An array of menu items to be added to the UI.
- `widgets?: PluginWidgetDefinition<T>[]`: An array of widgets to be displayed.
- `metadata?: Record<string, unknown>`: A place for custom metadata.
- `dependencies?: Record<string, string>`: A map of plugin IDs to version ranges that this plugin depends on.

#### `PluginRouteDefinition<T>`

- `path: string`: The URL path for the route.
- `component: T`: The framework-specific component to render for this route.
- `exact?: boolean`: Whether the path should be matched exactly.

#### `PluginMenuItem`

- `label: string`: The text to display for the menu item.
- `path: string`: The path to navigate to when the item is clicked.
- `icon?: string`: An optional icon for the menu item.

#### `PluginWidgetDefinition<T>`

- `id: string`: A unique identifier for the widget.
- `title: string`: The title to display for the widget.
- `component: T`: The framework-specific component to render for this widget.

### `PluginModule`

An object exported from the plugin's entry file that contains the plugin's runtime logic.

- `init?(sdk: PluginSDK): Promise<void> | void`: Called once when the plugin is first loaded. Use this for background setup.
- `mount?(sdk: PluginSDK): Promise<void> | void`: Called when the plugin's UI should be rendered. Use this to add routes, menu items, etc.
- `unmount?(): Promise<void> | void`: Called when the plugin is being unloaded. Use this for cleanup.

### `PluginRegistry<T>`

A class to manage plugins in the host application.

- `constructor(adapter?: FrameworkAdapter<T>)`: Creates a new registry, optionally with a framework adapter.
- `register(manifest: PluginManifest<T>): void`: Registers a plugin.
- `get(pluginId: string): PluginDefinition<T> | undefined`: Retrieves a plugin by its ID.
- `getAll(): PluginDefinition<T>[]`: Returns all registered plugins.
- `unregister(pluginId: string): void`: Unregisters a plugin.
- `resolveLoadOrder(): string[]`: Resolves the plugin load order based on dependencies.

### `FrameworkAdapter<T>`

An interface the host application must implement to render UI components.

- `mountComponent(component: T, container: HTMLElement): void`: Renders a component into a container.
- `unmountComponent(container: HTMLElement): void`: Unmounts a component from a container.

### `PluginSDK`

The API provided to plugins to interact with the host.

- `plugin`: Provides context about the plugin itself (`id`, `manifest`).
- `routes`: An object to `add` or `remove` routes.
- `menus`: An object to `addItem` or `removeItem` from the menu.
- `widgets`: An object to `add` or `remove` widgets.
- `events`: A pub/sub event bus (`on`, `off`, `emit`).
- `ui`: An object to show UI elements like `showModal` and `showToast`.
- `services`: Provides access to shared host services like `apiClient`, `auth`, and `storage`.

## React Example

Here is a basic example of how to use `@repo/plugin-core` with React.

### 1. Plugin: `my-plugin/`

First, create a directory for your plugin.

#### `my-plugin/plugin.json` (Manifest)

```json
{
  "id": "my-plugin",
  "name": "My First Plugin",
  "version": "1.0.0",
  "entry": "dist/index.js",
  "routes": [
    {
      "path": "/my-plugin",
      "component": "MyPluginPage"
    }
  ]
}
```

#### `my-plugin/src/index.tsx` (Plugin Module)

This file exports the plugin's lifecycle hooks and its components.

```tsx
import React from 'react';
import { PluginModule, PluginSDK } from '@repo/plugin-core';

// A simple React component
const MyPluginPage = () => (
  <div>
    <h1>Hello from My First Plugin!</h1>
    <p>This component is rendered by the plugin.</p>
  </div>
);

// The plugin module implementation
const pluginModule: PluginModule = {
  mount: (sdk: PluginSDK) => {
    console.log(`Plugin ${sdk.plugin.id} is mounting!`);
    // Components can be registered dynamically, but here we use the manifest
  },
  unmount: () => {
    console.log('My First Plugin is unmounting!');
  },
};

export default pluginModule;

// Export the component so the host can render it
export const components = {
  MyPluginPage,
};
```

### 2. Host Application

The host application is responsible for loading and rendering plugins.

#### `src/PluginHost.tsx`

This component manages the plugin lifecycle and renders plugin components.

```tsx
import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import {
  FrameworkAdapter,
  PluginRegistry,
  PluginManifest,
  PluginModule,
} from '@repo/plugin-core';

// 1. Create a React-specific FrameworkAdapter
const ReactAdapter: FrameworkAdapter<React.ComponentType> = {
  mountComponent: (component, container) => {
    ReactDOM.render(React.createElement(component), container);
  },
  unmountComponent: (container) => {
    ReactDOM.unmountComponentAtNode(container);
  },
};

// 2. Instantiate the PluginRegistry
const pluginRegistry = new PluginRegistry(ReactAdapter);

// 3. A simple component to render a plugin's route
const PluginRenderer = ({ pluginId, componentName }) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [pluginModule, setPluginModule] = useState<any>(null);

  useEffect(() => {
    // In a real app, you would dynamically import the plugin's code
    // For this example, we'll simulate it.
    const loadPlugin = async () => {
      // e.g., import('/plugins/my-plugin/dist/index.js')
      const fakeModule = await import('./plugins/my-plugin/index.tsx');
      setPluginModule(fakeModule);
    };
    loadPlugin();
  }, [pluginId]);

  useEffect(() => {
    if (containerRef.current && pluginModule) {
      const component = pluginModule.components[componentName];
      if (component) {
        pluginRegistry.adapter.mountComponent(component, containerRef.current);
      }
      return () => {
        if (containerRef.current) {
          pluginRegistry.adapter.unmountComponent(containerRef.current);
        }
      };
    }
  }, [containerRef, pluginModule, componentName]);

  return <div ref={containerRef} />;
};

// 4. The main PluginHost component
export const PluginHost = () => {
  const [manifests, setManifests] = useState<PluginManifest[]>([]);

  useEffect(() => {
    // In a real app, you would fetch manifests from an API or a known location
    const fetchManifests = async () => {
      // e.g., const response = await fetch('/api/plugins');
      const fakeManifest = (await import('./plugins/my-plugin/plugin.json')).default;
      setManifests([fakeManifest]);
    };
    fetchManifests();
  }, []);

  useEffect(() => {
    manifests.forEach((manifest) => {
      try {
        pluginRegistry.register(manifest);
      } catch (e) {
        console.error(e);
      }
    });
  }, [manifests]);

  const route = pluginRegistry.get('my-plugin')?.manifest.routes?.[0];

  return (
    <div>
      <h1>Plugin Host Application</h1>
      <nav>
        <a href="/my-plugin">Load My Plugin</a>
      </nav>
      <hr />
      {/* Basic router simulation */}
      {window.location.pathname === '/my-plugin' && route && (
        <PluginRenderer pluginId="my-plugin" componentName={route.component as string} />
      )}
    </div>
  );
};
```

## Advanced Usage

### Plugin Dependencies

Plugins can declare dependencies on other plugins using the `dependencies` field in their `plugin.json` manifest. The `PluginRegistry` can then resolve the correct load order using a topological sort.

**`plugin-a/plugin.json`**
```json
{
  "id": "plugin-a",
  "name": "Plugin A",
  "version": "1.0.0",
  "entry": "dist/index.js",
  "dependencies": {
    "plugin-b": "^1.0.0"
  }
}
```

**`plugin-b/plugin.json`**
```json
{
  "id": "plugin-b",
  "name": "Plugin B",
  "version": "1.0.0",
  "entry": "dist/index.js"
}
```

In your host application, you can get the correct loading order:

```ts
import { PluginRegistry } from '@repo/plugin-core';

const registry = new PluginRegistry();
// register plugin-a and plugin-b manifests...

try {
  const loadOrder = registry.resolveLoadOrder();
  console.log(loadOrder); // Output: ['plugin-b', 'plugin-a']

  // Now you can load the plugins in this order
  for (const pluginId of loadOrder) {
    // ... your plugin loading logic
  }
} catch (error) from {
  console.error(error.message); // Handles missing or circular dependencies
}
```

## TypeScript Support

This package is written entirely in TypeScript and exports all its types. This provides full type safety and autocompletion when developing both host applications and plugins.

## Good Practices

### Plugin Directory Structure

A good way to organize your plugins is to give each plugin its own directory, containing its manifest, source code, and other assets.

```
my-awesome-app/
├── plugins/
│   ├── my-plugin/
│   │   ├── dist/
│   │   │   └── index.js
│   │   ├── src/
│   │   │   ├── index.tsx
│   │   │   └── components/
│   │   │       └── MyComponent.tsx
│   │   ├── package.json
│   │   └── plugin.json
│   └── another-plugin/
│       └── ...
└── src/
    └── ...
```

## License

This project is licensed under the MIT License.

## Contributing

Contributions are welcome! Please see our [Contributing Guide](CONTRIBUTING.md) for more details.
