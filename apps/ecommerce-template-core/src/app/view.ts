import { createTemplateOutlet, type Disposable, type Template, type TemplateOutlet } from '@web-loom/template-core';
import { appShellTemplate, checkoutTemplate, notFoundTemplate, storefrontTemplate } from '../templates';
import type { TemplateAppViewModel } from '../TemplateAppViewModel';
import { TemplateAppBindings } from './bindings';

type ViewTemplate = Template<TemplateAppBindings>;

const routeTemplates: Record<string, ViewTemplate> = {
  '/': storefrontTemplate,
  '/checkout': checkoutTemplate,
};

export class TemplateAppView {
  private readonly mountedViews: Disposable[] = [];
  private routeOutlet: TemplateOutlet | null = null;
  private stopRouteSubscription: (() => void) | null = null;
  private hydratedRouteView: Disposable | null = null;

  mount(container: Element, viewModel: TemplateAppViewModel, routeContainer?: Element): Disposable {
    const bindings = new TemplateAppBindings(viewModel);
    this.mountedViews.push(appShellTemplate.mount(container, bindings));

    const routeSlot =
      routeContainer ??
      container.querySelector<HTMLElement>('[data-template-slot="route"]') ??
      this.createRouteSlot(container);
    this.routeOutlet = createTemplateOutlet(routeSlot);
    let initialHydrationAvailable = routeSlot.childNodes.length > 0;
    const renderRoute = (path: string) => {
      this.hydratedRouteView?.dispose();
      this.hydratedRouteView = null;
      if (path === '/' && initialHydrationAvailable) {
        initialHydrationAvailable = false;
        this.hydratedRouteView = storefrontTemplate.hydrate(routeSlot, bindings);
        return;
      }
      const template = routeTemplates[path] ?? notFoundTemplate;
      this.routeOutlet?.show(template, bindings);
    };

    renderRoute(viewModel.state.route$.get());
    this.stopRouteSubscription = viewModel.state.route$.subscribe(renderRoute);

    return {
      dispose: () => this.dispose(),
    };
  }

  private dispose(): void {
    this.stopRouteSubscription?.();
    this.stopRouteSubscription = null;
    this.routeOutlet?.dispose();
    this.routeOutlet = null;
    this.hydratedRouteView?.dispose();
    this.hydratedRouteView = null;
    this.mountedViews
      .splice(0)
      .reverse()
      .forEach((view) => view.dispose());
  }

  private createRouteSlot(container: Element): HTMLElement {
    const routeSlot = document.createElement('main');
    routeSlot.dataset.templateSlot = 'route';
    container.append(routeSlot);
    return routeSlot;
  }
}
