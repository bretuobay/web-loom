import { registerPartial, unregisterPartial } from '@web-loom/template-core';
import type { Template } from '@web-loom/template-core';
import appShellTemplate from './app-shell.loom';
import dashboardTemplate from './dashboard.loom';
import footerTemplate from './footer.loom';
import greenhouseCardTemplate from './greenhouse-card.loom';
import greenhouseListTemplate from './greenhouse-list.loom';
import headerTemplate from './header.loom';
import notFoundTemplate from './not-found.loom';
import sensorCardTemplate from './sensor-card.loom';
import sensorListTemplate from './sensor-list.loom';
import sensorReadingCardTemplate from './sensor-reading-card.loom';
import sensorReadingListTemplate from './sensor-reading-list.loom';
import thresholdAlertCardTemplate from './threshold-alert-card.loom';
import thresholdAlertListTemplate from './threshold-alert-list.loom';

const composedPartials: Record<string, Template> = {
  header: headerTemplate,
  footer: footerTemplate,
  'greenhouse-card': greenhouseCardTemplate,
  'sensor-card': sensorCardTemplate,
  'sensor-reading-card': sensorReadingCardTemplate,
  'threshold-alert-card': thresholdAlertCardTemplate,
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
  greenhouseCardTemplate,
  greenhouseListTemplate,
  headerTemplate,
  notFoundTemplate,
  sensorCardTemplate,
  sensorListTemplate,
  sensorReadingCardTemplate,
  sensorReadingListTemplate,
  thresholdAlertCardTemplate,
  thresholdAlertListTemplate,
};
