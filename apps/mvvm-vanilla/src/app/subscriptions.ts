import { greenHouseViewModel } from '@repo/view-models/GreenHouseViewModel';
import { sensorViewModel } from '@repo/view-models/SensorViewModel';
import { sensorReadingViewModel } from '@repo/view-models/SensorReadingViewModel';
import { thresholdAlertViewModel } from '@repo/view-models/ThresholdAlertViewModel';
import { navigationViewModel } from '@repo/shared/view-models/NavigationViewModel';

import { state } from './state';
import { renderLayout, renderCard, renderTemplate } from './ui';
import { renderSensorReadingsChart } from './chart';
import { attachGreenhouseFormListeners } from './listeners';
import { router } from './router';
import { observe } from '@web-loom/signals-core';

const app = document.getElementById('app')!;
const DASHBOARD_VIEW = 'dashboard';

function getActiveView() {
  return (router.currentRoute.meta?.view as string | undefined) ?? router.currentRoute.path;
}

export function subscribeToUpdates() {
  observe(navigationViewModel.navigationList.items$, (navigation) => {
    console.log('Navigation data received:', navigation);
    state.navigation = navigation || [];
    renderLayout();
  });

  observe(greenHouseViewModel.data$, (greenHouses) => {
    state.greenHouses = greenHouses || [];
    const view = getActiveView();
    if (view === DASHBOARD_VIEW) {
      renderCard('greenhouse-card-container', '/src/views/GreenhouseCard.ejs', { greenHouses });
    } else if (view === 'greenhouses') {
      renderTemplate('/src/views/GreenhouseList.ejs', { greenHouses }).then((html) => {
        app.innerHTML = html;
        attachGreenhouseFormListeners();
      });
    }
  });

  observe(sensorViewModel.data$, (sensors) => {
    state.sensors = sensors || [];
    const view = getActiveView();
    if (view === DASHBOARD_VIEW) {
      renderCard('sensor-card-container', '/src/views/SensorCard.ejs', { sensors });
    } else if (view === 'sensors') {
      renderTemplate('/src/views/SensorList.ejs', { sensors }).then((html) => (app.innerHTML = html));
    }
  });

  observe(sensorReadingViewModel.data$, (sensorReadings) => {
    state.sensorReadings = sensorReadings || [];
    const view = getActiveView();
    if (view === DASHBOARD_VIEW) {
      renderCard('sensor-reading-card-container', '/src/views/SensorReadingCard.ejs', { sensorReadings }).then(() => {
        renderSensorReadingsChart(sensorReadings || []);
      });
    } else if (view === 'sensor-readings') {
      renderTemplate('/src/views/SensorReadingList.ejs', { sensorReadings }).then((html) => (app.innerHTML = html));
    }
  });

  observe(thresholdAlertViewModel.data$, (thresholdAlerts) => {
    state.thresholdAlerts = thresholdAlerts || [];
    const view = getActiveView();
    if (view === DASHBOARD_VIEW) {
      renderCard('threshold-alert-card-container', '/src/views/ThresholdAlertCard.ejs', { thresholdAlerts });
    } else if (view === 'threshold-alerts') {
      renderTemplate('/src/views/ThresholdAlertList.ejs', { thresholdAlerts }).then((html) => (app.innerHTML = html));
    }
  });
}
