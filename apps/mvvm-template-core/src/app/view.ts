import type { Disposable } from '@web-loom/template-core';
import { createRouterView } from '@web-loom/template-core-router';
import type { Router } from '@web-loom/router-core';
import { appShellTemplate, notFoundTemplate, registerAppPartials } from '../templates';
import { createAppContext } from './context';
import { appRoutes } from './routes';

/**
 * Mounts the app shell and binds the route outlet to the router. All route
 * rendering, data loading, and link handling is driven by `appRoutes` and the
 * composed context — there is no per-route wiring here.
 */
export function mountGreenhouseApp(container: Element, router: Router): Disposable {
  registerAppPartials();
  const context = createAppContext(router);
  const shell = appShellTemplate.mount(container, context);

  const outletEl = container.querySelector('[data-template-slot="route"]');
  if (!outletEl) {
    shell.dispose();
    throw new Error('The app shell template did not render a [data-template-slot="route"] element.');
  }

  const routerView = createRouterView(outletEl, {
    router,
    routes: appRoutes,
    notFound: notFoundTemplate,
    context,
  });

  return {
    dispose: () => {
      routerView.dispose();
      shell.dispose();
    },
  };
}
