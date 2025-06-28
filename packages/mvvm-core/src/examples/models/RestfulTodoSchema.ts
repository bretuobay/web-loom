import { z } from 'zod';

/**
 * Defines the Zod schema for a single Todo item.
 * This schema is used for validating data received from the API
 * and before sending data to the API.
 */
export const RestfulTodoSchema = z.object({
  id: z.string().uuid().or(z.string().startsWith('temp_')), // Allow UUIDs or temporary IDs
  text: z.string().min(1, { message: 'Todo text cannot be empty' }),
  isCompleted: z.boolean(),
  createdAt: z.string().datetime().optional(), // Optional: ISO date string
  updatedAt: z.string().datetime().optional(), // Optional: ISO date string
});

/**
 * Defines the type for a single Todo item based on the schema.
 */
export type RestfulTodoData = z.infer<typeof RestfulTodoSchema>;

/**
 * Defines the Zod schema for an array of Todo items.
 * Useful when fetching a list of todos.
 */
export const RestfulTodoListSchema = z.array(RestfulTodoSchema);

/**
 * Defines the type for an array of Todo items based on the schema.
 */
export type RestfulTodoListData = z.infer<typeof RestfulTodoListSchema>;
