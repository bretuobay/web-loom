import type { ChartDataPoint, SeriesConfig } from '../core/types';
import type { ChartScale } from '../scales';
import { area, curveBasis, curveLinear, curveMonotoneX, curveStep, line, type CurveFactory } from 'd3-shape';
import { select } from 'd3-selection';
import 'd3-transition'; // Import to enable .transition() on selections
import { TRANSITION_CONFIG } from '../core/transitions';

export interface GradientConfig {
  type: 'linear' | 'radial';
  stops: Array<{ offset: number; color: string; opacity: number }>;
}

export class SeriesRenderer {
  private gradientCache: Map<string, string> = new Map();

  /**
   * Render a series to either SVG or Canvas based on the useCanvas flag
   */
  renderSeries(
    series: SeriesConfig,
    container: SVGGElement | HTMLCanvasElement,
    xScale: ChartScale,
    yScale: ChartScale,
    useCanvas: boolean,
    innerHeight?: number,
  ): void {
    if (useCanvas && container instanceof HTMLCanvasElement) {
      this.renderToCanvas(series, container, xScale, yScale, innerHeight ?? 0);
    } else if (container instanceof SVGGElement) {
      this.renderToSVG(series, container, xScale, yScale, innerHeight ?? 0);
    }
  }

  /**
   * Render series to SVG using D3 enter/update/exit pattern
   * This ensures DOM elements are reused on updates with smooth transitions
   */
  renderToSVG(
    series: SeriesConfig,
    container: SVGGElement,
    xScale: ChartScale,
    yScale: ChartScale,
    innerHeight: number,
  ): void {
    const color = series.color ?? '#2563eb';
    const seriesId = series.id ?? `${series.type}`;
    
    // Use D3 selection for data binding
    const containerSelection = select(container);

    // Render area with gradient if enabled
    if (series.area) {
      this.renderAreaWithDataJoin(containerSelection, series, xScale, yScale, innerHeight, color, seriesId);
    }

    // Render line using data join pattern
    this.renderLineWithDataJoin(containerSelection, series, xScale, yScale, color, seriesId);
  }

  /**
   * Render area path using D3 data join pattern
   */
  private renderAreaWithDataJoin(
    containerSelection: any,
    series: SeriesConfig,
    xScale: ChartScale,
    yScale: ChartScale,
    innerHeight: number,
    color: string,
    seriesId: string,
  ): void {
    const areaGenerator = area<ChartDataPoint>()
      .defined((d) => d.y !== undefined && d.x !== undefined)
      .curve(this.getCurve(series.curve))
      .x((d) => this.mapXValue(series, d, xScale))
      .y0(innerHeight)
      .y1((d) => this.mapYValue(series, d, yScale));

    const pathData = areaGenerator(series.data);
    if (!pathData) return;

    // Get or create gradient
    const gradientId = this.createOrGetSVGGradient(series, containerSelection.node(), color);

    // Bind data to area path (single element array for single path)
    const areaPath = containerSelection
      .selectAll(`path.area-${seriesId}`)
      .data([series.data]);

    // Enter: create new path if it doesn't exist
    const areaEnter = areaPath
      .enter()
      .append('path')
      .attr('class', `area-${seriesId}`)
      .attr('d', pathData)
      .attr('fill', `url(#${gradientId})`)
      .attr('stroke', 'none')
      .attr('opacity', 0.4); // Start visible for initial render

    // Update: merge enter and update selections
    const areaMerge = areaEnter.merge(areaPath);

    // Apply transition to update (only for updates, not initial render)
    const transition = (areaMerge as any)
      .transition()
      .duration(TRANSITION_CONFIG.duration);
    
    transition
      .attr('d', pathData)
      .attr('fill', `url(#${gradientId})`)
      .attr('opacity', 0.4);

    // Exit: remove old paths with fade out
    const areaExit = areaPath.exit();
    const exitTransition = (areaExit as any)
      .transition()
      .duration(TRANSITION_CONFIG.duration);
    
    exitTransition
      .attr('opacity', 0)
      .remove();
  }

