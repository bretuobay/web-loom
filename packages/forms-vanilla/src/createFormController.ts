import type { ZodSchema } from 'zod';
import { FormController } from './FormController';
import type { FormControllerConfig, FormControllerInstance } from './types';

/**
 * Create a form controller instance
 */
export function createFormController<TSchema extends ZodSchema>(
  config: FormControllerConfig<TSchema>,
): FormControllerInstance<TSchema> {
  return new FormController(config);
}
