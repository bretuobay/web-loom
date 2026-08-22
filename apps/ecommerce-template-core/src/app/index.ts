import type { Disposable, ElementAction } from '@web-loom/template-core';
import { createLinkAction, createRouterView } from '@web-loom/template-core-router';
import type { Router } from '@web-loom/router-core';
import { createEcommerceApi } from '../infrastructure/api/create-ecommerce-api';
import { CatalogModel } from '../features/catalog/CatalogModel';
import { CartModel } from '../features/cart/CartModel';
import { TemplateAppViewModel } from '../TemplateAppViewModel';
import type { CatalogProductDto } from '../infrastructure/api/ports/ecommerce-api-port';
import { appShellTemplate, notFoundTemplate } from '../templates';
import { createAppContext } from './context';
import { appRoutes, createAppRouter } from './routes';

export interface App {
  mount(container: Element, routeContainer?: Element): Promise<void>;
  unmount(): void;
}

export interface CreateAppOptions {
  /** Products the server already rendered — seeds the catalog and skips an initial fetch. */
  initialProducts?: CatalogProductDto[];
}

interface MountedApp {
  viewModel: TemplateAppViewModel;
  shell: Disposable;
  routerView: Disposable;
  links: ElementAction;
  router: Router;
}

/**
 * Creates the browser application and owns its complete mount lifecycle.
 * Runtime resources (models, router, shell, route view, link delegation) are
 * created on mount and released in reverse order by unmount, keeping the Vite
 * entrypoint free of application wiring details.
 */
export function createApp(options: CreateAppOptions = {}): App {
  let mounted: MountedApp | null = null;

  return {
    async mount(container, routeContainer): Promise<void> {
      if (mounted) throw new Error('The application is already mounted.');

      let router: Router | null = null;
      let viewModel: TemplateAppViewModel | null = null;
      let shell: Disposable | null = null;
      let routerView: Disposable | null = null;
      let links: ElementAction | null = null;

      try {
        router = createAppRouter();
        const api = createEcommerceApi();
        viewModel = new TemplateAppViewModel(
          new CatalogModel(api, options.initialProducts),
          new CartModel(api),
          router,
        );
        const context = createAppContext(viewModel);

        shell = appShellTemplate.mount(container, context);

        const outlet =
          routeContainer ?? container.querySelector('[data-template-slot="route"]') ?? createRouteSlot(container);

        // The route outlet may already hold SSR-rendered markup (the storefront
        // island): hydrate it on the first render instead of mounting fresh.
        routerView = createRouterView(outlet, {
          router,
          routes: appRoutes,
          notFound: notFoundTemplate,
          context,
          hydrate: true,
        });

        // Delegated on the whole document, not just `container`: the route
        // outlet can be a sibling of `container` (the SSR storefront island),
        // so anchors it contains would otherwise be outside a container-scoped
        // listener's reach.
        links = createLinkAction(router)(document.documentElement);

        await viewModel.start();

        mounted = { viewModel, shell, routerView, links, router };
      } catch (error) {
        routerView?.dispose();
        links?.dispose?.();
        shell?.dispose();
        viewModel?.dispose();
        router?.destroy();
        throw error;
      }
    },

    unmount(): void {
      if (!mounted) return;

      const resources = mounted;
      mounted = null;
      resources.routerView.dispose();
      resources.links.dispose?.();
      resources.shell.dispose();
      resources.viewModel.dispose();
      resources.router.destroy();
    },
  };
}

function createRouteSlot(container: Element): HTMLElement {
  const routeSlot = document.createElement('main');
  routeSlot.dataset.templateSlot = 'route';
  container.append(routeSlot);
  return routeSlot;
}
