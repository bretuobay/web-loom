import type { TooltipConfig, TooltipData } from '../core/types';

export interface TooltipPosition {
  x: number;
  y: number;
}

export class TooltipManager {
  private tooltipElement?: HTMLElement;
  private container?: HTMLElement;

  constructor(private config?: TooltipConfig) {}

  attach(container: HTMLElement): void {
    if (this.tooltipElement) {
      return;
    }

    this.container = container;
    const tooltip = document.createElement('div');
    tooltip.className = 'charts-core-tooltip';
    tooltip.style.position = 'absolute';
    tooltip.style.pointerEvents = 'none';
    tooltip.style.display = 'none';
    tooltip.style.zIndex = '99';
    tooltip.style.padding = '0.25rem 0.5rem';
    tooltip.style.background = 'rgba(0,0,0,0.8)';
    tooltip.style.color = 'white';
    tooltip.style.borderRadius = '4px';
    container.appendChild(tooltip);
    this.tooltipElement = tooltip;
  }

  show(data: TooltipData, position?: TooltipPosition): void {
    if (!this.tooltipElement || this.config?.enabled === false) {
      return;
    }

    this.tooltipElement.textContent = this.config?.format?.(data) ?? `${data.seriesId}: ${data.point.y}`;
    if (this.config?.strategy === 'follow' && position) {
      this.tooltipElement.style.left = `${position.x + 6}px`;
      this.tooltipElement.style.top = `${position.y + 6}px`;
      this.tooltipElement.style.transform = 'translate(0, 0)';
    } else {
      this.tooltipElement.style.left = '1rem';
      this.tooltipElement.style.top = '1rem';
      this.tooltipElement.style.transform = 'translate(0, 0)';
    }

    this.tooltipElement.style.display = 'block';
  }

  hide(): void {
    if (!this.tooltipElement) {
      return;
    }

    this.tooltipElement.style.display = 'none';
  }
}
