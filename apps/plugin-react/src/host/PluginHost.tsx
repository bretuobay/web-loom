import React, { createContext, createElement, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { PluginRegistry, PluginSDKImplementation } from '@repo/plugin-core';
import type {
  FrameworkAdapter,
  HostServices,
  PluginMenuItem,
  PluginRouteDefinition,
  PluginWidgetDefinition,
  TComponent,
} from '@repo/plugin-core';
import { Route, Routes, useLocation } from '../router/Routing';
import { pluginManifests, pluginModules } from '../config/plugin.config';
import type { ReactPluginComponent } from '../types';

const rootMap = new Map<HTMLElement, Root>();

const ReactAdapter: FrameworkAdapter<ReactPluginComponent> = {
  mountComponent: (component, container) => {
    let root = rootMap.get(container);
    if (!root) {
      root = createRoot(container);
      rootMap.set(container, root);
    }
    root.render(createElement(component));
  },
  unmountComponent: (container) => {
    const root = rootMap.get(container);
    if (root) {
      root.unmount();
      rootMap.delete(container);
    }
  },
};

const pluginRegistry = new PluginRegistry<ReactPluginComponent>(ReactAdapter);

interface PluginHostContextValue {
  routes: PluginRouteDefinition<ReactPluginComponent>[];
  widgets: PluginWidgetDefinition<ReactPluginComponent>[];
  menuItems: PluginMenuItem[];
  isReady: boolean;
}

const PluginHostContext = createContext<PluginHostContextValue | null>(null);

const usePluginHostContext = () => {
  const context = useContext(PluginHostContext);
  if (!context) {
    throw new Error('PluginHost must be rendered within PluginHostProvider');
  }
  return context;
};

export const usePluginMenuItems = () => {
  const context = useContext(PluginHostContext);
  return context?.menuItems ?? [];
};

export const PluginHostProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [routes, setRoutes] = useState<PluginRouteDefinition<ReactPluginComponent>[]>([]);
  const [widgets, setWidgets] = useState<PluginWidgetDefinition<ReactPluginComponent>[]>([]);
  const [menuItems, setMenuItems] = useState<PluginMenuItem[]>([]);
  const [isReady, setIsReady] = useState(false);
  const eventHandlersRef = useRef(new Map<string, Set<(...args: any[]) => void>>());

  const hostServices = useMemo<HostServices>(() => {
    const addRoute = <T extends TComponent>(route: PluginRouteDefinition<T>) => {
      const normalizedRoute: PluginRouteDefinition<ReactPluginComponent> = {
        ...route,
        component: route.component as ReactPluginComponent,
      };
      setRoutes((prev) =>
        prev.some((entry) => entry.path === normalizedRoute.path) ? prev : [...prev, normalizedRoute],
      );
    };

    const removeRoute = (path: string) => {
      setRoutes((prev) => prev.filter((entry) => entry.path !== path));
    };

    const addWidget = <T extends TComponent>(widget: PluginWidgetDefinition<T>) => {
      const normalizedWidget: PluginWidgetDefinition<ReactPluginComponent> = {
        ...widget,
        component: widget.component as ReactPluginComponent,
      };
      setWidgets((prev) =>
        prev.some((entry) => entry.id === normalizedWidget.id) ? prev : [...prev, normalizedWidget],
      );
    };

    const removeWidget = (id: string) => {
      setWidgets((prev) => prev.filter((entry) => entry.id !== id));
    };

    const addMenuItem = (item: PluginMenuItem) => {
      setMenuItems((prev) => (prev.some((entry) => entry.label === item.label) ? prev : [...prev, item]));
    };

    const removeMenuItem = (label: string) => {
      setMenuItems((prev) => prev.filter((entry) => entry.label !== label));
    };

    const handlers = eventHandlersRef.current;

    const registerEvent = (event: string, handler: (...args: any[]) => void) => {
      const set = handlers.get(event) ?? new Set();
      set.add(handler);
      handlers.set(event, set);
    };

    const unregisterEvent = (event: string, handler: (...args: any[]) => void) => {
      const set = handlers.get(event);
      if (!set) return;
      set.delete(handler);
      if (set.size === 0) {
        handlers.delete(event);
      }
    };

    const emitEvent = (event: string, ...args: any[]) => {
      handlers.get(event)?.forEach((handler) => handler(...args));
    };

    function showModal<T extends TComponent>(_content: T, _options?: object) {
      console.warn('Modal service is not configured in PluginHost');
    }

    function showToast(message: string, type?: 'info' | 'success' | 'warning' | 'error') {
      console.info(`[toast${type ? `:${type}` : ''}] ${message}`);
    }

    async function apiClientGet<T>() {
      return Promise.reject<T>(new Error('Host apiClient.get is not implemented'));
    }

    async function apiClientPost<T>() {
      return Promise.reject<T>(new Error('Host apiClient.post is not implemented'));
    }

    async function apiClientPut<T>() {
      return Promise.reject<T>(new Error('Host apiClient.put is not implemented'));
    }

    async function apiClientDelete<T>() {
      return Promise.reject<T>(new Error('Host apiClient.delete is not implemented'));
    }

    return {
      routes: {
        add: addRoute,
        remove: removeRoute,
      },
      menus: {
        addItem: addMenuItem,
        removeItem: removeMenuItem,
      },
      widgets: {
        add: addWidget,
        remove: removeWidget,
      },
      events: {
        on: registerEvent,
        off: unregisterEvent,
        emit: emitEvent,
      },
      ui: {
        showModal,
        showToast,
      },
      services: {
        apiClient: {
          get: apiClientGet,
          post: apiClientPost,
          put: apiClientPut,
          delete: apiClientDelete,
        },
        auth: {
          getUser: async () => null,
          hasRole: async () => false,
        },
        storage: {
          get: async () => null,
          set: async () => {},
          remove: async () => {},
        },
      },
    };
  }, []);

  useEffect(() => {
    pluginManifests.forEach((manifest) => {
      try {
        if (!pluginRegistry.get(manifest.id)) {
          pluginRegistry.register(manifest);
        }
      } catch (error) {
        console.error('Failed to register plugin', manifest.id, error);
      }
    });

    let isCancelled = false;

    const loadPlugins = async () => {
      for (const manifest of pluginManifests) {
        const module = pluginModules[manifest.id];
        if (!module) {
          console.warn(`Missing module for plugin ${manifest.id}`);
          continue;
        }
        const sdk = new PluginSDKImplementation(manifest.id, manifest, hostServices);
        try {
          await module.init?.(sdk);
          if (isCancelled) return;
          await module.mount?.(sdk);
        } catch (error) {
          console.error(`Failed to initialize plugin ${manifest.id}`, error);
        }
      }
      if (!isCancelled) {
        setIsReady(true);
      }
    };

    loadPlugins();

    return () => {
      isCancelled = true;
      pluginManifests.forEach((manifest) => {
        pluginModules[manifest.id]?.unmount?.();
      });
    };
  }, [hostServices]);

  const contextValue = useMemo(
    () => ({
      routes,
      widgets,
      menuItems,
      isReady,
    }),
    [routes, widgets, menuItems, isReady],
  );

  return <PluginHostContext.Provider value={contextValue}>{children}</PluginHostContext.Provider>;
};

export const PluginHost: React.FC = () => {
  const { routes, widgets, isReady } = usePluginHostContext();
  const location = useLocation();
  const showWidgets = ['/', '/dashboard'].includes(location.pathname);
  const shouldHideRoute = (path: string) => showWidgets && ['/', '/dashboard'].includes(path);

  if (!isReady) {
    return <p>Loading plugins...</p>;
  }

  return (
    <div>
      {showWidgets && widgets.length > 0 && (
        <section className="widget-area">
          {widgets.map((widget) => (
            <article
              key={widget.id}
              className={`widget-card${widget.id === 'sensor-reading-card-widget' ? ' widget-full' : ''}`}
            >
              <header>
                <h3>{widget.title}</h3>
              </header>
              <div>
                <widget.component />
              </div>
            </article>
          ))}
        </section>
      )}
      <Routes>
        {routes.map((route) => (
          <Route
            key={route.path}
            path={route.path}
            element={shouldHideRoute(route.path) ? <></> : <route.component />}
          />
        ))}
        <Route path="*" element={<p>Select a feature from the navigation menu.</p>} />
      </Routes>
    </div>
  );
};
