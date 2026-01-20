import type { ChartDataPoint, SeriesConfig, TooltipData } from '../core/types';
import type { TooltipPosition } from '../tooltips';

export interface SeriesTooltipPayload {
  data: TooltipData;
  position?: TooltipPosition;
}

export type SeriesTooltipHandler = (payload: SeriesTooltipPayload | null) => void;

export abstract class Series<T extends ChartDataPoint = ChartDataPoint> {
  protected data: T[];

  constructor(
    public readonly config: SeriesConfig<T>,
    protected readonly hoverCallback?: SeriesTooltipHandler,
  ) {
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
  private pointerMove?: (event: PointerEvent) => void;
  private pointerLeave?: () => void;
  private containerReference?: HTMLElement;

  render(container: HTMLElement): void {
    this.containerReference = container;
    this.host = document.createElement('div');
    this.host.className = 'charts-core-line-series';
    this.refreshLabel();
    container.appendChild(this.host);
    this.attachPointerHandlers(container);
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

    if (this.containerReference) {
      if (this.pointerMove) {
        this.containerReference.removeEventListener('pointermove', this.pointerMove);
      }
      if (this.pointerLeave) {
        this.containerReference.removeEventListener('pointerleave', this.pointerLeave);
      }
    }
  }

  private refreshLabel(): void {
    if (!this.host) {
      return;
    }
    const id = this.config.id ?? this.config.type;
    this.host.textContent = `Series ${id}: ${this.data.length} points`;
  }

  private attachPointerHandlers(container: HTMLElement): void {
    this.pointerMove = (event: PointerEvent) => {
      const point = this.data[this.data.length - 1];
      if (!point) {
        return;
      }

      const rect = container.getBoundingClientRect();
      this.triggerTooltip(point, { x: event.clientX - rect.left, y: event.clientY - rect.top });
    };

    this.pointerLeave = () => {
      this.triggerTooltip(null);
    };

    container.addEventListener('pointermove', this.pointerMove);
    container.addEventListener('pointerleave', this.pointerLeave);
  }

  private triggerTooltip(point: ChartDataPoint | null, position?: TooltipPosition): void {
    if (!this.hoverCallback) {
      return;
    }

    if (!point) {
      this.hoverCallback(null);
      return;
    }

    const tooltip = this.getTooltipData(point);
    this.hoverCallback({
      data: tooltip,
      position,
    });
  }
}
