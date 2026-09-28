import type { Router } from '@web-loom/router-core';
import { composeContext } from '@web-loom/template-core';
import { createLinkAction } from '@web-loom/template-core-router';
import { greenHouseViewModel } from '@repo/view-models/GreenHouseViewModel';
import { sensorViewModel } from '@repo/view-models/SensorViewModel';
import { sensorReadingViewModel } from '@repo/view-models/SensorReadingViewModel';
import { thresholdAlertViewModel } from '@repo/view-models/ThresholdAlertViewModel';

/**
 * Shared services every screen may bind: namespaced ViewModels and the
 * delegated link action. Page-owned form state, derived loading, and helpers
 * are constructed in each screen's `setup`.
 */
export function createAppContext(router: Router) {
  return composeContext(
    {
      greenHouses: greenHouseViewModel,
      sensors: sensorViewModel,
      sensorReadings: sensorReadingViewModel,
      thresholdAlerts: thresholdAlertViewModel,
    },
    {
      links: createLinkAction(router),
    },
  );
}

export type AppContext = ReturnType<typeof createAppContext>;
