# Design Document: Charts-Core Production Refactor

## Overview

This design document outlines the refactoring strategy to elevate `@web-loom/charts-core` from MVP to production-ready quality for time series dashboards. The refactoring preserves the existing modular architecture (ChartManager, ScaleRegistry, AxisRenderer, TooltipManager, plugin system) while enhancing visual polish, performance, and interactivity.

### Design Principles

1. **Incremental Enhancement**: Build upon existing working components rather than rewriting
2. **Design System Integration**: Leverage `@web-loom/design-core` tokens for consistent theming
3. **Performance First**: Optimize for 10,000+ data points with canvas fallback and progressive rendering
4. **Accessibility by Default**: WCAG 2.1 AA compliance with keyboard navigation and screen reader support
5. **Framework Agnostic**: Maintain pure TypeScript/D3 core with framework adapters

## Architecture

### Core Component Enhancements

#### 1. ChartManager (Enhanced)

The ChartManager remains the central orchestrator but gains new capabilities:

**New Responsibilities:**
- Theme management and CSS variable integration
- Performance monitoring and adaptive rendering strategy selection
- Event bus for cross-component communication
- Resize observation and responsive behavior
- Export functionality (PNG/SVG)

**Enhanced API:**
```typescript
class ChartManager {
  // Existing methods preserved
  constructor(config: ChartConfig)
  render(selector: string): void
  update(data: ChartDataPoint[]): void
  destroy(): void
  
  // New methods
  setTheme(theme: ChartTheme): void
  exportToPNG(options?: ExportOptions): Promise<string>
  exportToSVG(options?: ExportOptions): string
  appendData(seriesId: string, points: ChartDataPoint[]): void
  on(event: ChartEvent, handler: EventHandler): void
  off(event: ChartEvent, handler: EventHandler): void
}
```


#### 2. RenderStrategy (New Component)

Introduces adaptive rendering based on data size and device capabilities:

```typescript
interface RenderStrategy {
  shouldUseCanvas(pointCount: number): boolean
  getOptimalCurve(pointCount: number, aspectRatio: number): CurveFactory
  getProgressiveChunkSize(): number
}

class AdaptiveRenderStrategy implements RenderStrategy {
  private readonly SVG_THRESHOLD = 5000
  private readonly CANVAS_THRESHOLD = 10000
  
  shouldUseCanvas(pointCount: number): boolean {
    return pointCount > this.CANVAS_THRESHOLD
  }
  
  getOptimalCurve(pointCount: number, aspectRatio: number): CurveFactory {
    // Use linear for performance with large datasets
    if (pointCount > this.SVG_THRESHOLD) return curveLinear
    // Use monotone for smooth appearance with smaller datasets
    return curveMonotoneX
  }
  
  getProgressiveChunkSize(): number {
    // Render in chunks for smooth initial display
    return 1000
  }
}
```

#### 3. ThemeManager (New Component)

Integrates with `@web-loom/design-core` for consistent theming:

```typescript
interface ChartTheme {
  name: string
  colors: {
    series: string[]        // Primary series colors
    background: string      // Chart background
    grid: string           // Grid line color
    axis: string           // Axis line color
    text: string           // Label text color
  }
  typography: {
    fontFamily: string
    fontSize: {
      axis: number
      tooltip: number
      legend: number
    }
  }
  spacing: {
    margin: Margin
    padding: number
  }
  animation: {
    duration: number
    easing: string
  }
  shadows: {
    marker: string
    tooltip: string
  }
}

class ThemeManager {
  private currentTheme: ChartTheme
  private readonly defaultTheme: ChartTheme
  
  constructor() {
    this.defaultTheme = this.createDefaultTheme()
    this.currentTheme = this.defaultTheme
  }
  
  private createDefaultTheme(): ChartTheme {
    // Leverage design-core tokens
    return {
      name: 'default-light',
      colors: {
        series: ['#0ea5e9', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'],
        background: '#ffffff',
        grid: 'rgba(15, 23, 42, 0.04)',
        axis: 'rgba(15, 23, 42, 0.08)',
        text: '#64748b'
      },
      typography: {
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: { axis: 12, tooltip: 13, legend: 13 }
      },
      spacing: {
        margin: { top: 24, right: 32, bottom: 40, left: 50 },
        padding: 12
      },
      animation: {
        duration: 300,
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
      },
      shadows: {
        marker: '0 2px 4px rgba(0, 0, 0, 0.1)',
        tooltip: '0 4px 12px rgba(0, 0, 0, 0.15)'
      }
    }
  }
  
  applyTheme(theme: Partial<ChartTheme>): void {
    this.currentTheme = this.mergeThemes(this.defaultTheme, theme)
  }
  
  getTheme(): ChartTheme {
    return this.currentTheme
  }
  
  private mergeThemes(base: ChartTheme, override: Partial<ChartTheme>): ChartTheme {
    // Deep merge implementation
    return { ...base, ...override }
  }
}
```


#### 4. CrosshairManager (New Component)

Manages crosshair rendering and point highlighting:

