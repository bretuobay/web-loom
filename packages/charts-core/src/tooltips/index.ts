import type { TooltipConfig, TooltipData } from '../core/types';

export class TooltipManager {
  private tooltipElement?: HTMLElement;

  constructor(private config?: TooltipConfig) {}

  attach(container: HTMLElement): void {
    if (this.tooltipElement) {
      return;
    }

    const tooltip = document.createElement('div');
    tooltip.className = 'charts-core-tooltip';
    tooltip.style.position = 'absolute';
    tooltip.style.pointerEvents = 'none';
    tooltip.style.display = 'none';
    tooltip.style.zIndex = '2';
    container.appendChild(tooltip);
    this.tooltipElement = tooltip;
  }

  show(data: TooltipData): void {
    if (!this.tooltipElement || this.config?.enabled === false) {
      return;
    }

    this.tooltipElement.textContent = this.config?.format?.(data) ?? `${data.seriesId}: ${data.point.y}`;
    this.tooltipElement.style.display = 'block';
  }

  hide(): void {
    if (!this.tooltipElement) {
      return;
    }

    this.tooltipElement.style.display = 'none';
  }
}
