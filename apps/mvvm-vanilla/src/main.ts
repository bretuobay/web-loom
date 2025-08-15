// apps/mvvm-vanilla/src/main.ts
import ejs from 'ejs';
import '@repo/shared/styles';

import { greenHouseViewModel } from '@repo/view-models/GreenHouseViewModel';
import { sensorViewModel } from '@repo/view-models/SensorViewModel';
import { sensorReadingViewModel } from '@repo/view-models/SensorReadingViewModel';
import { thresholdAlertViewModel } from '@repo/view-models/ThresholdAlertViewModel';
import { navigationViewModel } from '@repo/shared/view-models/NavigationViewModel';
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

import type { GreenhouseListData } from '@repo/view-models/GreenHouseViewModel';
import type { SensorListData } from '@repo/view-models/SensorViewModel';
import type { SensorReadingListData } from '@repo/view-models/SensorReadingViewModel';
import type { ThresholdAlertListData } from '@repo/view-models/ThresholdAlertViewModel';

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Title, Tooltip, Legend);

const header = document.getElementById('header')!;
const app = document.getElementById('app')!;
const footer = document.getElementById('footer')!;
let chartInstance: Chart | null = null;

// Store current values locally (like React state)
let currentGreenHouses: GreenhouseListData = [];
let currentSensors: SensorListData = [];
let currentSensorReadings: SensorReadingListData = [];
let currentThresholdAlerts: ThresholdAlertListData = [];
let currentNavigation: any[] = [];

async function renderTemplate(templatePath: string, data: object) {
  const template = await fetch(templatePath).then((res) => res.text());
  return ejs.render(template, data);
}

async function renderCard(containerId: string, templatePath: string, data: object) {
  const container = document.getElementById(containerId);
  if (container) {
    container.innerHTML = await renderTemplate(templatePath, data);
  }
}

function renderSensorReadingsChart(sensorReadings: any[]) {
  const canvasElement = document.getElementById('sensorReadingsChart') as HTMLCanvasElement | null;
  if (!canvasElement) {
    return;
  }
  const ctx = canvasElement.getContext('2d');
  if (!ctx) {
    return;
  }

  if (chartInstance) {
    chartInstance.destroy();
  }

  const chartData = {
    labels: sensorReadings.map((reading) => new Date(reading.timestamp).toLocaleTimeString()),
    datasets: [
      {
        label: 'Sensor Value',
        data: sensorReadings.map((reading) => reading.value),
        fill: false,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
      },
    ],
  };

  chartInstance = new Chart(ctx, {
    type: 'line',
    data: chartData,
  });
}

async function router() {
  const path = window.location.pathname;
  switch (path) {
    case '/':
    case '/dashboard':
      app.innerHTML = await renderTemplate('/src/views/Dashboard.ejs', {});
      renderCard('greenhouse-card-container', '/src/views/GreenhouseCard.ejs', { greenHouses: currentGreenHouses });
      renderCard('sensor-card-container', '/src/views/SensorCard.ejs', { sensors: currentSensors });
      renderCard('threshold-alert-card-container', '/src/views/ThresholdAlertCard.ejs', {
        thresholdAlerts: currentThresholdAlerts,
      });
      renderCard('sensor-reading-card-container', '/src/views/SensorReadingCard.ejs', {
        sensorReadings: currentSensorReadings,
      }).then(() => {
        renderSensorReadingsChart(currentSensorReadings);
      });
      break;
    case '/greenhouses':
      app.innerHTML = await renderTemplate('/src/views/GreenhouseList.ejs', { greenHouses: currentGreenHouses });
      attachGreenhouseFormListeners();
      break;
    case '/sensors':
      app.innerHTML = await renderTemplate('/src/views/SensorList.ejs', { sensors: currentSensors });
      break;
    case '/sensor-readings':
      app.innerHTML = await renderTemplate('/src/views/SensorReadingList.ejs', {
        sensorReadings: currentSensorReadings,
      });
      break;
    case '/threshold-alerts':
      app.innerHTML = await renderTemplate('/src/views/ThresholdAlertList.ejs', {
        thresholdAlerts: currentThresholdAlerts,
      });
      break;
    default:
      app.innerHTML = '<h1>404 Not Found</h1>';
  }
}

