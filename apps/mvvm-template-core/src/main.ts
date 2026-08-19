import '@repo/shared/styles';
import './app.css';
import { createApp } from './app';

const appContainer = document.getElementById('app');
if (!appContainer) throw new Error('The application root was not found.');

const app = createApp();
app.mount(appContainer);

if (import.meta.hot) import.meta.hot.dispose(() => app.unmount());
