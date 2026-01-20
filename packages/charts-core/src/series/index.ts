import type { ChartDataPoint, SeriesConfig, TooltipData } from '../core/types';

export abstract class Series<T extends ChartDataPoint = ChartDataPoint> {
  protected data: T[];

  constructor(public readonly config: SeriesConfig<T>) {
    this.data = [...config.data];
  }

  render(container: HTMLElement): void {
    // override in subclasses if DOM rendering is needed
  }

  update(data: T[]): void {
    this.data = [...data];
  }

  abstract getTooltipData(point: T): TooltipData;

  destroy(): void {
    // override when cleanup is required
  }
}

export class LineSeries extends Series {
  private host?: HTMLElement;

  render(container: HTMLElement): void {
    this.host = document.createElement('div');
    this.host.className = 'charts-core-line-series';
    this.refreshLabel();
    container.appendChild(this.host);
  }

  update(data: ChartDataPoint[]): void {
    super.update(data);
    this.refreshLabel();
  }

  getTooltipData(point: ChartDataPoint): TooltipData {
    return {
      seriesId: this.config.id ?? this.config.type,
      point,
      label: this.config.color,
    };
  }

  destroy(): void {
    if (this.host && this.host.parentElement) {
      this.host.remove();
    }
  }

  private refreshLabel(): void {
    if (!this.host) {
      return;
    }
    const id = this.config.id ?? this.config.type;
    this.host.textContent = `Series ${id}: ${this.data.length} points`;
  }
}
