import { describe, expect, it } from 'vitest';
import { TooltipManager } from './index';

const createPoint = () => ({ x: new Date(0), y: 42 });

describe('TooltipManager', () => {
  it('shows formatted tooltip text and follows pointer when configured', () => {
    const container = document.createElement('div');
    const manager = new TooltipManager({
      enabled: true,
      strategy: 'follow',
      format: (data) => `Series ${data.seriesId}: ${data.point.y}`,
    });

    manager.attach(container);
    manager.show({ seriesId: 'line', point: createPoint() }, { x: 5, y: 8 });

    const tooltip = container.querySelector('.charts-core-tooltip') as HTMLElement;
    expect(tooltip.textContent).toBe('Series line: 42');
    expect(tooltip.style.display).toBe('block');
    expect(tooltip.style.left).toBe('11px');
    expect(tooltip.style.top).toBe('14px');
  });

  it('falls back to fixed positioning when follow strategy is not used', () => {
    const container = document.createElement('div');
    const manager = new TooltipManager({ enabled: true, strategy: 'fixed' });

    manager.attach(container);
    manager.show({ seriesId: 'line', point: createPoint() });

    const tooltip = container.querySelector('.charts-core-tooltip') as HTMLElement;
    expect(tooltip.style.left).toBe('1rem');
    expect(tooltip.style.top).toBe('1rem');
  });

  it('does not show when tooltips are disabled', () => {
    const container = document.createElement('div');
    const manager = new TooltipManager({ enabled: false });

    manager.attach(container);
    manager.show({ seriesId: 'disabled', point: createPoint() });

    const tooltip = container.querySelector('.charts-core-tooltip') as HTMLElement;
    expect(tooltip.style.display).toBe('none');
  });
});
