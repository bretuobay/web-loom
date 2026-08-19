import { createRouter, type Router } from '@web-loom/router-core';
import { toRouteDefinitions, type TemplateRoute } from '@web-loom/template-core-router';
import { checkoutTemplate, storefrontTemplate } from '../templates';
import type { AppContext } from './context';

/**
 * The single route manifest: URL, route name, and screen template together.
 * Neither screen needs a route-entry data load — catalog and cart are
 * activated once on app start (`TemplateAppViewModel.start()`), not re-fetched
 * per navigation.
 */
export const appRoutes: TemplateRoute<AppContext>[] = [
  { path: '/', name: 'storefront', template: storefrontTemplate },
  { path: '/checkout', name: 'checkout', template: checkoutTemplate },
];

export function createAppRouter(): Router {
  return createRouter({
    mode: 'history',
    routes: [
      ...toRouteDefinitions(appRoutes),
      { path: '/:pathMatch(.*)', name: 'not-found', matchStrategy: 'prefix' },
    ],
  });
}
