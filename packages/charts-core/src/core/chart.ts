import type { AnnotationConfig, AxisConfig, ChartConfig, ChartDataPoint, SeriesConfig } from './types';
import { AxisRenderer } from '../axes';
import { AnnotationLayer } from '../annotations';
import { ScaleRegistry, ChartScale } from '../scales';
import { TooltipManager } from '../tooltips';
import { axisBottom, axisLeft, axisRight, axisTop } from 'd3-axis';
import { select } from 'd3-selection';
import { area, curveBasis, curveLinear, curveMonotoneX, curveStep, line } from 'd3-shape';
import { extent } from 'd3-array';
import { format as formatDate } from 'date-fns';

interface ChartAxisStyle {
  axisColor: string;
  axisWidth: number;
  tickColor: string;
  tickFont: string;
  tickFontSize: number;
  gridColor: string;
  gridWidth: number;
  gridDash: string;
}

export class ChartManager {
  private container: HTMLElement | null = null;
  private svg?: SVGSVGElement;
  private chartGroup?: SVGGElement;
  private overlayRect?: SVGRectElement;
  private readonly scales = new ScaleRegistry();
  private readonly axisRenderer = new AxisRenderer();
  private readonly annotationLayer = new AnnotationLayer();
  private readonly tooltipManager: TooltipManager;
  private readonly series: SeriesConfig[] = [];
  private readonly plugins = new Map<string, ChartPlugin>();
  private clipPathId?: string;
  private clipDef?: SVGDefsElement;
  private readonly axisStyleDefaults: ChartAxisStyle = {
    axisColor: 'rgba(13, 18, 44, 0.12)',
    axisWidth: 1,
    tickColor: '#6b7280',
    tickFont: 'Inter, system-ui, sans-serif',
    tickFontSize: 12,
    gridColor: 'rgba(15, 23, 42, 0.05)',
    gridWidth: 1,
    gridDash: '3 4',
  };

  constructor(public readonly config: ChartConfig) {
    this.tooltipManager = new TooltipManager(config.tooltip);
    this.applyAxisConfig();
    this.applyAnnotationConfig();
    this.applySeriesConfig();
  }

  addScale(id: string, scale: ChartScale): void {
    this.scales.register(id, scale);
  }

  addSeries(seriesConfig: SeriesConfig): void {
    this.series.push(seriesConfig);
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
    const element = document.querySelector<HTMLElement>(selector);
    if (!element) {
      throw new Error(`Unable to find chart container: ${selector}`);
    }

    this.container = element;
    this.container.innerHTML = '';
    this.container.style.position = this.container.style.position || 'relative';
    if (this.config.accessibility?.ariaLabel) {
      this.container.setAttribute('aria-label', this.config.accessibility.ariaLabel);
    }
    if (this.config.accessibility?.focusable) {
      this.container.tabIndex = 0;
    }

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', `${this.config.width}`);
    svg.setAttribute('height', `${this.config.height}`);
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-hidden', 'true');
    this.svg = svg;
    this.container.appendChild(svg);

    this.tooltipManager.attach(this.container);

    const innerWidth = this.config.width - this.config.margin.left - this.config.margin.right;
    const innerHeight = this.config.height - this.config.margin.top - this.config.margin.bottom;

    this.buildScales(innerWidth, innerHeight);

    this.chartGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this.chartGroup.setAttribute('transform', `translate(${this.config.margin.left},${this.config.margin.top})`);
    svg.appendChild(this.chartGroup);

    this.clipPathId = `charts-core-clip-${Math.random().toString(16).slice(2)}`;
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    this.clipDef = defs;
    const clipPath = document.createElementNS('http://www.w3.org/2000/svg', 'clipPath');
    clipPath.setAttribute('id', this.clipPathId);
    const clipRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    clipRect.setAttribute('width', `${innerWidth}`);
    clipRect.setAttribute('height', `${innerHeight}`);
    clipPath.appendChild(clipRect);
    defs.appendChild(clipPath);
    svg.appendChild(defs);
    this.chartGroup.setAttribute('clip-path', `url(#${this.clipPathId})`);

    this.renderGridLines(innerWidth, innerHeight);
    this.renderSeries(innerWidth, innerHeight);
    this.renderAxes(innerWidth, innerHeight);
    this.axisRenderer.render(this.container);
    this.annotationLayer.render(this.container);
    this.attachSharedTooltip(innerWidth, innerHeight);

    this.plugins.forEach((plugin) => plugin.install(this));
  }

