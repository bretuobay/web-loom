import type { Ref, ComputedRef } from 'vue';
import type { FormInstance, FormState, FormConfig, InferFormValues, InferFormOutput } from '@web-loom/forms-core';
import type { ZodSchema } from 'zod';

/**
 * Configuration for useForm composable
 */
export interface UseFormConfig<TSchema extends ZodSchema> extends FormConfig<TSchema> {
  /** Whether to validate on change (default: false) */
  validateOnChange?: boolean;
  /** Whether to validate on blur (default: true) */
  validateOnBlur?: boolean;
  /** Whether to validate on mount (default: false) */
  validateOnMount?: boolean;
  /** Debounce delay for change validation in ms (default: 300) */
  changeValidationDelay?: number;
}

/**
 * Return type for useForm composable
 */
export interface UseFormReturn<TSchema extends ZodSchema> {
  /** Form instance */
  form: FormInstance<InferFormValues<TSchema>>;
  /** Reactive form state */
  formState: Ref<FormState<InferFormValues<TSchema>>>;
  /** Reactive form values */
  values: ComputedRef<InferFormValues<TSchema>>;
  /** Reactive form errors */
  errors: ComputedRef<Record<string, string>>;
  /** Reactive submitting state */
  isSubmitting: ComputedRef<boolean>;
  /** Reactive valid state */
  isValid: ComputedRef<boolean>;
  /** Reactive dirty state */
  isDirty: ComputedRef<boolean>;
  /** Handle form submission */
  handleSubmit: (onSubmit: FormSubmitHandler<TSchema>) => (event?: Event) => Promise<void>;
  /** Reset form to initial values */
  reset: (values?: Partial<InferFormValues<TSchema>>) => void;
  /** Set form values */
  setValues: (values: Partial<InferFormValues<TSchema>>) => void;
  /** Validate entire form */
  validate: () => Promise<boolean>;
}

/**
 * Configuration for useField composable
 */
export interface UseFieldConfig {
  /** Whether to validate on change (default: false) */
  validateOnChange?: boolean;
  /** Whether to validate on blur (default: true) */
  validateOnBlur?: boolean;
  /** Transform value before setting */
  transform?: (value: unknown) => unknown;
  /** Format value for display */
  format?: (value: unknown) => string;
  /** Parse formatted value */
  parse?: (value: string) => unknown;
}

/**
 * Return type for useField composable
 */
export interface UseFieldReturn<TValue = unknown> {
  /** Reactive field value */
  value: Ref<TValue>;
  /** Reactive field error */
  error: Ref<string | null>;
  /** Reactive field touched state */
  touched: Ref<boolean>;
  /** Reactive field dirty state */
  dirty: Ref<boolean>;
  /** Reactive field validating state */
  validating: Ref<boolean>;
  /** Reactive field disabled state */
  disabled: Ref<boolean>;
  /** Set field value */
  setValue: (value: TValue) => void;
  /** Set field touched */
  setTouched: (touched?: boolean) => void;
  /** Set field error */
  setError: (error: string | null) => void;
  /** Validate field */
  validate: () => Promise<boolean>;
  /** Field bindings for v-model */
  bindings: ComputedRef<FieldBindings<TValue>>;
  /** Field metadata */
  meta: ComputedRef<{
    touched: boolean;
    dirty: boolean;
    error: string | null;
    validating: boolean;
    disabled: boolean;
  }>;
}

/**
 * Field bindings for v-model and event handlers
 */
export interface FieldBindings<TValue = unknown> {
  modelValue: TValue;
  'onUpdate:modelValue': (value: TValue) => void;
  onBlur: (event?: Event) => void;
  onFocus: (event?: Event) => void;
  disabled?: boolean;
}

/**
 * Return type for useFieldArray composable
 */
export interface UseFieldArrayReturn<TItem = unknown> {
  /** Reactive array field values */
  fields: ComputedRef<Array<TItem & { id: string; key: string }>>;
  /** Append item to array */
  append: (item: TItem) => void;
  /** Prepend item to array */
  prepend: (item: TItem) => void;
  /** Insert item at index */
  insert: (index: number, item: TItem) => void;
  /** Remove item at index */
  remove: (index: number) => void;
  /** Move item from one index to another */
  move: (fromIndex: number, toIndex: number) => void;
  /** Swap two items */
  swap: (indexA: number, indexB: number) => void;
  /** Replace array with new values */
  replace: (items: TItem[]) => void;
  /** Clear all items */
  clear: () => void;
}

/**
 * Form submission handler
 */
export type FormSubmitHandler<TSchema extends ZodSchema> = (
  values: InferFormOutput<TSchema>,
  form: FormInstance<InferFormValues<TSchema>>,
) => Promise<void> | void;

/**
 * Form context type
 */
export interface FormContextValue<TSchema extends ZodSchema = ZodSchema> {
  form: FormInstance<InferFormValues<TSchema>>;
  formState: Ref<FormState<InferFormValues<TSchema>>>;
}

/**
 * Props for FormProvider component
 */
export interface FormProviderProps<TSchema extends ZodSchema = ZodSchema> {
  form: FormInstance<InferFormValues<TSchema>>;
}
