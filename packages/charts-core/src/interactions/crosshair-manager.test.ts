import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CrosshairManager, createDefaultCrosshairConfig, type CrosshairConfig } from './crosshair-manager';
import type { ChartDataPoint } from '../core/types';

describe('CrosshairManager', () => {
  let container: SVGGElement;
  let config: CrosshairConfig;
  let crosshairManager: CrosshairManager;

  beforeEach(() => {
    // Create a mock SVG container
    container = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    document.body.appendChild(container);
    
    config = createDefaultCrosshairConfig();
    crosshairManager = new CrosshairManager(container, config);
  });

  describe('createDefaultCrosshairConfig', () => {
    it('should create config with correct styling (1px, rgba(100, 116, 139, 0.4), dashed)', () => {
      const defaultConfig = createDefaultCrosshairConfig();
      
      expect(defaultConfig.style.strokeWidth).toBe(1);
      expect(defaultConfig.style.stroke).toBe('rgba(100, 116, 139, 0.4)');
      expect(defaultConfig.style.strokeDasharray).toBe('4 4');
      expect(defaultConfig.enabled).toBe(true);
      expect(defaultConfig.vertical).toBe(true);
      expect(defaultConfig.horizontal).toBe(true);
    });
  });

  describe('show', () => {
    it('should render vertical and horizontal crosshair lines', () => {
      const nearestPoints = new Map<string, ChartDataPoint>();
      nearestPoints.set('series1', { x: 100, y: 200 });

      crosshairManager.show(150, 250, nearestPoints);

      // Check that lines were created
      const lines = container.querySelectorAll('line');
      expect(lines.length).toBe(2);
    });

    it('should apply correct styling to crosshair lines', () => {
      const nearestPoints = new Map<string, ChartDataPoint>();
      
      crosshairManager.show(150, 250, nearestPoints);

      const lines = container.querySelectorAll('line');
      lines.forEach((line) => {
        expect(line.getAttribute('stroke')).toBe('rgba(100, 116, 139, 0.4)');
        expect(line.getAttribute('stroke-width')).toBe('1');
        expect(line.getAttribute('stroke-dasharray')).toBe('4 4');
        expect(line.getAttribute('opacity')).toBe('1');
        expect(line.getAttribute('pointer-events')).toBe('none');
      });
    });

    it('should position vertical line at correct x coordinate', () => {
      const nearestPoints = new Map<string, ChartDataPoint>();
      const x = 150;
      
      crosshairManager.show(x, 250, nearestPoints);

      const lines = container.querySelectorAll('line');
      const verticalLine = Array.from(lines).find(
        (line) => line.getAttribute('y1') === '0' && line.getAttribute('y2') === '100%'
      );

      expect(verticalLine).toBeDefined();
      expect(verticalLine?.getAttribute('x1')).toBe(`${x}`);
      expect(verticalLine?.getAttribute('x2')).toBe(`${x}`);
    });

    it('should position horizontal line at correct y coordinate', () => {
      const nearestPoints = new Map<string, ChartDataPoint>();
      const y = 250;
      
      crosshairManager.show(150, y, nearestPoints);

      const lines = container.querySelectorAll('line');
      const horizontalLine = Array.from(lines).find(
        (line) => line.getAttribute('x1') === '0' && line.getAttribute('x2') === '100%'
      );

      expect(horizontalLine).toBeDefined();
      expect(horizontalLine?.getAttribute('y1')).toBe(`${y}`);
      expect(horizontalLine?.getAttribute('y2')).toBe(`${y}`);
    });

    it('should create highlight circles for nearest points', () => {
      const nearestPoints = new Map<string, ChartDataPoint>();
      nearestPoints.set('series1', { x: 100, y: 200 });
      nearestPoints.set('series2', { x: 110, y: 210 });

      crosshairManager.show(150, 250, nearestPoints);

      const circles = container.querySelectorAll('circle');
      expect(circles.length).toBe(2);
    });

    it('should position highlight circles at point coordinates', () => {
      const nearestPoints = new Map<string, ChartDataPoint>();
      const point = { x: 100, y: 200 };
      nearestPoints.set('series1', point);

      crosshairManager.show(150, 250, nearestPoints);

      const circle = container.querySelector('circle');
      expect(circle?.getAttribute('cx')).toBe(`${point.x}`);
      expect(circle?.getAttribute('cy')).toBe(`${point.y}`);
      expect(circle?.getAttribute('opacity')).toBe('1');
    });

    it('should apply correct styling to highlight circles', () => {
      const nearestPoints = new Map<string, ChartDataPoint>();
      nearestPoints.set('series1', { x: 100, y: 200 });

      crosshairManager.show(150, 250, nearestPoints);

      const circle = container.querySelector('circle');
      expect(circle?.getAttribute('r')).toBe('6');
      expect(circle?.getAttribute('fill')).toBe('none');
      expect(circle?.getAttribute('stroke')).toBe('currentColor');
      expect(circle?.getAttribute('stroke-width')).toBe('2');
      expect(circle?.getAttribute('filter')).toBe('url(#glow-filter)');
      expect(circle?.getAttribute('pointer-events')).toBe('none');
    });
  });

  describe('hide', () => {
    it('should hide crosshair lines by setting opacity to 0', () => {
      const nearestPoints = new Map<string, ChartDataPoint>();
      
      // First show the crosshair
      crosshairManager.show(150, 250, nearestPoints);
      
      // Then hide it
      crosshairManager.hide();

      const lines = container.querySelectorAll('line');
      lines.forEach((line) => {
        expect(line.getAttribute('opacity')).toBe('0');
      });
    });

    it('should hide highlight circles by setting opacity to 0', () => {
      const nearestPoints = new Map<string, ChartDataPoint>();
      nearestPoints.set('series1', { x: 100, y: 200 });
      
      // First show the crosshair
      crosshairManager.show(150, 250, nearestPoints);
      
      // Then hide it
      crosshairManager.hide();

      const circles = container.querySelectorAll('circle');
      circles.forEach((circle) => {
        expect(circle.getAttribute('opacity')).toBe('0');
      });
    });
  });

  describe('destroy', () => {
    it('should remove all crosshair elements from DOM', () => {
      const nearestPoints = new Map<string, ChartDataPoint>();
      nearestPoints.set('series1', { x: 100, y: 200 });
      
      crosshairManager.show(150, 250, nearestPoints);
      
      expect(container.querySelectorAll('line').length).toBeGreaterThan(0);
      expect(container.querySelectorAll('circle').length).toBeGreaterThan(0);
      
      crosshairManager.destroy();
      
      expect(container.querySelectorAll('line').length).toBe(0);
      expect(container.querySelectorAll('circle').length).toBe(0);
    });
  });

  describe('configuration', () => {
    it('should respect custom stroke color', () => {
      const customConfig: CrosshairConfig = {
        ...config,
        style: {
          ...config.style,
          stroke: 'rgba(255, 0, 0, 0.5)',
        },
      };
      
      const customCrosshair = new CrosshairManager(container, customConfig);
      const nearestPoints = new Map<string, ChartDataPoint>();
      
      customCrosshair.show(150, 250, nearestPoints);

      const lines = container.querySelectorAll('line');
      lines.forEach((line) => {
        expect(line.getAttribute('stroke')).toBe('rgba(255, 0, 0, 0.5)');
      });
    });

    it('should respect custom stroke width', () => {
      const customConfig: CrosshairConfig = {
        ...config,
        style: {
          ...config.style,
          strokeWidth: 2,
        },
      };
      
      const customCrosshair = new CrosshairManager(container, customConfig);
      const nearestPoints = new Map<string, ChartDataPoint>();
      
      customCrosshair.show(150, 250, nearestPoints);

      const lines = container.querySelectorAll('line');
      lines.forEach((line) => {
        expect(line.getAttribute('stroke-width')).toBe('2');
      });
    });

    it('should respect custom dash array', () => {
      const customConfig: CrosshairConfig = {
        ...config,
        style: {
          ...config.style,
          strokeDasharray: '8 8',
        },
      };
      
      const customCrosshair = new CrosshairManager(container, customConfig);
      const nearestPoints = new Map<string, ChartDataPoint>();
      
      customCrosshair.show(150, 250, nearestPoints);

      const lines = container.querySelectorAll('line');
      lines.forEach((line) => {
        expect(line.getAttribute('stroke-dasharray')).toBe('8 8');
      });
    });
  });
});
