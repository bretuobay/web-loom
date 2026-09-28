import { defineComponent } from '@web-loom/view';
import template from './threshold-alert-card.loom';

export const thresholdAlertCard = defineComponent<{ count: number; href: string }>({
  name: 'threshold-alert-card',
  props: ['count', 'href'],
  template,
});
