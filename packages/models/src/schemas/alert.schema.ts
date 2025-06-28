import { z } from 'zod';
import { SensorTypeEnum } from './sensor.schema';

export const CreateThresholdAlertSchema = z.object({
  id: z.string().uuid().optional(),
  sensorType: SensorTypeEnum,
  minValue: z.number(),
  maxValue: z.number(),
  greenhouseId: z.number().int().positive(),
});

export type ThresholdAlertData = z.infer<typeof CreateThresholdAlertSchema>;

export const ThresholdAlertListSchema = z.array(CreateThresholdAlertSchema);
export type ThresholdAlertListData = z.infer<typeof ThresholdAlertListSchema>;
