import { RestfulApiModel } from 'mvvm-core';
import { SensorReadingListSchema, type SensorReadingListData } from './schemas/sensor-reading.schema';
import { fetchWithCache } from './utils/fetcher';

import { apiRegistry } from './services/services';
import { API_BASE_URL } from './config';
const { path } = apiRegistry.reading.list;

export const sensorReadingsConfig = {
  baseUrl: API_BASE_URL,
  endpoint: path,
  fetcher: fetchWithCache,
  schema: SensorReadingListSchema,
  initialData: [] as SensorReadingListData,
  validateSchema: false,
};

export class SensorReadingModel extends RestfulApiModel<SensorReadingListData, typeof SensorReadingListSchema> {
  constructor() {
    super(sensorReadingsConfig);
  }

  // async fetch(id?: string | string[]): Promise<void> {
  //   console.log(`[SensorReadingModel] Fetching data with id: ${id}`);
  //   try {
  //     await super.fetch(id);
  //     // console.log('[SensorReadingModel] Data after fetch:', this.data$.getValue());
  //     const subscription = this.data$.subscribe((data) => {
  //       console.log("[SensorReadingModel] Data after fetch:", data);
  //       subscription.unsubscribe(); // Unsubscribe after first emission
  //     });
  //   } catch (error) {
  //     console.error("[SensorReadingModel] Error during fetch:", error);
  //   }
  // }
}
