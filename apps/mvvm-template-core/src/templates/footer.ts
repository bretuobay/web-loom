import { defineComponent } from '@web-loom/view';
import template from './footer.loom';

export const footerTemplate = defineComponent<{ year: number }>({
  name: 'footer',
  props: ['year'],
  template,
});
