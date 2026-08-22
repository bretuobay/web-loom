import { defineComponent } from '@web-loom/view';
import template from './greenhouse-card.loom';

export const greenhouseCard = defineComponent<{ count: number; href: string }>({
  name: 'greenhouse-card',
  props: ['count', 'href'],
  template,
});