  /**
   * Render line path using D3 data join pattern
   */
  private renderLineWithDataJoin(
    containerSelection: any,
    series: SeriesConfig,
    xScale: ChartScale,
    yScale: ChartScale,
    color: string,
    seriesId: string,
  ): void {
    const lineGenerator = line<ChartDataPoint>()
      .defined((d) => d.y !== undefined && d.x !== undefined)
      .curve(this.getCurve(series.curve))
      .x((d) => this.mapXValue(series, d, xScale))
      .y((d) => this.mapYValue(series, d, yScale));

    const pathData = lineGenerator(series.data);
    if (!pathData) return;

    // Bind data to line path (single element array for single path)
    const linePath = containerSelection
      .selectAll(`path.line-${seriesId}`)
      .data([series.data]);

    // Enter: create new path if it doesn't exist
    const lineEnter = linePath
      .enter()
      .append('path')
      .attr('class', `line-${seriesId}`)
      .attr('d', pathData)
      .attr('fill', 'none')
      .attr('stroke', color)
      .attr('stroke-width', series.lineWidth ?? 2)
      .attr('stroke-linecap', 'round')
      .attr('shape-rendering', 'geometricPrecision')
      .attr('aria-label', seriesId)
      .attr('opacity', 1); // Start visible for initial render

    // Update: merge enter and update selections
    const lineMerge = lineEnter.merge(linePath);

    // Apply transition to update (only for updates, not initial render)
    const transition = (lineMerge as any)
      .transition()
      .duration(TRANSITION_CONFIG.duration);
    
    transition
      .attr('d', pathData)
      .attr('stroke', color)
      .attr('stroke-width', series.lineWidth ?? 2)
      .attr('opacity', 1);

    // Exit: remove old paths with fade out
    const lineExit = linePath.exit();
    const exitTransition = (lineExit as any)
      .transition()
      .duration(TRANSITION_CONFIG.duration);
    
    exitTransition
      .attr('opacity', 0)
      .remove();
  }

  /**
   * Render series to Canvas
   */
  renderToCanvas(
    series: SeriesConfig,
    canvas: HTMLCanvasElement,
    xScale: ChartScale,
    yScale: ChartScale,
    innerHeight: number,
  ): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const color = series.color ?? '#2563eb';

    // Render area with gradient if enabled
    if (series.area) {
      this.renderCanvasArea(ctx, series, xScale, yScale, innerHeight, color);
    }

