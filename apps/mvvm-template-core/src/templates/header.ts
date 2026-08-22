import { defineComponent } from '@web-loom/view';
import template from './header.loom';

export interface HeaderItem {
  id: string;
  icon: string;
  label: string;
}

export const headerTemplate = defineComponent<{ items: HeaderItem[] }>({
  name: 'header',
  props: ['items'],
  template,
});
