import {
  PluginManifest,
  PluginRouteDefinition,
  PluginMenuItem,
  PluginWidgetDefinition,
  TComponent,
} from '../contracts';
import { PluginSDK } from './PluginSDK';

// These interfaces define the services that the host application must provide.

export interface HostEventBus {
  on(event: string, handler: (...args: any[]) => void): void;
  off(event: string, handler: (...args: any[]) => void): void;
  emit(event: string, ...args: any[]): void;
}

export interface HostUIService {
  showModal: <T extends TComponent>(content: T, options?: object) => void;
  showToast: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
}

export interface HostServices {
  routes: {
    add: <T extends TComponent>(route: PluginRouteDefinition<T>) => void;
    remove: (path: string) => void;
  };
  menus: {
    addItem: (item: PluginMenuItem) => void;
    removeItem: (label: string) => void;
  };
  widgets: {
    add: <T extends TComponent>(widget: PluginWidgetDefinition<T>) => void;
    remove: (id: string) => void;
  };
  events: HostEventBus;
  ui: HostUIService;
  services: {
    apiClient: {
      get: <T>(url: string) => Promise<T>;
      post: <T>(url: string, data: any) => Promise<T>;
      put: <T>(url: string, data: any) => Promise<T>;
      delete: <T>(url: string) => Promise<T>;
    };
    auth: {
      getUser: () => Promise<{ id: string; name: string; email: string } | null>;
      hasRole: (role: string) => Promise<boolean>;
    };
    storage: {
      get: <T>(key: string) => Promise<T | null>;
      set: (key: string, value: any) => Promise<void>;
      remove: (key: string) => Promise<void>;
    };
  };
}

/**
 * The concrete implementation of the PluginSDK.
 * This class is instantiated by the host and passed to the plugin's lifecycle hooks.
 */
export class PluginSDKImplementation<T extends TComponent = TComponent> implements PluginSDK {
  public readonly plugin: {
    id: string;
    manifest: PluginManifest<T>;
  };

  public readonly routes: HostServices['routes'];
  public readonly menus: HostServices['menus'];
  public readonly widgets: HostServices['widgets'];
  public readonly events: HostEventBus;
  public readonly ui: HostUIService;
  public readonly services: HostServices['services'];

  constructor(
    pluginId: string,
    pluginManifest: PluginManifest<T>,
    hostServices: HostServices
  ) {
    this.plugin = {
      id: pluginId,
      manifest: pluginManifest,
    };

    // Bind the host services to the SDK properties.
    // This acts as a proxy or facade, ensuring the plugin only interacts
    // with the host through this well-defined interface.
    this.routes = hostServices.routes;
    this.menus = hostServices.menus;
    this.widgets = hostServices.widgets;
    this.events = hostServices.events;
    this.ui = hostServices.ui;
    this.services = hostServices.services;
  }
}
