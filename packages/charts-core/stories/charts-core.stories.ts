import { ChartManager } from '../src/core/chart';
import { ZoomPanPlugin } from '../src/plugins/zoom-plugin';
import type { ChartConfig } from '../src/core/types';
import type { ChartPlugin } from '../src/core/chart';

const buildConfig = (): ChartConfig => ({
  width: 760,
  height: 420,
  margin: { top: 24, right: 32, bottom: 40, left: 50 },
  localization: { locale: 'en-US', dateFormat: 'MMM dd' },
  axes: [
    { id: 'x-axis', orient: 'bottom', scale: 'time-x' },
    { id: 'y-axis', orient: 'left', scale: 'value-y' },
  ],
  series: [
    {
      type: 'line',
      data: [
        { x: new Date('2024-01-01'), y: 40 },
        { x: new Date('2024-02-01'), y: 48 },
        { x: new Date('2024-03-01'), y: 120 },
        { x: new Date('2024-04-01'), y: 80 },
      ],
      xAccessor: (datum) => datum.x,
      yScale: 'value-y',
      yAccessor: (datum) => datum.y,
      curve: 'monotone',
      marker: { show: true },
      area: false,
    },
  ],
  tooltip: {
    enabled: true,
    shared: true,
    strategy: 'follow',
  },
});

const createStoryHost = (config: ChartConfig, plugin?: () => ChartPlugin, description?: string): HTMLElement => {
  const host = document.createElement('div');
  host.className = 'charts-core-story';
  host.style.display = 'flex';
  host.style.flexDirection = 'column';
  host.style.gap = '0.75rem';
  host.style.maxWidth = '780px';
  host.style.margin = '0 auto';
  host.style.padding = '1rem';
  host.style.background = '#f8fafc';
  host.style.borderRadius = '16px';
  host.style.boxShadow = '0 15px 40px rgba(15, 23, 42, 0.08)';

  const palette = document.createElement('div');
  palette.id = `charts-core-story-${Math.random().toString(16).slice(2)}`;
  palette.style.position = 'relative';
  palette.style.width = '100%';
  palette.style.height = '360px';
  palette.style.background = '#fff';
  palette.style.borderRadius = '12px';
  palette.style.padding = '1rem';
  palette.style.boxSizing = 'border-box';
  host.appendChild(palette);

  if (description) {
    const note = document.createElement('p');
    note.textContent = description;
    note.style.fontSize = '0.9rem';
    note.style.margin = '0';
    note.style.color = '#475467';
    host.appendChild(note);
  }

  document.body.appendChild(host);
  const chart = new ChartManager(config);
  if (plugin) {
    chart.use(plugin());
  }
  chart.render(`#${palette.id}`);
  document.body.removeChild(host);

  return host;
};

export default {
  title: 'Charts/Core/Config-first Demo',
};

export const ConfigFirst = () =>
  createStoryHost(buildConfig(), undefined, 'Config-first layout showing two axes, markers, and shared tooltips.');

export const PluginEnhanced = () =>
  createStoryHost(
    buildConfig(),
    () => new ZoomPanPlugin({ zoomStep: 1.2 }),
    'ZoomPanPlugin intercepts wheel gestures to scale the containing node while the chart remains static.',
  );

export const MultiSeries = () =>
  createStoryHost(
    buildMultiSeriesConfig(),
    undefined,
    'Two line series rendered at once to demonstrate multi-variate config-based charts. Colors are automatically assigned from the theme palette.',
  );

const buildMultiSeriesConfig = (): ChartConfig => {
  const base = buildConfig();
  return {
    ...base,
    series: [
      {
        ...base.series![0],
        id: 'series-1',
        // Color will be auto-assigned from theme: #0ea5e9
      },
      {
        ...base.series![0],
        id: 'series-2',
        // Color will be auto-assigned from theme: #8b5cf6
        data: [
          { x: new Date('2024-01-01'), y: 20 },
          { x: new Date('2024-02-01'), y: 32 },
          { x: new Date('2024-03-01'), y: 60 },
          { x: new Date('2024-04-01'), y: 56 },
        ],
      },
    ],
  };
};

export const StyledAxes = () =>
  createStoryHost(
    buildStyledAxisConfig(),
    undefined,
    'Chart.js inspired axis theming with muted baselines, serif ticks, and soft grid lines.',
  );

export const MinimalAxes = () =>
  createStoryHost(buildMinimalAxisConfig(), undefined, 'Fully hidden axes for charts that need a minimalist canvas.');

