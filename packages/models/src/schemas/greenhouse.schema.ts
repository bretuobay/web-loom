import { z } from 'zod';

export const CreateGreenhouseSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1),
  location: z.string().min(1),
  size: z.string().min(1),
  cropType: z.string().optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

export type GreenhouseData = z.infer<typeof CreateGreenhouseSchema>;

export const GreenhouseListSchema = z.array(CreateGreenhouseSchema);
export type GreenhouseListData = z.infer<typeof GreenhouseListSchema>;
