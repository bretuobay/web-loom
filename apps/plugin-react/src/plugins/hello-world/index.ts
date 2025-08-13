import { PluginModule } from '@repo/plugin-core';
import HelloWorld from './HelloWorld';

/**
 * The plugin module for the HelloWorld plugin.
 * It doesn't need any lifecycle hooks, so it's an empty object.
 */
const helloWorldModule: PluginModule = {};

export const components = {
  HelloWorld,
};

export default helloWorldModule;
