import { defineComponent } from '@web-loom/view';
import template from './footer.loom';

export const footer = defineComponent({
  name: 'footer',
  setup() {
    return { year: new Date().getFullYear() };
  },
  template,
});
