import { z } from 'zod';

export const CreateSensorReadingSchema = z.object({
  id: z.string().uuid().optional(),
  sensorId: z.number().int().positive(),
  timestamp: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid timestamp format',
  }),
  value: z.number(),
});

export type SensorReadingData = z.infer<typeof CreateSensorReadingSchema>;

export const SensorReadingListSchema = z.array(CreateSensorReadingSchema);
export type SensorReadingListData = z.infer<typeof SensorReadingListSchema>;
