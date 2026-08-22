import { withPartials } from '@web-loom/view';
import { greenhouseItem } from './greenhouse-item';
import template from './greenhouse-list.loom';

export const greenhouseListTemplate = withPartials(template, {
  'greenhouse-item': greenhouseItem,
});
