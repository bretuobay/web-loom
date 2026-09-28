import { navigationViewModel } from '@repo/shared/view-models/NavigationViewModel';
import { defineComponent } from '@web-loom/view';
import template from './header.loom';

export const header = defineComponent({
  name: 'header',
  setup() {
    return { items: navigationViewModel.navigationList.items$ };
  },
  template,
});
