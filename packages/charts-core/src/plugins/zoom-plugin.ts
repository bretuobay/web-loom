import type { ChartPlugin } from '../core/chart';
import type { ChartManager } from '../core/chart';

export interface ZoomPanPluginOptions {
  zoomStep?: number;
}

export class ZoomPanPlugin implements ChartPlugin {
  public readonly id = 'charts-core:zoom-pan';
  private wheelHandler?: (event: WheelEvent) => void;

  constructor(private options: ZoomPanPluginOptions = {}) {}

  install(chart: ChartManager): void {
    const container = chart.getContainer();
    if (!container) {
      return;
    }

    this.wheelHandler = (event: WheelEvent) => {
      event.preventDefault();
      const delta = event.deltaY > 0 ? (this.options.zoomStep ?? 1.1) : 1 / (this.options.zoomStep ?? 1.1);
      container.style.transform = `scale(${delta})`;
    };

    container.addEventListener('wheel', this.wheelHandler, { passive: false });
  }

  uninstall(chart: ChartManager): void {
    if (this.wheelHandler && chart['container']) {
      chart['container'].removeEventListener('wheel', this.wheelHandler);
    }

    this.wheelHandler = undefined;
  }
}