function attachGreenhouseFormListeners() {
  const form = document.getElementById('greenhouse-form');
  if (form) {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const formData = new FormData(event.target as HTMLFormElement);
      const name = formData.get('name') as string;
      const location = formData.get('location') as string;
      const size = formData.get('size') as string;
      const cropType = formData.get('cropType') as string;
      const data = { name, location, size, cropType };

      const existingGreenhouse = currentGreenHouses?.find((gh) => gh.name === name);
      if (existingGreenhouse) {
        greenHouseViewModel.updateCommand.execute({
          id: existingGreenhouse.id || '',
          payload: {
            ...existingGreenhouse,
            name,
            location,
            size,
            cropType,
          },
        });
      } else {
        greenHouseViewModel.createCommand.execute(data);
      }
    });
  }

  const deleteButtons = document.querySelectorAll('.button-tiny-delete');
  deleteButtons.forEach((button) => {
    button.addEventListener('click', (event) => {
      const id = (event.target as HTMLElement).dataset.id;
      if (id) {
        greenHouseViewModel.deleteCommand.execute(id);
      }
    });
  });

  const editButtons = document.querySelectorAll('.button-tiny-edit');
  editButtons.forEach((button) => {
    button.addEventListener('click', (event) => {
      const id = (event.target as HTMLElement).dataset.id;
      const greenhouse = currentGreenHouses?.find((gh) => gh.id === id);
      if (greenhouse) {
        (document.getElementById('name') as HTMLInputElement).value = greenhouse.name;
        (document.getElementById('location') as HTMLTextAreaElement).value = greenhouse.location;
        (document.getElementById('size') as HTMLSelectElement).value = greenhouse.size as string;
        (document.getElementById('cropType') as HTMLInputElement).value = greenhouse.cropType || '';
      }
    });
  });
}

function subscribeToUpdates() {
  navigationViewModel.navigationList.items$.subscribe((navigation) => {
    console.log('Navigation data received:', navigation);
    currentNavigation = navigation || [];
    // Re-render header when navigation changes
    renderLayout();
  });

  greenHouseViewModel.data$.subscribe((greenHouses) => {
    currentGreenHouses = greenHouses || []; // Update local state
    if (window.location.pathname === '/' || window.location.pathname === '/dashboard') {
      renderCard('greenhouse-card-container', '/src/views/GreenhouseCard.ejs', { greenHouses });
    } else if (window.location.pathname === '/greenhouses') {
      renderTemplate('/src/views/GreenhouseList.ejs', { greenHouses }).then((html) => {
        app.innerHTML = html;
        attachGreenhouseFormListeners();
      });
    }
  });

  sensorViewModel.data$.subscribe((sensors) => {
    currentSensors = sensors || []; // Update local state
    if (window.location.pathname === '/' || window.location.pathname === '/dashboard') {
      renderCard('sensor-card-container', '/src/views/SensorCard.ejs', { sensors });
    } else if (window.location.pathname === '/sensors') {
      renderTemplate('/src/views/SensorList.ejs', { sensors }).then((html) => (app.innerHTML = html));
    }
  });

  sensorReadingViewModel.data$.subscribe((sensorReadings) => {
    currentSensorReadings = sensorReadings || []; // Update local state
    if (window.location.pathname === '/' || window.location.pathname === '/dashboard') {
      renderCard('sensor-reading-card-container', '/src/views/SensorReadingCard.ejs', { sensorReadings }).then(() => {
        renderSensorReadingsChart(sensorReadings || []);
      });
    } else if (window.location.pathname === '/sensor-readings') {
      renderTemplate('/src/views/SensorReadingList.ejs', { sensorReadings }).then((html) => (app.innerHTML = html));
    }
  });

  thresholdAlertViewModel.data$.subscribe((thresholdAlerts) => {
    currentThresholdAlerts = thresholdAlerts || []; // Update local state
    if (window.location.pathname === '/' || window.location.pathname === '/dashboard') {
      renderCard('threshold-alert-card-container', '/src/views/ThresholdAlertCard.ejs', { thresholdAlerts });
    } else if (window.location.pathname === '/threshold-alerts') {
      renderTemplate('/src/views/ThresholdAlertList.ejs', { thresholdAlerts }).then((html) => (app.innerHTML = html));
    }
  });
}

async function renderLayout() {
  console.log('Rendering layout with navigation:', currentNavigation);
  header.innerHTML = await renderTemplate('/src/views/layout/Header.ejs', { navigation: currentNavigation });
  footer.innerHTML = await renderTemplate('/src/views/layout/Footer.ejs', {});
}

async function init() {
  // Subscribe to updates first so we can react to data changes
  subscribeToUpdates();

  // Initial layout render (will be updated when navigation data arrives)
  await renderLayout();

  await greenHouseViewModel.fetchCommand.execute();
  await sensorViewModel.fetchCommand.execute();
  await sensorReadingViewModel.fetchCommand.execute();
  await thresholdAlertViewModel.fetchCommand.execute();

  // Handle back/forward navigation
  window.addEventListener('popstate', router);

  // Initial routing
  router();

  // Handle navigation via links
  document.body.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (target.matches('a')) {
      e.preventDefault();
      history.pushState(null, '', target.getAttribute('href')!);
      router();
    }
  });
}

init();
