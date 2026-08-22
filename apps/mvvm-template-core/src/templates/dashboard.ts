import { withPartials } from '@web-loom/view';
import template from './dashboard.loom';
import { greenhouseCard } from './greenhouse-card';
import { sensorCard } from './sensor-card';
import { sensorReadingCard } from './sensor-reading-card';
import { thresholdAlertCard } from './threshold-alert-card';

export const dashboardTemplate = withPartials(template, {
  'greenhouse-card': greenhouseCard,
  'sensor-card': sensorCard,
  'sensor-reading-card': sensorReadingCard,
  'threshold-alert-card': thresholdAlertCard,
});