```typescript
interface CrosshairConfig {
  enabled: boolean
  vertical: boolean
  horizontal: boolean
  style: {
    stroke: string
    strokeWidth: number
    strokeDasharray: string
    opacity: number
  }
  snap: boolean  // Snap to nearest data point
}

class CrosshairManager {
  private verticalLine?: SVGLineElement
  private horizontalLine?: SVGLineElement
  private highlightCircles: Map<string, SVGCircleElement> = new Map()
  
  constructor(
    private container: SVGGElement,
    private config: CrosshairConfig
  ) {}
  
  show(x: number, y: number, nearestPoints: Map<string, ChartDataPoint>): void {
    this.updateCrosshair(x, y)
    this.updateHighlights(nearestPoints)
  }
  
  hide(): void {
    this.verticalLine?.setAttribute('opacity', '0')
    this.horizontalLine?.setAttribute('opacity', '0')
    this.highlightCircles.forEach(circle => circle.setAttribute('opacity', '0'))
  }
  
  private updateCrosshair(x: number, y: number): void {
    if (!this.verticalLine) {
      this.verticalLine = this.createLine('vertical')
    }
    if (!this.horizontalLine) {
      this.horizontalLine = this.createLine('horizontal')
    }
    
    this.verticalLine.setAttribute('x1', `${x}`)
    this.verticalLine.setAttribute('x2', `${x}`)
    this.verticalLine.setAttribute('opacity', '1')
    
    this.horizontalLine.setAttribute('y1', `${y}`)
    this.horizontalLine.setAttribute('y2', `${y}`)
    this.horizontalLine.setAttribute('opacity', '1')
  }
  
  private updateHighlights(nearestPoints: Map<string, ChartDataPoint>): void {
    nearestPoints.forEach((point, seriesId) => {
      let circle = this.highlightCircles.get(seriesId)
      if (!circle) {
        circle = this.createHighlightCircle(seriesId)
        this.highlightCircles.set(seriesId, circle)
      }
      // Position and show highlight circle
      circle.setAttribute('cx', `${point.x}`)
      circle.setAttribute('cy', `${point.y}`)
      circle.setAttribute('opacity', '1')
    })
  }
  
  private createHighlightCircle(seriesId: string): SVGCircleElement {
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
    circle.setAttribute('r', '6')
    circle.setAttribute('fill', 'none')
    circle.setAttribute('stroke', 'currentColor')
    circle.setAttribute('stroke-width', '2')
    circle.setAttribute('filter', 'url(#glow-filter)')
    circle.setAttribute('pointer-events', 'none')
    this.container.appendChild(circle)
    return circle
  }
}
```

#### 5. LegendManager (New Component)

Manages legend rendering and interactivity:

```typescript
interface LegendConfig {
  enabled: boolean
  position: 'top' | 'bottom' | 'left' | 'right' | 'floating'
  align: 'start' | 'center' | 'end'
  layout: 'horizontal' | 'vertical'
  interactive: boolean
  maxWidth?: number
  maxHeight?: number
}

interface LegendItem {
  seriesId: string
  label: string
  color: string
  visible: boolean
  marker: 'line' | 'circle' | 'square'
}

class LegendManager {
  private container?: HTMLElement
  private items: LegendItem[] = []
  private listeners: Map<string, EventListener> = new Map()
  
  constructor(
    private config: LegendConfig,
    private onToggle: (seriesId: string, visible: boolean) => void,
    private onHover: (seriesId: string | null) => void
  ) {}
  
  render(parentContainer: HTMLElement, series: SeriesConfig[]): void {
    this.items = series.map(s => ({
      seriesId: s.id ?? s.type,
      label: s.id ?? s.type,
      color: s.color ?? '#000',
      visible: true,
      marker: 'line'
    }))
    
    this.container = this.createLegendContainer()
    this.items.forEach(item => {
      const itemElement = this.createLegendItem(item)
      this.container!.appendChild(itemElement)
    })
    
    parentContainer.appendChild(this.container)
  }
  
  private createLegendItem(item: LegendItem): HTMLElement {
    const element = document.createElement('div')
    element.className = 'chart-legend-item'
    element.dataset.seriesId = item.seriesId
    element.style.cssText = `
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 12px;
      cursor: pointer;
      opacity: ${item.visible ? 1 : 0.5};
      transition: opacity 300ms ease;
    `
    
    const marker = this.createMarker(item.color, item.marker)
    const label = document.createElement('span')
    label.textContent = item.label
    label.style.cssText = `
      font-size: 13px;
      font-family: Inter, system-ui, sans-serif;
      color: #374151;
      text-decoration: ${item.visible ? 'none' : 'line-through'};
    `
    
    element.appendChild(marker)
    element.appendChild(label)
    
    // Add event listeners
    element.addEventListener('click', () => {
      item.visible = !item.visible
      this.onToggle(item.seriesId, item.visible)
      this.updateItemVisual(element, item)
    })
    
    element.addEventListener('mouseenter', () => {
      this.onHover(item.seriesId)
    })
    
    element.addEventListener('mouseleave', () => {
      this.onHover(null)
    })
    
    return element
  }
}
```


#### 6. Enhanced TooltipManager

Extends existing TooltipManager with smart positioning and rich formatting:

```typescript
interface EnhancedTooltipConfig extends TooltipConfig {
  crosshair?: boolean
  multiline?: boolean
  maxWidth?: number
  animation?: {
    duration: number
    easing: string
  }
  formatter?: (data: TooltipData[]) => string
}

class EnhancedTooltipManager extends TooltipManager {
  private positionStrategy: TooltipPositionStrategy
  
  constructor(config: EnhancedTooltipConfig) {
    super(config)
    this.positionStrategy = new SmartPositionStrategy()
  }
  
  showMultiSeries(data: TooltipData[], position: { x: number, y: number }): void {
    const content = this.formatMultiSeriesContent(data)
    const adjustedPosition = this.positionStrategy.calculate(
      position,
      this.getTooltipDimensions(),
      this.getViewportBounds()
    )
    
    this.updateContent(content)
    this.updatePosition(adjustedPosition)
    this.show()
  }
  
  private formatMultiSeriesContent(data: TooltipData[]): string {
    // Sort by magnitude
    const sorted = [...data].sort((a, b) => b.point.y - a.point.y)
    
    const timestamp = this.formatTimestamp(sorted[0].point.x)
    const seriesLines = sorted.map(d => 
      `<div class="tooltip-series-line">
        <span class="tooltip-color-indicator" style="background: ${d.seriesId}"></span>
        <span class="tooltip-series-name">${d.seriesId}</span>
        <span class="tooltip-value">${this.formatValue(d.point.y)}</span>
      </div>`
    ).join('')
    
    return `
      <div class="tooltip-header">${timestamp}</div>
      <div class="tooltip-body">${seriesLines}</div>
    `
  }
}

interface TooltipPositionStrategy {
  calculate(
    desired: { x: number, y: number },
    tooltipSize: { width: number, height: number },
    viewport: { width: number, height: number }
  ): { x: number, y: number }
}

class SmartPositionStrategy implements TooltipPositionStrategy {
  private readonly OFFSET = 12
  private readonly EDGE_MARGIN = 8
  
  calculate(desired, tooltipSize, viewport) {
    let { x, y } = desired
    
    // Default: position to right and below cursor
    x += this.OFFSET
    y += this.OFFSET
    
    // Check right edge
    if (x + tooltipSize.width > viewport.width - this.EDGE_MARGIN) {
      x = desired.x - tooltipSize.width - this.OFFSET
    }
    
    // Check bottom edge
    if (y + tooltipSize.height > viewport.height - this.EDGE_MARGIN) {
      y = desired.y - tooltipSize.height - this.OFFSET
    }
    
    // Ensure not off left edge
    x = Math.max(this.EDGE_MARGIN, x)
    
    // Ensure not off top edge
    y = Math.max(this.EDGE_MARGIN, y)
    
    return { x, y }
  }
}
```

