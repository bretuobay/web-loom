import { createRouter, type Router } from '@web-loom/router-core';
import { toRouteDefinitions, type TemplateRoute } from '@web-loom/template-core-router';
import { greenHouseViewModel } from '@repo/view-models/GreenHouseViewModel';
import { sensorViewModel } from '@repo/view-models/SensorViewModel';
import { sensorReadingViewModel } from '@repo/view-models/SensorReadingViewModel';
import { thresholdAlertViewModel } from '@repo/view-models/ThresholdAlertViewModel';
import {
  dashboardTemplate,
  greenhouseListTemplate,
  sensorListTemplate,
  sensorReadingListTemplate,
  thresholdAlertListTemplate,
} from '../templates';
import type { AppContext } from './context';

async function loadDashboard(): Promise<void> {
  await Promise.all([
    greenHouseViewModel.fetchCommand.execute(),
    sensorViewModel.fetchCommand.execute(),
    sensorReadingViewModel.fetchCommand.execute(),
    thresholdAlertViewModel.fetchCommand.execute(),
  ]);
}

/**
 * The single source of truth for routing: which template renders at each
 * path and which ViewModels it needs fetched on entry. The router itself is
 * derived from this table, so paths cannot drift between router, view, and
 * data loading.
 */
export const appRoutes: TemplateRoute<AppContext>[] = [
  { path: '/', name: 'home', template: dashboardTemplate, load: loadDashboard },
  { path: '/dashboard', name: 'dashboard', template: dashboardTemplate, load: loadDashboard },
  {
    path: '/greenhouses',
    name: 'greenhouses',
    template: greenhouseListTemplate,
    load: () => greenHouseViewModel.fetchCommand.execute(),
  },
  {
    path: '/sensors',
    name: 'sensors',
    template: sensorListTemplate,
    load: () => sensorViewModel.fetchCommand.execute(),
  },
  {
    path: '/sensor-readings',
    name: 'sensor-readings',
    template: sensorReadingListTemplate,
    load: () => sensorReadingViewModel.fetchCommand.execute(),
  },
  {
    path: '/threshold-alerts',
    name: 'threshold-alerts',
    template: thresholdAlertListTemplate,
    load: () => thresholdAlertViewModel.fetchCommand.execute(),
  },
];

export function createAppRouter(): Router {
  return createRouter({
    mode: 'history',
    routes: [...toRouteDefinitions(appRoutes), { path: '/:pathMatch(.*)', name: 'not-found', matchStrategy: 'prefix' }],
  });
}
