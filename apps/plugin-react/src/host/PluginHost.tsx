import React, { useEffect, useState, useRef } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { type FrameworkAdapter, PluginRegistry } from '@repo/plugin-core';
import { pluginManifests } from '../config/plugin.config';
import { type ReactPluginComponent } from '../types';

// A map to store the root instances for each container
const rootInstances = new Map<HTMLElement, Root>();

// 1. Create a React-specific FrameworkAdapter using the createRoot API
const ReactAdapter: FrameworkAdapter<ReactPluginComponent> = {
  mountComponent: (component, container) => {
    let root = rootInstances.get(container);
    if (!root) {
      root = createRoot(container);
      rootInstances.set(container, root);
    }
    root.render(React.createElement(component));
  },
  unmountComponent: (container) => {
    const root = rootInstances.get(container);
    if (root) {
      root.unmount();
      rootInstances.delete(container);
    }
  },
};

// 2. Instantiate the PluginRegistry
const pluginRegistry = new PluginRegistry(ReactAdapter);

// 3. A simple component to render a plugin's widget
const PluginWidgetRenderer: React.FC<{ component: ReactPluginComponent }> = ({ component }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      pluginRegistry.adapter.mountComponent(component, container);

      return () => {
        pluginRegistry.adapter.unmountComponent(container);
      };
    }
  }, [component]);

  return <div ref={containerRef} />;
};

// 4. The main PluginHost component
export const PluginHost: React.FC = () => {
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    // Register all plugins from the manifest config
    pluginManifests.forEach((manifest) => {
      try {
        pluginRegistry.register(manifest);
      } catch (e) {
        console.error(`Failed to register plugin: ${manifest.id}`, e);
      }
    });
    setIsRegistered(true);
  }, []);

  if (!isRegistered) {
    return <div>Loading plugins...</div>;
  }

  const allPlugins = pluginRegistry.getAll();

  return (
    <div>
      <h1>Plugin Host Application</h1>
      <p>The following plugins are loaded:</p>
      {allPlugins.map((plugin) => (
        <div key={plugin.id}>
          {plugin.manifest.widgets?.map((widget) => (
            <PluginWidgetRenderer key={widget.id} component={widget.component} />
          ))}
        </div>
      ))}
    </div>
  );
};
