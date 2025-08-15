import { greenHouseViewModel } from '@repo/view-models/GreenHouseViewModel';
import { sensorViewModel } from '@repo/view-models/SensorViewModel';
import { sensorReadingViewModel } from '@repo/view-models/SensorReadingViewModel';
import { thresholdAlertViewModel } from '@repo/view-models/ThresholdAlertViewModel';
import { navigationViewModel } from '@repo/shared/view-models/NavigationViewModel';

import { state } from './state';
import { renderLayout, renderCard, renderTemplate } from './ui';
import { renderSensorReadingsChart } from './chart';
import { attachGreenhouseFormListeners } from './listeners';

const app = document.getElementById('app')!;

export function subscribeToUpdates() {
  navigationViewModel.navigationList.items$.subscribe((navigation) => {
    console.log('Navigation data received:', navigation);
    state.navigation = navigation || [];
    renderLayout();
  });

  greenHouseViewModel.data$.subscribe((greenHouses) => {
    state.greenHouses = greenHouses || [];
    const path = window.location.pathname;
    if (path === '/' || path === '/dashboard') {
      renderCard('greenhouse-card-container', '/src/views/GreenhouseCard.ejs', { greenHouses });
    } else if (path === '/greenhouses') {
      renderTemplate('/src/views/GreenhouseList.ejs', { greenHouses }).then((html) => {
        app.innerHTML = html;
        attachGreenhouseFormListeners();
      });
    }
  });

  sensorViewModel.data$.subscribe((sensors) => {
    state.sensors = sensors || [];
    const path = window.location.pathname;
    if (path === '/' || path === '/dashboard') {
      renderCard('sensor-card-container', '/src/views/SensorCard.ejs', { sensors });
    } else if (path === '/sensors') {
      renderTemplate('/src/views/SensorList.ejs', { sensors }).then((html) => (app.innerHTML = html));
    }
  });

  sensorReadingViewModel.data$.subscribe((sensorReadings) => {
    state.sensorReadings = sensorReadings || [];
    const path = window.location.pathname;
    if (path === '/' || path === '/dashboard') {
      renderCard('sensor-reading-card-container', '/src/views/SensorReadingCard.ejs', { sensorReadings }).then(() => {
        renderSensorReadingsChart(sensorReadings || []);
      });
    } else if (path === '/sensor-readings') {
      renderTemplate('/src/views/SensorReadingList.ejs', { sensorReadings }).then((html) => (app.innerHTML = html));
    }
  });

  thresholdAlertViewModel.data$.subscribe((thresholdAlerts) => {
    state.thresholdAlerts = thresholdAlerts || [];
    const path = window.location.pathname;
    if (path === '/' || path === '/dashboard') {
      renderCard('threshold-alert-card-container', '/src/views/ThresholdAlertCard.ejs', { thresholdAlerts });
    } else if (path === '/threshold-alerts') {
      renderTemplate('/src/views/ThresholdAlertList.ejs', { thresholdAlerts }).then((html) => (app.innerHTML = html));
    }
  });
}