#### 7. Enhanced AxisRenderer

Extends existing AxisRenderer with intelligent formatting and responsive behavior:

```typescript
class EnhancedAxisRenderer extends AxisRenderer {
  private formatters: Map<string, AxisFormatter> = new Map()
  
  render(container: HTMLElement, innerWidth: number, innerHeight: number): void {
    // Call parent render
    super.render(container)
    
    // Apply intelligent formatting
    this.applyIntelligentFormatting(innerWidth, innerHeight)
  }
  
  private applyIntelligentFormatting(width: number, height: number): void {
    this.axes.forEach(axis => {
      const formatter = this.getFormatter(axis, width, height)
      this.formatters.set(axis.id, formatter)
    })
  }
  
  private getFormatter(axis: AxisConfig, width: number, height: number): AxisFormatter {
    if (axis.orient === 'bottom' || axis.orient === 'top') {
      return new TimeAxisFormatter(width)
    }
    return new ValueAxisFormatter(height)
  }
}

interface AxisFormatter {
  format(value: number | Date): string
  getOptimalTickCount(availableSpace: number): number
}

class TimeAxisFormatter implements AxisFormatter {
  constructor(private availableWidth: number) {}
  
  format(value: Date): string {
    const range = this.getTimeRange()
    
    if (range < 86400000) { // < 1 day
      return formatDate(value, 'HH:mm')
    } else if (range < 2592000000) { // < 30 days
      return formatDate(value, 'MMM dd')
    } else if (range < 31536000000) { // < 1 year
      return formatDate(value, 'MMM yyyy')
    } else {
      return formatDate(value, 'yyyy')
    }
  }
  
  getOptimalTickCount(availableSpace: number): number {
    const TARGET_SPACING = 70 // pixels between ticks
    return Math.floor(availableSpace / TARGET_SPACING)
  }
}

class ValueAxisFormatter implements AxisFormatter {
  constructor(private availableHeight: number) {}
  
  format(value: number): string {
    const abs = Math.abs(value)
    
    if (abs >= 1e9) {
      return `${(value / 1e9).toFixed(1)}B`
    } else if (abs >= 1e6) {
      return `${(value / 1e6).toFixed(1)}M`
    } else if (abs >= 1e3) {
      return `${(value / 1e3).toFixed(1)}K`
    } else if (abs < 1 && abs > 0) {
      return value.toFixed(3)
    } else {
      return value.toFixed(1)
    }
  }
  
  getOptimalTickCount(availableSpace: number): number {
    const TARGET_SPACING = 50 // pixels between ticks
    return Math.floor(availableSpace / TARGET_SPACING)
  }
}
```


#### 8. Enhanced SeriesRenderer

Adds gradient fills, marker interactions, and canvas fallback:

```typescript
interface GradientConfig {
  type: 'linear' | 'radial'
  stops: Array<{ offset: number, color: string, opacity: number }>
}

class EnhancedSeriesRenderer {
  private gradientCache: Map<string, string> = new Map()
  private canvasContext?: CanvasRenderingContext2D
  
  renderSeries(
    series: SeriesConfig,
    container: SVGGElement | HTMLCanvasElement,
    xScale: ChartScale,
    yScale: ChartScale,
    useCanvas: boolean
  ): void {
    if (useCanvas && container instanceof HTMLCanvasElement) {
      this.renderToCanvas(series, container, xScale, yScale)
    } else if (container instanceof SVGGElement) {
      this.renderToSVG(series, container, xScale, yScale)
    }
  }
  
  private renderToSVG(
    series: SeriesConfig,
    container: SVGGElement,
    xScale: ChartScale,
    yScale: ChartScale
  ): void {
    // Render area with gradient if enabled
    if (series.area) {
      const gradientId = this.createOrGetGradient(series)
      const areaPath = this.createAreaPath(series, xScale, yScale)
      areaPath.setAttribute('fill', `url(#${gradientId})`)
      container.appendChild(areaPath)
    }
    
    // Render line
    const linePath = this.createLinePath(series, xScale, yScale)
    container.appendChild(linePath)
    
    // Render markers with hover states
    if (series.marker?.show) {
      this.renderInteractiveMarkers(series, container, xScale, yScale)
    }
  }
  
  private createOrGetGradient(series: SeriesConfig): string {
    const cacheKey = `${series.id}-${series.color}`
    
    if (this.gradientCache.has(cacheKey)) {
      return this.gradientCache.get(cacheKey)!
    }
    
    const gradientId = `gradient-${Math.random().toString(36).substr(2, 9)}`
    const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient')
    gradient.setAttribute('id', gradientId)
    gradient.setAttribute('x1', '0%')
    gradient.setAttribute('y1', '0%')
    gradient.setAttribute('x2', '0%')
    gradient.setAttribute('y2', '100%')
    
    // Create gradient stops
    const color = series.color ?? '#0ea5e9'
    const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop')
    stop1.setAttribute('offset', '0%')
    stop1.setAttribute('stop-color', color)
    stop1.setAttribute('stop-opacity', '0.4')
    
    const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop')
    stop2.setAttribute('offset', '100%')
    stop2.setAttribute('stop-color', color)
    stop2.setAttribute('stop-opacity', '0')
    
    gradient.appendChild(stop1)
    gradient.appendChild(stop2)
    
    // Add to defs
    const defs = document.querySelector('defs') ?? document.createElementNS('http://www.w3.org/2000/svg', 'defs')
    defs.appendChild(gradient)
    
    this.gradientCache.set(cacheKey, gradientId)
    return gradientId
  }
  
  private renderInteractiveMarkers(
    series: SeriesConfig,
    container: SVGGElement,
    xScale: ChartScale,
    yScale: ChartScale
  ): void {
    series.data.forEach((point, index) => {
      const marker = this.createMarker(point, series, xScale, yScale)
      
      // Add hover interactions
      marker.addEventListener('mouseenter', () => {
        this.animateMarkerHover(marker, true)
      })
      
      marker.addEventListener('mouseleave', () => {
        this.animateMarkerHover(marker, false)
      })
      
      container.appendChild(marker)
    })
  }
  
  private animateMarkerHover(marker: SVGCircleElement, isHover: boolean): void {
    const targetRadius = isHover ? 6 : 4
    const targetFilter = isHover ? 'url(#marker-glow)' : 'none'
    
    // Use D3 transition for smooth animation
    select(marker)
      .transition()
      .duration(300)
      .ease(easeCubicOut)
      .attr('r', targetRadius)
      .attr('filter', targetFilter)
  }
  
  private renderToCanvas(
    series: SeriesConfig,
    canvas: HTMLCanvasElement,
    xScale: ChartScale,
    yScale: ChartScale
  ): void {
    const ctx = canvas.getContext('2d')!
    ctx.strokeStyle = series.color ?? '#0ea5e9'
    ctx.lineWidth = series.lineWidth ?? 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    
    // Begin path
    ctx.beginPath()
    series.data.forEach((point, index) => {
      const x = xScale(point.x as any) as number
      const y = yScale(point.y as any) as number
      
      if (index === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })
    ctx.stroke()
    
    // Render area fill if enabled
    if (series.area) {
      ctx.fillStyle = this.getCanvasGradient(ctx, series, yScale)
      ctx.fill()
    }
  }
}
```


#### 9. Enhanced Plugin System

Extends existing plugin system with zoom/pan enhancements:

```typescript
interface ZoomPanConfig {
  zoom: {
    enabled: boolean
    wheel: boolean
    pinch: boolean
    doubleClick: boolean
    scaleExtent: [number, number]  // [min, max] zoom levels
    translateExtent?: [[number, number], [number, number]]  // Bounds
  }
  pan: {
    enabled: boolean
    mouseButton: 0 | 1 | 2  // Left, middle, right
    elastic: boolean  // Rubber-band effect at edges
  }
}

