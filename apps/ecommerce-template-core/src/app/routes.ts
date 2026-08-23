import { createRouter, type Router } from '@web-loom/router-core';
import { toRouteDefinitions, type TemplateRoute } from '@web-loom/template-core-router';
import { checkout, storefront } from '../templates';
import type { AppContext } from './context';

/**
 * The single route manifest: URL, route name, and screen component together.
 * Neither screen needs a route-entry fetch — catalog and cart are activated
 * once on app start (`TemplateAppViewModel.start()`), not re-fetched per
 * navigation.
 */
export const appRoutes: TemplateRoute<AppContext>[] = [
  { path: '/', name: 'storefront', template: storefront },
  { path: '/checkout', name: 'checkout', template: checkout },
];

export function createAppRouter(): Router {
  return createRouter({
    mode: 'history',
    routes: [...toRouteDefinitions(appRoutes), { path: '/:pathMatch(.*)', name: 'not-found', matchStrategy: 'prefix' }],
  });
}