    // Render line
    this.renderCanvasLine(ctx, series, xScale, yScale, color);
  }

  /**
   * Create SVG line path
   */
  private createSVGLinePath(
    series: SeriesConfig,
    xScale: ChartScale,
    yScale: ChartScale,
    color: string,
  ): SVGPathElement | null {
    const generator = line<ChartDataPoint>()
      .defined((d) => d.y !== undefined && d.x !== undefined)
      .curve(this.getCurve(series.curve))
      .x((d) => this.mapXValue(series, d, xScale))
      .y((d) => this.mapYValue(series, d, yScale));

    const pathData = generator(series.data);
    if (!pathData) return null;

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', pathData);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', color);
    path.setAttribute('stroke-width', `${series.lineWidth ?? 2}`);
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('shape-rendering', 'geometricPrecision');
    path.setAttribute('aria-label', series.id ?? `${series.type} series`);
    return path;
  }

  /**
   * Create SVG area path
   */
  private createSVGAreaPath(
    series: SeriesConfig,
    xScale: ChartScale,
    yScale: ChartScale,
    innerHeight: number,
  ): SVGPathElement | null {
    const generator = area<ChartDataPoint>()
      .defined((d) => d.y !== undefined && d.x !== undefined)
      .curve(this.getCurve(series.curve))
      .x((d) => this.mapXValue(series, d, xScale))
      .y0(innerHeight)
      .y1((d) => this.mapYValue(series, d, yScale));

    const pathData = generator(series.data);
    if (!pathData) return null;

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', pathData);
    path.setAttribute('opacity', '0.4');
    return path;
  }

  /**
   * Create or retrieve cached SVG gradient
   */
  private createOrGetSVGGradient(series: SeriesConfig, container: SVGGElement, color: string): string {
    const cacheKey = `${series.id}-${color}`;

    if (this.gradientCache.has(cacheKey)) {
      return this.gradientCache.get(cacheKey)!;
    }

    const gradientId = `gradient-${Math.random().toString(36).substr(2, 9)}`;
    const defs = this.getOrCreateDefs(container);

    const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
    gradient.setAttribute('id', gradientId);
    gradient.setAttribute('x1', '0%');
    gradient.setAttribute('y1', '0%');
    gradient.setAttribute('x2', '0%');
    gradient.setAttribute('y2', '100%');

    // Create gradient stops (40% opacity to transparent per requirements 2.5, 7.1)
    const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop1.setAttribute('offset', '0%');
    stop1.setAttribute('stop-color', color);
    stop1.setAttribute('stop-opacity', '0.4');

    const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop2.setAttribute('offset', '100%');
    stop2.setAttribute('stop-color', color);
    stop2.setAttribute('stop-opacity', '0');

    gradient.appendChild(stop1);
    gradient.appendChild(stop2);
    defs.appendChild(gradient);

    this.gradientCache.set(cacheKey, gradientId);
    return gradientId;
  }

  /**
   * Get or create SVG defs element
   */
  private getOrCreateDefs(container: SVGGElement): SVGDefsElement {
    const svg = container.ownerSVGElement;
    if (!svg) {
      throw new Error('Container must be part of an SVG element');
    }

    let defs = svg.querySelector('defs');
    if (!defs) {
      defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      svg.insertBefore(defs, svg.firstChild);
    }

    return defs;
  }

  /**
   * Render line to canvas
   */
  private renderCanvasLine(
    ctx: CanvasRenderingContext2D,
    series: SeriesConfig,
    xScale: ChartScale,
    yScale: ChartScale,
    color: string,
  ): void {
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = series.lineWidth ?? 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    let isFirst = true;
    series.data.forEach((point) => {
      if (point.y === undefined || point.x === undefined) return;

      const x = this.mapXValue(series, point, xScale);
      const y = this.mapYValue(series, point, yScale);

      if (isFirst) {
        ctx.moveTo(x, y);
        isFirst = false;
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();
  }

  /**
   * Render area to canvas with gradient
   */
  private renderCanvasArea(
    ctx: CanvasRenderingContext2D,
    series: SeriesConfig,
    xScale: ChartScale,
    yScale: ChartScale,
    innerHeight: number,
    color: string,
  ): void {
    // Create gradient
    const gradient = this.createCanvasGradient(ctx, innerHeight, color);

    ctx.beginPath();
    ctx.fillStyle = gradient;

    let isFirst = true;
    series.data.forEach((point) => {
      if (point.y === undefined || point.x === undefined) return;

      const x = this.mapXValue(series, point, xScale);
      const y = this.mapYValue(series, point, yScale);

      if (isFirst) {
        ctx.moveTo(x, innerHeight);
        ctx.lineTo(x, y);
        isFirst = false;
      } else {
        ctx.lineTo(x, y);
      }
    });

    // Close the path to the bottom
    if (series.data.length > 0) {
      const lastPoint = series.data[series.data.length - 1];
      if (lastPoint && lastPoint.x !== undefined) {
        const lastX = this.mapXValue(series, lastPoint, xScale);
        ctx.lineTo(lastX, innerHeight);
      }
    }

    ctx.closePath();
    ctx.fill();
  }

  /**
   * Create canvas gradient (40% opacity to transparent per requirements 2.5, 7.1)
   */
  private createCanvasGradient(ctx: CanvasRenderingContext2D, innerHeight: number, color: string): CanvasGradient {
    const gradient = ctx.createLinearGradient(0, 0, 0, innerHeight);
    gradient.addColorStop(0, this.hexToRgba(color, 0.4));
    gradient.addColorStop(1, this.hexToRgba(color, 0));
    return gradient;
  }

  /**
   * Convert hex color to rgba
   */
  private hexToRgba(hex: string, alpha: number): string {
    // Remove # if present
    hex = hex.replace('#', '');

    // Parse hex values
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  /**
   * Map X value to pixel coordinate
   */
  private mapXValue(series: SeriesConfig, point: ChartDataPoint, scale: ChartScale): number {
    const normalized = this.normalizeX(series.xAccessor(point));
    return scale(normalized as any) as number;
  }

  /**
   * Map Y value to pixel coordinate
   */
  private mapYValue(series: SeriesConfig, point: ChartDataPoint, scale: ChartScale): number {
    return scale(series.yAccessor(point) as any) as number;
  }

  /**
   * Normalize X value to Date
   */
  private normalizeX(value: Date | number): Date {
    return value instanceof Date ? value : new Date(value);
  }

  /**
   * Get D3 curve factory based on series configuration
   */
  private getCurve(curve?: 'linear' | 'monotone' | 'basis' | 'step'): CurveFactory {
    switch (curve) {
      case 'monotone':
        return curveMonotoneX;
      case 'basis':
        return curveBasis;
      case 'step':
        return curveStep;
      default:
        return curveLinear;
    }
  }

  /**
   * Clear gradient cache
   */
  clearCache(): void {
    this.gradientCache.clear();
  }

  /**
   * Destroy renderer and cleanup resources
   */
  destroy(): void {
    this.clearCache();
  }
}
