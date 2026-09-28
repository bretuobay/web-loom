import { greenHouseViewModel } from '@repo/view-models/GreenHouseViewModel';
import { sensorReadingViewModel } from '@repo/view-models/SensorReadingViewModel';
import { sensorViewModel } from '@repo/view-models/SensorViewModel';
import { thresholdAlertViewModel } from '@repo/view-models/ThresholdAlertViewModel';
import { anyLoading } from '@web-loom/template-core';
import { defineComponent } from '@web-loom/view';
import type { AppContext } from '../app/context';
import template from './dashboard.loom';
import { greenhouseCard } from './greenhouse-card';
import { sensorCard } from './sensor-card';
import { sensorReadingCard } from './sensor-reading-card';
import { thresholdAlertCard } from './threshold-alert-card';

export const dashboard = defineComponent<AppContext>({
  name: 'dashboard',
  template,
  partials: {
    'greenhouse-card': greenhouseCard,
    'sensor-card': sensorCard,
    'sensor-reading-card': sensorReadingCard,
    'threshold-alert-card': thresholdAlertCard,
  },
  setup() {
    void greenHouseViewModel.fetchCommand.execute();
    void sensorViewModel.fetchCommand.execute();
    void sensorReadingViewModel.fetchCommand.execute();
    void thresholdAlertViewModel.fetchCommand.execute();
    return {
      dashboardLoading$: anyLoading(
        greenHouseViewModel,
        sensorViewModel,
        sensorReadingViewModel,
        thresholdAlertViewModel,
      ),
    };
  },
});
