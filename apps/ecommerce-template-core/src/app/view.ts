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
import { TemplateAppBindings } from './bindings';

type ViewTemplate = Template<TemplateAppBindings>;

const routeTemplates: Record<string, ViewTemplate> = {
  '/': storefrontTemplate,
  '/checkout': checkoutTemplate,
};

export class TemplateAppView {
  private readonly mountedViews: Disposable[] = [];
  private activeRouteView: Disposable | null = null;
  private stopRouteSubscription: (() => void) | null = null;

  mount(container: Element, viewModel: TemplateAppViewModel): Disposable {
    const bindings = new TemplateAppBindings(viewModel);
    const shell = appShellTemplate.mount(container, bindings);
    this.mountedViews.push(shell);

    const slot = (name: string): Element => {
      const element = container.querySelector(`[data-template-slot="${name}"]`);
      if (!element) throw new Error(`Template slot "${name}" was not found.`);
      return element;
    };

    this.mountedViews.push(headerTemplate.mount(slot('header'), bindings));
    this.mountedViews.push(cartDrawerTemplate.mount(slot('cart'), bindings));
    this.mountedViews.push(commandPaletteTemplate.mount(slot('palette'), bindings));
    this.mountedViews.push(confirmationDialogTemplate.mount(slot('confirmation'), bindings));
    this.mountedViews.push(toastTemplate.mount(slot('toast'), bindings));

    const routeSlot = slot('route');
    const renderRoute = (path: string) => {
      this.activeRouteView?.dispose();
      this.activeRouteView = null;
      routeSlot.replaceChildren();
      const template = routeTemplates[path] ?? notFoundTemplate;
      this.activeRouteView = template.mount(routeSlot, bindings);
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
