import type { ChartDataPoint } from '../core/types';

export interface CrosshairConfig {
  enabled: boolean;
  vertical: boolean;
  horizontal: boolean;
  style: {
    stroke: string;
    strokeWidth: number;
    strokeDasharray: string;
    opacity: number;
  };
  snap: boolean; // Snap to nearest data point
}

/**
 * Creates default crosshair configuration matching design requirements:
 * - 1px stroke width
 * - rgba(100, 116, 139, 0.4) color
 * - Dashed line style
 */
export function createDefaultCrosshairConfig(): CrosshairConfig {
  return {
    enabled: true,
    vertical: true,
    horizontal: true,
    style: {
      stroke: 'rgba(100, 116, 139, 0.4)',
      strokeWidth: 1,
      strokeDasharray: '4 4',
      opacity: 1,
    },
    snap: true,
  };
}

export class CrosshairManager {
  private verticalLine?: SVGLineElement;
  private horizontalLine?: SVGLineElement;
  private highlightCircles: Map<string, SVGCircleElement> = new Map();

  constructor(
    private container: SVGGElement,
    private config: CrosshairConfig
  ) {}

  show(x: number, y: number, nearestPoints: Map<string, ChartDataPoint>): void {
    this.updateCrosshair(x, y);
    this.updateHighlights(nearestPoints);
  }

  hide(): void {
    this.verticalLine?.setAttribute('opacity', '0');
    this.horizontalLine?.setAttribute('opacity', '0');
    this.highlightCircles.forEach((circle) => circle.setAttribute('opacity', '0'));
  }

  private updateCrosshair(x: number, y: number): void {
    if (!this.verticalLine) {
      this.verticalLine = this.createLine('vertical');
    }
    if (!this.horizontalLine) {
      this.horizontalLine = this.createLine('horizontal');
    }

    this.verticalLine.setAttribute('x1', `${x}`);
    this.verticalLine.setAttribute('x2', `${x}`);
    this.verticalLine.setAttribute('opacity', '1');

    this.horizontalLine.setAttribute('y1', `${y}`);
    this.horizontalLine.setAttribute('y2', `${y}`);
    this.horizontalLine.setAttribute('opacity', '1');
  }

  private updateHighlights(nearestPoints: Map<string, ChartDataPoint>): void {
    nearestPoints.forEach((point, seriesId) => {
      let circle = this.highlightCircles.get(seriesId);
      if (!circle) {
        circle = this.createHighlightCircle(seriesId);
        this.highlightCircles.set(seriesId, circle);
      }
      // Position and show highlight circle
      circle.setAttribute('cx', `${point.x}`);
      circle.setAttribute('cy', `${point.y}`);
      circle.setAttribute('opacity', '1');
    });
  }

  private createLine(orientation: 'vertical' | 'horizontal'): SVGLineElement {
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('stroke', this.config.style.stroke);
    line.setAttribute('stroke-width', `${this.config.style.strokeWidth}`);
    line.setAttribute('stroke-dasharray', this.config.style.strokeDasharray);
    line.setAttribute('opacity', '0');
    line.setAttribute('pointer-events', 'none');

    if (orientation === 'vertical') {
      line.setAttribute('y1', '0');
      line.setAttribute('y2', '100%');
    } else {
      line.setAttribute('x1', '0');
      line.setAttribute('x2', '100%');
    }

    this.container.appendChild(line);
    return line;
  }

  private createHighlightCircle(seriesId: string): SVGCircleElement {
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('r', '6');
    circle.setAttribute('fill', 'none');
    circle.setAttribute('stroke', 'currentColor');
    circle.setAttribute('stroke-width', '2');
    circle.setAttribute('filter', 'url(#glow-filter)');
    circle.setAttribute('pointer-events', 'none');
    this.container.appendChild(circle);
    return circle;
  }

  destroy(): void {
    this.verticalLine?.remove();
    this.horizontalLine?.remove();
    this.highlightCircles.forEach((circle) => circle.remove());
    this.highlightCircles.clear();
  }
}
