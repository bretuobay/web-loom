import type { ElementAction } from '@web-loom/template-core';
import { defineComponent } from '@web-loom/view';
import template from './app-frame.loom';

export const appFrame = defineComponent<{ links: ElementAction }>({
  name: 'app-frame',
  props: ['links'],
  template,
});
