import { state } from './state';
import { renderTemplate, renderCard } from './ui';
import { renderSensorReadingsChart } from './chart';
import { attachGreenhouseFormListeners } from './listeners';

const app = document.getElementById('app')!;

async function router() {
  const path = window.location.pathname;
  switch (path) {
    case '/':
    case '/dashboard':
      app.innerHTML = await renderTemplate('/src/views/Dashboard.ejs', {});
      renderCard('greenhouse-card-container', '/src/views/GreenhouseCard.ejs', { greenHouses: state.greenHouses });
      renderCard('sensor-card-container', '/src/views/SensorCard.ejs', { sensors: state.sensors });
      renderCard('threshold-alert-card-container', '/src/views/ThresholdAlertCard.ejs', {
        thresholdAlerts: state.thresholdAlerts,
      });
      renderCard('sensor-reading-card-container', '/src/views/SensorReadingCard.ejs', {
        sensorReadings: state.sensorReadings,
      }).then(() => {
        renderSensorReadingsChart(state.sensorReadings);
      });
      break;
    case '/greenhouses':
      app.innerHTML = await renderTemplate('/src/views/GreenhouseList.ejs', { greenHouses: state.greenHouses });
      attachGreenhouseFormListeners();
      break;
    case '/sensors':
      app.innerHTML = await renderTemplate('/src/views/SensorList.ejs', { sensors: state.sensors });
      break;
    case '/sensor-readings':
      app.innerHTML = await renderTemplate('/src/views/SensorReadingList.ejs', {
        sensorReadings: state.sensorReadings,
      });
      break;
    case '/threshold-alerts':
      app.innerHTML = await renderTemplate('/src/views/ThresholdAlertList.ejs', {
        thresholdAlerts: state.thresholdAlerts,
      });
      break;
    default:
      app.innerHTML = '<h1>404 Not Found</h1>';
  }
}

export function initRouter() {
  window.addEventListener('popstate', router);

  document.body.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const anchor = target.closest('a');
    if (anchor) {
      e.preventDefault();
      const href = anchor.getAttribute('href');
      if (href) {
        history.pushState(null, '', href);
        router();
      }
    }
  });

  router();
}
