import { RestfulApiModel } from 'mvvm-core';
import { GreenhouseListSchema, type GreenhouseListData } from './schemas';
import { nativeFetcher } from './utils/fetcher';
import { apiRegistry } from './services/services';
import { API_BASE_URL } from './config';

const { path } = apiRegistry.greenhouse.list;

export const greenHouseConfig = {
  baseUrl: API_BASE_URL,
  endpoint: path,
  fetcher: nativeFetcher,
  schema: GreenhouseListSchema,
  initialData: [],
  validateSchema: false,
};

export class GreenHouseModel extends RestfulApiModel<GreenhouseListData, typeof GreenhouseListSchema> {
  constructor() {
    super(greenHouseConfig);
  }

  // Override fetch to add logging
  // async fetch(id?: string | string[]): Promise<void> {
  //   console.log(`[GreenHouseModel] Fetching data with id: ${id}`);
  //   try {
  //     // Temporarily bypass executeApiRequest to log raw response
  //     // This requires access to _isLoading$, _error$, and _data$ from BaseModel,
  //     // which might not be directly settable if they are private/protected.
  //     // For now, let's assume we can log within the fetcher or by modifying the nativeFetcher.

  //     // Alternative: Modify nativeFetcher to include logging, if possible.
  //     // For this subtask, we'll assume direct logging of response is tricky without
  //     // altering mvvm-core or having a more flexible fetcher.
  //     // Instead, we will log the data *after* it's processed by the parent fetch method.

  //     await super.fetch(id); // Call the original fetch method

  //     // Log the data after fetch completes
  //     // console.log('[GreenHouseModel] Data after fetch:', this.data$.getValue());
  //     const subscription = this.data$.subscribe((data) => {
  //       console.log("[GreenHouseModel] Data after fetch:", data);
  //       subscription.unsubscribe(); // Unsubscribe after first emission
  //     });

  //     // const latestData = (
  //     //   this.data$ as BehaviorSubject<GreenhouseListData | null>
  //     // ).getValue();
  //     // console.log("[GreenHouseModel] Data after fetch:", latestData);
  //     console.log(this._data$.getValue());
  //   } catch (error) {
  //     console.error("[GreenHouseModel] Error during fetch:", error);
  //     // Error is already set by super.fetch, but logging it here can be useful.
  //   }
  // }
}
