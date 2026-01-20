# @web-loom/charts-core Product Requirements Document

## 1. Overview

### 1.1 Product Vision

`@web-loom/charts-core` is a framework-agnostic, configuration-based charting library built on D3.js, designed to seamlessly integrate with any modern JavaScript/TypeScript framework. It provides a modular, tree-shakable architecture for creating interactive, accessible data visualizations with a focus on performance and developer experience.

### 1.2 Goals

- Create a lightweight, performant charting solution that works across all modern frameworks
- Provide a configuration-based API similar to Chart.js but with D3's power and flexibility
- Support extensible modular architecture for future chart types
- Focus on MVP: Line graphs with time series, multiple axes, and annotations
- Ensure TypeScript-first development with excellent type safety

## 2. Technical Specifications

### 2.1 Core Technologies

- **D3.js**: Primary rendering engine (v7+)
- **TypeScript**: Primary development language
- **Vite**: Build tool and development server
- **Vitest**: Testing framework
- **ES Modules**: Tree-shakable architecture
- **Storybook**: To document app

### 2.2 Framework Compatibility

- React (via custom hooks/components)
- Vue (via composables/components)
- Angular (via services/directives)
- Svelte (via stores/components)
- Vanilla JavaScript/TypeScript

### 2.3 Package Structure

```
@web-loom/charts-core/
├── src/
│   ├── core/
│   │   ├── chart.ts              # Base chart class
│   │   ├── types.ts              # Core TypeScript definitions
│   │   ├── utils.ts              # Shared utilities
│   │   └── events.ts             # Event handling system
│   ├── scales/                   # Scale implementations
│   ├── axes/                     # Axis components
│   ├── series/                   # Data series (line, area, etc.)
│   ├── tooltips/                 # Tooltip system
│   ├── annotations/              # Annotations system
│   └── plugins/                  # Plugin architecture
├── dist/
│   ├── esm/                      # ES Modules
│   ├── cjs/                      # CommonJS
│   └── types/                    # TypeScript definitions
└── package.json
```

## 3. MVP Requirements

### 3.1 Core Features

#### 3.1.1 Line Graphs / Time Series

- Date-based x-axis with automatic formatting
- Multiple y-axes support (left/right)
- Area charts with shared areas
- Smooth line interpolation options
- Data point markers with customization

#### 3.1.2 Configuration System

```typescript
interface ChartConfig {
  width: number;
  height: number;
  margin: Margin;
  localization: LocalizationConfig;
  animation: AnimationConfig;
  accessibility: AccessibilityConfig;
}
```

#### 3.1.3 Localization Support

- Date formatting (via date-fns or similar)
- Number formatting
- RTL support
- Custom locale configurations

#### 3.1.4 Tooltip System

- Hover-based tooltips
- Multi-series data display
- Custom formatters
- Positioning strategies (follow cursor, fixed, etc.)

#### 3.1.5 SVG Icons & Annotations

- Custom SVG markers
- Icon tooltips with hover states
- Framework-agnostic component integration
- Annotation layers with z-index management

### 3.2 API Design

#### 3.2.1 Modular Imports

```typescript
// Tree-shakable imports
import { createChart } from '@web-loom/charts-core';
import { LineSeries } from '@web-loom/charts-core/series';
import { TimeAxis, LinearAxis } from '@web-loom/charts-core/axes';
import { Tooltip } from '@web-loom/charts-core/tooltips';
import { AnnotationLayer } from '@web-loom/charts-core/annotations';
```

#### 3.2.2 Configuration-Based API

```typescript
const chart = createChart({
  container: '#chart-container',
  width: 800,
  height: 400,
  series: [
    {
      type: 'line',
      data: timeSeriesData,
      xScale: 'time',
      yScale: 'linear',
      area: true,
      color: '#2196f3',
    },
  ],
  axes: {
    x: {
      type: 'time',
      title: 'Date',
      format: 'MMM dd, yyyy',
    },
    y: {
      type: 'linear',
      title: 'Value',
      position: 'left',
    },
  },
  tooltip: {
    enabled: true,
    format: (point) => `${point.x}: ${point.y}`,
  },
});
```

#### 3.2.3 Imperative API (for framework integrations)

```typescript
const chart = new Chart('#chart-container', { width: 800, height: 400 });

chart.addScale('x', d3.scaleTime());
chart.addScale('y', d3.scaleLinear());

chart.addAxis('x', {
  scale: 'x',
  orient: 'bottom',
});

chart.addSeries(LineSeries, {
  data: timeSeriesData,
  x: 'x',
  y: 'y',
});

chart.render();
```

## 4. Architecture Design

### 4.1 Core Components

#### 4.1.1 Chart Manager

