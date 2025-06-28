import { createReactiveViewModel, type ViewModelFactoryConfig } from 'mvvm-core';

import { greenHouseConfig } from '@repo/models';
import { type GreenhouseListData, GreenhouseListSchema, GreenhouseData } from '@repo/models';

type TConfig = ViewModelFactoryConfig<GreenhouseListData, typeof GreenhouseListSchema>;

const config: TConfig = {
  modelConfig: greenHouseConfig,
  schema: GreenhouseListSchema,
};

export const greenHouseViewModel = createReactiveViewModel(config);

export type { GreenhouseListData, GreenhouseData };
