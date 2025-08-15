import '@repo/shared/styles';

// View Models
import { greenHouseViewModel } from '@repo/view-models/GreenHouseViewModel';
import { sensorViewModel } from '@repo/view-models/SensorViewModel';
import { sensorReadingViewModel } from '@repo/view-models/SensorReadingViewModel';
import { thresholdAlertViewModel } from '@repo/view-models/ThresholdAlertViewModel';

// App modules
import { initRouter } from './app/router';
import { subscribeToUpdates } from './app/subscriptions';
import { renderLayout } from './app/ui';

async function init() {
  // Subscribe to updates first to react to data changes
  subscribeToUpdates();

  // Initial layout render (will be updated when navigation data arrives)
  await renderLayout();

  // Fetch initial data
  await Promise.all([
    greenHouseViewModel.fetchCommand.execute(),
    sensorViewModel.fetchCommand.execute(),
    sensorReadingViewModel.fetchCommand.execute(),
    thresholdAlertViewModel.fetchCommand.execute(),
  ]);

  // Initialize the router
  initRouter();
}

init();
