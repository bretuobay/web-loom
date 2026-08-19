import '@repo/shared/styles';
import './app.css';
import { createAppRouter } from './app/routes';
import { mountGreenhouseApp } from './app/view';

const appContainer = document.getElementById('app');
if (!appContainer) throw new Error('The application root was not found.');

const router = createAppRouter();
const mounted = mountGreenhouseApp(appContainer, router);

function dispose(): void {
  mounted.dispose();
  router.destroy();
}

if (import.meta.hot) import.meta.hot.dispose(dispose);
