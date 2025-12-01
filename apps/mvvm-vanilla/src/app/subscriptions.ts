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

const app = document.getElementById('app')!;
const DASHBOARD_VIEW = 'dashboard';

function getActiveView() {
  return (router.currentRoute.meta?.view as string | undefined) ?? router.currentRoute.path;
}

export function subscribeToUpdates() {
  navigationViewModel.navigationList.items$.subscribe((navigation) => {
    console.log('Navigation data received:', navigation);
    state.navigation = navigation || [];
    renderLayout();
  });

  greenHouseViewModel.data$.subscribe((greenHouses) => {
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

  sensorViewModel.data$.subscribe((sensors) => {
    state.sensors = sensors || [];
    const view = getActiveView();
    if (view === DASHBOARD_VIEW) {
      renderCard('sensor-card-container', '/src/views/SensorCard.ejs', { sensors });
    } else if (view === 'sensors') {
      renderTemplate('/src/views/SensorList.ejs', { sensors }).then((html) => (app.innerHTML = html));
    }
  });

  sensorReadingViewModel.data$.subscribe((sensorReadings) => {
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

  thresholdAlertViewModel.data$.subscribe((thresholdAlerts) => {
    state.thresholdAlerts = thresholdAlerts || [];
    const view = getActiveView();
    if (view === DASHBOARD_VIEW) {
      renderCard('threshold-alert-card-container', '/src/views/ThresholdAlertCard.ejs', { thresholdAlerts });
    } else if (view === 'threshold-alerts') {
      renderTemplate('/src/views/ThresholdAlertList.ejs', { thresholdAlerts }).then((html) => (app.innerHTML = html));
    }
  });
}
