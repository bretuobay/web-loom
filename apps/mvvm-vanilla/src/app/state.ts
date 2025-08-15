import type { GreenhouseListData } from '@repo/view-models/GreenHouseViewModel';
import type { SensorListData } from '@repo/view-models/SensorViewModel';
import type { SensorReadingListData } from '@repo/view-models/SensorReadingViewModel';
import type { ThresholdAlertListData } from '@repo/view-models/ThresholdAlertViewModel';

export const state = {
  greenHouses: [] as GreenhouseListData,
  sensors: [] as SensorListData,
  sensorReadings: [] as SensorReadingListData,
  thresholdAlerts: [] as ThresholdAlertListData,
  navigation: [] as any[],
};
