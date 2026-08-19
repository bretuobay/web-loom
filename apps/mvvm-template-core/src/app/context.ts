import type { Router } from '@web-loom/router-core';
import { anyLoading, composeContext, createEntityForm } from '@web-loom/template-core';
import { createLinkAction } from '@web-loom/template-core-router';
import { greenHouseViewModel, type GreenhouseData } from '@repo/view-models/GreenHouseViewModel';
import { sensorViewModel } from '@repo/view-models/SensorViewModel';
import { sensorReadingViewModel } from '@repo/view-models/SensorReadingViewModel';
import { thresholdAlertViewModel } from '@repo/view-models/ThresholdAlertViewModel';
import { navigationViewModel } from '@repo/shared/view-models/NavigationViewModel';
import { createSensorReadingsChartAction } from './chart';

const GREENHOUSE_SIZE_OPTIONS = [
  { value: '25sqm', label: '25sqm / Small' },
  { value: '50sqm', label: '50sqm / Medium' },
  { value: '100sqm', label: '100sqm / Large' },
] as const;

export type GreenhouseSizeOption = (typeof GREENHOUSE_SIZE_OPTIONS)[number];

const GREENHOUSE_FORM_FIELDS = ['name', 'location', 'size', 'cropType'] as const;

function formatTimestamp(value: unknown): string {
  if (typeof value !== 'string' && typeof value !== 'number') return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
}

/**
 * The single context every `.loom` template mounts against, assembled from
 * independently-built parts: the domain ViewModels (namespaced verbatim), the
 * derived dashboard signals, the greenhouse CRUD form, and the view-boundary
 * helpers/actions.
 */
export function createAppContext(router: Router) {
  const greenhouseForm = createEntityForm<GreenhouseData, (typeof GREENHOUSE_FORM_FIELDS)[number]>(
    greenHouseViewModel,
    GREENHOUSE_FORM_FIELDS,
    {
      fromEntity: (greenhouse) => ({
        name: greenhouse.name,
        location: greenhouse.location,
        size: GREENHOUSE_SIZE_OPTIONS.some((option) => option.value === greenhouse.size)
          ? greenhouse.size
          : '100sqm',
        cropType: greenhouse.cropType || '',
      }),
    },
  );

  return composeContext(
    {
      greenHouses: greenHouseViewModel,
      sensors: sensorViewModel,
      sensorReadings: sensorReadingViewModel,
      thresholdAlerts: thresholdAlertViewModel,
    },
    {
      navigationItems$: navigationViewModel.navigationList.items$,
      currentYear: new Date().getFullYear(),
      sizeOptions: GREENHOUSE_SIZE_OPTIONS,
      dashboardLoading$: anyLoading(
        greenHouseViewModel,
        sensorViewModel,
        sensorReadingViewModel,
        thresholdAlertViewModel,
      ),
      greenhouseForm,
      // Call-form template expressions only accept single-identifier callees,
      // so the row buttons get flat aliases of the form's bound methods.
      editGreenhouse: greenhouseForm.edit,
      deleteGreenhouse: greenhouseForm.remove,
      links: createLinkAction(router),
      renderSensorReadingsChart: createSensorReadingsChartAction(() => sensorReadingViewModel.data$),
      formatTimestamp,
    },
  );
}

export type AppContext = ReturnType<typeof createAppContext>;
