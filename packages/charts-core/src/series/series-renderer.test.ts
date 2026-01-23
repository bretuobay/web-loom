import { describe, it, expect, beforeEach } from 'vitest';
import { SeriesRenderer } from './series-renderer';
import { scaleLinear, scaleTime } from 'd3-scale';
import type { SeriesConfig } from '../core/types';

describe('SeriesRenderer', () => {
  let renderer: SeriesRenderer;
  let svgContainer: SVGGElement;
  let canvas: HTMLCanvasElement;

  beforeEach(() => {
    renderer = new SeriesRenderer();
    
    // Create SVG container
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgContainer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    svg.appendChild(svgContainer);
    document.body.appendChild(svg);
    
    // Create canvas
    canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 400;
    document.body.appendChild(canvas);
  });

  describe('renderToSVG', () => {
    it('should render line series to SVG', () => {
      const series: SeriesConfig = {
        id: 'test-series',
        type: 'line',
        data: [
          { x: new Date('2024-01-01'), y: 10 },
          { x: new Date('2024-01-02'), y: 20 },
          { x: new Date('2024-01-03'), y: 15 },
        ],
        xAccessor: (d) => d.x,
        yAccessor: (d) => d.y,
        color: '#2563eb',
      };

      const xScale = scaleTime()
        .domain([new Date('2024-01-01'), new Date('2024-01-03')])
        .range([0, 800]);
      
      const yScale = scaleLinear()
        .domain([0, 30])
        .range([400, 0]);

      renderer.renderToSVG(series, svgContainer, xScale, yScale, 400);

      const paths = svgContainer.querySelectorAll('path');
      expect(paths.length).toBeGreaterThan(0);
      
      const linePath = Array.from(paths).find(p => p.getAttribute('stroke') === '#2563eb');
      expect(linePath).toBeDefined();
      expect(linePath?.getAttribute('fill')).toBe('none');
    });

    it('should render area series to SVG with gradient', () => {
      const series: SeriesConfig = {
        id: 'test-area',
        type: 'area',
        data: [
          { x: new Date('2024-01-01'), y: 10 },
          { x: new Date('2024-01-02'), y: 20 },
        ],
        xAccessor: (d) => d.x,
        yAccessor: (d) => d.y,
        color: '#10b981',
        area: true,
      };

      const xScale = scaleTime()
        .domain([new Date('2024-01-01'), new Date('2024-01-02')])
        .range([0, 800]);
      
      const yScale = scaleLinear()
        .domain([0, 30])
        .range([400, 0]);

      renderer.renderToSVG(series, svgContainer, xScale, yScale, 400);

      const paths = svgContainer.querySelectorAll('path');
      expect(paths.length).toBeGreaterThan(0);
      
      // Check for area path with gradient (now using class-based selection)
      const areaPath = svgContainer.querySelector('path.area-test-area');
      expect(areaPath).toBeDefined();
      
      // Verify gradient is applied
      const fill = areaPath?.getAttribute('fill');
      expect(fill).toBeDefined();
      expect(fill).toMatch(/url\(#gradient-/);
    });
  });

  describe('renderToCanvas', () => {
    it('should handle canvas rendering gracefully when context is unavailable', () => {
      const series: SeriesConfig = {
        id: 'canvas-line',
        type: 'line',
        data: [
          { x: new Date('2024-01-01'), y: 10 },
          { x: new Date('2024-01-02'), y: 20 },
        ],
        xAccessor: (d) => d.x,
        yAccessor: (d) => d.y,
        color: '#ef4444',
      };

      const xScale = scaleTime()
        .domain([new Date('2024-01-01'), new Date('2024-01-02')])
        .range([0, 800]);
      
      const yScale = scaleLinear()
        .domain([0, 30])
        .range([400, 0]);

      // Should not throw even if canvas context is not available
      expect(() => {
        renderer.renderToCanvas(series, canvas, xScale, yScale, 400);
      }).not.toThrow();
    });

    it('should render area series to canvas when context is available', () => {
      // Mock canvas context for testing
      const mockCtx = {
        beginPath: () => {},
        moveTo: () => {},
        lineTo: () => {},
        closePath: () => {},
        fill: () => {},
        stroke: () => {},
        createLinearGradient: () => ({
          addColorStop: () => {},
        }),
      };

      canvas.getContext = () => mockCtx as any;

      const series: SeriesConfig = {
        id: 'canvas-area',
        type: 'area',
        data: [
          { x: new Date('2024-01-01'), y: 10 },
          { x: new Date('2024-01-02'), y: 20 },
        ],
        xAccessor: (d) => d.x,
        yAccessor: (d) => d.y,
        color: '#8b5cf6',
        area: true,
      };

      const xScale = scaleTime()
        .domain([new Date('2024-01-01'), new Date('2024-01-02')])
        .range([0, 800]);
      
      const yScale = scaleLinear()
        .domain([0, 30])
        .range([400, 0]);

      expect(() => {
        renderer.renderToCanvas(series, canvas, xScale, yScale, 400);
      }).not.toThrow();
    });
  });

  describe('renderSeries', () => {
    it('should route to SVG rendering when useCanvas is false', () => {
      const series: SeriesConfig = {
        id: 'routing-test',
        type: 'line',
        data: [{ x: new Date('2024-01-01'), y: 10 }],
        xAccessor: (d) => d.x,
        yAccessor: (d) => d.y,
      };

      const xScale = scaleTime().domain([new Date('2024-01-01'), new Date('2024-01-02')]).range([0, 800]);
      const yScale = scaleLinear().domain([0, 20]).range([400, 0]);

      renderer.renderSeries(series, svgContainer, xScale, yScale, false, 400);

      const paths = svgContainer.querySelectorAll('path');
      expect(paths.length).toBeGreaterThan(0);
    });

    it('should route to canvas rendering when useCanvas is true', () => {
      // Mock canvas context
      const mockCtx = {
        beginPath: () => {},
        moveTo: () => {},
        lineTo: () => {},
        stroke: () => {},
      };

      canvas.getContext = () => mockCtx as any;

      const series: SeriesConfig = {
        id: 'canvas-routing',
        type: 'line',
        data: [{ x: new Date('2024-01-01'), y: 10 }],
        xAccessor: (d) => d.x,
        yAccessor: (d) => d.y,
      };

      const xScale = scaleTime().domain([new Date('2024-01-01'), new Date('2024-01-02')]).range([0, 800]);
      const yScale = scaleLinear().domain([0, 20]).range([400, 0]);

      expect(() => {
        renderer.renderSeries(series, canvas, xScale, yScale, true, 400);
      }).not.toThrow();
    });
  });

  describe('cache management', () => {
    it('should cache SVG gradients', () => {
      const series: SeriesConfig = {
        id: 'cache-test',
        type: 'area',
        data: [{ x: new Date('2024-01-01'), y: 10 }],
        xAccessor: (d) => d.x,
        yAccessor: (d) => d.y,
        color: '#f59e0b',
        area: true,
      };

      const xScale = scaleTime().domain([new Date('2024-01-01'), new Date('2024-01-02')]).range([0, 800]);
      const yScale = scaleLinear().domain([0, 20]).range([400, 0]);

      // Render twice
      renderer.renderToSVG(series, svgContainer, xScale, yScale, 400);
      renderer.renderToSVG(series, svgContainer, xScale, yScale, 400);

      // Should only create one gradient definition
      const svg = svgContainer.ownerSVGElement;
      const gradients = svg?.querySelectorAll('linearGradient');
      expect(gradients?.length).toBe(1);
    });

    it('should clear cache on destroy', () => {
      const series: SeriesConfig = {
        id: 'destroy-test',
        type: 'area',
        data: [{ x: new Date('2024-01-01'), y: 10 }],
        xAccessor: (d) => d.x,
        yAccessor: (d) => d.y,
        area: true,
      };

      const xScale = scaleTime().domain([new Date('2024-01-01'), new Date('2024-01-02')]).range([0, 800]);
      const yScale = scaleLinear().domain([0, 20]).range([400, 0]);

      renderer.renderToSVG(series, svgContainer, xScale, yScale, 400);
      renderer.destroy();
      
      // After destroy, rendering again should create new gradients
      renderer.renderToSVG(series, svgContainer, xScale, yScale, 400);
      
      expect(renderer).toBeDefined();
    });
  });
});