class EnhancedZoomPanPlugin implements ChartPlugin {
  id = 'enhanced-zoom-pan'
  private zoom?: d3.ZoomBehavior<Element, unknown>
  private currentTransform: d3.ZoomTransform = d3.zoomIdentity
  
  constructor(private config: ZoomPanConfig) {}
  
  install(chart: ChartManager): void {
    const container = chart.getContainer()
    if (!container) return
    
    this.zoom = d3.zoom()
      .scaleExtent(this.config.zoom.scaleExtent)
      .on('zoom', (event) => this.handleZoom(event, chart))
      .on('end', (event) => this.handleZoomEnd(event, chart))
    
    if (this.config.zoom.wheel) {
      this.zoom.wheelDelta((event) => {
        return -event.deltaY * (event.deltaMode === 1 ? 0.05 : event.deltaMode ? 1 : 0.002)
      })
    }
    
    d3.select(container).call(this.zoom as any)
    
    // Add double-click reset
    if (this.config.zoom.doubleClick) {
      container.addEventListener('dblclick', () => this.resetZoom(chart))
    }
  }
  
  private handleZoom(event: d3.D3ZoomEvent<Element, unknown>, chart: ChartManager): void {
    this.currentTransform = event.transform
    
    // Update scales
    const xScale = chart.getScale('time-x')
    const yScale = chart.getScale('value-y')
    
    if (xScale && yScale) {
      // Apply transform to scales
      const newXScale = event.transform.rescaleX(xScale as any)
      const newYScale = event.transform.rescaleY(yScale as any)
      
      // Update chart with new scales
      chart.updateScales({ 'time-x': newXScale, 'value-y': newYScale })
      
      // Debounced re-render
      this.debouncedRender(chart)
    }
  }
  
  private debouncedRender = debounce((chart: ChartManager) => {
    chart.render()
  }, 16) // 60fps
  
  private resetZoom(chart: ChartManager): void {
    const container = chart.getContainer()
    if (!container || !this.zoom) return
    
    d3.select(container)
      .transition()
      .duration(300)
      .call(this.zoom.transform as any, d3.zoomIdentity)
  }
  
  uninstall(chart: ChartManager): void {
    const container = chart.getContainer()
    if (container && this.zoom) {
      d3.select(container).on('.zoom', null)
    }
  }
}
```

#### 10. StreamingDataManager (New Component)

Manages real-time data streaming with circular buffer:

```typescript
interface StreamingConfig {
  maxPoints: number
  updateInterval: number  // ms between renders
  aggregation?: 'none' | 'average' | 'min' | 'max'
  windowSize?: number  // Fixed time window in ms
}

class StreamingDataManager {
  private buffer: CircularBuffer<ChartDataPoint>
  private updateTimer?: number
  private pendingPoints: ChartDataPoint[] = []
  
  constructor(
    private config: StreamingConfig,
    private onUpdate: (points: ChartDataPoint[]) => void
  ) {
    this.buffer = new CircularBuffer(config.maxPoints)
  }
  
  appendData(points: ChartDataPoint[]): void {
    this.pendingPoints.push(...points)
    
    if (!this.updateTimer) {
      this.scheduleUpdate()
    }
  }
  
  private scheduleUpdate(): void {
    this.updateTimer = window.setTimeout(() => {
      this.flush()
      this.updateTimer = undefined
    }, this.config.updateInterval)
  }
  
  private flush(): void {
    if (this.pendingPoints.length === 0) return
    
    // Apply aggregation if needed
    const points = this.config.aggregation !== 'none'
      ? this.aggregate(this.pendingPoints)
      : this.pendingPoints
    
    // Add to buffer
    points.forEach(p => this.buffer.push(p))
    
    // Get visible window
    const visiblePoints = this.getVisibleWindow()
    
    // Notify listeners
    this.onUpdate(visiblePoints)
    
    // Clear pending
    this.pendingPoints = []
  }
  
