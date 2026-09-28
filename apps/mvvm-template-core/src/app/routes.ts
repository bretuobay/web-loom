import { createRouter, type Router } from '@web-loom/router-core';
import { toRouteDefinitions, type TemplateRoute } from '@web-loom/template-core-router';
import { dashboard, greenhouseList, sensorList, sensorReadingList, thresholdAlertList } from '../templates';
import type { AppContext } from './context';

/**
 * The single source of truth for routing: which screen renders at each
 * path. Each screen fetches in its own `setup`; the router only swaps views.
 */
export const appRoutes: TemplateRoute<AppContext>[] = [
  { path: '/', name: 'home', template: dashboard },
  { path: '/dashboard', name: 'dashboard', template: dashboard },
  { path: '/greenhouses', name: 'greenhouses', template: greenhouseList },
  { path: '/sensors', name: 'sensors', template: sensorList },
  { path: '/sensor-readings', name: 'sensor-readings', template: sensorReadingList },
  { path: '/threshold-alerts', name: 'threshold-alerts', template: thresholdAlertList },
];

export function createAppRouter(): Router {
  return createRouter({
    mode: 'history',
    routes: [...toRouteDefinitions(appRoutes), { path: '/:pathMatch(.*)', name: 'not-found', matchStrategy: 'prefix' }],
  });
}
