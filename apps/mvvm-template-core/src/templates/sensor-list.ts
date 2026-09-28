import { sensorViewModel } from '@repo/view-models/SensorViewModel';
import { defineComponent } from '@web-loom/view';
import type { AppContext } from '../app/context';
import template from './sensor-list.loom';

export const sensorList = defineComponent<AppContext>({
  name: 'sensor-list',
  template,
  setup() {
    void sensorViewModel.fetchCommand.execute();
  },
});