  private aggregate(points: ChartDataPoint[]): ChartDataPoint[] {
    // Group by time bucket and aggregate
    const buckets = new Map<number, ChartDataPoint[]>()
    
    points.forEach(p => {
      const bucket = Math.floor((p.x as Date).getTime() / 1000) * 1000
      if (!buckets.has(bucket)) {
        buckets.set(bucket, [])
      }
      buckets.get(bucket)!.push(p)
    })
    
    return Array.from(buckets.entries()).map(([time, pts]) => ({
      x: new Date(time),
      y: this.aggregateValues(pts.map(p => p.y))
    }))
  }
  
  private aggregateValues(values: number[]): number {
    switch (this.config.aggregation) {
      case 'average':
        return values.reduce((a, b) => a + b, 0) / values.length
      case 'min':
        return Math.min(...values)
      case 'max':
        return Math.max(...values)
      default:
        return values[values.length - 1]
    }
  }
  
  private getVisibleWindow(): ChartDataPoint[] {
    if (!this.config.windowSize) {
      return this.buffer.toArray()
    }
    
    const now = Date.now()
    const cutoff = now - this.config.windowSize
    
    return this.buffer.toArray().filter(p => 
      (p.x as Date).getTime() >= cutoff
    )
  }
}

class CircularBuffer<T> {
  private buffer: T[]
  private head = 0
  private size = 0
  
  constructor(private capacity: number) {
    this.buffer = new Array(capacity)
  }
  
  push(item: T): void {
    this.buffer[this.head] = item
    this.head = (this.head + 1) % this.capacity
    this.size = Math.min(this.size + 1, this.capacity)
  }
  
  toArray(): T[] {
    if (this.size < this.capacity) {
      return this.buffer.slice(0, this.size)
    }
    return [
      ...this.buffer.slice(this.head),
      ...this.buffer.slice(0, this.head)
    ]
  }
}
```


## Data Models

### Enhanced Type Definitions

```typescript
// Extend existing types
interface ChartConfig {
  // Existing properties preserved
  width: number
  height: number
  margin: Margin
  localization: LocalizationConfig
  animation?: AnimationConfig
  accessibility?: AccessibilityConfig
  tooltip?: EnhancedTooltipConfig
  series?: SeriesConfig[]
  axes?: AxisConfig[]
  annotations?: AnnotationConfig[]
  
  // New properties
  theme?: Partial<ChartTheme>
  legend?: LegendConfig
  crosshair?: CrosshairConfig
  responsive?: ResponsiveConfig
  performance?: PerformanceConfig
  streaming?: StreamingConfig
}

interface ResponsiveConfig {
  enabled: boolean
  debounce: number  // ms
  breakpoints?: {
    mobile: number
    tablet: number
    desktop: number
  }
  adaptiveMargins: boolean
  adaptiveTicks: boolean
}

interface PerformanceConfig {
  canvasThreshold: number  // Point count to switch to canvas
  progressiveRender: boolean
  lazyRender: boolean  // For off-screen charts
  debounceResize: number
  throttleEvents: number
}

// Export options
interface ExportOptions {
  format: 'png' | 'svg'
  scale: 1 | 2 | 3  // DPI multiplier
  background?: string
  includeTooltips?: boolean
  width?: number
  height?: number
}

// Event system
type ChartEvent = 
  | 'pointClick'
  | 'pointHover'
  | 'seriesToggle'
  | 'zoomChange'
  | 'dataUpdate'
  | 'themeChange'
  | 'resize'

interface ChartEventData {
  pointClick: { point: ChartDataPoint, series: SeriesConfig }
  pointHover: { point: ChartDataPoint | null, series: SeriesConfig | null }
  seriesToggle: { seriesId: string, visible: boolean }
  zoomChange: { transform: d3.ZoomTransform }
  dataUpdate: { seriesId: string, points: ChartDataPoint[] }
  themeChange: { theme: ChartTheme }
  resize: { width: number, height: number }
}

type EventHandler<T extends ChartEvent> = (data: ChartEventData[T]) => void
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of the system. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Visual Polish Properties

