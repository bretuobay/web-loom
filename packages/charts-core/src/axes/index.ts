import type { AxisConfig } from '../core/types';

export class AxisRenderer {
  private axes: AxisConfig[] = [];

  add(axis: AxisConfig): void {
    if (axis.visible === false) {
      return;
    }

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
      axisNode.className = `charts-core-axis charts-core-axis-${axis.orient}`;
      axisNode.dataset.position = axis.position ?? axis.orient;
      axisNode.dataset.scale = axis.scale;
      if (axis.ticks) {
        axisNode.dataset.ticks = axis.ticks.toString();
      }

      const title = axis.title ?? axis.id;
      const orient = axis.position ?? axis.orient;
      axisNode.textContent = `${orient.toUpperCase()} • ${title}`;

      if (axis.format) {
        axisNode.title = 'Custom formatter applied';
      }

      wrapper.appendChild(axisNode);
    });

    container.appendChild(wrapper);
  }

  clear(): void {
    this.axes = [];
  }
}
