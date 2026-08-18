import { createTemplateOutlet, type Disposable, type Template, type TemplateOutlet } from '@web-loom/template-core';
import {
  appShellTemplate,
  dashboardTemplate,
  greenhouseListTemplate,
  notFoundTemplate,
  registerAppPartials,
  sensorListTemplate,
  sensorReadingListTemplate,
  thresholdAlertListTemplate,
} from '../templates';
import { GreenhouseAppBindings } from './bindings';
import type { GreenhouseAppViewModel } from './view-model';

type ViewTemplate = Template<GreenhouseAppBindings>;

const routeTemplates: Record<string, ViewTemplate> = {
  '/': dashboardTemplate,
  '/dashboard': dashboardTemplate,
  '/greenhouses': greenhouseListTemplate,
  '/sensors': sensorListTemplate,
  '/sensor-readings': sensorReadingListTemplate,
  '/threshold-alerts': thresholdAlertListTemplate,
};

export class GreenhouseAppView {
  private readonly mountedViews: Disposable[] = [];
  private routeOutlet: TemplateOutlet | null = null;
  private stopRouteSubscription: (() => void) | null = null;

  mount(container: Element, viewModel: GreenhouseAppViewModel): Disposable {
    registerAppPartials();
    const bindings = new GreenhouseAppBindings(viewModel);
    this.mountedViews.push(appShellTemplate.mount(container, bindings));

    const routeSlot =
      container.querySelector<HTMLElement>('[data-template-slot="route"]') ?? this.createRouteSlot(container);
    this.routeOutlet = createTemplateOutlet(routeSlot);

    const renderRoute = (path: string) => {
      const template = routeTemplates[path] ?? notFoundTemplate;
      this.routeOutlet?.show(template, bindings);
    };

    renderRoute(viewModel.route$.get());
    this.stopRouteSubscription = viewModel.route$.subscribe(renderRoute);

    return {
      dispose: () => this.dispose(),
    };
  }

  private dispose(): void {
    this.stopRouteSubscription?.();
    this.stopRouteSubscription = null;
    this.routeOutlet?.dispose();
    this.routeOutlet = null;
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
