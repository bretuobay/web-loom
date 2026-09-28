import type { GreenhouseData } from '@repo/view-models/GreenHouseViewModel';
import { defineComponent } from '@web-loom/view';
import template from './greenhouse-item.loom';

export const greenhouseItem = defineComponent<{
  item: GreenhouseData;
  onEdit: (item: GreenhouseData) => void;
  onDelete: (item: GreenhouseData) => void;
}>({
  name: 'greenhouse-item',
  props: ['item', 'onEdit', 'onDelete'],
  template,
});
