import type {
  FormInstance,
  FormState,
  FieldState,
  FormConfig,
  InferFormValues,
  InferFormOutput,
} from '@web-loom/forms-core';
import type { ZodSchema } from 'zod';

/**
 * Configuration for FormController
 */
export interface FormControllerConfig<TSchema extends ZodSchema> extends FormConfig<TSchema> {
  /** Root form element selector or element */
  form: string | HTMLFormElement;
  /** Whether to prevent default form submission */
  preventDefault?: boolean;
  /** Whether to validate on change (default: false) */
  validateOnChange?: boolean;
  /** Whether to validate on blur (default: true) */
  validateOnBlur?: boolean;
  /** Debounce delay for change validation in ms (default: 300) */
  changeValidationDelay?: number;
  /** Auto-bind form fields on initialization */
  autoBind?: boolean;
  /** Validation display configuration */
  validation?: ValidationDisplayConfig;
}

/**
 * Validation display configuration
 */
export interface ValidationDisplayConfig {
  /** CSS class for error state */
  errorClass?: string;
  /** CSS class for valid state */
  validClass?: string;
  /** CSS class for touched state */
  touchedClass?: string;
  /** Error message container selector pattern */
  errorSelector?: string;
  /** Whether to show errors inline */
  showInline?: boolean;
  /** Whether to clear errors on focus */
  clearOnFocus?: boolean;
}

/**
 * FormController instance
 */
export interface FormControllerInstance<TSchema extends ZodSchema> {
  /** Form instance */
  form: FormInstance<InferFormValues<TSchema>>;
  /** Form element */
  element: HTMLFormElement;
  /** Current form state */
  getState(): FormState<InferFormValues<TSchema>>;
  /** Get form values */
  getValues(): InferFormValues<TSchema>;
  /** Set form values */
  setValues(values: Partial<InferFormValues<TSchema>>): void;
  /** Reset form */
  reset(values?: Partial<InferFormValues<TSchema>>): void;
  /** Validate form */
  validate(): Promise<boolean>;
  /** Submit form */
  submit(handler?: FormSubmitHandler<TSchema>): Promise<void>;
  /** Bind field to form */
  bindField(selector: string, config?: FieldControllerConfig): FieldControllerInstance;
  /** Unbind field from form */
  unbindField(selector: string): void;
  /** Subscribe to form state changes */
  subscribe(callback: (state: FormState<InferFormValues<TSchema>>) => void): () => void;
  /** Destroy form controller */
  destroy(): void;
}

/**
 * Configuration for FieldController
 */
export interface FieldControllerConfig {
  /** Field name/path */
  name?: string;
  /** Whether to validate on change */
  validateOnChange?: boolean;
  /** Whether to validate on blur */
  validateOnBlur?: boolean;
  /** Transform value before setting */
  transform?: (value: unknown) => unknown;
  /** Format value for display */
  format?: (value: unknown) => string;
  /** Parse input value */
  parse?: (value: string) => unknown;
  /** Custom value getter */
  getValue?: (element: HTMLElement) => unknown;
  /** Custom value setter */
  setValue?: (element: HTMLElement, value: unknown) => void;
  /** Error display configuration */
  errorDisplay?: {
    /** Error container selector */
    container?: string;
    /** Error message template */
    template?: string;
    /** CSS class for error state */
    errorClass?: string;
  };
}

/**
 * FieldController instance
 */
export interface FieldControllerInstance {
  /** Field element */
  element: HTMLElement;
  /** Field name */
  name: string;
  /** Get field value */
  getValue(): unknown;
  /** Set field value */
  setValue(value: unknown): void;
  /** Get field error */
  getError(): string | null;
  /** Set field error */
  setError(error: string | null): void;
  /** Validate field */
  validate(): Promise<boolean>;
  /** Destroy field controller */
  destroy(): void;
}

/**
 * Form submit handler
 */
export type FormSubmitHandler<TSchema extends ZodSchema> = (
  values: InferFormOutput<TSchema>,
  form: FormInstance<InferFormValues<TSchema>>,
) => Promise<void> | void;

/**
 * Form binder configuration
 */
export interface FormBinderConfig {
  /** Field selector pattern */
  fieldSelector?: string;
  /** Auto-bind on initialization */
  autoBind?: boolean;
  /** Field name attribute */
  nameAttribute?: string;
  /** Validation configuration */
  validation?: ValidationDisplayConfig;
}

/**
 * Element binder interface
 */
export interface ElementBinder {
  /** Bind element to form */
  bind(element: HTMLElement, config: FieldControllerConfig): FieldControllerInstance;
  /** Unbind element */
  unbind(element: HTMLElement): void;
  /** Check if element is bound */
  isBound(element: HTMLElement): boolean;
}
