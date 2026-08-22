import type { ElementAction } from '@web-loom/template-core';
import { defineComponent } from '@web-loom/view';
import template from './sensor-reading-card.loom';

export const sensorReadingCard = defineComponent<{
  count: number;
  href: string;
  renderChart: (element: Element) => ElementAction | void;
}>({
  name: 'sensor-reading-card',
  props: ['count', 'href', 'renderChart'],
  template,
});
