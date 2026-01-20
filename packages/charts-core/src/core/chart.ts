import type { AxisConfig, AnnotationConfig, ChartConfig, ChartDataPoint, SeriesConfig } from './types';
import { ScaleRegistry, ChartScale } from '../scales';
import { AxisRenderer } from '../axes';
import { AnnotationLayer } from '../annotations';
import { LineSeries, Series } from '../series';
import { TooltipManager } from '../tooltips';

export class ChartManager {
  private container: HTMLElement | null = null;
  private svg?: SVGSVGElement;
  private readonly scales = new ScaleRegistry();
  private readonly axisRenderer = new AxisRenderer();
  private readonly annotationLayer = new AnnotationLayer();
  private readonly tooltipManager: TooltipManager;
  private readonly series: Series[] = [];
  private readonly plugins = new Map<string, ChartPlugin>();

  constructor(public readonly config: ChartConfig) {
    this.tooltipManager = new TooltipManager(config.tooltip);
  }

  addScale(id: string, scale: ChartScale): void {
    this.scales.register(id, scale);
  }

  addSeries(seriesConfig: SeriesConfig): void {
    const chartSeries = this.createSeries(seriesConfig);
    this.series.push(chartSeries);

    if (this.container) {
      chartSeries.render(this.container);
    }
  }

  addAxis(axis: AxisConfig): void {
    this.axisRenderer.add(axis);
  }

  addAnnotation(annotation: AnnotationConfig): void {
    this.annotationLayer.add(annotation);
  }

  use(plugin: ChartPlugin): void {
    if (this.plugins.has(plugin.id)) {
      return;
    }

    this.plugins.set(plugin.id, plugin);

    if (this.container) {
      plugin.install(this);
    }
  }

  render(selector: string): void {
    this.container = document.querySelector(selector) as HTMLElement | null;
    if (!this.container) {
      throw new Error(`Unable to find chart container: ${selector}`);
    }

    this.container.innerHTML = '';
    this.container.style.position = this.container.style.position || 'relative';

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', `${this.config.width}`);
    svg.setAttribute('height', `${this.config.height}`);
    this.svg = svg;
    this.container.appendChild(svg);

    this.tooltipManager.attach(this.container);

    this.series.forEach((series) => series.render(this.container!));
    this.axisRenderer.render(this.container);
    this.annotationLayer.render(this.container);

    this.plugins.forEach((plugin) => plugin.install(this));
  }

  update(data: ChartDataPoint[]): void {
    this.series.forEach((series) => series.update(data));
    this.tooltipManager.hide();
  }

  destroy(): void {
    this.series.forEach((series) => series.destroy());
    this.scales.clear();
    this.axisRenderer.clear();
    this.annotationLayer.clear();
    this.plugins.forEach((plugin) => plugin.uninstall(this));
    this.plugins.clear();

    if (this.container) {
      this.container.innerHTML = '';
    }

    this.container = null;
    this.svg = undefined;
  }

  getScale(id: string): ChartScale | undefined {
    return this.scales.get(id);
  }

  getTooltipManager(): TooltipManager {
    return this.tooltipManager;
  }

  private createSeries(seriesConfig: SeriesConfig): Series {
    if (seriesConfig.type === 'line') {
      return new LineSeries(seriesConfig);
    }

    return new LineSeries({
      ...seriesConfig,
      type: 'line',
    });
  }
}

export interface ChartPlugin {
  id: string;
  install(chart: ChartManager): void;
  uninstall(chart: ChartManager): void;
}
