import { createRouter, type RouteDefinition, type RouteMatch } from '@web-loom/router-core';
import { state } from './state';
import { renderTemplate, renderCard } from './ui';
import { renderSensorReadingsChart } from './chart';
import { attachGreenhouseFormListeners } from './listeners';

const app = document.getElementById('app')!;

type ViewKey = 'dashboard' | 'greenhouses' | 'sensors' | 'sensor-readings' | 'threshold-alerts' | 'not-found';

const routes: RouteDefinition[] = [
  { path: '/', name: 'home', meta: { view: 'dashboard' as ViewKey } },
  { path: '/dashboard', name: 'dashboard', meta: { view: 'dashboard' as ViewKey } },
  { path: '/greenhouses', name: 'greenhouses', meta: { view: 'greenhouses' as ViewKey } },
  { path: '/sensors', name: 'sensors', meta: { view: 'sensors' as ViewKey } },
  { path: '/sensor-readings', name: 'sensor-readings', meta: { view: 'sensor-readings' as ViewKey } },
  { path: '/threshold-alerts', name: 'threshold-alerts', meta: { view: 'threshold-alerts' as ViewKey } },
  {
    path: '/:pathMatch(.*)',
    name: 'not-found',
    matchStrategy: 'prefix',
    meta: { view: 'not-found' as ViewKey },
  },
];

export const router = createRouter({
  mode: 'history',
  routes,
});

type ViewRenderer = (route: RouteMatch) => Promise<void> | void;

const viewRenderers: Record<ViewKey, ViewRenderer> = {
  dashboard: renderDashboard,
  greenhouses: renderGreenhouseList,
  sensors: renderSensorList,
  'sensor-readings': renderSensorReadingList,
  'threshold-alerts': renderThresholdAlertList,
  'not-found': renderNotFound,
};

function getViewKey(route: RouteMatch): ViewKey {
  const view = route.meta?.view as ViewKey | undefined;
  return view ?? 'not-found';
}

async function renderDashboard(_route: RouteMatch) {
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
}

async function renderGreenhouseList(_route: RouteMatch) {
  app.innerHTML = await renderTemplate('/src/views/GreenhouseList.ejs', { greenHouses: state.greenHouses });
  attachGreenhouseFormListeners();
}

async function renderSensorList(_route: RouteMatch) {
  app.innerHTML = await renderTemplate('/src/views/SensorList.ejs', { sensors: state.sensors });
}

async function renderSensorReadingList(_route: RouteMatch) {
  app.innerHTML = await renderTemplate('/src/views/SensorReadingList.ejs', { sensorReadings: state.sensorReadings });
}

async function renderThresholdAlertList(_route: RouteMatch) {
  app.innerHTML = await renderTemplate('/src/views/ThresholdAlertList.ejs', {
    thresholdAlerts: state.thresholdAlerts,
  });
}

async function renderNotFound(route: RouteMatch) {
  app.innerHTML = `<h1>404 Not Found</h1><p>No route matches "${route.fullPath}".</p>`;
}

function isModifiedClick(event: MouseEvent) {
  return (
    event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey
  );
}

function setupLinkInterception() {
  document.body.addEventListener('click', (event) => {
    if (isModifiedClick(event)) {
      return;
    }
    const target = event.target as HTMLElement;
    const anchor = target.closest('a');
    if (!anchor) {
      return;
    }
    const href = anchor.getAttribute('href');
    if (!href || href.startsWith('#') || anchor.target === '_blank' || anchor.hasAttribute('download')) {
      return;
    }
    const url = new URL(anchor.href, window.location.origin);
    if (url.origin !== window.location.origin) {
      return;
    }
    event.preventDefault();
    router.push(`${url.pathname}${url.search}`).catch((error) => {
      console.error('Navigation failed', error);
    });
  });
}

async function renderRoute(route: RouteMatch) {
  const viewKey = getViewKey(route);
  const renderer = viewRenderers[viewKey];
  await renderer(route);
}

let unsubscribe: (() => void) | null = null;
let linksInitialized = false;

export function initRouter() {
  if (!unsubscribe) {
    unsubscribe = router.subscribe((route) => {
      renderRoute(route).catch((error) => {
        console.error('Failed to render route', error);
      });
    });
  }

  if (!linksInitialized) {
    setupLinkInterception();
    linksInitialized = true;
  }

  router.onError((error) => {
    console.error('Router error', error);
  });
}
