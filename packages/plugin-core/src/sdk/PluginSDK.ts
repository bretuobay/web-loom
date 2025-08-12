import {
  PluginManifest,
  PluginRouteDefinition,
  PluginMenuItem,
  PluginWidgetDefinition,
  TComponent,
} from '../contracts/PluginManifest';

/**
 * The Plugin SDK is the sole, controlled interface between a plugin and the host application.
 */
export interface PluginSDK {
  /**
   * Provides context about the plugin itself.
   */
  readonly plugin: {
    /** The plugin's unique ID. */
    id: string;
    /** A read-only copy of the plugin's manifest. */
    manifest: PluginManifest;
  };

  /**
   * Manages registration of application routes.
   */
  readonly routes: {
    /**
     * Adds a new route to the application.
     * @param route The route definition.
     */
    add: <T extends TComponent>(route: PluginRouteDefinition<T>) => void;
    /**
     * Removes a route from the application by its path.
     * @param path The path of the route to remove.
     */
    remove: (path: string) => void;
  };

  /**
   * Manages registration of navigation menu items.
   */
  readonly menus: {
    /**
     * Adds a new menu item to the application's UI.
     * @param item The menu item definition.
     */
    addItem: (item: PluginMenuItem) => void;
    /**
     * Removes a menu item by its label.
     * @param label The label of the menu item to remove.
     */
    removeItem: (label: string) => void;
  };

  /**
   * Manages registration of dashboard widgets.
   */
  readonly widgets: {
    /**
     * Adds a new widget to the application.
     * @param widget The widget definition.
     */
    add: <T extends TComponent>(widget: PluginWidgetDefinition<T>) => void;
    /**
     * Removes a widget by its ID.
     * @param id The ID of the widget to remove.
     */
    remove: (id: string) => void;
  };

  /**
   * A pub/sub event bus for cross-plugin and host-plugin communication.
   */
  readonly events: {
    /**
     * Subscribes to an event.
     * @param event The name of the event.
     * @param handler The function to call when the event is emitted.
     */
    on: (event: string, handler: (...args: any[]) => void) => void;
    /**
     * Unsubscribes from an event.
     * @param event The name of the event.
     * @param handler The handler function to remove.
     */
    off: (event: string, handler: (...args: any[]) => void) => void;
    /**
     * Dispatches an event.
     * @param event The name of the event.
     * @param payload Optional data to pass to the event handlers.
     */
    emit: (event: string, ...args: any[]) => void;
  };

  /**
   * Provides access to shared, host-managed UI components.
   */
  readonly ui: {
    /**
     * Displays a modal dialog.
     * @param content The component to render inside the modal.
     * @param options Framework-specific options for the modal.
     */
    showModal: <T extends TComponent>(content: T, options?: object) => void;
    /**
     * Displays a short-lived notification message.
     * @param message The message to display.
     * @param type The type of toast (e.g., 'info', 'success', 'warning', 'error').
     */
    showToast: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
  };

  /**
   * Provides access to shared, host-provided application services.
   */
  readonly services: {
    /**
     * A pre-configured client for making authenticated network requests.
     */
    apiClient: {
      get: <T>(url: string) => Promise<T>;
      post: <T>(url: string, data: any) => Promise<T>;
      put: <T>(url: string, data: any) => Promise<T>;
      delete: <T>(url: string) => Promise<T>;
    };
    /**
     * A service for managing user authentication and permissions.
     */
    auth: {
      /** Returns the current authenticated user's information. */
      getUser: () => Promise<{ id: string; name: string; email: string } | null>;
      /** Checks if the current user has a specific role or permission. */
      hasRole: (role: string) => Promise<boolean>;
    };
    /**
     * A key-value storage service for persisting plugin data.
     */
    storage: {
      /**
       * Retrieves a value from storage.
       * @param key The key of the item to retrieve.
       */
      get: <T>(key: string) => Promise<T | null>;
      /**
       * Saves a value to storage.
       * @param key The key of the item to save.
       * @param value The value to save.
       */
      set: (key: string, value: any) => Promise<void>;
      /**
       * Removes a value from storage.
       * @param key The key of the item to remove.
       */
      remove: (key: string) => Promise<void>;
    };
  };
}
