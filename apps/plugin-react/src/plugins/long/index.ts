import type { PluginModule } from '@repo/plugin-core';
import Long from './Long';

/**
 * The plugin module for the Long plugin.
 * It doesn't need any lifecycle hooks, so it's an empty object.
 */
const longModule: PluginModule = {};

export const components = {
  Long,
};

export default longModule;