**Property 1: Default Color Palette Application**
*For any* chart configuration without explicit colors, the Chart_Manager should apply the refined color palette (#0ea5e9, #8b5cf6, #10b981, #f59e0b, #ef4444) in sequence to series, and area fills should have 20% opacity.
**Validates: Requirements 1.1**

**Property 2: Axis Default Styling**
*For any* axis configuration without explicit styles, the Axis_Renderer should apply muted baseline colors (rgba(15, 23, 42, 0.08)), soft tick text (#64748b), and subtle grid lines (rgba(15, 23, 42, 0.04)).
**Validates: Requirements 1.2**

**Property 3: Line Series Anti-aliasing**
*For any* line series, the rendered SVG path should have shape-rendering="geometricPrecision", stroke-linecap="round", and default stroke-width of 2px.
**Validates: Requirements 1.3**

**Property 4: Marker Default Styling**
*For any* series with markers enabled, each marker circle should have radius 4px, stroke-width 2px, stroke color white, and filter attribute for drop shadow.
**Validates: Requirements 1.4**

**Property 5: Transition Timing**
*For any* state transition (data update, zoom, theme change), the animation duration should be 300ms with cubic-bezier(0.4, 0, 0.2, 1) easing.
**Validates: Requirements 1.5**

**Property 6: Tooltip Styling**
*For any* tooltip element, the computed styles should include border-radius 8px, box-shadow matching design tokens, padding 12px, and font-family Inter.
**Validates: Requirements 1.6**

### Performance Properties

**Property 7: Canvas Fallback Threshold**
*For any* series with data point count > 10,000, the Series_Renderer should use canvas-based rendering instead of SVG.
**Validates: Requirements 2.1**

**Property 8: Progressive Rendering**
*For any* zoom operation that reduces visible range, only data points within the visible domain should be rendered.
**Validates: Requirements 2.2**

**Property 9: Curve Algorithm Selection**
*For any* line series, if point count > 5000, the curve should be curveLinear; otherwise curveMonotoneX for smooth appearance.
**Validates: Requirements 2.3**

**Property 10: DOM Element Reuse**
*For any* data update operation, existing DOM elements should be updated rather than removed and recreated (D3 enter/update/exit pattern).
**Validates: Requirements 2.4**

**Property 11: Gradient Fill Opacity**
*For any* area series with gradient fill, the gradient should have stop at 0% with 40% opacity and stop at 100% with 0% opacity.
**Validates: Requirements 2.5**

**Property 12: Z-Index Layering**
*For any* chart with multiple series, the DOM order should be: grid lines → area fills → line paths → markers → crosshair → tooltips.
**Validates: Requirements 2.6**

### Interactivity Properties

**Property 13: Crosshair Rendering**
*For any* hover event over the chart area, vertical and horizontal crosshair lines should be rendered with stroke-width 1px, stroke rgba(100, 116, 139, 0.4), and stroke-dasharray "4 4".
**Validates: Requirements 3.1**

**Property 14: Point Highlighting**
*For any* crosshair position, the nearest point on each visible series should be highlighted with a circle of radius 6px and glow filter.
**Validates: Requirements 3.2**

**Property 15: Shared Tooltip Content**
*For any* shared tooltip display, the content should include a formatted timestamp header and series values sorted by magnitude with color indicators.
**Validates: Requirements 3.3**

**Property 16: Tooltip Boundary Detection**
*For any* tooltip position that would exceed viewport bounds, the tooltip should be repositioned to remain fully visible.
**Validates: Requirements 3.4, 3.5**

**Property 17: Tooltip Value Sorting**
*For any* multi-series tooltip, values should be sorted in descending order by magnitude.
**Validates: Requirements 3.6**

### Axis Properties

**Property 18: Responsive Tick Density**
*For any* axis width change, the tick count should adjust to maintain 60-80px spacing between ticks.
**Validates: Requirements 4.1**

**Property 19: Intelligent Date Formatting**
*For any* time axis, the format should be: hours for ranges < 1 day, days for < 1 month, months for < 1 year, years for longer ranges.
**Validates: Requirements 4.2**

**Property 20: SI Prefix Formatting**
*For any* value axis, numbers >= 1B should use "B" suffix, >= 1M should use "M", >= 1K should use "K", with appropriate decimal places.
**Validates: Requirements 4.3**

**Property 21: Grid Line Z-Order**
*For any* chart with grid lines enabled, grid line elements should be first children of the chart group with opacity 0.6.
**Validates: Requirements 4.4**

**Property 22: Style Merging**
*For any* axis with partial style overrides, the final computed style should merge user styles with defaults, not replace them.
**Validates: Requirements 4.5**


### Zoom/Pan Properties

**Property 23: Zoom Scale Factor**
*For any* mouse wheel scroll event, the zoom scale should change by factor of 1.2 centered on cursor position.
**Validates: Requirements 5.1**

**Property 24: Pan Domain Update**
*For any* drag event, the axis domains should update in real-time to reflect the translation.
**Validates: Requirements 5.2**

**Property 25: Render Debouncing**
*For any* sequence of zoom/pan events, re-renders should be debounced to maximum 60fps (16ms intervals).
**Validates: Requirements 5.3**

**Property 26: Adaptive Tick Density During Zoom**
*For any* zoom level change, the tick count should adjust to maintain readability at the new scale.
**Validates: Requirements 5.4**

**Property 27: Elastic Pan Resistance**
*For any* pan operation beyond data bounds, the translation should apply resistance proportional to distance from edge.
**Validates: Requirements 5.5**

### Marker Interaction Properties

**Property 28: Marker Hover Animation**
*For any* marker hover event, the radius should transition from 4px to 6px over 300ms.
**Validates: Requirements 6.1**

**Property 29: Marker Glow Effect**
*For any* hovered marker, a glow filter should be applied with blur radius 8px and color matching series at 60% opacity.
**Validates: Requirements 6.2**

**Property 30: Point Click Events**
*For any* marker click, a 'pointClick' event should be emitted with point data and series metadata.
**Validates: Requirements 6.3**

**Property 31: Marker Collision Detection**
*For any* series with dense markers (spacing < 10px), only non-overlapping markers should be rendered.
**Validates: Requirements 6.4**

**Property 32: Dynamic Marker Creation**
*For any* hover near a line without markers, a temporary marker should appear at the nearest data point.
**Validates: Requirements 6.5**

**Property 33: Series Highlighting**
*For any* series hover, the hovered series should remain at 100% opacity while others dim to 40%.
**Validates: Requirements 6.6**

### Gradient and Pattern Properties

**Property 34: Linear Gradient Definition**
*For any* area series, a linear gradient should be created from series color at top to transparent at bottom.
**Validates: Requirements 7.1**

**Property 35: Gradient Caching**
*For any* series with gradient, the gradient definition should be cached and reused across renders.
**Validates: Requirements 7.5**

**Property 36: Gradient Update Without Re-render**
*For any* series color change, only the gradient definition should be updated, not the entire chart.
**Validates: Requirements 7.6**

### Legend Properties

**Property 37: Legend Rendering**
*For any* chart with multiple series, a legend should be rendered with series names and color indicators.
**Validates: Requirements 9.1**

**Property 38: Legend Toggle Animation**
*For any* legend item click, the series visibility should toggle with 300ms fade animation.
**Validates: Requirements 9.2**

**Property 39: Legend Hover Highlighting**
*For any* legend item hover, the corresponding series should be highlighted and others dimmed.
**Validates: Requirements 9.3**

**Property 40: Hidden Series Styling**
*For any* hidden series, the legend item should display at 50% opacity with text-decoration line-through.
**Validates: Requirements 9.6**

### Responsive Properties

**Property 41: Resize Debouncing**
*For any* container resize event, the chart re-render should be debounced to 150ms.
**Validates: Requirements 10.1**

**Property 42: Constrained Width Adaptation**
*For any* chart width < 400px, margins should reduce by 50% and tick density should decrease.
**Validates: Requirements 10.2**

**Property 43: Mobile Touch Targets**
*For any* viewport width < 768px, interactive elements (markers, legend items) should have minimum 44px touch targets.
**Validates: Requirements 10.5**

**Property 44: ResizeObserver Usage**
*For any* browser supporting ResizeObserver, it should be used instead of window resize events.
**Validates: Requirements 10.6**

### Accessibility Properties

**Property 45: ARIA Live Region**
*For any* chart render, an ARIA live region should be created with data summary text.
**Validates: Requirements 11.1**

**Property 46: Keyboard Navigation**
*For any* focused chart, Tab should focus the chart, Arrow keys should navigate points, Enter should activate.
**Validates: Requirements 11.2**

**Property 47: Screen Reader Announcements**
*For any* focused data point, the point value and series name should be announced via aria-label.
**Validates: Requirements 11.3**

**Property 48: Tooltip ARIA Association**
*For any* visible tooltip, it should be associated with the focused element via aria-describedby.
**Validates: Requirements 11.5**

### Streaming Properties

**Property 49: Sliding Window**
*For any* appendData call with fixed window size, old points should be removed to maintain window size.
**Validates: Requirements 15.1**

**Property 50: Render Rate Limiting**
*For any* streaming data, renders should be throttled to maximum 30fps (33ms intervals).
**Validates: Requirements 15.2**

**Property 51: Data Aggregation**
*For any* data rate exceeding render capacity, points should be aggregated using configured strategy (average, min, max).
**Validates: Requirements 15.3**

**Property 52: Circular Buffer Management**
*For any* buffer exceeding maxPoints limit, oldest points should be removed in FIFO order.
**Validates: Requirements 15.6**

## Error Handling

### Validation Errors

```typescript
class ChartValidationError extends Error {
  constructor(
    message: string,
    public field: string,
    public value: any
  ) {
    super(message)
    this.name = 'ChartValidationError'
  }
}

function validateChartConfig(config: ChartConfig): void {
  if (config.width <= 0 || config.height <= 0) {
    throw new ChartValidationError(
      'Chart dimensions must be positive',
      'width/height',
      { width: config.width, height: config.height }
    )
  }
  
  if (config.series && config.series.length === 0) {
    throw new ChartValidationError(
      'At least one series is required',
      'series',
      config.series
    )
  }
  
  // Validate theme if provided
  if (config.theme) {
    validateTheme(config.theme)
  }
}
```

### Runtime Errors

```typescript
class ChartRenderError extends Error {
  constructor(
    message: string,
    public cause?: Error
  ) {
    super(message)
    this.name = 'ChartRenderError'
  }
}

// Graceful degradation for canvas fallback
function safeRenderToCanvas(
  series: SeriesConfig,
  canvas: HTMLCanvasElement
): void {
  try {
    renderToCanvas(series, canvas)
  } catch (error) {
    console.warn('Canvas rendering failed, falling back to SVG', error)
    // Fallback to SVG rendering
    renderToSVG(series, createSVGContainer())
  }
}
```

### Export Errors

```typescript
async function safeExportToPNG(
  chart: ChartManager,
  options: ExportOptions
): Promise<string> {
  try {
    return await exportToPNG(chart, options)
  } catch (error) {
    console.error('PNG export failed', error)
    
    // Fallback to clipboard copy
    try {
      const svg = exportToSVG(chart, options)
      await navigator.clipboard.writeText(svg)
      throw new Error('PNG export failed. SVG copied to clipboard instead.')
    } catch (clipboardError) {
      throw new Error('Export failed and clipboard fallback unavailable.')
    }
  }
}
```


## Testing Strategy

### Dual Testing Approach

This refactoring will employ both unit tests and property-based tests to ensure comprehensive coverage:

**Unit Tests** focus on:
- Specific examples demonstrating correct behavior
- Edge cases (empty data, single point, boundary values)
- Error conditions and validation
- Integration points between components
- Browser compatibility

**Property-Based Tests** focus on:
- Universal properties that hold for all inputs
- Comprehensive input coverage through randomization
- Performance characteristics across data sizes
- Visual consistency across configurations

### Property-Based Testing Configuration

**Framework**: fast-check (for TypeScript/JavaScript)

**Configuration**:
- Minimum 100 iterations per property test
- Each test references its design document property
- Tag format: `Feature: charts-core-production-refactor, Property {number}: {property_text}`

**Example Property Test**:
```typescript
import fc from 'fast-check'
import { describe, it, expect } from 'vitest'
import { ChartManager } from '../src/core/chart'

describe('Visual Polish Properties', () => {
  /**
   * Feature: charts-core-production-refactor
   * Property 1: Default Color Palette Application
   */
  it('should apply refined color palette to series without explicit colors', () => {
    fc.assert(
      fc.property(
        fc.array(fc.record({
          x: fc.date(),
          y: fc.float({ min: 0, max: 1000 })
        }), { minLength: 10, maxLength: 100 }),
        fc.integer({ min: 1, max: 5 }),
        (data, seriesCount) => {
          const expectedColors = ['#0ea5e9', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444']
          
          const config = {
            width: 800,
            height: 400,
            margin: { top: 20, right: 20, bottom: 40, left: 50 },
            localization: { locale: 'en-US' },
            series: Array.from({ length: seriesCount }, (_, i) => ({
              type: 'line' as const,
              data,
              xAccessor: (d: any) => d.x,
              yAccessor: (d: any) => d.y,
              // No color specified - should use default palette
            })),
            axes: [
              { id: 'x', orient: 'bottom' as const, scale: 'x' },
              { id: 'y', orient: 'left' as const, scale: 'y' }
            ]
          }
          
          const chart = new ChartManager(config)
          const container = document.createElement('div')
          container.id = 'test-chart'
          document.body.appendChild(container)
          
          chart.render('#test-chart')
          
          // Verify colors are applied from palette
          const paths = container.querySelectorAll('path[stroke]')
          paths.forEach((path, index) => {
            const stroke = path.getAttribute('stroke')
            const expectedColor = expectedColors[index % expectedColors.length]
            expect(stroke).toBe(expectedColor)
          })
          
          // Verify area opacity
          const areas = container.querySelectorAll('path[fill]')
          areas.forEach(area => {
            const opacity = area.getAttribute('opacity')
            expect(parseFloat(opacity || '1')).toBeCloseTo(0.4, 1)
          })
          
          chart.destroy()
          document.body.removeChild(container)
        }
      ),
      { numRuns: 100 }
    )
  })
  
  /**
   * Feature: charts-core-production-refactor
   * Property 2: Axis Default Styling
   */
  it('should apply muted default styles to axes', () => {
    fc.assert(
      fc.property(
        fc.array(fc.record({
          x: fc.date(),
          y: fc.float({ min: 0, max: 1000 })
        }), { minLength: 10, maxLength: 100 }),
        (data) => {
          const config = {
            width: 800,
            height: 400,
            margin: { top: 20, right: 20, bottom: 40, left: 50 },
            localization: { locale: 'en-US' },
            series: [{
              type: 'line' as const,
              data,
              xAccessor: (d: any) => d.x,
              yAccessor: (d: any) => d.y
            }],
            axes: [
              { id: 'x', orient: 'bottom' as const, scale: 'x' },
              { id: 'y', orient: 'left' as const, scale: 'y' }
            ]
          }
          
          const chart = new ChartManager(config)
          const container = document.createElement('div')
          container.id = 'test-chart'
          document.body.appendChild(container)
          
          chart.render('#test-chart')
          
          // Verify axis line colors
          const axisLines = container.querySelectorAll('.charts-core-axis path')
          axisLines.forEach(line => {
            const stroke = line.getAttribute('stroke')
            expect(stroke).toBe('rgba(15, 23, 42, 0.08)')
          })
          
          // Verify tick text colors
          const tickTexts = container.querySelectorAll('.charts-core-axis text')
          tickTexts.forEach(text => {
            const fill = text.getAttribute('fill')
            expect(fill).toBe('#64748b')
          })
          
          // Verify grid line colors
          const gridLines = container.querySelectorAll('.charts-core-grid line')
          gridLines.forEach(line => {
            const stroke = line.getAttribute('stroke')
            expect(stroke).toBe('rgba(15, 23, 42, 0.04)')
          })
          
          chart.destroy()
          document.body.removeChild(container)
        }
      ),
      { numRuns: 100 }
    )
  })
})
```

### Unit Test Examples

```typescript
describe('ChartManager', () => {
  it('should throw validation error for negative dimensions', () => {
    expect(() => {
      new ChartManager({
        width: -100,
        height: 400,
        margin: { top: 0, right: 0, bottom: 0, left: 0 },
        localization: { locale: 'en-US' }
      })
    }).toThrow(ChartValidationError)
  })
  
  it('should handle empty data gracefully', () => {
    const config = {
      width: 800,
      height: 400,
      margin: { top: 20, right: 20, bottom: 40, left: 50 },
      localization: { locale: 'en-US' },
      series: [{
        type: 'line' as const,
        data: [],
        xAccessor: (d: any) => d.x,
        yAccessor: (d: any) => d.y
      }],
      axes: [
        { id: 'x', orient: 'bottom' as const, scale: 'x' },
        { id: 'y', orient: 'left' as const, scale: 'y' }
      ]
    }
    
    const chart = new ChartManager(config)
    const container = document.createElement('div')
    container.id = 'test-chart'
    document.body.appendChild(container)
    
    expect(() => chart.render('#test-chart')).not.toThrow()
    
    chart.destroy()
    document.body.removeChild(container)
  })
  
  it('should export to PNG with correct scale factor', async () => {
    const chart = createTestChart()
    const png = await chart.exportToPNG({ format: 'png', scale: 2 })
    
    expect(png).toMatch(/^data:image\/png;base64,/)
    
    // Verify dimensions are doubled
    const img = new Image()
    img.src = png
    await new Promise(resolve => img.onload = resolve)
    
    expect(img.width).toBe(1600) // 800 * 2
    expect(img.height).toBe(800)  // 400 * 2
  })
})

describe('ThemeManager', () => {
  it('should merge partial theme with defaults', () => {
    const themeManager = new ThemeManager()
    
    themeManager.applyTheme({
      colors: {
        series: ['#custom1', '#custom2']
      }
    })
    
    const theme = themeManager.getTheme()
    
    // Custom colors applied
    expect(theme.colors.series).toEqual(['#custom1', '#custom2'])
    
    // Defaults preserved
    expect(theme.typography.fontFamily).toBe('Inter, system-ui, sans-serif')
    expect(theme.animation.duration).toBe(300)
  })
})
```

### Performance Benchmarks

```typescript
describe('Performance', () => {
  it('should render 1000 points in < 100ms', () => {
    const data = generateTimeSeriesData(1000)
    const chart = createTestChart({ data })
    
    const start = performance.now()
    chart.render('#test-chart')
    const duration = performance.now() - start
    
    expect(duration).toBeLessThan(100)
  })
  
  it('should use canvas for 10000+ points', () => {
    const data = generateTimeSeriesData(10000)
    const chart = createTestChart({ data })
    
    chart.render('#test-chart')
    
    const canvas = document.querySelector('canvas')
    expect(canvas).toBeTruthy()
  })
  
  it('should debounce zoom events to 60fps', async () => {
    const chart = createTestChart()
    const plugin = new EnhancedZoomPanPlugin({
      zoom: { enabled: true, wheel: true, scaleExtent: [1, 10] },
      pan: { enabled: true, mouseButton: 0, elastic: true }
    })
    
    chart.use(plugin)
    chart.render('#test-chart')
    
    let renderCount = 0
    const originalRender = chart.render.bind(chart)
    chart.render = () => {
      renderCount++
      originalRender()
    }
    
    // Simulate 100 rapid zoom events
    for (let i = 0; i < 100; i++) {
      simulateWheelEvent(chart.getContainer()!, { deltaY: -100 })
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Should have debounced to ~60 renders (60fps)
    expect(renderCount).toBeLessThan(70)
  })
})
```

### Visual Regression Testing

```typescript
describe('Visual Regression', () => {
  it('should match snapshot for default theme', async () => {
    const chart = createTestChart()
    chart.render('#test-chart')
    
    const svg = chart.exportToSVG()
    expect(svg).toMatchSnapshot()
  })
  
  it('should match snapshot for dark theme', async () => {
    const chart = createTestChart()
    chart.setTheme(darkTheme)
    chart.render('#test-chart')
    
    const svg = chart.exportToSVG()
    expect(svg).toMatchSnapshot()
  })
})
```

### Test Coverage Goals

- **Overall Coverage**: > 90%
- **Core Components**: > 95% (ChartManager, ThemeManager, RenderStrategy)
- **Utilities**: > 85% (formatters, validators, helpers)
- **Property Tests**: All 52 correctness properties implemented
- **Unit Tests**: All edge cases and error conditions covered
- **Integration Tests**: All component interactions tested
- **Visual Regression**: Key visual states captured

