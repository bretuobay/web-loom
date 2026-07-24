import type { Disposable, Template } from '@web-loom/template-core';
import {
  appShellTemplate,
  cartDrawerTemplate,
  checkoutTemplate,
  commandPaletteTemplate,
  confirmationDialogTemplate,
  headerTemplate,
  notFoundTemplate,
  storefrontTemplate,
  toastTemplate,
} from '../templates';
import type { TemplateAppViewModel } from '../TemplateAppViewModel';

type ViewTemplate = Template<TemplateAppViewModel>;

const routeTemplates: Record<string, ViewTemplate> = {
  '/': storefrontTemplate,
  '/checkout': checkoutTemplate,
};

export class TemplateAppView {
  private readonly mountedViews: Disposable[] = [];
  private activeRouteView: Disposable | null = null;
  private stopRouteSubscription: (() => void) | null = null;

  mount(container: Element, viewModel: TemplateAppViewModel): Disposable {
    const shell = appShellTemplate.mount(container, viewModel);
    this.mountedViews.push(shell);

    const slot = (name: string): Element => {
      const element = container.querySelector(`[data-template-slot="${name}"]`);
      if (!element) throw new Error(`Template slot "${name}" was not found.`);
      return element;
    };

    this.mountedViews.push(headerTemplate.mount(slot('header'), viewModel));
    this.mountedViews.push(cartDrawerTemplate.mount(slot('cart'), viewModel));
    this.mountedViews.push(commandPaletteTemplate.mount(slot('palette'), viewModel));
    this.mountedViews.push(confirmationDialogTemplate.mount(slot('confirmation'), viewModel));
    this.mountedViews.push(toastTemplate.mount(slot('toast'), viewModel));

    const routeSlot = slot('route');
    const renderRoute = (path: string) => {
      this.activeRouteView?.dispose();
      this.activeRouteView = null;
      routeSlot.replaceChildren();
      const template = routeTemplates[path] ?? notFoundTemplate;
      this.activeRouteView = template.mount(routeSlot, viewModel);
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
    this.activeRouteView?.dispose();
    this.activeRouteView = null;
    this.mountedViews.splice(0).reverse().forEach((view) => view.dispose());
  }
}
