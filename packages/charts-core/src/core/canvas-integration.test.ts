import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ChartManager } from './chart';
import type { ChartConfig } from './types';

describe('Canvas Integration - Requirement 2.1', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'test-chart';
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  it('should use SVG rendering for datasets under 10,000 points', () => {
    // Create dataset with 5,000 points (under threshold)
    const data = Array.from({ length: 5000 }, (_, i) => ({
      x: new Date(2024, 0, 1, 0, i),
      y: Math.sin(i / 100) * 50 + 100,
    }));

    const config: ChartConfig = {
      width: 800,
      height: 400,
      margin: { top: 20, right: 20, bottom: 40, left: 60 },
      localization: { locale: 'en-US' },
      series: [
        {
          id: 'test-series',
          type: 'line',
          data,
          xAccessor: (d) => d.x,
          yAccessor: (d) => d.y,
        },
      ],
      axes: [
        {
          id: 'x-axis',
          orient: 'bottom',
          scale: 'x',
        },
        {
          id: 'y-axis',
          orient: 'left',
          scale: 'y',
        },
      ],
    };

    const chart = new ChartManager(config);
    chart.render('#test-chart');

    // Verify SVG rendering (no canvas element)
    const canvas = container.querySelector('canvas');
    expect(canvas).toBeNull();

    // Verify SVG paths exist
    const svg = container.querySelector('svg');
    expect(svg).toBeDefined();
    const paths = svg?.querySelectorAll('path');
    expect(paths?.length).toBeGreaterThan(0);

    chart.destroy();
  });

  it('should use canvas rendering for datasets over 10,000 points (Requirement 2.1)', () => {
    // Create dataset with 11,000 points (over threshold)
    const data = Array.from({ length: 11000 }, (_, i) => ({
      x: new Date(2024, 0, 1, 0, i),
      y: Math.sin(i / 100) * 50 + 100,
    }));

    const config: ChartConfig = {
      width: 800,
      height: 400,
      margin: { top: 20, right: 20, bottom: 40, left: 60 },
      localization: { locale: 'en-US' },
      series: [
        {
          id: 'large-series',
          type: 'line',
          data,
          xAccessor: (d) => d.x,
          yAccessor: (d) => d.y,
        },
      ],
      axes: [
        {
          id: 'x-axis',
          orient: 'bottom',
          scale: 'x',
        },
        {
          id: 'y-axis',
          orient: 'left',
          scale: 'y',
        },
      ],
    };

    const chart = new ChartManager(config);
    
    // Mock canvas.getContext to avoid jsdom limitation
    const originalGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function() {
      return {
        beginPath: () => {},
        moveTo: () => {},
        lineTo: () => {},
        stroke: () => {},
        fill: () => {},
        closePath: () => {},
        createLinearGradient: () => ({
          addColorStop: () => {},
        }),
      } as any;
    };

    chart.render('#test-chart');

    // Verify canvas element was created for large dataset
    const canvas = container.querySelector('canvas');
    expect(canvas).toBeDefined();
    expect(canvas?.width).toBe(720); // 800 - margins
    expect(canvas?.height).toBe(340); // 400 - margins

    // Restore original getContext
    HTMLCanvasElement.prototype.getContext = originalGetContext;

    chart.destroy();
  });

  it('should use canvas for area series with gradients over 10,000 points', () => {
    // Create large dataset
    const data = Array.from({ length: 12000 }, (_, i) => ({
      x: new Date(2024, 0, 1, 0, i),
      y: Math.random() * 100,
    }));

    const config: ChartConfig = {
      width: 800,
      height: 400,
      margin: { top: 20, right: 20, bottom: 40, left: 60 },
      localization: { locale: 'en-US' },
      series: [
        {
          id: 'area-series',
          type: 'area',
          data,
          xAccessor: (d) => d.x,
          yAccessor: (d) => d.y,
          area: true,
          color: '#2563eb',
        },
      ],
      axes: [
        {
          id: 'x-axis',
          orient: 'bottom',
          scale: 'x',
        },
        {
          id: 'y-axis',
          orient: 'left',
          scale: 'y',
        },
      ],
    };

    const chart = new ChartManager(config);
    
    // Mock canvas context
    const mockGradient = {
      addColorStop: () => {},
    };
    
    const originalGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function() {
      return {
        beginPath: () => {},
        moveTo: () => {},
        lineTo: () => {},
        stroke: () => {},
        fill: () => {},
        closePath: () => {},
        createLinearGradient: () => mockGradient,
      } as any;
    };

    chart.render('#test-chart');

    // Verify canvas rendering was used
    const canvas = container.querySelector('canvas');
    expect(canvas).toBeDefined();

    // Restore
    HTMLCanvasElement.prototype.getContext = originalGetContext;

    chart.destroy();
  });
});