```typescript
class ChartManager {
  private scales: Map<string, d3.Scale>;
  private series: Series[];
  private axes: Axis[];
  private annotations: Annotation[];
  private tooltips: TooltipManager;

  constructor(config: ChartConfig) {}

  addScale(id: string, scale: d3.Scale): void;
  addSeries(series: SeriesConfig): void;
  addAxis(axis: AxisConfig): void;
  addAnnotation(annotation: AnnotationConfig): void;
  render(): void;
  update(data: ChartData): void;
  destroy(): void;
}
```

#### 4.1.2 Series System

```typescript
abstract class Series {
  abstract render(container: d3.Selection): void;
  abstract update(data: any[]): void;
  abstract getTooltipData(point: [number, number]): TooltipData;
}

class LineSeries extends Series {
  private config: LineSeriesConfig;

  render(container: d3.Selection): void {
    // D3-based line rendering
  }
}
```

#### 4.1.3 Scale Registry

```typescript
class ScaleRegistry {
  private scales: Map<string, d3.Scale>;

  register(id: string, scale: d3.Scale): void;
  get(id: string): d3.Scale;
  updateDomain(id: string, domain: [any, any]): void;
  updateRange(id: string, range: [number, number]): void;
}
```

### 4.2 Plugin System

```typescript
interface ChartPlugin {
  id: string;
  install(chart: ChartManager): void;
  uninstall(chart: ChartManager): void;
}

class ZoomPlugin implements ChartPlugin {
  install(chart: ChartManager) {
    // Add zoom behavior
  }
}
```

## 5. Implementation Details

### 5.1 D3 Integration Strategy

- Use D3 for scales, axes, and data joins
- Implement custom rendering for performance optimization
- Leverage D3's enter/update/exit pattern
- Create abstraction layer for framework independence

### 5.2 TypeScript Definitions

```typescript
interface ChartDataPoint {
  x: Date | number;
  y: number;
  [key: string]: any;
}

interface SeriesConfig {
  type: 'line' | 'area' | 'scatter';
  data: ChartDataPoint[];
  xAccessor: (d: ChartDataPoint) => Date | number;
  yAccessor: (d: ChartDataPoint) => number;
  color?: string;
  strokeWidth?: number;
  area?: boolean;
}

interface AxisConfig {
  scale: string;
  orient: 'top' | 'bottom' | 'left' | 'right';
  title?: string;
  format?: (value: any) => string;
  ticks?: number;
  visible?: boolean;
  style?: {
    axisColor?: string;
    axisWidth?: number;
    tickColor?: string;
    tickFont?: string;
    tickFontSize?: number;
    gridColor?: string;
    gridWidth?: number;
    gridDash?: string;
  };
}

#### 3.1.6 Axis styling & visibility (Chart.js inspired)

- Provide axis defaults that mirror the polished feel of Chart.js 4: thin, muted baselines (`rgba(13, 18, 44, 0.08)`), soft tick text (`#6b7280`), and a subtle background grid (`rgba(15, 23, 42, 0.05)`) so the axes stay supportive without dominating the data.
- Offer boolean `visible` on `AxisConfig` so a chart can omit a particular axis entirely (a frequent requirement for minimal dashboards). When `visible` is false, skip all DOM layers and even tooltip alignment/extent calculations that depend on the axis.
- Support `style` overrides per axis to adjust colors, stroke widths, font stack, and dashed grid lines so applications can mimic Chart.js themes or custom brand tokens. These settings should flow through to both D3 renderers and builder helpers (tip: default to `tickFont: 'Inter, system-ui, sans-serif'` and `gridDash: '4 4'`).
- Document how axes inherit Chart.js-like defaults but can be swapped out by passing fully custom `AxisConfig` styling; encourage layering of the default palette with `chart.use` plugin decorators for hover/tick emphasis if needed.
```

### 5.3 SVG Icon Integration

```typescript
interface IconConfig {
  x: number | Date;
  y: number;
  icon: string | SVGElement | ComponentFactory;
  size?: number;
  tooltip?: string | TooltipConfig;
  onClick?: (event: MouseEvent, data: any) => void;
}

// Framework-agnostic component factory
type ComponentFactory = (
  container: HTMLElement,
  props: any,
) => {
  update?: (props: any) => void;
  destroy?: () => void;
};
```

## 6. Framework Integration

### 6.1 React Adapter Example

```typescript
// @web-loom/charts-react (separate package)
import { useChart } from '@web-loom/charts-react';

function LineChart({ data, config }) {
  const { ref } = useChart({
    type: 'line',
    data,
    ...config
  });

  return <div ref={ref} />;
}
```

### 6.2 Vue Adapter Example

```typescript
// @web-loom/charts-vue (separate package)
import { useChart } from '@web-loom/charts-vue';

