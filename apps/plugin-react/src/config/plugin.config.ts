import type { PluginManifest } from '@repo/plugin-core';
import type { ReactPluginComponent } from '../types';

/**
 * A collection of all plugin manifests.
 * In a real-world application, this could be loaded dynamically.
 */
import { components as helloWorldComponents } from '../plugins/hello-world';

// import { components as chartComponents } from '../plugins/chart';

import { components as longComponents } from '../plugins/long';

export const pluginManifests: PluginManifest<ReactPluginComponent>[] = [
  {
    id: 'hello-world-plugin',
    name: 'Hello World Plugin',
    version: '1.0.0',
    entry: '../plugins/hello-world/index.ts',
    widgets: [
      {
        id: 'hello-world-widget',
        title: 'Hello World',
        component: helloWorldComponents.HelloWorld,
      },
    ],
  },
  {
    id: 'chart-plugin',
    name: 'Chart Plugin',
    version: '1.0.0',
    // entry: '../plugins/chart/index.ts',
    entry: '../plugins/long/index.ts',
    widgets: [
      {
        id: 'chart-widget',
        title: 'Chart',
        component: longComponents.Long,
      },
    ],
  },
  {
    id: 'long-plugin',
    name: 'Long Plugin',
    version: '1.0.0',
    entry: '../plugins/long/index.ts',
    widgets: [
      {
        id: 'long-widget',
        title: 'Long Content',
        component: longComponents.Long,
      },
    ],
  },
  // filter to remove chart for now
];
// .filter((plugin) => plugin.id !== 'chart-plugin');
