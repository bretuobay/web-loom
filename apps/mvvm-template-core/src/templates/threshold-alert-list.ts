import { thresholdAlertViewModel } from '@repo/view-models/ThresholdAlertViewModel';
import { defineComponent } from '@web-loom/view';
import type { AppContext } from '../app/context';
import template from './threshold-alert-list.loom';

export const thresholdAlertList = defineComponent<AppContext>({
  name: 'threshold-alert-list',
  template,
  setup() {
    void thresholdAlertViewModel.fetchCommand.execute();
  },
});
