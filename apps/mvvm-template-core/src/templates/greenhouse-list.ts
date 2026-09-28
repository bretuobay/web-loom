import { greenHouseViewModel, type GreenhouseData } from '@repo/view-models/GreenHouseViewModel';
import { createEntityForm } from '@web-loom/template-core';
import { defineComponent } from '@web-loom/view';
import type { AppContext } from '../app/context';
import { greenhouseItem } from './greenhouse-item';
import template from './greenhouse-list.loom';

const GREENHOUSE_SIZE_OPTIONS = [
  { value: '25sqm', label: '25sqm / Small' },
  { value: '50sqm', label: '50sqm / Medium' },
  { value: '100sqm', label: '100sqm / Large' },
] as const;

const GREENHOUSE_FORM_FIELDS = ['name', 'location', 'size', 'cropType'] as const;

export const greenhouseList = defineComponent<AppContext>({
  name: 'greenhouse-list',
  template,
  partials: { 'greenhouse-item': greenhouseItem },
  setup() {
    void greenHouseViewModel.fetchCommand.execute();
    const greenhouseForm = createEntityForm<GreenhouseData, (typeof GREENHOUSE_FORM_FIELDS)[number]>(
      greenHouseViewModel,
      GREENHOUSE_FORM_FIELDS,
      {
        fromEntity: (greenhouse) => ({
          name: greenhouse.name,
          location: greenhouse.location,
          size: GREENHOUSE_SIZE_OPTIONS.some((option) => option.value === greenhouse.size) ? greenhouse.size : '100sqm',
          cropType: greenhouse.cropType || '',
        }),
      },
    );
    return {
      greenhouseForm,
      sizeOptions: GREENHOUSE_SIZE_OPTIONS,
    };
  },
});
