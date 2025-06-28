import { z } from 'zod';
import { CreateGreenhouseSchema } from './greenhouse.schema';

export const SensorTypeEnum = z.enum(['temperature', 'humidity', 'soilMoisture', 'lightIntensity']);

export const SensorStatusEnum = z.enum(['active', 'inactive']);

export const CreateSensorSchema = z.object({
  id: z.string().uuid().optional(),
  type: SensorTypeEnum,
  status: SensorStatusEnum,
  greenhouseId: z.number().int().positive(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
  greenhouse: CreateGreenhouseSchema,
});

export type SensorData = z.infer<typeof CreateSensorSchema>;

export const SensorListSchema = z.array(CreateSensorSchema);
export type SensorListData = z.infer<typeof SensorListSchema>;
