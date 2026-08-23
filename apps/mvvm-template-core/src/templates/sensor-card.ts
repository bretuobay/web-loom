import { defineComponent } from '@web-loom/view';
import template from './sensor-card.loom';

export const sensorCard = defineComponent<{ count: number; href: string }>({
  name: 'sensor-card',
  props: ['count', 'href'],
  template,
});
