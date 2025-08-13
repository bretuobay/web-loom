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
pluginRegistry?.adapter?.mountComponent(component, container);

      return () => {
        pluginRegistry?.adapter?.unmountComponent(container);
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
<div key={plugin.manifest.id}>
{plugin.manifest.widgets?.map((widget) => (
<PluginWidgetRenderer key={widget.id} component={widget.component} />
))}
</div>
))}
</div>
);
};

PluginHost.tsx:60 Failed to register plugin: hello-world-plugin Error: Plugin with ID "hello-world-plugin" is already registered.
PluginHost.tsx:60 Failed to register plugin: chart-plugin Error: Plugin with ID "chart-plugin" is already registered.
PluginHost.tsx:23 Attempted to synchronously unmount a root while React was already rendering. React cannot finish unmounting the root until the current render has completed, which may lead to a race condition.
recharts.js:581 Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for one of the following reasons:

1. You might have mismatching versions of React and the renderer (such as React DOM)
2. You might be breaking the Rules of Hooks
3. You might have more than one copy of React in the same app
   See https://react.dev/link/invalid-hook-call for tips about how to debug and fix this problem.

What I need:

Debug and fix these errors in PluginHost.tsx and the plugin system.
Ensure plugins register only once.
Prevent unmount race conditions.
Fix the Recharts hook error so charts render correctly.
Please provide step-by-step guidance or code changes to resolve these issues.
