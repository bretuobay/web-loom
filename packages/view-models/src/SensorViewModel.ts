import { RestfulApiViewModel } from '@web-loom/mvvm-core';

import { SensorListSchema, type SensorListData, SensorModel } from '@repo/models';

export class SensorViewModel extends RestfulApiViewModel<SensorListData, typeof SensorListSchema> {
  constructor(model: SensorModel) {
    super(model);
    // The 'model' property is already initialized by the super() call
    // and is accessible as a protected member.
    // this.model = model; // This line is redundant and can be removed.
  }
}

const sensorModel = new SensorModel();
export const sensorViewModel = new SensorViewModel(sensorModel);
export type { SensorListData };
