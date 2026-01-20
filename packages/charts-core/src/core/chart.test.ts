import { ChartManager, ChartPlugin } from './chart';
import type { ChartConfig } from './types';
import { describe, expect, it, vi } from 'vitest';

const createConfig = (): ChartConfig => ({
  width: 640,
  height: 420,
  margin: { top: 20, right: 20, bottom: 40, left: 50 },
  localization: { locale: 'en-US' },
  axes: [
    { id: 'x', orient: 'bottom', scale: 'x-scale' },
    { id: 'y', orient: 'left', scale: 'y-scale' },
  ],
  series: [
    {
      type: 'line',
      data: [
        { x: new Date('2020-01-01'), y: 10 },
        { x: new Date('2020-01-02'), y: 20 },
        { x: new Date('2020-01-03'), y: 18 },
      ],
      xAccessor: (point) => point.x,
      yAccessor: (point) => point.y,
      marker: { show: true },
      curve: 'monotone',
    },
  ],
  tooltip: { enabled: true, shared: false },
});

describe('ChartManager (integration)', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('renders axes and SVG content when provided a config', () => {
    const container = document.createElement('div');
    container.id = 'chart-render-test';
    container.style.width = '800px';
    container.style.height = '480px';
    document.body.appendChild(container);

    const chart = new ChartManager(createConfig());
    chart.render(`#${container.id}`);

    expect(container.querySelector('svg')).toBeTruthy();
    expect(container.querySelector('.charts-core-axes')).toBeTruthy();
    expect(container.querySelectorAll('path').length).toBeGreaterThanOrEqual(1);
    expect(chart.getScale('x-scale')).toBeDefined();

    chart.destroy();
  });

  it('notifies plugins during render and destroy', () => {
    const container = document.createElement('div');
    container.id = 'chart-plugin-test';
    document.body.appendChild(container);

    const plugin: ChartPlugin = {
      id: 'plugin-test',
      install: vi.fn(),
      uninstall: vi.fn(),
    };

    const chart = new ChartManager(createConfig());
    chart.use(plugin);
    chart.render(`#${container.id}`);

    expect(plugin.install).toHaveBeenCalledWith(chart);

    chart.destroy();
    expect(plugin.uninstall).toHaveBeenCalledWith(chart);
  });
});