export default {
  setup(props) {
    const chartRef = useChart({
      type: 'line',
      data: props.data,
      ...props.config,
    });

    return { chartRef };
  },
};
```

## 7. Performance Considerations

### 7.1 Rendering Optimization

- Virtual DOM diffing for annotations/tooltips
- Canvas fallback for large datasets
- Debounced resize/redraw operations
- Web Workers for data processing (optional)

### 7.2 Memory Management

- Proper cleanup of D3 selections
- Weak references for event listeners
- Pooling for frequently created objects
- Garbage collection optimization

## 8. Accessibility Requirements

### 8.1 ARIA Support

- Proper role attributes
- ARIA labels for chart elements
- Keyboard navigation
- Screen reader compatibility

### 8.2 Color Accessibility

- Colorblind-friendly palettes
- Sufficient contrast ratios
- Pattern alternatives for monochrome

## 9. Testing Strategy

### 9.1 Unit Tests

- Vitest for unit testing
- Testing utility functions
- Mock D3 where appropriate

### 9.2 Integration Tests

- Framework integration tests
- Cross-browser testing
- Performance benchmarks

### 9.3 Visual Regression

- Screenshot comparisons
- Responsive design testing
- Animation consistency

## 10. Development Roadmap

### Phase 1: Foundation (Weeks 1-2)

- Set up Turbo Repo structure
- Implement core chart manager
- Create scale and axis systems
- Basic line series rendering

### Phase 2: MVP Features (Weeks 3-4)

- Time series support
- Multiple y-axes
- Tooltip system
- Basic annotations

### Phase 3: Polish (Weeks 5-6)

- Localization support
- Accessibility features
- Performance optimization
- Documentation

### Phase 4: Framework Adapters (Weeks 7-8)

- React integration
- Vue integration
- Angular integration
- Example projects

## 11. Non-Goals (Explicitly Out of Scope for MVP)

- Legends
- Pie/Donut charts
- Bar charts
- Histograms
- 3D visualizations
- Real-time streaming (beyond basic updates)
- Export to image/PDF
- Print stylesheets
- Theming system (beyond basic colors)

## 12. Success Metrics

### 12.1 Technical Metrics

- Bundle size: < 50kb gzipped (core)
- Initial render: < 100ms for 1000 points
- FPS: > 60fps during interactions
- Memory usage: < 100MB for large datasets

### 12.2 Developer Experience

- TypeScript coverage: 100%
- API documentation: Complete
- Example coverage: All major use cases
- Framework integration guides

### 12.3 Quality Metrics

- Test coverage: > 90%
- Zero critical bugs in production
- Accessibility compliance: WCAG 2.1 AA
- Browser support: Chrome, Firefox, Safari, Edge (latest 2 versions)

## 13. Dependencies

### 13.1 Peer Dependencies

- d3-scale: ^4.0.0
- d3-axis: ^3.0.0
- d3-shape: ^3.0.0
- d3-selection: ^3.0.0
- date-fns: ^2.30.0 (optional)

### 13.2 Dev Dependencies

- typescript: ^5.0.0
- vite: ^4.0.0
- vitest: ^0.34.0
- @types/d3: ^7.4.0

## 14. Appendix

### 14.1 Example Configurations

```typescript
// Complete MVP example
const mvpConfig = {
  container: '#chart',
  width: 800,
  height: 400,
  margin: { top: 20, right: 30, bottom: 40, left: 50 },
  localization: {
    locale: 'en-US',
    dateFormat: 'MM/dd/yyyy',
    numberFormat: '.2f',
  },
  series: [
    {
      type: 'line',
      data: timeData,
      xScale: 'time',
      yScale: 'linear-left',
      area: true,
      color: '#4CAF50',
      strokeWidth: 2,
    },
    {
      type: 'line',
      data: secondaryData,
      xScale: 'time',
      yScale: 'linear-right',
      area: false,
      color: '#FF9800',
      strokeWidth: 1.5,
    },
  ],
  axes: {
    bottom: {
      type: 'time',
      scale: 'time',
      title: 'Date',
      format: 'MMM yyyy',
    },
    left: {
      type: 'linear',
      scale: 'linear-left',
      title: 'Primary Values',
      position: 'left',
    },
    right: {
      type: 'linear',
      scale: 'linear-right',
      title: 'Secondary Values',
      position: 'right',
    },
  },
  annotations: [
    {
      type: 'icon',
      x: new Date('2023-06-15'),
      y: 150,
      icon: '📌',
      tooltip: 'Important event occurred here',
      size: 20,
    },
  ],
  tooltip: {
    enabled: true,
    shared: true,
    format: (points) => {
      return points.map((p) => `${p.series}: ${p.y}`).join('<br/>');
    },
  },
};
```

### 14.2 Future Extension Points

- Plugin system registration
- Custom series types
- Extended annotation types
- Theme system
- Export functionality
- Server-side rendering support

This PRD provides a comprehensive roadmap for building `@web-loom/charts-core` with a focus on the MVP requirements while establishing a solid foundation for future extensibility. The modular design ensures that the library remains lightweight and tree-shakable while providing powerful visualization capabilities through D3.js.