  update(_: ChartDataPoint[]): void {
    // Replace per-series data updates when needed per API.
    this.tooltipManager.hide();
  }

  destroy(): void {
    this.series.length = 0;
    this.scales.clear();
    this.axisRenderer.clear();
    this.annotationLayer.clear();
    if (this.chartGroup) {
      this.chartGroup.remove();
      this.chartGroup = undefined;
    }
    if (this.overlayRect) {
      this.overlayRect.remove();
      this.overlayRect = undefined;
    }
    this.plugins.forEach((plugin) => plugin.uninstall(this));
    this.plugins.clear();
    if (this.container) {
      this.container.innerHTML = '';
    }
    this.clipPathId = undefined;
    if (this.clipDef) {
      this.clipDef.remove();
      this.clipDef = undefined;
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

  getContainer(): HTMLElement | null {
    return this.container;
  }

  private applyAxisConfig(): void {
    this.config.axes?.forEach((axis) => this.addAxis(axis));
  }

  private applyAnnotationConfig(): void {
    this.config.annotations?.forEach((annotation) => this.addAnnotation(annotation));
  }

  private applySeriesConfig(): void {
    this.config.series?.forEach((series) => this.addSeries(series));
  }

  private axisVisible(axis: AxisConfig): boolean {
    return axis.visible !== false;
  }

  private getAxisStyle(axis: AxisConfig): ChartAxisStyle {
    return {
      ...this.axisStyleDefaults,
      ...axis.style,
    };
  }

  private getAxisTickCount(axis: AxisConfig): number {
    return axis.ticks ?? (axis.orient === 'left' || axis.orient === 'right' ? 5 : 6);
  }

  private getScaleTicks(scale: ChartScale, axis: AxisConfig, count: number): (number | Date)[] {
    if (typeof (scale as any).ticks === 'function') {
      return (scale as any).ticks(count);
    }
    return scale.domain();
  }

  private renderGridLines(innerWidth: number, innerHeight: number): void {
    if (!this.chartGroup) {
      return;
    }

    this.config.axes?.forEach((axis) => {
      if (!this.axisVisible(axis)) {
        return;
      }

      const style = this.getAxisStyle(axis);
      if (!style.gridColor || style.gridColor === 'transparent') {
        return;
      }

      const scale = this.scales.get(axis.scale);
      if (!scale) {
        return;
      }

      const ticks = this.getAxisTickCount(axis);
      const values = this.getScaleTicks(scale, axis, ticks);
      if (!values.length) {
        return;
      }

      const gridGroup = select(this.chartGroup)
        .append('g')
        .attr('class', `charts-core-grid charts-core-grid-${axis.orient}`)
        .attr('fill', 'none')
        .attr('pointer-events', 'none');

      values.forEach((value) => {
        const position = (scale as any)(value);
        if (position === undefined || !Number.isFinite(position)) {
          return;
        }

        const line = gridGroup
          .append('line')
          .attr('stroke', style.gridColor)
          .attr('stroke-width', style.gridWidth)
          .attr('stroke-dasharray', style.gridDash)
          .attr('shape-rendering', 'geometricPrecision')
          .attr('opacity', 0.8);

        if (axis.orient === 'bottom' || axis.orient === 'top') {
          line.attr('x1', position).attr('x2', position).attr('y1', 0).attr('y2', innerHeight);
        } else {
          line.attr('x1', 0).attr('x2', innerWidth).attr('y1', position).attr('y2', position);
        }
      });
    });
  }

  private buildScales(innerWidth: number, innerHeight: number): void {
    this.config.axes?.forEach((axis) => {
      const isHorizontal = axis.orient === 'top' || axis.orient === 'bottom';
      const scaleType = isHorizontal ? 'time' : 'linear';
      const range: [number, number] = isHorizontal
        ? [0, innerWidth]
        : [innerHeight, 0];
      const domain = this.computeAxisDomain(axis, isHorizontal);
      const existing = this.scales.get(axis.scale);
      if (existing) {
        existing.domain(domain as any);
        existing.range(range);
      } else {
        this.scales.create({
          id: axis.scale,
          type: scaleType,
          domain,
          range,
        });
      }
    });
  }

  private computeAxisDomain(axis: AxisConfig, isHorizontal: boolean): [number | Date, number | Date] {
    const values: (number | Date)[] = [];
    this.series.forEach((series) => {
      const matches = isHorizontal
        ? !series.xScale || series.xScale === axis.scale
        : series.yScale === axis.scale || (!series.yScale && axis.scale === 'y');
      if (!matches) {
        return;
      }
      series.data.forEach((point) => {
        values.push(isHorizontal ? this.normalizeX(series.xAccessor(point)) : series.yAccessor(point));
      });
    });

    if (!values.length) {
      return isHorizontal ? [new Date(0), new Date(86400000)] : [0, 1];
    }

    if (isHorizontal) {
      const dates = values.map((value) => (value instanceof Date ? value.getTime() : Number(value)));
      const range = extent(dates) as [number, number];
      if (range[0] === range[1]) {
        return [new Date(range[0] - 1000), new Date(range[1] + 1000)];
      }
      return [new Date(range[0]), new Date(range[1])];
    }

    const numbers = values as number[];
    const range = extent(numbers) as [number, number];
    if (range[0] === range[1]) {
      return [range[0] - 1, range[1] + 1];
    }
    return range;
  }

  private normalizeX(value: Date | number): Date {
    return value instanceof Date ? value : new Date(value);
  }

  private renderSeries(innerWidth: number, innerHeight: number): void {
    if (!this.chartGroup) {
      return;
    }

    const xAxisScaleId = this.config.axes?.find((axis) => axis.orient === 'bottom' || axis.orient === 'top')?.scale;
    if (!xAxisScaleId) {
      return;
    }

    const xScale = this.scales.get(xAxisScaleId);
    if (!xScale) {
      return;
    }

    this.series.forEach((seriesConfig) => {
      const yScaleId = seriesConfig.yScale ?? 'y';
      const yScale = this.scales.get(yScaleId);
      if (!yScale) {
        return;
      }

      if (seriesConfig.area) {
        const areaPath = this.createAreaPath(seriesConfig, xScale, yScale, innerHeight);
        areaPath?.setAttribute('fill', seriesConfig.color ?? 'rgba(59, 130, 246, 0.2)');
        areaPath?.setAttribute('stroke', 'none');
        this.chartGroup!.appendChild(areaPath);
      }

      const path = this.createLinePath(seriesConfig, xScale, yScale);
      if (path) {
        this.chartGroup!.appendChild(path);
      }

      if (seriesConfig.marker?.show) {
        this.createMarkers(seriesConfig, xScale, yScale);
      }
    });
  }

  private createLinePath(series: SeriesConfig, xScale: ChartScale, yScale: ChartScale): SVGPathElement | null {
    const generator = line<ChartDataPoint>()
      .defined((d) => d.y !== undefined && d.x !== undefined)
      .curve(this.getCurve(series.curve))
      .x((d) => this.mapXValue(series, d, xScale))
      .y((d) => this.mapYValue(series, d, yScale));

    const pathData = generator(series.data);
    if (!pathData) {
      return null;
    }

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', pathData);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', series.color ?? '#2563eb');
    path.setAttribute('stroke-width', `${series.lineWidth ?? 2}`);
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('aria-label', series.id ?? `${series.type} series`);
    return path;
  }

  private createAreaPath(series: SeriesConfig, xScale: ChartScale, yScale: ChartScale, innerHeight: number): SVGPathElement | null {
    const generator = area<ChartDataPoint>()
      .defined((d) => d.y !== undefined && d.x !== undefined)
      .curve(this.getCurve(series.curve))
      .x((d) => this.mapXValue(series, d, xScale))
      .y0(innerHeight)
      .y1((d) => this.mapYValue(series, d, yScale));

    const pathData = generator(series.data);
    if (!pathData) {
      return null;
    }

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', pathData);
    path.setAttribute('opacity', '0.4');
    return path;
  }

  private createMarkers(series: SeriesConfig, xScale: ChartScale, yScale: ChartScale): void {
    if (!this.chartGroup || !this.container) {
      return;
    }

    series.data.forEach((point) => {
      if (point.y === undefined || point.x === undefined) {
        return;
      }

      const marker = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      marker.setAttribute('cx', `${this.mapXValue(series, point, xScale)}`);
      marker.setAttribute('cy', `${this.mapYValue(series, point, yScale)}`);
      const radius = series.marker?.radius ?? 4;
      marker.setAttribute('r', `${radius}`);
      marker.setAttribute('fill', series.marker?.fill ?? series.color ?? '#2563eb');
      marker.setAttribute('stroke', series.marker?.stroke ?? '#ffffff');
      marker.setAttribute('stroke-width', '1');
      marker.setAttribute('data-series-id', series.id ?? `${series.type}`);
      marker.style.cursor = 'pointer';

      marker.addEventListener('pointerenter', (event) => this.handlePointHover(series, point, event));
      marker.addEventListener('pointerleave', () => this.tooltipManager.hide());
      this.chartGroup!.appendChild(marker);
    });
  }

  private mapXValue(series: SeriesConfig, point: ChartDataPoint, scale: ChartScale): number {
    const normalized = this.normalizeX(series.xAccessor(point));
    return scale(normalized as any) as number;
  }

  private mapYValue(series: SeriesConfig, point: ChartDataPoint, scale: ChartScale): number {
    return scale(series.yAccessor(point) as any) as number;
  }

  private getCurve(curve?: 'linear' | 'monotone' | 'basis' | 'step') {
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

  private renderAxes(innerWidth: number, innerHeight: number): void {
    if (!this.svg) {
      return;
    }

    const svgSelection = select(this.svg);
    this.config.axes?.forEach((axis) => {
      if (!this.axisVisible(axis)) {
        return;
      }

      const scale = this.scales.get(axis.scale);
      if (!scale) {
        return;
      }

      const group = svgSelection
        .append('g')
        .attr('class', `charts-core-axis charts-core-axis-${axis.orient}`)
        .attr('transform', this.getAxisTransform(axis, innerWidth, innerHeight));

      const axisGenerator = this.createAxisGenerator(axis, scale);
      group.call(axisGenerator as any);

      const style = this.getAxisStyle(axis);
      group
        .select('path')
        .attr('stroke', style.axisColor)
        .attr('stroke-width', `${style.axisWidth}`);

      group
        .selectAll('line')
        .attr('stroke', style.axisColor)
        .attr('stroke-width', `${style.axisWidth}`);

      group
        .selectAll('text')
        .attr('fill', style.tickColor)
        .style('font-family', style.tickFont)
        .style('font-size', `${style.tickFontSize}px`);
    });
  }

  private getAxisTransform(axis: AxisConfig, innerWidth: number, innerHeight: number): string {
    const { margin } = this.config;
    switch (axis.orient) {
      case 'bottom':
        return `translate(${margin.left},${margin.top + innerHeight})`;
      case 'top':
        return `translate(${margin.left},${margin.top})`;
      case 'left':
        return `translate(${margin.left},${margin.top})`;
      case 'right':
        return `translate(${margin.left + innerWidth},${margin.top})`;
      default:
        return `translate(${margin.left},${margin.top})`;
    }
  }

  private createAxisGenerator(axis: AxisConfig, scale: ChartScale) {
    const tickFormat = axis.format ?? this.getDefaultFormatter(axis);
    const ticks = axis.ticks ?? (axis.orient === 'left' || axis.orient === 'right' ? 5 : 6);
    if (axis.orient === 'bottom') {
      return axisBottom(scale as any).ticks(ticks).tickFormat(tickFormat as any);
    }
    if (axis.orient === 'top') {
      return axisTop(scale as any).ticks(ticks).tickFormat(tickFormat as any);
    }
    if (axis.orient === 'left') {
      return axisLeft(scale as any).ticks(ticks).tickFormat(tickFormat as any);
    }
    return axisRight(scale as any).ticks(ticks).tickFormat(tickFormat as any);
  }

  private getDefaultFormatter(axis: AxisConfig): (value: number | Date) => string {
    if (axis.orient === 'bottom' || axis.orient === 'top') {
      const pattern = this.config.localization?.dateFormat ?? 'MMM dd';
      return (value) => formatDate(value instanceof Date ? value : new Date(value), pattern);
    }

    const formatter = new Intl.NumberFormat(this.config.localization?.locale ?? 'en-US');
    return (value) => formatter.format(Number(value));
  }

  private attachSharedTooltip(innerWidth: number, innerHeight: number): void {
    if (!this.config.tooltip?.shared || !this.chartGroup || !this.svg) {
      return;
    }

    const xAxisScaleId = this.config.axes?.find((axis) => axis.orient === 'bottom' || axis.orient === 'top')?.scale;
    const xScale = xAxisScaleId ? this.scales.get(xAxisScaleId) : undefined;
    if (!xScale) {
      return;
    }

    this.overlayRect?.remove();
    const overlay = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    overlay.setAttribute('width', `${innerWidth}`);
    overlay.setAttribute('height', `${innerHeight}`);
    overlay.setAttribute('fill', 'transparent');
    overlay.setAttribute('cursor', 'crosshair');
    this.chartGroup.appendChild(overlay);
    this.overlayRect = overlay;

    overlay.addEventListener('pointermove', (event) => {
      const point = this.computeSharedPoint(event, xScale, innerWidth);
      if (!point) {
        this.tooltipManager.hide();
        return;
      }
      const rect = this.container!.getBoundingClientRect();
      this.tooltipManager.show(point.data, {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      });
    });

    overlay.addEventListener('pointerleave', () => {
      this.tooltipManager.hide();
    });
  }

  private computeSharedPoint(event: PointerEvent, xScale: ChartScale, innerWidth: number): { data: { seriesId: string; point: ChartDataPoint; label?: string } } | null {
    if (!this.container) {
      return null;
    }
    const rect = this.svg!.getBoundingClientRect();
    const x = event.clientX - rect.left - this.config.margin.left;
    if (x < 0 || x > innerWidth) {
      return null;
    }

    const inverted = (xScale as any).invert(x);
    if (inverted === undefined) {
      return null;
    }

    const sharedLines: string[] = [];
    let referencePoint: ChartDataPoint | null = null;
    let referenceSeriesId: string | undefined;

    this.series.forEach((series) => {
      const closest = this.findClosestPoint(series, inverted);
      if (!closest) {
        return;
      }
      sharedLines.push(`${series.id ?? series.type}: ${closest.y}`);
      if (!referencePoint) {
        referencePoint = closest;
        referenceSeriesId = series.id ?? series.type;
      }
    });

    if (!referencePoint) {
      return null;
    }

    return {
      data: {
        seriesId: referenceSeriesId ?? 'shared',
        point: referencePoint,
        label: sharedLines.join('\n'),
      },
    };
  }

  private findClosestPoint(series: SeriesConfig, target: number | Date): ChartDataPoint | null {
    const targetTime = target instanceof Date ? target.getTime() : target;
    let closest: ChartDataPoint | null = null;
    let minDiff = Infinity;
    series.data.forEach((point) => {
      const xValue = this.normalizeX(series.xAccessor(point)).getTime();
      const diff = Math.abs(xValue - targetTime);
      if (diff < minDiff) {
        minDiff = diff;
        closest = point;
      }
    });
    return closest;
  }

  private handlePointHover(series: SeriesConfig, point: ChartDataPoint, event: PointerEvent): void {
    if (!this.container) {
      return;
    }

    const rect = this.container.getBoundingClientRect();
    this.tooltipManager.show({
      seriesId: series.id ?? `${series.type}`,
      point,
      label: this.config.tooltip?.shared ? undefined : `${series.id ?? series.type}: ${point.y}`,
    }, {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    });
  }
}

export interface ChartPlugin {
  id: string;
  install(chart: ChartManager): void;
  uninstall(chart: ChartManager): void;
}
