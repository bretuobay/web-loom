import { registerPartial, unregisterPartial } from '@web-loom/template-core';
import type { Template } from '@web-loom/template-core';
import appShellTemplate from './app-shell.loom';
import dashboardTemplate from './dashboard.loom';
import footerTemplate from './footer.loom';
import { greenhouseCard } from './greenhouse-card';
import greenhouseListTemplate from './greenhouse-list.loom';
import headerTemplate from './header.loom';
import notFoundTemplate from './not-found.loom';
import { sensorCard } from './sensor-card';
import sensorListTemplate from './sensor-list.loom';
import { sensorReadingCard } from './sensor-reading-card';
import sensorReadingListTemplate from './sensor-reading-list.loom';
import { thresholdAlertCard } from './threshold-alert-card';
import thresholdAlertListTemplate from './threshold-alert-list.loom';

const composedPartials: Record<string, Template> = {
  header: headerTemplate,
  footer: footerTemplate,
  'greenhouse-card': greenhouseCard,
  'sensor-card': sensorCard,
  'sensor-reading-card': sensorReadingCard,
  'threshold-alert-card': thresholdAlertCard,
};

export function registerAppPartials(): () => void {
  for (const [name, template] of Object.entries(composedPartials)) {
    registerPartial(name, template);
  }

  let registered = true;
  return () => {
    if (!registered) return;
    registered = false;
    for (const name of Object.keys(composedPartials)) unregisterPartial(name);
  };
}

export {
  appShellTemplate,
  dashboardTemplate,
  footerTemplate,
  greenhouseCard,
  greenhouseListTemplate,
  headerTemplate,
  notFoundTemplate,
  sensorCard,
  sensorListTemplate,
  sensorReadingCard,
  sensorReadingListTemplate,
  thresholdAlertCard,
  thresholdAlertListTemplate,
};