const buildStyledAxisConfig = (): ChartConfig => {
  const config = buildConfig();
  const [xAxis, yAxis] = config.axes!.map((axis) => ({ ...axis }));
  config.axes = [
    {
      ...xAxis,
      style: {
        axisColor: 'rgba(15, 23, 42, 0.5)',
        axisWidth: 1.5,
        tickColor: '#0f172a',
        tickFont: 'Inter, system-ui, sans-serif',
        tickFontSize: 14,
        gridColor: 'rgba(14, 165, 233, 0.15)',
        gridWidth: 1,
        gridDash: '5 3',
      },
    },
    {
      ...yAxis,
      style: {
        axisColor: '#0ea5e9',
        tickColor: '#0ea5e9',
        tickFontSize: 13,
        gridColor: 'transparent',
        axisWidth: 1,
        gridWidth: 1,
        gridDash: '2 2',
      },
    },
  ];
  return config;
};

const buildMinimalAxisConfig = (): ChartConfig => {
  const config = buildConfig();
  config.axes = config.axes?.map((axis) => ({
    ...axis,
    visible: false,
  }));
  return config;
};

export const DenseNoAxis = () =>
  createStoryHost(
    buildDenseNoAxisConfig(),
    undefined,
    'Three months of data with axes hidden to showcase a clean, data-first canvas.',
  );

const buildDenseNoAxisConfig = (): ChartConfig => {
  const config = buildConfig();
  config.axes = config.axes?.map((axis) => ({
    ...axis,
    visible: false,
  }));
  config.series = [
    {
      ...config.series![0],
      data: generateTimeSeries(new Date('2024-01-01'), 90),
    },
  ];
  return config;
};

const generateTimeSeries = (start: Date, count: number): { x: Date; y: number }[] => {
  return Array.from({ length: count }, (_, index) => ({
    x: new Date(start.getTime() + index * 24 * 60 * 60 * 1000),
    y: 40 + Math.sin((index / count) * Math.PI * 4) * 24 + Math.cos(index / 3) * 10,
  }));
};

// ============================================================================
// COMPREHENSIVE EXAMPLES
// ============================================================================

export const AreaChart = () =>
  createStoryHost(
    buildAreaChartConfig(),
    undefined,
    'Area chart with gradient fill showing smooth curves and visual polish.',
  );

const buildAreaChartConfig = (): ChartConfig => ({
  width: 760,
  height: 420,
  margin: { top: 24, right: 32, bottom: 40, left: 50 },
  localization: { locale: 'en-US', dateFormat: 'MMM dd' },
  axes: [
    { id: 'x-axis', orient: 'bottom', scale: 'time-x' },
    { id: 'y-axis', orient: 'left', scale: 'value-y' },
  ],
  series: [
    {
      type: 'area',
      id: 'revenue',
      data: generateTimeSeries(new Date('2024-01-01'), 30),
      xAccessor: (datum) => datum.x,
      yAccessor: (datum) => datum.y,
      yScale: 'value-y',
      curve: 'monotone',
      area: true,
      lineWidth: 2,
      color: '#0ea5e9', // Explicitly set color
    },
  ],
  tooltip: {
    enabled: true,
    shared: false,
    strategy: 'follow',
  },
});

export const MultiSeriesWithArea = () =>
  createStoryHost(
    buildMultiSeriesWithAreaConfig(),
    undefined,
    'Multiple series with both line and area charts, demonstrating layering and theme colors.',
  );

const buildMultiSeriesWithAreaConfig = (): ChartConfig => ({
  width: 760,
  height: 420,
  margin: { top: 24, right: 32, bottom: 40, left: 50 },
  localization: { locale: 'en-US', dateFormat: 'MMM dd' },
  axes: [
    { id: 'x-axis', orient: 'bottom', scale: 'time-x' },
    { id: 'y-axis', orient: 'left', scale: 'value-y' },
  ],
  series: [
    {
      type: 'area',
      id: 'baseline',
      data: generateTimeSeries(new Date('2024-01-01'), 60).map(d => ({ ...d, y: d.y * 0.7 })),
      xAccessor: (datum) => datum.x,
      yAccessor: (datum) => datum.y,
      yScale: 'value-y',
      curve: 'monotone',
      area: true,
      lineWidth: 2,
      color: '#0ea5e9',
    },
    {
      type: 'line',
      id: 'target',
      data: generateTimeSeries(new Date('2024-01-01'), 60).map(d => ({ ...d, y: d.y * 1.2 })),
      xAccessor: (datum) => datum.x,
      yAccessor: (datum) => datum.y,
      yScale: 'value-y',
      curve: 'monotone',
      lineWidth: 2,
      marker: { show: true, radius: 3 },
      color: '#8b5cf6',
    },
  ],
  tooltip: {
    enabled: true,
    shared: true,
    strategy: 'follow',
  },
});

export const CustomTheme = () =>
  createStoryHost(
    buildCustomThemeConfig(),
    undefined,
    'Chart with custom theme colors demonstrating the theming system.',
  );

