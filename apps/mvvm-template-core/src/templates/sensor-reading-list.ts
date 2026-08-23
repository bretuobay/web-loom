import { sensorReadingViewModel } from '@repo/view-models/SensorReadingViewModel';
import { defineComponent } from '@web-loom/view';
import type { AppContext } from '../app/context';
import template from './sensor-reading-list.loom';

function formatTimestamp(value: unknown): string {
  if (typeof value !== 'string' && typeof value !== 'number') return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
}

export const sensorReadingList = defineComponent<AppContext>({
  name: 'sensor-reading-list',
  template,
  setup() {
    void sensorReadingViewModel.fetchCommand.execute();
    return { formatTimestamp };
  },
});
