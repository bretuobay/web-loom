import { sensorReadingViewModel } from '@repo/view-models/SensorReadingViewModel';
import { defineComponent } from '@web-loom/view';
import { createSensorReadingsChartAction } from '../app/chart';
import template from './sensor-reading-card.loom';

export const sensorReadingCard = defineComponent<{ count: number; href: string }>({
  name: 'sensor-reading-card',
  props: ['count', 'href'],
  setup() {
    return {
      renderChart: createSensorReadingsChartAction(() => sensorReadingViewModel.data$),
    };
  },
  template,
});
