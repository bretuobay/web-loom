import { RestfulApiViewModel } from 'mvvm-core';

import { SensorListSchema, type SensorListData, SensorModel } from '@repo/models';

export class SensorViewModel extends RestfulApiViewModel<SensorListData, typeof SensorListSchema> {
  constructor(model: SensorModel) {
    super(model);
    this.model = model;
  }
}

const sensorModel = new SensorModel();
export const sensorViewModel = new SensorViewModel(sensorModel);
export type { SensorListData };
