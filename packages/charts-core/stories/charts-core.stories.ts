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
      color: '#0ea5e9',
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
  createStoryHost(buildMultiSeriesConfig(), undefined, 'Two line series rendered at once to demonstrate multi-variate config-based charts.');

const buildMultiSeriesConfig = (): ChartConfig => {
  const base = buildConfig();
  return {
    ...base,
    series: [
      base.series![0],
      {
        ...base.series![0],
        color: '#f97316',
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
      color: '#38bdf8',
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
