import '@repo/shared/styles';
import './app.css';
import { GreenhouseAppViewModel } from './app/view-model';
import { GreenhouseAppView } from './app/view';

const appContainer = document.getElementById('app');
if (!appContainer) throw new Error('The application root was not found.');

const appViewModel = new GreenhouseAppViewModel();
const mountedView = new GreenhouseAppView();
const mounted = mountedView.mount(appContainer, appViewModel);

void appViewModel.start();

function dispose(): void {
  mounted.dispose();
  appViewModel.dispose();
}

if (import.meta.hot) import.meta.hot.dispose(dispose);
