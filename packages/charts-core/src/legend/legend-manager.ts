import type { SeriesConfig } from '../core/types';

export interface LegendConfig {
  enabled: boolean;
  position: 'top' | 'bottom' | 'left' | 'right' | 'floating';
  align: 'start' | 'center' | 'end';
  layout: 'horizontal' | 'vertical';
  interactive: boolean;
  maxWidth?: number;
  maxHeight?: number;
}

export interface LegendItem {
  seriesId: string;
  label: string;
  color: string;
  visible: boolean;
  marker: 'line' | 'circle' | 'square';
}

export class LegendManager {
  private container?: HTMLElement;
  private items: LegendItem[] = [];
  private listeners: Map<string, EventListener> = new Map();

  constructor(
    private config: LegendConfig,
    private onToggle: (seriesId: string, visible: boolean) => void,
    private onHover: (seriesId: string | null) => void
  ) {}

  render(parentContainer: HTMLElement, series: SeriesConfig[]): void {
    this.items = series.map((s) => ({
      seriesId: s.id ?? s.type,
      label: s.id ?? s.type,
      color: s.color ?? '#000',
      visible: true,
      marker: 'line',
    }));

    this.container = this.createLegendContainer();
    this.items.forEach((item) => {
      const itemElement = this.createLegendItem(item);
      this.container!.appendChild(itemElement);
    });

    parentContainer.appendChild(this.container);
  }

  private createLegendContainer(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'chart-legend';
    container.style.cssText = `
      display: flex;
      flex-direction: ${this.config.layout === 'horizontal' ? 'row' : 'column'};
      gap: 8px;
      padding: 12px;
      ${this.config.maxWidth ? `max-width: ${this.config.maxWidth}px;` : ''}
      ${this.config.maxHeight ? `max-height: ${this.config.maxHeight}px;` : ''}
      overflow: auto;
    `;
    return container;
  }

  private createLegendItem(item: LegendItem): HTMLElement {
    const element = document.createElement('div');
    element.className = 'chart-legend-item';
    element.dataset.seriesId = item.seriesId;
    element.style.cssText = `
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 12px;
      cursor: ${this.config.interactive ? 'pointer' : 'default'};
      opacity: ${item.visible ? 1 : 0.5};
      transition: opacity 300ms ease;
    `;

    const marker = this.createMarker(item.color, item.marker);
    const label = document.createElement('span');
    label.textContent = item.label;
    label.style.cssText = `
      font-size: 13px;
      font-family: Inter, system-ui, sans-serif;
      color: #374151;
      text-decoration: ${item.visible ? 'none' : 'line-through'};
    `;

    element.appendChild(marker);
    element.appendChild(label);

    if (this.config.interactive) {
      // Add event listeners
      element.addEventListener('click', () => {
        item.visible = !item.visible;
        this.onToggle(item.seriesId, item.visible);
        this.updateItemVisual(element, item);
      });

      element.addEventListener('mouseenter', () => {
        this.onHover(item.seriesId);
      });

      element.addEventListener('mouseleave', () => {
        this.onHover(null);
      });
    }

    return element;
  }

  private createMarker(color: string, type: 'line' | 'circle' | 'square'): HTMLElement {
    const marker = document.createElement('div');
    marker.style.cssText = `
      width: ${type === 'line' ? '20px' : '12px'};
      height: ${type === 'line' ? '2px' : '12px'};
      background: ${color};
      border-radius: ${type === 'circle' ? '50%' : '0'};
    `;
    return marker;
  }

  private updateItemVisual(element: HTMLElement, item: LegendItem): void {
    element.style.opacity = item.visible ? '1' : '0.5';
    const label = element.querySelector('span');
    if (label) {
      label.style.textDecoration = item.visible ? 'none' : 'line-through';
    }
  }

  destroy(): void {
    this.container?.remove();
    this.listeners.clear();
  }
}
