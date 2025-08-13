import React, { useEffect, useState, useRef } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { type FrameworkAdapter, PluginRegistry } from '@repo/plugin-core';
import { pluginManifests } from '../config/plugin.config';
import { type ReactPluginComponent } from '../types';

// --- utils -------------------------------------------------------------

// Use a WeakMap to avoid leaking container references.
const rootInstances = new WeakMap<HTMLElement, Root>();

// Track containers scheduled for disposal so we can cancel if a remount happens.
const pendingDispose = new WeakSet<HTMLElement>();

const schedule = typeof queueMicrotask === 'function' ? queueMicrotask : (cb: () => void) => Promise.resolve().then(cb);

// --- React adapter (safe for concurrent React) -------------------------

const ReactAdapter: FrameworkAdapter<ReactPluginComponent> = {
  mountComponent: (Component, container) => {
    let root = rootInstances.get(container);
    if (!root) {
      root = createRoot(container);
      rootInstances.set(container, root);
    }

    // If an unmount was scheduled for this container, cancel it.
    pendingDispose.delete(container);

    // Render (or re-render) the component into this root.
    root.render(React.createElement(Component));
  },

  unmountComponent: (container) => {
    const root = rootInstances.get(container);
    if (!root) return;

    // Immediately unmount the subtree but keep the root object alive.
    // This is safe even if some other root is currently committing.
    root.render(null);
    pendingDispose.add(container);

    // Dispose the root itself *after* the current commit completes.
    schedule(() => {
      if (pendingDispose.has(container)) {
        root.unmount();
        rootInstances.delete(container);
        pendingDispose.delete(container);
      }
    });
  },
};

// --- registry ----------------------------------------------------------

const pluginRegistry = new PluginRegistry(ReactAdapter);

// --- widget renderer ---------------------------------------------------

const PluginWidgetRenderer: React.FC<{ component: ReactPluginComponent }> = ({ component }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Mount once when the container appears; dispose when the container truly goes away.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    pluginRegistry.adapter?.mountComponent(component, container);

    return () => {
      // This cleanup runs during the parent commit → we only *schedule* the actual root.unmount().
      pluginRegistry.adapter?.unmountComponent(container);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // do not depend on `component` here to avoid tearing down the root on prop changes

  // If the plugin `component` prop changes, just re-render into the existing root.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    pluginRegistry.adapter?.mountComponent(component, container);
  }, [component]);

  // Important for libraries like Recharts that need layout:
  // Give the container a measurable size or use ResponsiveContainer inside the plugin.
  return <div ref={containerRef} style={{ width: '100%', minHeight: 200 }} />;
};

// --- host --------------------------------------------------------------

export const PluginHost: React.FC = () => {
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    pluginManifests.forEach((manifest) => {
      try {
        const existing = pluginRegistry.getAll().find((p) => p.manifest.id === manifest.id);
        if (!existing) pluginRegistry.register(manifest);
      } catch (e) {
        console.error(`Failed to register plugin: ${manifest.id}`, e);
      }
    });
    setIsRegistered(true);
  }, []);

  if (!isRegistered) return <div>Loading plugins...</div>;

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
