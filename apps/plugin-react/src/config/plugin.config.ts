import type { PluginManifest, PluginModule } from '@repo/plugin-core';
import Dashboard from '../components/Dashboard';
import { GreenhouseList } from '../components/GreenhouseList';
import { SensorList } from '../components/SensorList';
import { SensorReadingList } from '../components/SensorReadingList';
import { ThresholdAlertList } from '../components/ThresholdAlertList';
import dashboardModule from '../plugins/dashboard';
import greenhouseModule, { GreenhouseWidget } from '../plugins/greenhouse';
import sensorModule, { SensorWidget } from '../plugins/sensor';
import sensorReadingModule, { SensorReadingWidget } from '../plugins/sensor-reading';
import thresholdAlertModule, { ThresholdAlertWidget } from '../plugins/threshold-alert';
import navigationModule from '../plugins/navigation';
import type { ReactPluginComponent } from '../types';

const dashboardManifest: PluginManifest<ReactPluginComponent> = {
  id: 'dashboard-plugin',
  name: 'Dashboard Plugin',
  version: '1.0.0',
  entry: '../plugins/dashboard/index.ts',
  description: 'Dashboard overview for greenhouse monitoring',
  routes: [
    {
      path: '/',
      component: Dashboard,
      exact: true,
    },
    {
      path: '/dashboard',
      component: Dashboard,
      exact: true,
    },
  ],
};

const greenhouseManifest: PluginManifest<ReactPluginComponent> = {
  id: 'greenhouse-plugin',
  name: 'Greenhouse Plugin',
  version: '1.0.0',
  entry: '../plugins/greenhouse/index.tsx',
  description: 'Greenhouse list and summary widget',
  routes: [
    {
      path: '/greenhouses',
      component: GreenhouseList,
    },
  ],
  widgets: [
    {
      id: 'greenhouse-card-widget',
      title: 'Greenhouses',
      component: GreenhouseWidget,
    },
  ],
};

const sensorManifest: PluginManifest<ReactPluginComponent> = {
  id: 'sensor-plugin',
  name: 'Sensor Plugin',
  version: '1.0.0',
  entry: '../plugins/sensor/index.tsx',
  description: 'Sensor list and summary widget',
  routes: [
    {
      path: '/sensors',
      component: SensorList,
    },
  ],
  widgets: [
    {
      id: 'sensor-card-widget',
      title: 'Sensors',
      component: SensorWidget,
    },
  ],
};

const thresholdAlertManifest: PluginManifest<ReactPluginComponent> = {
  id: 'threshold-alert-plugin',
  name: 'Threshold Alert Plugin',
  version: '1.0.0',
  entry: '../plugins/threshold-alert/index.tsx',
  description: 'Threshold alert list and summary widget',
  routes: [
    {
      path: '/threshold-alerts',
      component: ThresholdAlertList,
    },
  ],
  widgets: [
    {
      id: 'threshold-alert-card-widget',
      title: 'Alerts',
      component: ThresholdAlertWidget,
    },
  ],
};

const sensorReadingManifest: PluginManifest<ReactPluginComponent> = {
  id: 'sensor-reading-plugin',
  name: 'Sensor Reading Plugin',
  version: '1.0.0',
  entry: '../plugins/sensor-reading/index.tsx',
  description: 'Sensor readings list and quick chart',
  routes: [
    {
      path: '/sensor-readings',
      component: SensorReadingList,
    },
  ],
  widgets: [
    {
      id: 'sensor-reading-card-widget',
      title: 'Sensor Readings',
      component: SensorReadingWidget,
    },
  ],
};

const navigationManifest: PluginManifest<ReactPluginComponent> = {
  id: 'navigation-plugin',
  name: 'Navigation Plugin',
  version: '1.0.0',
  entry: '../plugins/navigation/index.ts',
  description: 'Navigation menu provider for plugin routes',
  menuItems: [
    {
      label: 'Dashboard',
      path: '/dashboard',
      icon: 'dashboard',
    },
    {
      label: 'Greenhouses',
      path: '/greenhouses',
      icon: 'greenhouse',
    },
    {
      label: 'Sensors',
      path: '/sensors',
      icon: 'sensor',
    },
    {
      label: 'Sensor Readings',
      path: '/sensor-readings',
      icon: 'reading',
    },
    {
      label: 'Threshold Alerts',
      path: '/threshold-alerts',
      icon: 'alert',
    },
  ],
};

export const pluginManifests: PluginManifest<ReactPluginComponent>[] = [
  dashboardManifest,
  greenhouseManifest,
  sensorManifest,
  thresholdAlertManifest,
  sensorReadingManifest,
  navigationManifest,
];

export const pluginModules: Record<string, PluginModule> = {
  [dashboardManifest.id]: dashboardModule,
  [greenhouseManifest.id]: greenhouseModule,
  [sensorManifest.id]: sensorModule,
  [sensorReadingManifest.id]: sensorReadingModule,
  [thresholdAlertManifest.id]: thresholdAlertModule,
  [navigationManifest.id]: navigationModule,
};