const buildCustomThemeConfig = (): ChartConfig => ({
  width: 760,
  height: 420,
  margin: { top: 24, right: 32, bottom: 40, left: 50 },
  localization: { locale: 'en-US', dateFormat: 'MMM dd' },
  theme: {
    colors: {
      series: ['#ec4899', '#8b5cf6', '#06b6d4'],
      background: '#ffffff',
      grid: 'rgba(236, 72, 153, 0.08)',
      axis: 'rgba(139, 92, 246, 0.2)',
      text: '#6b7280',
    },
  },
  axes: [
    { id: 'x-axis', orient: 'bottom', scale: 'time-x' },
    { id: 'y-axis', orient: 'left', scale: 'value-y' },
  ],
  series: [
    {
      type: 'line',
      id: 'series-1',
      data: generateTimeSeries(new Date('2024-01-01'), 30),
      xAccessor: (datum) => datum.x,
      yAccessor: (datum) => datum.y,
      yScale: 'value-y',
      curve: 'monotone',
      lineWidth: 3,
      marker: { show: true, radius: 4 },
    },
    {
      type: 'line',
      id: 'series-2',
      data: generateTimeSeries(new Date('2024-01-01'), 30).map(d => ({ ...d, y: d.y * 0.8 })),
      xAccessor: (datum) => datum.x,
      yAccessor: (datum) => datum.y,
      yScale: 'value-y',
      curve: 'monotone',
      lineWidth: 3,
      marker: { show: true, radius: 4 },
    },
  ],
  tooltip: {
    enabled: true,
    shared: true,
    strategy: 'follow',
  },
});

export const LargeDataset = () =>
  createStoryHost(
    buildLargeDatasetConfig(),
    undefined,
    'Chart with 500 data points demonstrating progressive rendering and smooth performance.',
  );

const buildLargeDatasetConfig = (): ChartConfig => ({
  width: 760,
  height: 420,
  margin: { top: 24, right: 32, bottom: 40, left: 50 },
  localization: { locale: 'en-US', dateFormat: 'MMM dd' },
  axes: [
    { id: 'x-axis', orient: 'bottom', scale: 'time-x' },
    { id: 'y-axis', orient: 'left', scale: 'value-y' },
  ],
  series: [
    {
      type: 'line',
      id: 'large-series',
      data: generateTimeSeries(new Date('2024-01-01'), 500),
      xAccessor: (datum) => datum.x,
      yAccessor: (datum) => datum.y,
      yScale: 'value-y',
      curve: 'linear', // Linear for better performance with large datasets
      lineWidth: 1.5,
    },
  ],
  tooltip: {
    enabled: true,
    shared: false,
    strategy: 'follow',
  },
});

export const DifferentCurves = () =>
  createStoryHost(
    buildDifferentCurvesConfig(),
    undefined,
    'Comparison of different curve interpolation methods: linear, monotone, basis, and step.',
  );

const buildDifferentCurvesConfig = (): ChartConfig => {
  const baseData = [
    { x: new Date('2024-01-01'), y: 30 },
    { x: new Date('2024-02-01'), y: 80 },
    { x: new Date('2024-03-01'), y: 45 },
    { x: new Date('2024-04-01'), y: 90 },
    { x: new Date('2024-05-01'), y: 60 },
  ];

  return {
    width: 760,
    height: 420,
    margin: { top: 24, right: 32, bottom: 40, left: 50 },
    localization: { locale: 'en-US', dateFormat: 'MMM dd' },
    axes: [
      { id: 'x-axis', orient: 'bottom', scale: 'time-x' },
      { id: 'y-axis', orient: 'left', scale: 'value-y' },
    ],
    series: [
      {
        type: 'line',
        id: 'linear',
        data: baseData,
        xAccessor: (datum) => datum.x,
        yAccessor: (datum) => datum.y,
        yScale: 'value-y',
        curve: 'linear',
        lineWidth: 2,
      },
      {
        type: 'line',
        id: 'monotone',
        data: baseData.map(d => ({ ...d, y: d.y + 20 })),
        xAccessor: (datum) => datum.x,
        yAccessor: (datum) => datum.y,
        yScale: 'value-y',
        curve: 'monotone',
        lineWidth: 2,
      },
      {
        type: 'line',
        id: 'basis',
        data: baseData.map(d => ({ ...d, y: d.y + 40 })),
        xAccessor: (datum) => datum.x,
        yAccessor: (datum) => datum.y,
        yScale: 'value-y',
        curve: 'basis',
        lineWidth: 2,
      },
      {
        type: 'line',
        id: 'step',
        data: baseData.map(d => ({ ...d, y: d.y + 60 })),
        xAccessor: (datum) => datum.x,
        yAccessor: (datum) => datum.y,
        yScale: 'value-y',
        curve: 'step',
        lineWidth: 2,
      },
    ],
    tooltip: {
      enabled: true,
      shared: true,
      strategy: 'follow',
    },
  };
};

