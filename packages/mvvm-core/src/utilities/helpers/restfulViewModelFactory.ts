import { ZodSchema } from 'zod';
import { RestfulApiModel, TConstructorInput } from '../../models/RestfulApiModel';
import { RestfulApiViewModel } from '../../viewmodels/RestfulApiViewModel';

/**
 * Configuration interface for the ViewModel factory.
 * @template TData The type of data managed by the model.
 * @template TSchema The Zod schema for validating the data.
 */
export interface ViewModelFactoryConfig<TData, TSchema extends ZodSchema<TData>> {
  /**
   * Configuration for the RestfulApiModel.
   * Excludes 'schema' as it's provided separately in this config.
   */
  modelConfig: Omit<TConstructorInput<TData, TSchema>, 'schema'>;
  /**
   * The Zod schema for data validation.
   */
  schema: TSchema;
}

/**
 * Creates a reactive RestfulApiViewModel instance.
 * This factory simplifies the setup of a RestfulApiModel and its corresponding RestfulApiViewModel.
 *
 * @template TData The type of data the model will manage (e.g., User, User[]).
 * @template TSchema The Zod schema type for TData.
 * @param {ViewModelFactoryConfig<TData, TSchema>} factoryConfig - The configuration object for creating the model and ViewModel.
 * @returns {RestfulApiViewModel<TData, TSchema>} A new instance of RestfulApiViewModel.
 *
 * @example
 * ```typescript
 * import { z } from 'zod';
 * import { createReactiveViewModel, ViewModelFactoryConfig } from './viewModelFactory';
 * import { nativeFetcher } from '../utils/fetcher'; // Assuming a utility fetcher
 *
 * // Define schema and type
 * const UserSchema = z.object({ id: z.string(), name: z.string() });
 * type UserData = z.infer<typeof UserSchema>;
 *
 * // Configuration for the factory
 * const config: ViewModelFactoryConfig<UserData, typeof UserSchema> = {
 *   modelConfig: {
 *     baseUrl: 'https://api.example.com',
 *     endpoint: 'users',
 *     fetcher: nativeFetcher, // Your actual fetcher function
 *     initialData: null,
 *     // validateSchema: true, // Optional
 *   },
 *   schema: UserSchema,
 * };
 *
 * // Create the ViewModel
 * const userViewModel = createReactiveViewModel(config);
 *
 * // Now userViewModel can be used in your application
 * userViewModel.fetchCommand.execute();
 * userViewModel.data$.subscribe(data => console.log(data));
 * ```
 */
export function createReactiveViewModel<TData, TSchema extends ZodSchema<TData>>(
  factoryConfig: ViewModelFactoryConfig<TData, TSchema>,
): RestfulApiViewModel<TData, TSchema> {
  const { modelConfig, schema } = factoryConfig;

  // Create the RestfulApiModel instance
  const model = new RestfulApiModel<TData, TSchema>({
    ...modelConfig, // Spread all properties from modelConfig
    schema: schema, // Explicitly pass the schema
  });

  // Create the RestfulApiViewModel instance with the model
  const viewModel = new RestfulApiViewModel<TData, TSchema>(model);

  return viewModel;
}
