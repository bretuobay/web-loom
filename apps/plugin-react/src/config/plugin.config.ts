import type { PluginManifest } from '@repo/plugin-core';
import type { ReactPluginComponent } from '../types';

/**
 * A collection of all plugin manifests.
 * In a real-world application, this could be loaded dynamically.
 */
import { components as helloWorldComponents } from '../plugins/hello-world';

import { components as chartComponents } from '../plugins/chart';

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
    entry: '../plugins/chart/index.ts',
    widgets: [
      {
        id: 'chart-widget',
        title: 'Chart',
        component: chartComponents.Chart,
      },
    ],
  },
];