export const MarkerVariations = () =>
  createStoryHost(
    buildMarkerVariationsConfig(),
    undefined,
    'Different marker styles and sizes demonstrating marker customization.',
  );

const buildMarkerVariationsConfig = (): ChartConfig => {
  const baseData = [
    { x: new Date('2024-01-01'), y: 40 },
    { x: new Date('2024-02-01'), y: 65 },
    { x: new Date('2024-03-01'), y: 50 },
    { x: new Date('2024-04-01'), y: 80 },
  ];

  return {
    width: 760,
    height: 420,
    margin: { top: 24, right: 32, bottom: 40, left: 50 },
    localization: { locale: 'en-US', dateFormat: 'MMM dd' },
    axes: [
      { id: 'x-axis', orient: 'bottom', scale: 'time-x' },
      { id: 'y-axis', orient: 'left', scale: 'value-y' },
    ],
    series: [
      {
        type: 'line',
        id: 'small-markers',
        data: baseData,
        xAccessor: (datum) => datum.x,
        yAccessor: (datum) => datum.y,
        yScale: 'value-y',
        curve: 'monotone',
        lineWidth: 2,
        marker: { show: true, radius: 3 },
      },
      {
        type: 'line',
        id: 'large-markers',
        data: baseData.map(d => ({ ...d, y: d.y + 30 })),
        xAccessor: (datum) => datum.x,
        yAccessor: (datum) => datum.y,
        yScale: 'value-y',
        curve: 'monotone',
        lineWidth: 2,
        marker: { show: true, radius: 6 },
      },
    ],
    tooltip: {
      enabled: true,
      shared: false,
      strategy: 'follow',
    },
  };
};

export const RealTimeUpdate = () => {
  const host = document.createElement('div');
  host.className = 'charts-core-story';
  host.style.display = 'flex';
  host.style.flexDirection = 'column';
  host.style.gap = '0.75rem';
  host.style.maxWidth = '780px';
  host.style.margin = '0 auto';
  host.style.padding = '1rem';
  host.style.background = '#f8fafc';
  host.style.borderRadius = '16px';
  host.style.boxShadow = '0 15px 40px rgba(15, 23, 42, 0.08)';

  const palette = document.createElement('div');
  palette.id = `charts-core-story-${Math.random().toString(16).slice(2)}`;
  palette.style.position = 'relative';
  palette.style.width = '100%';
  palette.style.height = '360px';
  palette.style.background = '#fff';
  palette.style.borderRadius = '12px';
  palette.style.padding = '1rem';
  palette.style.boxSizing = 'border-box';
  host.appendChild(palette);

  const note = document.createElement('p');
  note.textContent = 'Real-time data updates using updateSeries() method with smooth D3 transitions.';
  note.style.fontSize = '0.9rem';
  note.style.margin = '0';
  note.style.color = '#475467';
  host.appendChild(note);

  const controls = document.createElement('div');
  controls.style.display = 'flex';
  controls.style.gap = '0.5rem';
  
  const updateBtn = document.createElement('button');
  updateBtn.textContent = 'Update Data';
  updateBtn.style.padding = '0.5rem 1rem';
  updateBtn.style.background = '#0ea5e9';
  updateBtn.style.color = '#fff';
  updateBtn.style.border = 'none';
  updateBtn.style.borderRadius = '6px';
  updateBtn.style.cursor = 'pointer';
  updateBtn.style.fontSize = '0.875rem';
  updateBtn.style.fontWeight = '500';
  
  controls.appendChild(updateBtn);
  host.appendChild(controls);

  document.body.appendChild(host);

  const config: ChartConfig = {
    width: 760,
    height: 420,
    margin: { top: 24, right: 32, bottom: 40, left: 50 },
    localization: { locale: 'en-US', dateFormat: 'MMM dd' },
    axes: [
      { id: 'x-axis', orient: 'bottom', scale: 'time-x' },
      { id: 'y-axis', orient: 'left', scale: 'value-y' },
    ],
    series: [
      {
        type: 'line',
        id: 'live-data',
        data: generateTimeSeries(new Date('2024-01-01'), 30),
        xAccessor: (datum) => datum.x,
        yAccessor: (datum) => datum.y,
        yScale: 'value-y',
        curve: 'monotone',
        lineWidth: 2,
        marker: { show: true, radius: 4 },
        area: true,
        color: '#0ea5e9', // Explicitly set color for debugging
      },
    ],
    tooltip: {
      enabled: true,
      shared: false,
      strategy: 'follow',
    },
  };

  const chart = new ChartManager(config);
  chart.render(`#${palette.id}`);

  updateBtn.addEventListener('click', () => {
    const newData = generateTimeSeries(new Date('2024-01-01'), 30);
    chart.updateSeries('live-data', newData);
  });

  document.body.removeChild(host);
  return host;
};
