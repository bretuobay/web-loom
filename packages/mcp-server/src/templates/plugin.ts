export interface PluginRouteParam {
  path: string;
  componentName: string;
}

export interface PluginMenuItemParam {
  id: string;
  label: string;
  icon?: string;
  path?: string;
}

export interface PluginTemplateParams {
  name: string;
  id: string;
  displayName?: string;
  routes?: PluginRouteParam[];
  menuItems?: PluginMenuItemParam[];
}

export function pluginTemplate(p: PluginTemplateParams): string {
  const {
    name,
    id,
    displayName = name,
    routes = [],
    menuItems = [],
  } = p;

  const routeDefs = routes.length
    ? routes
        .map(
          (r) =>
            `    { path: "${r.path}", component: () => import("./${r.componentName}.js") },`
        )
        .join("\n")
    : "    // No routes defined";

  const menuDefs = menuItems.length
    ? menuItems
        .map(
          (m) =>
            `    { id: "${m.id}", label: "${m.label}"${m.icon ? `, icon: "${m.icon}"` : ""}${m.path ? `, path: "${m.path}"` : ""} },`
        )
        .join("\n")
    : "    // No menu items defined";

  return `import type { PluginManifest, PluginModule, PluginSDK } from "@web-loom/plugin-core";

export const ${name}Manifest: PluginManifest = {
  id: "${id}",
  name: "${displayName}",
  version: "1.0.0",
  entry: "@/plugins/${name}/index.js",
  routes: [
${routeDefs}
  ],
  menuItems: [
${menuDefs}
  ],
  widgets: [],
  dependencies: [],
};

export const ${name}Module: PluginModule = {
  async init(_sdk: PluginSDK): Promise<void> {
    // Register services, event listeners, etc.
  },

  async mount(_sdk: PluginSDK): Promise<void> {
    // Mount plugin UI components
  },

  async unmount(): Promise<void> {
    // Cleanup: unsubscribe, remove DOM nodes, etc.
  },
};
`;
}
