import { z } from 'zod';

// Generic type for framework-specific components
export type TComponent = unknown;

/**
 * Defines a route to be registered by a plugin.
 * @template TComponent The type of the component to be rendered, specific to the host's framework.
 */
export interface PluginRouteDefinition<T extends TComponent = TComponent> {
  path: string;
  component: T;
  exact?: boolean;
}

/**
 * Defines a menu item to be added to the host application's UI.
 */
export interface PluginMenuItem {
  label: string;
  path: string;
  icon?: string;
}

/**
 * Defines a widget to be displayed in the host application (e.g., on a dashboard).
 * @template TComponent The type of the component to be rendered, specific to the host's framework.
 */
export interface PluginWidgetDefinition<T extends TComponent = TComponent> {
  id: string;
  title: string;
  component: T;
}

/**
 * The plugin manifest is a static, declarative JSON object that describes
 * the plugin's metadata and its contributions to the host application.
 */
export interface PluginManifest<T extends TComponent = TComponent> {
  id: string;
  name: string;
  version: string;
  entry: string;
  description?: string;
  author?: string;
  icon?: string;
  routes?: PluginRouteDefinition<T>[];
  menuItems?: PluginMenuItem[];
  widgets?: PluginWidgetDefinition<T>[];
  metadata?: Record<string, unknown>;
  dependencies?: Record<string, string>;
}

// Zod schema for runtime validation of the PluginManifest
// Note: We cannot validate the `component` types with Zod, so we accept `z.any()`.
// The host application's FrameworkAdapter will be responsible for handling the component.

const PluginRouteDefinitionSchema = z.object({
  path: z.string(),
  component: z.any(),
  exact: z.boolean().optional(),
});

const PluginMenuItemSchema = z.object({
  label: z.string(),
  path: z.string(),
  icon: z.string().optional(),
});

const PluginWidgetDefinitionSchema = z.object({
  id: z.string(),
  title: z.string(),
  component: z.any(),
});

export const PluginManifestSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  version: z.string().min(1), // Could use a regex for semantic versioning
  entry: z.string().min(1),
  description: z.string().optional(),
  author: z.string().optional(),
  icon: z.string().url().optional(),
  routes: z.array(PluginRouteDefinitionSchema).optional(),
  menuItems: z.array(PluginMenuItemSchema).optional(),
  widgets: z.array(PluginWidgetDefinitionSchema).optional(),
  metadata: z.record(z.unknown()).optional(),
  dependencies: z.record(z.string()).optional(),
});
