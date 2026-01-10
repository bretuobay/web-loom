import type { PluginSDK } from '@repo/plugin-core';

export const registerManifestContributions = (sdk: PluginSDK) => {
  sdk.plugin.manifest.routes?.forEach((route) => sdk.routes.add(route));
  sdk.plugin.manifest.widgets?.forEach((widget) => sdk.widgets.add(widget));
  sdk.plugin.manifest.menuItems?.forEach((item) => sdk.menus.addItem(item));
};

export const unregisterManifestContributions = (sdk: PluginSDK) => {
  sdk.plugin.manifest.routes?.forEach((route) => sdk.routes.remove(route.path));
  sdk.plugin.manifest.widgets?.forEach((widget) => sdk.widgets.remove(widget.id));
  sdk.plugin.manifest.menuItems?.forEach((item) => sdk.menus.removeItem(item.label));
};
