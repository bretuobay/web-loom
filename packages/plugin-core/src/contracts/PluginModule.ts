import { PluginSDK } from '../sdk/PluginSDK';

/**
 * A JavaScript module, exported from the plugin's entry file, that defines
 * the plugin's runtime behavior through lifecycle hooks.
 */
export interface PluginModule {
  /**
   * Called once when the plugin is first loaded. Used for background setup,
   * pre-loading data, or registering event listeners.
   * @param sdk The Plugin SDK instance.
   */
  init?: (sdk: PluginSDK) => Promise<void> | void;

  /**
   * Called when the plugin's UI should be rendered or activated. Used for
   * adding routes, menu items, and other UI components.
   * @param sdk The Plugin SDK instance.
   */
  mount?: (sdk: PluginSDK) => Promise<void> | void;

  /**
   * Called when the plugin is being deactivated or unloaded. Used to release
   * resources, remove event listeners, and perform cleanup to prevent memory leaks.
   */
  unmount?: () => Promise<void> | void;
}
