import { RestfulApiModel } from 'mvvm-core';
import { ThresholdAlertListSchema, type ThresholdAlertListData } from './schemas/alert.schema';
import { fetchWithCache, nativeFetcher } from './utils/fetcher';
import { apiRegistry } from './services/services';
import { API_BASE_URL } from './config';

const { path } = apiRegistry.alert.list;

const CONFIG = {
  baseUrl: API_BASE_URL,
  endpoint: path,
  fetcher: fetchWithCache,
  schema: ThresholdAlertListSchema,
  initialData: [],
  validateSchema: false,
};

export class ThresholdAlertModel extends RestfulApiModel<ThresholdAlertListData, typeof ThresholdAlertListSchema> {
  constructor() {
    super(CONFIG);
  }

  // async fetch(id?: string | string[]): Promise<void> {
  //   console.log(`[ThresholdAlertModel] Fetching data with id: ${id}`);
  //   try {
  //     await super.fetch(id);
  //     // console.log('[ThresholdAlertModel] Data after fetch:', this.data$.getValue());
  //     const subscription = this.data$.subscribe((data) => {
  //       console.log("[ThresholdAlertModel] Data after fetch:", data);
  //       subscription.unsubscribe(); // Unsubscribe after first emission
  //     });
  //   } catch (error) {
  //     console.error("[ThresholdAlertModel] Error during fetch:", error);
  //   }
  // }
}
