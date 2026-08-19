import type { Disposable } from '@web-loom/template-core';
import { createRouterView } from '@web-loom/template-core-router';
import type { Router } from '@web-loom/router-core';
import { appShellTemplate, notFoundTemplate, registerAppPartials } from '../templates';
import { createAppContext } from './context';
import { createAppRouter, appRoutes } from './routes';

export interface App {
  mount(container: Element): void;
  unmount(): void;
}

interface MountedApp {
  routerView: Disposable;
  shell: Disposable;
  unregisterPartials: () => void;
  router: Router;
}

/**
 * Creates the browser application and owns its complete mount lifecycle.
 * Runtime resources are created on mount and released in reverse order by
 * unmount, keeping the Vite entrypoint free of application wiring details.
 */
export function createApp(): App {
  let mounted: MountedApp | null = null;

  return {
    mount(container): void {
      if (mounted) throw new Error('The application is already mounted.');

      let unregisterPartials: (() => void) | null = null;
      let router: Router | null = null;
      let shell: Disposable | null = null;
      let routerView: Disposable | null = null;

      try {
        unregisterPartials = registerAppPartials();
        router = createAppRouter();
        const context = createAppContext(router);
        shell = appShellTemplate.mount(container, context);

        const outlet = container.querySelector('[data-template-slot="route"]');
        if (!outlet) {
          throw new Error('The app shell template did not render a [data-template-slot="route"] element.');
        }

        routerView = createRouterView(outlet, {
          router,
          routes: appRoutes,
          notFound: notFoundTemplate,
          context,
        });

        mounted = {
          routerView,
          shell,
          unregisterPartials,
          router,
        };
      } catch (error) {
        routerView?.dispose();
        shell?.dispose();
        unregisterPartials?.();
        router?.destroy();
        throw error;
      }
    },

    unmount(): void {
      if (!mounted) return;

      const resources = mounted;
      mounted = null;
      resources.routerView.dispose();
      resources.shell.dispose();
      resources.unregisterPartials();
      resources.router.destroy();
    },
  };
}
