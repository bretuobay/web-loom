import { RestfulApiViewModel } from '@web-loom/mvvm-core';
import { type ThresholdAlertListData, ThresholdAlertListSchema, ThresholdAlertModel } from '@repo/models';

export class ThresholdAlertViewModel extends RestfulApiViewModel<
  ThresholdAlertListData,
  typeof ThresholdAlertListSchema
> {
  constructor(model: ThresholdAlertModel) {
    super(model);
    // The 'model' property is already initialized by the super() call
    // and is accessible as a protected member.
    // this.model = model; // This line is redundant and can be removed.
  }
}

const thresholdAlertModel = new ThresholdAlertModel();
export const thresholdAlertViewModel = new ThresholdAlertViewModel(thresholdAlertModel);
export type { ThresholdAlertListData };
