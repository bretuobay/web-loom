import { createRouter, createWebHistory } from 'vue-router';

const routes: Array<any> = [
  {
    path: '/',
    name: 'Dashboard',
    component: () => import('./components/Dashboard.vue'), // Lazy-loaded component
  },
  {
    path: '/greenhouses',
    name: 'GreenhouseList',
    component: () => import('./components/GreenhouseList.vue'),
  },
  {
    path: '/sensors',
    name: 'SensorList',
    component: () => import('./components/SensorList.vue'),
    props: true,
  },
  {
    path: '/sensor-readings',
    name: 'SensorReadingList',
    component: () => import('./components/SensorReadingList.vue'),
    props: true,
  },
  {
    path: '/threshold-alerts',
    name: 'ThresholdAlertList',
    component: () => import('./components/ThresholdAlertList.vue'),
  },
  {
    path: '/:pathMatch(.*)*', // Catch all other routes
    component: {
      template: `
        <div class="card">
          <h2 class="card-title">Page Not Found</h2>
          <p class="card-content">The page you are looking for does not exist.</p>
        </div>
      `,
    },
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL), // import.meta.env.BASE_URL is common for Vite projects
  routes,
});

export default router;
