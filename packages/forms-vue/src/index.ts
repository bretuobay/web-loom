/**
 * Vue adapter for @web-loom/forms-core
 */

export { useForm } from './composables/useForm';
export { useField } from './composables/useField';
export { useFieldArray } from './composables/useFieldArray';
export { useFormErrors } from './composables/useFormErrors';
export { useFormState } from './composables/useFormState';
export { useFormSubscription } from './composables/useFormSubscription';

export type {
  UseFormConfig,
  UseFormReturn,
  UseFieldConfig,
  UseFieldReturn,
  UseFieldArrayReturn,
  FormSubmitHandler,
  FieldBindings,
} from './types';

export { FormProvider, useFormContext } from './components/FormProvider';
export type { FormProviderProps } from './components/FormProvider';
