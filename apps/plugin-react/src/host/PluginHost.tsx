import React from 'react';
import { PluginRegistry } from '@repo/plugin-core';
import { pluginManifests } from '../config/plugin.config';
import { type ReactPluginComponent } from '../types';

// 1. Instantiate the PluginRegistry. No adapter is needed as we will render components directly.
const pluginRegistry = new PluginRegistry<ReactPluginComponent>();

// 2. Register all plugins from the manifest config at the module level.
// This ensures plugins are registered only once.
pluginManifests.forEach((manifest) => {
  // The registry checks for duplicates, but we can also add our own check
  // to prevent errors in hot-reloading development environments.
  if (!pluginRegistry.get(manifest.id)) {
    try {
      pluginRegistry.register(manifest);
    } catch (e) {
      console.error(`Failed to register plugin: ${manifest.id}`, e);
    }
  }
});

// 3. A simple component to render a plugin's widget.
// It now renders the component directly within the same React tree.
const PluginWidgetRenderer: React.FC<{ component: ReactPluginComponent }> = ({
  component: Component,
}) => {
  return <Component />;
};

// 4. The main PluginHost component
export const PluginHost: React.FC = () => {
  const allPlugins = pluginRegistry.getAll();

  return (
    <div>
      <h1>Plugin Host Application</h1>
      <p>The following plugins are loaded:</p>
      {allPlugins.map((plugin) => (
        <div key={plugin.manifest.id}>
          {plugin.manifest.widgets?.map((widget) => (
            <PluginWidgetRenderer key={widget.id} component={widget.component} />
          ))}
        </div>
      ))}
    </div>
  );
};
