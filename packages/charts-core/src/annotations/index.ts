import type { AnnotationConfig } from '../core/types';

export class AnnotationLayer {
  private annotations: AnnotationConfig[] = [];

  add(annotation: AnnotationConfig): void {
    this.annotations.push(annotation);
  }

  render(container: HTMLElement): void {
    if (!this.annotations.length) {
      return;
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'charts-core-annotations';

    this.annotations.forEach((annotation) => {
      const annotationNode = document.createElement('div');
      annotationNode.className = 'charts-core-annotation';
      annotationNode.textContent = annotation.label ?? annotation.tooltip ?? annotation.id ?? annotation.type;
      wrapper.appendChild(annotationNode);
    });

    container.appendChild(wrapper);
  }

  clear(): void {
    this.annotations = [];
  }
}
