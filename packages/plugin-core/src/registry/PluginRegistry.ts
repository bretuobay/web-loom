import { PluginManifest, PluginManifestSchema, TComponent } from '../contracts';
import { FrameworkAdapter } from '../adapter';

/**
 * The lifecycle state of a plugin.
 */
export type PluginState =
  | 'registered' // Manifest has been loaded and validated
  | 'loading' // Plugin code is being fetched
  | 'loaded' // Plugin code has been loaded, `init` called
  | 'mounted' // `mount` has been called
  | 'unmounted' // `unmount` has been called
  | 'error'; // An error occurred

/**
 * Internal representation of a plugin within the registry.
 */
export interface PluginDefinition<T extends TComponent = TComponent> {
  manifest: PluginManifest<T>;
  state: PluginState;
  instance?: any; // This would hold the loaded plugin module
}

export class PluginRegistry<T extends TComponent = TComponent> {
  public readonly plugins = new Map<string, PluginDefinition<T>>();

  constructor(public readonly adapter?: FrameworkAdapter<T>) {}

  /**
   * Registers a plugin with the registry.
   *
   * @param manifest The plugin manifest.
   * @throws An error if the manifest is invalid or the plugin ID is already registered.
   */
  register(manifest: PluginManifest<T>): void {
    // 1. Validate the manifest
    try {
      PluginManifestSchema.parse(manifest);
    } catch (error) {
      const e = error as Error;
      throw new Error(`Invalid plugin manifest for "${manifest.id}": ${e.message}`);
    }

    // 2. Check for duplicates
    if (this.plugins.has(manifest.id)) {
      throw new Error(`Plugin with ID "${manifest.id}" is already registered.`);
    }

    // 3. Store the plugin definition
    const definition: PluginDefinition<T> = {
      manifest,
      state: 'registered',
    };
    this.plugins.set(manifest.id, definition);
  }

  /**
   * Retrieves a plugin definition by its ID.
   *
   * @param pluginId The ID of the plugin.
   * @returns The plugin definition, or undefined if not found.
   */
  get(pluginId: string): PluginDefinition<T> | undefined {
    return this.plugins.get(pluginId);
  }

  /**
   * Returns all registered plugin definitions.
   */
  getAll(): PluginDefinition<T>[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Unregisters a plugin by its ID.
   *
   * @param pluginId The ID of the plugin to unregister.
   */
  unregister(pluginId: string): void {
    // TODO: Handle unmounting if the plugin is active
    this.plugins.delete(pluginId);
  }

  /**
   * Resolves the plugin load order based on dependencies using topological sort.
   *
   * @returns An array of plugin IDs in the order they should be loaded.
   * @throws An error if a dependency is not registered or a circular dependency is detected.
   */
  resolveLoadOrder(): string[] {
    const pluginIds = Array.from(this.plugins.keys());
    const adj = new Map<string, string[]>();
    const inDegree = new Map<string, number>();

    // Initialize in-degrees and adjacency list
    for (const id of pluginIds) {
      inDegree.set(id, 0);
      adj.set(id, []);
    }

    // Build the graph
    for (const [id, plugin] of this.plugins) {
      const dependencies = plugin.manifest.dependencies || {};
      for (const depId of Object.keys(dependencies)) {
        if (!this.plugins.has(depId)) {
          throw new Error(`Plugin "${id}" has an unresolved dependency: "${depId}" is not registered.`);
        }
        // Edge from dependency to the plugin that depends on it
        adj.get(depId)!.push(id);
        inDegree.set(id, (inDegree.get(id) || 0) + 1);
      }
    }

    // Initialize the queue with plugins that have no dependencies
    const queue = pluginIds.filter((id) => inDegree.get(id) === 0);
    const sorted: string[] = [];

    while (queue.length > 0) {
      const id = queue.shift()!;
      sorted.push(id);

      for (const dependentId of adj.get(id)!) {
        inDegree.set(dependentId, (inDegree.get(dependentId) || 0) - 1);
        if (inDegree.get(dependentId) === 0) {
          queue.push(dependentId);
        }
      }
    }

    if (sorted.length !== pluginIds.length) {
      // Find the nodes that are part of the cycle
      const cycleNodes = pluginIds.filter((id) => !sorted.includes(id));
      throw new Error(
        `Circular dependency detected. Please check the dependencies of the following plugins: ${cycleNodes.join(', ')}`,
      );
    }

    return sorted;
  }
}
