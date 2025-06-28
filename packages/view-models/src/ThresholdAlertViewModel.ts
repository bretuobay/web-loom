import { RestfulApiViewModel } from 'mvvm-core';
import { type ThresholdAlertListData, ThresholdAlertListSchema, ThresholdAlertModel } from '@repo/models';

export class ThresholdAlertViewModel extends RestfulApiViewModel<
  ThresholdAlertListData,
  typeof ThresholdAlertListSchema
> {
  constructor(model: ThresholdAlertModel) {
    super(model);
    this.model = model;
  }
}

const thresholdAlertModel = new ThresholdAlertModel();
export const thresholdAlertViewModel = new ThresholdAlertViewModel(thresholdAlertModel);
export type { ThresholdAlertListData };
