import { render } from 'solid-js/web';
import { Router, Route } from '@solidjs/router';
import '@repo/shared/styles';
import './index.css';
import './App.css';
import { AppLayout, Dashboard, GreenhouseList, SensorList, SensorReadingList, ThresholdAlertList } from './App';

const root = document.getElementById('root');

if (!root) {
  throw new Error('Root element #root not found');
}

render(
  () => (
    <Router root={AppLayout}>
      <Route path="/" component={Dashboard} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/greenhouses" component={GreenhouseList} />
      <Route path="/sensors" component={SensorList} />
      <Route path="/sensor-readings" component={SensorReadingList} />
      <Route path="/threshold-alerts" component={ThresholdAlertList} />
    </Router>
  ),
  root,
);
