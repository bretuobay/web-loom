import type { ReactNode } from 'react';
import type {
  FormInstance,
  FormState,
  FieldState,
  FormConfig,
  FormPaths,
  InferFormValues,
  InferFormOutput,
} from '../../forms-core/src';
import type { ZodSchema } from 'zod';

/**
 * Configuration for useForm hook
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
 * Return type for useForm hook
 */
export interface UseFormReturn<TSchema extends ZodSchema> {
  /** Form instance */
  form: FormInstance<InferFormValues<TSchema>>;
  /** Current form state */
  formState: FormState<InferFormValues<TSchema>>;
  /** Form values */
  values: InferFormValues<TSchema>;
  /** Form errors */
  errors: Record<string, string>;
  /** Whether form is submitting */
  isSubmitting: boolean;
  /** Whether form is valid */
  isValid: boolean;
  /** Whether form is dirty */
  isDirty: boolean;
  /** Handle form submission */
  handleSubmit: (onSubmit: FormSubmitHandler<TSchema>) => (event?: React.FormEvent) => Promise<void>;
  /** Reset form to initial values */
  reset: (values?: Partial<InferFormValues<TSchema>>) => void;
  /** Set form values */
  setValues: (values: Partial<InferFormValues<TSchema>>) => void;
  /** Validate entire form */
  validate: () => Promise<boolean>;
}

/**
 * Configuration for useField hook
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
 * Return type for useField hook
 */
export interface UseFieldReturn<TValue = unknown> {
  /** Current field value */
  value: TValue;
  /** Field error message */
  error: string | null;
  /** Whether field has been touched */
  touched: boolean;
  /** Whether field is dirty */
  dirty: boolean;
  /** Whether field is validating */
  validating: boolean;
  /** Whether field is disabled */
  disabled: boolean;
  /** Change handler */
  onChange: (value: TValue) => void;
  /** Blur handler */
  onBlur: () => void;
  /** Focus handler */
  onFocus: () => void;
  /** Set field value */
  setValue: (value: TValue) => void;
  /** Set field touched */
  setTouched: (touched?: boolean) => void;
  /** Set field error */
  setError: (error: string | null) => void;
  /** Validate field */
  validate: () => Promise<boolean>;
  /** Field render props */
  field: FieldRenderProps<TValue>;
  /** Field metadata */
  meta: {
    touched: boolean;
    dirty: boolean;
    error: string | null;
    validating: boolean;
    disabled: boolean;
  };
}

/**
 * Field render props for easier integration
 */
export interface FieldRenderProps<TValue = unknown> {
  name: string;
  value: TValue;
  onChange: (event: React.ChangeEvent<HTMLInputElement> | TValue) => void;
  onBlur: (event?: React.FocusEvent) => void;
  onFocus: (event?: React.FocusEvent) => void;
  disabled?: boolean;
}

/**
 * Return type for useFieldArray hook
 */
export interface UseFieldArrayReturn<TItem = unknown> {
  /** Array field values */
  fields: Array<TItem & { id: string; key: string }>;
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
  formState: FormState<InferFormValues<TSchema>>;
}

/**
 * Props for FormProvider component
 */
export interface FormProviderProps<TSchema extends ZodSchema = ZodSchema> {
  form: FormInstance<InferFormValues<TSchema>>;
  children: ReactNode;
}
