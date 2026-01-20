import type { AxisConfig } from '../core/types';

export class AxisRenderer {
  private axes: AxisConfig[] = [];

  add(axis: AxisConfig): void {
    this.axes.push(axis);
  }

  render(container: HTMLElement): void {
    if (!this.axes.length) {
      return;
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'charts-core-axes';
    wrapper.dataset.component = 'axes';

    this.axes.forEach((axis) => {
      const axisNode = document.createElement('div');
      axisNode.className = 'charts-core-axis';
      axisNode.textContent = `${axis.position ?? axis.orient}: ${axis.title ?? axis.id}`;
      wrapper.appendChild(axisNode);
    });

    container.appendChild(wrapper);
  }

  clear(): void {
    this.axes = [];
  }
}
