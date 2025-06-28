import { createReactiveViewModel, type ViewModelFactoryConfig } from 'mvvm-core';
import { type SensorReadingListData, SensorReadingListSchema, sensorReadingsConfig } from '@repo/models';

type TConfig = ViewModelFactoryConfig<SensorReadingListData, typeof SensorReadingListSchema>;

const config: TConfig = {
  modelConfig: sensorReadingsConfig,
  schema: SensorReadingListSchema,
};

export const sensorReadingViewModel = createReactiveViewModel(config);

export type { SensorReadingListData };
